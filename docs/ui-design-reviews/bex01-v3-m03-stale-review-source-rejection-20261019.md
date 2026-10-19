# BEX-01 V3 M03｜保存草稿时拒绝失效审核页（2026-10-19）

> 仅补齐原 [#999](https://github.com/jiangxng/EVO-App-Platform/pull/999) 的一致性门禁，[#1028](https://github.com/jiangxng/EVO-App-Platform/pull/1028) 是基于 #999 的独立 Draft 子 PR，不直接合并 main。设计基准仍为 [V3 原型 #909](https://github.com/jiangxng/EVO-App-Platform/pull/909)，既有八领域审查见 `docs/ui-design-reviews/bex01-v3-authorized-human-review-drafts-20261016.md`。原始客户工作簿、真实生产 Job 与 Railway 登录后 Human 截图仍不可得。

## 目标与完成条件

消除已由 #1028 原始 RED 用例复现的“列身份偏移”：审核人查看来源列甲、乙后，另一个合法操作先映射甲，旧页面的 `choice_0` 不得作为乙的决定被保存。旧页面应收到清晰失败结果、刷新并重新审核；原始 Excel、正式映射、已完成的 dry-run 和供应商记录不能因被拒绝的草稿发生变化。此要求原属 M03，不扩展业务范围。

## 流程与步骤

同一 `/object-extensions/from-import?job=...&mode=batch` 页面，原“审核方式”仍显示“集中创建与映射”。它的内部提交值绑定当前 Import Job 来源列／正式 mapping 的摘要；人工点击“保存当前审核草稿”时，Host 与当前权威 Job 对比。不一致即拒绝；相同的摘要在进入持久化回调后再次检查。已有单独的“确认：批量创建并自动映射”和后续数据预检查、提交仍按原命令执行，不合并动作。

## 导航与信息架构

不增加页面、步骤或导航入口；不改变 V3 四列布局、异常优先、候选证据和草稿恢复位置。失效页上的旧选择不得悄悄转移到另一个来源列。用户仍须重新进入并核实最新已映射与未映射列；正式 Job 的来源文件与业务状态为唯一权威。

## 视觉与颜色

**零新增可见控件、零新文案颜色或自定义 CSS**。仅现有选择框 `batchMode` 的 option 值由常量变为短摘要，普通用户仍看到原有“集中创建与映射”标签。保存失败复用 Eidos `role=status` 现有提示，不增加全局通知或强调色。不触碰 Eidos 公共样式与设计语义。

## 记忆与注意力

保存过的草稿仍按原真实 `sourceColumn` 还原，不依赖筛选的行号。新校验是对“旧页面尚未保存的选择”的保护，避免旧行号重新解释为其他列；拒绝并不会重写原 Job、自动创建字段或自动推断主体类型。失效后的重进需重新确认，而不是静默改写人工决定。

## 无障碍与跨年龄

保留原生 select、submit 与原有焦点顺序，无需学习新的手势或增加操作入口。错误仍走原 Eidos 状态区域，使用文本提供信息；桌面、390px 手机和键盘操作保持既有行为。Human 已登录生产视觉签收仍待完成，CI 不代替人工。

## 安全与数据修复

摘要是**并发一致性前置条件，不是身份授权凭据**；Owner/Admin 与企业上下文授权仍由 Host 校验。摘要覆盖 Job 身份、Excel 源列、正式映射及忽略选择；在初次验证和最终同步 Job 写入路径分别重验。最终写入还核实原列集合与目标 ID 的可用／排他，阻止验证后至持久化之间的目标变化。不修改 schema、mapping、source.rows、dryRun、receipt 或数据提交逻辑。跨进程持久化原子性不能仅凭本轮单进程代码推定，仍按既有 Job repository 契约审查。

## 证据与剩余问题

- 初始 [#1028 Platform CI RED](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39207709249)：1017 pass／1 fail／1 skip，唯一失败为旧审核页被错误接受，原有效草稿请求成功，证明用例没有单纯被 fixture 拦下。
- 修复源码集中在 `apps/object-extension/batch-page.ts`、`batch-draft.ts`、`actions.ts`、`manager/server.ts`；相关测试仅 `tests/protocol/bex01-v3-stale-review-source-identity.test.mjs` 和 `bex01-batch-extension-import.test.mjs`。最终是否通过，以本子 PR 最新 exact-HEAD CI 为准；不得将当前写入当成通过证明。
- 仍需 #999 Owner 将本子 PR 与主线协调合并，重跑完整 CI，M04 原始客户 Excel、两条同名银行真实 field ID、三行主体类型，以及 M05/M06 真实全链路和 Human 签收仍保持 **OPEN**。
