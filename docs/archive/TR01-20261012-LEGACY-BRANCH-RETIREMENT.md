# 2026-10-12 TR-01 14 个历史分支：按独立插件完成收敛与清理决定

> **这是用户授权的分支收敛，不是功能开发、财务准入或部署认证。** 清理结果以 GitHub Actions 的实际 `DELETED_OLD_REF` 日志及事后重新枚举分支为准。单纯创建本文件/清理 PR 并不意味着分支已被删。当前六个业务插件和 Finance Owner 均 **PRODUCT_UNFINISHED**。

## 一、完整的“迁到哪里 / 哪些不要保留”

**六个独立应用的旧源码已属于 main 中各自插件**：`apps/trading-stage-purchasing`、`-receiving`、`-sales`、`-shipment`、`-receivable`、`-cash`。每个独立 `APPLICATION`，独立 Manifest/Feature/Eidos Experience/安装状态。原 `feat/tr01-trading-peer-purchasing-receiving` 和 `feat/tr01b2d3-four-peer-business-plugins-stage` 的旧包在同名路径上存在，但 main 是后续改进版本，特别已加日语和繁体本地化；不回灌旧 Host/Catalog，也不二次创建六个业务插件。正式 BusinessData 写入仍未分包完毕，保持未完成。

**Finance Owner Provider 和 EVO Ledger Runtime 严格分权**：
- 需要保留的是 Platform 端**安装受管只读 Provider**、Host identity/scope/key/签名委托边界；现行 `providers/trading-finance-owner/package.ts` 和 `apps/trading-reference/finance-owner-{remote,key-pointer}.ts` 已在 main。此处不做账本事实写入/估值/分摊/核销。
- EVO main `modules/ledger`、`modules/allocation`、`modules/valuation`、`modules/valuation/infrastructure/postgres-trading-finance-fact-verifier.ts` 负责金融经济事实解释，Platform 原旧分支里所有试图新起 EVO Server/Finance Listener、计算 Replay digest、维护旧 PostgreSQL trust/nonce 或 Finance-owner 经济认证的脚本**不作为当前插件代码迁入**；依原用户要求不保留重复功能。
- Finance 原 12 份工具中，仅 5 份 Host 侧、明显不与 EVO 账本计算直接重复的**原始研究来源**，逐字节放在 `providers/trading-finance-owner/legacy-evidence/*.reference.txt`；**没有转成可执行脚本/功能需求**。其余旧 7 份包含 EVO DB/并发、操作员密钥、旧 OIDC/owner HTTP 实验，拒绝恢复。此决定不等于原 5 项现在通过生产认证，Provider 仍未完成。
- [Platform Draft #594](https://github.com/jiangxng/EVO-App-Platform/pull/594) 是旧混合 Host+Finance Owner+Stage 的大 PR，代码新版已归位、剩余旧功能不直接并入。按用户本轮授权，在审计归档已合 main 后**关闭未合并 PR，并删除其源分支**；绝不把它标成 MERGED/USER_ACCEPTED。EVO 独立 Draft [#108](https://github.com/jiangxng/EVO/pull/108) 是别仓库 owner 工作，不在本次处理范围。

**独立网页演示删除不保留**：`demo/tr01b2d3-isolated-live-stage-20261011` 的 `demos/tr01b2d3-isolated-stage/index.html`、`railway-function.ts`、`static-demo.mjs` 与专用 CI/测试不是实际 App Platform Plugin Store 安装流程，明确**不复制、不部署、不创建 archive tag**。只在下表记源分支名与 SHA 供审计。

**两条过程文档直接存在 main，不产生重复版本**：
- `docs/tr01b2d3-mainline-recovery-20261011` 的 `docs/roadmap/TR01B2D3-MAINLINE-WINDOW-RECOVERY-20261011.md`，旧 / main Blob 均 `7e8639e5544e83926dd9c31673412df57b1f1207`；
- `docs/tr01b2d3-railway-runtime-preflight-evidence-20261011` 的 `docs/roadmap/TR01B2D3-RAILWAY-PRODUCTION-READONLY-INVENTORY-20261011.md`，旧 / main Blob 均 `76eb698c09d5b46313d14a74b30e07bb7e480a5d`。
“放入 main”**已经实现且正文完全相同**，旧源分支可删除，绝不从旧落后 base 整分支合并。

## 二、每个旧分支原 SHA、归属和最终处理

| 历史分支 / SHA | 归属 | 最终处置 |
| --- | --- | --- |
| `demo/tr01b2d3-isolated-live-stage-20261011` / `bd67f320dce5ed6d4a023b58546b619ce4a03aa0` | HTML 模拟演示 | 弃用，不归档独立网页 |
| `docs/tr01b2d3-mainline-recovery-20261011` / `b67e84375c9247faa69b01a3cf93d3cf1daf9adb` | 过程文档 | 正文已在 main，退役旧 ref |
| `docs/tr01b2d3-railway-runtime-preflight-evidence-20261011` / `3e7d5182bc5f4ae03ca638c76524872086a0cbec` | 过程文档 | 正文已在 main，退役旧 ref |
| `feat/tr01-trading-peer-purchasing-receiving-20261011` / `7e23173250a23aa396555fed77a1470ebd099708` | 六独立业务插件的旧包来源 | 只保留 main 新版独立包，退役旧 ref |
| `feat/tr01b2d3-definer-owner-strict-admission-20261011` / `0560386e0915ebb607f183e215fb0f728cfe3220` | Finance Owner / 旧认证或门禁来源 | 保留 main Provider + 5 份 Host 参考材料，EVO 重叠或过时资产不迁入；退役旧 ref |
| `feat/tr01b2d3-deployment-descriptor-gate-20261011` / `c589f0bf1b79aed8700e601648ee335e913d5ba2` | Finance Owner / 旧认证或门禁来源 | 保留 main Provider + 5 份 Host 参考材料，EVO 重叠或过时资产不迁入；退役旧 ref |
| `feat/tr01b2d3-finance-owner-prod-preflight-20261011` / `718215136f79efd79d7e755954d686d77cf73356` | Finance Owner / 旧认证或门禁来源 | 保留 main Provider + 5 份 Host 参考材料，EVO 重叠或过时资产不迁入；退役旧 ref |
| `feat/tr01b2d3-four-peer-business-plugins-stage-20261011` / `fb3db99272ef047aa7686715fd495545f9342ccf` | 六独立业务插件的旧包来源 | 只保留 main 新版独立包，退役旧 ref |
| `feat/tr01b2d3-host-owner-delegation-20261010` / `1d6149bd05136d642e49aab5196d12ab243cbe4e` | Finance Owner / 未完成 Draft #594 | 保留 main Provider + 5 份 Host 参考材料，EVO 重叠或过时资产不迁入；退役旧 ref |
| `feat/tr01b2d3-six-lane-production-admission-20261011` / `8a0a27dca96ac69cb1fcef2eaffca6a43bc75dc4` | Finance Owner / 旧认证或门禁来源 | 保留 main Provider + 5 份 Host 参考材料，EVO 重叠或过时资产不迁入；退役旧 ref |
| `feat/tr01b2d3-twelve-lane-preprod-20261011` / `75e8565708433c3ed046016bc76bf45e054a03c0` | Finance Owner / 旧认证或门禁来源 | 保留 main Provider + 5 份 Host 参考材料，EVO 重叠或过时资产不迁入；退役旧 ref |
| `test/tr01b2d3-cross-instance-nonce-revocation-race-20261011` / `33675b9e9ec739d8a50d60277731030abeb3b284` | Finance Owner / 旧认证或门禁来源 | 保留 main Provider + 5 份 Host 参考材料，EVO 重叠或过时资产不迁入；退役旧 ref |
| `test/tr01b2d3-distinct-db-login-http-20261010` / `ff2fd23e83ebf72a5fc0c21757f729fd800594ac` | Finance Owner / 旧认证或门禁来源 | 保留 main Provider + 5 份 Host 参考材料，EVO 重叠或过时资产不迁入；退役旧 ref |
| `test/tr01b2d3-isolated-finance-owner-credential-http-20261011` / `c8cfda818d5226086b6a9c0124b3187c0d8a7f9a` | Finance Owner / 旧认证或门禁来源 | 保留 main Provider + 5 份 Host 参考材料，EVO 重叠或过时资产不迁入；退役旧 ref |

另外同一批清理三条无业务资产的残留 ref：
- `chore/audit-and-retire-platform-tail-20261011` @ `3a499f1524048741307f134aa14f7c4a871e3729`，already-content-subsumed；现有文件或 PR 合并提交已在 main，保留历史审计链接而不重复创建插件。
- `chore/retire-platform-merged-f0-f1-f2-heads-20261012` @ `7bd9709ee0d812827476cdb0e6c1a07eddb44eb2`，merged-pr-781；现有文件或 PR 合并提交已在 main，保留历史审计链接而不重复创建插件。
- `fix/plugin-card-descriptions-20261012` @ `9e783438587a4b2b2bed41670235c445e0fbe1aa`，merged-pr-783；现有文件或 PR 合并提交已在 main，保留历史审计链接而不重复创建插件。

## 三、为什么不是“旧的 24 路径全部复制”

14 条原始 Git Trees 的去重差集为 24 条：6 工作流、12 tools 认证脚本、3 孤立 HTML demo、2 旧 tests、1 在线 demo 文档；**没有发现缺少的独立 stage `package.ts` 路径**。main 同名文件的内容有差异且现行结构更晚，不能把它们恢复为老版本。原四阶段旧测试现存 `docs/archive/tr01-unactivated/tests/protocol/tr01b2d3-four-peer-stage-plugins.test.mjs`，现行六插件 `tests/protocol/tr01-trading-peer-purchasing-receiving.test.mjs`、`tr01-six-stage-host-preview.test.mjs`，还有 F0/F1/F2 小测试；再复制旧 workflow 和脚本只会冒充 CI 通过并建立第二套财务实现。

## 四、删除安全闸门与发布关系

清理只通过 `.github/workflows/tr01-independent-plugin-retirement-20261012.yml`：
1. PR 阶段对 **14+3 条准确 refs/SHA**、6 独立插件 main 路径、Provider readonly、5 个迁入研究 blob、2 个过程文档原始/main blob 做**只读审计**；
2. Draft #594 的 close/unmerged 状态必须在真正删除前核对；不能删除仍用于 open PR 的头或 base；
3. **仅 manifest 第一次随已审阅 PR 推到 main 才允许执行**；不得触碰 Agent、2D、Eidos、EVO、其他开发分支和项目全局状态。删前重新核验所有 ref 的 SHA、受保护状态、开放 PR；
4. 按用户“删除不保留重复资产”要求，**不创建任何旧 TR01 分支的 archive tag**，仅保存清理决策、原固定 SHA、必要非重叠 Host 侧只读参考证据；
5. 独立公网发布只针对 main 的已合并多语言说明和归档版本；使用既有 Railway Ledger Configurator 服务、原公网地址与精确 commit pin，不修改 DB、环境变量、已有 volume、EVO Runtime。**部署 SUCCESS 不等于 USER_ACCEPTED**。

以上仅整理已存在的资产，不开展新的 Finance Owner/业务插件开发。
