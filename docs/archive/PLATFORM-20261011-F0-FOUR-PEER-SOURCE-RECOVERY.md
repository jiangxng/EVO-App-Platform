# F0 旧四应用源码功能回收 — 第一批可复核证据

> 2026-10-11；本文件属于 Platform F0–F4 收敛材料。**仅审计和提取四个演示插件的非经济断言**，不表示 Finance Owner 准入、Runtime 业务调用或用户验收通过。不修改全局状态，不删除旧分支。

## 位置与固定事实

- 交接总入口：`docs/roadmap/PLATFORM-20261011-WINDOW-HANDOFF-ENTRY.md`（Draft [#771](https://github.com/jiangxng/EVO-App-Platform/pull/771)，独立分支）。
- 现代 main 审计基线：`db3fd2d53c7a28fcc2ba438e67ac54ceae0f3438`；GitHub compare 对 F0 两个旧分支均报告 diverged；**compare 的 added 标记与旧共同祖先有关，不得据此认定新版缺失对应代码**。
- 旧 F0 源：[four peer](https://github.com/jiangxng/EVO-App-Platform/blob/fb3db99272ef047aa7686715fd495545f9342ccf/tests/protocol/tr01b2d3-four-peer-stage-plugins.test.mjs)，source commit `fb3db99272ef047aa7686715fd495545f9342ccf`，旧测试 160 行；[purchasing / receiving](https://github.com/jiangxng/EVO-App-Platform/tree/7e23173250a23aa396555fed77a1470ebd099708)，source commit `7e23173250a23aa396555fed77a1470ebd099708`。
- 现有 main 已有 `tests/protocol/tr01-trading-peer-purchasing-receiving.test.mjs`、`tr01-six-stage-host-preview.test.mjs`，且六个 stage package 都存在；复读原文，不以文件名推断完成功能。

## F0 功能级采用/排除

| 历史功能 | 主线已有证据 | 本轮处置 |
| --- | --- | --- |
| 六个 Application 包的独立 manifest、read-only capability | main 两个协议测试已经检查 package、安装、预览开关 | **已吸收，不复制六个旧源码与旧 CI** |
| sales/shipment/receivable/cash 四个插件单独 Eidos 渲染 | 旧四包测试逐一渲染；现代六包 smoke 未逐一渲染后四包 | **提取**到 `tests/protocol/platform-f0-four-peer-source-recovery.test.mjs` |
| 停用 Shipment 不得让另外三个已安装插件消失 | 旧四包测试有独立拒绝/激活断言；现代 smoke 仅验证单个禁用和卸载 | **提取**，包括卸载 Sales 不影响其他三个 |
| 各旧 Stage 的 `DEMO-*` 对象、下一步 navigation | modern six peer manifests 已存在 synthetic 内容，业务链事件名存在已知不一致 | **保留为 DEMO，不推广为正式 BusinessData / PostingRule** |
| 旧 `manager/server.ts`、`catalog/seed.ts` 的硬编码和旧 Host Core | 与现代 main 同路径文件均存在实质版本差异；main 已有受管 package-owned preview | **拒绝整文件回灌**；继续主线 Host 授权边界 |
| 旧四应用 workflow `tr01b2d3-four-peer-stage.yml` | 当前测试纳入 `npm run test:platform` / `node --test tests/protocol/**/*.test.mjs` | **暂不搬运重复 workflow**；看当前小 PR CI 后再决定是否需要独立 job |

**此 PR 的预期验证：** Node 22 + TypeScript build 后跑新测试，完整 Platform CI 不得有回归。CI 未返回结果前标注 `CODE_PRESENT`，不得标注 `CI_PROVEN`。

## F1/F2/F3/F4 继续保留的审计缺口

- F1：Platform [#594](https://github.com/jiangxng/EVO-App-Platform/pull/594) 与 EVO [#108](https://github.com/jiangxng/EVO/pull/108) 仍为 Draft，不能整并；身份签名与经济语义权威必须分层。
- F2：`tools/certify-tr01b2d3-distinct-db-logins.mjs` 旧三版已经逐版取源码：V1 blob `79f998e4`（321 行，额外 strict owner catalog 预检）、V2 `e18eb2ce`（309 行，finance-only listener + 写接口 404）、V3 `56b0a439`（287 行，完整 EVO API 进程）；V1 和 V2 可合并的安全断言要在现代隔离测试中独立重建。三个版本全部依赖 `../evo/` 构建和 Draft Finance Owner，不可直接复制到当前 main 或把其旧 PASS 认作今天的真实 PostgreSQL 认证。
- F3：`demos/tr01b2d3-isolated-stage` 只为浏览器模拟签名、nonce、拒绝写入；存固定 SHA 作研究，**不导入业务应用或部署**。
- F4：六/十二门禁主线已有 `tests/protocol/tr01b2d3-{six,twelve}-lane-admission.test.mjs`；历史 workflow 不按名称批量恢复，需审查是否有当前 CI 未覆盖的真实网络/数据库断言。

## 当前边界和后续条件

14 条 TR-01/B2D3 原始 branch 保留，特别是 Draft #594 原 head。完成 F0 的小测试并经 CI 后，再逐一处理 F1/F2/F4 的非重复安全资产和门禁；没有安全的来源对照与新的测试证据，**不删任何旧 ref**。单应用 Purchasing 实现必须等全部历史 F 包功能级收敛完成；后续一应用一小 PR、真实 EVO BusinessData/Ledger/Work、Railway 固定 SHA、用户签收后才允许 Receiving。

## F0 首次 CI 实际证据（代码 head 已核对）

- 本 PR 初始 head `3f3fe7320b0de47c7e81eaadac84b110d4321824`；[Platform CI run 38153195737](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38153195737) **SUCCESS**，包含 build 与 protocol tests；[Project Continuity run 38153195746](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38153195746) **SUCCESS**。这两项针对该固定 SHA，不将 GitHub 合并状态或浏览器用户签收据此推为 PASS。
- 本次仅在以上 CI 之后追加证据文字；如 PR head 被更新，应核对新 head 的 CI 再合入。

## F2 原始 12 脚本依赖清册（2026-10-11 实际读取源码，未执行）

均从旧 [Finance Host Draft 固定 commit](https://github.com/jiangxng/EVO-App-Platform/tree/1d6149bd05136d642e49aab5196d12ab243cbe4e/tools) 的源码读取；这不是“运行通过”的声明。按依赖分层，为后续小 PR 提供逐项选择的依据：

| 旧源文件 | 实际原文行数 | 明确依赖和待采纳断言 | 当前审查结论 |
| --- | ---: | --- | --- |
| `certify-tr01b2d3-cross-instance-races.mjs` | 289 | `../evo/dist/`、PostgreSQL；同 nonce 多进程竞态/撤销 | 保留测试意图，待 Runtime owner 接口正式化 |
| `certify-tr01b2d3-distinct-db-logins.mjs` | 321 | 独立 PostgreSQL LOGIN、隔离 listener、严格目录 owner 预检 | 优先参考 V1+V2 的组合；原样迁入 BLOCKED |
| `certify-tr01b2d3-host-hot-signing-key.mjs` | 149 | Platform secret-store 与 EVO database；文件换键/权限 | 仅保留安全边界负例，待隔离化 |
| `certify-tr01b2d3-host-https-identity.mjs` | 159 | 本地 https + 自签 CA + EVO database | 本地 TLS 证明不等于公网证书认证 |
| `certify-tr01b2d3-hot-trust-rotation.mjs` | 200 | EVO digest、数据库信任表和只读 Finance Owner | 签名可信度≠经济真相，保留旧只读证明 |
| `certify-tr01b2d3-installed-host-session.mjs` | 165 | Hosted managed Session、EVO Replay digest | Draft Provider 依赖，暂不进入 main |
| `certify-tr01b2d3-oidc-login-owner.mjs` | 237 | 本地 OIDC issuer、EVO DB、OIDC Provider | 真实外部企业 IdP 未验证 |
| `certify-tr01b2d3-postgres-role-separation.mjs` | 84 | 直用旧 `../evo/node_modules/pg`、数据库授权矩阵 | 能移植授权断言但须先替换旧依赖 |
| `certify-tr01b2d3-trusted-owner-delegation.mjs` | 207 | Finance intent + remote owner + EVO replay digest | 保留认证前置/拒绝语义，不提升经济解释权限 |
| `create-tr01b2d3-ci-keys.mjs` | 34 | EVO database、临时 Ed25519 配置 | 只用于 disposable CI |
| `create-tr01b2d3-installed-host-ci.mjs` | 128 | Host 多 Provider/安装状态，含 Draft trading-finance owner | 缺正式安装合同前暂不复制 |
| `run-tr01b2d3-installed-host-ci.mjs` | 85 | 旧 Draft Finance Provider + Host 进程启动 | 依赖旧进程构造，暂不复制 |

**F2 本轮决定：** 12 份脚本全部保留在旧 SHA 作为参考；当前无一份已被直接合并或重跑 PostgreSQL。V1 DB login 的 catalog 检查和 V2 的 Finance-only HTTP 404 检查均有可独立重建价值；不得把 V3 的 `dist/apps/api/src/main.js` 完整旧 EVO API 进程恢复为安全测试标准。下一步应先定义不越过新版 Runtime/Host 权威边界的最小测试场景，才复制断言到现代 CI。
