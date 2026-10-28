# EVO 东京验证环境｜窗口交接入口（2026-10-27）

> **先读此页，再读 [本窗口详细研究资料与决策参考索引](EVO-TOKYO-DEV-WINDOW-20261027-RESEARCH-REFERENCE-INDEX.md)，随后读 [腾讯云部署运行手册](EVO-TOKYO-DEV-DEPLOYMENT-20261027.md)。** 本页是专项时间点快照，不覆盖全局 `project.status.json` 和自动生成的 `docs/roadmap/HANDOFF-LATEST.md`；新窗口重新查询 GitHub Actions、实际 VPS 和公网地址，不能把本页当作无限期在线证明。

## 1. 原始目标、Owner 约束与边界

- 用户已购买腾讯云 Lighthouse **东京一区** Ubuntu 24.04.4 LTS VPS：实例名 `evo-dev-tokyo-01`、IP `43.167.252.197`、实例 ID `lhins-0pk1fw21`，此前提供的密钥 ID `lhkp-k8q9mdbf` **不是登录私钥**。
- 目标是用此 VPS **替换 EVO 验证环境的部署目的地**，尽量达到 Railway 式体验：ChatGPT 负责 GitHub/发布维护，日常无需 Codex、电脑持续开机或手工 Linux 运维；费用优先，先按月使用约 2 vCPU/4 GB/60 GB 的服务器。
- **不等于立即删除/转移 Railway**。Railway 多服务、PostgreSQL、持久卷、现有业务数据/凭据保持原样；新 VPS 先独立起 App Platform Host + PostgreSQL + Caddy，其他 EVO/Eidos/Experience Compiler 独立服务未证明迁移。
- 用户希望先用 IP，不购自有域名；部署入口暂用 `evo.43.167.252.197.sslip.io` 和 HTTPS（公网 DNS、证书及认证尚待真实验收）。Google 登录不因容器运行而自动可用；首次部署外部 OAuth/MCP 默认 OFF。
- 安全及协同约束：独立分支/PR、按 exact HEAD CI 合并；不直接 push `main`、不修改 PA05/BEX/Eidos/EC owner 文件、不取回/打印 Secrets、不开放公网 Postgres 5432 或 Host 4100；不宣称 PA05 生产 WRITE、Google OIDC 或 Human UI 已签收。

## 2. 本窗口已确定并真正落地的方案

**GitHub Actions（`main` 手动 `workflow_dispatch`）→ GitHub 构建不可变 SHA 镜像、测试、GHCR → 精确 SSH host-key 和独立 `evo-deploy` 身份 → 东京 Ubuntu Docker Compose（EVO + PostgreSQL17 + Caddy）**。

- GitHub Environment `evo-tokyo-dev`：用户截图证明已创建、Selected branches and tags 仅 `main`；两项 Secrets `EVO_TOKYO_SSH_PRIVATE_KEY` 与 `EVO_TOKYO_SSH_KNOWN_HOSTS` 在第三次部署已真实通过，**不应重复要求用户重建密钥**。
- 服务配置：Host `PORT=4100`，绑定公网之外的 `127.0.0.1:4100`；DB 在容器私网；`/data` 和 PG 独立 Docker 持久卷；Caddy 80/443、预览 Basic Auth；Caddy 依赖真正 HTTP 健康的 EVO。
- 首次自动部署 **尚未启用**：工作流目前是手动发布；先完成公网/实际业务/持久化及恢复验证，再由独立受控变更启用 CI-gated `main` 自动发布。
- 本窗口失败止损演进：先修 Secret 主机公钥格式，再将 SSH 前置自检；最后给 EVO 增加真实容器内 HTTP 健康探针与首次部署无 `pending` 镜像时的安全回退。
- VPS 首次初始化和部署授权已由历史实测推断成功（SSH 远端预检通过、Docker 已启动）；**无腾讯云管理 API/交互终端连接**，不能声称本聊天直接登录过服务器。

## 3. 已合并的精确代码和真实运行证据

| 时点 | PR / main 真实 SHA | 结果／不得重做 |
| --- | --- | --- |
| 初始腾讯云部署工程 | [#1115](https://github.com/jiangxng/EVO-App-Platform/pull/1115) → `737df25b14a96f8ddd8a1c1ca81103cccf90f7b4` | **MERGED**；Docker Compose、bootstrap、Caddy、手动部署 workflow、runbook |
| SSH 早期诊断缺口 | [run #40456198877](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40456198877) | 测试/镜像成功，SSH Secret 检查错误；旧脚本未分辨是 host key 还是 private key |
| SSH 自检与 Runner 升级 | [#1116](https://github.com/jiangxng/EVO-App-Platform/pull/1116) → `a8de4336f685442ed754c70d8ffa95799849dbd1` | **MERGED**；SSH 前置具体错误码、固定 ubuntu-24.04、Node24 兼容 GitHub Actions |
| 明确 host-key 错误 | [run #40458456896](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40458456896) | `EVO_TOKYO_HOST_KEY_INVALID`；用户确认曾删除 `43.167.252.197 ssh-ed25519` 前缀，后已修正 |
| 首次远端起容器失败 | [run #40459162831](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40459162831) | SSH/测试/镜像/scp/远端 Docker 登录成功；新 PG 健康，EVO localhost `curl (56)` reset；旧回滚错误拉取 `:pending`，**未完成发布** |
| HTTP 健康 + 回退修复 | [#1117](https://github.com/jiangxng/EVO-App-Platform/pull/1117) → `7b95c3b70d947c83476e9ca966c3252ade96e384` | **MERGED**；真实 `GET /health` Docker 探针、有界等待重试、仅对历史成功 SHA 回退 |
| **首次本地健康部署成功** | [run #40460609744](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40460609744)，`main@7b95c3b70d947c83476e9ca966c3252ade96e384` | **SUCCESS**；日志有 `EVO_TOKYO_SSH_SECRET_FORMAT_PASS`、`EVO_TOKYO_REMOTE_PREFLIGHT_PASS`、`{"ok":true,"service":"evo-app-manager"}`、`EVO_TOKYO_DEV_LOCAL_HEALTH_PASS`。仅证明 GitHub→VPS 和服务器本地 HTTP，**未证明公网可访问**。 |

## 4. 固定验收状态（本窗口收尾事实）

| 验收项目 | 当前状态 | 下一步 |
| --- | --- | --- |
| Lighthouse 基础规格及 OS | **已验证**（用户终端） | 无需重新采购/安装系统 |
| GitHub Environment + SSH 身份 | **已验证**（GitHub 流水线） | 保留 Secrets，不粘贴聊天 |
| GHCR 镜像与独立 PG/EVO/Caddy | **已部署且本地健康通过**（run #40460609744） | 记录并核对持续运行状态 |
| EVO Host `/health` 本地 | **已验证**：HTTP 200 JSON | 下一步公网 HTTPS |
| 公网 DNS / TLS / Caddy Basic Auth | **待验收**；本窗口外部网页读取工具打不开 HTTPS 健康地址，**不能据此断言真实公网故障** | 从实际浏览器 + TLS/路由验证；核对 80/443 防火墙、Caddy 日志 |
| 页面真实功能、Google 登录、原 V3 高保真 | **未验收/当前 OAuth 默认关闭** | 明确验证范围、域名/OIDC 条件及 Human 签收 |
| 重启持久化、备份、可用旧 SHA 的真实回退 | **未验收** | 非破坏性检查和恢复演练；不得直接删除卷 |
| 自动 `main` 发布 | **未启用** | 首次访问与 CI/回退验收后单独 PR |
| Railway 原环境与数据 | **本专项未修改** | 保留，迁移需独立授权与备份 |
| **腾讯云验证环境整体** | **本地发布成功；公网与业务级迁移仍 OPEN** | 优先完成公网访问，再决定是否切换验证入口 |

## 5. 新窗口第一轮动作（不要从旧错误重新开始）

1. 从本专项入口及详细索引读取真实来源；`git/main` 实际提交、Workflow 最新 run、VPS HTTP、Caddy HTTPS 均**重新只读核查**，尤其不得把 run #40459162831 当作最后一次部署。
2. 优先查新公网 `https://evo.43.167.252.197.sslip.io/health` 和 Basic Auth 页面；本窗口一次外部网页工具尝试返回 `URL ... is not accessible via this tool`，这只是工具能力边界，**不是公网证书/防火墙失败实证**。如不能直连 VPS，通过新的最小诊断 GitHub workflow/受信工具取得脱敏 Caddy 状态，不打印 Secrets。
3. 对照 `docker compose ps`、真 HTTP、Caddy 证书、文件/PG 数据卷与最小页面流程分层验收，禁止先删除 Railway 或扩大到未授权业务数据迁移。
4. 确认成功后再设计自动发布（main required CI 门禁、可控失败恢复、GHCR SHA 管理、备份策略）；只在**本专项 owner** 分支/PR 改配置。
5. 全局产品交接仍按 `AI-BOOTSTRAP.md` → `project.status.json` → `docs/roadmap/HANDOFF-LATEST.md`，本专项手册不得替代其它线的认证 authority。

## 6. 资料去向及记录级别

- **已读 GitHub 原始来源**：PR #1115/#1116/#1117 元数据和变更、原始 Actions 三次失败与一次成功的关键日志、仓库 `Dockerfile`、`manager/server.ts` 相关段落、`deploy/tencent-tokyo/**`、部署 workflow、Runbook、工作流治理原文；具体 URL、查阅等级和关键摘录见详细索引。
- **只在历史文档中看到链接/摘要、尚未读外部官网**：2026-10 GitHub Node20 弃用及 Runner Ubuntu26 提示原始链接、Railway 安全披露文章。不得虚称本窗口直接阅读它们。
- **本聊天附件而非 GitHub 仓库文件**：用户创建 `evo-tokyo-dev` 的 Environment 设置截图 `image(20261027-050549).png`，附件 ID `file_0000000072288209b0c7af58dd88c176`；后续窗口不保证能直接读取，必要时让用户重新提供**不含 Secrets 的截图**。Ubuntu 资源输出保留在详细索引。
- 完整材料列表与未验证问题：见 [详细参考索引](EVO-TOKYO-DEV-WINDOW-20261027-RESEARCH-REFERENCE-INDEX.md)。

## 最新接续更新（2026-10-28，覆盖上方旧公网失败快照）

- 线上实际 SHA：`35baedcad147dde9403d7bc26e2ca9734e906f5a`，GitHub [EVO Tokyo deployment #40620148375](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40620148375) **SUCCESS**。SSH/Docker 及平台测试、镜像、VPS 本地真实 HTTP `/health`、公网严格 HTTPS `/health` 及未认证根目录 HTTP401 全部 PASS；不要再沿用此前“公网 443 失败”作为当前状态。
- 已合并功能：[PR #1120](https://github.com/jiangxng/EVO-App-Platform/pull/1120) 处理应用无企业时空白提示及冗余 Workspace 按钮；[PR #1121](https://github.com/jiangxng/EVO-App-Platform/pull/1121) 消除设置页硬编码四组及 `SETTINGS_GROUP`。通过 [PR #1122](https://github.com/jiangxng/EVO-App-Platform/pull/1122) 单次触发东京更新。
- 后续发布治理：[PR #1123](https://github.com/jiangxng/EVO-App-Platform/pull/1123)（状态请刷新）关闭一次性 push 触发，恢复 manual-only；详情及 exact evidence 在 [发布结果文档](https://github.com/jiangxng/EVO-App-Platform/blob/chore/evo-tokyo-restore-manual-only-20261028/docs/runbooks/EVO-TOKYO-DEV-RELEASE-RESULT-20261028.md)。
- **未关闭**：浏览器真实页面与 Human 验收、数据持久化/异地备份/回滚演练。Railway 与数据保持不变，不需重新配置 Secrets/Known Hosts 或 Docker。
