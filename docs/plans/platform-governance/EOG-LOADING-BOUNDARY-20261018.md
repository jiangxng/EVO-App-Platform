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
