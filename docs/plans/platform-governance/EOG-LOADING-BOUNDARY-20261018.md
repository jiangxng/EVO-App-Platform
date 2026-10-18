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
