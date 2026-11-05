package source

import (
	"math"
	"sync"
	"time"
)

type CircuitState int

const (
	StateClosed CircuitState = iota // 正常通信
	StateOpen                        // 熔断开启 (直接拒绝)
	StateHalfOpen                    // 半开探测
)

func (s CircuitState) String() string {
	switch s {
	case StateClosed:
		return "closed"
	case StateOpen:
		return "open"
	case StateHalfOpen:
		return "half-open"
	default:
		return "unknown"
	}
}

type SourceStats struct {
	Name             string       `json:"name"`
	TotalRequests    int64        `json:"totalRequests"`
	SuccessRequests  int64        `json:"successRequests"`
	FailRequests     int64        `json:"failRequests"`
	ConsecutiveFails int          `json:"consecutiveFails"`
	CircuitState     string       `json:"circuitState"`
	CircuitOpenUntil *time.Time   `json:"circuitOpenUntil,omitempty"`
	EwmaLatencyMs    float64      `json:"ewmaLatencyMs"`
	EwmaSuccessRate  float64      `json:"ewmaSuccessRate"`
	Score            float64      `json:"score"`
	state            CircuitState
	openUntil        time.Time
}

type Tracker struct {
	mu            sync.RWMutex
	stats         map[string]*SourceStats
	failThreshold int
	cooldown      time.Duration
	decay         float64 // EWMA 平滑因子 (例如 0.2)
}

func NewTracker() *Tracker {
	return &Tracker{
		stats:         make(map[string]*SourceStats),
		failThreshold: 5,
		cooldown:      10 * time.Minute,
		decay:         0.2,
	}
}

func (t *Tracker) getOrCreate(name string) *SourceStats {
	st, exists := t.stats[name]
	if !exists {
		st = &SourceStats{
			Name:            name,
			state:           StateClosed,
			EwmaSuccessRate: 1.0, // 初始假定健康
			EwmaLatencyMs:   500, // 初始默认 500ms
		}
		t.stats[name] = st
	}
	return st
}

// CanExecute 检查来源是否可用 (熔断状态机)
func (t *Tracker) CanExecute(name string) bool {
	t.mu.Lock()
	defer t.mu.Unlock()

	st := t.getOrCreate(name)
	now := time.Now()

	switch st.state {
	case StateClosed:
		return true
	case StateOpen:
		if now.After(st.openUntil) {
			st.state = StateHalfOpen
			return true // 进入半开状态，放行单次探测
		}
		return false
	case StateHalfOpen:
		return false // 半开状态只放行一个探测，其余暂避
	default:
		return true
	}
}

// RecordSuccess 记录一次成功请求
func (t *Tracker) RecordSuccess(name string, latency time.Duration) {
	t.mu.Lock()
	defer t.mu.Unlock()

	st := t.getOrCreate(name)
	st.TotalRequests++
	st.SuccessRequests++
	st.ConsecutiveFails = 0
	st.state = StateClosed // 恢复正常闭合

	latMs := float64(latency.Milliseconds())
	if latMs <= 0 {
		latMs = 1
	}

	// 更新 EWMA 延迟与成功率
	st.EwmaLatencyMs = (t.decay * latMs) + ((1.0 - t.decay) * st.EwmaLatencyMs)
	st.EwmaSuccessRate = (t.decay * 1.0) + ((1.0 - t.decay) * st.EwmaSuccessRate)
}

// RecordFailure 记录一次失败请求
func (t *Tracker) RecordFailure(name string) {
	t.mu.Lock()
	defer t.mu.Unlock()

	st := t.getOrCreate(name)
	st.TotalRequests++
	st.FailRequests++
	st.ConsecutiveFails++

	st.EwmaSuccessRate = (t.decay * 0.0) + ((1.0 - t.decay) * st.EwmaSuccessRate)

	// 达到连续失败阈值，触发熔断
	if st.ConsecutiveFails >= t.failThreshold || st.state == StateHalfOpen {
		st.state = StateOpen
		st.openUntil = time.Now().Add(t.cooldown)
	}
}

// Score 计算实测加权得分: successRate * (1000 / latencyMs) * bonus
func (t *Tracker) Score(src Source) float64 {
	t.mu.RLock()
	defer t.mu.RUnlock()

	st, exists := t.stats[src.Name()]
	if !exists {
		return float64(src.Weight()) // 未有采样时使用初始基础权重
	}

	if st.state == StateOpen && time.Now().Before(st.openUntil) {
		return -1.0 // 熔断中直接垫底
	}

	lat := math.Max(st.EwmaLatencyMs, 50.0)
	baseScore := st.EwmaSuccessRate * (1000.0 / lat) * 100.0

	// 依据片源属性微调 Bonus
	bonus := 1.0
	name := src.Name()
	if name == "123AV" || name == "JAVVerse" {
		bonus = 1.2 // 无码/免解密加权
	} else if name == "Jable" {
		bonus = 0.95 // 加密/多拉 Key 惩罚
	}

	return baseScore * bonus
}

// Snapshot 导出全部片源指标快照
func (t *Tracker) Snapshot() []SourceStats {
	t.mu.RLock()
	defer t.mu.RUnlock()

	list := make([]SourceStats, 0, len(t.stats))
	for _, st := range t.stats {
		snap := *st
		snap.CircuitState = st.state.String()
		if st.state == StateOpen {
			until := st.openUntil
			snap.CircuitOpenUntil = &until
		}
		list = append(list, snap)
	}
	return list
}
