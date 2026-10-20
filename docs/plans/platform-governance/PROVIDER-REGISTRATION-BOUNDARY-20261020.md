# Provider启动登记与实际副作用边界

日期：2026-10-20；A01/R3首批，基线main `36a3ee4ec2385c8e3657d509f382649144f4857d`。
入口：[固定7项进度](CLOSEOUT-COUNTDOWN.md)、[A01剩余责任R1～R4](A01-CLOSURE-REVIEW-20261018.md)。接续[运行图第16节](EOG-LOADING-BOUNDARY-20261018.md)，不重复已整改入口或View State构造结论，不增加第二个Provider试点。

## 1. 本批结论与范围

现有OpenAI/DeepSeek的runtime及health probe工厂只是配置校验和闭包，不创建外部客户端、连接池、订阅或后台任务。registry的replace/setHealthProbe只存Map，不执行probe；没有证据支持为减少静态边给它们增加懒代理。本批保留生产实现，补配置构造/登记零资源与实际调用时资源回归。

**这不等于Host启动零凭据访问。** 两个refresh函数在启动及对应设置保存后执行；它们通过有效Secrets Provider解析凭据，可能迁移旧环境变量，配置后把API Key和model/baseUrl捕获在进程内闭包。它们没有检查对应LLM Feature资格。共享Secrets构造本身按文件配置读取/创建主密钥及读取加密状态，迁移put会写入。此事实不能被“工厂不联网”掩盖，也不能由本批给全部凭据提前解析授予永久例外。

本批仅测试/CI/文档，没有生产、UI、Agent功能或部署变更。原Provider合同、模型默认值、Secret迁移/回退、安全准入、网络端点、错误返回和计费usage均保持。R3仍未关闭。

## 2. 分层事实与保留决定

| 层/实际入口 | 触发、资源与副作用 | 决定与限制 |
|---|---|---|
| `providers/openai/package.ts`、`providers/deepseek/package.ts` | 身份/manifest/settings/能力描述；runtime只value-import provider ID。没有SDK构造或顶层业务调用 | 保留轻量元数据；本批按相关字段查阅清单，不审计全部设置UI |
| `createOpenAiResponsesLlmProvider` / `createDeepSeekResponsesLlmProvider` | 构造读取options/global fetch、校验API Key/DeepSeek timeout、规范化配置，返回infer闭包；不调用fetch或创建timer | 保留原同步工厂，不额外包装。闭包持有凭据/配置，属于已配置的进程内状态，不声称未使用时完全没有内存成本 |
| 两个`create*ResponsesHealthProbe` | 工厂只返回函数；执行时才创建AbortController和5秒timeout并GET；finally清timeout | 保留显式主动探测；没有轮询、interval或后台健康任务。状态是UNKNOWN直到报告，不把配置成功写为远端健康 |
| `createProviderRuntimeRegistry`的replace/setHealthProbe/get/has/getHealth/resolve | Map/健康副本及描述选择；resolve/getHealth不会执行probe | 保留通用Host登记机制；remove清登记/health/probe引用，没有自动删除共享Secrets，也不取消已取走的runtime引用 |
| `refreshOpenAiProviderRuntime` / `refreshDeepSeekProviderRuntime` | 启动await与相应设置保存触发；Secrets describe/resolve及可选legacy put，然后读取settings、创建上述闭包并登记UNKNOWN。无Key则remove；旧环境变量兼容fallback仍在 | **配置/安全存储访问与纯工厂分开记账**。本批暂不改Secret权威/迁移/回退；对应可选LLM未安装/停用时是否必须提前解密/迁移仍待资源资格与恢复合同对账，不能称闭环 |
| 共享Secrets `createEncryptedFileSecretStoreV010` | Host按file/key路径选择：loadKey建目录、读已有Key或生成写新Key；loadState读取已有密文。describe读内存，resolve解密内存记录；put/remove落盘 | 共享安全服务不能绑定一个LLM UI启停或为减少数字卸载。这里只核对真实I/O，不宣称Secrets全部资格/部署合同合格，也未读取实际凭据或生产文件 |
| Host `POST /v1/providers/health/probe` | 先管理员授权并写原审计，再检查有效Provider贡献；拒绝时不执行runHealthProbe，通过后才执行注册probe | 保留原授权/有效性顺序；本批定向源码核对，不新增或冒称真实HTTP矩阵。其他内部直接调用registry需由调用者负责资格 |

源码范围及hash见[结构化证据](evidence/llm-provider-resource-boundary-20261020.json)。完整读取两个runtime、registry、共享Secret store/runtime及新测试；Host只读对应imports、shared store构造、refresh、Secrets resolver、health路由及设置保存调用点。LLM既有业务测试仅按相关用例查阅，未声称全部执行或通读所有Agent代码。

## 3. 实际调用、停止与恢复

infer调用才POST `/responses`，并发请求各自发出一次，不引入共享连接工厂或自动重放。DeepSeek每个infer创建独立30秒默认timer，在fetch阶段finally清除；**原timer在response.json之前已清除，不能将其写成完整响应体/整个推理期限**。OpenAI当前infer无本层期限；二者都没有跨请求/停用可调用的cancel接口。本批不擅自重定义Agent在途执行、超时计费或持久事务合同。

显式health probe每次创建独立5秒timer，成功、HTTP拒绝/服务错误、网络异常或Abort后均finally释放；registry把异常记录为UNAVAILABLE，后续显式重试可恢复。metadata/getHealth不隐式重试，不自动选择另一个已绑定Provider。测试用可控fetch和timer验证这些分支，不连接真实API或等待真实5秒。

这些无资源工厂不需要新增dispose；配置refresh替换registry引用，已进入infer/probe的旧调用仍持有其原凭据/配置。停止新调用、在途取消/drain、凭据轮换和跨Host冻结不能由Map.remove或“没有interval”推断。未安装/停用四状态及真实请求授权继续由原有效贡献/owner合同和R4验收负责。

## 4. 回归、CI与实际证据

新增 `tests/protocol/llm-provider-resource-boundary.test.mjs` 5项：

- 一个全新子进程先复用第16节原生loader/公共资源guard，再import两个runtime/registry/resolver，构造配置后的runtime/probe、登记和读取元数据、解析候选、无效Key拒绝与remove；全过程不得触发枚举的文件/出站/timer/子进程调用。保留attempt的检查函数仅导出给测试复用，没有生产helper或新框架。
- 每个原Provider各一项：非法合同在网络/timer前拒绝；首次并发infer各一次POST；失败不重放，显式下一次调用可恢复，DeepSeek请求timer不泄漏。
- 每个原Provider各一项：显式probe才GET和创建timer；HEALTHY、503 DEGRADED、401 UNAVAILABLE、网络异常、Abort及再成功；每次timer归零，getHealth不发新请求，remove后probe不触发网络。

沿用原两项 `provider-health-resolution` 回归，确认显式绑定不可用时不静默切换、单候选健康状态保持。原EOG求值guard的5项也通过；本地合计12项。新用例与既有2项加入现有Lightweight Host CI，不另建Provider认证平台；没有调整静态基线、禁止列表或既有断言。

本地是独立 `/workspace/provider-r3-20261020` 固定SHA部分源码快照，Node24临时类型擦除dist，不是正式全仓TS build；未本地真实Host/browser/数据库执行。正式npm ci/build、Node22、新5项/既有回归和四组合测量待本PR CI，最终准确head/run/合并以PR收口记录为准。#1067的310模块/246边及178行为/6守卫是历史结果，不当成本批测量。新测试不验证真实LLM、真实5秒网络期限、生产凭据或用户验收。未部署。

## 5. 下一步与停止条件

本批达到对应CI后停止追加纯工厂拆分。R3下一批优先对账上面已定位的LLM凭据refresh资格/迁移边界，复用现有Secrets、设置及有效贡献机制；先明确共享Host安全责任与可选消费者范围，补配置+未安装/停用、首次使用、失败恢复和重启证据，再决定是否调整。不得擅自移除共享安全服务或删除旧凭据。随后继续memory-intake/EC、semantic/DLP及身份/授权/成员等剩余类，逐类查实际资源，避免仅凭runtime名称认定常驻缺陷。

R1旧SOP工具身份/资格与冻结例外仍保留；R2 conversationDatabaseUrl触发SQL仍需原Agent owner职责/资格/验收，其他PA05成果不能代替；R4最终跨层矩阵未关闭。本批不替Agent/BEX/2D专项验收，不修改全局状态。

插件平台架构治理 固定进度表（当前专项）

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| A01 轻量宿主与按需装载 | 部分完成；R3现有LLM工厂分类/资源回归 | R3凭据资格及其他Provider；R1/R2/R4保留 |
| A02 安装声明与执行边界 | 已闭环 | 无需进一步操作 |
| A03 账本管理与编译边界 | 部分完成 | 权威结果查询与幂等恢复 |
| A04 成员关系与访问授权分包 | 已闭环，保留两包 | 无需进一步操作 |
| A05 三种会话服务定位 | 部分完成 | 正式策略、兼容迁移与其他入口 |
| A06 生命周期覆盖范围 | 已闭环 | 全平台实施缺口继续归A01 |
| A07 个人/企业上下文边界 | 已闭环、已移交原Agent专项 | 无需本窗口进一步操作 |
| 插件平台架构治理 整体 | 7项：4闭环、3部分完成 | 尚未整体收口 |

提交期间main前进至 `f1bcfd80260394260d5f59c0589d4b692c8015de`，compare仅3个Agent交接/验收/拓扑文档路径，与本批8文件无重叠。以普通merge提交同步并完整保留；生产源码及本批分类事实不变。最终CI必须匹配同步后的准确head，结果见PR。
