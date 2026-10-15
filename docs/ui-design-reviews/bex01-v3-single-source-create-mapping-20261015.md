# BEX-01 / CP-03 V3｜单列创建与映射上下文 Human UI 评审（2026-10-15）

> 本 PR 实际涉及的 UI：`apps/data-import/page.ts`、`apps/object-extension/page.ts`。继续 [#860](https://github.com/jiangxng/EVO-App-Platform/pull/860) 原分支；既有 #921/#925/#929/#933 已合并功能与 Eidos #186 设计权威不得倒退。测试使用隔离 Host 生成的业务样本，不是客户 Excel，也不代表真实客户 Human 签收。

## 目标与完成条件

企业业务用户在 Excel“开户银行”来源列旁点击“为本列创建”，新字段表单必须记住是“开户银行”而非“系统编码”，带出原始值和业务名称；确认后真实 Host 企业 Job 保存当前列→真实 field ID 映射，返回原任务即看见结果，不要求再点一次同名字段，也不自动提交供应商。

## 流程与步骤

保留“继续上次导入 → 映射/批量审核 → 独立预检查 → 最终确认”的既有两层体验。独立单列创建由来源列 contextLink 发起；若多个未匹配列，主入口“集中审核”仍有优先级，不能强制全部逐列创建，也不强制唤起 Agent。发生业务同名歧义时不直接替 Human 选银行目标。

## 导航与信息架构

不新增顶层活动；沿用 `/data-import/jobs/:id/map` 和 `/object-extensions/from-import?job=...&column=...`。创建页在原字段就地上下文中显示选定来源、原值样本、名称、类型，并只有一个明确保存动作。旧深链如果已映射、失效或找不到该列，明确拒绝而不能无提示落到第一列。

## 视觉与颜色

仅使用 Eidos Form 的标签、只读数据与原生 select、主按钮；不写平行 CSS 或品牌色。业务文案为“保存字段并自动映射”等，不写“模拟/非 Host”等研发术语。主映射页仅在待处理/有歧义行展示三项截断原始样本和候选用途，已确认字段避免重复展开大段内容。

## 记忆与注意力

当前原列和样本就地出现；保存后回到真实 job 已保存映射状态。基于有效 Schema 展示两项同名字段用途、ID、目标占用，避免让用户跨页记忆；没有受治理的描述时明确“业务用途待核对”。多列创建和 __PENDING__ 不可能被当成明确忽略。原 Recipe/忽略/行更正均保留。

## 无障碍与跨年龄

字段来源、样本、候选、类型和动作均有可读文字，状态不只靠颜色；控件来自 Eidos 现有键盘和触控处理。仍须隔离真实 Host Chromium 验证桌面和 390px，必要时做中文放大与 Human 人工验收；自动化通过不能替代原 XLSX 用户签收。

## 安全与数据修复

Host 已按企业 ACTIVE OWNER/ADMIN 核对读取和 WRITE；本 PR 仍由既有授权 Object Extension Action 和 Data Import Service 持久写入，不创建自定义 localStorage 或直写数据库通道。创建字段属于受治理企业定义写入，不自动执行 dry-run/commit；同源失败重试复用确定性 ID，同槽同名不能第三次新增，历史有数据字段不删除。主体类型缺失不从 SUPPLIER 推断。共享 Host 只增加无效原列的 fail-closed 响应。

## 证据与剩余问题

- `tests/protocol/bex01-extension-field-human-flow.test.mjs`：原列、样本、返回持久映射、重试复用、同名防重和待处理安全；
- `tests/bex01/live_supplier_chromium.py`：原始业务真实 Host/Chromium 字段创建→映射→导入旅程；
- 原研究与资料访问等级：#909 Draft V3 详细索引，未新增本轮网络资料；
- 仍缺客户 XLSX 原件、授权 Job JSON、两银行实际 field ID/用途、用户 Human 真机签收；Railway 不擅自部署。
