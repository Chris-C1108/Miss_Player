# Phase 19 设计方案：流网关 (Miss Stream Gateway)

> **状态**：方案已确认（2026-11-05），待实施；设置菜单与脚本代码到 19.8 才动
> **前置决策**（2026-11-05 已与用户对齐）：
> 1. 保持一个脚本，不拆分；
> 2. 脚本只负责：宿主站识别番号 → 经 WebDAV 写入 `.strm`；
> 3. 原「外部解析服务」`services/miss-resolver` 升级为流网关，接手全部寻源、防盗链、HLS 代理工作。

---

## 0. 事实基线（2026-11-05 在 `chen@192.168.2.250` 的 Peach 容器 `longmeidao/peach:edge` 内核实）

本方案的每条约束都来自下列源码事实，不靠推测。

| # | 事实 | 出处 | 对网关的约束 |
|---|---|---|---|
| F1 | 每次播放都现场读取 `.strm`；数据库 `asset` 表只存 `path`（如 `R:\media\SSIS-001.strm`），**没有 URL 字段** | `routes_media.py:363` `strm.read_target()`；`ledger.db` DDL | 改 `.strm` 立即生效，不需要动数据库、不需要重扫 |
| F2 | `.strm` 只能有**一行**非 `#` 内容，必须是 `http/https`，不能带账号密码，不能有控制字符和 `\`；**不支持环境变量** | `strm.py: read_target / validate_url` | URL 写成什么，Peach 就连什么 |
| F3 | **浏览器不会直连 `.strm` 里的地址**。前端拿到的是 `/stream?id=…`，由 Peach 服务端去请求上游，再流式转发 | `strm_stream.proxy()` | 网关只需要 **Peach 服务端**能访问到，与用户在哪个网络无关 |
| F4 | Peach 改写 m3u8：每个 URI 先 `urljoin(上一级 URL, uri)`，再换成 `/strm-resource/{id}/{key}`；映射存在内存里，6 小时过期 | `strm_stream.rewrite_playlist` + `preview_cache.rewrite_hls` | 网关输出的子资源 URL 在 6 小时内必须**稳定、可重复请求** |
| F5 | 子资源放行规则：与 `.strm` 根地址**同 scheme+host+port** 一律放行；不同源只放行**公网 https 域名**（IP 字面量、内网地址全拒） | `allowed_hop` + `http.public_https_url / resolves_publicly` | 网关必须把**所有** URI（子清单/分片/key/init）都改写成自己的同源地址 |
| F6 | Peach 发往上游的请求头只有自己的 UA、`Accept`、`Accept-Encoding: identity`，外加透传 `Range / If-Range`。**不带 Referer**，并主动剥掉 `cookie / authorization` | `follow_stream.proxy_request_headers`；`strip_credentials=True` | Referer、Origin、Cookie 全由网关自己注入；**鉴权信息只能放在 URL 里** |
| F7 | 重定向由 Peach 逐跳校验，最多 3 跳，每跳都要通过 F5 | `open_upstream`，`MAX_PROXY_REDIRECTS = 3` | 网关**禁止** 302 跳到 CDN（不同源会被拒，而且 Peach 不带 Referer），必须自己代理 |
| F8 | 只接受 2xx（以及 416）；4xx/5xx 直接终止，不会把正文转给播放器 | `open_upstream` | 网关出错时快速返回状态码即可，不用写错误页 |
| F9 | 协议按 `.strm` URL 的**路径后缀**判断：`.m3u8` → `hls`，其余按 `range`/mp4 | `strm_stream.mime_type` | 入口路径必须以 `.m3u8` 结尾（query 不算后缀） |
| F10 | 播放列表上限 2 MiB | `PLAYLIST_LIMIT` | 2 小时 VOD 约 1,800 段，改写后约 150–250 KB，余量充足 |
| F11 | Peach 的 `httpx.Client` 没有设置超时，用 httpx 默认值：**每个阶段 5 秒** | `http.HttpxTransport.client` | 冷启动（寻源 + 拉清单）必须在 **≤ 4.5 秒**内返回响应头；分片要边收边发 |
| F12 | 容器环境变量：`HTTP(S)_PROXY=http://host.docker.internal:7890`，`NO_PROXY=localhost,127.0.0.1,peach,host.docker.internal` | `docker exec env` | 写 `192.168.2.250` 会先进 Mihomo 再绕回来；写 `host.docker.internal` 是直连 |
| F13 | Peach 只读本地挂载路径（`[media.mounts] local='/media'`），自己不接入网盘；CloudDrive2 只用于**离线下载** | `media_io.py`、`config.toml`、`downloads_clouddrive.py` | `.strm` 放在网盘时，需要由 CD2/Rclone/Alist 挂载给 Peach |
| F14 | 现有 292 个 `.strm`：280 个是 `https://missav.ai/...`、10 个 `jable.tv`、1 个 `njavtv`、1 个 `127.0.0.1` 占位，**全部是网页地址，不是可播放的流** | `/media/*.strm` 统计 | 目前这些文件不靠 Miss Player 接力就播不了，需要一次性迁移 |
| F15 | 从 NAS 经 Mihomo 请求 `https://missav.ai/dm31/STARS-256`，返回 **403 + Cloudflare「Just a moment」验证页** | NAS 上 `curl -x 192.168.2.250:7890` 实测 | MissAV 适配器必须能识别验证页并快速熔断；页面获取方式要可替换（§5.3） |

---

## 1. 目标拓扑：三个位置可以互相独立

```
 ①写入端                   ②存储端                       ③媒体中心                    ④流网关
 Miss Player  ──WebDAV──►  .strm 目录                ◄─挂载─  Peach 服务端  ──HTTP(S)──►  Miss Stream Gateway  ──►  上游 CDN
 (浏览器)                  NAS 本地 / 网盘 / 同步盘           (读 .strm, 代理播放)          (寻源/改写/注入 Referer)
                                                             ▲
                                                 浏览器/电视/Infuse 只连 Peach (F3)
```

- ②、③、④ 可以在同一台机器、同一个局域网，也可以分别在 NAS、网盘和海外 VPS。
- **唯一的连通要求**：③ Peach 服务端能访问 `.strm` 里写的 ④ 地址。
- 例外：如果有播放器绕开 Peach、直接读取 `.strm`（例如 Infuse 挂 WebDAV），那这个地址还得让该播放器也能访问。见 §8.3。

### 各角色职责（不越界）

| 角色 | 负责 | 不负责 |
|---|---|---|
| Miss Player | 识别番号；拼出 `.strm` 内容；通过 WebDAV 写入；可选通知 Peach 扫描 | 寻源、解析流、播放接力、注入 Referer |
| 存储端 | 存放约 100 B 的文本文件 | — |
| Peach | 刮削、媒体库、播放代理、观看记录 | 不知道上游 CDN 的存在 |
| 流网关 | 按番号寻源、缓存、改写 m3u8、代理分片和 key、处理过期 | 不存视频，不写 `.strm`（迁移工具除外） |

---

## 2. `.strm` URL 契约（永久稳定，写入后不再改）

```
{GATEWAY_BASE}/v1/{TOKEN}/play/{AVCODE}.m3u8
# avcode: STARS-256
# source: https://jable.tv/videos/stars-256/
# title: ...
# generator: Miss Player
# created_at: 2026-11-05T13:42:50Z
```

| 片段 | 规则 | 原因 |
|---|---|---|
| `GATEWAY_BASE` | 只写 origin：`scheme://host[:port]`，不带路径 | 方便以后统一迁移 |
| `/v1/` | 契约版本 | 以后破坏性升级走 `/v2/`，旧文件继续可用 |
| `{TOKEN}` | 放在**路径**里，不放 query | F6：Peach 会剥掉 Authorization。F4：`urljoin` 会丢掉父级的 query，放在路径里，子资源天然继承 |
| `{AVCODE}` | 大写，`[A-Z0-9-]{3,32}` | 与 `videoCode.js` 规则一致，防止路径注入 |
| `.m3u8` 结尾 | 必须 | F9：Peach 以此判定为 HLS |

`GATEWAY_BASE` 按部署方式选择（都只需要 Peach 服务端能访问到）：

| 部署方式 | 推荐写法 | 说明 |
|---|---|---|
| 与 Peach 同一台 Docker 宿主 | `http://host.docker.internal:8765` | 已实测 200；在 `NO_PROXY` 内，直连不走代理（F12） |
| 同一局域网的其他机器 | `http://192.168.x.x:8765` | 建议把这个 IP 加进 Peach 的 `NO_PROXY` |
| 外部 VPS | `https://gw.example.com` | 必须是 https 加域名；token 必填 |
| Tailscale | `http://<node>.ts.net:8765` | 无需公网暴露 |
| Cloudflare Worker | ❌ 不推荐承载分片 | CF 条款限制代理大体积视频流；可以只在 CF 前面做 TLS/WAF，回源到 VPS |

> 「同一个网关有多个地址，客户端自动选一个」的需求，按 F3 已经不再需要：用户是在内网还是外网，Peach 服务端访问网关的路径都不变。

---

## 3. 网关 API

### 3.1 播放面（给 Peach 用；全部要求路径 token）

| 方法 | 路径 | 返回 | 说明 |
|---|---|---|---|
| GET/HEAD | `/v1/{t}/play/{code}.m3u8` | `application/vnd.apple.mpegurl` | 入口。寻源，拉取上游清单，改写后返回 |
| GET/HEAD | `/v1/{t}/pl/{code}/{src}/{var}.m3u8` | 同上 | master playlist 下的子清单（多清晰度） |
| GET/HEAD | `/v1/{t}/seg/{code}/{src}/{var}/{n}.{ext}` | 原样字节流 | 分片，支持 `Range`；`ext` 保留原后缀（`ts/m4s/aac/mp4`） |
| GET | `/v1/{t}/key/{code}/{src}/{var}/{k}.key` | 16 字节 | AES-128 key，由网关带 Referer 拉取 |
| GET/HEAD | `/v1/{t}/map/{code}/{src}/{var}/{m}.mp4` | 原样 | `EXT-X-MAP` 初始化段（fMP4） |

- `{src}` 是来源 ID（`123av` / `javverse` / `jable` …）；`{var}` 是清晰度序号（单一清单为 `0`）；`{n}/{k}/{m}` 是清单内序号。
- **URL 里不出现任何上游地址**：防止 SSRF，也不把 CDN 暴露给 Peach 的日志。
- 同一个 `(code, src, var, n)` 在网关的整个生命周期内都指向同一段内容，满足 F4 对 6 小时稳定性的要求。

### 3.2 管理面（`Authorization: Bearer <ADMIN_TOKEN>`，不对 Peach 开放）

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/health` | 存活检查（不需要鉴权，不回显代理地址等内部信息） |
| GET | `/v1/admin/status/{code}` | 查看某个番号的缓存、当前来源、上次错误 |
| POST | `/v1/admin/purge/{code}` | 清掉该番号的缓存，强制重新寻源 |
| GET | `/v1/admin/sources` | 各来源的成功率、P50/P95 延迟、熔断状态 |
| GET | `/metrics` | Prometheus 文本格式 |
| GET | `/api/resolve?code=` | **保留**旧接口，仅用于诊断；不再返回 `keyHex`；需要 admin token |

---

## 4. 核心播放流程

### 4.1 入口 `/play/{code}.m3u8`（冷启动预算 ≤ 4.5 秒，F11）

```
1. 校验 token、code 格式                                         ~0 ms
2. 查 StreamCache[code]，命中且未过期 → 跳到 5
3. 寻源 Resolve(code)，总预算 3.0 s（§5）
   └─ 超时 → 504（Peach 播放失败，用户重试时多半已命中缓存）
4. 带 Referer/UA/Cookie 拉取上游 m3u8，预算 1.2 s
5. 解析清单 → 建立序号表（分片/key/map → 上游绝对 URL）
6. 按 §6 改写成同源绝对路径 → 200
```

**避免撞上 5 秒墙**：
- 持久化 `code → (src, 页面/作品 ID)` 映射，保存在磁盘 `data/catalog.json` 或 SQLite。再次寻源时跳过搜索页，只刷新 token（通常 < 800 ms）；
- 负缓存：确认全网无源的番号缓存 30 分钟，直接 404，不再重复竞速；
- 预热（可选，v1.1）：网关监听 `.strm` 目录（inotify 或定时 PROPFIND），新文件一出现就后台寻源，用户第一次点播放时已经命中缓存。

### 4.2 分片 `/seg/...`

```
1. 用序号表查到上游 URL（缓存缺失 → 按 code+src 重新寻源并重建序号表）
2. 带 Referer 和透传的 Range 请求上游；收到响应头后立即透传状态码、Content-Type、Content-Length、Content-Range、Accept-Ranges
3. 边收边写（io.Copy + 32 KB buffer + Flush），不在内存里攒整个分片（F11 的读超时按分块计算）
4. 上游返回 403/404/410 → 见 4.3
```

### 4.3 上游 token 过期时的自愈

上游签名通常 2–6 小时过期，而 Peach 对子资源键的缓存也是 6 小时（F4）。网关 URL 不含上游签名，所以**只需要网关内部换新**，Peach 那边不用动：

```
分片返回 403/410
 → 加锁（同一 code 同时只做一次刷新，singleflight）
 → 同一来源重新寻源，拿到新清单
 → 校验：分片数量一致且累计时长误差 < 1%  → 替换序号表，用同一个 n 重试一次
 → 不一致（来源换了切片方式） → 502，让用户重新打开
```

不在播放中途跨来源切换：不同来源的切片边界不同，同一个 `n` 会对应错误的时间点。跨源无缝续播留给 v2（按时间偏移重新映射）。

### 4.4 缓存（全部在网关进程内）

| 缓存 | 键 | TTL | 上限 |
|---|---|---|---|
| StreamCache | code | min(上游签名过期 − 10 min, 90 min)，无法得知时用 60 min | LRU 2,000 |
| Catalog（持久化） | code | 30 天，命中时续期 | 磁盘 |
| NegativeCache | code | 30 min | LRU 10,000 |
| KeyCache | 上游 key URL | 与 StreamCache 相同 | LRU 2,000 |
| 分片缓存 | — | v1 不做 | v2 可加磁盘 LRU，用于拖动进度时复用 |

---

## 5. 来源调度

### 5.1 适配器接口

```go
type Source interface {
    ID() string                                     // "123av"
    Resolve(ctx context.Context, code string, hint *CatalogEntry) (*Stream, error)
}
type Stream struct {
    PlaylistURL string
    Headers     http.Header   // Referer / Origin / Cookie / UA
    ExpiresAt   time.Time     // 能从签名参数解析就填，否则为零值
    Uncensored  bool
}
```

`main.go` 里现有的 `resolve123Av / resolveJavVerse / resolveJable` 直接迁成三个适配器，解析逻辑保持不变。新增第四个适配器 `missav`（§5.3）。

| 适配器 | 状态 | 加密 | 备注 |
|---|---|---|---|
| `123av` | 迁移现有代码 | 无 | 多集、三重转义已处理 |
| `javverse` | 迁移现有代码 | 无 | 需要会话 |
| `jable` | 迁移现有代码 | AES-128 | 封香港节点 |
| `missav` | **新增** | 待实测 | 页面常有 Cloudflare 验证（F15） |

### 5.2 用实测分数代替固定权重

现在固定的 100/90/50 和「AES-128 很耗 CPU」这个前提没有实测支持。hls.js 用 WebCrypto 解密，开销可以忽略；Jable 真正的成本是多一次 key 请求，以及地区封锁。改为：

```
score(src) = successRate_EWMA × (1 / p50Latency_EWMA) × bonus
bonus: 无码 ×1.2；需要额外拉 key ×0.95
```

- 并发策略不变：前两名立即启动，第三名延后 300 ms；拿到第一个**可用**结果就取消其余；
- 「可用」的定义：清单能拉到，**而且**能拿到第一个分片的响应头（HEAD 或 1 字节 Range），杜绝「解析成功、一播就 403」；
- 熔断：同一来源连续 5 次失败 → 熔断 10 分钟，之后放 1 个探测请求（半开状态）；
- 用户偏好覆盖：环境变量 `SOURCE_ORDER=javverse,123av,jable,missav` 可固定顺序。

### 5.3 MissAV 适配器

**为什么要做**：现有媒体库 96%（280/292）来自 MissAV（F14），而且 MissAV 收录面广，是重要的补充来源。

**流程**：

```
1. 页面地址：优先用 catalog 提示（迁移时从 `# origin_url:` 带入，见 §8.2）；
   没有提示时依次尝试 {domain}/cn/{code}、{domain}/{code}，再退回 {domain}/search/{code}
2. 获取页面 HTML → 交给 PageFetcher（见下）
3. 识别 Cloudflare 验证页（状态 403/503 且正文含 "Just a moment" / "cf-chl"）→ 返回 ErrChallenged
4. 提取 playlist 地址：
   a. 正则直接匹配 https://…/playlist.m3u8
   b. 匹配不到时，解包 `eval(function(p,a,c,k,e,d)…)` 混淆脚本后再匹配（Go 实现 Dean Edwards unpacker，约 60 行）
5. 返回 Stream{PlaylistURL, Headers: Origin/Referer = 页面所在域名}
```

**PageFetcher 可替换**（只用来取 HTML，**从不**经它传视频）：

| 模式 | 环境变量 | 说明 |
|---|---|---|
| `direct` | 默认 | 走 `UPSTREAM_PROXY`（Mihomo）；F15 表明目前会被拦 |
| `flaresolverr` | `MISSAV_FETCHER=flaresolverr`、`FLARESOLVERR_URL=http://…:8191` | 可选。用户自己部署 FlareSolverr；网关缓存它返回的 `cf_clearance` Cookie 和 UA，之后直接用这对凭据访问 |

**配置**：`MISSAV_DOMAINS=missav.ai,missav.ws`（按顺序尝试，域名轮换时只改环境变量）。

**熔断**：`ErrChallenged` 不计入普通失败率，直接熔断 MissAV 30 分钟，避免每次寻源都白等。冷启动预算（§4.1）内，MissAV 默认延后 300 ms 启动，不拖慢其他来源。

**分片处理**：
- 每一跳都带 `Origin` 和 `Referer`；CDN 域名加入该适配器的白名单（§7）；
- 如果分片的 `Content-Type` 是伪装的（比如 `image/*`），网关按清单里的类型改写为 `video/mp2t`，或保留扩展名对应的类型，不把错误类型透传给播放器。

**实施前先验证（19.5 第一步）**：
1. 用 FlareSolverr 或浏览器保存 3 个真实页面作为测试样本，确认 playlist 地址藏在页面的什么位置；
2. 确认 CDN 域名、是否加密、是否校验 Origin/Referer、分片后缀和 `Content-Type`；
3. 根据结果修正本节，再写代码。

---

## 6. HLS 改写规则（不引入第三方库，逐行处理）

| 上游行 | 改写为 |
|---|---|
| `#EXT-X-STREAM-INF` 下一行 URI | `/v1/{t}/pl/{code}/{src}/{i}.m3u8` |
| `#EXT-X-MEDIA:…URI="…"` | 同上，`var` 取 `a{i}` |
| `#EXTINF` 下一行 URI | `/v1/{t}/seg/{code}/{src}/{var}/{n}.{ext}` |
| `#EXT-X-KEY:METHOD=AES-128,URI="…"` | `URI="/v1/{t}/key/{code}/{src}/{var}/{k}.key"`；`IV` 原样保留 |
| `#EXT-X-MAP:URI="…"` | `URI="/v1/{t}/map/{code}/{src}/{var}/{m}.mp4"` |
| `#EXT-X-I-FRAME-STREAM-INF`、`#EXT-X-SESSION-KEY` | 同样改写，或直接删掉 |
| `METHOD=SAMPLE-AES` / `#EXT-X-CONTENT-STEERING` | 该来源判为不可用（Peach 不支持 Steering） |

- 一律输出**以 `/` 开头的绝对路径**。Peach 用 `urljoin` 解析后与根地址同源，通过 F5。
- 相对 URI 先按上游清单 URL 解析成绝对地址，再登记到序号表。
- 响应头：`Content-Type: application/vnd.apple.mpegurl`，`Cache-Control: no-store`。
- 不在网关解密。key 照常代理，由播放端 hls.js 解密，网关省 CPU，逻辑也简单。

---

## 7. 安全

| 风险 | 措施 |
|---|---|
| 公网被扫描后拿来盗刷流量 | 播放面强制路径 token（≥ 32 字节随机，常量时间比较）；`TOKENS=a,b` 支持多个同时有效，便于轮换 |
| token 随 `.strm` 进入网盘或同步盘 | token **只授权播放**，不能访问管理面；泄露后轮换并批量迁移（§8.2） |
| SSRF | URL 里只有 code 和序号，网关从不接受客户端传来的上游 URL |
| 被当作通用代理 | 上游域名白名单只包含各适配器声明的 CDN；改写清单时遇到白名单外的域名，整个来源判为失败 |
| 资源耗尽 | 每个 token 最多 8 路并发分片；每个 IP 寻源 30 次/分钟；单个分片最大 64 MB |
| 信息泄露 | `/health` 不回显代理地址；日志对 token 只记录前 4 位 |
| CORS | 播放面不需要 CORS（调用方是 Peach 服务端），默认关闭；管理面只允许配置的 origin |

---

## 8. 部署与迁移

### 8.1 同机部署（Kui-NAS 现有环境）

```yaml
services:
  miss-gateway:
    image: miss-gateway:latest
    restart: unless-stopped
    ports: ["8765:8765"]
    environment:
      PORT: "8765"
      UPSTREAM_PROXY: "http://192.168.2.250:7890"   # 网关访问上游时用的代理（Mihomo）
      TOKENS: "${MG_PLAY_TOKEN}"
      ADMIN_TOKEN: "${MG_ADMIN_TOKEN}"
      PUBLIC_BASE: "http://host.docker.internal:8765"   # 仅供迁移工具生成 URL
    volumes:
      - ./gateway-data:/data        # catalog / 指标
      # 可选：迁移或预热时需要读取 .strm 目录
      - /vol1/1000/Docker/peach/media:/strm
```

- 镜像沿用现在的做法：`CGO_ENABLED=0` 静态二进制，内置 CA 证书。
- 服务改名为 `miss-gateway`，`/api/resolve` 保留兼容。

### 8.2 迁移现有 292 个 `.strm`（F14）

网关自带一次性子命令，不新增常驻 API：

```
miss-gateway migrate --dir /strm --base http://host.docker.internal:8765 --dry-run
miss-gateway migrate --dir /strm --base http://host.docker.internal:8765
```

- 番号取自 `# avcode:` 注释，没有就从文件名取；
- 只改第一行 URL。原 URL 保留为 `# origin_url: …` 注释，`.strm` 里的 `#` 行不影响 Peach 读取（F2）；
- 原 URL 如果是 MissAV、Jable 等页面地址，同时写入网关 catalog，作为该番号的页面提示（§5.3 第 1 步），寻源时可以跳过搜索；
- 先写临时文件再 `rename`，保证原子替换；生成 `migrate-report.json`；
- 因为 F1，迁移后**无需重新扫描**，下一次播放就会生效。

### 8.3 播放器直接读取 `.strm` 的情况（不经过 Peach）

Infuse、Kodi 等直接挂 WebDAV 读取 `.strm` 时，读的是同一个地址，所以这个地址也要能让播放器访问。这种情况只能用一个两边都能访问的地址：公网 https 域名，或者 Tailscale。这属于**部署选择**，不需要额外开发。

---

## 9. Miss Player 侧的配合（19.8 实施）

### 9.1 `.strm` 写入（`StrmIngestPipeline`）

- 不再嗅探 CDN 流地址，改为按 §2 拼接 `{base}/v1/{token}/play/{CODE}.m3u8`；
- 新增两个配置项：`gatewayBase`、`gatewayToken`（替代 `mp_peach_remote_scraper`）；
- 「测试」按钮：请求 `{base}/health`，再请求 `/v1/{token}/play/{一个已知番号}.m3u8`，只确认返回 200 和 `#EXTM3U`。

> 注意：浏览器能连通，不代表 Peach 服务端能连通（例如浏览器在外网，网关写的是 `host.docker.internal`）。测试结果的文案要写明「这里只测试本机能否访问」。

### 9.2 Peach 入库的 WebDAV 目标（三种模式）

| 模式 | WebDAV 账号 | 目标目录 | 说明 |
|---|---|---|---|
| A. 复用同步配置 + 默认目录 | 复用 `SyncManager` 已有配置 | `{同步根目录}/peach-media/`（即 `/MissPlayer/peach-media/`） | 零配置。前提：Peach 宿主机能把这个目录挂载进去 |
| B. 复用同步配置 + 自定义目录 | 复用 | 用户填写，例如 `/Media/STRM/` | 适合 WebDAV 服务和 Peach 媒体目录本来就是同一块盘 |
| C. 单独配置 | 新填 URL、用户名、密码 | 用户填写 | 同步用坚果云，入库用 NAS 或 CD2/Alist 的 WebDAV |

- 仅在已有同步配置时显示 A/B；没有同步配置时只显示 C；
- 首次写入前 `PROPFIND` 检查目录，不存在就逐级 `MKCOL`，沿用 `WebDavClient` 现有逻辑；
- 坚果云等第三方同步盘有 API 频率限制：批量入库时串行执行，每次间隔 ≥ 300 ms；
- 写入成功后，如果已经配对 Peach，就调用 `POST /api/resource-sync/scan`（现有逻辑）。

### 9.3 后续删除的客户端代码（19.9 实施）

`PeachWebBridge.js` 中的寻源瀑布流、`GMHlsLoader`、`failedDomains`、HUD 流诊断、`_search*Stream`、接力按钮，以及 `@connect` 里只为它们服务的 CDN 域名。保留：Peach 配对、媒体库巡检提示、观看进度回写（如果仍然需要）。预计能把产物体积降到 1.0 MB 以下。

---

## 10. 可观测性与验收

- **黄金测试集** `services/miss-gateway/testdata/golden.txt`：20 个番号，覆盖四个来源（其中至少 3 个只有 MissAV 收录）、无码、多集、加密和不加密；
- MissAV 解析用离线页面样本做单元测试（`testdata/missav/*.html`），不依赖网络；
- `go test ./...`：用 httptest 伪造上游，覆盖清单改写、Range 透传、403 自愈、熔断、token 校验；
- **端到端测试**（NAS 上执行）：在 Peach 容器内用 httpx 依次请求入口、第一个分片、key，记录首字节时间；
- **验收线**：

| 指标 | 目标 |
|---|---|
| 冷启动入口 P95 | ≤ 4.0 s（低于 Peach 的 5 s 超时） |
| 热启动入口 P95 | ≤ 300 ms |
| 黄金集可播率 | ≥ 90% |
| 分片首字节 P95 | ≤ 1.5 s |
| 403 自愈成功率 | ≥ 95% |

- 每晚巡检：定时跑黄金集，可播率低于阈值时写入日志或告警。

---

## 11. 里程碑

| 编号 | 内容 | 产出 |
|---|---|---|
| 19.1 | 拆分 `main.go`：`internal/source/*`、`internal/hls`、`internal/cache`、`internal/server` | 行为不变的重构 + 单元测试 |
| 19.2 | 播放面 `/play`、`/seg`、`/key`、`/map`、`/pl` + 路径 token | Peach 内可播 |
| 19.3 | 缓存、catalog 持久化、403 自愈、singleflight | 长时间播放不中断 |
| 19.4 | 实测分数调度 + 熔断 + `/metrics` + 管理面 | 来源健康可见 |
| 19.5 | MissAV 适配器：先采样验证，再实现 PageFetcher、unpacker、验证页识别（§5.3） | MissAV 成为第四个来源 |
| 19.6 | `migrate` 子命令；在 NAS 上迁移 292 个文件，并把页面提示写入 catalog | 现有媒体库全部可播 |
| 19.7 | 黄金集 + 端到端测试 + 验收 | 达到 §10 指标 |
| 19.8 | Miss Player：§9.1 / §9.2 设置与写入改造 | 脚本只负责入库 |
| 19.9 | 删除客户端接力代码（§9.3），更新 `@connect` | 体积 < 1.0 MB |

---

## 12. 已确认决策（2026-11-05）

1. 服务改名为 `miss-gateway`，`/api/resolve` 降级为只用于诊断。
2. token 放在路径里（`/v1/{token}/…`），并随 `.strm` 写入存储端；token 只能用于播放。
3. v1 不做播放中途的跨来源无缝切换；来源失效时返回 502，由用户重新打开。
4. v1 只支持 HLS 来源；直连 MP4 的来源暂不接入。
5. 新增 MissAV 适配器（§5.3、19.5）。
6. AGENTS.md 已同步：脚本职责收窄为只入库；新增流网关模块；Peach 相关功能属于 Beta 实验室；「纯本地运行」条款补充自托管网关的说明。
