# 平台分支收敛与六应用逐项验收 — 决策、方案比较、冲突及未决问题

> 2026-10-11 的决策记录。**用户明确决定**、**GitHub/EVO/Railway 可复核事实**及**本窗口工程判断**分别标注。不是 Runtime 新架构 ADR，不是财务投产签收，不替代各独立窗口的决策。

## 1. 明确目标、用户指令和工作边界

### 用户已明确要求（U，原始意图）

- U1：平台历史分支曾达 173 条，陌生 LLM 容易不知从何入手；先收敛归档再继续实际六应用，拒绝“仅删引用/合并 PR 数字好看却丢功能和证据”。
- U2：EVO Ledger Runtime 已有被验证过的确定性记账能力，不需要因六插件串联而重写账本运行时。
- U3：六个业务应用**一次只做一个**，不接受几天后一次性六包验收；由于上下文 Token 限制，必须及时把人类用户的验证/纠正写回仓库，避免长时间无人验收后的 LLM 方向偏移。
- U4：已有 Agent 主线、2D 商业化 v1.0 专项和 EVO Runtime 所有权独立；本窗口不得合并、删除或改写其 branch/PR 与关键文档。
- U5：合并必须安全，单功能小 PR、CI、真实浏览器/公开接口/用户接受的测试；Railway 用同一既有公网集成测试站，且上线 SHA 必须可复核。
- U6：更换窗口前须将已读研究原文、网址、时间、证据级别、决策对比、遗留问题和证据位置入 GitHub，提供准确文档分支、路径、SHA 和下一步入口。

### 直接查证过的来源事实（F）

- F1：Main 已有 6 个独立 trading-stage 包，但 demo-kit 静态单行列表带 SYNTHETIC、READ-ONLY、NOT_CERTIFIED；真正调用 EVO adapter.submit 的购买/销售代码位于 trading-reference。
- F2：EVO public BusinessData API 可提供 POST /api/v1/business-data、202 durable businessDataId/postingInputId，自动 Posting 生命周期；公开 Ledger Balance / Work 可读；QUEUED 不等于 POSTED。
- F3：已冻结的是 EVO 架构/权威边界。EVO 仓库后续确有 BusinessData REVERSES、公开余额读等扩展；存在内部 PostgreSQL Finance Fact Verifier，不等于 Ledger/FIFO/Replay 内核已复制，但也不能假定任意 Finance SQL 校验等价官方经济语义。
- F4：本次查证 Platform main 92b3712779f660172233ff4759d666e6c25b22c1，73 refs（main1/14 TR01/11 Agent/46 2D/1 已合并审计头）；同期 Railway pinned a35d68dd SUCCESS。
- F5：PR #757/#723/#759/#764 已合 main；#764 的 5 个历史 refs 清理在 GitHub Actions run 38148807773 确实执行成功，并重新枚举验证不存在。
- F6：B2D3 14 条历史树对比共 24 个 main 完全没有的路径，23 个路径历史 blob 相同，1 个登录/DB 隔离工具有 3 版；**不能由此推出同名但已存在于 main 的文件逻辑完全已吸收**。
- F7：PR #594 与 EVO #108 仍 Draft/open，旧分支经理端 finance 权限/签名路径未完成正式语义/真实公网准入审核。

## 2. 采用方案 vs 明确排除方案（事实/判断分开）

| 决策 / 性质 | 采用方案及理由 | 排除方案及理由 | 条件与限制 |
| --- | --- | --- | --- |
| D1 分支功能级收敛（U+工程判断） | 14 条 B2D3 拆为 F0–F4 去重共享资产，核对来源 SHA、提取现代 main 缺失的实际行为，做小 PR/权限负例/再安全删源 | **整支 merge、强行追平所有历史 commit、看名字直接删除**；会把旧 manager/server.ts、catalog、财务委托带回新平台 | Git 树统计说明重叠很大，仍需逐函数/安全审查；主线持续有并发 2D |
| D2 已吸收的历史 refs（F+判断） | 严格 Git main ancestor 或已合并 PR 的 exact head + merge SHA 是 main ancestor、开放 PR head/base 排除、受保护拒绝、删除前再读 SHA；#764 实证已成功 | “squash 后 diverged 就认为功能没合”“PR 已关闭就删”“只凭 branch 名判断” | 能证明 Git ref 退役安全，**不能自动证明用户业务验收**；本次仍有新合并的 #764 源头 |
| D3 EVO Runtime 与六应用（U+ADR） | Application 拥有业务语义、输入和操作；Host 管可信身份/授权/企业上下文；EVO 和正式经济扩展管 Posting/Ledger/Cost/Allocation/Replay；只读展示用正式结果 | 平台维护影子库存/AR/现金；Finance Owner 直接解释内部经济 SQL；让用户操作直接写 LedgerEntry；全部应用互相硬绑定到单一 Host Core | Host static guard 是基础防线，不是 Runtime 语义接口的完整替代；必须保留 EVO frozen ADR |
| D4 Finance Owner B2D3（F+判断） | 保留 #594 Draft，先隔离身份签名/nonce/租户/凭据职责，再由正式 Runtime/受管经济扩展输出版本化财务语义；正负例和 Replay 实证后再评估写入 | 凭 Postgres 查询 + 签名/HTTPS + 只读核验即允许正式成本/核销；合并大 Draft | 原 EVO Postgres verifier 目前只是只读候选；具体经济接口**未被本窗口实现**，不可擅自称已接受 |
| D5 六应用开发节奏（U，强约束） | **一个应用 PR→真实测试→Railway 固定版本→人类验收→反馈入库→下一个**。先 Purchasing，后 Receiving/Sales/Shipment/Receivable/Cash；只推进一个待人验业务任务 | 六应用平行开发、先补上百字段和导航、积攒数日后一次性演示；会令用户反馈滞后、上下文漂移 | 若当前应用不能立即真实上公网，记录阻断原因，**不能以 CI+synthetic 直接跨过人验继续下一包** |
| D6 插件字段模型（工程提议，**未批准或完成**） | 优先稳健 Header/Lines、基础对象 ID 引用、有效扩展 Schema；不同企业可配置字段，不将所有企业列封闭在几十列 ERP 固定表 | 六插件各自另建客户、物料、仓库表或第二套记账字段；复制订单金额替代应收余额 | 正式多行身份/原子语义、部分履约/回滚未由当前单物料参考闭环充分证明；字段提议不是已部署的 Schema |
| D7 i18n 与发布（F） | #757 只修插件 title，四语言 Eidos resolver，旧包英文 fallback；47 个 CI 复验通过，小合并，Railway pin a35d68dd | 称插件页面全文翻译完毕、从无语言资源的未安装插件加载完整 runtime、认为 merge=自动部署 | 已部署、健康检查 PASS；没有用户/原生浏览器逐项四语人工签收 |
| D8 交接文档策略（U+判断） | 入口短、来源长、决策与执行证据分开；固定 Git SHA、PR、CI 原始链接；独立 docs 分支；每步人验结论同步文档 | 在聊天里保存唯一“记忆”、超长一份文件、覆盖 Agent/2D 的 handoff 或全局项目状态 | 交接文档本身仅为研究/执行证明，不替代实际代码或用户验收 |

## 3. 必须保留的资料间冲突和区别

### C1. “已读原文” vs “同路径/名字相同、未全面审计”

GitHub 14 分支的 blob-tree 比较找出 24 个 main 缺失的路径，但它**不是**这些分支总的待合并函数数。旧 finance owner、stage package、manager/server.ts 以及 catalog/seed.ts 在 main 已有同名文件却 blob 不同；所以不能只合入 24 个新文件后就删 14 条旧分支。CI 测试命名为 tests/ 也可能共同继承 Host Core 大旧树；README/docs 分支也可能含生产源码。

**下一步**：F0–F4 逐项建立“原 branch + exact head → 文件/函数差异 → 采用/拒绝 → 新 PR/证据 → 退役条件”矩阵。安全脚本只在本身合法独立的 owner/接口下复跑，切忌整文件回灌。

### C2. “EVO 内部仓库只读 verifier” vs “正式 Runtime 经济语义结果”

B2D3 的 PostgreSQL verifier 对真实存储行做领域解释，有 read-only 保障和对齐 pin 的负例，但**验证的是数据库事实/预检**，不能由它代替 Runtime/Allocation/Valuation 的正式版本化解释。反过来，也不意味着 EVO Core/受控内部实现不能按明确定义的权限读 SQL。主权按公开可追溯的语义合同，而不是按是否 SQL、仓库名或认证证书判断。

**下一步**：对每个 G0 事实/结果列唯一 owner、public Submit/Read 与 policy/version pin、posting high-water / Replay 证明；签名 trust 只作为外部调用安全前置；由既有 EVO owner 单独审查。

### C3. “BusinessData received” vs “财务已完成”

POST /api/v1/business-data 返回 202/QUEUED 表示交给 Runtime，不保证 Posting terminal；cash.received --REFERENCES--> sales_order.approved 不是 AllocationInstruction，单纯 AR/cash balance 也无法证明具体欠款完全核销。出库原始 Ledger amount 不能冒充正式 FIFO COGS。

**下一步**：首个采购订单用户验收应同时看到状态、提交 identity 和受管读结果；成本/核销等高级语义保留正式 owner 的版本化证据。不提供不可用的财务执行按钮。

### C4. “main 包含变更” vs “公网展示了最新 main” vs “用户已经签收”

目前 main 92b371...；Railway a35d68... 的部署 SUCCESS、Healthcheck PASS。此差距由 2D 并发 main 变动引起，**不是 Railway 故障**。该环境虽配置名 production，用户明确定义为公网集成测试。Open PR 的 CI SUCCESS、merge success、deploy success、用户可操作并认可四个阶段必须分别记载。

**下一步**：不要因为文档/并发 Designer 提交就顺手部署，未来每个采购小 PR 选定目标 SHA 后独立核查 Railway Source、Health、Browser/UI 和用户意见。

### C5. “历史冻结封版” vs “禁止任何源码演化”

EVO Architecture Freeze 是经济模型边界/Replay、可重建一致性承诺；同期仍有新 BusinessData 原子 relation、REVERSES 和 public Balance query。禁止任何代码变更会阻碍合规接口补齐；反过来把 “EVO 库里有 SQL” 自动合法化也违背架构。

**下一步**：保留接受 ADR，任何改变 posting/valuation/Allocation 语义均经 EVO owner/versioned public contract + Replay + 权限 negative 测试，而非 Platform 偷换。

### C6. “原 173 条历史规模” vs “现在 73 条”

173 来自用户此前担忧；本窗口读取的当下 API 分支数曾 71，#764 删除五旧源后为 68，随后独立 2D Window 继续建立新验收分支，本交接前 73。增减由并行窗口和 Git refs 清理造成，**不能得出当下仍有 173 条或只有 14 条全项目分支**。

**下一步**：每次新窗口先检索两页 branch list/open PR，不从旧数字推断遗漏/误删。

### C7. 上轮指南提议“逐应用” vs 当前尚未实际用户验收

上一回答已经列出六个插件的字段建议、EVO 调用顺序和单应用阶段，但没有对六个插件的真实业务源码实施。这轮完成分支分类和安全清理，不应把方案图或事件表当六应用已经能让用户录单。

## 4. 未决问题及下一步最高价值查询（按优先级）

| 优先级 | 未决事实/风险 | 谁/哪一模块需要复查 | 需要哪种可交付证据 |
| --- | --- | --- | --- |
| P0 | 14 条旧 B2D3 真正未吸收的安全测试 vs 旧 Host 代码风险 | tools/certify-tr01b2d3-*.mjs、六份 workflow、apps/trading-reference/finance-owner-*.ts、providers/trading-finance-owner、旧 manager/server.ts | 24 新路径 + 同路径 diff 的完整“保留/排除”清单；至少一个小范围可重现负例 PR，CI 绿灯 |
| P0 | 3 个 distinct-db-logins 旧版变体哪个好 | tools/certify-tr01b2d3-distinct-db-logins.mjs 在 14 个源分支不同 blob | 逐版 diff、实际安全边界、可运行性、选择依据和精确 source SHA |
| P1 | Host trust/delegation 与 EVO 经济语义接口还未收口 | [Platform #594](https://github.com/jiangxng/EVO-App-Platform/pull/594)、[EVO #108](https://github.com/jiangxng/EVO/pull/108)、EVO B2D3 verifier | 身份/租户/nonce/凭据与经济来源明确分层，版本化结果查询、错误/Replay/Policy pin 正负例 |
| P1 | 没有权威 Posting terminal/分页或结果观察接口贯通六应用详情 | contracts/evo-business-data.ts、manager/evo-business-data-http-adapter.ts、EVO PUBLIC-API | 用户按 BusinessDataId/PostingInputId 可读真实最终状态 + 避免异步不一致提示 |
| P1 | 采购订单作为第一个单应用：从静态 Demo 迁到真实可编辑 UI | apps/trading-stage-purchasing、trading-reference/purchase-loop.ts、Eidos、Counterparty/Item/Warehouse | 真 Supplier 选择→批准→EVO public write→Ledger/Work exact read→公网用户实际一单验收 |
| P1 | 真实多行、部分收货/冲回的领域一致性 | Purchasing/Receiving 业务 Contract / PostingRules | 行级稳定 identity、总额/部分履约、幂等和 Reversal 负例；**不一次扩张为六应用** |
| P1 | 原始 Counterparty SUPPLIER XLSX 172 行用户主线，recipe 自动复用 | apps/data-import、Counterparty、Host Eidos UI | 用真实文件首导 dry-run/import/list，再导结构等价文件复用 recipe；用户确认 |
| P2 | 当前公网四语言 Title 是否实际按用户语言展示 | Railway a35d68... /store，现有 Google 登录测试身份 | 真浏览器截图/操作结果；没有外部 UI 探测结论不可标 USER_ACCEPTED |
| P2 | 2D/Eidos 独立规范新进度 | 独立 Designer #762、Eidos repo | 交给 2D owner，不挪用本窗口交接结论 |

## 5. 下一次代码实施的边界和可落地步骤

- 此次交接只新建 docs/roadmap、docs/research、docs/archive 文件；**不改 repo 内代码、CI workflow、Railway、EVO repo、Eidos、Agent、Diagram**。
- F0–F4 中**优先做历史资产与合法性审计**，可分多个小 PR；一个旧源分支的 unique code 不等于应原样继承，原分支 SHA 和 Git PR/branch 先保存再退役。
- 14 分支全部功能级关闭后，进入用户指定的六应用节奏；单一当前待验收对象永远是 Purchasing（除非用户之后重新排序），让新窗口从实际“一个按钮、一笔业务、一条事实”开始，不再把六个插件一起设计三天。
- 每个实际开发 PR 添加与需求对应的验收链接/截图/Runtime ID；用户不通过则修改同一小闭环；一旦人验通过把 verdict 与当时源码 SHA 写入项目文档后再开始 Receiving。


## 6. 2026-10-11 增量决定（保留原 U/F/D/C 的历史证据口径）

- **F0 / CODE_PRESENT + CI_PROVEN + MERGED_MAIN（仅单一小项）**：沿用 main 的六 Application Package；从旧 `fb3db992...` 源测试只迁移四 peer 同时渲染、独立启停/卸载和财务写入禁止的独特断言。PR [#775](https://github.com/jiangxng/EVO-App-Platform/pull/775) 已合 `014196f7...`，不能据此声称六应用真实 BusinessData 已上线。
- **F1 / 源码差异确认**：旧 Draft #594 与 main 的 `finance-intent-admission.ts` blob `d480b019...`、`finance-owner-remote.ts` blob `85ebfd58...` 完全一致；`providers/trading-finance-owner/package.ts` 现代版补充四种显示语言，不构成新的金融运行时语义接口。维持 #594/#108 Draft、不恢复旧 Host Core、不合并经济解释 SQL。
- **F2 / 仍 BLOCKED**：12 个遗留 CI 脚本已逐个读取 import / 主要条件，绝大多数依赖旧 `../evo/dist` 和 Finance Owner Draft；选择 V1+V2 的安全意图重新构造独立真实数据库/HTTP 负例，绝不整组无条件搬迁。
- **F4 / 仍 OPEN**：六份旧 workflow 均已查看原文：Purchase/Receiving 与四 peer 主要重复现有测试；online stage 只是 synthetic CDN probe；Finance descriptor 和 six/twelve lanes 只是 candidate fail-closed。是否补独立 CI 仅由未覆盖的真实安全断言决定。
- **并行处理与权限**：合并前 GitHub 曾以缺少 `continuity` 必需检查阻断落后 main 的 PR；通过保留并行主线完整 tree 的双父提交及新 CI 后才 merge，未强推/绕过检查。14 旧 refs 均未在该操作退役。


## 2026-10-12 F2 决定增量

- **F2-PG-01 DONE（仅小项）**：真正的两组 Postgres LOGIN 而非 SET ROLE，真实权限 42501 拒绝、即时撤权、独立 workflow 和 Platform 全套 CI 通过，合并 #777（aa6432f0）。
- **明确排除**：将旧 V1/V2/V3 数据库登录脚本整文件迁移、接旧 EVO dist、使用 full EVO API 冒充 finance-only Listener、启用真实 Finance Owner 财务写入。V1 的严格 katalog/owner 判断与 V2 Finance-only 路由隔离仍需依赖正式 owner 边界的后续专门测试。
- **仍 OPEN**：EVO Draft #108 中存在专用 finance-only app/main 源码，但 EVO main 不包含这些文件；旧 HTTP 404 断言在正式新接口上未被验证。跨实例 nonce、签名、Replay 和成本/Allocation 语义接口更不属于本小项。#594/#108 不合并。
- **六应用流程不变**：其余 F0-F4 审完再开始 Purchasing；没有用户当前应用验收前不做 Receiving。


## 2026-10-12 F3/F4 历史资产审查增量

- **F3 原始合成浏览器演示资产：SOURCE_REVIEWED / ARCHIVED_BY_SHA**。旧固定源码可演示 Ed25519 WebCrypto 和合成 nonce 负例，但不具有真实数据库、真实 Host、真实 finance owner 或用户录单。旧可选 Railway Bun Function 使用 process-local nonce；其历史记录明确创建在线 Preview 失败；绝不可当线上核验或部署合同。该 3-file DEMO 不复制到 main，不启动另一个 Railway 服务，不删除原源分支。
- **F4 旧六份 workflow：SOURCE_REVIEWED**。购买收货与四 peer 只调测试及演示预览；六/十二门禁和 descriptor 部分是静态拒绝清单。现代 main 已有对应 protocol tests，F0 的新增有效断言已被 #775 复用；其余旧 workflow 暂不整组恢复。未来若补充实际跨实例、Nonce、SQL/HTTP 独立负例，必须在现代正式接口上重新做小 CI，不能冒称六/十二条生产线已经 certified。
- **退出条件仍保持 OPEN**：F0–F4 源资产完整关闭需进一步对照同路径功能差异与剩余 F1/F2 运行时真实证据。F3/F4 的文件取舍已有明确结论，但还不能据此提前删除涉及其他工作包的 14 个源分支。


## 2026-10-12 F1 Client 传输小项最终决定

- **F1-HOST-TRANSPORT-01：CODE_PRESENT + CI_PROVEN + MERGED_MAIN**，合并 #779 / 09fee6f。主线已有真正 Ed25519 Client，不再恢复旧 #594 的同 blob；新增局部 socket 回归检测签名边界与写权限禁止，作为 Host 侧合同保护。
- **明确仍为 OPEN**：EVO Owner 服务端 Crypto verification + durable PostgreSQL nonce + 限权数据库访问 + 真实 immutable finance facts；外部 OIDC 身份、TLS、跨多实例、密钥托管与线上部署。#108 与 #594 仍是 Draft，且不能用“本地 HTTP 接收端返回匹配 JSON”宣称实际经济结果。
- **完整 PR 取舍**：第一次/第二次全量 CI 对已有拒绝码前缀误判，失败如实保留，第三次全绿后才合并；从未修改正式 Host Client、Ledger Runtime、Agent、EOG/2D、全局状态文件。


## 2026-10-12 14 树哈希级二次盘点决策

- 已按完整 Git Tree（15/15 `truncated=false`）对比 main `09fee6f8f327871b71e0b37a9e19a7f16161db57` 与 14 条 TR-01 历史 tip。**24 个 distinct missing paths、23 单 blob + 1 个三版本 login 脚本的旧结论仍成立**；变更集中在旧 workflow、依赖 Draft 的 tools、demo、两个旧 stage tests，而非新缺失经济引擎。
- 旧 tip 每条有 72–79 个已存在但 blob 不同的 main 路径；这代表代码差异，不代表应当 cherry-pick。明确维持旧 Host Core / manager / catalog / semantic-finance SQL 不回灌；#594 不合。
- 三个已经经过 CI 的微步是 **F0 #775（四 peer 独立可见性）**、**F2 #777（一次性独立 PG 登录）**、**F1 #779（真实 loopback Socket + Ed25519 Client 拒绝合同）**。它们分别证明不同受控边界，**不能相加声称 B2D3 全生产认证**。
- 对 14 条旧 ref 的退役条件仍是：完成单路径功能差异审查、留存需继续的历史真实安全证据、原 head SHA 无变更、没有开放 PR head/base 关联、无 branch protection，最后才可逐条删除；此轮 **0 删除**。
