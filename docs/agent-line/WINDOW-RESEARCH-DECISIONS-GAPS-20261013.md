# Agent / External Agent：方案比较、决定、冲突与后续验收（2026-10-13）

Document class: DECISION_AND_GAP_HANDOFF。先读[简短入口](WINDOW-RESEARCH-HANDOFF-ENTRY-20261013.md)，实际来源及证据等级见[详细索引](WINDOW-RESEARCH-SOURCE-INDEX-20261013.md)。本文件仅治理Agent线和跨仓对接，不修改其他主线。

## 1. 已确认的用户决定（非来源推测）
1. **轻量宿主 + 可选业务插件。** 主平台不预装庞大ERP；按实际安装激活的插件能力运行。用户已要求此原则作为平台CI架构约束；实现或验收该CI须由主线owner核查，**本窗口没有替其他线增改该CI**。
2. **开发成果集中在main**：不再因“功能尚未开发完”维护多个长期分支。跨仓先对账后经CI PR合入各仓main，合并成功再SHA校验并删除旧分支；可保留已合入但未启用的实验。新专项工作原则上使用短时小PR，不直接覆写并行窗口工作。
3. **不让LLM替代确定性执行**。AI提出字段映射/业务建议，授权由Host与业务插件核验；回执、审批、状态、页面dirty和业务记账必须有可验证的确定性依据。
4. **四仓owner不变**：Platform宿主/Agent及插件能力、Eidos通用体验、EC研究/知识/推荐、EVO业务真相与确定性执行。TR业务主线、Ledger Runtime与2D专项不被本窗口接管。
5. **对账不要回退进度**：旧External Agent OAuth实现、旧Eidos移动布局、旧EC架构文档、旧 `project.status.json` 与 `HANDOFF-LATEST.md` 绝不能覆盖较新的main。没有部署生产。

## 2. 比较与选择：明确区分来源事实 vs 项目判断

| 主题 | 来源事实（内部G级索引） | 本窗口采用的方案及理由（项目判断） | 排除方案及理由 / 适用限制 |
|---|---|---|---|
| 未完成代码留存位置 | #692关闭未合并，但该实验的三个核心文件在main内容一致；#786由合并父提交纳入其原分支全部历史。见G03/G07 | 把独立、可隔离、可编译的试验与已批准的文档并入main；无需“每小块一个长期branch” | 排除维持7个活跃Agent PR和5个僵尸旧分支；**限制：源码合并不等于runtime启用** |
| 旧分支收敛方式 | 平台旧branch落后main上千提交；Eidos旧chat PR #176报告冲突；EC文档多数已被新版超越。见G07–G09 | 新main为内容基线，按文件移植仍有意义的部分，旧分支head通过merge-parent纳入历史，再SHA确认删除 | 排除直接把旧分支tree覆盖main/强制push；避免撤销最新授权、翻译、移动UI和全局状态 |
| PA-02A数据库 | PostgreSQL 18隔离 proof成功：32并发Turn、131跳过旧100扫描、CAS与32并发Receipt、两连接重连。G03/G13 | 保留`async repository`作为后续候选，先补崩溃/未知写入/fencing/outbox，然后分阶段接真实Host；Sync V010继续兼容 | 排除“数据库连通即生产迁移”与直接把async塞进sync端口；**限制：非跨Node进程恢复，非正式Run状态机验证** |
| External Agent OAuth | 新main已有授权码/Token/consent HTTP；旧EA4A helper导入新合同已不存在的`EVO_EXTERNAL_AGENT_READ_SCOPE/PLAN_SCOPE`。G04 | 现行OAuth合同与Host权限优先；保留旧EA4A历史作考古，不执行过时代码 | 排除复制旧 `manager/external-agent-oauth-profile.ts` / `package.json` 回退；需单独验证实际外部MCP端点/令牌audience |
| External Agent应用入口 | #786只新增未主动装载的 `apps/external-agent-access/package.ts`，四语标题修复后CI通过。G05/G15 | 插件manifest可作为后续安装/导航候选；仅验证已加载时的业务权限 | 排除仅因文件存在就宣称已向ChatGPT/Claude开放。尤其manifest内`defaultActivation:true`只描述**安装后默认**，仍需安装和运行实测 |
| Chat UX | 原Eidos旧分支提供复制、忙碌/输入框；与较新的布局、icon与四语草稿提示冲突。G08 | #177移植动作、测试、Copy图标和必要CSS，**保留新版工作台布局** | 排除直接旧CSS整包覆盖；限制：CI通过非真实手机/IME/富文本验收 |
| 页面刷新与字段映射 | B2真Host Chromium 8/8；B3 allow/deny真实Capability/DENY对应导入作业无不应有副作用。G11/G12 | 源实例+请求关联、只在干净页面成功时重读；业务状态读回、Receipt审计，保留人工编辑 | 排除“Run返回成功文本就刷新/提交”；限制：模型是确定性替身、富文本dirty和跨企业拒绝未全面验 |
| 学习与Recipe | 真实Data Import导入Recipe复用已在隔离Host链路测过；EC的知识体系独立。G11/G09 | 结构等价优先重用可审计Recipe；EC产生建议而非直接写入企业真相 | 排除把一切聊天写长期记忆、让EC直接记账；数据生命周期/跨租户知识政策仍未完成 |
| Agent编排 | 历史总纲将固定工作流与可组合Agent分开，Protocol/Temporal等仅外部参考H级，非本窗口原文核验 | 默认单主Agent+确定性工具/工作流+受限专业能力，协议先按EVO现有可授权能力落地 | 暂缓Temporal强依赖、多自主Agent、自称AG-UI/A2UI/A2A兼容；先核实际目标规范版本、成本和接口 |
| 页面可访问性 | 本窗口只读Eidos源码与GitHub CI，W3C/HAX外部来源仅旧索引摘要 | 保留状态可感知、复制可操作、移动端操作目标足够大/不抢焦点原则，作为产品验收建议 | 不把项目设计尺寸说成W3C法定/统一值；进入验收前定向阅读当前WCAG页面 |

## 3. 历史说明之间的冲突及本次修正

| 冲突 | 两侧来源状态 | 目前正确解释 / 仍需确认 |
|---|---|---|
| 2026-10-11 `HANDOFF.md` 写#575/#579/#142/570“Draft未合并” vs 10-13 GitHub显示已merged | 旧HANDOFF是**历史检查点**；GitHub PR/merge commits是本轮直接复核事实（G10/M17） | 旧阶段文档不删改以免破坏证据；接续一律先读2026-10-13入口 |
| #692 PR字段仍 `merged=false` vs PA02源码已在main | 旧PR未通过自己的merge按钮；#786合并**其父提交及独立实验文件**（G03/G07） | **代码已在main、产品尚未正式接线**。禁止再把#692当待合PR重开 |
| 旧EA Access Standard写“未开放” vs 当前已有新OAuth与manifest | 文档段首还明示 `EXTERNAL NETWORK ACCESS STILL CLOSED`；代码已有内部授权基础（G04–G06） | 不足以断定真实外部端点已可用；须按实际安装、端点、授权、网络拓扑证实 |
| 原PA01B3首次deny失败 vs 之后显式deny通过 | 早期失败的fixture误将撤销额外ALLOW当真实拒绝，产品基线本来允许某些AI操作；定向DENY后通过（G02/G12） | 不是已证实产品权限漏洞；继续测Host resolvedContext与跨企业阻断、回执终态 |
| PostgreSQL日志字段 `postgresRestartRecovery:true` vs“持久恢复已完成” | 测试实为**同Node进程内数据库连接关闭再连接**（G13） | 不能把它升级成worker崩溃/不同节点/outbox保障 |
| 初次24项PA-01 CI中的跨项目浏览器失败 vs“产品回归失败” | Chrome调试接口启动超过测试等待超时；二次复跑成功（G14） | 作为基础设施flake记录，不无条件忽略；若再现需调启动等待逻辑 |
| 新External manifest加入后插件CI失败 vs“插件符合规范” | 四语title/中文短描述缺失，经修复再CI绿色（G15） | 新插件必须延续多语言/最小目录规范；检查安装/激活仍单独进行 |
| 外部参考S1–S14被总纲描述为已研究 vs 本窗口阅读状态 | 本窗口仅实际读取旧**来源索引**，未打开外部站点（H级） | 不给原网站补造“已读全文/仅摘要”的阅读标签。改变架构时先原文复核 |

## 4. 按仓库模块落点与优先任务（建议，非自动授权）

| 优先 | 模块、现有位置 | 证据与现状 | 下一步最小可验收任务 |
|---|---|---|---|
| P0 | `EVO-App-Platform/manager/server.ts`、`manager/agent-run-store.ts`、`agents/enterprise-agent/pa02a-postgres-durability-proof.ts`、`contracts/agent-durability-async.ts` | #786主线已纳孤立proof和Postgres workflow；仍非正式适配器 | 先审运行时入口和历史状态迁移，设计异步端口兼容；真正独立进程重启、Postgres中断与事务回滚、跨worker幂等；不做生产数据迁移 |
| P0 | `manager/external-agent-oauth-{service,http,store}.ts`、`contracts/external-agent-oauth.ts`、`manager/external-agent-governance-*.ts` | 新OAuth业务规则优先，旧EA4A仅历史 | 查实际OAuth metadata、resource/audience、PKCE、scope、tenant、WRITE拒绝；用非生产外部Client执行盲发现和明确授权验收 |
| P1 | `apps/external-agent-access/package.ts`、`catalog/*`、Eidos外部Agent页面 | 已有候选manifest，不意味着安装 | 测安装前无路由/可见能力、安装后默认激活/角色导航、卸载无残留、平台性能/冷启动/授权隔离。**轻量宿主按需装载CI**由主线owner结合现有校验实现 |
| P1 | Eidos `src/app-host/page-controller.ts`、`src/chat/render.ts`、`src/design-language/*` | #177合main，build/CI成功，真实用户交互仍有边界 | 用真实桌面/移动浏览器验证复制文本与证据内容、IME组合键不误发送、busy状态结束后撤销、会话历史和窄屏导航 |
| P1 | `apps/data-import/*`、PA-01 assistance handler、Eidos contextual helper | B2真Host 8/8、B3 allow/deny通过 | 核deny receipt `DENIED`终态（现未单独读取）；跨租户/伪造来源；富文本/画布dirty provider；真实模型字段映射质量与Recipe复用 |
| P2 | `Experience-Compiler/docs/architecture/*`、EC知识/经验、`docs/agent-line/*` | #9留历史但保持新权威 | 数据来源/租户隔离、学习门槛、遗忘保留策略、审计证据；不改EVO确定性授权 |
| P2 | Platform/Eidos/EC CI与分支治理 | 三仓旧Agent refs已清空（以`agent`/`ea4a`搜索）；cleanup runs成功 | 后续按用户要求继续短PR→fresh CI→main→精确删除，必要时记录新的owner冲突；不要假定全库任意隐藏名称都已扫完 |

## 5. 最值得继续查阅的资料：依赖何种决定
1. **最高优先：内部当前运行时原文及CI**。逐文件查 `manager/server.ts` 的Store绑定、`agent-run-store.ts` 的接口与状态机、OAuth服务和插件目录实际激活路径。以最新main替换本交接快照；这是决定下一个代码PR的必须事实。
2. **External Agent公开规范**：重读[MCP安全最佳实践固定路径](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices)、当前MCP正式授权/资源元数据、OAuth RFC 8414/8707/9449/9700/9728、A2A固定版本；查真实发布日期与适用点。当前只有内部架构标准，外部原文未本轮复核。
3. **持久执行权衡**：重读[Temporal workflow execution](https://docs.temporal.io/workflow-execution)及本仓库实际Postgres合同；比较纯数据库幂等/outbox与外部执行引擎的吞吐、租约、恢复成本，避免凭文章摘要引入依赖。
4. **LLM安全/上下文**：定向核[S1/S2/S3/S14]原文对应节、Anthropic文章真实日期、OWASP安全措施；建立风险矩阵和真实模型字段映射对照测试，而非靠模拟fixture评价LLM质量。
5. **Eidos可访问性/交互**：核W3C 2.2触摸目标/Status Messages、HAX及Eidos现行设计语言，结合真实Chromium/移动端重测输入法、焦点、复制反馈。
6. **遥测互操作**：只在确立审计数据分类、脱敏与主权后锁定OpenTelemetry GenAI semconv版本；不要默认保存敏感prompt。

## 6. 下一窗口验收与禁止事项
- 先读[新入口](WINDOW-RESEARCH-HANDOFF-ENTRY-20261013.md)、[来源索引](WINDOW-RESEARCH-SOURCE-INDEX-20261013.md)、本文件；在实施前查四仓当前main SHA和开放PR、owner、架构宪法，不以10-10/10-11历史“未合并”状态安排工作。
- 独立Agent工作优先补**证明当前不成立的功能门禁**，不用重复已过的浏览器helper或分支历史收敛。每个测试写准确head、实际环境、断言、失败与回滚。
- 绝不默许：因插件化就认为不可能影响main；未完成就直接部署；模型文本代替业务Receipt；旧docs覆盖新docs；旧OAuth覆盖新合同；直接改共享 `project.status.json` 或 TR/2D/生产环境。
- 维持“来源事实/模型判断/尚待验证”三层，外部14项链接阅读标签不升级。不能恢复的日志/网页截图要清楚记为缺失而非创造新证据。
