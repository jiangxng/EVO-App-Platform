# TR-01B2D3｜隔离线上阶段演示与真实部署阻断（2026-10-11）

**状态：浏览器模拟代码已提交；真实 Finance Owner 服务尚未上线。禁止将本页当作 B2D3 生产准入证据。**

## 演示交付组成

- 静态网页：`demos/tr01b2d3-isolated-stage/index.html`，中文工作台、合成销售→发货→应收→收款业务链。
- 浏览器本地 WebCrypto：`demos/tr01b2d3-isolated-stage/static-demo.mjs`，Ed25519 临时密钥真实加签、签名验真、一次性 jti 重放拒绝和企业/上下文匹配逻辑，六个交互测试：正常只读核验、重放、已撤销密钥、跨企业越权、签名被篡改、nonce authority 不可用。
- 工程代码：`demos/tr01b2d3-isolated-stage/railway-function.ts`，可选的 Railway Bun Function 完整服务端版本，含独立服务端签名/验证、模拟只读 facts 和单进程 nonce，**目前由于平台限制没有部署**。
- 负控：`tests/protocol/tr01b2d3-online-stage-preview.test.mjs`；`.github/workflows/tr01b2d3-online-stage-preview.yml`。支持在 GitHub Actions 或 Node 24 测试，不接生产数据库/Host/Owner。

## 实际 Railway 部署尝试、禁止绕过的边界

**Railway 授权连接器实时查询：** 项目 `EVO Plugin Platform Preview`（单独项目，其空环境虽然命名 production，但与实际 `EVO Ledger Runtime MVP` 完全不同），没有服务或 staged 变更。对预览项目单独调用 `create_function`，提交全部 Bun TypeScript 代码、指定预览项目和环境，但 Railway 返回：

> Free plan resource provision limit exceeded. Please upgrade to provision more resources!

**结果：** 没有创建预览服务、没有获得 Railway 公共域名，不能声称服务端金融委托演示已经部署；不重复尝试/绕过 Railway 免费额度，不改变生产资源，也不删除现有服务来挤出容量。

用户可在 Railway 计划额度可用后重新创建独立 Preview Function；但上线前必须明确页面的 **DEMO ONLY** 边界。实际业务 Owner、OIDC、Host、受限 PostgreSQL runtime/Operator 和正式密钥托管都不在预览函数中。

## 无后端服务的临时静态外部预览

可使用 [RawGitHack](https://raw.githack.com/) 从**公开** GitHub 仓库加载 `index.html`，CSS 在 HTML 内，脚本同目录 `static-demo.mjs`，不需要另行付费的服务器实例。该网站由第三方运营、不是 Railway 或 GitHub Pages 的正式发布渠道，浏览器首次打开 HTML 可能显示一次确认页面。建议使用**固定提交 SHA** 的 `https://rawcdn.githack.com/jiangxng/EVO-App-Platform/<exact-commit>/demos/tr01b2d3-isolated-stage/index.html`，链接随提交记录锁定，避免旧缓存。不应输入任何真实客户数据、企业密钥、会话 token 或数据库凭据。

如 RawGitHack 在用户网络不可达，请直接下载 HTML 与 JS 两文件放同目录，在本地 HTTP 静态服务器打开（浏览器 WebCrypto 在 localhost 等 secure context 可用）。此备用方式只是演示安全决策，并不补齐 Railway 生产门槛。

## 已确认 / 尚未确认

| 项目 | 状态 |
|---|---|
| 独立演示 UI 与浏览器本地六场景 | 已提交，CI 见独立 PR 验收评论 |
| Ed25519 签名和签名无效拒绝 | 浏览器本地真实 WebCrypto；不是 Host→真实 Owner |
| 真实服务端 Bun Function | **Railway 免费计划额度阻断，尚未部署** |
| 实际两 LOGIN PostgreSQL、跨实例 nonce、生产 OIDC、Vault 和私网 TLS | 尚未验收 |
| 真实经济账本、成本/收款、生产 DB 或财务写 | 不访问、不改变 |
| 阶段状态 | TR01B2D3 **OPEN** / `NOT_CERTIFIED` / `executionAllowed:false` |

不合并 main，不改 `project.status.json`、`HANDOFF-LATEST.md`；不进入 B2D4 写入、不干扰 Agent、Eidos、2D 专项。GitHub 研究参考与本次问题证据见独立 PR 评论。
