# 运行图装配、兼容迁移与剩余边界

2026-10-18（香港），基线 main `b9271dce6525cdf322227c80cc762d564d6054f0`（#1013）。归入A01/R1，不新增专项。本批收敛兼容启动路径，不声称运行图服务已经完全按需装配。未部署、未读取或迁移真实企业数据。

## 1. 全部直接装配消费者

本表以`server.ts`中`enterpriseOperatingGraphService`、`enterpriseOperatingGraphDefinitionPersistence`、`eogExpectedSopService`的全部引用检索及装配段核对为范围；不是声称逐行审计全部下游业务实现。

| 消费者 | 使用对象与触发 | 后续迁移约束 |
|---|---|---|
| 图service与SOP service | 图service持有definition persistence；SOP持有共享definition repository与图service | 同一企业定义权威，不拆第二份仓库 |
| 启动预览种子 | 显式APP_PLATFORM_EOG_PREVIEW_SEED_JSON，使用图service get/create/apply | 必须保留原校验、幂等及启动错误，不能误算普通页面调用 |
| bottleneckRuntime | 按需Provider factory取得SOP service | 分析消费者不能被2D页面停用无差别切断 |
| Agent图工具/当前2D编辑器/预期SOP/观测工具 | `createEnterpriseAgentHostToolCatalogV010`装配段共享graph/SOP；部分具备各自feature回调 | 既有授权、上下文和当前编辑器目标必须保留；不能在工具目录发现阶段连带创建全部业务资源 |
| Human图命令/SOP命令/图视图命令 | Action Router启动注册handler，注入共享service | 元数据登记与执行分开；保持原命令及授权，不改动作协议 |
| 运营观测命令/桌面视图 | 注入graph service及观测provider resolver | 读取事实与编辑图不等同同一插件资格 |
| 2D viewer workspace/selection | 已有lazy handler内注入graph service | 使用原lazy入口；不能因移动共享service破坏当前只读消费者 |
| 移动端观测/3D viewer/空间观测 | 各自handler注入graph service | 不把2D designer作为所有读视图的唯一生命周期owner |
| definition persistence | 只用于图service构造 | 公开definition/projection仓库另有独立消费者，不能随图UI停用清数据 |

图service及SOP工厂主要创建方法闭包；没有从这项构造直接推断数据库连接、网络请求或数据全量读取。静态model/page及service仍在冷路径，这是下一步真实遗留。

## 2. 兼容启动路径的决定与实现

采用`manager/eog-startup-compatibility.ts`三个有明确前置条件的函数：

- 旧图文件存在才动态导入原`legacy-definition-migration`，继续调用原算法。
- 旧SOP文件存在才动态导入原`eog-sop-migration`，继续调用原算法。
- preview配置非空才导入原`eog-preview-seed`，继续原parse/apply。

Host仍顺序等待：旧图迁移 → 图service/显式预览 → 旧SOP迁移 → SOP service → 后续监听。没有后台异步迁移、第二套算法、影子数据或新增配置。只做文件存在性检查，不尝试吞掉读取/JSON/业务冲突错误；真正迁移时原函数再次核对文件，后续新增文件与原逻辑一样需重启。卸载插件不自动删除源文件或定义。

**保留必要启动例外的理由：** 旧图和SOP迁移写入共享企业定义，不只是2D页面私有数据，其他定义消费者也需要同一事实；不能直接改成“先打开2D页面才看见旧定义”。兼容迁移在旧文件存在时仍先于服务对外提供请求；无旧文件不加载实现。退出例外需确认旧格式已退休及所有调用者迁移，不凭插件未安装推断旧数据可丢弃。显式预览种子保留既有可重复启动合同，不推广为普通插件默认初始化许可。

排除只用动态import包装却无条件启动、跳过迁移校验、把失败推迟到随机用户请求，以及改变graph/SOP数据结构。当前拆分只移除冷路径兼容代码；共享运行图service工厂仍在启动段，不能把本批当作其生命周期实现。

## 3. 验证与CI

构建及14项定向测试通过：4项真实Host兼容测试、原图持久化/迁移与定义仓库、原预览种子测试。测试使用临时目录、最小安装、loopback监听与TCP出站阻断。

| 真实Host场景 | 结果 |
|---|---|
| 无旧文件且preview为空白 | 三个兼容模块都未加载，无企业定义文件创建 |
| 旧图与旧SOP存在 | 监听前写入同一企业定义库，原文件字节不变；重启定义不变 |
| 已迁移旧图后来被改成同revision不同payload | 原MIGRATION_CONFLICT错误阻止启动，已有定义不改 |
| 显式preview | 只加载preview兼容模块，原get/create/apply生成节点；重启定义不变 |
| 损坏图JSON、无效SOP快照、无效preview | 启动失败而不是忽略错误；fixture没有产生业务定义 |

四组合审计新增三模块禁入断言，测试加入已有Lightweight Host CI。静态历史边269→266，仅删除退休边，不扩基线。完整冷启动报告见[evidence/eog-startup-compatibility-audit-20261018.json](evidence/eog-startup-compatibility-audit-20261018.json)；测试输出与代码hash见[验证证据](evidence/eog-startup-compatibility-validation-20261018.json)。启动观测不是性能压测，不宣称已完成真实用户图编辑或远端业务验收。最终CI及合并标识见本批PR。

## 4. 剩余与接续

R1本批只完成兼容路径隔离及消费者边界。下一步处理**共享图/SOP service的合法首次使用装配**：先保持同步业务接口的消费者兼容，区分注册元数据与运行调用，明确读视图、编辑、SOP及分析各自资格；不将所有消费者绑到2D designer开关。原HTTP/Agent授权拒绝不得触发新增业务实例，迁移/显式preview作为上述例外单独验收。同步接口不能靠未await的Promise伪装为已加载。

所有更改继续使用现有公开合同及共享定义存储，不新增通用加载框架。其他R2 Agent会话SQL、R3 Provider登记分类、R4最终矩阵保持原状态。固定7项、4闭环、3部分；不因本批删3条边而改变整项完成数。

## 5. 阅读记录

无新增外网资料。复用前批已完整读取的项目规则、开发交付规范及装载架构§11；完整读取本批旧图迁移、旧SOP迁移、preview-seed、SOP service及新增文件；局部核对图service工厂、definition persistence/仓库边界、server全部上述变量引用及装配段。既有测试读取与实际运行分开：定向原测试完整执行，未声称重读整个Host/Agent/2D实现。开放BEX #999等由原owner保持，未编辑其业务文件。


## 6. 后续增量：共享图/SOP实例在首次方法调用时创建

基线main `48a9a63d79447089f22b209621b52a14618f34b2`（#1014）。前文“service仍启动构造”是该批历史事实，本节更新实例装配；**实现模块仍被静态导入**，未称冷路径模块整改完成。

新增`manager/eog-service-runtime.ts`，为现有同步graph/SOP接口提供显式、类型检查的逐方法委托；Host注册handler/tool时只传此接口，不调用业务工厂。首次实际方法调用才创建对应服务；图的definition persistence同时创建。两套实例独立：SOP list/listPublished/history只使用repository，不创建图服务；SOP create/revise需要检查图节点时，通过同一graph接口取得原服务。各方法继续传原request，不复制存储、缓存权限或重写算法。

采用同步委托是为了保持现有Human、Agent、2D/3D/观测消费者的返回类型。排除异步Promise强转为同步service、全局Proxy拦截和一次性改变所有业务接口。当前纯同步工厂在单进程调用中完成，没有await导致的并发初始化窗口；成功缓存一次，工厂抛错不缓存，可重试。未来工厂若变为异步/持有连接，此合同不适用，必须显式升级调用者和停止策略。

### 资格、作用域与停止

- 本层是Host内部装配接口，不是授权器；沿用各Action Router/工具/页面既有Feature和权限检查，拒绝发生在调用service方法之前。不新增“2D停用则整个共享图服务停用”的错误规则。
- 实例是原有进程共享、无用户身份缓存的纯方法集合；每次仍显式传enterpriseId。原共享定义仓库不变，没有新连接、定时器、订阅或后台任务。
- 停用由原消费者入口拒绝新调用；实例创建后可保留供其他有效消费者读取，重新启用使用原权威数据。无需给无独立外部资源的闭包虚构dispose，不承诺ESM卸载、跨进程冻结或撤销已发出的WRITE。
- 原迁移及显式preview例外保持；preview首次get可以触发图实例，而旧图/SOP迁移本身只使用定义仓库。没有preview时注册不会因此创建实例。

### 已验证与限制

本地构建、19项定向测试通过：新增5项使用真实图/SOP工厂、真实Action Router/handler及计数回调，验证注册零工厂、停用/无Context/拒绝写入零创建、SOP只读不连带图、8个并发调用只创建一次、图编辑与SOP创建/修订/发布使用同一仓库、企业隔离、停用拒绝和恢复保持、两工厂分别失败后重试。其余14项保留真实Host兼容迁移/种子/重启及原业务定义测试。

工厂计数是组件装配证据，**没有在生产Host添加诊断端点，也不冒充真实Host全入口工厂计数或Human验收**。真实Host测试确认本批接线仍满足迁移/种子/重启合同；全部Agent/页面组合另由CI覆盖既有回归，不能据此称每条鉴权路径已全审计。未扩展竞态安全承诺：异步授权等待时的生命周期再核对仍由原入口合同负责，本层没有修复全部此类竞态。

新增测试进入Lightweight Host CI；静态边仍266，基线不变。没有宣称本批减少模块数/RSS；本批价值是把工厂触发限定在实际方法使用，并以回归防止日后构造成本增长时重新变成默认常驻。详见[原始输出/hash](evidence/eog-service-on-use-20261018.json)。未部署，最终CI/提交见本PR。

### 明确下一步

R1的“实例提前创建”已按上述同步合同处理；运行图model/page/action实现仍在启动依赖链，R1整体不关闭。下一步只选择当前静态页/命令装配入口，核对实际消费后将可独立的实现放入现有lazy handler；保持本层同步公共接口和所有既有授权。不能为了减少模块数新造通用框架、移除必要安全机制或重写2D交互。R2/R3/R4维持收口清单原状态。


## 7. 2026-10-19增量：3D查看器页面与读取命令按需加载

基线main `83a168338926b87e8295c2a3a54bca4b9082180e`（#1015）。本批只迁移中性3D Viewer的`apps/eog-3d/workspace-page.ts`，不重写2D编辑、观测叠加或共享图模型。

Host不再静态导入3D workspace实现。读取命令使用现有`createLazyAppActionHandlerV010`：合法路由调用后装配原handler，加载Promise共用及失败重试沿用原机制；加载完成及每次执行前再次检查3D Feature。页面保留原有效性/会话/Context解析，进入对应页面分支才import，await后再检查有效性。未修改原读方法中的Human/企业/graphId检查，未将metadata发现当授权。

命令常量迁入已有轻量package清单；旧workspace出口继续重导出同一值，旧package别名也保留。没有复制命令字串或另造注册框架。页面对象、中文/英文文案、route、source、readCommand与空间投影算法不变。详情见[界面兼容评审](../../ui-design-reviews/eog-3d-lazy-20261019.md)。

读取handler无独立后台资源；原graph/SOP首次使用装配与共享view store保持。停用后命令/页面拒绝，已写view数据不删；重新启用可复用原handler和数据，不承诺ESM缓存卸载。安装但未使用不加载workspace。其他空间投影消费者仍可加载共享spatial-projection，不能据此说整个3D渲染链都已退出Host。

本地构建及11项定向测试通过，其中新增真实Host联合测试验证：启动和安装未用不加载；先停用依赖它的观测包，再停用查看器，页面404/命令ACTION_FEATURE_NOT_ACTIVE且模块不加载；启用后真实页面等于原factory中文输出；空图返回原空态；已有图并发读结果一致；停用拒绝且view文件字节保留；再启用页面与结果相同。测试为临时企业、合成图、loopback与出站阻断；没有真实用户/browser视觉验收。

首次本地编译发现handler execute必须返回Promise，已修正为async；首次生命周期测试揭示实际依赖阻断，按真实依赖先停用观测，不改生产规则。旧`eog-3d-observatory-convergence`的fixture未包含观测已要求的2D viewer，补入原eog2dPackage；原断言不放宽。最终11项结果见[验证输出](evidence/eog-3d-lazy-validation-20261019.json)。页面/命令在途停用的精确时间窗未通过故障注入验收，不以顺序HTTP测试冒充竞态证明。

静态边266→264，只删除两条退休边；四组合审计新增workspace禁入断言，报告见[eog-3d-lazy-audit](evidence/eog-3d-lazy-audit-20261019.json)。新Host测试接入Lightweight CI。没有生产部署/业务数据操作；最终CI/提交以PR记录为准。

下一步聚焦同级移动/桌面/空间观测页面与命令的静态装配，按实际依赖选择有界入口；3D Viewer本入口已迁移，不重复改造。R1其他model/page/action依赖未全部关闭，R2/R3/R4保持原清单。固定7项、4闭环、3部分。

本批完整读取3D workspace、package/兼容导出及既有lazy-handler；定向读取Host两处入口、依赖关系和原测试。复用已读装载/交付权威。因涉及页面源码的常量出口调整，完整读取Eidos设计总纲与检查清单；原始URL/blob hash记录于界面评审。没有新增外部研究或视觉方案。

## 8. 2026-10-19增量：空间运营观测页面与读取命令按需加载

基线main `65f8776b7e1cc5b8cbcbde8c4c93687fa27efc65`（#1016）。本批迁移同级`apps/enterprise-observatory/spatial-page.ts`，保持空间观测与中性3D查看器各自的Feature和入口。Host注册原读取命令时使用既有lazy handler，页面进入原有效性/会话/Context分支后才动态导入；两处均在await后复查观测3D Feature。原事实Provider选择、时间范围解析、分析叠加、企业校验、图不存在错误及view store保持原实现。

常量归入现有轻量package，原spatial-page和manager兼容出口继续有效；不是新建插件或复制业务实现。读取handler无新独立后台资源。已加载ESM允许缓存，停用拒绝新调用并保留视图数据；没有承诺卸载模块缓存、撤销已经发出的外部请求或跨进程冻结。

本地构建及12项定向测试通过。新增真实隔离Host测试覆盖：冷启动与安装未用不加载；停用页面404/命令拒绝且不加载；启用页面与原factory在相同时刻的中文JSON等价；时间预设保留；不存在图仍报原错误；已有合成图并发读取一致；停用保留view文件，恢复后结果一致。其余回归覆盖lazy handler、3D/观测独立生命周期、物理归属和原空间投影。测试使用loopback、临时企业和出站阻断；没有真实事实服务、浏览器视觉或精确await停用竞态的故障注入验收。

静态边264→262，仅删除退休实现路径的两条边。四组合冷启动实测均345→342模块、0注册interval、96归档文件、0阻断出站、正常退出；新增空间观测实现冷启动禁入断言，新Host测试接入Lightweight Host CI。归档文件不等于浏览器下载量，模块减少不代表整个观测依赖已移出冷路径。详见[eog-spatial-lazy-audit](evidence/eog-spatial-lazy-audit-20261019.json)、[验证记录](evidence/eog-spatial-lazy-validation-20261019.json)及[界面兼容检查](../../ui-design-reviews/eog-spatial-lazy-20261019.md)。最终CI/合并以对应PR为准，未部署。

本批完整读取空间观测实现及新增测试，定向核对Host装配/页面分支；复用前批已读项目规则与Eidos设计权威，无新增外部研究。下一步限定在桌面/移动观测的现有静态页与命令装配，先核对消费者再选择迁移；共享模型及R2/R3/R4尚未闭环。固定7项、4闭环、3部分，不增加产品功能或Provider试点。

## 9. 2026-10-19增量：桌面与移动观测入口独立按需加载

基线main `eeb88493ace53cbe67c4971c49c99a0b158d77da`（#1017）。本批核实桌面页通过移动路由常量静态导入了完整mobile-read实现；两端页面与三个页面命令又在Host启动链装配。采用既有package metadata和lazy handler，排除继续通过业务实现查路由、一次加载两端、另建注册框架。桌面路由现在只引用package常量，旧页面/manager/eog-2d-viewer兼容出口仍保留。

Host分别延迟装配桌面read、桌面operation与移动read handler；原operation继续返回`EOG_2D_VIEWER_READ_ONLY`。页面按source只import对应实现，两处页面及三个命令在await后再次核对原2D Feature。原Human/企业检查、Provider选择、时间范围解析、事实/分析展示、空图成功返回及view store不变；停用拒绝新调用、恢复保留原数据。不承诺ESM缓存卸载或撤销已发外部请求。

本地构建、17项定向测试通过。新增两个真实Host案例分别以桌面/移动为首个入口，验证冷启动/安装未用/停用拒绝不加载、打开与读取本端不加载另一端、相同时刻页面JSON与原factory等价、空图原输出、并发读取、桌面只读拒绝、停用恢复。原移动fallback、只读合同及合成事实投影测试同时通过。首次运行发现旧2D切换fixture缺少现有3D依赖，补入eog3dPackage，未改生产依赖或弱化原断言。新Host测试进入Lightweight Host CI。

静态边262→257，删除5条旧依赖；四组合均342→338模块、0注册interval、96归档文件、0阻断出站、正常退出。新增desktop-page/mobile-read-page冷启动禁入断言。报告见[eog-observatory-surfaces-lazy-audit](evidence/eog-observatory-surfaces-lazy-audit-20261019.json)、[验证记录](evidence/eog-observatory-surfaces-lazy-validation-20261019.json)、[界面兼容检查](../../ui-design-reviews/eog-observatory-surfaces-lazy-20261019.md)。测试不是浏览器视觉验收、真实外部事实Provider集成或精确在途停用故障注入；未部署，最终CI以PR为准。

本批完整读取移动实现、定向读取桌面metadata/page/handler与Host装配及相关原测试；复用前批已读设计/装载权威，没有新增外网研究，不声称通读全部桌面投影算法。下一步检查剩余通用observe/analyze命令与共享运行图模型、Provider装配链，先辨别必要共享依赖与业务实现，避免把本批三个页面入口关闭等同R1全关闭。R2/R3/R4不变；固定7项、4闭环、3部分。

## 10. 2026-10-19增量：通用观测与分析命令按需装配

基线main `27266ba2e9f1672b66465b8a116b5dc8d6960efb`（#1018）。Host的两个Human命令observe/analyze仍静态导入并创建handler；本批使用现有lazy handler，命令标识迁入既有package，旧actions/manager/eog-2d-viewer出口保持。按固定两个commandCode选择原工厂handler，身份由已有lazy机制验证；await后复查原2D Feature。没有新通用框架或业务算法复制。

原Human/企业检查、输入解析、事实/分析服务解析和失败返回保持。未配置Runtime Provider继续报`EOG_RUNTIME_PROVIDER_REQUIRED`，不把“安装有效”当“有数据”。两个命令各自首次使用创建无外部资源的handler；ESM共用缓存，停用拒绝新调用，恢复可重用原handler。没有增加连接、定时器、订阅或后台任务，也不承诺在途调用撤销或模块卸载。

本地构建和24项回归通过：新增真实Host验证冷启动/安装未用/停用拒绝不加载、两个命令并发首次调用、缺Provider明确拒绝、无graphId/无时间范围原错误、停用再恢复保持结果；既有Provider组件验证真实resolver配合合成事实的成功返回、合同不匹配与缺失拒绝，原观测服务/共享输入及双端Host回归保留。没有新增第二个真实Provider试点。真实Host案例为隔离、无外部事实服务，不冒充真实远端成功集成或精确await停用竞态故障注入。

静态边257→255，仅移除两条退休依赖；四组合均338→336项目模块、0注册interval、96归档文件、0阻断出站、正常退出。新增observatory-actions冷启动禁入断言，新Host测试进入Lightweight Host CI。见[四组合报告](evidence/eog-observatory-actions-lazy-audit-20261019.json)、[验证记录](evidence/eog-observatory-actions-lazy-validation-20261019.json)。未改页面/交互，未部署；最终CI与提交见对应PR。

### 剩余边界与下一步

本批完整读取observatory-actions、Agent tools、共享输入和Provider resolver；定向核对Host引用/装配及原测试，无新增外网来源。代码事实：Provider resolver构造只建立方法闭包；实际Runtime/Analysis解析与service构造在createService(request)调用时发生。Agent tools直接使用同一公开resolver，未依赖Human actions；本批不改Agent工具合同或权限。这个事实只解释本resolver，不能推导所有Provider注册无副作用，也不等于R3已完成。

下一步优先核对`manager/server.ts`中启动创建的`enterpriseOperatingGraphViewStore/ViewService`、对应文件存储实现和实际消费者：区分构造是否读文件、首次方法使用、副作用与共享持久性，再决定是否需要按需装配。共享图模型、编辑命令、Agent工具仍有静态依赖；不为了删除边而强改同步公开合同。R1未整体关闭，R2 Agent SQL/R3 Provider分类/R4跨层验收保持原清单。固定7项、4闭环、3部分。

## 11. 2026-10-19增量：共享View State构造边界核实与保留决定

基线main `6c5bf0a2901fd2e12f4e2be6409ed994012dd6e6`（#1019）。本批完整读取`providers/eog-view-state/store.ts`、`runtime.ts`及公开合同，核对Host装配和下表消费者调用位置。结论：**文件store构造只封装read/write方法，provider构造只封装ensure/get/list/apply；没有构造期文件读取、目录创建、写入、连接或定时器。** 文件不存在时list返回空且不创建文件；实际调用才读，每次读都校验快照。内存store构造复制验证空种子，属于无外部资源的轻量工作。

| 消费者 | 使用位置与行为 | 当前边界判断 |
|---|---|---|
| 2D设计页 | `enterprise-operating-graph-page.ts`的diagramView/操作处理，ensure/apply | 请求时读或写共享视图，非工厂创建即执行 |
| 中性2D/3D查看器 | 各workspace-page读取handler，ensure | 无视图时会创建默认视图；已有行为，本批不改为纯无写入读取 |
| 桌面/空间观测 | desktop-page/spatial-page读取handler，ensure | 原消费者资格有效后实际读取时使用 |
| 2D/3D Agent工具 | 各agent-tools execute中的list、ensure/apply | 读取可返回未持久化默认视图；变更才ensure/apply；未修改工具合同 |
| 移动观测 | mobile-read-page不注入view service | 不需要桌面/空间布局存储 |

采用：保留Host共享、同步、按方法访问的现有服务与文件路径，以行为门禁保护。排除：为了减少工厂数量再套一层懒代理、把共享数据绑定某一个UI插件生命周期、随停用销毁布局文件、为降低静态模块数改造全部同步公开合同。原因是此处已没有需要延期的外部资源动作；多消费者共享是合理的。这个保留决定只针对构造/共享归属，不证明所有入口授权、所有文件IO或全平台按需装载都已闭环。

新增`tests/protocol/eog-view-state-loading.test.mjs`两项：隔离子进程在模块导入后拦截已用同步fs入口，构造时任何文件操作即失败（模块加载器本身IO不计入）；真实临时文件验证缺文件只读无创建、坏JSON使ensure失败且字节不变、人工修复fixture后同实例可读、2D/3D独立视图持久化与重新打开、跨企业get拒绝、旧revision写拒绝且原数据不变。结合原provider边界和四个真实Host查看/观测生命周期案例，本地共9项通过。新测试纳入Lightweight Host CI。

未修改生产实现，因此没有新增构建或模块/RSS收益主张；使用当前main已构建产物（hash保存在[验证记录](evidence/eog-view-store-boundary-20261019.json)），CI负责重新构建运行。此前#1019的336模块/255静态边是历史最近实测，本批不冒充重新测量。没有多进程并发写测试、数据库事务/跨Host锁承诺、真实浏览器验收或生产部署；现有文件存储并发模型保持。

本小项核实结束：共享View State不属于“启动提前读取文件”缺陷。R1的共享模型/编辑命令/Agent工具静态依赖仍需按消费路径收口；下一批先汇总这些剩余根边及其实际副作用，区分必要同步共享边界和可迁移业务实现，再定整改，避免无依据逐模块拆分。R2/R3/R4不变，固定7项、4闭环、3部分。无新增外网研究；源码事实与本节保留判断分开记录。

## 12. 2026-10-19增量：剩余静态入口分类与登记零资源回归

基线 main `ec465d402c566513e15239077037f804cda7c8bd`（#1045）。GitHub compare 确认 #1020 的 `42ce894b4129089cbd8a270bd3473f0c93b7657b` 是其祖先；没有回退其他窗口新增的 Agent/BEX 工作。本批是 **R1 的入口分类、保留决定及回归**，未修改生产实现、公共合同、UI、静态基线或全局项目状态。本节为新增历史证据，前文各批基线不改写为本轮实测。

### 入口、实际触发和决定

范围为 Host 的 EOG 静态 value-import 根边、下表关键实现及 Host 中对应调用位置。完整根入口和绑定名、关键传递边、源码 hash 保存在 [evidence/eog-static-registration-boundary-20261019.json](evidence/eog-static-registration-boundary-20261019.json)；这是定向源码清单，**不是全平台调用图或新的四组合模块审计**。

| 静态入口 / 消费路径 | 源码事实：登记与实际动作 | 本批决定 / 后续边界 |
|---|---|---|
| `contracts/enterprise-operating-graph{,-view}.ts`；各 EOG package；`authorization.ts` | 合同版本、主图/视图 ID、清单及授权规则对象；不调用业务服务。`manager`兼容出口继续指向所属 app | 保留轻量元数据和公开出口；不为少几条边另建插件或代理，不卸载保护规则 |
| graph service → `enterprise-operating-graph-model.ts`；definition persistence → 同一 model | model 只有类型导入和纯校验/操作函数；创建/校验/应用由调用触发。persistence 工厂仅封装仓库方法；graph 工厂只校验配置并封装方法 | 保留共享同步模型算法及已有首次使用委托。纯算法不等同业务存储，不制造异步同步强转；不复制各消费者的定义权威 |
| Host → graph actions、SOP actions | 启动构造分别 5/4 个 handler；只创建闭包。执行才检查 Human/企业、解析输入、授权并读写 service；SOP publish 仍需确认 | 保留无资源登记行为并纳入回归；不据此认定所有命令实现必须永久静态加载。模块装配可后续使用既有 lazy handler，原命令/授权不可跳过 |
| Host → graph Agent tools → 2D designer / 3D viewer tools；SOP tools | import 在冷链；工厂调用位于 `createPersonalAgentToolCatalogV010` 内，**不是无条件启动构造目录**。工厂建立 descriptor/available/execute；业务 service 在 execute 才调用 | 保留目录发现与业务执行分离。同步共享 service 不能绑定某一个 UI 的停用；每次可用性按原 feature/context 规则重算 |
| Host → `current-2d-editor-agent-tools.ts` → `definition-projection-editor.ts` → Eidos `src/2d/index.ts` | 登记零业务调用；available 会查询当前 session/subject 的编辑目标并检查访问资格。execute 才读 graph、ensure view 或读取定义/投影，crop 才保存。静态导入同时带入编辑器和 Eidos 聚合出口 | **仅保留登记零资源这一行为，不为整条实现链签保留结论。** 当前编辑器算法/聚合出口是下一批装载候选；可在既有异步工具 execute 内按需取得实现，不新建通用工具框架、不改 Agent 产品合同 |
| Host → Observatory Agent tools；observatory/inspector resolver | 工具工厂零业务调用；发现阶段调用候选元数据检查，不创建观测 service。observatory `createService` 才解析具体 runtime/analysis；inspector `inspect` 才调用 provider.inspect | 保留廉价 resolver 闭包，禁止用发现触发业务查询。`hasCandidates` 会检查 registry 中的 runtime，不能描述成从不查询 registry；具体 Provider 构造副作用仍归 R3 |
| Host → `DefinitionProjectionStore`、projection artifact source、projection session store | 文件 store 构造封装 read/write/withWriteLock；get/snapshot 才读，put 才创建目录/锁及写文件。artifact source 构造只返回 get，get 才读取定义/投影并计算；session store 为进程内 Map | 保留现有同步共享读取边界。新回归覆盖文件 store/artifact source 构造零访问，不重开第11节已核实的另一套 View State；未验证本 store 的完整并发锁/崩溃恢复合同 |
| Host → 原 2D graph page / view handler | 页面工厂在页面请求分支执行；但模块和 view handler 仍在启动链。view handler 构造只创建 semantic handlers/闭包；execute 才 get/ensure/project、授权及 apply | 当前页面/命令实现是可沿用原 page 分支和 lazy handler 的候选，尚未整改。涉及 UI 源码时须按原 UI 评审门禁处理，不能把本批当作 2D 改版 |

**本范围未发现新的一处“启动构造即读取业务文件/建立连接/注册定时器/执行业务”的缺陷。** 这项结论来自上述构造与调用位置的定向源码核对及下述构造探针，不是声称所有模块 import 都被副作用拦截。已知真正启动写入仍有第2节的有条件旧数据迁移/显式 preview；这是前批已验收的例外，本批不重做。R2 的配置触发 SQL 仍是原收口文档记录的未关闭事实；本轮没有连接 SQL 或重做 Agent 会话初始化。

### 资源、共享和验收

新增 `tests/protocol/eog-registration-resource-boundary.test.mjs`，进入既有 Lightweight Host CI，三项组件回归：

1. 真实 model 创建/校验、graph persistence/service、SOP service、投影文件 store/artifact source，以及 graph/SOP Human handler 和全部四组 EOG 工具登记：业务依赖调用计数为零；ID/时钟/授权回调不得提前执行。独立子进程在 import 后拦截所列 fs、TCP/HTTP/fetch、timer API，构造尝试访问即失败；即使异常被吞掉，attempt 计数仍使测试失败。
2. 真实 Host tool catalog.list：启用未使用、无编辑目标、有编辑目标、停用和恢复只做生命周期/session/candidate 检查，不访问 graph/view/SOP/定义仓库、projection source 或观测 createService。原 SOP availability 只检查企业上下文的兼容事实保留，不能伪造本批修复了其全部资格合同。
3. 真实 catalog.invoke 加合成 graph service：停用拒绝且不执行，首次 READ 才传入当前 enterpriseId，停用再恢复保持原返回。不是实际 Agent 任务、真实持久化或外部 Provider 验收；共享数据/图与SOP恢复继续复用第6/11节已存在的回归。

无新增连接、定时器、订阅、后台任务或跨用户实例；工具闭包随目录持有请求 Principal/Context，不能缓存为跨用户全局单例。共享服务本身不缓存授权，停用由各入口拒绝新调用；没有独立外部资源的闭包不新增 dispose。不承诺撤销在途 WRITE、ESM 卸载或跨 Host 冻结。

本地三项预检通过，**没有本地正式 TypeScript 全仓构建**：环境 Git 代理不可连接，使用 GitHub 连接器读取固定 SHA 源码到隔离快照，Node 24.19.0 `stripTypeScriptTypes` 加已擦除类型的未用 named import 清理生成临时 dist。sandbox 的子进程 pipe 返回 EPERM，测试探针用无 pipe 的子进程并检查退出码；本地 runner 使用 `--test-isolation=none`，资源拦截仍在独立子进程。正式 `npm ci`/TypeScript build、默认 Node 22 test runner 及真实 Host 回归以本 PR CI 为准。没有用这个预检冒充正式构建或环境性能收益，临时转译器不进入生产或项目工具体系。

没有新增本地四组合测量，#1019 的 336 模块/255静态边仍仅为历史最近数据；本批不宣称减少模块/RSS、浏览器下载量或生产成本。未部署，最终 CI/合并标识见 PR；原始本地结果、能力限制与源码 hash 见上述 JSON。

### 接续位置与固定进度

下一批以本表为入口选择一个实现装配边界：优先核对当前编辑器工具的 `definition-projection-editor`/Eidos 聚合依赖与原 2D 页面/命令的共同消费者，判断先隔离哪条路径能实际排除冷链实现。使用原 lazy action/page 分支或允许 Promise 的 tool execute，保留同步公共 model/service；先确认共享另一条根边，避免只移动一条 import 就声称整个模块退出启动链。

R1 整体未关闭；R2 Agent配置触发SQL需原owner的职责/资格及验收证据，R3 Provider逐类副作用对账、R4最终跨层矩阵均未关闭。固定总数不变，不代 Agent/BEX/2D 宣告完成。

插件平台架构治理 固定进度表（当前专项）

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| A01 轻量宿主与按需装载 | 部分完成；本批分类与组件回归 | R1剩余实现装配，继续R2/R3/R4 |
| A02 安装声明与执行边界 | 已闭环 | 无需进一步操作 |
| A03 账本管理与编译边界 | 部分完成 | 权威结果查询与幂等恢复 |
| A04 成员关系与访问授权分包 | 已闭环，保留两包 | 无需进一步操作 |
| A05 三种会话服务定位 | 部分完成 | 正式策略、兼容迁移与其他入口 |
| A06 生命周期覆盖范围 | 已闭环 | 全平台实施缺口继续归A01 |
| A07 个人/企业上下文边界 | 已闭环、原Agent专项实施 | 无需本窗口进一步操作 |
| 插件平台架构治理 整体 | 7项：4闭环、3部分完成 | 未整体收口；按原验收条件推进 |

阅读记录：完整读取根 AGENTS、AI-BOOTSTRAP、LLM、两份适用clinerules、交付规范、文档分类规则、本专项五份指定材料及装载规范；全局 `project.status`/生成handoff仅定向核对当前里程碑/最新闭环/live gate/部署声明，未改写，不能据其较旧全局快照覆盖本专项或其他owner最新记录。源码完整读取 graph model/service/persistence、SOP actions、observatory tools/resolver、projection store/source、inspector resolver；工具组逐个核对 import、工厂、available/execute，page/view handler与大 projection editor仅定向读取导入、构造及实际业务调用，不声称审计全部2D算法、Eidos实现或整个Host。无新增外网研究，复用现有合同与历史证据。

## 13. 2026-10-19增量：当前编辑器仅在定义投影裁剪时加载完整编辑器

基线 main `9b80babdc31fafbcb98f043fde01a6f388c7ce03`（#1046），已核对当前开放PR，没有本批路径的并行实现。本批推进A01/R1，不新增Agent或2D产品功能。

### 问题、选择与实现

第12节的候选已追踪到明确根边：`manager/server.ts`静态导入当前编辑器工具，工具又为一个裁剪函数静态导入`definition-projection-editor.ts`，后者带入Eidos 2D聚合出口。Host原有定义投影页面、GET/selection/SAVE命令已经通过原页面分支/lazy handler动态导入该编辑器；局部核对server全部该路径引用，未发现需要把这些消费者再次改造的理由。

因此只修改`apps/eog-2d-designer/current-2d-editor-agent-tools.ts`：移除裁剪函数的静态import，WRITE execute在参数格式、当前目标、有效Feature、企业访问和管理角色检查之后，**仅对`DEFINITION_PROJECTION`目标await原模块**。目录构造/发现、两种目标的READ，以及`OPERATING_GRAPH`目标的裁剪均不加载此编辑器。没有复制裁剪/缩略图/合并算法，也没有新增懒代理、加载框架或修改同步公共service/model合同；既有工具execute合同允许Promise，裁剪实现现返回Promise，READ保持原同步返回。

新增等待点后再次检查Feature、访问、管理角色和捕获的完整当前编辑目标快照（包含selectedAt）；切换或重新选择目标返回原`CURRENT_2D_EDITOR_WRITE_CONFLICT`，不把旧请求绑定到新资源。之后才调用原read和集合校验，保留原expectedWriteToken检查、`putIfVersion`及onEditorUpdated。等待期间其他写入已推进版本时，本请求按原CAS拒绝，不重放WRITE。Host目录的授权/回执、Personal会话与当前编辑器企业范围、Shared View State、企业定义权威均保持。

### 生命周期、资源与恢复

| 场景 | 本批明确行为 / 验收 |
|---|---|
| 未安装/停用、启动及合法目录发现 | 原入口资格保持；完整投影编辑器新增四组合冷启动禁入断言。调用预检拒绝时不加载实现、不读业务数据 |
| 已启用未使用、READ、运行图裁剪 | 工具登记与发现保留轻量闭包；模块加载探针证明这三类调用不加载定义投影编辑器 |
| 首次定义投影裁剪 / 并发 | 原生ESM共用模块缓存；两个相同token并发请求只加载一次、一笔提交、一笔CAS冲突；输出继续使用原函数 |
| 加载期间停用/访问撤销/角色撤销/目标变化 | 真实ESM load hook中改变测试权威/选择；await后拒绝，业务读取/本请求写入/失效通知计数均0 |
| 等待期间其他编辑者提交 | load hook通过另一真实文件store实例推进版本；本请求保留冲突，不覆盖其数据；重新读取正确token可继续 |
| 恢复资格/目标 | 同一工具实例和成功加载模块可复用；每次仍检查当下资格与token，不把ESM缓存当作权限 |
| 模块装载失败 | 错误原样上抛，本请求零业务读写。未新建自有失败缓存；不承诺绕过Node原生ESM失败缓存。交付/模块故障修复后重启Host恢复，新进程正常裁剪测试与故障进程分开 |

此处没有新建连接、任务、订阅或后台资源；没有需在停用时dispose的新实例。ESM可保留缓存，工具闭包仍随请求目录持有Principal/Context；不创建跨用户全局单例。停止只阻止新调用及本批新增等待点后的动作，不宣称撤销已提交WRITE、跨进程事务冻结或完成全平台停止合同。

### 验证、证据与限制

本地18项定向回归通过：新增`tests/protocol/eog-current-editor-crop-lazy.test.mjs`9项、原`personal-agent-current-projection.test.mjs`6项及第12节登记边界3项。两个test-only fixture在独立进程注册真实ESM loader，记录模块装载；竞态在完整编辑器load hook中改变测试资格/当前目标，或经另一真实文件store实例写入。没有修改模块源码或在生产增加测试注入参数。验证Personal会话继续操作Host选择的企业素材、两种编辑器裁剪保持、语义graph/definition未变；输出/缩略图与原算法兼容。

最初基于MessagePort的测试同步出现通知排队/超时，已改为loader直接写测试专用信号和实际文件store。最终回归无定时轮询、无生产诊断端点；只保留最终可执行fixture，不把初次失败算通过证据。

本地仍受第12节环境限制：固定SHA源码快照、Node24临时类型擦除转译及`--test-isolation=none`，不是正式TypeScript全仓构建。正式npm ci/build、默认Node22 runner及真实Host四组合禁入由本PR CI执行，结果见PR。静态基线只删除当前工具→完整编辑器、完整编辑器→package的两条退休边（原基线255条，待CI严格核实），不扩允许集合。**本地没有新四组合测量，不把#1019的336模块或#1046的历史CI当作本轮模块实测。** CI新报告如有数字以本PR实际日志/产物为准，不推算RSS或生产收益。

完整证据：[eog-current-editor-crop-lazy-20261019.json](evidence/eog-current-editor-crop-lazy-20261019.json)；[兼容评审](../../ui-design-reviews/eog-current-editor-crop-lazy-20261019.md)。未部署，无真实模型/用户任务、浏览器视觉、生产权限变动或跨Host冻结验收。源码事实来自完整当前编辑器工具与原当前投影测试、局部editor裁剪/merge/thumbnail链及Host对应消费者；没有通读整个Host或全部Eidos算法。复用已读装载/交付规范及第12节根边研究，完整读取工具系统规范、UI检查规则/设计总纲/清单，不重复外部研究。

### 2026-10-20 门禁接续记录（PR #1047）

原提交 `1e2e56887e9ef17927fc0c7c6c3ffd0960b2f43e` 的 Lightweight Host、Platform、Continuity、Human UI Review、Diagram Integration 五项CI通过；正式Host日志为159项行为测试、6项守卫、四组合均317个项目ESM模块/253条静态边、0 interval、96个归档文件。这是本批CI实测，不是本地测量或#1019历史值。

Native Browser run `39251390713` 首轮在D02 Save后新拖动未改变坐标，唯一一次失败job复验在E04收起检查器后重新点击曲线超时（job `118071070157`）。两条路径直接调用原editor/renderer，不经过本批当前编辑器工具；没有据此证明生产缺陷，也没有跳过断言或合并红灯。定向读源码确认检查器布局改变后ResizeObserver会异步重新适配camera，单次boundingBox/CTM测量存在时序风险，实际失败是否由此导致仍需原生事件证据，不能把推断写成已复现根因。

本次仅在原browser proof内补充三个有界坐标手势的前置条件：E04重新选择、D02前后两次节点移动，要求目标元素/画布/屏幕几何连续三个动画帧一致（最多120帧），重新选择真实可命中路径点，并记录可信pointerdown及真实目标。只发一次原生点击/拖拽，不重复手势、不更改DOM状态、无固定sleep、不放宽位移/Undo/CAS/ghost-chord断言；未改Eidos、2D页面或业务实现。由CI日志检验布局稳定与真实命中，保留诊断失败。

合入当前main `5919e0147232fef1ddfc4f7e9a38b67969100bcf`：已逐文件比较基线后的18个变更，均为Agent/BEX独立路径，无本PR文件重叠。以main完整tree叠加本PR文件并保留双亲，避免部分本地快照丢失并行工作。本地18项定向回归与browser脚本语法检查通过；本地沙箱禁止回环监听/Chromium socket，未执行浏览器场景，正式浏览器与合入后CI仍待本PR验证，结果以PR后续记录为准。未部署。

### 接续与固定进度

本入口整改完成后停止追加拆分。R1原运行图page/view handler、semantic/SOP命令模块及其他静态实现仍需按第12节分类继续选择，保留纯模型/同步共享合同；不能据此称整个Eidos 2D链或全部编辑器都退出Host。下一批优先原graph page/view handler与semantic actions的共同装配，复用既有lazy handler并保持当前编辑器选择回调；不重做定义投影页面或本批裁剪入口。R2 Agent配置触发SQL、R3 Provider分类、R4最终跨层验收仍未关闭。

插件平台架构治理 固定进度表（当前专项）

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| A01 轻量宿主与按需装载 | 部分完成；本批裁剪装配与竞态回归 | R1剩余page/action装配，继续R2/R3/R4 |
| A02 安装声明与执行边界 | 已闭环 | 无需进一步操作 |
| A03 账本管理与编译边界 | 部分完成 | 权威结果查询与幂等恢复 |
| A04 成员关系与访问授权分包 | 已闭环，保留两包 | 无需进一步操作 |
| A05 三种会话服务定位 | 部分完成 | 正式策略、兼容迁移与其他入口 |
| A06 生命周期覆盖范围 | 已闭环 | 全平台实施缺口继续归A01 |
| A07 个人/企业上下文边界 | 已闭环、原Agent专项实施 | 无需本窗口进一步操作 |
| 插件平台架构治理 整体 | 7项：4闭环、3部分完成 | 尚未整体收口 |

