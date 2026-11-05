package source

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type WeightedResult struct {
	Result *StreamResult
	Weight int
}

type Manager struct {
	client  *http.Client
	sources []Source
}

func NewManager(client *http.Client, sources ...Source) *Manager {
	return &Manager{
		client:  client,
		sources: sources,
	}
}

func (m *Manager) Sources() []Source {
	return m.sources
}

func (m *Manager) Client() *http.Client {
	return m.client
}

// ResolveWeighted 执行加权优先级竞速仲裁
func (m *Manager) ResolveWeighted(ctx context.Context, code string, waitWindow time.Duration) (*StreamResult, error) {
	raceCtx, cancel := context.WithCancel(ctx)
	defer cancel()

	resultChan := make(chan WeightedResult, len(m.sources))
	var wg sync.WaitGroup

	for _, src := range m.sources {
		s := src
		wg.Add(1)
		go func() {
			defer wg.Done()

			delay := s.Delay()
			if delay > 0 {
				select {
				case <-time.After(delay):
				case <-raceCtx.Done():
					return
				}
			}

			if res, err := s.Resolve(raceCtx, m.client, code); err == nil && res != nil && res.URL != "" {
				select {
				case resultChan <- WeightedResult{Result: res, Weight: s.Weight()}:
				case <-raceCtx.Done():
				}
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
