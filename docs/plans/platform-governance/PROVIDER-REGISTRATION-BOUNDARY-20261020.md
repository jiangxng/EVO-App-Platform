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

## 8. 2026-10-20增量：记忆适配器及共享安全登记的保留边界

基线main `eaa5e813b1e86a6460d988c76eb2076512c35127`（#1073），已确认包含原交接#1020。前批LLM请求时凭据证据见[#1073收口](https://github.com/jiangxng/EVO-App-Platform/pull/1073#issuecomment-6283766419)，其311模块/246边及196行为/6守卫不是本轮测量。过程分支 `test/governance-memory-security-boundary-20261020`。本批只补测试/CI和分类依据，不改生产实现、公共合同、UI、Agent/BEX/2D或全局进度文件，不部署。

### 逐层事实与决定

| 已读入口 | 实际触发、资源及作用域 | 保留决定、限制与退出条件 |
|---|---|---|
| `providers/memory-intake/runtime.ts` 的parse、evidence、intake及health工厂 | parse在Host读取配置环境值后校验/规范化；evidence克隆source，intake构造克隆全部配置records；pull在内存按context筛选/分页并复制结果。probe仅描述配置，无文件/网络/timer | 保留配置型内存适配。并非零成本常量：构造成本随records线性增长。本轮单条合成记录证明资源边界，不是大批量内存预算验收；若用于大规模持久数据，应由原owner给出预算和源适配方案，不能推广为启动装载业务库 |
| `providers/experience-compiler-memory/runtime.ts` | 配置校验、evidence克隆source、intake闭包和probe构造均不请求。实际pull才创建每请求AbortController/timeout并POST；finally清期限，覆盖response.json | 保留原同步配置工厂和已有fetch端口，不造懒代理/第二Provider。元数据与业务请求分开；工厂本身不验证Feature资格，原调用者仍负责有效贡献/授权 |
| `providers/context-memory-semantic/runtime.ts`、`context-memory-dlp/runtime.ts` | 构造规范化URL、校验fetch/timeout，返回闭包；search/classify才POST及创建期限。没有连接池、订阅、后台循环或跨请求Promise缓存 | 保留无资源闭包。并发分别发请求，不自动重放；运行时在finally释放各自期限，不意味着旧引用有生命周期认证或在途业务回滚 |
| 三种远端memory的health probe | 只检查endpoint协议；HTTPS报告HEALTHY、HTTP报告DEGRADED，不调用远端，不解析token，也不创建timer | 保持原状态语义；**这是配置状态，不是远端可用、凭据可解密或真实业务健康证据**。测试显式阻断fetch并记录零调用，不能套用LLM的主动GET探测结论 |
| `refreshP12MemoryProviderRuntimes`、`optionalInstallationSecret` | Host启动及三类对应设置保存刷新时，若URL/EC配置存在，按installation reference执行Secrets.describe；configured为真即resolve并把token捕获在原options。随后登记，错误remove并记录fail-closed。reader会按当时有效semantic解析装配；末尾调用已有schedule重算 | **这是已定位而未整改的提前解密，不属于上面工厂零资源结论。** 与LLM上批不同，memory的Bearer可选，无token也可请求；不得直接复制必需Key标记/LLM helper或只加一次启动资格判断。下一批先核对动态绑定、共享reader、后台schedule与直接消费者资格，再做一个有界修正。不得重新打开已验收调度/租约或替Agent完成学习功能 |
| `providers/identity-directory/runtime.ts` | service/probe构造不读store；get/list和显式probe才snapshot；认证记账/disable才save。Host的file store工厂**构造会读文件**；memory store只校验/克隆 | 保留共享可信身份及撤销权威，不与某个UI启停绑定。不能把adapter无I/O误写成Host身份目录零文件访问。身份撤销必须继续即时生效；替换/退役必须先证明全部安全消费者迁移，不为减少模块关闭保护 |
| `providers/enterprise-context-grant/runtime.ts`、`enterprise-relationship/runtime.ts` | 构造只克隆静态grants或捕获动态source，不执行source；查询/显式probe才调用当前source。Host传入共享enterpriseGovernanceStore.snapshot；该文件store是snapshot时exists/read，save时验证/写文件 | 保留两包及同步共享源，不缓存旧授权、不绑定UI停用，也不复制影子存储。新回归确认撤销立即可见、来源异常拒绝且后续可恢复；不声称完整HTTP准入、跨Host撤销或治理存储全部生命周期已验收 |
| `providers/authorization/runtime.ts`、`remote-credential/runtime.ts` | 静态策略校验/合并/检查是内存操作；credential工厂规范化配置Map，getBearerToken按原优先级取值，缺失显式拒绝，无网络/store/timer。配置Token仍保存在进程内 | 保留必要授权/受管凭据解析机制。未改默认拒绝、DENY优先、Secret权威或环境配置UX；无资源不等于没有敏感内存。没有授予所有环境凭据永久保留例外 |

上述“保留”限于已读工厂/同步合同和本批资源事实，不是对所有调用者资格的豁免。registry仍是原Map登记：replace/setHealthProbe/discovery不执行probe。共享安全服务不能交给一个消费者UI销毁；本批未新增实例管理、连接、定时器、持久化、资源框架或dispose。未安装/停用/迟到调用的完整Host矩阵仍记R3/R4，不用独立工厂测试冒充。

### 可执行保护与读取范围

新增 `tests/protocol/memory-security-resource-boundary.test.mjs` 10项，并纳入现有Lightweight Host工作流：

- 独立子进程复用既有求值前resource guard及原生不改源码loader，首次导入9个runtime根；构造配置后的适配器/probe，登记、发现及内存memory pull，不得触发已枚举文件、fetch/TCP、timer或子进程端口。安全store/source回调构造/发现调用数为0；原吞异常canary继续在CI运行。
- semantic/DLP/EC每类两项：非法版本在请求/期限前拒绝，首次并发独立signal；HTTP、JSON解析、响应校验和网络失败每次只发一请求、清timer，显式后续调用恢复；受控Promise屏障证明等待body时期限仍在，模拟Abort后释放并恢复。不以sleep/真实网络延时推测结果。
- 一项对账远端memory probe的配置语义；两项确认共享grant/relationship在调用时读当前来源、撤销/故障恢复，以及identity只在原认证/禁用动作写共享store。没有新增业务功能或删除原安全回归。

本地新10项+原求值guard5项合计15项通过；fixture/新测试语法通过。执行环境为固定SHA部分源码快照、Node24.19临时类型擦除dist，**非正式全仓build，未本地真实Host/browser/数据库**。正式npm ci、TypeScript build、Node22、已有Host联合回归和四组合以本PR最终head CI为准，永久结果链接写入PR收口记录；不沿用#1073测量冒充本批。静态基线、冷禁入和已有断言不放宽。

读取复用前批完整启动/LLM/交付/文档治理、EOG及装载规范；本轮复核根AGENTS、当前Provider接续、A01/CLOSEOUT与装载规范全文。新完整读取上述9个runtime、identity file store；memory四份及安全四份package只核对身份/manifest/Secret字段。Host局部：共享身份/治理store构造、provider登记、P12 refresh及设置触发；enterprise治理store局部：snapshot/save file factory及其来源接线；contracts局部：三个请求接口；复用已有LLM/guard测试设施并核对原memory测试覆盖。未通读整个Host/Agent或审计所有存储；无新增外网研究，无真实凭据/企业数据访问。详细固定blob及范围见[结构化证据](evidence/memory-security-resource-boundary-20261020.json)。

### 下一步和停止条件

本批最终CI通过即合并并停止扩充纯工厂拆分。下一批优先处理已定位P12可选token提前解析：先保存所有实际消费者/动态绑定/调度资格与缺token合同，再决定按请求fetch端口解析或有依据的Host保留；必须覆盖未装/停用/启用未用、首次并发、配置/停止竞态、失败恢复及重启，不能直接套用LLM必需Key语义。其余context-memory、EVO observatory及会话/OIDC等类别尚未逐类完成R3资源对账；A05认证产品策略仍在原行，不转为本批业务扩展。

R1冻结SOP身份/资格、R2配置SQL及原owner责任、R3其余类别/消费者、R4最终跨层矩阵全部保留。#1074等Agent shutdown改进不证明R2配置SQL合格。尚无生产部署或Human验收。

插件平台架构治理 固定进度表（当前专项）

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| A01 轻量宿主与按需装载 | 部分完成；memory/共享安全工厂资源分类与回归 | R3 P12凭据与其他类别；R1/R2/R4保留 |
| A02 安装声明与执行边界 | 已闭环 | 无需进一步操作 |
| A03 账本管理与编译边界 | 部分完成 | 权威结果查询与幂等恢复 |
| A04 成员关系与访问授权分包 | 已闭环，保留两包 | 无需进一步操作 |
| A05 三种会话服务定位 | 部分完成 | 正式策略、兼容迁移与其他入口 |
| A06 生命周期覆盖范围 | 已闭环 | 全平台实施缺口继续归A01 |
| A07 个人/企业上下文边界 | 已闭环、已移交原Agent专项 | 无需本窗口进一步操作 |
| 插件平台架构治理 整体 | 7项：4闭环、3部分完成 | 尚未整体收口 |


## 9. 2026-10-20增量：DLP/EC可选凭据按实际请求解析

基线main `102319de812ce65682f0c6ccb1a930e10b4e22d4`（#1076），过程分支 `fix/governance-memory-request-credentials-20261020`。#1076的4项CI、206行为/6守卫及311模块/246边是[历史结果](https://github.com/jiangxng/EVO-App-Platform/pull/1076#issuecomment-6290439620)，不作本批测量。固定7项仍4闭环、3部分完成；本批不新建Provider试点、Agent功能或资源框架，不部署。

### 消费者对账与有界选择

DLP的`createContextMemoryScheduledOperationsV010.runDlp`每次先调用`resolveDlpClassifier`；旧批次会保留该classifier直到循环完成，故每次真正classify仍须复核资格。EC的intake action先做Human/确认/上下文及原授权，intake service每次解析source/evidence、匹配sourceId后pull；已有scheduler也每次解析当前source/evidence，保留原工作资格、游标和租约。真实Host里Provider binding的save/delete均经既有`providerBindings`入口，本批不新增路由或绕过上述准入。

**semantic暂不与这两类合并修正**：Host的P12 refresh一次解析semantic runtime并把引用传入共享reader；停用后启用、动态绑定和刷新涉及该同步消费者的选择合同。其`optionalInstallationSecret`启动/semantic设置刷新提前解密仍保留为明确债务，下一批优先处理，不能称P12三类全部按需。本批没有改semantic算法、reader或Agent Context Assembly。

### 本批实现与原合同

| 层/场景 | 本批行为及限制 |
|---|---|
| DLP/EC构造、登记、配置探测 | 移除这两处refresh中的optionalInstallationSecret，复用原工厂fetchImpl注入。构造不describe/resolve token，配置型health仍只查URL协议；共享Secrets的主密钥/密文文件加载仍在，不称Host零I/O |
| 实际classify/pull | 新`manager/memory-credential-fetch.ts`只服务这两个既有Host消费者；每请求从有效Secrets读取installation/default、对应包apiToken。保留原URL/method/body/signal/redirect及结果校验，无明文/Promise缓存、连接或新timer |
| 可选token | 只有describe明确未配置才不带authorization；已配置则resolve，空值/错误/Secrets缺失均拒绝，不降级匿名，不复制LLM必需Key标记或环境fallback。每次克隆Headers并移除旧authorization，防止错误沿用入参凭据 |
| 有效性、绑定和迟到解析 | 请求前及每次await后复查当前原resolver选择、owner epoch和AbortSignal；共享Secrets runtime替换也拒绝。两个owner的生命周期、对应DLP/intake/evidence及Secrets绑定变化、所有声明secrets.resolve的包生命周期改变使相应有界epoch失效；离开再返回也不能放行旧等待 |
| 显式保存/删除token | 原管理员授权、字段检查、加密写入及审计保持；进入写入前更新owner epoch并计数，finally释放，覆盖并行保存和失败。DLP/EC没有普通可改端点/模型字段，原URL来自启动配置；每请求取token，无需重建runtime或顺带解密semantic。坏写入后不声称存储事务回滚，后续原显式重试可恢复 |
| 停用/卸载/恢复 | 入口原有效贡献判断保持；已经持有的runtime也不能在停用后取得新token。共享Secrets不随消费者销毁，卸载不删token。**已发送请求/业务写入仍遵循原owner在途合同**；不新增跨Host冻结、强制取消或JS字符串擦除承诺 |
| 旧环境自动安装 | 配置DLP URL/EC配置仍可能经原bootstrap安装；本批不改变默认安装策略，不把已配置重启称为“仍未安装”。Host验证的是未使用、持久停用重启及进程内卸载拒绝；配置自动装包归R3后续资格对账 |

原请求timeout现在也覆盖fetch端口内的Secrets等待；不响应signal的Secret Promise可能到期后才完成，返回时仍拒绝发迟到请求。epoch与写计数只保存两个owner整数，不持有Key或待处理调用。Host安全基础、记忆调度/租约及保留治理原实现不变，不把这次局部凭据防线冒充资源生命周期全部合格。

### 验证与证据分级

新增组件9项：构造/无效资格/预先Abort零读取，未配置匿名与配置并发分别绑定、缺失/空/损坏凭据不匿名回退及恢复；describe/resolve两阶段的epoch往返、Abort、共享Secrets替换。Promise屏障只验证helper竞态，不冒充真实HTTP同时启停/保存的屏障。

新增一个真实Host多次重启联合用例，通过test-only crypto.createDecipheriv计数观察实际加密store，沿用原HTTP设置/生命周期/绑定及真实scheduler callback。测试仅使用独立临时目录、合成个人Memory和.invalid端点注入；无真实token/远端、无生产开关或源码替换。覆盖配置已存token启动、未用/配置型probe/普通保存零解密；未授权保存拒绝、真实put文件失败后修复/重试；实际DLP/EC运行才各解密；失败不重放、下一次恢复；停用重启/进程内卸载不解密，重装保留；显式删除恢复匿名；原EC/local source/evidence绑定切换只调用当前目标。它复用已验收调度，不重开TTL/租约专项，也不新增学习语义。

本地Node24.19部分固定SHA源码+临时类型擦除，新9项与前批10项合计19/19通过，Host/fixture和擦除后server语法通过。**未本地正式npm ci/全仓build、真实Host/browser/数据库**；新Host实际结果、正式Node22/build、既有Host回归和本轮四组合须以本PR最终head CI为准，最终结果永久保存在PR收口评论。静态基线/冷禁入不放宽，新增轻量helper可能增加一个模块，不承诺模块数量下降。

读取：复用已完整阅读的启动/交付/文档/装载与Eidos权威；本轮完整读取Secrets、AI-native state/context及Help规范，完整读取DLP/EC manifest、前批runtime和新helper/tests。Host局部核对bootstrap、resolver、共享reader接线、P12 refresh、设置与绑定/生命周期回调；intake service只读run的解析/pull和回执段，intake action全文；operations只读依赖与runDlp，scheduler只读tick/drain及已有Host测试，不声称通读Agent或全Host。Help影响：现有显式Secret保存/删除、授权和Provider拒绝说明仍有效；无新增用户步骤/设置字段，配置探测≠远端健康及重试限制在本节与兼容评审明确。

结构化证据：[memory-request-credentials-20261020.json](evidence/memory-request-credentials-20261020.json)；[兼容评审](../../ui-design-reviews/memory-request-credentials-20261020.md)。

### 接续与停止条件

本批准确head CI通过后合并并停止追加DLP/EC重构。下一批先处理semantic提前凭据解析与共享reader同步选择：保存未装/停用/启用未用、当前绑定、启用恢复和直接消费者证据，复用原算法及资源端口，不扩展Agent功能。R3的配置自动装包、其余context-memory/EVO观测/session/OIDC资源分类及全消费者资格继续保留；R1冻结SOP身份/资格、R2配置SQL/原owner责任、R4最终跨层矩阵均未关闭。

插件平台架构治理 固定进度表（当前专项）

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| A01 轻量宿主与按需装载 | 部分完成；DLP/EC请求时可选凭据与竞态保护 | semantic同步消费者、R3其余类别；R1/R2/R4保留 |
| A02 安装声明与执行边界 | 已闭环 | 无需进一步操作 |
| A03 账本管理与编译边界 | 部分完成 | 权威结果查询与幂等恢复 |
| A04 成员关系与访问授权分包 | 已闭环，保留两包 | 无需进一步操作 |
| A05 三种会话服务定位 | 部分完成 | 正式策略、兼容迁移及其他入口 |
| A06 生命周期覆盖范围 | 已闭环 | 全平台实施缺口归A01 |
| A07 个人/企业上下文边界 | 已闭环、已移交原Agent专项 | 无需本窗口进一步操作 |
| 插件平台架构治理 整体 | 7项：4闭环、3部分完成 | 尚未整体收口 |



## 10. 2026-10-20增量：semantic凭据及共享reader的当前选择

基线main `6fc8fac5b7e78b4e0e1886ee26a4b0b75b3253b1`（#1078），已确认包含原交接#1020；过程分支 `fix/governance-semantic-request-credentials-20261020`。#1078的44项CI、216行为/6守卫及312模块/246边属于[历史记录](https://github.com/jiangxng/EVO-App-Platform/pull/1078#issuecomment-6290786188)，不是本批测量。只接续原semantic可选凭据及同步共享消费者，不新增Provider、Agent功能、UI或通用加载框架，不部署。

### 原消费者与选择缺口

原P12 refresh启动及semantic设置保存时调用optionalInstallationSecret并resolve apiToken，把明文捕获到原remote factory；同时一次性resolve semantic runtime，传给共享Host Context Memory reader。后来绑定变化或启停不能更新这个捕获值；若启动时停用，reader会缺失该选项，单纯启用也不能恢复语义读取。模块工厂零网络不能掩盖这两层实际接线问题。

本批已查Host直接reader消费者：Memory Search页面明确请求LEXICAL；Agent的search/recall/audit/read适配传query/IDs等，接口不接受strategy；record/promote动作的exactMemory读取也未指定strategy。**这些现有入口不是semantic HTTP产品入口**。不为验证添加按钮、Agent字段、任意方法执行API或绕过原授权。原SEMANTIC/HYBRID服务合同仍由直接reader消费者/既有合同测试使用，本批不能据代码索引的空且incomplete结果宣称仓库没有其他调用者。

### 本批实现与保留

| 层/场景 | 实现、归属及限制 |
|---|---|
| semantic登记/配置 | 复用第9节既有memory credential fetch和原remote factory的fetchImpl，按实际请求解析对应apiToken；owner/epoch映射从两类扩为三类，加入semantic capability及Secrets绑定失效。没有新helper/Provider/连接/timer/缓存 |
| shared reader | 原factory增加可选同步resolveSemanticRetriever；LEXICAL及无效语义输入不解析semantic。合法语义读取才按当前有效贡献/绑定/健康resolver选择；getter未提供时保留原semanticRetriever直接注入。**提供getter后，其undefined/异常是权威拒绝，不能回退捕获的旧对象或词法结果** |
| 过滤与算法 | 原context、governance、supersession/canonicalization候选过滤、score校验、排序、HYBRID合成、分页和结果合同保持；先产生已授权候选再送原semantic服务，不改变记忆/EC数据语义或持久化 |
| Host接线 | reader传原resolveContextMemorySemanticRetriever函数，不捕获一次性结果；Host不重建reader来响应启停/绑定。删除已无消费者的提前Secret helper；P12 refresh改为纯同步登记，设置保存不再刷新任何P12 runtime。端点/timeout仍来自启动配置，不新增可改设置 |
| 凭据/竞态 | 与DLP/EC同一helper：未配置才匿名，Secrets缺失/空值/读取失败不匿名降级；实际请求前及await后复核当前resolver、owner epoch、Abort与同一Secrets runtime。原设置写入前失效/计数/finally释放及Secrets生命周期变化保护覆盖semantic；共享安全服务不随UI启停销毁 |
| 未使用/恢复 | 构造、配置probe、词法页面、Secret保存和启用未使用不解密；同一reader在当前Provider重新可用后可再次选择。卸载不删密文；共享reader与Secrets不绑定可选semantic/UI生命周期 |
| 在途及范围 | 已发出的search响应仍遵循原在途READ合同；本批没有响应后跨Host撤销重验、业务WRITE冻结、超时强制终止外部Secrets或JS明文擦除承诺。配置型HEALTHY仍只表示URL协议，不证明Key/远端可用 |

这是原有选择/凭据边界的修正，不扩展Human或Agent的语义检索产品能力。三类原P12的提前token解析局部问题在本批实现收口，但R3所有Provider/消费者资格尚未关闭；配置存在时原bootstrap自动安装行为也未改变，待按原启动策略核对保留理由/迁移条件，不能仅凭URL认定全生命周期合格。

### 验证分级

新增4项组件/合同集成：构造/LEXICAL/非法输入不resolve semantic；同一reader逐次选择、过滤后传候选；缺失/异常不回退旧注入，恢复可用且旧直接注入保持；原registry/resolver/binding、remote semantic runtime、reader和真实加密file store组合覆盖并发首次请求、停用、显式绑定不可用与解除、轮换新token、读取失败拒绝/恢复、删除匿名。替代选择只用测试对象，不新增第二Provider试点。复用第9节9项Promise屏障测试验证等待期间epoch往返、Abort及Secrets替换，不重复造竞态框架。

另新增真实Host三次启动联合回归：以test-only crypto.createDecipheriv实际计数、已存合成token及独立临时Memory验证启动/配置probe/保存/坏put修复/绑定/启停/卸载重装/停用和有效重启零解密，并保持原词法Memory Search页面结果。测试把意外fetch显式计数/拒绝，既有TCP block保持；不替换项目源码、不加生产测试开关、不访问真实凭据或业务数据。

**Host联合用例不执行semantic业务请求**：现有已核对HTTP入口走LEXICAL，正向semantic使用证据来自上述服务合同集成。Host零解密、合同集成及helper屏障各自证明有限范围，不拼成“真实HTTP semantic在途启停/绑定完整矩阵”；后者留R4按实际产品消费者验收，不为凑证据扩展Agent。

本地Node24.19部分固定SHA源码及临时类型擦除，新4项+原9凭据/10资源合计23/23通过；新Host/fixture、擦除server语法通过。非正式全仓npm ci/build，未本地真实Host/browser/数据库。正式Node22/build、新Host结果、原P1.2/P1.3与DLP/EC回归及本轮四组合以本PR最终准确head CI为准，永久结果链接记PR收口。静态基线/冷禁入不放宽；本批无新增生产模块，不推断耗时或生产收益。

读取复用前批完整启动/交付/装载/Secrets/AI-native/Help/Eidos权威，并核对未变基线。新完整读取context-memory runtime及新测试；semantic manifest/runtime复用并核对，Host局部：reader两处登记、resolver、P12 refresh、bootstrap、生命周期/绑定/设置及直接调用；Agent host-tool-catalog局部：readContextMemory接口和search/recall/audit/read适配；memory-governance-page局部：search函数/路由；context-memory-actions全文。旧semantic合同测试复用其原直接注入/过滤断言，不声称通读全Agent或所有插件。来源为本仓源码，无新增外网研究。

证据：[semantic-request-credentials-20261020.json](evidence/semantic-request-credentials-20261020.json)；[兼容评审](../../ui-design-reviews/semantic-request-credentials-20261020.md)。Help影响：原Secret显式保存/删除、Provider拒绝与词法页面说明保持有效，无新增用户步骤或字段；当前选择及配置probe限制在本节说明，不宣称新增Human semantic能力。

### 接续与停止条件

本批最终CI合格后合并，停止追加P12 token拆分。下一批回到R3尚未逐类完成的EVO observatory与session/OIDC等实际构造/调用副作用，并核对配置驱动安装的权威/退出条件；复用已验证纯工厂、共享安全保留和调度结论，不重做新Provider试点或认证产品。R1冻结SOP身份/资格、R2配置SQL/原owner责任、R4跨层最终矩阵继续开放；A03/A05原实施缺口不变。

插件平台架构治理 固定进度表（当前专项）

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| A01 轻量宿主与按需装载 | 部分完成；P12 token请求边界、reader当前选择 | 后续见第11节；R1/R2/R4保留 |
| A02 安装声明与执行边界 | 已闭环 | 无需进一步操作 |
| A03 账本管理与编译边界 | 部分完成 | 权威结果查询与幂等恢复 |
| A04 成员关系与访问授权分包 | 已闭环，保留两包 | 无需进一步操作 |
| A05 三种会话服务定位 | 部分完成 | 正式策略、兼容迁移及其他入口 |
| A06 生命周期覆盖范围 | 已闭环 | 全平台实施缺口归A01 |
| A07 个人/企业上下文边界 | 已闭环、已移交原Agent专项 | 无需本窗口进一步操作 |
| 插件平台架构治理 整体 | 7项：4闭环、3部分完成 | 尚未整体收口 |



## 11. 2026-10-20增量：session/EVO/OIDC资源与失败缓存恢复

基线main `91ffb9bdae2a34ebfc6f677a0eb6a3d9aeaa99fa`（#1079，原#1020已在此前祖先链确认），过程分支 `fix/governance-oidc-cache-resource-boundary-20261020`。本节只接续R3现有身份及观测Provider，不扩展认证产品、Agent、第二Provider试点或UI。#1079的312模块/246边、221行为/6守卫属于[历史结果](https://github.com/jiangxng/EVO-App-Platform/pull/1079#issuecomment-6291061712)，不能当作本批实测。

### 工厂、共享权威与实际触发

| 入口 | 构造/登记与调用事实 | 判断、范围与退出条件 |
|---|---|---|
| static session / bearer session | 解析JSON、克隆内存Session；current/resolve才检查期限/比较token，health只读内存 | 保留轻量同步工厂；不为减少模块数包懒代理。Bearer health描述配置数量，不证明每个token有效 |
| managed session adapter | 仅捕获共享service；空token/冲突token不调用service；有效resolve才查索引，显式probe才list | 保留同步共享安全权威，不能绑定单个UI启停；本批回归验证同一adapter看到后续撤销 |
| managed service / JSONL store | store构造exists/read/解析日志；service创建时list并物化Session与token hash索引；issue/revoke/rotate才append，resolve不逐次重读文件 | EA1A §6明确要求受管认证启动重放，属于受管模式安全职责保留。**Host受管模式关闭但显式设置session文件时仍会读取**，这一资格缺口未获例外，后续单独核对；不把adapter零访问扩为整Host零I/O |
| OIDC runtime / registry | 构造只校验配置并持有Map/未初始化Promise；begin才discovery、生成state/nonce/PKCE；complete消费state后交换token/验JWT/JWKS；显式health才网络 | 保留工厂，注册/发现不做认证。请求已有8秒含正文deadline、redirect:error及finally清理；本批修复失败Promise永久缓存，成功缓存不变 |
| OIDC Host refresh | issuer/clientId缺失则移除runtime；完整配置可describe并resolve clientSecret，注册时不发网络 | **提前解密仍是R3待整改项**，历史Host-wiring文档不能替代A01资格证据。认证Basic/public-client与登录事务需单独设计验证，不能机械复制Bearer token helper |
| EVO observatory runtime | 构造仅闭包；query先解析enterprise映射，缺失零fetch，有映射GET企业，再按指标/目标请求；health显式GET readiness | 保留工厂；probe仅可达性，不证明业务授权/映射/查询成功。原query/probe缺本地deadline/Abort/redirect:error，仍留R3/R4，不用revision bridge的10秒合同替它验收 |
| EVO revision bridge | 构造无timer/网络；有订阅兴趣后才启unref interval、poll；原有取消、有限请求和dispose | 复用已有协议/真实资源回归，不重做生命周期试点；bridge和query是不同请求端口 |
| 配置驱动安装/映射 | 一次默认安装有journal并保留原停用；Host另有配置驱动bootstrap分支：EVO flag、managed、static/Bearer、memory/P12等。OIDC configureRuntime不等于安装；应用映射非空还可能安装/启用binding包并bind写入 | catalog、已安装/有效贡献、配置完整必须分开。配置自动重装/映射写入的资格、来源权威与退出条件未闭环，不能宣称配置存在仍“未安装”或原默认安装journal覆盖全部分支 |

上述保留只针对实际无资源闭包、内存合同和明确受管认证职责。未来替换共享认证权威须有消费者迁移/重启/撤销证据，不因某个可选页面停用销毁索引。OIDC待完成事务当前只在complete检查TTL，容量/过期清理和成功JWKS长期刷新策略不在本批实现，仍需按原owner资源预算评估；不引入新timer掩盖它。

### 有界修复与安全合同

原discoveryCache/jwksCache把拒绝Promise永久保存，瞬时网络/正文失败后同一runtime无法通过显式新登录恢复。现在只在捕获拒绝时、且缓存仍指向当前pending的情况下清空，继续向原调用者抛错。成功结果及并发首次请求共享保持；不自动重试discovery/token写请求，不放行旧callback，不降低issuer/audience/nonce/期限/签名校验。JWKS未知kid原一次force refresh仍保留；引用身份比较避免旧拒绝误清替代缓存，不新增通用cache框架。

### 证据分级与读取

新增7项：并发失败discovery共享且新begin恢复/成功缓存；JWKS失败旧state不可重放、新begin完成RS256认证并缓存；求值前资源守卫覆盖六个runtime根、配置工厂和registry发现；managed调用/撤销；EVO缺映射零出站、显式请求/probe失败恢复；OIDC refresh有意Secret读取且零网络；discovery正文等待8秒Abort清理后新begin恢复。守卫复用原文件/网络/timer/子进程拦截与吞异常自检，不把注入计数冒充真实Host资源测量。

本地固定SHA部分源码、Node24.19临时类型擦除：新增2个缓存回归在旧实现上均失败，原8项通过；修复后新7+既有13合计20/20通过。**非正式全仓npm ci/build，未本地运行真实Host、浏览器或数据库**。正式Node22/build、认证协议与原Host矩阵、本轮四组合以PR最终准确head CI为准，永久结果保存在PR收口评论。Lightweight CI新增这三个测试文件；静态基线/冷禁入没有放宽。无新增生产模块，不推断模块降幅或生产收益。

完整读取：上述五类runtime、OIDC host-runtime、identity-session-store、revision bridge、startup-defaults；OIDC provider/host既有测试及本批测试；EA1A Session、EA1B2A OIDC合同、EA1B2B Host接线权威全文。manifest读取身份/能力/Secret字段，不声称重读全部UI元数据。Host只读managed构造、Provider注册/refresh、配置bootstrap及EVO映射绑定段，不声称通读全部server或消费者。复用已读项目启动/交付、装载架构§11及治理交接（运行图至§16、Provider至§10）、Eidos和Help权威，无新增外网研究。共享View State原零文件构造结论保持。

证据：[oidc-cache-resource-boundary-20261020.json](evidence/oidc-cache-resource-boundary-20261020.json)；[认证恢复兼容记录](../../ui-design-reviews/oidc-cache-resource-boundary-20261020.md)。Help影响：仍使用原显式新登录流程，无新字段/步骤/产品入口；失败旧callback拒绝，不自动重放，Secret管理与管理员授权不变。未执行生产部署或Human验收。

### 下一批与停止条件

本批准确head CI合格后合并，停止追加工厂拆分。下一批优先处理**OIDC Host提前clientSecret解析与实际登录事务的资格/恢复边界**，复用原同步认证合同、原Secret管理与Provider resolver，先核对当前选择和在途会话责任，再确定最小修正；不要把P12 helper直接套在Basic认证上。之后保留：managed关闭但指定文件、EVO配置映射启动写入、配置驱动安装权威/退出条件、query资源期限与其余Provider资格。R1冻结SOP身份/资格、R2原Agent配置SQL责任/资格、R4最终跨层矩阵均开放，A03/A05不由本批代关。

插件平台架构治理 固定进度表（当前专项）

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| A01 轻量宿主与按需装载 | 部分完成；session/EVO/OIDC资源分类与失败缓存恢复 | 后续见第12节；R1/R2/R4仍开放 |
| A02 安装声明与执行边界 | 已闭环 | 无需进一步操作 |
| A03 账本管理与编译边界 | 部分完成 | 权威结果查询与幂等恢复 |
| A04 成员关系与访问授权分包 | 已闭环，保留两包 | 无需进一步操作 |
| A05 三种会话服务定位 | 部分完成 | 正式策略、兼容迁移及其他入口 |
| A06 生命周期覆盖范围 | 已闭环 | 全平台实施缺口归A01 |
| A07 个人/企业上下文边界 | 已闭环、已移交原Agent专项 | 无需本窗口进一步操作 |
| 插件平台架构治理 整体 | 7项：4闭环、3部分完成 | 尚未整体收口 |



## 12. 增量：OIDC token交换凭据与原登录事务资格

基线main `ae704ad731e1e7e6a9eec9a1ca2722f7d4244ce9`（#1080，已包含原#1020），过程分支 `fix/governance-oidc-request-credentials-20261020`。接续第11节的提前clientSecret解析，不新建认证产品、Provider试点、Agent或UI。#1080的312模块/246边、241行为/6守卫为[历史结果](https://github.com/jiangxng/EVO-App-Platform/pull/1080#issuecomment-6291358197)，不是本批测量。

### 原合同及有界修改

原Host refresh会describe/resolve并捕获明文，即使未安装/停用/未登录。OIDC有state/nonce/PKCE事务，不能直接套P12 Bearer helper。配置重建实例本来就使旧state失效；未配置clientSecret的public client及已配置时client_secret_basic合同保持。

| 层/场景 | 实现与限制 |
|---|---|
| configure/registry/begin/discovery/probe | 仅配置登记，不describe/resolve Secret；begin仍执行原discovery/PKCE。共享Secrets密文/主密钥启动加载保留，不称整Host零I/O |
| 实际token交换 | 原runtime新增可选resolveClientSecret端口，消费state、校验callback/TTL及discovery后才读。原fetchJson 8秒期限覆盖Secret等待、token fetch及正文；signal过期/上下文失效拒绝迟到发送，无新增生产模块/明文或Secret Promise缓存 |
| Basic/public client | 每交换从当前Secrets describe；明确未配置才不带authorization并发送client_id。缺服务/异常/空值拒绝；resolver的undefined/异常权威，不fallback旧明文。未提供resolver时兼容原独立工厂clientSecret直接注入，IdP Basic支持及JWT校验不变 |
| 登录事务 | begin捕获仅含registry/current resolver/epoch的复查闭包，存在原临时事务内。complete、Secret各await后、token/JWKS响应后重验；原state单次消费、旧callback拒绝与新登录恢复保持，不自动重放token |
| Host资格 | 单OIDC owner epoch/写计数，无Secret。OIDC及identity.authenticate贡献包生命周期、Secrets贡献生命周期、auth/Secrets绑定保存/删除、OIDC设置写入均失效旧事务；当前选择须仍为本runtime，managed登录/public base完整。停用再启用或绑定往返不会复活旧等待 |
| 设置/Secret失败 | 原校验、管理员授权、显式加密put/remove与审计保持。写入前epoch递增/计数，finally重建runtime并释放，覆盖并行/失败；普通保存不解密。不声称原store事务回滚 |
| Session签发 | authenticationFlow可选assertCurrent，Host仅为generic.oidc接入；Provider返回、目录callback await后及sessions.issue前复查，阻止迟到cookie。其他Provider及logout/revoke保持；OIDC_CONTEXT_CHANGED复用503认证不可用 |
| 停用/卸载/重启 | 可选OIDC不拥有共享Session/Secrets存储，卸载不删密文；已签发Session仍遵循原撤销/过期合同。原临时state随配置重建/重启丢弃，新登录恢复。已发token可能在IdP消费，拒绝迟到本地签发，不宣称回滚/取消IdP |

无新通用加载/认证框架。EA1B2B第5节“refresh resolve Secret”成为被本增量取代的历史实现事实；最低配置、目录/安装/有效贡献和原生产登录门禁仍适用。

### 验证及读取分级

本地Node24.19固定SHA部分源码+临时类型擦除：新增7组件（逐次Basic轮换/public、坏Secret拒绝/恢复、describe及resolve两阶段失效、begin/complete与token/JWKS迟到、Secret等待期限、目录await后无Session）加原31，38/38通过。Host/fixture及擦除server语法通过。未本地正式npm ci/build、真实Host/browser/数据库。

新增真实Host联合用例用test-only真实crypto.createDecipheriv计数、临时加密文件及既有HTTP设置/绑定/生命周期和/auth/login、/auth/callback；合成RS256 IdP只注入外部fetch，不替换生产源码或Secret服务。覆盖预存密文/未用/保存零解密、停用重启/启用、实际Basic登录/重放无cookie、轮换、失效旧state、在途token绑定往返无cookie、新登录恢复、删除后public及停用重启。Host未模拟Secret Promise竞态；两阶段/Abort及目录await由组件屏障验证。正式Node22/build、Host及原矩阵、本轮四组合须以最终head CI为准，永久结果记PR收口；静态基线/冷禁入不放宽。

完整读取OIDC runtime/host-runtime、认证flow、request-authentication/security、cookie及相关测试；Session store、Secrets/resolver复用已完整读取并核对blob。EA1B2A协议与EA1B2B接线全文本批重读；EA1A、装载架构§11、项目启动/交付/文档/Help及Eidos复用既有阅读。Host局部核对auth resolver/flow/路由、OIDC refresh、设置/绑定与生命周期，不声称通读整个Host/Agent。开放PA05 shutdown PR仍属其owner，本批不覆盖对应段，不改全局状态。无新增外网研究。

证据：[oidc-request-credentials-20261020.json](evidence/oidc-request-credentials-20261020.json)；[兼容评审](../../ui-design-reviews/oidc-request-credentials-20261020.md)。Help无新增字段/步骤，原显式新登录/Secret管理适用；未真实IdP/Human验收或部署，不代关生产登录/A05。

### 下一批及停止条件

本批准确head CI合格后合并，停止追加OIDC拆分。下一批先核对**managed模式关闭但指定Session文件仍启动读取**的资格/必要性，保存配置组合证据后决定最小修正，不拆必要共享安全索引。EVO映射启动写入、配置bootstrap安装权威/退出条件、query/probe期限及OIDC事务容量/过期治理仍在R3。R1冻结SOP、R2原Agent配置SQL责任/资格、R4最终跨层矩阵与A03/A05保持开放。

插件平台架构治理 固定进度表（当前专项）

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| A01 轻量宿主与按需装载 | 部分完成；OIDC实际交换凭据及事务资格 | R3配置安装/其余资格；R1/R2/R4开放 |
| A02 安装声明与执行边界 | 已闭环 | 无需进一步操作 |
| A03 账本管理与编译边界 | 部分完成 | 权威结果查询与幂等恢复 |
| A04 成员关系与访问授权分包 | 已闭环，保留两包 | 无需进一步操作 |
| A05 三种会话服务定位 | 部分完成 | 正式策略、兼容迁移及其他入口 |
| A06 生命周期覆盖范围 | 已闭环 | 全平台实施缺口归A01 |
| A07 个人/企业上下文边界 | 已闭环、已移交原Agent专项 | 无需本窗口进一步操作 |
| 插件平台架构治理 整体 | 7项：4闭环、3部分完成 | 尚未整体收口 |

