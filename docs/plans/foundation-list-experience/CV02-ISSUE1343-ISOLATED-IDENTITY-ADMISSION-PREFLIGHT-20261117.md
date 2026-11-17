# CV-02 / Issue #1343｜方案 A：独立真实身份测试环境准入准备（2026-11-17）

> **决策级别：用户已原则选择方案 A（PREPARATION_CHOSEN），不是 Identity/Security/Ops 正式授权（NOT_APPROVED）。**
> **当前状态：BLOCKED_IDENTITY_CONFIG / BLOCKED_HUMAN_RESOURCES / HUMAN_NOT_SIGNED；12 个实际 Human 通道 0/12。**
> 本文仅收口 #1343 的非授权准备。**没有**创建/部署隔离环境，没有启用 Managed Session/OIDC，没有分配角色、账号或生产权限，没有验证 VPS 私有配置，也没有实际测试或替代 Human 签署。

## 1. 现场事实与来源

- 2026-11-17 用户在 CV-02 #1343 续跑中原则选择**方案 A：独立真实身份测试环境**，明确要求“继续执行不涉及真实授权的准备工作；列出身份提供商、负责人和验收资源；不要擅自启用登录或授予生产权限”。这是**方向选择**，并非正式 Security/Ops 审批或凭据授权。
- 本准备的起始受保护 [Platform main `ad09ea56d2a0836b87516189438327289029b85b`](https://github.com/jiangxng/EVO-App-Platform/commit/ad09ea56d2a0836b87516189438327289029b85b) 及 [#1345 已合并的 Window17 原始交接](CV02-WINDOW17-20261117-0707-RESEARCH-HANDOFF-ENTRY.md) / [详细来源索引](CV02-WINDOW17-20261117-0707-RESEARCH-DECISION-REFERENCE-INDEX.md)，其 SHA 只是**本次准备起点**，未来需再核对 main。
- [#1343](https://github.com/jiangxng/EVO-App-Platform/issues/1343) 是**唯一 Human 准入和回执入口**；[Window16 H01–H11 / 12 通道空白执行包](CV02-WINDOW16-20261117-REAL-HUMAN-A11Y-ACCEPTANCE-KIT.md) 是唯一人工验收操作基线。本次不复制或预填原矩阵。
- 现行东京 [Compose](../../../deploy/tencent-tokyo/compose.yaml) 的 checked-in 配置明确为 Managed Session **false**、共享 demo-user create-only overlay、Caddy Basic Auth；最后一条经原部署日志验证的东京运行镜像为 `a211b5bfcfbed4ceadc942dff3df27bb5fc3327b`，不是人类 OIDC 登录证明。原 [#1344](https://github.com/jiangxng/EVO-App-Platform/pull/1344) regression 保留此 fail-closed 边界；旧 Railway 身份 Runbook 标记不可用于东京。
- 相关 Host 身份代码已有能力：`manager/server.ts`、`manager/authentication-flow.ts`、`manager/session-cookie.ts`、`providers/oidc/host-runtime.ts`；**存在代码并不等于**部署了可用 IdP、持久 Session、真实 Principal、经授权的企业和字段 grants。

## 2. 方案选择 / 采用与排除

| 路线 | 本次决定 | 理由与边界 |
| --- | --- | --- |
| **A 独立真实身份测试环境** | **采用为准备方向；NOT_APPROVED / NOT_PROVISIONED** | 能在不改变东京 shared-demo 入口的前提下独立审查 IdP、账号、最小 READ、撤权和真实设备；隔离强度、托管方案、费用仍须有权 Ops 决定 |
| B 将东京 preview 原地切换为真实身份 | **本次不采用** | 易混淆 Basic Auth / `demo-user` 与真实企业 Human，现有 Compose 的 Managed Session 关闭，缺经批准的切换/回滚 |
| 复制旧 Railway OIDC/client/secret 或仅切 Managed Session flag | **禁止** | 无法证明当前 Host Provider、Secrets、目录、HTTPS 回调、实际企业授权、撤权/回滚；不能以 mock 测试代替真实登录 |

**隔离预期（待审批，不是已实施）**：独立环境标识和可核实 runtime SHA；与东京 demo、生产客户分离的会话与应用持久状态、凭据、测试企业和脱敏数据；专用 HTTPS origin/经 IdP 登记的 callback；只授必要网络及人类 READ；不复用 preview demo-user overlay 或真实客户导出。独立 VPS 是否必要、预算与具体网域均由 Ops 决定，本文不强行指定供应商或费用。

## 3. 用户需要提供/指定的最小输入（禁止上传秘密）

| 编号 | 提供方/负责人（当前未指定） | 需要的**非敏感**决定或资源 | 进入下一关的有效证据 |
| --- | --- | --- | --- |
| I01 | 用户/有权 Identity Owner | 选定现有 OIDC Identity Provider（例如 Google Workspace/Cloud Identity、Microsoft Entra ID 或其他合规提供商）及管理员责任人；如无现成提供商，明确“尚无” | Provider 类型、管理责任方、允许的测试用途和正式审批位置；不得在公开 Issue 贴 client secret/token |
| I02 | Identity / Security / Ops | 正式批准独立测试环境用途、边界、Owner 和回滚责任；选宿主/环境别名、域名/TLS 策略、隔离方式与费用承担 | 有权审批人角色、日期、批准范围和受控记录链接；未批准即保持 BLOCKED |
| I03 | Identity / Ops | 现有 Host `IdentityAuthenticationProvider`、`IdentityUserDirectoryProvider` 与持久 Managed Session 的实际安装/绑定/健康；OIDC issuer、client registration、HTTPS redirect/callback、Secrets 存管方式；登出与撤权 | 不含秘密的环境+runtime SHA、Provider/Session 正常与撤权/回滚测试回执；**不是**单纯 CI/mock 或 Basic Auth 401 |
| B01 | Counterparty Domain Owner | 测试企业、合法最小 READ 授权：四路由及 `counterparty.field.read` 对 `status`；正常人类身份与另一合法受限身份/企业用于拒绝检查 | 真实授权决定/生效范围/可撤销性回执；不在 GitHub 公开账号 ID、个人资料或客户信息 |
| B02 | Counterparty Domain Owner / 数据负责人 | 不含个人及真实商业机密的 ACTIVE/INACTIVE 示例、可测试关键词、当前页 CSV/空结果及有权责任范围 | 数据来源/脱敏批准、覆盖范围和测试环境数据存在性回执；不可从生产复制客户资料 |
| H01 | Human 测试协调人 | 真人测试者；实体桌面键盘；实体手机及系统/浏览器；若声称手机外接键盘覆盖则提供真外设；NVDA/VoiceOver 与运行设备/浏览器 | 设备/软件版本与具名角色的受控测试安排；不得用 Chromium 390px 模拟替代 |
| H02 | 独立 Human/Domain Reviewer | 与执行测试者相互独立的有权审核人，以及批准的**受控脱敏证据库** | 审核责任/证据保全规则/可访问受控链接、签署方式；不得预先签 PASS |

责任人未指定时，不自动填用户名、邮箱或权限。可由同一项目负责人**协调**上述角色，但最终 Human 独立审核必须与执行人分离；权限准入必须由真正有权的 Identity/Domain Owner 完成。

## 4. 有权 Owner 的准入 Gate（本轮一律未完成）

1. **G0 决策已发生**：方案 A 为原则性准备方向；不会改变东京或生产。**仅 G0 成立。**
2. **G1 Identity/Security/Ops 批准**：有实际授权的责任人确定隔离测试环境、域名、Provider、Secrets、Session 持久化与回滚，并明确允许部署/测试的范围；**未批准**。
3. **G2 环境实际可证**：由 Ops 在隔离环境按**准确 runtime SHA**核实 HTTPS/callback、OIDC 登录、Session 持久/注销/撤权、登出后不能复用旧会话、无 demo Principal fallback、审计/隔离与回滚；**未实施、未验证**。
4. **G3 Domain Owner 最小授权**：测试人类账号真实 READ 四个路由和 status；独立受限账号/企业可复现拒绝；脱敏测试数据合法；**未批准**。
5. **G4 Human 真实执行**：按现成 H01–H11，在 C1–C4 的实体键盘/实体手机/真实读屏 12 通道运行、记录 FAIL/NOT_RUN/BLOCKED/PASS、实际拒绝 H09、退出切换 H10；**0/12 已签收**。
6. **G5 独立 Human 审核**：审核人核对环境 SHA、设备/版本、遮挡的原始录像/CSV 安全界限、失败与受控证据签署；缺任一通道或反例不可结案。**未签收**。

任何具体实现或部署**不得**把本文件/方案选择视为 G1；如缺少输入即停在 #1343 的相应 BLOCKED，不创建假身份、假权限、假截图、假 Human 回执。

## 5. 停止条件、安全边界与接续位置

- 无新授权/真实失败时，不改现有 Eidos / Platform 的 status AND search、CSV、Workbench 焦点；不创建新的身份框架、登录按钮或临时跨域 SQL；不触碰并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184)。
- [CV03 Owner #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 与 [Operator #1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 仍 OPEN；CV03 `N1=NOT_CERTIFIED`、Human SAVE OFF；CV04 正式跨页后台 EXPORT OFF。CV02 进展不解除这些门禁。
- GitHub 公开 Issue/PR 只存**非敏感**批准摘要、环境别名、准确 SHA、时间、责任角色及受控证据 URL/hash。**不写密码、OIDC secrets、Session cookies、用户标识、企业详细 ID、客户 CSV 或未遮挡录像**。
- **恢复条件**：[#1343](https://github.com/jiangxng/EVO-App-Platform/issues/1343) 收到 I01–I03/B01–B02/H01–H02 的真实决定/资源，并可验证；或出现真实 Human FAIL。未来新增事实增量记录在本页或同目录关联文件，实际 Human 结果留在 #1343 与原 Window16 执行矩阵，不新建重复签收入口。

**本次结论**：`方案 A = PREPARATION_CHOSEN`；`identity = BLOCKED`；`business grants/data = BLOCKED`；`devices/reviewer = UNVERIFIED`；`Human = 0/12 / NOT_SIGNED`；`provisioning = NOT_STARTED`。
