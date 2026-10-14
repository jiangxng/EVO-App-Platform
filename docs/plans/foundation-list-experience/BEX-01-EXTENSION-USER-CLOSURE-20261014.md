# BEX-01｜CP-03 扩展字段的业务页面收口（2026-10-14）


> **2026-10-14 BEX 窗口最新交接（优先读此节）**：下方原文是开发范围和门禁记录，所写“待合并/待部署”属于编写时状态，不能覆盖此节已经核验的后续事实。本文件是 **BEX 专项状态入口**，不是全项目权威状态。跨项目总状态 `project.status.json`、生成的 `docs/roadmap/HANDOFF-LATEST.md` 由主线 owner 维护，不在本交接中改写。

## 当前 BEX-01 状态、合并与开发部署

| 门禁 | 2026-10-14 核验事实 |
| --- | --- |
| 原定产品目标 | 供应商列式表格、受权搜索与服务端分页、导入/返回、手机宽度体验；本轮补齐 CP-03 **扩展字段的人类可操作闭环** |
| 已完成代码 | 在导入映射页针对未映射列提供企业扩展字段创建入口；由用户选择来源列、名称、数据类型；复用既有对象扩展定义/导入映射/持久化；供应商详情按字段读权限展示扩展值 |
| 已完成此前 BEX 工作 | 供应商桌面表格、紧凑行样式、手机列表适配、分页/搜索、失败预检查返回供应商、中文必填字段错误提示 |
| 已验证 | [PR #843](https://github.com/jiangxng/EVO-App-Platform/pull/843) 合并前最新整合头 `597e08420d4b564343f068cd37ca4466ca6dbb5a` 的五项检查成功：Platform CI、Project Continuity CI、Lightweight Host Architecture、BEX-01 Real Host Chromium、Verified Merged Branch Retirement。 [浏览器运行 #38516099332](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38516099332) **4/4 PASS**：桌面、失败导入返回、扩展字段创建→映射→确认导入→供应商详情显示、模拟触屏手机。源文件示例列“开户银行”，验证详情值 “HSBC”；使用隔离真实 Host，不是用户已有 XLSX 作业。CP-03 原有扩展值写入测试继续保留 |
| 已合并 | Platform [#827](https://github.com/jiangxng/EVO-App-Platform/pull/827)、[#833](https://github.com/jiangxng/EVO-App-Platform/pull/833)、[#838](https://github.com/jiangxng/EVO-App-Platform/pull/838)、[#840](https://github.com/jiangxng/EVO-App-Platform/pull/840)、[#843](https://github.com/jiangxng/EVO-App-Platform/pull/843) 均已合并；扩展字段闭环合并 SHA **`70597a0e1f73b5c6f10ee4dee9eadc3a615ff66c`**。通用 Eidos 表格/移动/样式 [#178](https://github.com/jiangxng/eidos/pull/178)、[#179](https://github.com/jiangxng/eidos/pull/179)、[#180](https://github.com/jiangxng/eidos/pull/180) 均已合并 |
| **已部署到现有开发环境** | Railway Ledger Configurator、部署 id `3218adea-04ea-4607-bc62-412b12c7d72a`、版本 **`70597a0e`**、状态 **SUCCESS**，保留原服务/数据卷/域名。页面：https://ledger-configurator-production.up.railway.app/#/counterparties/suppliers。虽服务域名含 `production`，项目 owner 明确当前按**开发环境**使用；SUCCESS 只说明 Railway 部署状态，不等于终端用户/生产验收 |
| **GitHub main 最新对账** | 本次首轮核对 main `126f5ef730458999e14b51a15d388938bf769a3b`（PA-02 [#844](https://github.com/jiangxng/EVO-App-Platform/pull/844)）；交接末尾再核为 `7e988fa8646f96b2e11b1af5283a146044c8e01d`（PA-02 [#845](https://github.com/jiangxng/EVO-App-Platform/pull/845)）。这是两个**时间点快照**，主线会继续前进；都不是 Railway 当前固定提交。接续前务必重新查询 main，不能因交接而自动部署 |
| **待验证** | 用户在**原有业务 XLSX（往来账户2026_10_08_10_15_23.xlsx）**中人工实际体验：导入历史→字段映射→未匹配列创建扩展字段→映射→预检查→显式提交→供应商详情查看。该真实文件仍有 **3 行 `subjectType` 缺失错误**，不能把模拟样本成功推断为此文件也可直接提交。用户尚未回报完整体验 PASS |
| 其他未证明边界 | 真实 iOS Safari / Android Chrome（软键盘、大字、弱网）未测；10k 数据诊断只是合成内存数据，服务端现有授权分页不等于数据库物理分页。属于独立成熟度/后续评估，不自动阻塞**本轮扩展字段**阶段，也不得宣称已做生产性能认证 |
| 对外进度措辞 | **CODE_MERGED + DEV_RAILWAY_DEPLOYED + CHROMIUM_VERIFIED / USER_XLSX_HUMAN_ACCEPTANCE_PENDING**。不要标为“全部业务体验 CLOSED_PRODUCTION_PASS” |

## 产品原则、已遇问题及操作注意

1. **只补 CP-03 的用户入口，不重做 CP-03。** 正式扩展字段写到基础对象的扩展值仓库；未映射的原始列保留于**导入作业**，并不自动成为供应商的永久字段；也未证明原始 XLSX 二进制文件无限期保存。
2. **必须由人确认**来源列、字段业务含义及类型（当前表单支持文本、数字、布尔、日期）。已有字段先映射已有字段；对于系统编码、流程/表单状态、创建修改者/时间等历史系统元数据，不因来源表有列就自动建字段。敏感账户信息的适用范围和读取权限仍需对象 owner 确认。
3. **“主体类型” ≠ “供应商关系/往来类型”。** `subjectType` 表示机构/个人等主体身份，是核心必填项，不是可用扩展字段替代的内容。截图中三行 `DATA_IMPORT_REQUIRED_VALUE_MISSING` 已变为“主体类型”中文提示；但具体文件仍需要源数据或映射确认，不得自动猜“机构”。
4. **真实页面入口位置**：从供应商导入/历史任务进入“字段映射”页；当存在未映射列、Object Extension 已安装且当前企业操作者有 OWNER/ADMIN 权限时，可见上下文导航 **“创建企业扩展字段（未匹配列）”**。这是当前实现，**不承诺存在单独的全局字段管理菜单**；若用户实际找不到，先查插件启用、权限、来源列映射，再做精准可见性修复，不引入新的通用配置中心。
5. 创建扩展字段本身不触发导入；创建后返回当前映射页，重新选择目标字段，预检查通过后才由用户**明确确认提交**。导航中的“返回供应商列表”与提交是不同动作。成功后在对应供应商详情的“企业扩展字段”分组查看。
6. 用户要求以 **真实可用** 为验收，不以截图/录屏/统计绿灯代替操作；当前是开发环境，测试数据可用，无需为了 BEX-01 建新环境或等待其他插件开发进度。发现问题同一 BEX 专项修复、尽快合并、删除已合并过程分支。
7. 这次缺口先后是：旧桌面卡片代替列式表格 → 样式呈按钮 → 预检查失败无法回列表 → 机器错误码不明确 → 扩展字段仅有后台能力无用户入口。以上分别按已有 PR 修复，**不要在新窗口重演从零设计**。

## 下一窗口唯一优先任务（不扩范围）

先在现有 Railway **已部署版本 `70597a0e`** 用用户原有三行 XLSX 作业做实际体验，重点确认“字段映射”页是否易于发现创建入口、源列可选、定义保存后可重新映射、预检查未因`subjectType`继续阻塞、成功提交后对象详情能看到保存值。**若该文件主体类型未解决，应先确认含义和批次固定值/来源更新的现有可用路径，不把它混为扩展字段缺陷，也不擅自新增批量常量编辑功能。** 只有实测发现问题，才开同一范围内的最小修复 PR；别把 Item/Warehouse/BEX-02、Agent、EC、数据结构迁移或物理分页推入本轮。

**交接后的关闭条件**：用户明确认可其真实工作流后，BEX 专项负责人依据证据更新 BEX-01 的 Human gate；保留真实设备与存储层性能为独立待评估项，不借此无限延长 BEX-01。


## 2026-10-14 新窗口续接复核与人工操作卡

**证据层级**：以下 GitHub、Railway 为本窗口连接器直接查询；以下页面步骤来自已合并 #843 的实际页面/Chromium 测试实现，**不是用户原始 Excel 的人工验收结果**。

- GitHub：main 重新查询仍为 `7e988fa8646f96b2e11b1af5283a146044c8e01d`；功能 PR #843 已合并；交接 PR #846 仍为 OPEN/DRAFT，原交接 HEAD `32774e6b212fc1ee5902933817206bb92cdd1545`。交接分支落后于后续 main，纳入主线前必须重新对账，只协调 BEX 范围文档。
- Railway：实际读取 `EVO Ledger Runtime MVP` 项目 Ledger Configurator 最新部署，ID `3218adea-04ea-4607-bc62-412b12c7d72a`，创建于 `2026-10-14T05:22:49.656Z`，状态 `SUCCESS`，提交 `70597a0e1f73b5c6f10ee4dee9eadc3a615ff66c`。本次只读取，不更新服务。部署 SUCCESS 不代表用户验收通过。
- 当前未获得用户已有 XLSX 作业的精确 jobId，也没有直接操作用户已登录浏览器或读取原始 XLSX 内容，因此不推断源文件每个字段的值或宣称已完成业务验收。

### 原有 `往来账户2026_10_08_10_15_23.xlsx` 的现场执行顺序

1. 打开 [现有 Railway 供应商列表](https://ledger-configurator-production.up.railway.app/#/counterparties/suppliers)，进入既有数据导入/历史作业，**恢复原作业**的“字段映射”，不要为了验证入口直接重复提交导入。
2. 查看尚未匹配的来源列。若“开户银行”确实是未匹配列，且该企业操作者拥有 OWNER/ADMIN、Object Extension 功能已安装，则应在当前映射页上下文导航看到 **“创建企业扩展字段（未匹配列）”**。若该列已有对应定义，则优先映射已有字段，不创建重复定义；若入口找不到，先记录当前角色/插件状态/列是否仍未匹配，按当前 BEX 专项做精准核对。
3. 点击该入口；创建页应有“未匹配来源列”“字段业务名称”“数据类型”。手选源列“开户银行”（不假定默认选中正确）、业务名称“开户银行”、类型“文本”；点击 **“保存字段并返回映射”**。该动作只定义企业字段，不提交供应商数据。系统元数据/日志列不自动建字段；账户号码等敏感字段仍需业务 owner 确认权限。
4. 返回原“字段映射”页后，确认新建字段出现在可选目标字段中，将该来源列**明确映射**至该字段；检查其他现有映射，再进入导入预检查。预检查通过后才有“确认提交”流程，不把导航的“返回供应商列表”误认为提交。
5. **必须单独处理原文件 3 行“主体类型”缺失**：`subjectType` 属核心必填身份字段，与 SUPPLIER/“往来类型”不同；预检查若仍失败，记录错误行和字段，依据已确认的实际主体身份修正来源或合法映射，再重新预检查。不得猜测补“机构”、把“往来类型”自动当作“主体类型”，也不得靠企业扩展字段绕过。若现有作业无法编辑源行，只能在确认后修正原 XLSX 并按已有导入流程重建作业；已建企业字段后续使用时直接映射，无需重复创建。
6. 只有当预检查通过且用户确认导入范围后，执行**显式确认提交**；回供应商列表找到对应记录、打开详情，在“企业扩展字段”分组查“开户银行”的真实值。记录看到的样本值/结果（对外报告无需泄露账户敏感内容）。

**人类验收关闭标准**：实际用户确认入口易找、字段选择与类型清楚、返回映射和预检查可操作，且合法数据成功提交后供应商详情显示字段值，方可将 BEX-01/CP-03 本轮标记 `HUMAN_ACCEPTED`。若缺失 `subjectType` 阻止提交，应标记“扩展字段创建/映射已验，原始数据质量阻塞导入提交”，而非虚报整体 PASS。当前状态继续为 **`HUMAN_ACCEPTANCE_PENDING`**。不纳入 Item、Warehouse、Agent、物理分页、共享 Host/Owner 存储改造；不擅自部署。


## 仓库、分支、工作区与冲突边界

- 主仓：https://github.com/jiangxng/EVO-App-Platform；页面共用组件 owner：https://github.com/jiangxng/eidos （核对时 Eidos `main@8d632842f256f4b08c4bedcaa69bda6822c8a3f7`，无开放 PR）。
- 本次交接前再次读取 Platform 远端：**仅 `main@126f5ef7`，开放 PR 为 0**；此前 #827/#833/#838/#840/#843 及治理已合并过程分支已经按核验流程删除。其他窗口活动分支可能在不同时间点变化，接续者务必重新查询 GitHub 而非依赖此快照。
- 本窗口 BEX 代码此前已全部通过 GitHub 提交与合并；**没有在本窗口另留仅本地可用的补丁或待提交文件**。此结论不覆盖其他窗口或用户本地机器，后者的未提交内容未知。
- **BEX 本窗口负责** Counterparty 供应商列表/导入/对象扩展字段使用体验、BEX 专项文档、与 Eidos 表格既有插件接口对齐。**Agent/PA-02 owner** 单独负责 Agent Host、异步 run/outbox、Object Extension Owner PG 存储与安全恢复；Eidos owner 负责通用 UI 控件；平台治理/GOV、TR/账本、2D 由其各自窗口负责。
- **不要修改/覆盖其他窗口权威**：`project.status.json`、由其生成的 `docs/roadmap/HANDOFF-LATEST.md`、`docs/agent-line/**`、`agents/**`、`manager/agent-*.ts`、Object Extension 的 PG/Owner 迁移、TR/账本、2D 文件；不因本次 UI 验收改共享 Host 核心权限/仓储或 `vendor/eidos` 通用设计规范。若需要改共享文件，先核对最新 main 与 owner 活动 PR，做小范围协调。
- 本轮交接文档只在独立 docs 分支/PR 更新，不自动合入 main，不改其它窗口维护的状态。BEX 总索引 `docs/roadmap/BACKLOG.md` 仅更新 BEX-01 一行；本专项权威细节以本文件为准。

---

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
