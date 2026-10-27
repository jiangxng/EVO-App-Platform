# EVO 东京验证环境：腾讯云 Lighthouse 独立部署

**当前状态：GitHub→腾讯云本地首次部署与真 HTTP 健康检查 SUCCESS；公网 HTTPS / Basic Auth / 业务体验 / 自动 main 发布仍待验收**（2026-10-27；[真实运行 #40460609744](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40460609744)，发布 SHA `7b95c3b70d947c83476e9ca966c3252ade96e384`）。历史故障详见 §§6–7。

> **新窗口先读**：[本窗口简短交接入口](EVO-TOKYO-DEV-WINDOW-20261027-HANDOFF-ENTRY.md) → [研究资料和决策参考索引](EVO-TOKYO-DEV-WINDOW-20261027-RESEARCH-REFERENCE-INDEX.md)。这两份专项文档保留准确来源等级、所有 PR/Actions 精确 SHA、资料冲突和剩余公网验收，不替代全局 `project.status.json`。

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

## 6. 首次真实部署失败的定位与防重复（2026-10-27）

- 初始部署工程 PR [#1115](https://github.com/jiangxng/EVO-App-Platform/pull/1115) 已合并到 `main@737df25b14a96f8ddd8a1c1ca81103cccf90f7b4`，不能继续按首版文档将其描述为未合并。
- 首次 workflow_dispatch [#40456198877](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40456198877) 的 `npm ci && npm run test:platform` 及 GHCR 镜像构建/推送均成功；第 8 步 `Configure pinned SSH host identity and deployment key` 退出码 1，尚未发生 `scp`、远端 `docker login` 或 `docker compose up`。
- 日志表明两项 GitHub Secrets 均 **非空**，旧脚本在 `ssh-keygen -F` 与 `ssh-keygen -y` 间没有有界失败信息，**不能据此认定具体哪把密钥错误**。Node.js 20 弃用、Ubuntu 26 迁移提示都不是该次失败原因。
- 修复：改为 **先校验 SSH Secret 格式 → 服务器 SSH/Docker 只读预检 → 通过才跑平台测试、构建和部署**；首个真正失败点有以下不泄露秘密的诊断码：
  - `EVO_TOKYO_HOST_KEY_INVALID`：检查 `EVO_TOKYO_SSH_KNOWN_HOSTS` 是完整主机公钥记录，开头是 `43.167.252.197 ssh-ed25519 `，不是腾讯云密钥 ID、SSH 指纹或私钥。
  - `EVO_TOKYO_PRIVATE_KEY_INVALID`：检查 `EVO_TOKYO_SSH_PRIVATE_KEY` 是多行、未加密的私钥全文，不是 `.pub` 文件或腾讯云控制台密钥 ID。
  - `EVO_TOKYO_REMOTE_PREFLIGHT_FAILED`：Secret 格式有效，但 SSH 防火墙、账号授权、主机身份、Docker Compose 或一次性初始化未准备好；看其上方 SSH 错误，**不打印 Secret**。
- 仅在修复 PR 合并 `main` 后重新手动触发一次，不能在原旧 workflow 上反复 rerun。失败时只纠正对应 GitHub Environment Secret 或 VPS 初始化项，其他项保持不变。
- 工作流使用固定 `ubuntu-24.04` Runner 与 Node24 兼容的官方 Actions，**Node 应用运行时仍保持 `22.22.2`**，不借部署诊断升级业务工具链。
- 此次失败前成功推送的镜像仅代表 GitHub 镜像构建成功，**不代表腾讯云验证环境已部署**；Railway 原环境保持不变。

## 7. 本次真实启动故障：首次 Docker 启动的 HTTP 验证与回退（2026-10-27）

- [Actions run #40459162831](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40459162831)，精确 `main@a8de4336f685442ed754c70d8ffa95799849dbd1`：SSH 两项 Secret 与服务器预检、`npm run test:platform`、GHCR 镜像构建、`scp`、远端 Docker 登录全部 **PASS**。
- Docker 创建独立 `evo-tokyo-dev_internal` 网络与四个新 volume；PostgreSQL、EVO、Caddy 容器都显示 `Started/Healthy`；**旧 Compose 只给 PG 设置了真正的探针，EVO/Caddy 的 Docker "Healthy" 不构成 Web 成功实证**。
- 本地 HTTP 检查立即报 `curl (56) Recv failure: Connection reset by peer`；原因尚不能确定，可能 Node 未就绪或进程退出，当前没有 Host 启动日志/容器内部探针证据；不得直接判定某一业务错误。
- 旧回滚用 `.env.rollback` 中的首次 `EVO_IMAGE=...:pending`，试图拉取不存在的占位镜像，造成第二次错误；且不能宣称 `PREVIOUS_IMAGE_RESTORED` 已成功。
- 改动：给 EVO 添加真正的容器内部 `GET /health` 探针，Caddy 待 EVO healthy 才启动；远端 Compose 等 HTTP 就绪，Host curl 对临时 TCP reset 进行有界重试；出错时只打印容器状态/退出码（不打印环境变量和凭据）。只有曾通过本地健康检查、写入 `.last-health-pass-sha` 的历史 SHA 才能回退。首次失败保留当前 image/卷供排障，**不回到 `pending`**。
- 首次修复后的 Runner 若仍因真实 Host unhealthy 而超时，需要额外核实经脱敏的 `docker compose logs evo` 与 `docker inspect ... State`，不要靠重新安装 Docker 或更换私钥解决。只在新 PR 合并 `main` 后调用 **新的** `workflow_dispatch`；不要 rerun 旧 Actions。
- 当前已知：镜像在腾讯云被拉取并初步运行；**尚无有效 /health 200 的外网/主机证据、未完成发布验收**。Railway 原项目、数据卷和 Secrets 未改。

## 8. 最新真实部署成功与未关闭门禁（2026-10-27）

- **最新主线发布成功**：[Actions run #40460609744](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40460609744)，event `workflow_dispatch`，`main@7b95c3b70d947c83476e9ca966c3252ade96e384`，Job `deploy` 结论 **SUCCESS**（约 2026-10-27 06:23:38 UTC）。
- GitHub 原始日志显示 `EVO_TOKYO_SSH_SECRET_FORMAT_PASS`、`EVO_TOKYO_REMOTE_PREFLIGHT_PASS`、Docker Compose 的 PostgreSQL/EVO/Caddy `Healthy`；服务器本地请求真响应 `{"ok":true,"service":"evo-app-manager"}`，随后 `EVO_TOKYO_DEV_LOCAL_HEALTH_PASS sha=7b95c3b70d947c83476e9ca966c3252ade96e384`。这一次**已真正成功执行在 VPS**，不再停留在“仅 PR 合并”。
- 仍是验证环境**首次本地 HTTP 通过**，而非公网 HTTPS/Basic Auth/Google 登录/持久化重启与备份/完整 V3/PA05 签收。网页读取工具访问 `https://evo.43.167.252.197.sslip.io/health` 返回工具不可访问，不是 HTTP status 失败证据；下一步应由真实浏览器或安全的公网 HTTP/TLS 检查验证。
- 先验收公网健康和预览登录，再检查实际页面/DB 持久化、备份与有历史成功 SHA 的真实回滚。通过之后才设计强制 CI 门禁后的自动 `main` 部署；当前流程仍须手动 workflow_dispatch。避免再让用户重建 SSH Key、重装 Docker、删除 PostgreSQL 卷或误用先前 `:pending`。
- 逐项原始网址、查阅等级、先前失败和采用/排除方案：见 [本窗口研究索引](EVO-TOKYO-DEV-WINDOW-20261027-RESEARCH-REFERENCE-INDEX.md)。

## 9. 历史初始窗口交接（最初部署规划快照，不代表当前状态）

开始于 `main@9e95a05de072cbd643d425022b7c1c9b5a400f06`。新的 GitHub 部署 owner 工作线只改 `deploy/tencent-tokyo/**`、`.github/workflows/evo-tokyo-dev-deploy.yml`、本 runbook，不动 PA05/BEX/Eidos/EC 产品代码、`project.status.json` 或其他窗口的 PR。没有已记录的同目标失败部署；当前阻塞是服务器授权、首次安装、真实 GitHub CI 和网络验收。失败时保持本 PR/服务器数据并只做定向排障，不盲目反复重建。


## 10. 新窗口公网 443 真失败与最小修复门禁（增量 2026-10-27）

> 此节为原始运行日志补录，不改写上文历史故障及 VPS-local SUCCESS。证据详情、官方文档、来源等级和后续账本见 [PR #1119 中的公网验收记录](https://github.com/jiangxng/EVO-App-Platform/blob/fix/evo-tokyo-public-entry-gate-20261027/docs/runbooks/EVO-TOKYO-DEV-PUBLIC-ACCEPTANCE-20261027.md)，本窗口详索引已增记原始 URL。

- **新的 GitHub-hosted Runner 事实**：[run #40463405902](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40463405902) 经公网查证，DNS A 正确指向 43.167.252.197，原始 IP HTTP80 返回 302 正常跳转，但 **TCP 443 连接超时**；正常 DNS 与强制指定 IP 的 HTTPS /health，以及 HTTPS 根路径均 curl (28) / HTTP000。因此目前仍**不能验证证书和 Basic Auth**，也没有通过真正公网验收。
- **最优先定向排查**：腾讯云官方 [2026-08-25 防火墙应用案例](https://cloud.tencent.com.cn/document/product/1207/136745) 指出 Linux Lighthouse 默认放通 22、80、ICMP，不包括 443；实际实例防火墙规则尚未读取。先查东京实例 TCP443 ingress，若确实缺失，按 [腾讯云实例防火墙官方指南](https://cloud.tencent.com/document/product/1207/44577) 最小增加 ALLOW TCP443（需要公网预览时来源为 0.0.0.0/0）；不得替换整套规则、开放 4100/5432、重建 SSH/Docker 或删除卷。若已有 443 允许规则但仍超时，再只读检查 VPS OS firewall/443 listener/Caddy 状态。
- **修复后独立验收**：公网 DNS PASS、TCP443 PASS、严格 TLS /health 200 正确 JSON、根路径未认证 401、原 IP 80 仍 302，记录 exact SHA 和 Actions 链接。然后才依次完成非破坏性持久化、异机备份/恢复、旧 good SHA 回滚、Human 页面签收；自动 main 发布必须作为独立 PR 并遵守 required CI，不提前启用。
- **权限限制**：此会话只持有 GitHub 连接，没有直接操作腾讯 Lighthouse 防火墙或 VPS 的可信远程写入工具；当前没有声称已放通 443、签发证书、登录页面。原 Railway 与数据没有变更。
