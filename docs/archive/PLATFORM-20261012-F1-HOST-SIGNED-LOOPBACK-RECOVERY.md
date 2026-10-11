# Platform F1 — 原有 Host 签名委托的隔离网络回归

2026-10-12 · 限于 **F1/F2 的 Host-side transport**，不是 Finance Owner 真实 HTTP/DB 合同，也不是 Purchasing 的实现或人验。

## 原始证据与功能裁剪

- 已在 main 的 [finance-owner-remote.ts](https://github.com/jiangxng/EVO-App-Platform/blob/34f332ba96feaa9d19a6fd8615fb2e5de9b98e8d/apps/trading-reference/finance-owner-remote.ts) blob `85ebfd580143b9beaf72726050ca4c8a8c7fb0cb` 与 [#594 旧源](https://github.com/jiangxng/EVO-App-Platform/blob/1d6149bd05136d642e49aab5196d12ab243cbe4e/apps/trading-reference/finance-owner-remote.ts) blob 一致。无需还原旧 Host 实现。
- 历史 [trusted owner delegation rationale](https://github.com/jiangxng/EVO-App-Platform/blob/34f332ba96feaa9d19a6fd8615fb2e5de9b98e8d/docs/roadmap/TR01B2D3-TRUSTED-OWNER-DELEGATION-20261010.md) 确立 Host 单独签名、EVO owner 独立验证、nonce 与财务事实属于 EVO；[old installed Host CI](https://github.com/jiangxng/EVO-App-Platform/blob/34f332ba96feaa9d19a6fd8615fb2e5de9b98e8d/docs/roadmap/TR01B2D3-INSTALLED-HOST-MANAGED-SESSION-CI-20261010.md) 为固定历史证据，不直接升级认证等级。
- [EVO #108 Finance-only app](https://github.com/jiangxng/EVO/blob/a8c3b0dfca56ec207c095efb743e1f6e9493d6a0/apps/api/src/finance-owner-readonly-app.ts) 仍 **Draft only**；其独立 Listener 不存在于 EVO main。因此此测试采用显式**本地临时模拟 HTTP 接收端**，只验证 Host 真实网络发包与 Ed25519 签名，不返回/推断真实金融数据。

## 此微步新验证

新增 `tests/protocol/platform-f1-signed-owner-loopback-boundary.test.mjs`，在 Node 22 上启动真实 TCP loopback HTTP 服务器，实算 Ed25519 非对称签名，再验证：
- 精确 `alg=Ed25519`、`typ=evo-finance-delegation+jwt`、受限 audience/purpose、45 秒 exp、installation/actor/context/双租户/order/correlation，以及每次不同 jti。
- 客户端只发送 `{assertion}`，不单独传私钥、租户、主体字段；失效 installation、外租户、非可信 URL、非法 key、空 principal 等全部在网络请求前拒绝。
- 即使本地接收端返回 200，客户端仍拒绝 write-enabled、错误 finance verificationKind、错误 tenant/order、非空 reasonCodes 和不合法响应。
- 新协议测试自动进入 main 已有 `npm run test:platform` 的 `tests/protocol/**/*.test.mjs`，不新增旧 CI workflow。

**限制：** 这不是 EVO Runtime 服务、Finance Owner 独立 Listener、真实 OIDC/Managed Session、真实 Postgres nonce/Trust，也不检查经济事实的真实性。签名本身的成功不授予 Posting、CostRun 或 Allocation。生产 Finance Owner 部署认证、B2D4 和用户操作验收均为 NOT_CERTIFIED；executionAllowed=false。原 14 条历史 TR01 分支及 Draft #594/#108 保留。

## 后续

合并前待实时 CI SUCCESS；与 F2 disposable DB [#777](https://github.com/jiangxng/EVO-App-Platform/pull/777) 共同形成 Platform 原有 Host 侧隔离守卫，但**不可组合推断为跨进程真实 EVO owner 认证**。等 owner 公开正式只读契约后，再做独立进程+数据库+安装会话真实合约验收。

## 首次 CI 负例留痕

初版 head `c5ba387012473ac7075ceb9af4b8e23ee2d419f4` 的 [Platform CI #38155514269](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38155514269) 失败：808 个测试 PASS、1 FAIL；真实签名拒绝返回 `TR01B2D3_SIGNING_KEY_INVALID`，新测试错误预期为 `TR01B2D3_OWNER_SIGNING_KEY_INVALID`。生产代码未改、拒绝条件未放松；更新新测试预期后必须等待新的完整 CI，**不得将首次失败写成通过**。

复测 [Platform CI #38155633156](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38155633156) 仍为失败：新增测试中的另一个错误码前缀预期不符，实际为 `TR01B2D3_HOST_IDENTITY_INVALID`，误期待 `TR01B2D3_OWNER_HOST_IDENTITY_INVALID`。其他新增组通过；修订时同样仅改测试断言，生产代码不变。第三次 CI 须单独验证，不能声称以前两次红色运行通过。
