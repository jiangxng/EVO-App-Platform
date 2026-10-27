# EVO 东京验证环境：腾讯云 Lighthouse 独立部署

**状态：候选工程 / 未合并 / 未部署 / 未通过公网验收**（2026-10-27）。
本方案仅作用于新实例 `evo-dev-tokyo-01`（东京一区，`43.167.252.197`），不修改既有 Railway 项目、环境变量、数据库或持久卷。

## 0. 目标与当前边界

- 目标：GitHub 构建、测试及发布不可变 SHA 镜像；VPS 只运行 EVO Host、隔离 PostgreSQL、反向代理和持久化目录；本地电脑不必运行服务。
- 主源码：`jiangxng/EVO-App-Platform/main`，当前 Host `Dockerfile` + `PORT=4100`，`GET /health`。
- 仅演示/开发环境：不能因为页面能打开就宣布多 Worker、PA05 全域、Human UI 或生产身份认证完成。
- **首次仅手动发布**：工作流 `EVO Tokyo Dev - Verified Manual Release` 必须在 `main` 调用，内部重新运行平台验证。为防止在全量门禁仍有失败时自动上线，自动触发延后到首轮真实验收。
- 不能直接以裸 IP 做 Google OAuth 回调；暂不启用外部 OAuth/MCP。使用不需购买的 IP 衍生域名 `evo.43.167.252.197.sslip.io` 实现公共 CA HTTPS，裸 IP HTTP 仅 302 重定向到该 HTTPS 地址。依赖 sslip.io DNS 和公网 ACME 可用，需实际验证。
- 预览所有业务入口由 Caddy Basic Auth 保护（`/health` 除外），不要在尚未通过身份/安全验收的环境导入真实客户数据或生产凭据。

## 1. GitHub Environment（用户已创建）

`https://github.com/jiangxng/EVO-App-Platform/settings/environments`

- 名称：`evo-tokyo-dev`
- Deployment branches and tags：Selected branches and tags，只允许 `main`
- 其他 protection rules：按所有者政策；可取消 *Allow administrators to bypass configured protection rules*
- 下述 Secrets 仅进入 **Environment secrets**，不写入仓库、不发聊天：
  - `EVO_TOKYO_SSH_PRIVATE_KEY`：单独的 `evo-deploy` 登录私钥（Ed25519，不能是腾讯云控制台管理密钥）。
  - `EVO_TOKYO_SSH_KNOWN_HOSTS`：从实例控制台读取并验证的真实 SSH 主机公钥，完整格式 `43.167.252.197 ssh-ed25519 AAAA...`。
- 无需在 GitHub 配置 PostgreSQL 密码；由 VPS 生成并存储于 `/opt/evo-tokyo/.env`。镜像拉取时由 Actions 临时使用当次 GITHUB_TOKEN，不另发长期 GHCR PAT。

## 2. 一次性 VPS 初始化（须在部署工程合并到 main 后才执行）

先合并经审查通过的部署 PR，取得**确切 40 位 main commit SHA**。从可信 GitHub 页面检查 `deploy/tencent-tokyo/bootstrap.sh` 原文，使用腾讯云控制台 **浏览器终端** 执行：

```bash
# 将下面的 <MERGED_COMMIT_SHA> 换成刚确认的 40 位 commit SHA
curl -fsSL "https://raw.githubusercontent.com/jiangxng/EVO-App-Platform/<MERGED_COMMIT_SHA>/deploy/tencent-tokyo/bootstrap.sh" -o /tmp/evo-tokyo-bootstrap.sh
sudo env EVO_DEPLOY_REF="<MERGED_COMMIT_SHA>" bash /tmp/evo-tokyo-bootstrap.sh
```

这个脚本仅对新 VPS 执行：通过 Ubuntu apt 安装 Docker 与 Compose、建立专用 `evo-deploy` 用户、`/opt/evo-tokyo`、随机生成 PostgreSQL 密码、带 Basic Auth 的 Caddy 配置与用于 Actions 的单独 SSH Ed25519 登录密钥。**不自动启动 EVO**，不迁移/删除 Railway 数据。注意 Docker 组实际具备 root 级能力，部署用户只能由受信赖的仓库 main workflow 使用。

脚本首次输出一次性 Basic Auth 预览密码，保存到自己的密码管理器；不要发到聊天。再次运行不会覆盖现有数据库口令或 Caddy 验证密码。

复制 VPS 输出的完整 ED25519 主机公钥到 `EVO_TOKYO_SSH_KNOWN_HOSTS`。在腾讯云浏览器终端运行 `sudo cat /root/evo-tokyo-dev-actions`，**只将完整私钥粘贴到 GitHub Environment Secret `EVO_TOKYO_SSH_PRIVATE_KEY`**，不要在聊天/PR 留言/截图暴露密钥；验证 Secret 已保存后，运行：

```bash
sudo rm -f /root/evo-tokyo-dev-actions /root/evo-tokyo-dev-actions.pub
```

腾讯云 Lighthouse 防火墙允许 TCP 22（SSH）、80（证书挑战和 HTTP→HTTPS）、443（HTTPS）；**不要对公网开放 TCP 4100 或 5432**。SSH 22 端口可按实际固定管理地址进一步收紧，但 GitHub Hosted Runner 的公网 IP 会变化；这里使用密钥与主机身份校验，并需后续考虑更严格的免 SSH/OIDC 拉取部署方式。

## 3. 首次受控部署

在 GitHub Actions 中选择 `EVO Tokyo Dev - Verified Manual Release`，选择 `main` → `Run workflow`。

工作流会：
1. `npm ci && npm run test:platform`，平台校验不通过即停止，不会登录 VPS；
2. 使用 GitHub Hosted Runner 构建并推送 `ghcr.io/jiangxng/evo-app-platform:<main SHA>`；
3. 严格验证已保存在 Secrets 的 SSH 私钥和服务器 SSH 主机公钥，禁止盲目 `ssh-keyscan` 信任；
4. 以当次短期 GitHub 令牌登录 GHCR，在 VPS 拉取镜像、使用 Docker Compose 启动 EVO/PostgreSQL/Caddy；
5. 检查 `http://127.0.0.1:4100/health`，失败时尽力恢复旧镜像和原 `.env`。这**不是数据库迁移回滚**。

可检查：`https://evo.43.167.252.197.sslip.io/health`，预期 JSON 内含 `{"ok":true,"service":"evo-app-manager"}`。
其余页面需要 Caddy Basic Auth 的账号 `evo` 和一次性密码。不得在实际外网访问结果出现前宣称已部署。

## 4. 迁移与验收边界

- 第一期在腾讯云建立**全新隔离验证数据库**，不自动拷贝 Railway 生产历史数据、Secrets、业务组织 ID 或密钥。
- **既有 Railway 不变**。如果未来需要数据迁移，需先完成一致性备份、版本兼容、重放、数据校验和授权，再另行切流。
- 2 vCPU / 4 GB / 60 GB 适合精简运行评估；镜像、数据库和日志增长需监控。PostgreSQL 与 `/data` 都应异机备份，Compose volume 本身不是备份。
- 尚未证明公网 HTTPS、SSL、UI、真实 Google 登录或全部 5 项独立旧 Railway 服务都可在该 VPS 同时运行。其他三项目 EVO/Eidos/EC 的单独仓库/服务不能直接假定已包含在本仓库 Dockerfile 中。
- 精确 commit SHA 与 GitHub 工作流状态是发布依据。首次手动发布完成前，不开启自动 main 持续部署，不跳过现有安全/体验 CI、Human UI 门禁。

## 5. 固定验收状态

| 验收项目 | 当前状态 | 下一步 |
| --- | --- | --- |
| Lighthouse 实例及 OS | 已验证（用户终端） | 无需再购实例 |
| GitHub Environment | 已验证（用户截图） | 加入两项环境 Secret |
| Docker / Compose / 基础账户 | 未部署 | 合并 PR 后由浏览器终端一次初始化 |
| 隔离 PostgreSQL + EVO Host | 未部署 | 工作流受控首次发布 |
| HTTPS/IP 衍生域名与预览保护 | 未验证 | 公网 DNS/ACME/Basic Auth 实测 |
| GitHub Actions SHA 镜像与回滚 | 未验证 | 首次发布和失败恢复演练 |
| 自动 main 持续发布 | 暂未启用（安全门禁） | 首次受控发布合格后设计触发关系 |
| Railway 数据保护 | 原平台未修改 | 保留；迁移单独授权 |
| 腾讯云验证环境整体 | 未完成 | 以上验收完成后明确标记 DEPLOYED，而非仅 CI PASS |

## 6. 换窗口交接

开始于 `main@9e95a05de072cbd643d425022b7c1c9b5a400f06`。新的 GitHub 部署 owner 工作线只改 `deploy/tencent-tokyo/**`、`.github/workflows/evo-tokyo-dev-deploy.yml`、本 runbook，不动 PA05/BEX/Eidos/EC 产品代码、`project.status.json` 或其他窗口的 PR。没有已记录的同目标失败部署；当前阻塞是服务器授权、首次安装、真实 GitHub CI 和网络验收。失败时保持本 PR/服务器数据并只做定向排障，不盲目反复重建。
