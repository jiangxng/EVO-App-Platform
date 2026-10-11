# EVO App Platform — 窗口交接入口（Platform 分支收敛 / 六应用逐项验收）

> 2026-10-11；**独立平台主线交接，不接管 Agent、2D/EOG、EVO Ledger Runtime 或 Eidos 项目。** 本文件为新窗口入口，不代替全局 project.status.json 或各窗口专项文档。以下 SHA、分支数、Railway 状态是本次交接时的**时点快照**，继续执行前必须再查询。

## 0. 先读什么

按以下顺序阅读，不要直接从大量旧分支推测项目目标：

1. **本简短入口**：docs/roadmap/PLATFORM-20261011-WINDOW-HANDOFF-ENTRY.md
2. **实际查阅资料与来源可信度索引**：docs/research/PLATFORM-20261011-WINDOW-SOURCE-INDEX.md
3. **已采纳/排除方案、冲突和未决问题**：docs/roadmap/PLATFORM-20261011-WINDOW-DECISIONS-GAPS.md
4. **GitHub/CI/Railway 实际执行证据及文件差异**：docs/archive/PLATFORM-20261011-WINDOW-EXECUTION-EVIDENCE.md
5. 已入主线的较早成果：[剩余分支原始 14+5 分类与 14 条精确 head](./PLATFORM-REMAINING-BRANCH-LEDGER-20261011.md)、[EVO 财务权威治理](../governance/EVO-LEDGER-RUNTIME-AUTHORITY-AND-TR01-CORRECTION-GOAL-20261011.md)、[EVO 近封版影响审计](./TR01-EVO-LEDGER-RUNTIME-FREEZE-IMPACT-20261011.md)、[此前功能收敛交接](./PLATFORM-CONVERGENCE-WINDOW-HANDOFF-ENTRY-20261011.md)。

## 1. 用户意图与不可改变的决定

- **先梳理完平台历史分支，再进入六个业务应用的真实实现。** 不将“分支数下降”与“所有业务已完成”混为一谈；旧代码/CI/资料不丢失，必须功能级复核、归档、验收后才能删源分支。
- 用户对长会话、Token 压缩和跨窗口偏移非常关注：**六个应用不能一起开发并在几天后才交付。** 一个应用一个小 PR → CI/真实 EVO Runtime 验证 → Railway 公网固定 SHA → 用户浏览器操作与反馈 → 写入验收结果 → 再开始下一个应用。顺序：采购订单、采购收货、销售订单、出库发货、应收、客户收款。**在前一个应用未取得用户签收前，不推进下一应用的业务实现。**
- **EVO Ledger Runtime 架构已经近封版。** App Platform 不重新实现 FIFO、Posting、Ledger、成本估值、核销或 Replay；唯一权威路径是获准提交 BusinessData → EVO 执行给定 PostingRules → Ledger/Balance/Work/Replay 或受控经济扩展的正式版本化结果。EVO 仓库与最小 EVO Runtime 不是同一概念。
- Agent 和 2D Designer/EOG/投影正在独立窗口开发，**不合并/删改其 branch、PR、代码或专项文档**；不改 project.status.json、HANDOFF-LATEST.md 等全球状态文件。Railway 名为 production，但用户明确它只是公网集成测试环境。

## 2. 已经完成的事实（不重复开发）

- PR [#723](https://github.com/jiangxng/EVO-App-Platform/pull/723)：财务权威及分支治理正式目标、历史来源/决策交接内容已合入 main；main merge SHA a53edbc257d98e233b45d3ca55f73dfad99c554d。
- PR [#759](https://github.com/jiangxng/EVO-App-Platform/pull/759)：Platform 加强直接 EVO 经济数据库查询的静态防线、回归测试及冻结影响审计；main merge SHA f29a5e22053a23fca2c3f5dd8b89e822b470aef5；**只是静态护栏，不是 B2D3 经济语义修复完成**。
- PR [#757](https://github.com/jiangxng/EVO-App-Platform/pull/757)：48 个左右内置 package 清单覆盖 4 种插件名称语言（英语、简体、繁体、日语），重新基于最新 main 验证 47/47 CI 后合入；main merge SHA a35d68ddef5abbf1adfa3290317e9a069ddc449f。标题多语言 != 全页面国际化。
- 同一 commit **a35d68dd** 已部署既有 Railway Ledger Configurator 公网测试服务，deployment ded25373-a791-498c-a6c4-15cd1309d62a，SUCCESS、/health 检查 PASS、单实例在线。地址 https://ledger-configurator-production.up.railway.app；**无原生浏览器人验签收**。
- PR [#764](https://github.com/jiangxng/EVO-App-Platform/pull/764)：分支实况/14 条 B2D3 内容路径去重、单应用验收约束进入主线；合并 SHA ca794e9ee3bfdd7197418dfff197a70ca805e7aa。5 条已吸收的历史 Platform Git refs 按 exact SHA / merged PR ancestry / 开放 PR 防护被自动安全删除；GitHub workflow 38148807773 SUCCESS，删除后逐一确认五条 ref 不存在。
- 之前的模板、导入、TUGE 登录、Ledger 参考边界及 Purchase→Receipt→Reversal 历史回归已有 #716/#717/#719/#721/#722；不是本窗口新做任务，证据见旧交接。

## 3. 接续快照（2026-10-11，再查后才能操作）

- 本交接创建文档分支之前，Platform main 为 **92b3712779f660172233ff4759d666e6c25b22c1**（2D 并行窗口持续合入，因此和 Railway 固定版本不同）。
- GitHub 有 **73 分支**：main 1、TR01/B2D3 14、Agent 11、2D/EOG/Projection 46、已合并 PR #764 的清理源分支 1。本交接分支另加 1 条临时分支；**不能用 73 作为日后实时数量**。
- 11 个开放 PR（经 API 实际查询，包含 Finance Draft #594、2D Draft #762/#715、Agent Draft 等）；Finance #594 和 EVO #108 仍 **Draft / open**，不可大合并。
- 14 条 TR01/B2D3 分支比现行 main 旧，彼此共享很多安全/财务历史基础；Git blob-tree 分析显示并集 **24 个主线没有的文件路径**，其中 **23 个路径只有一种历史 blob**，独立数据库登录工具有 3 个历史版本。注意“缺失路径”统计**不覆盖同名文件的语义差异**。
- Railway 服务仍固定 **a35d68dd**，没有随着 main 的 2D 提交自动部署；不能将 main 最新 SHA 说成已经在线。

## 4. 新窗口第一步 / 当前优先任务

**先闭合 F0–F4 的历史资产清单，不大规模合并：**

- F0：六个旧独立插件壳/Preview 与当前 main 的 #703/#731 比较；只保留未吸收的断言、真正业务价值，不恢复旧 Catalog/Host 硬编码。
- F1：Draft #594 的 Finance Owner / Host delegation 做“身份验证 vs 经济事实主权”分层：签名、nonce、数据库读取不等于正式 Runtime 解释；先定版本化语义接口，暂不开放财务写入。
- F2：12 个缺失的安全/隔离/凭据/真实 HTTP/PostgreSQL 脚本去重并核查可运行性；只选择可重现的有价值测试，与当前 main 独立 CI。
- F3：静态演示、Railway 预检与研究原件归档，区分 DEMO 与真实已安装业务。
- F4：六/十二阶段门禁去重，与现行可信权限边界核对，不能凭 old production 命名推动正式投产。

**退出条件**：每组有源码/差异证据、明确采纳或拒绝原因和对应小 PR/CI；旧 ref 有完整 source SHA 留档且不为开放 PR/并行开发所用，才触发安全退役。**14 条尚未退役**。

然后只启动 **采购订单一个插件**：真实 Supplier/Item/Warehouse 选择、创建和批准一笔采购单、通过受管 Host 合同提交 purchase_order.approved 到 EVO、读取同一事实对应的 Posting/Ledger/Work、将可操作页面发布到既有 Railway 公网测试站，交由用户亲自验收。不要同时实现另外五个。

同时保留独立导入主线的高优先级：真实 172 行 SUPPLIER XLSX 自动映射、dry-run、提交与第二次 recipe 复用尚需用户端复测；不得被无止境的 Finance Owner 研究挤掉。

## 5. 新窗口阅读纪律

1. 从此入口读三份配套文件；先确认来源“已读完整原文 / 已读片段 / 只看 GitHub 元数据 / 尚未验证”，不要将 GitHub PR 标题当源码验收。
2. 新窗口开始先重查 GitHub main、branches、open PR、Railway pinned deploy、EVO main。遇到变更只修正增量，不覆盖独立 2D/Agent 工作。
3. 当前交接分支为 **docs/platform-convergence-window-handoff-20261011**；精确 handoff commit SHA 与 PR 由完成交接时 GitHub 实际返回值确定，不在文档中猜测。
4. 没有从公网抓取第三方商业技术文章、没有本窗口截图或附件；官方外链若未直接访问，标为待核查。不要补造作者、发布时间或截图位置。


## 2026-10-11 本窗口接续增量（不同于以上交接时点快照）

- **F0 小步已合 main**：[PR #775](https://github.com/jiangxng/EVO-App-Platform/pull/775)，squash merge `014196f7a52f7051ef9a0fa8ea524e14b23169de`。仅提取旧四 peer 源码中现代测试未覆盖的 Eidos 渲染、插件独立启停、禁止财务写入回归；包含 [F0/F2 源码回收证据](https://github.com/jiangxng/EVO-App-Platform/blob/014196f7a52f7051ef9a0fa8ea524e14b23169de/docs/archive/PLATFORM-20261011-F0-FOUR-PEER-SOURCE-RECOVERY.md)。
- 最新 head `d2f560074b4a46290cec6e6e784e7deb6b8a94d3` 的 [Platform CI 38153528258](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38153528258) 和 [Continuity 38153528267](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38153528267) 均 SUCCESS。因 main 并行 2D 前进而触发的 GitHub required-check 阻断，已通过非强制正常同步 main + 新 CI 合法解决。**没有触发 Railway 新部署；没有删除 14 条 TR-01 源分支。**
- 当前只完成 **F0 的第一小项**，不是 F0–F4 全部关闭，亦未开始 Purchasing 真实实现。最新的 F1/F2/F4 审查在同批 Evidence、Decisions、Source Index 追加小节中；以上旧 SHA/count 保留为历史快照，不直接覆盖。


## 2026-10-12 F2 续接：已合并的一项和未关闭项

- F2-PG-01 已合并：[PR #777](https://github.com/jiangxng/EVO-App-Platform/pull/777)，merge commit **aa6432f0d525b2ef3ad02c358c9ab83e093238f3**。代码在 [F2 归档](https://github.com/jiangxng/EVO-App-Platform/blob/aa6432f0d525b2ef3ad02c358c9ab83e093238f3/docs/archive/PLATFORM-20261012-F2-DISTINCT-LOGIN-RECOVERY.md)，新增一次性 PostgreSQL 16 双独立 LOGIN、权限拒绝及撤权检查。
- 固定合并前 head **78a9d299aabf0aaf6d276196645549e7d8f8d945**：[Postgres CI 38154708390](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38154708390) PASS（16 checks）、[Platform CI 38154708378](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38154708378) PASS、[Continuity CI 38154708397](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38154708397) PASS。
- 这只是 Postgres 权限安全的一项，不是 Finance Owner 经济语义认证，也不是正式 HTTP Listener 认证。所有 14 条旧 TR-01 原 ref、#594/#108 Draft 及未实施 Purchasing 的决策均保持不变。


## 2026-10-12 F1 Host 已有签名客户端功能回归（新微步）

- [PR #779](https://github.com/jiangxng/EVO-App-Platform/pull/779) 已合入 main，merge SHA **09fee6f8f327871b71e0b37a9e19a7f16161db57**。仅新增 1 个 Protocol Test 与 1 个审计归档：[F1 Host signed loopback record](https://github.com/jiangxng/EVO-App-Platform/blob/09fee6f8f327871b71e0b37a9e19a7f16161db57/docs/archive/PLATFORM-20261012-F1-HOST-SIGNED-LOOPBACK-RECOVERY.md)。
- 固定 head **c65447b2478c56ca8a808ce560f2b1fdabcdf2f7**：[Platform CI 38155748502](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38155748502) SUCCESS、[Continuity CI 38155748491](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38155748491) SUCCESS。
- 真实 loopback TCP socket + Ed25519 Host assertion、actor/tenant/context/order/45 秒/jti 绑定、Host 对未经授权 scope/endpoint/key 的拒绝和远端越权/不只读结果的拒绝。**接收端为刻意设计的本地测试桩，不是 EVO Owner 真实金融事实查询，也不代表真实 Finance-only HTTP 服务上线。**
- 初次 [CI 38155514269](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38155514269) 与二次 [CI 38155633156](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38155633156) 失败，均为新测试对既有精确错误码前缀预期写错；只修正测试、不改生产代码。失败与纠正原文已保留于归档文件。


## 2026-10-12 全量旧分支哈希再盘点

本窗口新增第三个合并的 F1 Host-side 回归 #779，随后重新扫描 GitHub 最新 main `09fee6f8f327871b71e0b37a9e19a7f16161db57` 及 14 条旧 TR01 分支的所有 blob（15 个完整 recursive trees，truncated=false）。与原交接保持一致：**24 条旧源缺失路径不变**，23 个单一 blob + 三版 `certify-tr01b2d3-distinct-db-logins.mjs`。主线与旧分支同名 72–79 个文件的 blob 不同，不能直接整文件迁移。详细逐源计数及分类保留在本交接 Execution Evidence §J；14 条源分支全部留存。后续重点仍是功能级审查跨实例 nonce、Host Session 与生产 Owner 独立接口，不能因 CI 的局部成功跳过实际安全门槛。
