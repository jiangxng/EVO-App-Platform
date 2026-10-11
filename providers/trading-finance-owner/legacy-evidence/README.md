# Finance Owner Provider：旧 Host 侧证据收敛及 EVO 权威分界

> **只保留 Provider 的非重复历史来源；不启用已失效的测试。** `evo-trading-finance-owner-provider` 的正式声明在 `../package.ts`，本轮仍是 **PRODUCT_UNFINISHED / NOT_CERTIFIED**，不允许任何财务执行。五份旧 Host 侧验证代码以 `*.mjs.reference.txt` 保存为**不可运行的原始研究参考**，与旧文件 Blob 内容一致；它们的旧相对路径、临时 DB 依赖和运行前置条件不适用于当前仓库，不得作为 CI/生产通过的凭据。

## 已有 main；禁止重复恢复

- Host-side read-only 签名委托 / 租户及订单绑定：`apps/trading-reference/finance-owner-remote.ts`。
- Host-side 签名 key pointer fail-closed / fd/no-follow：`apps/trading-reference/finance-owner-key-pointer.ts`。
- Provider 独立 Package/Capability：`providers/trading-finance-owner/package.ts`；既有 F1 loopback CI 仅证实 Host 客户端协议。保留作为宿主到已安装 Provider 的连接边界，不让其成为 Ledger Owner。
- EVO **main** 已有 `modules/ledger`、`modules/allocation`、`modules/valuation` 及 `modules/valuation/infrastructure/postgres-trading-finance-fact-verifier.ts`。这些是经济事实/分配/估值/核验权威，Platform **不得重新带入**旧 `../evo/dist/` 版本、Postgres 账本计算、Replay 输入 digest、Finance Owner 验证器或第二个经济内核。
- EVO 原 `feat/tr01b2d3-finance-owner-auth-readonly-20261010` / Draft #108 是未合入 EVO main 的旧实验性 Listener，与 Platform Draft #594 并非自动受准入的系统；不能将旧 CI 结果宣称为现在的上线接口。

## 迁入这个独立 Provider 的原始 Host 侧材料

| 不激活的 .reference.txt | 来源原 Blob SHA | 原来验证的 Provider/Host 边界 |
| --- | --- | --- |
| `certify-tr01b2d3-host-hot-signing-key.mjs.reference.txt` | `b20b399a0c269a203e6da01cd6930b7e057f7541` | Host 密钥热切换、旧安装状态，非金融语义 |
| `certify-tr01b2d3-installed-host-session.mjs.reference.txt` | `dc12c03f00176f90c1d830bb806e5c59e5a26566` | 已安装 Provider + Managed Session 的旧 HTTP 证据 |
| `certify-tr01b2d3-host-https-identity.mjs.reference.txt` | `8e1f7a04d32f69a445480aee9bd8f066147ab1a7` | Host 本地 TLS/hostname 测试，不等于公网认证 |
| `create-tr01b2d3-installed-host-ci.mjs.reference.txt` | `91cb4ff7787106a7161025c3209237fca07c9365` | 旧安装/凭证/Session 预置，非上线配置 |
| `run-tr01b2d3-installed-host-ci.mjs.reference.txt` | `5cec331e9fc56379f332478de33b22dc72bf0b31` | 旧 Host 启停/缺失密钥负例 |

**不迁入激活插件**：跨 EVO 多进程 nonce、PostgreSQL LOGIN/GRANT、operator trust rotation、Replay digest、OIDC 实验 IdP、合成 Finance owner API 启动命令、六/十二层旧 CI workflow。这些旧源或属于 EVO 账本运行时/Finance Owner Listener 独立验证，或已由现行 Platform F1/F2/Provider 契约部分覆盖，或依赖不存在的旧目录；拷入正在运行的 Plugin 会制造第二套错误权威。旧来源与判定固定在 `docs/archive/TR01-20261012-LEGACY-BRANCH-RETIREMENT.md`。

不新增执行脚本，不改变 Provider install 状态，不启动新 Finance Owner 功能，也不触碰独立 EVO Runtime 分支。
