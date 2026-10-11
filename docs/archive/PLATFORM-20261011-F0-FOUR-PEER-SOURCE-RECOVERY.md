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
