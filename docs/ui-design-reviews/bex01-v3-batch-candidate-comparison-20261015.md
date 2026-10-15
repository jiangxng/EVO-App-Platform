# BEX-01 V3 批量字段候选用途核对｜Human UI 评审（2026-10-15）

> 本次修改的 UI 源文件：`apps/object-extension/batch-page.ts`。Host 权威投影 `manager/server.ts` 仅提供当前授权有效 Schema 的 `resolvedDescription`，不建新数据表、不修改权限。协议/浏览器测试为隔离合成数据，不冒充真实客户 Excel/Human 签收。

## 目标与完成条件

业务人员打开真实已暂存的批量新增字段页，在同一来源列附近识别所有同名候选的**不同业务用途**，看见自己的原始来源样本，然后明确复用已有字段、建议新建字段或忽略，避免因字段名称相同而将收款银行误认成供应商付款银行。

## 流程与步骤

保留既有：来源 Excel → 真实 Host 暂存 → 字段映射 → 一屏集中审核 → 全批预检查/明确创建 → 返回映射 → 独立预检查 → 最终导入确认。本轮只增强“当前来源列显示真实样本 + 同名候选比较”，完全不替换 `batch-action.ts` 的幂等、唯一性及受控写入。

## 导航与信息架构

不新增顶层入口或第二套 batch 系统。每个有歧义的来源列显示用途/类型/field ID；原选择控件就在附近，同名字段需要业务 Human 选择。已占用目标展示占用信息、不作为可复用选项。候选用途缺失时明确提示核对，不补造领域解释。

## 视觉与颜色

复用 Eidos Form 的标签、readonly 辅助字段、select 和可访问确认按钮，不添加 BEX 独立品牌色/CSS，不复制飞书/简道云 UI，不出现“模拟/非 Host”研发术语。来源样本限定三项、每项最多 48 字符，减少复杂表格中的横向冗余。

## 记忆与注意力

不让用户回忆前页的 Excel 样本：当前列直接显示实际非空数量和三个真实不同样本。同名候选同时给出用途、类型和标识；不靠标签相同的 select 猜哪个正确。已经确认的 Recipe、映射、忽略和来源行原封不动。

## 无障碍与跨年龄

字段比较和选择都有文字，状态不依赖颜色；使用 Eidos 原生控件而非自建鼠标交互。必须继续 Chromium desktop/390px 验收，测试数据/自动化 PASS 不替代不同字号、键盘和真人在真实 22 列页面的操作签收。

## 安全与数据修复

读取只发生在原企业 Active OWNER/ADMIN Host 页面授权之内，来源样本即来自原先就可见的企业 Job。并不接触权限或数据提交、不自动创建两个同名银行、不将 `SUPPLIER` 角色转换成 `subjectType`。现有批量执行器仍负责全批校验、唯一性、合法目标占用及重试。

## 证据与剩余问题

- 正式设计语言 Eidos #186：`main@4c2f36040bdca102b67ba65acb7b35998261ab7d`。
- 研究阅读等级按 #909 Draft 的 V3 研究索引继承；无新增外部来源。
- 源码：`apps/object-extension/batch-page.ts`，`manager/server.ts`；
- 协议：`tests/protocol/bex01-batch-extension-import.test.mjs` 的同名收付款银行、目标占用与来源值不可变；
- Host Chromium：`tests/bex01/live_supplier_chromium.py` 原批量建字段、映射、独立确认业务旅程中核验同屏实际 Excel 样本。
- 待取：真实 Excel 文件、有效企业授权 Job、两个“开户银行”真实 field ID/描述、Human 人工确认、生产操作授权；未部署 Railway。
