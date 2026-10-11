# TR01B2D3｜研究结论、方案比较、冲突及未决门槛（2026-10-11）

> 本文补充 [2026-10-10 已合并旧决策](TR01-RESEARCH-DECISIONS-AND-GAPS-20261010.md)，与 [短入口](TR01B2D3-WINDOW-RESEARCH-HANDOFF-ENTRY-20261011.md)、[原始资料索引](TR01B2D3-WINDOW-RESEARCH-SOURCE-INDEX-20261011.md) 配套。**来源事实**仅指本窗口已经核对的正式 PostgreSQL 文档、GitHub 代码及 CI 证据；**工程判断/决定**来自用户正式原则与本项目已接受取舍，不能倒写成外部规范要求。

## 一、权威业务边界与用户已经确认的产品路线

| 层次 | 已确认责任和数据权威 | 实际代码/资料位置 | 明确不负责 |
| --- | --- | --- | --- |
| Counterparty / Item / Warehouse/Location | 分别由基础对象 APPLICATION 插件提供身份、扩展定义/值，经 Enterprise Context 管理；导入复用 Recipe，保留原始未映射列 | `apps/counterparty/`、`apps/item/`、`apps/warehouse/`；[基础对象 Human 验收](FO-IMPORT-EXTENSION-HUMAN-ACCEPTANCE-20261010.md) | 不把采购订单、付款余额、销售税额都塞入供应商主记录 |
| 采购 / 销售 / 库存业务 | 属于独立安装的业务 Application/业务 Owner 插件；本阶段 `apps/trading-reference/` 是**有界参考样本** | [主线 TR01](TR01-TRADING-REFERENCE-LOOP-EVIDENCE-v0.1.md)、[插件归属护栏](../architecture/TR01-BUSINESS-PLUGIN-OWNERSHIP-GUARD-20261010.md) | App Platform Host Core 不写成一个单体 ERP |
| App Platform Host | 通用生命周期、身份/授权、Context/Enterprise 映射、能力发现/调度、Secret Provider、传输前置闸门 | `manager/server.ts`、`providers/trading-finance-owner/`、`apps/trading-reference/finance-owner-remote.ts`（B2D3 Draft） | 不接管账本/成本算法/审批型财务写入 |
| EVO 最小 Ledger runtime | 不可变 BusinessData、Posting、Ledger/Balance/Work、可重复 canonical replay | EVO 公共版本化接口与主线既有 B2D2 | 不吞掉企业级 Cost、Valuation、Allocation 等复杂业务插件 |
| EVO 侧 Finance Owner | 独立信任的金融事实/策略版本只读核验；未来另经授权才执行 Cost/Allocation | EVO `apps/api/src/finance-owner-delegation-route.ts`、`finance-owner-readonly-app.ts`（Draft） | 此轮只有 `executionAllowed:false`；不允许以单次 Read verdict 直接执行资金写入 |
| Eidos Human / Personal Agent | 在 Host 授权能力之上提供操作/投影与体验，EC 可提供建议 | TR01A 已验证采购参考；销售 B2E 尚未安装验收 | 不复制一套账本权威、绕过 Host 传原生金融 SQL |

**用户原意：**基础对象导入+保存扩展字段，与用这些对象跑实际业务是相互促进的两条线，**没有“先做完所有业务再允许扩展字段”这一前提**。导入未知字段的 DataImportJob.source 与正式 Object Extension sidecar 是不同权威；正式扩展应可显式定义/授权/映射，可能需要独立的历史回填。详见已合并 [#603](https://github.com/jiangxng/EVO-App-Platform/pull/603)。

## 二、设计方案比较：来源事实 / 本项目判断 / 适用限制

| 议题 | 来源事实（已经核对） | **已采用 / 工程理由** | **明确排除或暂不采用** | 适用条件、限制和何时重审 |
| --- | --- | --- | --- | --- |
| **业务所有权** | [既有架构规则](../architecture/TR01-BUSINESS-PLUGIN-OWNERSHIP-GUARD-20261010.md) + [#605](https://github.com/jiangxng/EVO-App-Platform/pull/605) 具有局部正反向 CI | **安装式 APPLICATION 业务插件 + Provider + EVO 金融 Owner**；Platform 只提供共享支撑，方便企业差异并行演进 | Host 硬编码采购、销售、库存和财务业务；一个 Trading Reference 长成所有生产业务的单体 | 当前静态 tripwire 只覆盖 TR01，**不保证所有运行时动态 import/SQL 未越界**；独立商业插件拆分仍需后续契约 |
| **未知字段 / 正式扩展** | [FO 验收矩阵](FO-IMPORT-EXTENSION-HUMAN-ACCEPTANCE-20261010.md) 已列 DataImportJob.source 与 sidecar 的区别 | 导入先保全原始资料；重要字段经授权升级为正式 extension/profile 或业务字段，并保留可解释映射与审计 | 静默将任意 Excel 列写入 Counterparty 核心；要求先跑完整 ERP 才允许保存供应商评级 | 历史回填、正式扩展定义的 Eidos 完整 UI、角色显示仍待 Human 验证 |
| **Host→EVO 的信任身份** | App remote adapter + EVO route 代码：Ed25519 有 `iss/kid/aud/iat/nbf/exp/jti`、tenant/context/actor、intent scope，Owner 自行验签，默认拒绝 | Host 只在安装/权限通过后由服务端密钥签短时一次性只读委托，EVO独立核验；**局部真实 PostgreSQL CI 验过** | 客户端自称 actor/enterprise；匿名 Owner 验证；持有原始 `/demo` 命令当可信财务边界 | 本地 PKCE/RS256 IdP 和 TLS 不是生产 IdP、真实 ingress；生产 KMS/OIDC 尚需验证；要求密钥托管和轮换审核 |
| **动态公钥/nonce 权威** | GitHub source/CI：Postgres `finance_trusted_signing_key`、`finance_delegation_nonce(issuer,jti)`、Operator audit；[#613](https://github.com/jiangxng/EVO-App-Platform/pull/613) 并发测试真实 200/409、401/401 | **同一事务公钥行锁 + 验签 + 数据库唯一 nonce**；两个独立 EVO 进程共享同一数据库，即使热撤销也一致 | 只靠单进程内存 set、启动时静态公钥 JSON、重启才撤销、仅事件最终一致无 admission 屏障 | 必须共用提交可见的 DB；当前没测生产多机网络/读副本滞后；B2D4 执行时必须再次验权 |
| **受限 runtime DB grant** | [Postgres SELECT 官方原文](https://www.postgresql.org/docs/18/sql-select.html)：`FOR SHARE` 需要所涉表 UPDATE 权限；[真实失败 #38061476431](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38061476431) | **非 PUBLIC、固定 search_path 的精窄 SECURITY DEFINER active-key 行锁函数**；只对独立 runtime role GRANT EXECUTE，保留 operator 修改权 | 给 runtime 对密钥表 UPDATE；让 full service 用 superuser；只 `SET LOCAL ROLE` 模拟真实登录 | `SECURITY DEFINER` 必须核验真实 function owner/search_path/schema CREATE 和 `REVOKE PUBLIC` 同事务；见 [官方 CREATE FUNCTION](https://www.postgresql.org/docs/18/sql-createfunction.html)；生产具体 GRANT 未验收 |
| **nonce `ON CONFLICT` 权限** | [Postgres INSERT 官方原文](https://www.postgresql.org/docs/18/sql-insert.html)：冲突 arbiter/RETURNING 列需 SELECT；[真实失败 #38061811187](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38061811187) | 运行角色仅 `INSERT` + `SELECT(issuer,jti)`，而非全表读/任意财务写权限 | 为使 CI 变绿将所有表 `GRANT ALL` 或取消防重放 | 实际 schema/DB 引擎升级、函数 owner、角色继承关系改变时重审，CI 探测实际 `session_user=current_user` |
| **通用 EVO API 与金融入口隔离** | [EVO #110](https://github.com/jiangxng/EVO/pull/110) 创建只挂 Owner route+health 的 app；[App #616](https://github.com/jiangxng/EVO-App-Platform/pull/616) 的 404/正向真实 DB CI PASS | 专用只读 Finance Owner 进程持窄 DB Credential；通用 API、Demo、BusinessData/命令端点**不注册** | 在完整 `buildApp()` 上仅靠 DB 角色拒写来冒充独立金融网关 | 单独的监听进程≠真实独立 pod、私有 DNS、LB、TLS/mTLS、网络 ACL。CI 虽有实际 HTTPS 本地验证，但未生产安装 |
| **金融执行门槛** | 当前 [project.status.json](https://github.com/jiangxng/EVO-App-Platform/blob/a434d4b8c0737894a79864c1ad806000c87f53f6/project.status.json) B2D3 `OPEN`；Owner response `executionAllowed:false` | **财务写入单设 B2D4**，重新验证审批/幂等/业务事实边界/并发/审计/重放，不可延用 B2D3 read token | 把通过 preflight 的 `verified=true` 当 Cost/Allocation 的写入准入；调用私有 CostEngine 或 demo endpoint | 待 B2D3 真实部署和用户安全决策后再开门；Agent/Eidos Sales B2E 另验 |
| **更多基础业务字段** | 采购/销售参考代码为单订单、单物料/特定销售情况；公开业务历史核对 | 根据真实需要收敛正式业务字段 vs 企业扩展 vs 账本派生值 | 按传统 ERP 一次堆满所有字段，或把客户余额、累计采购金额直接写入供应商/客户可修改主数据 | 多行、分批、部分核销、多币种、订单反转等属于未来明确业务插件里程碑，不提前声称已商业化完成 |

**判断与事实的界线：**Postgres 官方文档只说明 SQL 权限与安全要点，**并未**为 EVO 选择独立 Finance Owner 架构。独立服务、短时 assertion、数据库唯一 nonce、最小 grants、业务归插件是本项目基于需求/失败证据所作**工程决定**；他们的充分性以 CI 范围为限。

## 三、已经真实出现的冲突、如何处理、尚未解决的风险

1. **PostgreSQL “读锁” vs “只读运行账号”冲突（已在 CI 解决，生产未验）：**`FOR SHARE` 实际还需 UPDATE 权限，[失败 #38061476431](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38061476431) 证明不能直接给 runtime 原始表 `FOR SHARE`。替代方案为 EVO [迁移](https://github.com/jiangxng/EVO/blob/4e21327931c2db291d9a57619c64c9dc9da3f4e7/migrations/schema/202610100040_finance_runtime_key_lock_function.sql) 的 `SECURITY DEFINER` 静态锁，`REVOKE PUBLIC`，仅运行角色函数 EXECUTE。[#38061971800](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38061971800) PASS。**余留**：生产拥有者是不是高权限过大、public schema 是否可由不可信用户 CREATE、`search_path=pg_catalog` 与官方建议的 `trusted, pg_temp` 要做安全复核；不能仅因固定 `search_path` 就宣称对所有 search_path 攻击已认证。
2. **`ON CONFLICT` 最小权限 vs nonce 原子防重放（已在 CI 解决，生产未验）：**[#38061811187](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38061811187) 发现只有 INSERT+SELECT(jti) 仍不足。依据官方 INSERT 原文，给 `SELECT(issuer,jti)` 后 [#38061971800](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38061971800) PASS；不意味着可以放松 nonce retention/审计或改用内存重放防护。
3. **“双实例”证据 vs 真正跨机器部署（仍 OPEN）：**[#613](https://github.com/jiangxng/EVO-App-Platform/pull/613) 已证明**两个独立 Node 进程共用一个 PostgreSQL**，同 nonce 只一次成功；但不证明不同节点、不同私网、DB 主从、LB/网络分区、多 Host 共享 active key pointer。缺真实环境与拓扑的独立验收。
4. **“本地 OIDC/HTTPS PASS” vs “生产登录/加密通道 PASS”（仍 OPEN）：**在现有 workflow 中用了 CI 仿真 PKCE/RS256 OIDC 和自签名本地 TLS 的真实握手；**真实客户/Google OIDC 租户、证书托管、private ingress/mTLS、生产信任边界没有验证**。
5. **“隔离 API” vs “真正隔离部署”（仍 OPEN）：**[#110](https://github.com/jiangxng/EVO/pull/110) 源码确实只注册 Owner 路由，[#616](https://github.com/jiangxng/EVO-App-Platform/pull/616) 实际 HTTP 404；但还没有生产部署身份、container image/进程策略、Pod 网络、关闭公网监听、服务账号最小范围的验收。
6. **动态公钥撤销/nonce 顺序边界（部分解决）：**先提交撤销，等待中的新请求必须拒绝且不消费 nonce；[#613](https://github.com/jiangxng/EVO-App-Platform/pull/613) 已证。**仍未解决**：已经认证通过而尚未调用未来 B2D4 finance write 的业务重验条件；即使现实撤销后，过去合法的只读结果也不可以作为永久授权。
7. **最小 EVO Core vs 高级 Cost/Allocation Owner（设计未最终产品化）：**目前 Finance Owner 的传输代码在 `apps/api`，并不意味着要变更最小 Core 的所有权：这是可运行兼容路径/独立入口。未来真正稳定的 Owner plugin 包装、版本化安装、部署身份及迁移权威还需单独设计；不可把“在 EVO 仓库”偷换成“EVO 最小 Core 负责所有金融插件”。
8. **正式扩展字段的 Eidos 管理 UX 与回填（仍 OPEN）：**已有数据/协议能力不等于运营人员已经可以在浏览器一键定义任意未识别字段并回填历史。P0 Human 验收应独立验证，不能混作 B2D3 付款链未完成的阻断理由。

## 四、按优先级继续查阅与可执行下一步

| 优先级 | 先读哪里／需补的一手证据 | 具体模块/交付物 | 可接受结果，不可冒充的结果 |
| --- | --- | --- | --- |
| **P0** | [本包详细来源索引](TR01B2D3-WINDOW-RESEARCH-SOURCE-INDEX-20261011.md) W01–W03 + [EVO 安全迁移](https://github.com/jiangxng/EVO/blob/4e21327931c2db291d9a57619c64c9dc9da3f4e7/migrations/schema/202610100040_finance_runtime_key_lock_function.sql)，补查实际 deployment schema CREATE、function owner、`pg_temp` 及 `REVOKE PUBLIC` 生效时序 | 在 EVO #108 分支衍生小 PR：受信函数/角色权限自动化负控及部署硬化清单；App #594 配套 CI | 真实隔离 DB ACCOUNT 负控/迁移升级/OWNER HTTP 通过；不宣称生产 DB 已完成 |
| **P0** | 用户明确选择生产 IdP/部署平台后读取**真实** IdP、Ingress/TLS/mTLS、Secret Manager/KMS 官方文档 + 账号/证书/权限实际数据；此前本窗口**未阅读这些外部原文** | App Platform `providers/oidc`、`manager/server.ts`、`apps/trading-reference/finance-owner-remote.ts`；EVO dedicated owner `finance-owner-readonly-main.ts`；建立 `TR01B2D3-PRODUCTION-ADMISSION-CHECKLIST` 小文档/PR | 生产主体验证、可信证书、私有服务身份、密钥的运维证据；没有权限先做非破坏性的清单/预检，绝不能填写虚假 PASS |
| **P1** | 真实 LB、多机器/主库/只读副本/网络故障实际部署配置和变更日志 | 延展 App `certify-tr01b2d3-cross-instance-races.mjs` 的**网络/部署层测试**，不改既有同 Postgres 一致性规则 | 跨机器已认证与撤销顺序可见，不是同机双进程的重复 |
| **P1** | 真实业务 Owner plugin 授权/版本/install 及 Execution-time approval/segregation 文档 | B2D3 完成后另起 B2D4 设计/PR；保留 `executionAllowed:false` 直到正式执行权限完成 | B2D4 必须重新验签、租户、时点、幂等、审计、回放；不能沿用 B2D3 read verdict |
| **P1** | 既有 [FO Human 验收矩阵](FO-IMPORT-EXTENSION-HUMAN-ACCEPTANCE-20261010.md)、3 个 CSV fixture，实际 Eidos 浏览器权限/扩展管理 UI | CP-03/CP-05、Object Extension/Data Import 的独立产品 UX 验收；不混进财务 PR | 分清原值保存、可显示正式扩展、跨角色/租户权限、历史回填；不能宣称上述都已 production E2E |
| **P2** | 后续完整采购付款/多行销售/部分结算、多币种/银行对账的真实业务需求 | 独立 Purchasing/Sales/Inventory/Finance plugins + 受控业务字段契约及 B2E Human/Agent | 不按臆测一次做完 ERP；按业务插件独立收敛、保留 EVO 账本权威 |

## 五、变更边界、关键文件、分支与交接复现

**既存功能分支（只读/审查原有未完成 Draft；除非正在继续 B2D3 受控小步，不要乱合 main）：**
- App Platform `feat/tr01b2d3-host-owner-delegation-20261010`，PR [#594](https://github.com/jiangxng/EVO-App-Platform/pull/594)，已核实 head `527257976e16db954cab2aed1cc1be0b8e603ad4`。
- EVO `feat/tr01b2d3-finance-owner-auth-readonly-20261010`，PR [#108](https://github.com/jiangxng/EVO/pull/108)，已核实 head `4e21327931c2db291d9a57619c64c9dc9da3f4e7`。
- App Platform main `a434d4b8c0737894a79864c1ad806000c87f53f6`；EVO main `d5ce051325c4572c7a5fd713560d7d7d06e4b401`。
- 本窗口资料保存分支 `docs/tr01b2d3-window-research-handoff-20261011` 从 App main 派生，仅本交接三份 Markdown；**绝不编辑** `project.status.json`、`HANDOFF-LATEST.md`、Agent/2D Designer、真实财务或生产凭据。

**下一份技术小 PR 允许的目标：**将现有 B2D3 专用 Owner 服务的**生产前安全权限与部署预检**标准化（默认拒绝、DB 角色/function EXECUTE/nonce 最小列权限、无通用路由、无 startup static trust fallback、未部署/未批准时不得开启）；同步建立运行手册、CI 负向验证和明确 `NOT_CERTIFIED` 证据，不擅自进行生产身份、数据库、密钥/网络的不可逆操作。

**研究复现方法：**先 W01–W03 的原始 PG 18 章节 → L03/L04 两次失败日志 → G07/G10 修改实现 → L05 正向 PASS → G11/L07 双进程并发 → G08/G09/L09 独立进程路由封闭 → L10 父 Draft 37/37 完整成功 → 当前 `project.status.json` 仍 OPEN。此顺序尽量恢复**研究因果链**，而非只给参考链接清单。
