# CV-02 Window17｜2026-11-17 #01–#07 最终研究与决策交接入口

> **状态：ENGINEERING_MERGED / DIRECT_EVIDENCE_INDEXED / HUMAN_BLOCKED_IDENTITY_CONFIG / HUMAN_NOT_SIGNED。**
> 交接制作前核验基线：Platform [`main@cb5bfd5ca28d26d99c4687c409c962975fdf848f`](https://github.com/jiangxng/EVO-App-Platform/commit/cb5bfd5ca28d26d99c4687c409c962975fdf848f)；这不是永远最新 SHA。原始来源、日期、完整取舍、Actions 附件/日志位置详见 **[单独的详细研究与决策索引](CV02-WINDOW17-20261117-0707-RESEARCH-DECISION-REFERENCE-INDEX.md)**。本页只放可继续执行的要点，避免复制 2 万字研究正文。
> 来源仅覆盖本窗口实际访问的 GitHub 原始代码、PR、Issue、Action 日志、artifact 元数据；旧外部竞品网页为**历史索引转引、11-17 未重读**。无真实账号、VPS 私有环境、读屏或人工签收原件。

## 1. 本轮目标与用户明确要求

- **业务方向**：只在现有 Eidos + EVO Platform + Counterparty Domain Owner + Host 授权机制上推进 Foundation List Experience。Counterparty 客户、供应商、我的客户、我的供应商的服务端 ACTIVE/INACTIVE 状态与关键词 AND 搜索、原有分页/排序/详情返回、授权当前页 CSV 与可访问的状态/焦点连续性；不创造第二套列表或跨域 SQL 权限体系。
- **质量与体验**：真实 Host + Eidos Chromium 覆盖 1280/390、Owner/Agent READ 与 CSV 的授权拒绝，键盘/读屏和真正 Human 独立验收；不能把 Chromium 仿真手机、静态 Local Experience HUMAN、自动截图、CI “Human UI Review” 解释为已登录真人或物理设备签收。
- **工程治理**：每轮实际执行、不只汇报；不重复开发已经合并的内容，先查最新 main 和并行 PR；独立分支/PR、准确 PR HEAD 的触发 CI 全绿后才合受保护 main，合并后复查 main CI、东京实际部署或正确跳过、Actions SHA-safe 过程分支清理；保留失败原证、独立交接，**不直接 push main**。
- **安全门禁**：CV03 N1 NOT_CERTIFIED、人类 SAVE OFF、CV04 正式跨页后台 EXPORT OFF；Owner [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、Operator [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) OPEN，不覆盖并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184)；未经授权不切换 OIDC、迁移 DB/KMS、复制 Railway 凭据。
- **新窗口交接要求（本次用户提出）**：分别保存简短入口与详细原始参考索引；逐条给标题/原始 URL/访问日期/阅读级别/发现/项目用途；留方案采用与排除的理由、冲突、未决项、Actions 临时证据保全位置；确保可用 GitHub 本窗口权限通过 PR 合并并记录准确 SHA。

## 2. 七轮工程成果与证据边界

| 步骤 | 实际成果 | 能够证实 / 不能证实 |
| --- | --- | --- |
| #01/07 | [#1340](https://github.com/jiangxng/EVO-App-Platform/pull/1340#issuecomment-6938754854) 接续 #1337–#1339 失败的原 Host 键盘复现并合并 | Tab→Enter 状态、搜索 Enter 4/4，原 INACTIVE/ALL 仍部分使用 pointer；**不是**全物理键盘、读屏 PASS |
| #02/07 | 查实真实运行入口是 **Workbench Shell**（不是 Browser Shell）；上游 [Eidos #217](https://github.com/jiangxng/eidos/pull/217) 的共享焦点 helper 经 [Platform #1341](https://github.com/jiangxng/EVO-App-Platform/pull/1341) 合入 | `main@a211b5b…` 原始 Chromium focus 4/4、组合筛选 4/4、当前页 CSV 6/6；东京 DEV 同 SHA 镜像实际发布和 HTTPS/health/匿名 401；不是 Human OIDC |
| #03/07 | [PR #1342](https://github.com/jiangxng/EVO-App-Platform/pull/1342) 合并 [真实 Human 验收执行包](CV02-WINDOW16-20261117-REAL-HUMAN-A11Y-ACCEPTANCE-KIT.md) 和 README 索引 | 四个路由、H01–H11、12 桌面/实体手机/读屏通道全部空白；没有自动签署 |
| #04/07 | 新建 [Issue #1343](https://github.com/jiangxng/EVO-App-Platform/issues/1343) 作为**单一有权 Human 回执入口** | 真实 IdP、最小授权、设备和审核者分开指定，状态 OPEN；没有擅自分配未知责任人 |
| #05/07 | 查东京 [Compose](https://github.com/jiangxng/EVO-App-Platform/blob/main/deploy/tencent-tokyo/compose.yaml) + [Caddy](https://github.com/jiangxng/EVO-App-Platform/blob/main/deploy/tencent-tokyo/Caddyfile.template) + [旧 Railway OIDC 历史手册](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/runbooks/EA-1B2C-GOOGLE-OIDC-PRODUCTION-LIVE-CUTOVER.md)，更新 #1343 为 `BLOCKED_IDENTITY_CONFIG` | 当前*已提交/已部署链路* managed session false、demo-user compatibility-local、Basic Auth；**未直接检查** VPS 私有实际配置及真实 IdP 状态 |
| #06/07 | [PR #1344](https://github.com/jiangxng/EVO-App-Platform/pull/1344) 在已有 `tests/protocol/enterprise-context-creation.test.mjs` 增加东京 demo-only 预览防退回断言，合入 `main@cb5bfd5…` | 最终 HEAD 9/9 SUCCESS，合并后 Platform **1438 PASS/0 FAIL/1 SKIP**、主线 **8 SUCCESS + deploy 正确 SKIPPED**；无运行时/权限修改，不是身份准入 |
| #07/07 | 复核最新 main、原 CI、东京跳过、Branch Hygiene 和 #1343，再提交 [最终 Issue 交接评论](https://github.com/jiangxng/EVO-App-Platform/issues/1343#issuecomment-6940047632) | 当次真实 Human **0/12 签署**、Issue OPEN；正确在外部授权阻塞处停下 |

参考历史基线：[Eidos #214 + Platform #1335 status AND search](CV02-WINDOW14-20261117-POSTMERGE-CONTEXT-RECOVERY-HANDOFF.md)、[八部分焦点评审](../../ui-design-reviews/CV02-20261117-COUNTERPARTY-OWNER-ROUTE-FOCUS-ACCEPTANCE.md)；这些**已做过**，无需重造。当前 #1344 合并后的 main **cb5bfd5ca28d26d99c4687c409c962975fdf848f**；东京最近一次有原日志的真实 runtime 镜像仍是 **a211b5bfcfbed4ceadc942dff3df27bb5fc3327b**，因为后续仅文档/测试 PR 合并后自动跳过部署。

## 3. 已确认决策（事实来源与设计取舍）

| G/L 原始事实 | 已采纳的 D 方案 | 明确不采纳/只在条件满足时考虑 |
| --- | --- | --- |
| Eidos #215/#216 Browser Shell 修正未覆盖真实 Workbench；#217 Workbench+helper，Platform #1341 真 Chromium PASS | 复用 Eidos **单一** Catalog 焦点 helper、原 Owner Read Gate、同业务 pathname 且仅当前合法按钮/search | 不另起框架、不只改错的 Browser Shell、不存储 Principal/任意 selector；实体 Space/读屏待签 |
| #1335 的实际 Domain Owner status AND search 合约已有完整权限/CSV/Agent READ | 继续把授权投影作为唯一数据来源；状态字段未授权则拒绝 | 不另做客户端过滤/万能表/Agent 私有直连 SQL |
| 东京 Compose managed-session=false、Caddy Basic Auth、受限 demo overlay；Host/OIDC/Session 程序能力已实现 | **保持现状 fail-closed**，#1344 锁住“demo-only 预览不得变相当真实身份” | 不直接切 `true`、复用旧 Railway redirect/client/secret；是否用隔离身份测试环境还是东京正式 cutover，由真正 Identity/Security/Ops 决定 |
| #1341/#1344 真实 CI、东京 DEV 健康与 401；#1342 只是操作合同 | 工程、自动化、部署、实体 Human 审核分开计数；实际 Human 用 #1343 单 Issue / 12 通道独立回执 | 不以自动 CI、“Human UI Design Review Gate”、Basic Auth、项目文档或 Agent 自述结案 |
| CV03 N1/正式 SAVE、CV04 后台 EXPORT 是独立安全产品门禁 | 本轮只保持生产拒绝、不触碰 Owner #1212/Operator #1092/#1184 | 不因 CV02 完成焦点/CSV 就开放跨页 EXPORT 或 Saved View SAVE |

## 4. 未决问题和下一步唯一真实行动

**当前硬阻塞：[#1343](https://github.com/jiangxng/EVO-App-Platform/issues/1343) OPEN，`BLOCKED_IDENTITY_CONFIG / HUMAN_NOT_SIGNED`，0/12 Human 通道签署。**

1. **Identity/Security/Ops Owner** 提供具有真实授权的身份测试环境，或批准单独东京身份切换设计；确认现行 Host Managed Session、绑定并健康的真实 OIDC Provider、Secrets 保管、身份目录、HTTPS Callback、持久化/注销/撤权/回滚。**必须通过实际环境且不公开私密值/凭据的证据核实**；未批准绝不能直接打开登录标志。
2. **Counterparty Domain Owner** 授予合法最小客户/供应商与“我的”READ/`status` 字段，准备非敏感 ACTIVE/INACTIVE 合规数据和一个受限人类身份/企业做越权拒绝测试；不能由 QA 或 AI 擅自放开生产授权。
3. **Human 测试者 + 独立审核人** 在实际身份和设备上执行 [H01–H11 / 12 通道验收包](CV02-WINDOW16-20261117-REAL-HUMAN-A11Y-ACCEPTANCE-KIT.md)，重点实体键盘 Tab/Enter/**Space** 跨 Owner 重查、读屏器 NVDA/VoiceOver、手机触控/外接键盘、被拒绝字段与跨企业数据、页面详情返回、当前页 CSV；只向授权存储上传脱敏原证，在 #1343 记录签署与访问受控链接。
4. **若 Human FAIL** 才依据实际复现开最小修复 PR；无新签收/故障时不要再制造 Human “通过”或重复文档/测试；所有合并/部署必须准确 SHA 复验。

## 5. 阅读顺序、临时原证、工作分支与避冲突

1. **从这里 → [详细参考索引](CV02-WINDOW17-20261117-0707-RESEARCH-DECISION-REFERENCE-INDEX.md)**：内含 2026-11-17 逐条原始 GitHub URL、已读/只看元数据/历史索引未重读/待验证分级、方案比较、冲突、具体源码/章节定位、时间戳及 Sources。
2. **行动入口**：[Issue #1343](https://github.com/jiangxng/EVO-App-Platform/issues/1343) → [Human 测试包](CV02-WINDOW16-20261117-REAL-HUMAN-A11Y-ACCEPTANCE-KIT.md)；CV 里程碑仍用 [唯一 CV-00–07 计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)。
3. **无法随意复现的原证**：[Run 44023278978](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44023278978) 里 GitHub artifact **ID 14301647261**，API 元数据大小 **1,443,050 bytes**，digest `sha256:a76493a81a9f495189199df567bf2f17586bbf928feb7e0c8a63214f0a29cbe5`，记录过期 **2027-02-15 05:19:20Z**；本窗口**只核验元数据、未下载/目视解读 ZIP 内图片**。须由有权限证据管理员按证据治理安排在到期前归档。
4. **参考外部研究保留但不重读**：[2026-11-06 原研究索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)、[11-09 旧窗口研究索引](CV-20261109-RECOVERY-RESEARCH-EVIDENCE-INDEX.md)、[11-17 Window14 旧研究恢复](CV02-WINDOW14-20261117-POSTMERGE-CONTEXT-RECOVERY-HANDOFF.md)。本轮没有打开 EX01–EX08 原站，不宣称是新网页检索。
5. **本交接的独立工作分支**：`docs/cv02-window17-0707-research-handoff-20261117`；创建自 `main@cb5bfd5ca28d26d99c4687c409c962975fdf848f`；只提交本入口/索引/README 导航三处，经 PR/精确 HEAD CI/受保护 main/合并后检查/东京正确跳过或实发/Actions SHA-safe 清理。**不要写入** `docs/roadmap/HANDOFF-LATEST.md`、`project.status.json`，不覆盖并行 #1184。
6. **提交标识的规则**：上表 `cb5bfd5…` 是交接前代码基线，不是本交接 PR 合并提交；新窗口应按本交接 PR 最终合并记录核验新 `main` SHA。别把 PR 创建或单次文档提交误称“已合并”。
