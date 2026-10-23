# BEX-01 V3 / M06｜Window 14 简短交接入口：main 发布、Railway 阻断、静态预览考古（2026-10-22）

> **先读本文，再读** [Window 14 详细研究资料与决策参考索引](BEX-01-V3-M06-WINDOW-14-RAILWAY-RESEARCH-DECISION-REFERENCE-INDEX-20261022.md)。本页记录截至 2026-10-22 的**历史快照**；执行前必须重新查询 GitHub 与 Railway 实时状态。继续遵守 [AI-BOOTSTRAP](../../../AI-BOOTSTRAP.md)、[开发交付工作流](../../architecture/DEVELOPMENT-DELIVERY-WORKFLOW-v1.0.md)，不以 CI 成功替代线上部署或客户 Human 签收。

## 一、这一窗口用户的明确指令与决定

- 最初想让 **BEX-01 V3/M06** 可以在公网进行真实操作验收；明确现在是**测试环境**，允许发布，并最终明确选择：**使用 Railway，从 main 发布；合并后删除过程分支**。
- 不再采用 RawGitHack 作为完整 EVO 的发布替代；历史 RawGitHack 链接只用于**独立静态 HTML/JS 原型演示**。不把 V3 原型或 TR-01B2D3 财务只读演示冒充 Eidos/Plugin Host/数据库实际运行。
- 不影响别的窗口：不强推 main、不改项目全局状态，不覆盖 Eidos、PA、2D、TR01 的 Owner 变更，保留 Railway 既有服务/域名/环境变量/持久化卷。
- 对历史研究特别要求：短入口和详细索引分开；原始 URL、访问日期、只读全文与搜索摘要区分；新窗口可直接按精确分支/提交继续。

## 二、已完成：四个 PR 合并 main；过程分支全部删除

| 顺序 | PR / 作用 | GitHub 确认的 merge commit | 精确 HEAD 合并前 CI |
|---|---|---|---|
| 1 | [#1060](https://github.com/jiangxng/EVO-App-Platform/pull/1060) V3 高保真基础 | [60ba2e3](https://github.com/jiangxng/EVO-App-Platform/commit/60ba2e31139933148dd1c6d0e5f6d713fe03dfcd) | 12/12 |
| 2 | [#1077](https://github.com/jiangxng/EVO-App-Platform/pull/1077) 文件卡和操作区 | [e496ebd](https://github.com/jiangxng/EVO-App-Platform/commit/e496ebd576ac71f56816bce7d4e3a4e24b88f616) | 17/17 |
| 3 | [#1086](https://github.com/jiangxng/EVO-App-Platform/pull/1086) M06 证据与交互 | [90745c5](https://github.com/jiangxng/EVO-App-Platform/commit/90745c500c0577d31d49e7685491eb38c91095b6) | 17/17 |
| 4 | [#1100](https://github.com/jiangxng/EVO-App-Platform/pull/1100) Window 13 交接 + 仅本线分支清理 | [9dc903c](https://github.com/jiangxng/EVO-App-Platform/commit/9dc903c9238222623566174d0342c62c464ec23f) | 5/5 |

- 最初 #1060 在旧 base 上合并被仓库 required **continuity** 检查阻断。经过比对发现目标差异文件不重叠，按保护规则将当时 main 合入 #1060 重跑；其余 PR 逐一同步最新 main、转为非 Draft，全部正常 PR 合并；**没有强推或绕过规则**。
- [分支清理 workflow run 39722539584](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39722539584) SUCCESS，独立 GitHub GET 四个旧分支均返回不存在：feat/bex01-v3-real-fidelity-clean-mainline-20261020、feat/bex01-v3-m06-file-footer-parity-20261020、feat/bex01-v3-m06-evidence-density-20261021、docs/bex01-v3-m06-window13-source-research-handoff-20261022。**不要试图在这些已删除分支继续开发**。
- #1100 的 [Window 13 入口](BEX-01-V3-M06-WINDOW-13-HANDOFF-ENTRY-20261022.md) 和 [原始参考索引](BEX-01-V3-M06-WINDOW-13-RESEARCH-DECISION-REFERENCE-INDEX-20261022.md) **现在已经在 main**；其文中的“#1086 Draft / 3 PR 未合并”是历史快照，不代表本窗口新状态。
- 本交接 docs-only 分支从当时最新 main **59d31034f4ad7fd2715e1ac26395abbba94a31d1** 派生；前一阶段合并后 main 曾为 **9dc903c**，但本轮建立本交接分支时 main 已前进到 **59d31034f4ad7fd2715e1ac26395abbba94a31d1**。后续须重新核查最新 SHA。

## 三、Railway 当前发现与发布阻断（2026-10-22 再查询）

- 已连接账号可见项目 **EVO Ledger Runtime MVP**，project ID **aee4643e-912b-4ca1-ae95-fe4ec64f5601**；环境仅见 **production**，ID **98b8b20c-d791-4073-a11d-bb1f7f0a1cb3**。名称虽为 production，用户将该部署用于**测试**；不能因称呼不同擅自改环境。
- Ledger Configurator service ID **a8622238-480e-4da3-be6f-60fd0f3e18db**，从 **jiangxng/EVO-App-Platform / main** 构建；外网 https://ledger-configurator-production.up.railway.app ，沿用持久卷 **ledger-configurator-state**（/data）。项目还包括 Experience Compiler、App Host Validator、EVO Runtime、Postgres，全部不要改动。
- 最新 Railway SUCCESS deployment **5cfce97b-9745-4e62-9b64-d2b1e0a2eedf**，关联 GitHub **eef6774bf25e2d2d9e1f2f060cd60d8b28d4c4ff**（2026-10-21 06:41 UTC）。**不能把 main 已合并 BEX 或 9dc903c / 59d3103 误报为已发布**。
- 已多次使用 Railway OAuth 插件重新连接同一 GitHub main 来源尝试触发**新构建**，平台一致返回 **Deploys have been paused temporarily**；没有成功创建新 deployment，原服务/卷未变动。不要用 **redeploy 旧 build** 冒充 main 最新代码发布。
- [Railway 10/21 官方披露](https://blog.railway.com/p/security-disclosure-wednesday-october-21st) 说明部分环境变量可能受未授权读取影响、当时暂停部署；[10/22 官方 GitHub 重连与 bucket 凭据重置指南](https://blog.railway.com/p/security-disclosure-recommendation-redeploy-buckets-and-reconnect-github-after-the-credential-reset) **新增重要要求**：Railway 已重置其所持 GitHub tokens，使用 GitHub 自动构建的用户应核查/重新连接 GitHub、仓库访问及自动部署。之前聊天中“你不必重新授权 GitHub”的判断**已过时，需要纠正**；是否本账号已自动恢复**未证实**。
- [PostgreSQL 凭据轮换官方指南](https://blog.railway.com/p/security-disclosure-recommendation-rotate-postgresql-database-credentials) 同日发布；安全操作会影响消费者连接与服务重启，不得擅自修改 secrets、DB 密码或卷。应先盘点/备份、审计，再协调重连与轮换。
- 用户 Chrome 访问 status.railway.com 截图显示 **ERR_CONNECTION_CLOSED**，不等于 Railway API 没法查询；本窗口通过**Railway 插件实时读部署**、网络搜索以及官方文档阅读分开确认。直接打开官方 incident URL 的网页工具出现 cache miss，不能声称验证了此刻全球故障实时状态。

## 四、历史“无授权的第二个公网网站”已查明

- 用户给出的精确地址：[TR-01B2D3 独立网页预览](https://rawcdn.githack.com/jiangxng/EVO-App-Platform/bd67f320dce5ed6d4a023b58546b619ce4a03aa0/demos/tr01b2d3-isolated-stage/index.html)。该地址指向 **2026-10-11 GitHub 固定 commit bd67f320** 的静态 HTML/JS，使用第三方 **RawGitHack CDN** 从公开 GitHub 文件读取，**并非另建的 Railway 后端**。
- [当时完整记录](https://github.com/jiangxng/EVO-App-Platform/blob/bd67f320dce5ed6d4a023b58546b619ce4a03aa0/docs/roadmap/TR01B2D3-STAGE-DEMO-ONLINE-20261011.md)：旧项目 EVO Plugin Platform Preview 曾尝试 Railway Function，返回 Free plan resource provision limit exceeded，真实后端**未创建**；静态模拟包含合成销售→发货→应收→收款、浏览器 WebCrypto Ed25519 六类只读/拒绝演示，永远 executionAllowed:false。今天连接的 Railway 列表没有该旧预览项目：历史记录与当前资源清单**不等价**，其删除、迁移或不可见原因未确定。
- [RawGitHack 原站说明](https://raw.githack.com/)：固定 commit 的 rawcdn URL 长缓存，只能代理静态内容；独立前端可以演示样式和纯浏览器交互，但没有宿主权限/Agent 服务器/数据库。本轮明确选择 Railway 作为**完整 EVO 真实测试**唯一发布路径，RawGitHack 仅作为可选静态设计评审辅助。
- 旧链接是否**现在仍可由用户网络成功打开**未做 HTTP 端到端证实；当时 workflow 的 CDN smoke probe 不能当今日在线证据。

## 五、仍 OPEN 与新窗口按顺序执行

1. **重新 GET main 和全部新 PR/部署。** 从已保存的 [详细资料索引](BEX-01-V3-M06-WINDOW-14-RAILWAY-RESEARCH-DECISION-REFERENCE-INDEX-20261022.md) 开始，不再寻找已确认的 RawGitHack 来源；不得依赖 9dc903c/59d3103 的历史快照发布落后的代码。
2. **安全优先**：按 10/21～22 Railway 官方通知，检查 Workspace 审计日志、GitHub Railway App 授权和 Railway Account Settings → GitHub 连接，service Settings → Source 指向 main，Autodeploy 是否有效；核查 Railway GitHub token reset、环境变量/DB 凭据轮换的依赖与回退方案。用户需要在 UI 明确重连时请其操作；**不要在聊天中索取明文密钥**。
3. **构建恢复后真正从当前 main 新构建**，核对 deployment.meta.commitHash == 已核实 main SHA，等待 SUCCESS、/health、登录、Host/Eidos/插件、V3 页面与授权安全回归；区分平台拒绝/待排队/构建失败/已上线。不动既有 /data volume，不用旧镜像 redeploy 冒充新发布。
4. **M06 真实 Human 验收仍需独立签署**：业务 PR 合并、CI 全绿不自动关闭 M04 客户原始 Excel/字段身份、M05 真实授权导入、M06 三维（功能/布局/颜色）终验。原型 [#909](https://github.com/jiangxng/EVO-App-Platform/pull/909) 仍 Draft 未合并，合成 172 行/22 列不是客户真数据。
5. 本轮只提交这两份 docs-only 交接。**不改** docs/roadmap、Window 12/13 原始历史、PR #909、任何源码/Actions/workflow 或 Railway。当前 docs 分支不应自动合入 main；新窗口可在验收后按 Owner 工作流处置。

## 六、证据保全

- [详尽原始网址/访问等级/冲突表与截图索引](BEX-01-V3-M06-WINDOW-14-RAILWAY-RESEARCH-DECISION-REFERENCE-INDEX-20261022.md)。
- ChatGPT 旧会话用户图：**image(20261022-043214).png**（Railway 插件已连截图）、**image(20261022-050015).png**（Chrome status.railway.com ERR_CONNECTION_CLOSED）。文件在对话/Library 会话侧，**未随本文上传 GitHub**。
- 2026-10-15 Library **EVO-供应商导入-高保真体验版-V3.html** 及体验包、2026-10-21 Library 的 **BEX-01-M06-Human-验收对照包** 是历史独立文件；本轮没把私有附件复制到仓库。原型主参考仍为 #909 GitHub 固定文件。


## 七、Window 15 更新（2026-10-22：本轮实时核验）

- **最新 GitHub main**：23e391730c7606f3933fb31e8ffcb53c704aa191；3/3 当前 check-runs success。#1060/#1077/#1086/#1100 再确认全部 merged；#909 与 #1111 仍是 Open Draft。
- **Railway 当前**：production 的五服务及原持久卷均存在，Ledger Configurator Online、Source 仍指向 GitHub main，原有服务域名未变。最新 SUCCESS deployment 5cfce97b-9745-4e62-9b64-d2b1e0a2eedf 关联 **eef6774bf25e2d2d9e1f2f060cd60d8b28d4c4ff**，并非新 main。
- **新构建实际重试**：Railway 明确拒绝，返回 **Deploys have been paused due to an upstream issue**。后续再次读部署/待提交配置，无新 deployment、无 staged patch；未重用旧镜像、未创建新服务。
- **安全核查**：Railway 官方 10/22 搜索正文说明 GitHub tokens 被重置，需要账户 Owner 在 Account Settings 核查重连、Railway GitHub App 仓库权限、Source/Autodeploy 与 Workspace Audit Logs。Railway MCP 无权限验证这些控制台门禁。项目无 Buckets；Postgres 当前无 Railway 公网 TCP Proxy。已盘点跨服务数据库变量名，但不是消费者连接串完整依赖分析；OAuth 隐藏变量值；未读取/轮换 secrets、数据库或数据卷。
- **健康和业务**：公开 health HTTP 成功不可验证；不把 API 显示 Online 当作公网功能、Eidos/插件、M06 Human PASS。M04/M05/M06 独立 OPEN。
- **资料等级及新增证据**：见 [详细研究索引第 8 节](BEX-01-V3-M06-WINDOW-14-RAILWAY-RESEARCH-DECISION-REFERENCE-INDEX-20261022.md)；Railway/GitHub 本次接口是 RM，官方博客从搜索正文获取仍为 S，账户 UI 安全审计与外网验收是 D。不得把搜索摘要升格成全文原文。
- **下步**：Owner 确认安全审计/GitHub 重连和凭据处置依赖 → Railway 恢复构建 → 重新核验当时 main、真正 build → SUCCESS/commit/health/Eidos/插件/V3 分层验收。#1111 保持 Draft、不合并、不清理；旧四条过程分支已经清理，无需重复。


**末尾时间差更正：** 本次维护 PR #1111 期间，其他窗口将 PR #1114 合入 main；最后核验 main 已是 **5faf7f44c2a370d6372b00dd248a0bf382be1d26**。上文 23e39173 是先前时点快照；新 build 必须先重新查最新 main，不可固定 23e39173 作为未来目标。
