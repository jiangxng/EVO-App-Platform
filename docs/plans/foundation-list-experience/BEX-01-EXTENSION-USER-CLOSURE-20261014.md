# BEX-01｜CP-03 扩展字段的业务页面收口（2026-10-14）

范围：只完成 **Counterparty 供应商 XLSX/CSV 导入 → 未映射列 → Human 创建企业扩展字段 → 重新映射 → 预检查/提交 → 供应商详情读取扩展值**。不重开 CP-03 已通过的机制、不开新存储、不开 Item/Warehouse 扩展 UI、不修改 Agent/EC。

## 原有已经实现且沿用的能力

1. `evo-object-extension` 的企业范围定义 list/upsert/archive、Owner 权限、schema compiler、应用范围/slot/角色组合。
2. `evo-data-import` 保存 ImportJob 的原始表头及行记录、未映射列、人工映射、Recipe、预检查和确认提交；不会因未映射而偷偷丢弃作业中的值。
3. `evo-counterparty` 的已定义扩展字段进入 IMPORT surface，经原有批量事务写到 extension value sidecar。由 `tests/protocol/data-import-counterparty.test.mjs` 既有测试保证。

## 补齐的用户操作

- 用户在当前导入作业的“字段映射”页，且有未映射列、对象扩展插件生效且具有该企业的 OWNER/ADMIN 权限时，获得“创建企业扩展字段（未匹配列）”上下文入口。
- 操作页从该作业保留的表头中选择未匹配来源列，由人输入业务名称、确认 STRING/NUMBER/BOOLEAN/DATE 类型。当前供应商导入自动选择供应商扩展槽，客户导入选择客户扩展槽，无角色时选身份槽；不从陌生原始数据猜字段含义，不自动把系统状态/日志转成字段。
- Owner 接受表单时重新核验企业/作业/来源列/重复定义，生成稳定字段 ID，并写入现有对象扩展仓库。它**不提交导入，不改任何现有往来对象，不触发 Agent**。成功时直接返回原映射页，真实新字段立即作为可选择的映射目标。
- 用户选择字段，执行原导入预检查/确认提交。扩展值仍由 CP-03 原有 Owner 事务写入侧车资源。详情读取经同一请求的字段级授权裁剪后，显示“企业扩展字段”分组；无权限的字段不发送到页面。
- 未映射列原始证据仍保留在导入作业；已定义字段不再重复创建，应直接在映射列表使用现有字段。系统字段保持不映射。

## 明确不做

- **不**自动为每个未映射列建字段、不根据字段名称推断业务类型、不自动修复既有 `subjectType` 必填错误。
- **不**修改 Event/Agent/EC 学习与 PA-02 Object Extension SQL Owner，不迁移扩展值存储，不建新的“配置中心”或通用复杂元数据编辑器。
- **不**扩展到 Item/Warehouse/BEX-02 或改变其它插件运行进度。

## 证据、完成门禁

- `tests/protocol/bex01-extension-field-human-flow.test.mjs`：企业 Owner 约束，来源列约束，重复字段保护，Effective Schema 映射刷新，详情字段授权。
- `tests/protocol/data-import-counterparty.test.mjs`：已有 CP-03 定义 → 导入 → 保存扩展值。
- `tests/bex01/live_supplier_chromium.py`、`tools/bex01/isolated-host-fixture.mjs`：真实隔离 Host、真实导入作业、浏览器在映射页创建字段、映射与确认导入、在供应商详情查看。
- 必须经准确 PR HEAD 的 Platform CI、Project Continuity、Lightweight Host、BEX-01 Host Chromium 均通过，合入 `main` 后再更新现有 Railway 开发服务。不能以这里的文档代替运行证据。

## 过程分支整理

- 新工作只有一个 Platform PR：[#843](https://github.com/jiangxng/EVO-App-Platform/pull/843)。
- 旧已合并阶段分支和此次分支由 `.github/workflows/bex01-merged-branch-retirement.yml` 在合并主线时逐个验证：PR 已合并到 main、提交仍匹配、合并提交在 main、无在用 PR、分支无保护，才调用 GitHub 删除引用。若被其它窗口改动或新 PR 占用则拒绝删除并保留证据；不强制重置分支。
- 清理范围为已经验证的 BEX 与治理过程分支，绝不处理 `main` 和任何其它工作中的分支。
