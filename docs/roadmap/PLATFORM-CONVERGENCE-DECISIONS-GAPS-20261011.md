# Platform 功能分支收敛：确认决策、方案比较、来源冲突与未解决问题

> 更新时间：2026-10-11；窗口范围仅 EVO-App-Platform 非 Agent、非 EOG / 2D Designer。
> 本文承接 [简短入口](./PLATFORM-CONVERGENCE-WINDOW-HANDOFF-ENTRY-20261011.md) 与 [实际已读资料索引](../research/PLATFORM-CONVERGENCE-SOURCE-INDEX-20261011.md)，不替代全局 project.status.json、HANDOFF-LATEST 或 Agent/2D 专项文件。

## 一、目标 / 用户明确要求 / 不可越界项

**最终目标：**把 Platform 原先残留的 30 个非 Agent / 非 2D Designer 旧分支，按真实产品功能一个个收敛至当前 main；每步必须有可验收的成果、合格测试、已审查变更，然后及时合并并删除原分支，不是简单减少 Git 分支数量。

用户确认的事实：Railway 的名称虽有 production，但从未设正式业务投产环境，目前一直是**公网集成测试**；接受直接使用原测试公网地址进行部署和验收，不要求无必要的新 Railway Preview 服务。EVO Ledger Runtime 已有 FIFO 和财务核销，Platform 不应复制第二个计算内核。Agent 和 2D Designer 在独立窗口有正在进行的 PR 和商业化验收，**本窗口不得接管、合并或删除它们**。

约束：不改动其他窗口的 mainline 文档和分支；不写入项目全局权威状态；来源原文/元数据/个人工程判断须分开写；不得因为历史分支中包含老代码就覆盖当前经过验证的新实现。敏感授权、凭证签名、跨企业隔离不可用伪成功替代真实证明。

## 二、已采纳的实施方案与被否决的选项

| 课题 | 已采纳（工程判断）及依据 | 不采用及原因 | 适用条件 / 限制 |
|---|---|---|---|
| 多个分支合到 main | 按用户可感知功能形成小 PR；基于最新 main 提取缺失能力，添加回归测试；CI 通过才合并。实际落地 #716/#717/#719/#721/#722。 | 整分支直接合并、以旧版 manager/server.ts、Eidos 或 Catalog 覆盖新版；旧分支通常落后 200–1300 个提交，容易破坏新契约。 | 适合“旧需求仍有效、新平台已有大部分能力”的模块。大规模新安全能力必须单独审查。 |
| 保留历史提交 | 五批 PR 用多父提交把旧源 heads 纳入 git ancestry，归档历史决策，最新文件 tree 来自 main，只覆盖经审定的模块。 | 只做 merge commit 不移植缺失功能，或直接删除未合并独有代码。 | 已合并的 source ancestry 并不自动表明 PR ref 已删；需要独立核对开放 PR 与 branch SHA。 |
| Template Store | 恢复 versioned item ID 生成/反解析；使用 encodeURIComponent + 严格安全整数验证。main 原有 Seed、transfer、copy auth 保持不变。见 #716。 | 恢复旧文件中整个 TemplateStoreRepository 或切换旧授权 rule ID。 | 只针对标识工具缺口；不代表当前 /store 端到端安装已验证。 |
| Counterparty / XLSX | 恢复旧 CP03 2048 列硬界、在填充 null 前阻断恶意超远列、行数早拒绝、额外数据列不静默丢失。继续当前 commitPreparedRows 原子事务。见 #717。 | 退回旧 commitBatch、relationshipRoles 领域字段塞入通用契约、整体替换 Eidos。 | 需要 ZIP 恶意输入测试 + Human 实际 XLSX/CSV 用例；4 个新单元回归不是实际用户文件的全集。 |
| TUGE 登录 | 当前 main 的标准/演示双皮肤、logo/background PNG、#d2eaff、rev 缓存参数已有；新增静态/PNG 及 URL 编码回归。见 #719。 | 再次导入 .b64 staging 中间片段或旧版 demo CSS、server 注册逻辑。 | 原始视觉未做像素级浏览器验收；用户品牌 logo 不允许擅自改图。 |
| Ledger Configurator | 使用独立的 capability-operations.ts + capability-action-handlers.ts 包内只读操作，以及当前 8 项已有测试；附加跨模块验收 #721。 | 用旧 action-handler.ts 覆盖新版，或让 Platform 接手 EVO Posting、FIFO 和核销。 | 只读描述、分页、cursor 都在现代 package/Host Action 语义下成立。 |
| EVO runtime observation | 继续 enterpriseId + typed source 的现行 contract，见 #721。 | 恢复旧 scopeKey 形式作为新的企业权限边界。 | 这是旧/新代码比较得出的工程选择；真实跨仓库 HTTP 授权需重新独立验证。 |
| Template Store Eidos | 使用现行 catalog-browser/detail、用户明确要求的投影视图只读和现行渲染器；#721 只加跨模块回归。 | 用旧模板浏览 CSS 或 vender/eidos render.ts 覆盖新版。 | 不触碰独立 2D Designer 工作窗口；2D Viewer 的安装/发现需要原专项验收。 |
| TR01 采购->收货->冲回 | 复用现行 append-only BusinessData + FULFILLS / REVERSES；历史证据归档，新增契约回归 #722。 | 将金额余额、FIFO、核销和单据重算放回 Platform，或直接恢复旧测试/脚本覆盖新 Replay。 | 主线逻辑已通过 CI，独立 EVO PostgreSQL/public API 真实回放仍应按对应 workflow 专项复核。 |
| 仓库分支删除 | 先确认分支 head 的全部提交已进入 main（ahead_by=0），再次校验 PR 依赖、SHA 未变、受保护名称；对树内容已经被 main 吸收但历史不相同的分支先留 archive Git tag。参考 #712/#714。 | 无条件强删、只按“创建时间久”清理、把 Git refs 的消失等同业务验收。 | 当前旧 Branch Hygiene 的全量已关闭 PR 遍历造成 GitHub API 403；见后述冲突。 |
| 部署验收 | 使用已存在的 EVO 公网集成测试 Railway Host，不新建业务服务；部署 main 后核对实际 SHA、健康和 UI，再进行 Human 测试。 | 认为 Railway production 即业务正式；或声称 GitHub main 合并后自动线上已验收。 | 在 2026-10-11 快照中 Railway 还在 296d9c44，main 是 56063b50；二者没有对齐。 |

## 三、现有来源之间的重要差异 / 冲突（不能抹平）

### C1. “main 已合并”与“旧分支已删除”不是同一事实

- 来源事实：五个 PR 已 merged，Platform/Continuity CI 通过；旧 source tips 被接入多父提交历史。
- 来源事实：最后查询仍有 59 个分支，部分老分支和 chore 收敛分支依然存在；另有 Agent/2D 分支并行增加。
- 来源事实：GitHub Branch Hygiene [run 38113793947](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38113793947) 因 installation REST API 5000/5000、GET 关闭 PR page 5、HTTP 403 而失败。
- 结论：不能写“16 条已删除”。正确措辞是**16 条功能源分支已完成有测试的主线收敛，删除 refs 仍需复核和清理**。
- 接续：确认另一个窗口或并行分支 chore/prune-functionally-converged-nonparallel-20261011 是否已修复，再做目标化清理；不要触发整个 API 配额再次耗尽。

### C2. “Railway SUCCESS”与“这轮 main 已经公网验收”不同

- 来源事实：Railway 最近的成功部署 SHA 是 296d9c444ae50ba802fd01c1584caccd205f356c，早于本轮多批 main commit；服务是 Ledger Configurator（实际 Platform Host），URL 包含 production。
- 用户明确：没有正式生产环境，始终在此公网测试。
- 结论：Railway 环境名不等于业务正式环境，且测试站点与最新 main 不一致；不应报告 #716/#717/#719/#721/#722 已公网可见。
- 接续：沿用现有地址；检查并行部署冲突、DB 兼容性，再安全部署目前选定的 main SHA，明确实测版本。

### C3. 旧文档对财务/业务认证的描述不等于本次重新认证

- 来源事实：2026-10-10 的 TR01A2 原始候选文档写有 EVO PR #103/#104/#105、公网 API、PostgreSQL replay 和 A1 部署；文档状态自身标记候选/待部署。
- 本窗口直接审查的是 Platform purchase-loop、相关测试、现行工具/工作流和旧证据文档**部分正文**；没有重新完整读取关联 EVO 仓库最新 main，也没再次执行真实公网上的 A2 端到端验收。
- 结论：#722 是功能/证据主线收敛，不是独立的 2026-10-11 EVO Ledger Runtime 跨仓库验收结项。
- 接续：用 EVO main 当前 SHA、公开接口版本、实际 PostgreSQL 数据及现行 cross-project workflow 重放再认定。

### C4. Template Store / Eidos 的旧演示版本与现行用户视图需求不一致

- 来源事实：旧体验资源仅 3.3k 左右，新 9.2k，后者包含 Catalog Detail、Projection Gallery、复制等新结构。旧 CSS 和现行 renderer 差异很大。
- 判断：统一 Eidos 语言优先于旧演示 UI；不得为了历史 PR 单独回滚 viewer 或设计器。
- 未决：六个独立 Trading Native Application package 的安装/发现链仍需要真正宿主验证，静态 CI 不能保证商店可见。

### C5. 旧 Ledger / import contract 与现代对象所有权不同

- 来源事实：Legacy CP03 是 commitBatch、relationshipRoles；modern 是 commitPreparedRows/ATOMIC_BATCH；旧 Ledger Handler 与当前 package-owned Actions 签名也不同。
- 判断：应保留领域归属的新契约，旧记录仅做考古证据，不能启用两套并行 API 而制造“哪个才是权威”的混乱。
- 限制：如果老客户/外部系统确实依赖旧 API，需另做迁移与兼容性评估，本窗口未找到实际此类线上依赖证据。

## 四、未解决问题与下一步验收门槛

| 优先级 | 任务 | 具体落点 | 必须满足的完成条件 |
|---|---|---|---|
| P0-A | 修复不安全/低效的历史清理策略，完成已收敛 source ref 清理 | .github/workflows/branch-hygiene.yml（实际路径需再次查文件），.github/workflows/prune-merged-inactive-branches.yml，.github/workflows/retire-subsumed-independent-branches.yml；并行 chore/prune-functionally-converged-nonparallel-20261011 | 不再分页遍历全部关闭 PR 消耗 quota；所有 Agent/2D/open PR 保护；复核 SHA、ancestry、archive tag；run PASS + 删除名单 + 剩余分支复核 |
| P0-B | 锁定测试与发布基准 | GitHub main、Railway service Ledger Configurator、现有公网 URL | CI 通过；部署 SHA 与明确目标 SHA 对齐；功能浏览器/接口测试及测试数据证据完整；不能称正式投产 |
| P1-A | TR-01 Host 授权委托 / finance owner 安全边界 | Draft PR #594；manager/server.ts、providers/trading-finance-owner、apps/trading-reference/finance-owner-* | 小 PR：权限 DENY、持久凭证/轮换、租户边界、跨实例 nonce、Replay/幂等；失败关闭；real Postgres/HTTP 证据；没有 Agent/2D 冲突 |
| P1-B | TR-01 admission / 阶段门 / 部署清单 | feat/tr01b2d3-six-lane-production-admission-20261011、twelve-lane-preprod、definer-owner-strict-admission、deployment-descriptor-gate、finance-owner-prod-preflight | 验证到底是可复用真实 admission 还是过时自造阶段术语；只复用与产品 owner 和现行环境相容的契约 |
| P1-C | 采购、收货等六个插件的真实安装、页面及授权 | apps/trading-stage-*/package.ts、catalog/seed.ts、Plugin Store Installer；PR #703 | 不改 Host Core 来硬编码一批插件；真实安装、重装、卸载、Eidos 页面、数据隔离和最低权限验收 |
| P2-A | 实际用户导入 XLSX | apps/data-import/xlsx.ts、data-import Human、Counterparty/Item | 真实样例、10k 压力、中文标题、日期数值、异常 ZIP、公式处理和错误反馈；避免 2048 列保护回退 |
| P2-B | 登录双皮肤视觉与素材校验 | manager/login-page.ts、manager/assets PNG、现有公网 /login?skin=... | 用户原 Logo 无修改；标准背景保留；页面视觉与移动端截图逐项人验；不复用旧分支 staging base64 |
| P2-C | 看齐项目文档与现场状态 | docs/roadmap 与 docs/archive；不要未经主线协调直接写 project.status.json | 主线通过后进行归档，区分“CI_PASS / 合入 main / 公网验收 PASS”三个阶段 |

### 针对长期独立 TR-01 的具体审查要点

- **谁可以签名 Host delegation？**用户 session、enterprise ownership、安装的 finance owner package、跨实例/revoke race、过期处理必须有清晰契约。
- **上线测试不等于生产合规。**当前项目无正式投产环境；出现 “production admission” 的历史 branch 命名不能决定实际环境或准入标准。
- **是否覆盖 Host Core？**大量 TR-01 分支比 main 落后约 91 次提交，但本身 ahead 50–130；不能批量整支 merge manager/server.ts 和 catalog/seed.ts，也不应让 finance owner 控制核心账本计算。
- **是否遗漏六插件生命期？**已有 demo 插件包，但 Host 注册、商店发现、安装后页面、真实 EVO BusinessData 权限尚无本窗口端到端证据。
- **是否涉及跨仓库部署？**如果修改 EVO 或 Eidos 必须遵从各仓库独立 owner/PR，并与 Agent/2D 窗口先核对，而不是把改动藏在 Platform 旧 branch 里。

## 五、值得继续查阅的原文方向（本窗口没有冒充已读）

1. [EVO Ledger Runtime 当前仓库](https://github.com/jiangxng/EVO)：BusinessData 公共接口、REVERSES 关系、Replay/Postgres 认证、财务授权策略的**最新 main 原文**；不是只读旧 TR-01A2 文档。
2. [PR #594](https://github.com/jiangxng/EVO-App-Platform/pull/594) 的完整安全 diff：特别是授权静态规则、Host request authentication、finance owner Provider、nonce 一致性、签名密钥生命周期；本窗口只读取了 PR 元数据和文件索引，不能作为安全完成结论。
3. [Eidos 规范仓库](https://github.com/jiangxng/eidos)：Catalog Detail、分页 Table、2D Viewer 的当前 owner 约定，与 Platform vendored 文件是否同步；以 2D 窗口为主，不在本收敛线私改。
4. [GitHub Actions 官方 API 限流文档](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)：这里只是后续建议，**本窗口未读取该原文**；重设计 Branch Hygiene 时可以查找更合适的查询/缓存策略。
5. [Railway 项目控制台](https://railway.com/dashboard)：当前服务、项目与 environment 实际改名能力；之前连接器不支持显示名称修改，下一步需在控制台核对后修改，且注意 Validator 依赖的内网 service hostname。

## 六、交接遗产与未保存的内容

**已经在 GitHub 永久保存：**五批合入 main 的功能、源码测试、原始历史候选证据（归档）、原始 commit ancestry、PR 对话和 CI 记录。本接续交接另设 docs-only 分支，简短入口、源索引、本决策文档和待收敛分支矩阵相互链接。

**没有保存或不能宣称已完成：**
- 本次不存在外部网站截图、本机 UI 截图、用户原始文件附件或第三方参考网页全文；无需虚构这些材料。
- 未复制全部 GitHub Actions logs 为仓库附件，仅保存原始 run/job URL、关键错误和状态摘要；GitHub 日志留存期限由 GitHub 控制。
- 尚未在 Railway 部署五批最新 main，也未对 #594 做完整安全审查或合并。
- 没有删除所有完成功能收敛的旧源分支；Branch Hygiene 实际 403，需接续。
- 本 docs-only 交接不会改写 main 或其他窗口的专项状态、不会主动清理任何 Agent/2D 分支。

**工作界线一句话：**真正的成果=产品现行功能得到保留或补齐 + 测试通过 + PR 合入 main + 源历史保留 + 旧 ref 经安全核验删除；这里五批到“功能合并”已证实，尚有“最终 refs 清理”和“公网人验”。


### 2026-10-11 新窗口决定：优先交付六插件可安装预览，不误报业务正式上线

- **新增证据（A 原文）**：Main 有 6 个独立 package 和进程内 lifecycle CI，但 `catalog/seed.ts` 与 `manager/server.ts` 的 Host Catalog 构造最初并未纳入这六包；直接部署 #703 后的 main 不会让用户在真实 Store 看到它们。
- **采用** package-owned `host-preview.ts` + Host 四处最小显式 wiring + `APP_PLATFORM_STAGE_MODE=isolated-preview`、`APP_PLATFORM_TR01B_STAGE_DEMO=enabled` 双开关；`#731` 通过 36/36 CI 后合入，不用旧 14 分支 Host Core。
- **排除** 无条件将六包注册所有环境、绕过安装生命周期直接公开静态 HTML、将 synthetic finance fact 作为真实读写、把旧 `manager/server.ts` 整文件合并。
- **已证实** Railway 同一现有公网集成测试服务新 pinned 版本 `89320e11` 部署 SUCCESS、健康检查 PASS，原持久卷未删改。用户测试未签收，不能称为真正 BusinessData/ERP 生产已完成。
- **保持原决定** 真实销售/出库/应收/收款操作与 Finance Owner 授权 #594、EVO Ledger owner 的安全合同属于下一批独立专项，本次未打开财务写入门。


### 2026-10-11 新窗口：Finance Owner key pointer 最小安全加固结项

- **来源事实（已读原文）**：`apps/trading-reference/finance-owner-key-pointer.ts` 先 `lstatSync(file)`，再 `readFileSync(file)`，两次路径访问间可能被替换。旧回归已验证原子 rename、权限和软链接拒绝，但不是同一 fd 读。
- **采用** 在原工具函数内通过 `O_NOFOLLOW`、`fstatSync(fd)` 验证打开对象、匹配 inode/dev，`readFileSync(fd)` 后保证关闭。补代码形态和目录/rename 回归；保留既有显式拒绝错误码。
- **实际结果** [PR #736](https://github.com/jiangxng/EVO-App-Platform/pull/736) 4/4 CI 成功并合入 main `7c0be5f391d32a83eab515afad39adc8cfc5f247`；该修复是 Host finance key pointer 单项，不验证跨实例 nonce、真实 OIDC/部署 TLS、财务写入，也不暗中解锁 #594 Draft。
- **公网测试保护**：Railway 仍 pinned `89320e11` 的六插件 synthetic preview，用户在测；后续 main 安全修复不可自动上公网。
