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
