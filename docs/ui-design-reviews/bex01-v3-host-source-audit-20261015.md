# BEX-01 V3 Host 来源核对｜Human UI 评审记录（2026-10-15）

> 源于真实 `DataImportJobV010` 模型的产品增量；自动测试用例为**合成供应商行**，不是用户 Excel，也不是生产 Host/真人验收。执行状态以本 PR CI 为准。

## 目标与完成条件

企业授权业务负责人从真实已保存的导入任务继续：在预检查结果里优先发现未解决行，核查每个来源列及当前目标，区分同名业务字段，仍需明确预检查和提交。不能更改原行值、Recipe 或暗中创建 Schema。

## 流程与步骤

已合并 #921 提供从真实 Job 列表继续。此次预检列表先给失败行及其原始字段证据，再给全部来源列核对。每列可返回既有映射页调整；成功/失败之后仍必须依照原 Host dry-run/commit 规则完成。直接操作而非强制打开 Agent。

## 导航与信息架构

保留 `/data-import/jobs/{id}/review`、`/map` 原导航与面包屑；不新增顶层入口。来源列旁的操作导航进入现有映射页，不创建虚构的行修改或字段写入命令。未来真正“本列就地选择”仍是 OPEN。

## 视觉与颜色

复用 Eidos 现有 CatalogBrowser list、紧凑密度、原有语义状态，不写 BEX 专属 CSS/色值；错误行设为 warning 并置前；来源列的字段名、样本、用途与操作同一业务项。默认产品中文文案无“模拟/非 Host”等研发表述。

## 记忆与注意力

直接读取持久 Job 的 headers/rows/mapping/ignored/Recipe，不要求用户记住上一页 Excel 列。可撤销忽略明确说明，已有映射不因同名候选出现而变更。当前版本为字段全列可见 + 3 项非空样本，不等于全行浏览。

## 无障碍与跨年龄

沿用 Eidos 语义列表项与带文字的可访问操作；状态同时有“已映射/待处理”等文字，不依赖颜色；手机沿用 CatalogBrowser responsive 渲染。**390px 手机、200% 中文放大、键盘导航、中文字体与真实控件可点击仍待 Chromium/Human 实测，不写 PASS。**

## 安全与数据修复

纯函数只读既有企业授权 Job 模型，没有 endpoint、Schema 创建、权限变更、行值补写、commit 或客户端 localStorage；已提交任务不再提供调整列入口。失败 `subjectType` 仍显示空值且不从供应商角色猜测；同名银行目标以 field ID 和受治理的描述辨认。真正行级修复和批量新增不在此提交中。

## 证据与剩余问题

- 源：`apps/data-import/source-audit.ts`、`apps/data-import/page.ts` review 部分
- 合成 22 列/40 行/末尾 3 个缺失值及两同名银行测试：`tests/protocol/bex01-v3-source-audit.test.mjs`；覆盖未忽略数据、Recipe 无副作用、已提交不提供调整
- Eidos 正式规范：PR #186 合并 SHA `4c2f36040bdca102b67ba65acb7b35998261ab7d`
- 历史研究：#909 Draft（不合并其业务原型）；历史原型 15/15 不计为本次真实 Host 验收
- 待取得：真实原始 XLSX、授权 Import Job JSON、真实目标字段 ID 及业务用途、真实 Chromium/手机中文/人工签收，独立 CI 结果
- 不执行 Railway 部署，也不把 PR 合并等同已在真实企业生产环境交付
