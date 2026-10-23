# A02：能力声明与运行时可执行边界

日期：2026-10-14。核对基线：`dbc6112a794fea401078e662c211670ff877a750`。接续 #826；仅处理 A02，不接管 Agent、BEX、交易或 2D 专项。

## 结论与本批处理

`evo.core` 是账本相关能力的声明包，安装/激活并不启动外部 EVO 服务。当前 `effectiveCapabilities` 从激活 Feature 的声明集合生成；`inspectPluginRuntimeV010().status = READY` 对声明包表示 Host 接纳，不是远端健康检测，也不是执行授权。

本次检查的路径没有发现“仅凭安装状态就伪造远端执行成功”的实现。发现的是语义容易混淆：基础包描述称“提供基础运行时能力”，而通用状态名称 READY 没有在类型上注明判断范围。本批修改基础包中文说明、声明包接纳消息和类型注释；保留状态值与安装行为，避免破坏已有接纳逻辑。

A02 的状态语义核实与澄清闭环完成。此结论不等于所有调用入口已安全审计，也不等于生产账本服务当前可用。

## 状态必须分别理解

| 状态/事实 | 实际能说明什么 | 不能推导什么 |
|---|---|---|
| 目录中已声明 | 存在包/Feature/能力元数据 | 已安装、已连接 |
| 包已安装 | 生命周期记录及安装接纳成立 | Feature 全部激活、外部服务在线 |
| Feature 激活、effectiveCapabilities 包含能力 | 声明依赖可用于发现及解析 | 企业已配置、当前主体有权执行 |
| 插件运行适配检查 READY | 相应 Host 适配层可接纳；声明包是静态判断 | 已向远端发起健康请求、业务已执行 |
| Provider 解析成功 | 找到当前作用域候选，已满足解析器要求 | 所有业务接口可用、后续请求一定成功 |
| 连接/健康检查成功 | 被检查的服务在检查时回应 | 当前企业的应用/规则完整、写操作已获授权 |
| 某次操作返回有效结果 | 该调用按对应协议得到结果 | 后续操作无须再授权，或异步记账已经完成 |

这些是语义分层，不新增一套全局状态机或协议枚举。具体产品页面如需“可用”提示，应组合其 owner 的配置和调用证据，不能仅映射 `effectiveCapabilities` 或通用 READY。

## 已核对的执行门禁与证据索引

以下均为本仓库源代码重点函数原文查阅；未通读整个 server.ts，未访问远端 EVO 源码或生产状态。本轮无新增网络研究。

| 文件/定位 | 事实及使用限制 |
|---|---|
| `catalog/seed.ts` / evoFoundationPackage | 只有 business-data → posting → ledger → balance 声明链，没有对应 service-provider 绑定；保留 packageId 和能力名 |
| `manager/service.ts` / effectiveCapabilities、planInstall | 根据激活声明构造能力集合，依赖解析不是外部健康检查 |
| `manager/plugin-runtime-host.ts` / inspectPluginRuntimeV010 | DECLARATIVE/HOST 静态返回 READY；本次增加明确范围说明。PROCESS/REMOTE 判定逻辑未改 |
| `manager/server.ts` / evaluateRuntimeForHost | REMOTE 在凭据 Provider 可解析时可标 READY；不是远端 HTTP 探活。evo.core 本身仍走声明分支 |
| `actions/router.ts` / execute | 未激活 Feature 不调用 handler；preExecute 可以拦截。激活之后仍需要业务处理器完成授权与调用 |
| `apps/ledger-manager/actions.ts` / 发布命令 | 检查企业上下文、人类主体、确认、OWNER/ADMIN、定义版本及授权，再编译并等待发布回调；异常转失败结果 |
| `manager/server.ts` / publishToLedgerRuntime、evoJson | 新账本发布实际 POST /api/v1/configurator/burn；非 2xx 抛失败，网络异常向上传播。未完整校验 2xx 业务响应结构，不能将 HTTP 成功表述为全面业务就绪 |
| `manager/server.ts` / ledgerConfiguratorActive、旧 runtime-status/burn 路径 | 旧 API 有 Feature 门禁；状态查询实际转发远端 /api/v1/configurator/status，burn 转发远端状态码。不能把该兼容接口等同于新账本企业授权链 |
| `manager/provider-resolution.ts` / resolveProviderRuntime | 候选歧义、绑定目标无运行实现及 UNAVAILABLE 健康状态会阻止解析；不能假设 evo.core 自动走此 Provider 机制 |
| `manager/evo-business-data-http-adapter.ts` / submit、responseBody | 检查远端 HTTP 错误及成功响应字段；接受 QUEUED/BLOCKED_REPLAY_REQUIRED，而不是把受理当作完成记账 |
| `manager/plugin-store-page.ts` / items filter | FOUNDATION_RUNTIME 当前不显示在插件商店卡片列表；本批基础包说明主要修正清单消费者口径，不声称新增可见卡片 |

## 回归与完成条件

在现有 `tests/protocol/evo-business-data-http-adapter.test.mjs` 增加组合回归：

1. 从空生命周期仓库安装兼容编译器，自动解析并激活基础依赖。
2. 确认 evo.ledger 已声明有效、evo.core 已安装且适配检查 READY，但没有 evo.ledger Provider 绑定。
3. 对网络失败、503、200 但响应协议错误，实际业务适配器均拒绝成功。
4. 每次只调用一次，不静默重试写入；失败不卸载已安装能力。

测试使用注入的 HTTP 响应，不访问线上，是生命周期与适配器组件证据，不是完整业务 E2E。沿用 Platform CI 的 tests/protocol/**/*.test.mjs 覆盖，无新增 workflow。

本地验证：构建通过；适配器、核心生命周期、Action 门禁、账本管理及标题/说明测试 26/26 通过；轻量 Host 门禁通过，历史静态依赖保持 297 条。

## 保留问题，不扩张本批

- 账本发布对 2xx 回执的严格业务合同校验、结果未知后的查询/幂等语义仍需要与远端 owner 核对，归账本发布专项；不是本批已解决内容。
- `evoJson` 未设置应用层超时；断连/超时不能反推远端没有生效，不应因此自动重试业务写。
- 旧兼容接口不等同于完整企业授权入口；其消费者与退出条件沿用 [编译兼容清单](LEDGER-COMPILER-BOUNDARY.md)。不凭这次状态检查删除旧接口。
- 未操作生产、未变更远端服务绑定、未读取凭据或在线安装快照。不声称全平台运行时就绪检查已统一。

后续记录：A05 用途说明与默认选择核对已由 #850 完成，正式认证回退策略仍未完成；A04 已决定保留两包，不再作为必做合包任务。当前任务和下一批 A03 合同核对见 [固定任务状态表](CLOSEOUT-COUNTDOWN.md)。
