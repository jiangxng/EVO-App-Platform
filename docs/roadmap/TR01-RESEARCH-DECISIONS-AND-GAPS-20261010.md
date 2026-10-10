# TR-01 研究结论、方案比较、冲突与后续任务 — 2026-10-10

> **证据口径：**[资料索引](TR01-RESEARCH-SOURCE-INDEX-20261010.md) 使用 A（权威/ADR）、S（原文源码）、E（Actions/PR）编号。**[事实]**只代表已读仓库/已核实 CI；**[项目已确认决定]**代表用户及仓库权威已采用的路线；**[本窗口判断/建议]**不是原始资料结论；**[待验证]**没有被完整实现或外部来源证实。不要把 design review、单笔 CI 和已安装的客户财务产品混为一谈。

## 1. 从业务需求到主线问题

**最初目标：**在已完成 Counterparty、Item、Warehouse/Location 基础对象导入及对应对象证明后，检查它们能否在**真实运营闭环**中共同工作；首先采购/收货/冲销，再反向销售/生产/发货/应收/收款，推导缺失的平台公共契约，而不是为了对象清单继续加入资金账户。

**用户明确要求：**
- 以 GitHub 项目权威状态决定阶段；用独立分支/PR 避免与另一个主线窗口、2D Designer、Agent 长期架构分支互相覆盖；能不让用户人工验收的部分继续自主推进。
- 保持 Host / EVO / master-object 权限及数据拥有者边界，Human 与 Agent 不能使用互相不同的隐形操作权。
- UI/Workbench 的已安装体验必须经真实浏览器验证；不能以“服务 API 单元验证”代替。
- 进度和参考资料要持续回写仓库；本研究交接**只新增独立资料**，不篡改 `project.status.json` 和自动生成的 `HANDOFF-LATEST.md`。

## 2. 关键决策的来源事实、比较和适用边界

| ID / 决策级别 | 采用方案及理由 | 明确排除及理由 | 使用范围/限制 | 事实来源 vs 判断 |
|---|---|---|---|---|
| D01 **[已确认]** 基础对象先业务闭环 | Counterparty / Item / Warehouse 保留身份主权，Trading Reference 用它们提交业务事实；采购+销售双向压力测试可发现真实语义缺口 | 排除先堆“仓库→存货→资金账户”等所有对象再统一联调；容易复制数据并错配责任 | 当前参考场景；并不禁止未来有证据的新主数据 | [事实] A04、A05、S01；[判断] 更容易发现真正跨对象契约问题 |
| D02 **[已确认]** EVO 独占交易事实与计算结果 | Host/App 提交不可变 BusinessData，EVO owns Posting/Ledger/Balance/Work + derived Cost/Allocation/Replay；可回放、可审计，避免第二套余额 | 排除 Agent/UI 直接 SQL 写 Ledger、在 App Platform 自建平行“库存金额/应收/现金”表 | EVO Core 负责通用确定性机制，高阶 Cost/Valuation/Allocation 由插件 owner（目标架构） | [事实] A04、A11、A12、S09、S10；[判断] 维持唯一经济来源 |
| D03 **[已确认]** 估值必须按历史版本固定 | FIFO valuation policy、allocation policy、shipment valuation rule **ID+version**，才能把库存原始金额 125 正确转 COGS 125；Replay MUST MATCH | 排除只给 `method:FIFO`、按“最新生效规则”重算，或以库存 qty=0 自称金额已清 | **单品/单库/单订单/固定策略**的证明；不能直接扩成跨方法/并发价值证明 | [事实] S10、S16、E03（首轮 CI 缺 pins 被正确拒绝）；[判断] pins 必须成为后续可信委托的一部分 |
| D04 **[已确认]** 原始订单记录历史本币账面值 | `localCarryingAmount` + `localCurrency` 配对入 immutable Sales Order，使 EVO `fx_receivable` PositionDefinition 能在结算时求出真实来源 | 排除付款时让 Agent 补写/猜测历史账面值，或修改已发布 immutable 订单 | 当前同币种样本要求金额一致，**跨币种 FX 仍未认证** | [事实] S01、S12、A08、E04；[判断] 历史币种/价值应在来源事实形成时捕捉 |
| D05 **[已确认]** 正式收款核销 ≠ BusinessData `REFERENCES` | 经 pinned AllocationInstruction + completed AllocationRelation 记录 source Sales Order/Position 与 consumer Cash Receipt、1000 CNY 金额，Replay 可重建 | 排除把 receipt `REFERENCES` relationship、Receivable=0 或 Cash=1000 单独当做已正式核销 | 一个订单+收据+同币种+全额；部分/多单/超收/退款/FX 未证 | [事实] S11、S17、E04；[判断] 明确“历史关联”与“财务消耗”概念 |
| D06 **[已确认]** Host 每资源分别授权 | 主体/企业上下文 + server-side Host→EVO 绑定，再分别校验 Order、Customer、Item、Warehouse、Shipment/Receipt 和 policy pins；拒绝 unresolved obligations | 排除仅依据 UI 按钮可见、前端声明企业 ID、或者只校验一个订单 ID | B2D1 只是 **intent preflight**；即使通过 owner 仍不得执行 | [事实] S02、S03、E05；[判断] 粒度必须覆盖被消费的 BusinessData |
| D07 **[已确认]** EVO owner 独立只读核验 | 基于同租户真实 Postgres immutable facts、POSTED boundary、policy/rule pinned identity、amount/currency，owner 返回 VERIFIED + **executionAllowed=false** | 排除 Host 看了授权就允许财务写入、只信调用方手填 `actor`，或将内部核验器匿名挂 HTTP | B2D2 仅 CI 中进程内联测；没有生产可信 delegated identity | [事实] S13、E06、E07；[判断] Host permission + owner fact = 必要但非充分 |
| D08 **[已确认]** 成本/财务高阶能力不是必然 EVO Core | 遵守已 ACCEPTED minimal Core ADR；Cost/Valuation/Allocation 的业务算法与权限属于插件/宿主拥有的边界 | 排除为了 TR-01 功能直接扩大最小 EVO Ledger 核心，或删除成熟兼容模块强行重写 | 现 repo 兼容实现含 Cost/Allocation；**目标架构与代码物理位置尚未完全一致** | [事实] A12、A13、S19；[判断] 渐进式插件化比仓库大拆迁风险低 |
| D09 **[已确认]** 资金账户基础对象暂缓 | 先证实现金/应收的正确账本与核销语义；有银行账号/支付渠道/公司归属/币种/对账凭证之后再设计 Account | 排除把 Cash Ledger 当银行账户对象，或因对象列表尚缺“资金账户”就提前建模型 | 未来若真实财务对账证明需要，重新启动领域建模 | [事实] A04、A08；[判断] master-data identity 与 transaction ledger 不可混同 |
| D10 **[已确认]** 分离“内部 CI 正确”与“产品正式安装” | owner-runner、PostgreSQL、UI/Agent Chrome 安装各自验收；交接只声称已经过的关卡 | 排除把 EEL 单独参考样本、CI 直接调用内部 owner、Railway 部署成功当成生产财务 API 授权 | B2B/B2C/B2D2 **不等于** B2D3/B2D4/B2E | [事实] E01–E08、A10；[判断] 级别明确可减少虚假里程碑 |
| D11 **[未定，下一步]** Trusted Host→owner 委托协议 | 要求 owner 独立验证可信 Host 身份、企业绑定、上下文、操作作用域、短期有效性、防重放/撤销、错误码与审计证据；下一阶段作 **协议比较**后决定 | 暂不采用任何“请求自填企业/actor 就算认证”的协议；也不预设 HMAC/JWT/OIDC/mTLS 一定是唯一正确答案 | B2D3 尚未研究完外部标准，也没有真实生产通道；是 open gate | [事实] A02、A11、A12、S08、E07；**[本窗口判断]**仅提出安全验收清单，协议选择待实证 |

## 3. 待定技术方案的比较（不是来源事实，不是已确认架构决定）

**B2D3 正在开放，尚未选择任何具体 credential 机制。**下面是初步工程比较维度，**没有查阅外部标准原文，不得把这些判断引用为标准事实**。

| 候选方案 | 可能优势（推断） | 关键风险/适用条件（待验证） | 当前处理 |
|---|---|---|---|
| Host→owner 受限短效签名委托（JWT/JWS/OIDC 形式候选） | 易携带 operation、enterprise、principal、context、audience、expires、nonce；插件可以单独验证 | 谁签发/谁持钥、可信 issuer、subject delegation、key rotation、token theft/replay、owner audience 与撤销策略 | **待查标准与当前 Host provider 实现，不定案** |
| mTLS/service identity + 独立授权 envelope | 强服务身份；适合服务器间 transport | TLS 终止、证书部署/轮换、多 Host 实例、业务 principal/tenant 与证书主体如何绑定 | **待查部署/网关支持，不定案** |
| HMAC 请求签名 + server-side key | 最小应用级认证门槛可能较低 | nonce 消费的持久性、重放、时钟容差、双向长期密钥维护、信任转移与租户隔离 | **待查威胁模型，不定案** |
| 纯内网匿名 HTTP 或兼容 `POST /api/v1/commands` 自声明 actor | 实现快、便于测试 | **owner 不能独立验证真实 Host/user/enterprise**，不能达到新关卡 | **已排除用于生产财务操作**；参考兼容层仍可用于隔离 CI |
| CI 内进程直连 `PostgresTradingFinanceFactVerifierV010` | 测试最简洁，不需模拟不可信 transport | 根本没有证明 delegated caller authentication | **已采用仅限 B2D2 认证**，不得提升为 B2D3 的通过证据 |

**必须独立研究后才作协议裁决：**认证的最小 trusted envelope；签发者/验证者的实际部署位置；企业映射谁可信；nonce/one-time replay protection 放在哪里；安装/撤销/轮换；错误恢复；Human 与 AI 同权和审批责任；不可变审计和 request/correlation 关联。

## 4. 本窗口真实证据与重要失败教训（完整可追溯位置）

| 阶段／原始证据 | 原始结果 | 非结果/限制 | 最值得保留的教训 |
|---|---|---|---|
| B2B [CI 38015494916](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38015494916) | `TR01B2B_EVO_PINNED_COST_COGS_REPLAY_PROOF` PASS；Inventory qty0，raw amount125→valued0，COGS125，Receivable0，Cash1000；canonical replay MATCH | 并非 public Cost command | 初试使用 `/demo/cost/recalculate` 被缺少 policy pin 拒绝，随后的 Shipment rule pin 也被拒；改在 owner-only CI 固定三项 pinned identity/version |
| B2B 后续调试 | 重放后 ledger/摘要稳定 | 不能假定自己进程提交所有 posting；EVO worker 可并发接管 | 以持久 `POSTED` + canonical economic/input digest 为准，而非脚本自己的 posted job 数 |
| B2C [CI 38017215432](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38017215432) | 原始 order/receipt formal AllocationInstruction/Relation 1000 CNY；回放重建，FX delta 0 | 仅单笔 full same-currency；尚无 public Allocation API | 成对保留本币账面基数；用合法 UUID 测跨租户拒绝；断言稳定 error.code 而非 human message |
| B2D1 [Platform CI 38018453036](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38018453036) | Host preflight per-resource, policy pins, HUMAN/AI scope checks；默认无 owner 拒绝 | 不执行任何 finance write | 不把“知道谁在请求”与“批准哪个业务事实有效”混为一谈 |
| EVO B2D2 [Owner CI 38019400183](https://github.com/jiangxng/EVO/actions/runs/38019400183) | 最终 27/27 CI PASS（包含 quality/typecheck/build） | 尚无 HTTP trusted delegation | 初次 TypeScript 使用错误 Decimal import；跟随仓库实际 named import 修正，未修改数据库策略以绕过失败 |
| App B2D2 [CI 38019652795](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38019652795) | 原始 App facts + Host preflight + owner verifier；所有负向校验通过，摘要不变，无 CostRun/Instruction 增量 | 桥接在隔离 CI **进程内**执行，非生产服务交互 | 初试把 database handle 误作 Kysely，按 EVO runtime 取 DB 连接；不能把 runner 成功当“网络认证成功” |
| B2D2 handoff [PR #589](https://github.com/jiangxng/EVO-App-Platform/pull/589), [CI 38019910463](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38019910463) | 8/8 回归 PASS + 合并 main `da8151d17726a0f08b3fd10fde67b02e127ff10c` | 不是额外业务验证 | `project.status.json` → 自动生成 `HANDOFF-LATEST.md` 必须同步，不能手改交接生成文件 |

### B2D2 真实日志核心标记（摘要留存，不是复制原始日志全文）

来自 [原 Actions run](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38019652795) 的 `TR01B2D2_OWNER_FINANCE_FACT_PIN_POSTGRESQL_PROOF`：

```json
{
  "status": "PASS",
  "ownerReadOnlyCostVerification": true,
  "ownerReadOnlyCashVerification": true,
  "humanAndAiHostPreflightWithoutExecution": true,
  "deniedHostReceiptBeforeOwner": true,
  "crossTenantWrongPinWrongFactWrongAmountRejected": true,
  "immutableEconomicDigestUnchanged": true,
  "noNewCostRunOrAllocationInstruction": true,
  "ownerTrustedDelegation": "NOT_YET_ADMITTED",
  "financeMutationApi": "NOT_INSTALLED",
  "installedSalesWorkbench": "NOT_CERTIFIED"
}
```

这些键值来自已查阅 CI 原始 marker 的**节选**，没有在此复制那次运行里临时生成的 UUID，不应被新窗口当客户生产对象 ID。

## 5. 已发现的“资料之间冲突”与如何处理

1. **EVO `PUBLIC-API.md` 的兼容层 vs 已 ACCEPTED 的 minimal Core ADR：**目前 EVO 仓库里有 Command、Cost、Valuation、Allocation 模块，`/api/v1/commands` 接收调用方声明的 actor；但目标最小 Core 不拥有业务身份或成本估值引擎。[事实] A11/A12/S08/S09/S10。**结论：[已确认]**保留现有兼容实现做有边界测试，未来通过 Host 和受信任插件适配；不要据现有物理模块位置错误放大 Core 责任。
2. **“Shipment 数量已减完” vs “库存金额仍为 125”：**这是不同的 posting/valuation 阶段，并非可以直接冲销 125 的坏数据。[事实] A06/A07/E03。**结论：[已证]**固定三项 policy/rule pins 后由 EVO 估值引擎转入 COGS。
3. **“收款有 REFERENCES，且应收已为零” vs “正式财务核销”：**前者是业务血缘及余额，后者需要带 policy pins 的 AllocationInstruction + derived Relation。[事实] A08/S11/S17/E04。**结论：[已证]**单笔同币种可正式核销，但不能推出部分/多单/FX 正确。
4. **“Host policy PASS” + “owner facts PASS” vs “生产用户确实有权执行”：**B2D2 是 CI 进程内 owner 方法，不具受信服务身份、token audience/replay 保护。[事实] A09/A10/E07。**结论：[已确认]**只读验证结果恒 `executionAllowed:false`；B2D3 需要新的真实通讯证据。
5. **“EVO 财务 owner 已实现” vs “插件提取与产品 API 已完成”：**已合并 owner internal class，不等于正式插件安装、Provider Trust、权限路由、审计写操作。[事实] A13/A14/E06。**结论：[未决]**B2D3/4 仍须具体设计并实证，不可提前宣告金融产品上线。
6. **早期 roadmap 文首的 candidate 状态 vs 最新 project.status：**历史文件有可能文首仍叫 candidate，文末已追加 verified 结果。[事实] A05–A10/A02。**结论：[项目规则]**最新 `project.status.json`、真实 merge SHA、CI 当期运行优先；不要自动重写历史文档来消灭状态差异。

## 6. 当前尚未解决的问题及优先研究方向

### P0 — 开始 B2D3 前必须解决

1. **Host 与 EVO 之间实际的可认证通讯路径：**读 App Platform `manager/server.ts`、`contracts/platform-services.ts`、`apps/trading-reference/finance-intent-admission.ts`、owner verifier；调查哪些 Provider/Feature/Action Host installation/auth 设施已经存在。必须使用最新代码，不能假设接入点已存在。
2. **Owner 如何独立认证调用者？**选择 workload identity/短效 token/mTLS/签名信封等，查阅其最新官方标准原文，再归档在 [索引](TR01-RESEARCH-SOURCE-INDEX-20261010.md)；绑定 Host service、principal、企业映射、intent+resource digest、audience、nonce、过期窗口、批准条件、key rotation/撤销。
3. **防 TOCTOU：**预检后的 posting boundary/policy pins 如果改变，怎样在真实执行前强制重新查并拒绝失效委托？尤其 EVO Worker 异步、Full Replay 进行中。
4. **插件 owner 的安装/供应商信任：**谁安装、谁准许 Host/Agent 使用、如何仅将 read-only 验证暴露给指定 enterprise，如何审计拒绝与成功。
5. **真实 CI：**通过实际 auth transport 调用，测试 forgery/cross-tenant/replay/expired/denied Host resource/wrong pin；核对原始 order/Shipment/Cash ID，成本/核销记录与 canonical digests **不因只读验证而改变**。不可仅模拟一个直接函数回调就宣称 B2D3 完成。

### P1 — B2D3 后分别推进

- **B2D4：**受限可安装的成本与核销写入操作（Cost/Valuation 和 AllocationInstruction/Relation 各自独立契约），提交时重新验权、method/policy/valuation rule version pins、申请审批、幂等、审计、错误恢复、经济/输入双摘要 Replay。不可复用仅预检成功作为“永久执行令牌”。
- **B2E：**销售 UI/Agent/Workbench 实际安装与 Chrome/Eidos 的 Human 和 AI Principal 走通，对权限不足/未安装的拒绝也验收。采购 TR01A 的浏览器证据不能被复制来代替销售。
- **基础对象计划：**真正看到银行账户/支付渠道、法人归属、银行流水、清算/对账及币种等样本后，再决定是否立项 Financial Account；不要从 Cash Ledger 推断 master data 结构。
- **更广义业务边界：**部分核销、多订单、多收款、超收/退款、FX、退货、负库存、并发计算和多公司，不在现有单笔 B2D2 已证范围内，应单独标记 gate。

## 7. 资料保留状态、截图/附件及重新访问风险

| 项目 | 在 GitHub 保存位置 | 当前保留状况 |
|---|---|---|
| 已读源码/文档 | [详细索引](TR01-RESEARCH-SOURCE-INDEX-20261010.md) 中的 commit-pinned GitHub blob URLs | **有**：可按提交重开文件、按章节定位 |
| 决策/比较/证据摘要 | **本文件**与 [短入口](TR01-RESEARCH-HANDOFF-ENTRY-20261010.md) | **有**：文本固定到本独立 docs 分支 |
| CI 详细日志 | GitHub Actions [B2B](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38015494916)、[B2C](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38017215432)、[B2D2](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38019652795)、[EVO owner](https://github.com/jiangxng/EVO/actions/runs/38019400183) | **只有 URL+关键 marker/结果摘要**，没有将全部原始 job log 导出为附件，日志保留期不确定 |
| 浏览器截图/外部网页归档 | 本窗口**没有访问/生成**外部网页截图；没有本地截图、PDF、附件路径 | **无**：新窗口不得声称存在或杜撰路径 |
| Railway deployment record | 本次交接之前 verified exact main `da8151d17726a0f08b3fd10fde67b02e127ff10c`，deployment `668ce205-0b9a-4314-b9ff-d3c18290936f` `SUCCESS` | **有 ID 与查证结果**，不是用户企业功能安装证明；后续以最新部署为准 |
| 其他窗口较早网络研究资料 | 仅在其他窗口自己的 PR/研究包、若存在 | **本窗口没有逐项复读/验证**；必须从相关研究包另行检索，不得归功于本窗口 |

## 8. 模块、已有文件、分支及下一轮实施映射

| 下一步边界 | 权威模块/文件 | 新窗口应处理的问题 |
|---|---|---|
| Host 请求身份与逐资源授权 | `apps/trading-reference/finance-intent-admission.ts`、`contracts/platform-services.ts`、Host Provider 路由 | 严格由真实已登录主体与安装状态提供信任，不能从 caller JSON 读取可信 actor |
| 原始销售事实 | `apps/trading-reference/sales-loop.ts`、B2D2 CI script | 保留 order/customer/item/warehouse、shipment 和 receipt 独立 ID；不得重造 fixture |
| EVO owner read-only | `EVO/modules/valuation/infrastructure/postgres-trading-finance-fact-verifier.ts` | 插件 owner/transport admission，原类不应匿名开放 |
| EVO 财务执行 | `EVO/modules/cost/`、`EVO/modules/allocation/`、`EVO/modules/valuation/` | **B2D4 再做**，不得现在直接注册写入 |
| replay/worker concurrency | `EVO/modules/replay/`、`EVO/modules/replay/infrastructure/postgres-replay-digest.ts` | 过账边界、canonical digest、异步 worker 的并发处理 |
| GitHub 自动验收 | `.github/workflows/cross-project-tr01b-sales-evo-postgres.yml` | 增独立 Host→EVO 可信 transport 认证，不覆写既有 B1/B2B/B2C/B2D2 阶段 |
| 权威进度 | `project.status.json` + 自动生成 `docs/roadmap/HANDOFF-LATEST.md` | 仅在 B2D3 真通过 PR/CI 时随实现 PR 同步；**交接分支不编辑** |
| 并行窗口隔离 | 2D Designer PR #590/#586 等、Agent PR #579/#577 等 | 独立新分支，绝不更改相关源、权威状态或 merge 他们的 PR |

**本交接只记录已查事实与已作判断，不自行替用户决定未研究透彻的认证协议，也不作为 B2D3 实施完成的证据。**

## 2026-10-10 增量决策：TR-01B2D3 可信委托实施候选

**此前 D11 原始待选状态仍然如实保留。**新的增量定向查阅了 RFC 8725 的算法/发行者/受众/类型检查与 RFC 9864 的 `Ed25519`（旧 polymorphic `EdDSA` 已被标为 deprecated）。候选方案采用短效 45 秒、专用 audience/typ/purpose 的 Ed25519 JWS 由受信 Host 签发；EVO plugin owner 根据管理员信任配置锁定 issuer、kid、安装 ID、Host Enterprise/Context→EVO Tenant，结合 PostgreSQL 唯一 nonce 防重放后才能调用原只读 verifier。**这是项目工程选择，不等同 RFC 强制要求这个具体架构。**

从各自最新 main 独立创建草稿 [EVO #108](https://github.com/jiangxng/EVO/pull/108) 和 [App Platform #594](https://github.com/jiangxng/EVO-App-Platform/pull/594)，保留所有已经确认的 B2D1/2 原始 facts、policy/valuation pins 和无财务写入断言。来源事实、替代方案（mTLS/HMAC/自声明 actor/进程内适配）、候选实现和仍需验证的 Host 实际 Session+安装 Provider+Secrets、TLS/轮换/撤销/nonce 保留、执行时 TOCTOU 详见 [B2D3 文档](TR01B2D3-TRUSTED-OWNER-DELEGATION-20261010.md)。

**进度限制：**草稿 PR/测试脚本不是真实 CI PASS；B2D3 仍为 OPEN，B2D4/B2E 尚未启动，不得修改 `project.status.json` 或手编自动生成 HANDOFF。两条并行 2D Designer / Agent 任务不在本分支范围内。


### 2026-10-10 subsequent owner/provider installation gate candidate

The App Platform owner verifier is now represented by a dedicated optional `PLATFORM_PROVIDER` package in `providers/trading-finance-owner/package.ts`, resolved using existing installation/enablement and Provider binding policy. `manager/server.ts` additionally contains a real request-bound **managed** Session-only read-only Host ingress (never compatibility/static identity, no Agent or Workbench tool), server-resolved context scope and owner mapping, B2D1 per-resource authorization, and Host SecretsProvider-backed Ed25519 signing. This code is on the same unmerged #594 draft. It is **not** a new source of EVO financial truth; EVO owner remains the separate B2D2 read-only database verifier behind #108's cryptographic boundary. No new `executionAllowed:true` operation.

Observed latest EVO CI 27/27 success and App Platform integration/quality workflows 38/38 success, including genuine signed HTTP/PostgreSQL original-facts test. A real *product Host* request with fully issued/revoked managed session, installed/disabled Provider and installed Secrets has **not** been certified. Keep B2D3 OPEN, next proof must target this missing path plus revoke/rotate and TLS; retain separate B2D4 finance execution and B2E Sales Human/Agent/Workbench admission.

### B2D3 actual Host product request proof (new verified CI evidence)

The previous open gap “we only injected a synthetic `PlatformRequestContext`” has now been **closed for isolated CI**: [run #38023569941](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38023569941), app implementation commit `a927a1a4b3118876ed62d5b28d50a6fd86933a42`. A real App Platform HTTP server resolves issued/persisted Host Managed Sessions, selected Enterprise Context grants, explicit per-resource Host policy, and an installed/enabled `evo-trading-finance-owner-provider` via the platform's actual lifecycle. The Ed25519 signing secret is read from the AES-256-GCM Host SecretsProvider. The independent EVO Fastify/PostgreSQL owner checks the exact original Sales/Shipment/Cash and policy-version pins; three startup phases **active→disabled Provider→re-enabled but missing protected key** all logged PASS, and unauthorized/expired/revoked sessions and caller-supplied identities were denied. Read-only economics and instructions did not change, `executionAllowed:false` throughout.

**Still open rather than silently admitted:** real external OIDC issuance, production TLS ingress/service identity, in-service dynamic operator key revocation/rotation with credible audit evidence, and multi-replica behaviour are not certified. This is a bounded CI proof, not B2D4 execution or B2E Agent/Workbench. New detailed handoff at [TR01B2D3-INSTALLED-HOST-MANAGED-SESSION-CI-20261010.md](TR01B2D3-INSTALLED-HOST-MANAGED-SESSION-CI-20261010.md). Do not mark `project.status.json` closed on isolated CI alone.

### 2026-10-10 B2D3 live operator-key trust decision (read-only)

Adopt explicit `EVO_FINANCE_TRUST_AUTHORITY=POSTGRES` for runtime-varying signer trust, with a row lock through one-use nonce admission and **no** fallback to startup JSON. Preserve backward-compatibility STARTUP mode but label **not dynamically revocable**. An out-of-band CLI may grant distinct public key IDs or irrevocably revoke keys, with database-enforced append-only operator audit. Actual original Sales→EVO signed HTTP Host Session workflow followed by no-restart signer rotation [#38025050327](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38025050327) **PASS**; four GRANT/REVOKE records and financial digest invariants verified. Initial CI #38024898986 **FAILED** from over-escaped JWT locator regex, fixed at EVO `4ac6103` before passing. [Detailed proof and precise limits](TR01B2D3-LIVE-POSTGRES-KEY-ROTATION-20261010.md). Production OIDC/TLS, multi-replica operations and finance write admission remain open; `project.status.json` unchanged.

### TR-01B2D3 parallel OIDC and TLS certification, 2026-10-10

The user-directed increased pace resulted in **two separate end-to-end gates in the same existing original Sales→EVO cross-project CI**. [Live CI #38026113772](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38026113772) **PASS**: (A) installed Generic OIDC provider, external-style independently serving disposable IdP, Authorization Code + PKCE S256, signed RS256 ID Token, issuer/audience/nonce proof and rejection, real Host callback and HttpOnly cookie, actual original EVO read-only finance with denied replay and logout; (B) live Host→local HTTPS ingress→EVO Owner, trusted SAN localhost certificate accepted, invalid hostname and unknown root denied *before* EVO nonce consumption. No finance writes; existing signer revoke/rotate CI still PASS. [Research/engineering handoff with exact CI scopes](TR01B2D3-PARALLEL-OIDC-TLS-CERTIFICATION-20261010.md).

**Fact and judgment separation:** the OIDC protocol and TLS handshake are **actual process-backed CI facts**. The OIDC provider and TLS ingress in this proof are **ephemeral local test doubles**, not an authenticated Google tenant, published domain/CA, production service mTLS or an audited real deployment. The accepted choice is a fail-closed protocol/TLS gate, **not** production trust admission. Remaining: real OIDC tenant and live membership, publicly deployed HTTPS identity, Host signer online key-ID rotation, operational DB role separation/replicas. B2D3 production remains OPEN; B2D4/B2E and project authority untouched.

### 2026-10-10 B2D3 next two validated security slices

1. **Live Host signer rollover (bounded CI PASS):** [run #38049355866](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38049355866) exercises per-request atomic owner-readable key-id pointer `APP_PLATFORM_FINANCE_OWNER_ACTIVE_KEY_ID_FILE` and preprovisioned encrypted key-ID-specific private keys; no Host/EVO restart, no fallback to startup key if pointer permissions/contents missing or key revoked by Postgres, finance read-only throughout. Operator-side durable/change-ticket audit for pointer file is **not** implemented, hence no production readiness claim.
2. **DB-role grant separation (bounded CI PASS):** same run shows runtime role SELECT-only signer trust and nonce privilege cannot mutate trust/audit or CostRun, and distinct operator role can grant/revoke with audit but cannot insert CostRun. The actual deployed EVO API DB credential was **not** switched; production least-privilege credentials remain an open gate.

[Detailed implementation and evidence](TR01B2D3-HOST-HOT-SIGNER-AND-DB-ROLES-20261010.md) continues rather than replaces earlier [OIDC+TLS](TR01B2D3-PARALLEL-OIDC-TLS-CERTIFICATION-20261010.md), [EVO Postgres live trust](TR01B2D3-LIVE-POSTGRES-KEY-ROTATION-20261010.md), B2D1/2D2 and prior research. Neither evidence authorizes `project.status.json` closure, financial execution (B2D4) or Finance Human/Agent/Workbench (B2E).
