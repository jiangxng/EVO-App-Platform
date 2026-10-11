# Platform 窗口执行/差异/易变化证据留存 — 2026-10-11

> **本文件是会话中查阅过的 GitHub/Railway 证据复现指引**，不是自动生成的 CI 报告，也不声称文件中所有遗留脚本已通过当前主线运行。源码大段原文仍由 GitHub SHA 固定，避免重复复制和将旧实现误作新合同。资料入口位于 [Handoff Entry](../roadmap/PLATFORM-20261011-WINDOW-HANDOFF-ENTRY.md)。

## A. 本次实际写入和执行记录

| 时序 | 原始证据 | 完成状态 | 不能推断的事项 |
| --- | --- | --- | --- |
| EVO 冻结影响审计 | Platform [#759](https://github.com/jiangxng/EVO-App-Platform/pull/759)、[freeze impact](../roadmap/TR01-EVO-LEDGER-RUNTIME-FREEZE-IMPACT-20261011.md)；EVO 固定主线 d5ce051325c4572c7a5fd713560d7d7d06e4b401 | 已读 ADR 和 EVO 历史 diff；Platform 静态 guard 合 main f29a5e22053a23fca2c3f5dd8b89e822b470aef5 | 没有重新认定所有未来 Replay/Cost 财务路径生产安全 |
| 财务主权正式治理 | Platform [#723](https://github.com/jiangxng/EVO-App-Platform/pull/723) | 已合 main a53edbc257d98e233b45d3ca55f73dfad99c554d | G0–G5 内容是验收门槛，尚未全部实施 |
| 四语言 Package Titles | Platform [#757](https://github.com/jiangxng/EVO-App-Platform/pull/757)；47 个 head SHA 5933fe64a997da1322c594f29f7a3b04fc0e5da7 工作流成功 | 已合 main a35d68ddef5abbf1adfa3290317e9a069ddc449f | 不等于所有插件页面全文四语完成 |
| 公网测试部署 | Railway deployment ded25373-a791-498c-a6c4-15cd1309d62a，Host URL https://ledger-configurator-production.up.railway.app | 源 SHA a35d68dd...、SUCCESS、/health PASS、1 running、0 warning/critical | 不是网页操作/真实业务用户签收；production 是 Railway 环境名，不是正式投产 |
| 剩余分支分类、清理五条旧尾项 | Platform [#764](https://github.com/jiangxng/EVO-App-Platform/pull/764) 合并 ca794e9ee3bfdd7197418dfff197a70ca805e7aa | [预审核 run 38148732389](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38148732389) SUCCESS，日志 5 条 TAIL_REF_VERIFIED、AUDIT_ONLY；[main push run 38148807773](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38148807773) SUCCESS；再次 GET /branches 确认 5/5 refs 不存在 | 尚未删除 14 B2D3 或并行 Agent/2D；不能以分支减少证明业务完整 |
| 本次交接前最新实时读取 | [main branch API](https://api.github.com/repos/jiangxng/EVO-App-Platform/branches/main)、[branch list](https://api.github.com/repos/jiangxng/EVO-App-Platform/branches?per_page=100)、[open PRs](https://api.github.com/repos/jiangxng/EVO-App-Platform/pulls?state=open&per_page=100) | Platform main 92b3712779f660172233ff4759d666e6c25b22c1，73 refs，11 open PR，EVO main d5ce051... | 本交接 docs 分支新建后会额外增加临时 ref；2D 同时推进故下次须重查 |

### 已经逐一证实删除的五条（本窗口，勿再派工）

1. chore/prune-functionally-converged-nonparallel-20261011 — 56063b50802697fcbdddf772683a4b9d174907ba，main 祖先。
2. chore/retire-merged-platform-squash-heads-20261011 — 95845cdde006f63df67e766cc9e3153c8a81e960，PR #743 已合。
3. docs/platform-convergence-research-handoff-20261011 — c51e9d7889af030d1365de309aa28bbfd234e6d4，PR #723 已合。
4. fix/plugin-title-localization-20261011 — 5933fe64a997da1322c594f29f7a3b04fc0e5da7，PR #757 已合。
5. fix/tr01-runtime-authority-guard-20261011 — 1435fccd8e191db3e908ba1d06851ff2cbf19213，PR #759 已合。

**准确执行证明**：#764 PR discussion 已记录 post-delete GitHub count 和链接；新窗口可按 [Actions run](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38148807773) 与实时 refs 再核对。被删除的是 branch ref，不是对应的 Git PR/commit/源历史。

## B. 14 个未收敛 B2D3 branch 的 pinned source SHA

以下按 GitHub branch API 实际返回记录。**所有 14 个保留；Finance Draft #594 的 head 也保留。**

| Source branch | Exact head | 是否有开放 PR |
| --- | --- | --- |
| [demo/tr01b2d3-isolated-live-stage-20261011](https://github.com/jiangxng/EVO-App-Platform/tree/bd67f320dce5ed6d4a023b58546b619ce4a03aa0) | bd67f320dce5ed6d4a023b58546b619ce4a03aa0 | 无，仍不可直接删 |
| [docs/tr01b2d3-mainline-recovery-20261011](https://github.com/jiangxng/EVO-App-Platform/tree/b67e84375c9247faa69b01a3cf93d3cf1daf9adb) | b67e84375c9247faa69b01a3cf93d3cf1daf9adb | 无，仍不可直接删 |
| [docs/tr01b2d3-railway-runtime-preflight-evidence-20261011](https://github.com/jiangxng/EVO-App-Platform/tree/3e7d5182bc5f4ae03ca638c76524872086a0cbec) | 3e7d5182bc5f4ae03ca638c76524872086a0cbec | 无，仍不可直接删 |
| [feat/tr01-trading-peer-purchasing-receiving-20261011](https://github.com/jiangxng/EVO-App-Platform/tree/7e23173250a23aa396555fed77a1470ebd099708) | 7e23173250a23aa396555fed77a1470ebd099708 | 无，仍不可直接删 |
| [feat/tr01b2d3-definer-owner-strict-admission-20261011](https://github.com/jiangxng/EVO-App-Platform/tree/0560386e0915ebb607f183e215fb0f728cfe3220) | 0560386e0915ebb607f183e215fb0f728cfe3220 | 无，仍不可直接删 |
| [feat/tr01b2d3-deployment-descriptor-gate-20261011](https://github.com/jiangxng/EVO-App-Platform/tree/c589f0bf1b79aed8700e601648ee335e913d5ba2) | c589f0bf1b79aed8700e601648ee335e913d5ba2 | 无，仍不可直接删 |
| [feat/tr01b2d3-finance-owner-prod-preflight-20261011](https://github.com/jiangxng/EVO-App-Platform/tree/718215136f79efd79d7e755954d686d77cf73356) | 718215136f79efd79d7e755954d686d77cf73356 | 无，仍不可直接删 |
| [feat/tr01b2d3-four-peer-business-plugins-stage-20261011](https://github.com/jiangxng/EVO-App-Platform/tree/fb3db99272ef047aa7686715fd495545f9342ccf) | fb3db99272ef047aa7686715fd495545f9342ccf | 无，仍不可直接删 |
| [feat/tr01b2d3-host-owner-delegation-20261010](https://github.com/jiangxng/EVO-App-Platform/tree/1d6149bd05136d642e49aab5196d12ab243cbe4e) | 1d6149bd05136d642e49aab5196d12ab243cbe4e | [#594 Draft](https://github.com/jiangxng/EVO-App-Platform/pull/594) |
| [feat/tr01b2d3-six-lane-production-admission-20261011](https://github.com/jiangxng/EVO-App-Platform/tree/8a0a27dca96ac69cb1fcef2eaffca6a43bc75dc4) | 8a0a27dca96ac69cb1fcef2eaffca6a43bc75dc4 | 无，仍不可直接删 |
| [feat/tr01b2d3-twelve-lane-preprod-20261011](https://github.com/jiangxng/EVO-App-Platform/tree/75e8565708433c3ed046016bc76bf45e054a03c0) | 75e8565708433c3ed046016bc76bf45e054a03c0 | 无，仍不可直接删 |
| [test/tr01b2d3-cross-instance-nonce-revocation-race-20261011](https://github.com/jiangxng/EVO-App-Platform/tree/33675b9e9ec739d8a50d60277731030abeb3b284) | 33675b9e9ec739d8a50d60277731030abeb3b284 | 无，仍不可直接删 |
| [test/tr01b2d3-distinct-db-login-http-20261010](https://github.com/jiangxng/EVO-App-Platform/tree/ff2fd23e83ebf72a5fc0c21757f729fd800594ac) | ff2fd23e83ebf72a5fc0c21757f729fd800594ac | 无，仍不可直接删 |
| [test/tr01b2d3-isolated-finance-owner-credential-http-20261011](https://github.com/jiangxng/EVO-App-Platform/tree/c8cfda818d5226086b6a9c0124b3187c0d8a7f9a) | c8cfda818d5226086b6a9c0124b3187c0d8a7f9a | 无，仍不可直接删 |

## C. 真正缺于 main 的文件路径：24 个（不是 14 倍独立功能）

**调查方法**：取 Platform main 固定源 SHA a35d68ddef5abbf1adfa3290317e9a069ddc449f 的递归 Git tree；取上文 14 源头 Git tree；按 Git blob path/SHA 的集合对比，而非只用 compare commits 的 ahead/behind 数。结果路径并集如下；这代表历史源资产位置，**不是全部都可直接合并 main 的清单**。

- GitHub Actions：6
- 孤立静态 Stage Demo：3
- 研究证据文档：1
- Protocol tests：2
- CI tools/scripts：12

### 24 个 exact paths

- .github/workflows/tr01-peer-purchasing-receiving.yml
- .github/workflows/tr01b2d3-finance-owner-deployment-preflight.yml
- .github/workflows/tr01b2d3-four-peer-stage.yml
- .github/workflows/tr01b2d3-online-stage-preview.yml
- .github/workflows/tr01b2d3-six-lane-admission.yml
- .github/workflows/tr01b2d3-twelve-lane-admission.yml
- demos/tr01b2d3-isolated-stage/index.html
- demos/tr01b2d3-isolated-stage/railway-function.ts
- demos/tr01b2d3-isolated-stage/static-demo.mjs
- docs/roadmap/TR01B2D3-STAGE-DEMO-ONLINE-20261011.md
- tests/protocol/tr01b2d3-four-peer-stage-plugins.test.mjs
- tests/protocol/tr01b2d3-online-stage-preview.test.mjs
- tools/certify-tr01b2d3-cross-instance-races.mjs
- tools/certify-tr01b2d3-distinct-db-logins.mjs
- tools/certify-tr01b2d3-host-hot-signing-key.mjs
- tools/certify-tr01b2d3-host-https-identity.mjs
- tools/certify-tr01b2d3-hot-trust-rotation.mjs
- tools/certify-tr01b2d3-installed-host-session.mjs
- tools/certify-tr01b2d3-oidc-login-owner.mjs
- tools/certify-tr01b2d3-postgres-role-separation.mjs
- tools/certify-tr01b2d3-trusted-owner-delegation.mjs
- tools/create-tr01b2d3-ci-keys.mjs
- tools/create-tr01b2d3-installed-host-ci.mjs
- tools/run-tr01b2d3-installed-host-ci.mjs

### 3 版同路径脚本的实际 blob SHA 与有界源码差异

本交接进一步通过 GitHub Git tree 和 fetch_blob **实际读取了这三个 blob 的原文**，不只看了 branch 名称；它们共享“独立 Postgres LOGIN，而非 SET ROLE”的思路和 disposable CI 限制，**都不认证生产密码/部署**。

- V1：blob [79f998e432fa3fb7e9e5db41cfaf51b33929ef1e](https://github.com/jiangxng/EVO-App-Platform/blob/1d6149bd05136d642e49aab5196d12ab243cbe4e/tools/certify-tr01b2d3-distinct-db-logins.mjs)；321 行；出现在 10 条旧分支；**源码差异事实**：以 finance-only 进程而非 full EVO API 用独立 Runtime DB LOGIN 执行测试，同时在末尾追加 strict catalog owner preflight：NON_SUPERUSER_OWNER_SCOPE_AUTOMATED_PASS，但 productionCertification=NOT_CERTIFIED。
- V2：blob [e18eb2ce908494e9b841c5558a8f6faf9a1a3502](https://github.com/jiangxng/EVO-App-Platform/blob/3e7d5182bc5f4ae03ca638c76524872086a0cbec/tools/certify-tr01b2d3-distinct-db-logins.mjs)；309 行；出现在 2 条旧分支；**源码差异事实**：使用专用 finance-owner-readonly-main 独立 Listener，明确要求 /api/v1/commands、demo 和其它非 finance 路由返回 404；未包含第一版本末尾 catalog preflight。
- V3：blob [56b0a439b2649a842bf078f55b888f418fef82c9](https://github.com/jiangxng/EVO-App-Platform/blob/ff2fd23e83ebf72a5fc0c21757f729fd800594ac/tools/certify-tr01b2d3-distinct-db-logins.mjs)；287 行；出现在 2 条旧分支；**源码差异事实**：较旧的版本以 dist/apps/api/src/main.js（完整 EVO HTTP 进程）运行测试；不具第二版对独立 Listener 和非 finance 路由 404 的收敛断言。

差异比较结论：版本一增加了 strict owner catalog preflight；版本二已有专用只读 Finance Listener 的 404 隔离证明；版本三使用旧 full EVO API main.js。**尚未用现代 main/当前真实 disposable PostgreSQL 环境重新运行三版**。选择版本一的代码最全不等于无需迁移依赖；必须对照当前主线合格 Host/runtime 归属重构为最小测试资产，再重跑并且保留 fail-closed 结果。

## D. 真实业务调用和阶段 Preview 的关键“同事实链”索引

- Synthetic 六包各自独立 Package，可由 Stage Preview 双环境开关展示；demo-kit 的 badge 是 SYNTHETIC/READ-ONLY，财务写入禁止，不能用 Demo PO-1001 / SO-1001 作为真实 BusinessDataId。
- 真实采购：apps/trading-reference/purchase-loop.ts 中 approvePurchaseOrder(约 198–257 行) 提交 purchase_order.approved；receivePurchaseOrder(约 259–326 行) 以原 BusinessDataId FULFILLS 提交 goods_receipt.received；reversePurchaseReceipt(约 329–410 行) 以 REVERSES 提交 goods_receipt.reversed。
- 真实销售：apps/trading-reference/sales-loop.ts 中 approveSalesOrder → sales_order.approved；completeOrderProduction → production.completed（履约 MAKE）；shipSalesOrder → sales_shipment.created；receiveCustomerCash → cash.received，原来源通过 REFERENCES 而非 allocation。
- EVO 接收事实：contracts/evo-business-data.ts、manager/evo-business-data-http-adapter.ts 对应 public POST /api/v1/business-data。返回 businessDataId/postingInputId/postingSequence/QUEUED 或 BLOCKED_REPLAY_REQUIRED；必须结合正式 ledger/work read、状态和 Replay 验证。
- 受管业务展示：apps/trading-reference/operational-projection.ts 与 sales-operational-projection.ts 查询 pending_purchase/payable/inventory、pending_shipment/receivable/cash 和 Work，并对权限、精确维度、分页不完整、权威视图冲突 fail closed。
- 演示与真实的两个直接命名不一致：Stage Shipment = sales_order.shipped vs 真实 sales_shipment.created；Stage Cash = customer_cash_receipt.recorded vs 真实 cash.received。不得将前者照抄为已注册 PostingRule 类型。

以上源码源版本：Platform commit a35d68ddef5abbf1adfa3290317e9a069ddc449f。详细原文 URL 在来源索引中 S11–S19。

## E. 易变状态、截图、附件和未执行清单

- **原始资料在线保存**：GitHub repo commits、pulls、Actions run IDs、14 个原 head SHA、3 个 Git blob SHA、固定源文件链接；不可重现的执行日志以 GitHub Actions 的实际保留策略为准。没有额外上传镜像文件。
- **截图/图片/附件路径：无**。没有本窗口原生 Chrome/GitHub/Railway 的截图、PDF、DevTools HAR、用户 Excel 上传件副本；不能在新窗口虚构这些附件已留存。
- **未完成并未冒充保存**：14 个 B2D3 的同路径 diff 的逐函数安全合并决策；Finance Owner 受管 Runtime 经济解释新接口；六应用真实业务源码；User ACCEPTED 证据；原 XLSX 172 行一次/二次导入的当轮浏览器人验；标题四语言的人工页面验收；三版本 DB 登录脚本的当轮真实 PostgreSQL 运行。
- **状态标签建议**：区分 CODE_PRESENT、CI_PROVEN、MERGED_MAIN、DEPLOYED_PINNED、HUMAN_ACCEPTED 五阶段。当前 #757 达前四项、未达人工签收；#764 的清理是 Git ref EXECUTED/VERIFIED；六个应用仅 DEMO 壳，不达真实 CODE_PRESENT 的业务能力。
- **本窗口 GitHub 写入范围**：此前 #723/#759/#757/#764 已合；本次 handoff 仅新增独立 docs 分支上的四份 Markdown，不写 project.status.json、不改 Agent/2D/Eidos/EVO 代码，不执行 Railway redeploy。

## F. 新窗口恢复顺序

1. 从 ../roadmap/PLATFORM-20261011-WINDOW-HANDOFF-ENTRY.md 进入，按来源索引、决策缺口、本证据顺序读。
2. 最新 main/PR/ref 与 Railway 固定部署再核验，因为交接期间 2D 专项持续写 main；不要照搬历史 totals。
3. 将 B2D3 14 条按 F0–F4 做逐项源 SHA、同路径 diff、可复用测试、受管 runtime 语义边界 review。能以小 PR 验证并合入的做；不能安全吸收的留下归档原因，不强删。
4. 用户明确选定的开发节奏是**一个应用一个验收**，从 Purchasing 开始，未等到上一应用用户签收前不并行做下一个。


## G. 新窗口实际执行增量（2026-10-11）

| 事项 | 当前状态/精确证据 | 边界 |
| --- | --- | --- |
| 14 TR-01 源 refs 重查 | GitHub branch API 查得原先列明的 14 个名字及 SHA 完全一致；读取时全库 77 branches（此前交接分支已增加，另有并行 Diagram 新 refs） | 数量是此轮操作前快照，当前不把 77 写成永久数 |
| 13 open PR 快照 | PR API 共 13；#771 Docs Draft open，#594 Finance Draft open，EVO #108 open/draft；新增 #775 后计数另有变化 | 并行窗口增减属正常，旧数字不直接比较宣称漏项 |
| Railway 部署重查 | `Ledger Configurator` service a8622238...，commit pin `a35d68ddef5abbf1adfa3290317e9a069ddc449f`；deployment `ded25373-a791-498c-a6c4-15cd1309d62a` SUCCESS，1/1 Online、无 severe issues、无 staged changes | 没有变更源或重部署；production 仅集成测试名 |
| F0 源码回收 | [#775](https://github.com/jiangxng/EVO-App-Platform/pull/775) 合 main `014196f7a52f7051ef9a0fa8ea524e14b23169de`；原 head 经非强制并行 main merge 更新到 `d2f560074b4a46290cec6e6e784e7deb6b8a94d3` | 仅新增 `tests/protocol/platform-f0-four-peer-source-recovery.test.mjs` 和 `docs/archive/PLATFORM-20261011-F0-FOUR-PEER-SOURCE-RECOVERY.md` |
| CI 定版 | [Platform CI 38153528258](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38153528258) SUCCESS；[Continuity 38153528267](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38153528267) SUCCESS；合并 API 返回 `merged:true` | 不等于 Railway 部署/真经营账本/用户验收 |
| F1 功能同名审核 | finance-intent-admission、finance-owner-remote 两文件主线与 #594 旧分支相同 blob；Provider Manifest main 包含后补 title locale，仍标注 executionAllowed false | Draft #594 禁止合并，经济合约未获正式认证 |
| F2 / F4 审核 | 12 old CLI tools 完整读取 import、生产限制线索；6 old workflows 完整读取调度及静态/合成门禁；具体依赖矩阵见 #775 新增 archive 文档 | 这些旧脚本未在现代主线及真实 PostgreSQL 全部重跑，不把原 CI 宣称本次 CI_PASS |

**仍待执行**：14 个 B2D3 old source 的同路径功能级差异还需继续 F1/F2/F3/F4；Purchasing 真实应用及人验尚未开始；#771 仍只作 Docs Draft。


## 2026-10-12：F2 PostgreSQL 小 PR 实证

- GitHub [PR #777](https://github.com/jiangxng/EVO-App-Platform/pull/777) closed/merged，merge SHA **aa6432f0d525b2ef3ad02c358c9ab83e093238f3**；合并前 head **78a9d299aabf0aaf6d276196645549e7d8f8d945**，同步 main 使用非强制 merge commit，未改并行 Agent/2D 文件。
- [一次性 PG 16 workflow 38154708390](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38154708390) SUCCESS，日志实际输出 status=PASS、checks=16、TWO_DISTINCT_REAL_POSTGRES_LOGINS、revokeWithoutReconnect=true、financeTablesTouched=false、actualEvoOwnerListener=NOT_TESTED、productionCertification=NOT_CERTIFIED、executionAllowed=false。
- [Platform CI 38154708378](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38154708378) SUCCESS；[Project Continuity 38154708397](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38154708397) SUCCESS。
- 保留三版旧工具 blob：V1 79f998e4、V2 e18eb2ce、V3 56b0a439，均未整支恢复；不删 14 条历史 refs，不合并 Finance Draft，未触发 Railway 部署。
- 新详细决策在主线 [PLATFORM-20261012-F2-DISTINCT-LOGIN-RECOVERY.md](https://github.com/jiangxng/EVO-App-Platform/blob/aa6432f0d525b2ef3ad02c358c9ab83e093238f3/docs/archive/PLATFORM-20261012-F2-DISTINCT-LOGIN-RECOVERY.md)。


## I. F1 真实 Host 签名客户端（非 EVO Owner）回归合并证据

- [#779](https://github.com/jiangxng/EVO-App-Platform/pull/779) MERGED；固定 head c65447b2478c56ca8a808ce560f2b1fdabcdf2f7、main merge **09fee6f8f327871b71e0b37a9e19a7f16161db57**；仅增加一个 `tests/protocol/platform-f1-signed-owner-loopback-boundary.test.mjs` 和 `docs/archive/PLATFORM-20261012-F1-HOST-SIGNED-LOOPBACK-RECOVERY.md`。
- [Platform CI 38155748502](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38155748502) SUCCESS，[Continuity CI 38155748491](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38155748491) SUCCESS。
- 两次红 CI [38155514269](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38155514269)、[38155633156](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38155633156) 均为测试断言把 `TR01B2D3_SIGNING_KEY_INVALID` / `TR01B2D3_HOST_IDENTITY_INVALID` 错误预期带 `OWNER_`；只更正测试。没有放宽生产客户端安全码。
- 测试用 Node 本地回环网络 + real Ed25519 key/verification；**没有** EVO 服务端真实 Owner 路由、真实 PostgreSQL finance trust、经济事实和真实部署证据；仍标明 NOT_CERTIFIED / executionAllowed=false。


## J. 2026-10-12 14 条历史分支全量 Git Tree 与最新 main 的逐文件 SHA 再核验

**方法：** 使用 GitHub `git/trees/<full commit SHA>?recursive=1`，对 main `09fee6f8f327871b71e0b37a9e19a7f16161db57` 与交接登记的全部 14 个历史固定 tip，读取 15 棵完整递归树（`truncated=false`），按路径是否存在、同路径 blob SHA 是否一致分别核对。此法验证文件字节是否相同，不等于功能已被现行 main 吸收。

| 历史固定 tip（前缀） | 源 blob 文件数 | main 中缺失的文件数 | main 同路径不同 blob 数 |
| --- | ---: | ---: | ---: |
| demo isolated bd67f320 | 1181 | 21 | 72 |
| docs recovery b67e8437 | 1184 | 17 | 77 |
| docs Railway preflight 3e7d5182 | 1156 | 12 | 72 |
| peer Purchasing+Receiving 7e231732 | 1189 | 19 | 79 |
| definer owner strict 0560386e | 1163 | 13 | 72 |
| deployment descriptor c589f0bf | 1163 | 13 | 72 |
| prod preflight 71821513 | 1163 | 13 | 72 |
| four peer stage fb3db992 | 1183 | 17 | 77 |
| Finance Draft #594 1d6149bd | 1189 | 19 | 79 |
| six-lane 8a0a27dc | 1171 | 14 | 72 |
| twelve-lane 75e85657 | 1175 | 15 | 72 |
| cross-instance race 33675b9e | 1154 | 12 | 72 |
| distinct DB login ff2fd23e | 1152 | 11 | 72 |
| isolated credential HTTP c8cfda81 | 1155 | 12 | 72 |

**24 distinct missing paths across all 14 source tips, exactly as earlier audit:** six `.github/workflows` (peer-purchasing-receiving, four-peer-stage, online-stage-preview, finance-owner-deployment-preflight, six-lane-admission, twelve-lane-admission); 12 `tools` scripts (certify cross-instance races, distinct DB logins, Host hot signing key, Host HTTPS identity, trust rotation, installed Host session, OIDC login, PG role separation, trusted owner delegation, create CI keys, create installed Host CI, run installed Host CI); three `demos/tr01b2d3-isolated-stage` files (`index.html`, `railway-function.ts`, `static-demo.mjs`); two protocol tests (four-peer-stage and online-stage-preview); one `docs/roadmap/TR01B2D3-STAGE-DEMO-ONLINE-20261011.md`. No Git Tree was truncated.

**重复版本审计：** 23 条缺失路径的 blob 在出现该路径的各旧 tip 之间一致；`tools/certify-tr01b2d3-distinct-db-logins.mjs` 有三版：`79f998e432fa3fb7e9e5db41cfaf51b33929ef1e`、`e18eb2ce908494e9b841c5558a8f6faf9a1a3502`、`56b0a439b2649a842bf078f55b888f418fef82c9`。三版都已源码级分析、其独立 LOGIN 控制已通过 F2 #777 中新的受控 PostgreSQL CI 重建，但旧原文仍应按各自 SHA 留存。

**同路径高风险差异的含义：** 在旧 tip 中至少 72 条路径的 blob 与 modern main 不同，包含 `manager/server.ts`、`catalog/seed.ts`、`manager/plugin-store-page.ts`、`manager/provider-manager-page.ts`、`providers/trading-finance-owner/package.ts`、`.github/workflows/cross-project-tr01b-sales-evo-postgres.yml` 和 stage package 等。旧目录比 main 少数百文件，**旧文件 blob 不同通常反映历史基线落后，必须执行具体功能和授权语义比对；不得将 mismatch 判定为主线遗漏，也绝不能恢复旧 Host Core**。目前仅 F0 #775、F2 #777、F1 #779 已选取独特回归并以 CI 合入；旧 Demo F3 源码保留但不迁正式产品，旧 F4 工作流多与现行门禁重复。

**保留 / 删除决策：** 不因 Tree 查看完毕即删除历史分支：剩余的 Host-managed session、跨实例 nonce race、RSA/OIDC/实际 TLS、生产 Owner listener、外部 key custody 等仍有未关闭的真实认证门槛。尤其 Finance #594 是 OPEN Draft 且仍有外部 EVO #108 Draft 依赖。全部 14 refs 保留原 head，待逐项明确资产归属和生产/CI 合同后再按 Git SHA 租约安全退役。此次未读 Agent/Diagram 分支的代码，亦无一项其改动。
