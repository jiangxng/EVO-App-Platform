# BEX-01 基础对象导入导航核查与闭环（2026-10-14）

## 触发、边界与结论

用户在现有 Railway 的 `往来对象 → 供应商 → 数据导入 → 字段映射 → 导入预检查` 发现 3 行 `subjectType: DATA_IMPORT_REQUIRED_VALUE_MISSING`，预检查页只有“返回数据导入”、“调整字段映射”、“下载错误清单”，无法直接回到供应商数据表格。

**根因（代码已读）：** `apps/data-import/page.ts` 的 `createDataImportReviewPageV010` 只有当 `job.state === "COMMITTED"` 才调用对象插件的 `completionNavigation`。一旦处于 `DRY_RUN_FAILED`（恰是需要返回工作台和进一步核对的阶段），“返回供应商列表”被隐藏。不是浏览器缺少路由。Upload 与 Mapping 的 `contextNavigation` 也仅以数据导入为上层，不保留业务来源；Mapped Job 实际保留了 `targetParameters.relationshipMode`，因此已有安全重建业务来源的语义信息。

**第二个问题（代码已读）：** preflight row summary 输出 `fieldId + code`，没有利用 `FoundationObjectImportIssueV010.message` 和目标 Schema 的字段中文标签。截图中用户无法理解 `subjectType` 需映射或补齐“主体类型”。这不意味着应将“往来类型”自动视作“主体类型”：领域 Schema 明确“身份形态”与业务类别/客户供应商角色不同，不允许盲目转化。

## 信息架构核对

| 页面/状态 | 正确的任务流导航 | 回业务工作区 | 本次处理 |
|---|---|---|---|
| 供应商数据表格 | 主体/角色 → 导入文件 | 当前供应商列表 | 沿用原有授权入口，不改变 |
| 数据上传（尚未建立Job） | 返回导入中心 | 对象Owner声明的目录 | 面包屑第一段提供来源，返回不提交 |
| 字段映射（Job已建立） | 返回数据导入 / 进入预检查 | 根据Job的Target+Parameters重建来源 | 将Target交给映射页面，增加可点击业务面包屑 |
| 预检查通过 `DRY_RUN_READY` | 调整映射 / 显式确认提交 | 始终允许安全离开 | 可见“返回供应商列表”；仍需单独确认提交 |
| 预检查失败 `DRY_RUN_FAILED` | 调整映射 / 下载错误 | **必须能离开** | 显示对象返回动作、业务面包屑和可执行错误解释 |
| 已提交 `COMMITTED` | 查看回执 | 返回对象目录 | 保留原有返回行为 |
| 导入中心 / 历史任务 | 重新打开指定Job | 导入中心 | 沿用，不凭猜测构造客户端来源 |
| Item / Warehouse | 同一通用骨架 | 由各对象owner声明；缺失时回导入中心 | 发现两个owner尚未贡献`completionNavigation`，本次不跨owner补造业务路由 |

### 约束

1. 业务来源链接由已安装且生效的 Foundation Import Target **服务端 owner**贡献，校验为本地绝对应用路径；不接受查询参数里客户端任意 `returnUrl`（可能导致开放跳转/跨角色越权）。
2. 任意返回/退出是纯导航，不提交 `data-import.commit`、不触发数据修改；已保存Job通过原导入中心可继续恢复。尚未上传的本地文件选择不假装已有草稿。
3. “返回上一步”（字段映射）与“离开导入任务”（供应商工作区）必须不同标签。面包屑只显示可定位的真实节点，不让用户将“数据导入中心”误当“供应商页面”。
4. `SUPPLIER` → Suppliers、`CUSTOMER` → Customers、未指定角色 → 往来对象目录；仅当前安装/授权的页面路由有效。导入历史里的旧Job不在任何状态推断外部来源。
5. 当前一次性小范围闭环只验证 Counterparty + Data Import；Item/Warehouse owner导航声明是后续独立范围，不为其改业务规则。
6. 页面错误解释应显示可读的 Schema 字段名和修复方向；缺失字段不允许擅自填默认类型来绕过领域验证。

## 行业参考（2026-10-14 查阅）

- **SAP Fiori Wizard Floorplan**：https://experience.sap.com/fiori-design-web/wizard/ （搜索结果已读摘要；待完整原文对照）。事实：Wizard 有 Review/Edit/Previous 路径，Exit/Cancel与提交流程分开，未提交离开视数据变更需要提醒。**用途：**导入每阶段允许返回业务工作区、不把退出行为绑定到提交。
- **SAP Fiori UI Text Guidelines**：https://experience.sap.com/fiori-design-web/ui-text-guidelines-for-sap-fiori/ （搜索摘要已读；待完整原文）。事实：Back是导航，Cancel用于终止当前操作，避免把返回业务页面标成撤销已提交数据。**用途：**明确标签“返回供应商列表”而非含混的“返回”。
- **GOV.UK Design System Back link**：https://design-system.service.gov.uk/components/back-link/ （搜索结果正文已读）。事实：多页任务必须提供不依赖浏览器历史的返回方式，复杂旅程的返回文字要说清目的地；浏览器后退不应丢失先前状态。**用途：**在每阶段设置真实的可点击、可达的导航。
- **GOV.UK Design System Error message**：https://design-system.service.gov.uk/components/error-message/ （搜索结果正文已读）。事实：错误应说明问题与修复方法，关联用户见到的字段标签并保留原输入。**用途：**将机器错误码翻译为主体类型缺失及“调整映射/补源文件”的动作。

**方案排除：**仅依赖浏览器后退（可能回到历史别的作业）；无条件写死`/counterparties/suppliers`在通用Data Import（破坏插件边界）；通过客户端`returnUrl`选择目的地（缺少可信授权）；在失败时自动提交、自动更改`subjectType`（越过领域校验）。

## 证据与验收

- 原代码：`apps/data-import/page.ts`、`contracts/foundation-object/import.ts`、`apps/data-import/types.ts`、`apps/counterparty/import-target.ts`、`manager/server.ts`；`item/warehouse`导入目标不存在相同的Owner目的地配置。
- 自动测试：`tests/protocol/bex01-supplier-import-journey.test.mjs` 扩展上传/映射/失败预检/已提交的无写入返回验证；`tests/bex01/live_supplier_chromium.py` 通过隔离真实Host构造3行失败Job，验证屏幕上的中文错误、对象返回按钮、上传/映射面包屑以及返回后仍可回到失败Job。
- 部署门禁：Platform CI、Project Continuity、Lightweight Host、BEX-01 Real Host Chromium均需在最新PR头成功；GitHub合并后通过Railway原开发服务部署，检查页面实际效果。
- 尚需后续调研/改进：任意业务列表的筛选、页码和焦点状态随跨插件导航完整恢复；这需要Host可信Task Continuation契约，而不是向导入Job嵌入任意查询或凭据。Item/Warehouse各自选择是否声明导航；必要的未上传文件丢失提醒与移动屏导航折叠可在后续Eidos owner统一验证。
