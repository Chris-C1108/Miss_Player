package cache

import "sync"

// call 封装正在执行的任务
type call struct {
	wg  sync.WaitGroup
	val interface{}
	err error
}

// Group 零外部依赖的高性能 Singleflight 请求合并器
type Group struct {
	mu sync.Mutex
	m  map[string]*call
}

func NewGroup() *Group {
	return &Group{
		m: make(map[string]*call),
	}
}

// Do 确保相同 key 的并发任务同一时刻仅有一个在真实执行
func (g *Group) Do(key string, fn func() (interface{}, error)) (interface{}, error) {
	g.mu.Lock()
	if g.m == nil {
		g.m = make(map[string]*call)
	}
	if c, ok := g.m[key]; ok {
		g.mu.Unlock()
		c.wg.Wait()
		return c.val, c.err
	}

	c := new(call)
	c.wg.Add(1)
	g.m[key] = c
	g.mu.Unlock()

	c.val, c.err = fn()
	c.wg.Done()

	g.mu.Lock()
	delete(g.m, key)
	g.mu.Unlock()

	return c.val, c.err
}
