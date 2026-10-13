# GOV-02 真实订阅资源释放与超时

日期：2026-10-13。基线：main `de414fa1`，已包含治理 PR #794 和其他窗口的 #795。
工作分支：`fix/governance-revision-resource-lifecycle-20261013`。

## 范围与选择

检查 `manager/evo-runtime-revision-bridge.ts` 后发现：已有服务按订阅启动轮询、空闲时停止定时器，但没有取消在途 HTTP 请求，也没有请求超时。选择该只读修订订阅桥验证真实资源生命周期，无需生产数据库、凭据或线上部署。

这是现有宿主订阅桥的资源治理，不是新增独立插件，也不是把桥改成通用Provider。本轮没有改动EVO业务算法、Agent、BEX、2D Designer或账本。

## 已实现

- 没有订阅时不创建轮询定时器、不发送请求。
- 最后一个企业订阅解除时，取消该企业在途请求并删除ETag缓存；其他企业订阅继续有效。
- 相同订阅键采用引用计数，某一个持有者解除不会误删其他持有者的订阅；解除函数可重复调用。
- `dispose()`停止定时器、清空订阅和缓存、取消在途请求，轮询队列跳过已无订阅的企业。
- 每个HTTP请求默认10秒超时，通过`requestTimeoutMs`配置；覆盖等待响应头和读取JSON正文。超时记入既有错误诊断，错误码`EVO_RUNTIME_REVISION_TIMEOUT`；下一次轮询可以恢复。
- 主动解除订阅/关闭不记业务错误。取消后迟到响应不能更新缓存或发送变更通知。未读取的响应正文会取消，避免占用请求资源。

## 验证与CI

本地构建通过。7项协议/集成测试通过，其中3项使用本机真实HTTP服务器和原生fetch，观察服务端响应关闭，覆盖解除订阅、宿主关闭、正文卡住超时与恢复；其余验证条件请求、错误响应、重复订阅、忽略取消的迟到响应及配置校验。

路径：
- `tests/protocol/evo-runtime-revision-bridge.test.mjs`
- `tests/integration/evo-runtime-revision-resources.test.mjs`
- `.github/workflows/lightweight-host.yml`：上述两组测试加入既有轻量宿主CI。

`npm run architecture:lightweight`通过：359个可达模块，297条遗留提前加载边，无增减。测试不连接线上服务。GitHub CI状态以PR检查为准，本文记录本地已完成的证据。

## 限制和后续

`dispose()`仍是同步发出取消指令，HTTP关闭通过异步完成，不能将返回值当作“所有资源已经关闭”的回执。原生fetch支持AbortSignal；自定义fetch实现必须遵守取消契约，否则只能阻止迟到结果提交，不能强行终止不合作的Promise。没有用Promise.race伪造资源已释放。

本轮不关闭Node全局HTTP连接池，不承诺池内所有空闲连接归零；验证的是在途请求/响应释放和轮询停止，不是生产吞吐、内存收益或数据库连接池回收。

`manager/lazy-provider-runtime.ts`的通用drain仍没有超时回执。本次请求超时不能当作通用插件停用超时已经完成。下一步：
1. 对齐插件异步停用状态及管理员回执，明确停止中、超时仍阻断、清理失败可重试。
2. 在上述契约下选择第二个具备资源的Provider迁移，保持只读业务优先；写操作需要单独定义事务/幂等与取消边界。
3. 继续减少297条遗留提前加载边；不通过扩大白名单绕过CI。

本专项进度在本目录留存，不覆盖其他窗口的全局HANDOFF或业务待办。
