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

## 6. 2026-10-20增量：refresh不再隐式持久化环境凭据

基线main `2735edb72f2b44297466cbd53feda3892f84385b`（#1069），包含原交接#1020。#1069最终head `8abef0f99ac42e6268193a22dbe44fed485510a1`，4项CI、185行为/6守卫及四组合310模块/246静态边见[收口记录](https://github.com/jiangxng/EVO-App-Platform/pull/1069#issuecomment-6283394285)；这些不是本批测量。新分支 `fix/governance-llm-legacy-migration-trigger-20261020`；已核对开放BEX工作无本批路径重叠，不修改全局状态或其他专项。

### 事实与有界修正

继续查明同步`resolveLlmProvider`的Host chat/run/thread/async worker消费者，以及Human和Agent工具的安装路径。只在两个启动refresh前加Feature判断会使后来安装/启用的Provider缺少原runtime，不能假装是完整的按需修复；不为此改Agent合同或再造代理。因而本批先收口一个独立写副作用：两个refresh中`secrets.put(reference, legacyApiKey)`。

该put并不需要infer调用或Secret管理授权：只要共享Secrets有效、对应记录未配置且环境Key存在，启动就会写；即使LLM未安装/停用也如此。普通模型设置保存也会进入refresh。更具体的缺陷是原显式REMOVE成功后，refresh会立即把仍存在的环境Key写回，令删除后的持久状态与用户动作不符。源码条件已确认；没有读取真实凭据或生产文件。

本批只删除这两段隐式put及重复describe，保留一次metadata describe、已有密文resolve、settings选择、环境兼容fallback和原Provider工厂。**不再自动将环境Key迁入共享Secrets；需要持久化时在原设置的API Key字段显式提交。普通模型设置保存不算迁移授权。** 原`secret:apiKey`/`secret-remove:apiKey`路径继续经过原管理员认证/授权、加密写入及Secret审计，没有新写入口或授权规则。

| 场景 | 本批实际行为/验收边界 |
|---|---|
| 未安装、停用、启用未使用、禁用重启 | refresh不写环境Key；共享安全store仍可创建/读取主密钥和密文，不宣称启动零文件访问 |
| 首次合法调用/恢复启用 | 原已配置runtime和环境fallback保持，不需要等待新增加载器；真实Host测试以合成health GET检查兼容，不冒称真实LLM任务 |
| 普通模型或Base URL保存 | 原配置保存/刷新保持，不附带Secret迁移或put；没有自动重放 |
| 显式Key保存 | 原安装命名空间检查、管理员授权和审计保持；无授权拒绝，合法输入加密保存；已有记录不会被环境refresh覆盖 |
| 显式删除后仍配置环境Key | 删除结果保留，refresh/启停/重装不再复活记录；旧环境回退仍可能继续可用，删除密文不是撤销部署环境变量 |
| 重启/不再提供环境变量 | 原显式保存的密文仍可解析，启动不改写已有密文；删除且无环境Key时runtime不可用，探测不发外部请求 |

### 验证与限制

新增`tests/integration/llm-credential-persistence-host.test.mjs`一个多次重启的真实Host联合回归，覆盖上述两种已有Provider及密文不含明文、PUT/REMOVE审计。使用原profile、HTTP准入、生命周期和Secret store；test-only fetch fixture只接收合成.invalid端点GET，不打印Key；原TCP出站block保持。未为生产添加测试开关或替换源码，也不是第二个Provider生命周期试点。

本地原LLM资源5项、health resolution2项、EOG guard5项合计12项通过；新Host测试/fixture及临时擦除Host语法通过。本地仍是固定SHA部分源码+Node24临时类型擦除，未正式全仓build或执行真实Host/browser。正式npm ci/build、Node22、联合Host回归与四组合在本PR CI；最终准确head、结果和合并见PR。没有新本地模块/性能测量，静态基线与冷禁入列表不改。

读取复用完整项目启动/交付、装载规范、治理材料与Eidos权威；本轮补读原lazy-provider helper、Secret管理函数及相关settings校验，Host仅核对refresh、同步消费者、生命周期事件/入口和设置写路径，Agent工具仅核对install调用。未声称通读全Host/Agent或所有生命周期消费者。证据：[llm-credential-persistence-20261020.json](evidence/llm-credential-persistence-20261020.json)；[兼容评审](../../ui-design-reviews/llm-credential-persistence-20261020.md)。

本批没有新实例、连接、timer、任务、全局缓存或dispose；启动时解析/解密已有Key、可选消费者资格、在途取消/轮换/跨Host冻结仍未解决，不能将本批写副作用修复冒充全部凭据按需装载。**本批验收达到后停止追加；下一步对账提前解析的同步消费者合同与必要Host配置职责，继续其他R3 Provider分类。** R1冻结SOP、R2配置SQL、R4跨层矩阵仍开放，无部署。

插件平台架构治理 固定进度表（当前专项）

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| A01 轻量宿主与按需装载 | 部分完成；LLM refresh隐式凭据写入已移除 | R3提前解析/其他Provider，R1/R2/R4保留 |
| A02 安装声明与执行边界 | 已闭环 | 无需进一步操作 |
| A03 账本管理与编译边界 | 部分完成 | 权威结果查询与幂等恢复 |
| A04 成员关系与访问授权分包 | 已闭环，保留两包 | 无需进一步操作 |
| A05 三种会话服务定位 | 部分完成 | 正式策略、兼容迁移与其他入口 |
| A06 生命周期覆盖范围 | 已闭环 | 全平台实施缺口继续归A01 |
| A07 个人/企业上下文边界 | 已闭环、已移交原Agent专项 | 无需本窗口进一步操作 |
| 插件平台架构治理 整体 | 7项：4闭环、3部分完成 | 尚未整体收口 |

## 7. 2026-10-20增量：明文凭据绑定实际请求

基线main `1acd04a8f9bb13082a03d755a81f2227fbf838d4`（#1072）。前批最终head `72eb690069373ed2b2ae8f505962ad759a827a27`，44项CI、186行为/6守卫、四组合310模块/246边见[最终记录](https://github.com/jiangxng/EVO-App-Platform/pull/1072#issuecomment-6283568645)；不是本批测量。过程分支 `fix/governance-llm-request-credentials-20261020`。本批只接续两种原LLM的凭据读取边界，不改Agent/BEX/2D功能或全局状态，不新增Provider/通用加载框架。

### 为什么需要这一层

同步`resolveLlmProvider`及chat/run/thread/async worker需要配置状态、model/provider身份和有效贡献，不需要明文Key。原refresh把`secrets.resolve`提前到启动/设置保存，并把明文捕获到两个原工厂的options闭包。只加启动Feature判断无法保证后续通过Human或直接Agent manager.install启用后立即可用；改同步公共合同会牵动其他专项。因此保留廉价同步登记，复用两个工厂已有的`fetchImpl`注入端口，在真实网络请求边界取得Key，不再让Provider options闭包保留明文。

新增`manager/llm-credential-fetch.ts`是这一对既有Host配置消费者的凭据绑定函数，不是第二套Provider、授权或生命周期框架。构造只捕获引用/回调；原工厂收到非Secret的配置标记，标记只满足原工厂配置校验，实际请求的authorization在fetch端口以真实Key替换，测试显式拒绝标记流出。原消息/工具schema、model、URL、HTTP方法/body、signal/redirect和Provider响应逻辑不改。

### 归属、触发和竞态

| 场景/资源 | 本批行为与责任 |
|---|---|
| 启动/发现/设置刷新 | 只读取有效共享Secrets的describe配置元数据和非Secret模型设置，不调用LLM Key resolve；无Key元数据且无legacy env时仍移除runtime。共享安全store的主密钥/密文文件加载保留，不称Host零文件访问 |
| 未安装/停用 | 请求前检查原有效llm.inference贡献和当前配置版本，不解析Key/不发请求；旧引用不能靠绕过上层路由取得Key。安装/启用不解密，也不需要新异步安装协议 |
| 实际infer/显式health | 每个请求按原installation Secret reference解析；describe/resolve每次await后复核资格、配置版本、启停epoch和AbortSignal。优先已配置Secret，保留原环境fallback；无Key显式拒绝，无自动重放 |
| 并发首次调用 | 不建立全局明文/Promise缓存，每个合法请求分别解析一次。没有新连接/定时器/订阅/索引或业务持久化；不是把并发解密当连接工厂重复创建 |
| 停用后重新启用期间迟到解析 | 原manager生命周期事件仅为这两个owner更新有界整数epoch；即使已重新启用，旧epoch请求也拒绝。后续新请求可恢复，其他插件事件不改变本owner epoch |
| 设置写入/端点及Key轮换 | 原授权与字段校验之后，在异步Secret写入前使旧配置引用失效并计数阻止发送；计数覆盖并行保存。finally按当前状态刷新元数据并释放，失败也不留下永久门禁；旧端点不会通过旧引用取得新Key |
| describe/resolve失败、超时 | 保留原合法上下文中的环境兼容fallback；资格/配置/Abort失败不能降级到环境Key。已到期请求不继续后续解密或网络；失败不缓存，之后显式调用可恢复 |
| 损坏密文/元数据已配置 | 加密元数据不证明可解密。坏Key检测推迟至实际使用/显式探测，不在冷启动解密所有可选Key；UNKNOWN不代表远端健康，错误按原调用/registry渠道显式呈现 |

Host只增加两个owner的配置/启停版本和设置写入计数，属于有界治理元数据，不持有Key或待处理调用。Helper中的明文仅属于单次请求及其Headers；不承诺JS字符串可擦除或网络库不暂存请求头。共享Secrets与主密钥不随单个LLM/UI停用销毁。配置写入失败时，原加密store可能已改内存再落盘失败；本批只保证门禁finally释放及显式重试，不把现有存储当事务回滚。

### 证据与适用限制

新增组件9项：构造/拒绝零解析、并发每请求Key绑定且不改原headers、describe/resolve两阶段的禁用后重启用、配置替换、Abort，以及旧兼容fallback/缺Key/失败恢复。等待由可控Promise屏障完成，不依赖sleep；这些是组件竞态证据，不冒称真实HTTP在途屏障。

扩展原真实Host文件，新增第二项多次重启用例：通过test-only `crypto.createDecipheriv`计数观察实际加密store解密，而非仅断言Key元数据；未安装、停用、启用未用、设置保存、禁用及有效状态重启均0解密，实际并发probe按请求解密。原持久化/删除不复活回归继续运行。fixture只统计次数并校验合成授权头，不输出Key、不替换模块源码或增加生产开关，原TCP出站block保持。

新Host用例还将其独立临时目录的Secrets临时文件位置预建为目录，迫使真实put失败；确认磁盘记录未写、没有解密，修复该测试目录后原显式保存/请求可恢复。没有操作真实凭据、生产存储或部署。

本地新9项+前批12项合计21项通过；后续仅补请求端口缺失检查及Host写失败场景时，新9项定向复测通过，Host/新fixture语法通过。仍为独立固定SHA部分源码+Node24临时擦除，非正式全仓构建，未本地Host/browser；正式npm ci/build、Node22、新旧Host/组件及四组合以本PR最终head CI为准。本批新增一个轻量Host helper，模块数可能增加；静态基线/冷禁入不放宽，不以降低数字代替凭据边界。

原OpenAI无本层infer期限、DeepSeek timer仅覆盖fetch而非response.json，原health的5秒期限现也覆盖其内部凭据等待。读取Provider若不响应signal，其Promise可能在超时后才返回，届时仍拒绝发送；本批不保证取消外部Secrets实现。已发出的网络请求仍遵循原signal/owner合同，不新增跨Host冻结、明文擦除、在途推理回滚或所有Provider停止保证。原registry可能接收较早probe的健康报告，本批不宣称健康结果的跨配置代际认证。

读取复用已完整阅读的启动/交付/装载/治理/Eidos权威；本轮核对同步消费者与Secret接口/原工厂fetch接口、生命周期事件及设置写入局部，新helper/组件/Host测试全文。不声称通读全Host/Agent或实际用户任务。证据：[llm-request-credentials-20261020.json](evidence/llm-request-credentials-20261020.json)；[兼容评审](../../ui-design-reviews/llm-request-credentials-20261020.md)。

### 接续与固定进度

本批对应CI通过后停止追加LLM拆分。下一批回到R3其余memory-intake/EC、semantic/DLP和必要安全Provider的实际构造/调用副作用；复用前批分类口径，不新建第二Provider试点。上述LLM局部验收不关闭R3整体；R1冻结SOP资格、R2配置SQL、R4最终跨层矩阵继续保留。未生产部署。

插件平台架构治理 固定进度表（当前专项）

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| A01 轻量宿主与按需装载 | 部分完成；LLM请求时凭据解析及竞态保护 | R3其他Provider；R1/R2/R4保留 |
| A02 安装声明与执行边界 | 已闭环 | 无需进一步操作 |
| A03 账本管理与编译边界 | 部分完成 | 权威结果查询与幂等恢复 |
| A04 成员关系与访问授权分包 | 已闭环，保留两包 | 无需进一步操作 |
| A05 三种会话服务定位 | 部分完成 | 正式策略、兼容迁移与其他入口 |
| A06 生命周期覆盖范围 | 已闭环 | 全平台实施缺口继续归A01 |
| A07 个人/企业上下文边界 | 已闭环、已移交原Agent专项 | 无需本窗口进一步操作 |
| 插件平台架构治理 整体 | 7项：4闭环、3部分完成 | 尚未整体收口 |
