# Railway 历史线上验收 Actions（2026-11-13 退役活动触发）

> **HISTORICAL_ACTIONS_NOT_EXECUTABLE**。这是从原 `.github/workflows/` 移出的 **10 份原始 YAML 原文**，未经改写；原始脚本 `tools/*.mjs` 仍留在仓库供后续重新设计真实验收用。每个旧 Workflow 都包含 2026-10 Railway Host 地址，不适合作为 2026-11-13 腾讯云东京的最新线上验证。**GitHub 不执行 `docs/archive/` 下的 Workflow。**

## 为什么退役

2026-11-13 直接读取 GitHub `main@e1c24f2355065de0f7f9fd0e482b1c2bd364acfe`：这些 Workflows 中有从 `push(main)` 自动运行的，也有 `pull_request` / 手动运行的，均把 `HOST` 写死为旧 `ledger-configurator-production.up.railway.app`。同日 Railway connector 对其 `EVO Ledger Runtime MVP / production` 返回五服务 **Offline**、无 Active Deployment，但历史配置/source/卷仍在；不能以当前离线状态替代永久已解绑认证。

腾讯云东京是 **DEV/PREVIEW**：Caddy Basic Auth + compatibility-local demo Principal 不是原 Railway 的 Human/Agent/OIDC 凭据。直接替换 `HOST` 并保留自动触发会将 401、错误 Principal 或另一套环境下的测试误判为跨云生产验收。本次明确选择从活动 Actions **撤销旧测试触发**，而不是让其“假通过”或改用明文/测试密钥绕过身份。

## 完整保留的原始十份工作流（原文件名）

- `.github/workflows/browser-lifecycle-production-proof.yml` → `browser-lifecycle-production-proof.yml`
- `.github/workflows/eog-mobile-read-production-proof.yml` → `eog-mobile-read-production-proof.yml`
- `.github/workflows/mobile-review-production-proof.yml` → `mobile-review-production-proof.yml`
- `.github/workflows/mobile-task-inbox-production-proof.yml` → `mobile-task-inbox-production-proof.yml`
- `.github/workflows/real-browser-rum-budget-proof.yml` → `real-browser-rum-budget-proof.yml`
- `.github/workflows/surface-production-browser-proof.yml` → `surface-production-browser-proof.yml`
- `.github/workflows/surface-scoped-loading-production-proof.yml` → `surface-scoped-loading-production-proof.yml`
- `.github/workflows/web-delivery-production-proof.yml` → `web-delivery-production-proof.yml`
- `.github/workflows/web-security-delivery-production-proof.yml` → `web-security-delivery-production-proof.yml`
- `.github/workflows/web-version-skew-rum-production-proof.yml` → `web-version-skew-rum-production-proof.yml`

## 旧脚本缺省 Host 收口（2026-11-13 后续工程修复）

为避免用户从命令行手动执行旧工具时不经意请求 Railway，七个保留的浏览器脚本已取消 `HOST` 的旧 Railway 默认地址；现在必须由调用者显式给出非空 `HOST`，缺失则在启动 Chrome 或网络访问之前 fail-closed。相关安全回归位于 `tests/protocol/legacy-railway-proof-host-opt-in.test.mjs`。**这不是东京自动化浏览器身份准入**：仅指定 URL 不能绕过 Basic Auth、替代真实 Principal 或声称旧生产证明在东京 PASS。归档在本目录的十份 YAML 原文仍保持完整 Git Blob 不变；测试其余行为待真实环境授权后重新验收。

## 恢复到腾讯云东京的独立准入（目前 NOT_ADMITTED）

未来若确有业务必要，先由实际 Identity/Host/Security/Ops Owner 提供已批准的**非生产**浏览器身份、最小授权的测试 Tenant/Principal、可保密的 Basic Auth / Session 处理、可撤权的 ephemeral 资源、实际 UI 网络 200/401 验收、明确的环境/部署 SHA/镜像、不会执行生产写入的证明；再从本目录选择需要保留的断言，以**独立、真实、可失败**的腾讯云东京 Workflow PR 恢复。**不能直接复制旧 Railway URL、历史 OAuth Redirect/Token 或 RAILPACK 证据**。

目前仍可用的现行腾讯云东京部署与健康/401 门禁：[主发布 Workflow](../../../.github/workflows/evo-tokyo-dev-deploy.yml)、[现行部署说明](../../operations/EVO-DEPLOYMENT-CURRENT-TENCENT-TOKYO-20261113.md)。它们**只证明部署和预览安全边界**，不取代本目录过去的十项专项业务/性能/浏览器证明。

正式 CV03 `N1=NOT_CERTIFIED`/SAVE OFF；CV04 后台 EXPORT OFF/未注册；#1212 五方真实 Owner 签署缺失，#1184 受管文件不得修改。本次归档没有触碰服务器、数据库、KMS、OAuth、CI-Gated 主部署工作流或上述正式安全开关。

## 资料核验

- **A · 2026-11-13 直接读取的当前源码：** 十份上列 Workflow YAML、`.github/workflows/evo-tokyo-dev-deploy.yml` 与现行腾讯东京 Compose。
- **B · 2026-11-13 已连接 Railway 只读 API：** `get_service_config` 仍返回 `EVO-App-Platform/main` 和 `EVO/main` 的 Source，EVO Runtime `preDeployCommand=["node dist/scripts/migrate.js"]`；无 Autodeploy 开关的确定当前值。Railway connector 不提供可公开固定原始 URL。
- **W · 2026-11-13 已查阅 Railway 官方原文：** [Controlling GitHub Autodeploys](https://docs.railway.com/deployments/github-autodeploys)、[Services / GitHub Source](https://docs.railway.com/services)。官方说明关联 GitHub 分支会自动部署，且可在 Service Settings 点 Disable；但**不能因此断言此帐户当前 Enabled**。
- 研究与判断详见 [CV04 决策索引 §26](../../plans/foundation-list-experience/CV04-WINDOW-20261112-POSTMERGE-0707-RESEARCH-DECISION-REFERENCE-INDEX.md)。
