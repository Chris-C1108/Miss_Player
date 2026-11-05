package source

import (
	"context"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"
)

type WeightedResult struct {
	Result *StreamResult
	Weight int
	Source Source
}

type Manager struct {
	client     *http.Client
	sources    []Source
	tracker    *Tracker
	fixedOrder []string
}

func NewManager(client *http.Client, sources ...Source) *Manager {
	return &Manager{
		client:  client,
		sources: sources,
		tracker: NewTracker(),
	}
}

func (m *Manager) Sources() []Source {
	return m.sources
}

func (m *Manager) Client() *http.Client {
	return m.client
}

func (m *Manager) Tracker() *Tracker {
	return m.tracker
}

func (m *Manager) SetFixedOrder(order []string) {
	m.fixedOrder = order
}

// getOrderedSources 依据实测动态得分或固定配置排序候选源
func (m *Manager) getOrderedSources() []Source {
	ordered := make([]Source, len(m.sources))
	copy(ordered, m.sources)

	// 若配置了强制固定顺序，按指定规则排序
	if len(m.fixedOrder) > 0 {
		orderMap := make(map[string]int)
		for idx, name := range m.fixedOrder {
			orderMap[strings.ToLower(name)] = idx
		}

		sort.SliceStable(ordered, func(i, j int) bool {
			oi, oki := orderMap[strings.ToLower(ordered[i].Name())]
			oj, okj := orderMap[strings.ToLower(ordered[j].Name())]
			if oki && okj {
				return oi < oj
			}
			if oki {
				return true
			}
			if okj {
				return false
			}
			return ordered[i].Weight() > ordered[j].Weight()
		})
		return ordered
	}

	// 否则按 EWMA 实测分数降序排列
	sort.SliceStable(ordered, func(i, j int) bool {
		return m.tracker.Score(ordered[i]) > m.tracker.Score(ordered[j])
	})
	return ordered
}

// ResolveWeighted 执行基于实测动态得分与熔断保护的加权竞速
func (m *Manager) ResolveWeighted(ctx context.Context, code string, waitWindow time.Duration) (*StreamResult, error) {
	raceCtx, cancel := context.WithCancel(ctx)
	defer cancel()

	orderedSources := m.getOrderedSources()
	resultChan := make(chan WeightedResult, len(orderedSources))
	var wg sync.WaitGroup

	for rank, src := range orderedSources {
		s := src
		// 检查熔断状态，已熔断源直接跳过
		if !m.tracker.CanExecute(s.Name()) {
			continue
		}

		wg.Add(1)
		// 前 2 名即刻启动，第 3 名及以后延后 300ms 错峰启动
		var delay time.Duration
		if rank >= 2 {
			delay = 300 * time.Millisecond
		}

		go func() {
			defer wg.Done()

			if delay > 0 {
				select {
				case <-time.After(delay):
				case <-raceCtx.Done():
					return
				}
			}

			tStart := time.Now()
			res, err := s.Resolve(raceCtx, m.client, code)
			elapsed := time.Since(tStart)

			if err == nil && res != nil && res.URL != "" {
				m.tracker.RecordSuccess(s.Name(), elapsed)
				select {
				case resultChan <- WeightedResult{Result: res, Weight: s.Weight(), Source: s}:
				case <-raceCtx.Done():
				}
			} else {
				m.tracker.RecordFailure(s.Name())
			}
		}()
	}

	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(resultChan)
		close(done)
	}()

	var bestResult *StreamResult
	bestWeight := 0

	timer := time.NewTimer(waitWindow)
	defer timer.Stop()

	running := true
	for running {
		select {
		case wr, ok := <-resultChan:
			if !ok {
				running = false
				break
			}
			if wr.Result != nil && wr.Weight > bestWeight {
				bestResult = wr.Result
				bestWeight = wr.Weight
				if bestWeight >= 100 {
					cancel()
					running = false
					break
				}
			}
		case <-timer.C:
			if bestResult != nil {
				cancel()
				running = false
				break
			}
		case <-done:
			running = false
			break
		case <-ctx.Done():
			running = false
			break
		}
	}

	if bestResult != nil {
		return bestResult, nil
	}

	return nil, fmt.Errorf("所有外部源均未能解析到有效流")
}
