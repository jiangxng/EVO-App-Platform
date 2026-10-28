# EVO Tokyo Dev — 单次验证环境发布请求（2026-10-28）

**用途：** 用户明确要求将东京验证环境的两项已 CI 通过的 UI 修复更新上线。此文件是一次性发布标记，合并本文件的 **main push** 才触发原有的受控部署 workflow；普通 main 提交不会触发。发布成功后按独立 PR 移除临时 push 触发器。

## 已合并代码基线

- PR [#1120](https://github.com/jiangxng/EVO-App-Platform/pull/1120)，合并提交 `834cd80fae0b9d1237ab3d444a49fbec61d5a503`：缺企业上下文时提供明确非空白提示；取消重复 Workspace 图标。源 PR exact HEAD 45/45 CI PASS。
- PR [#1121](https://github.com/jiangxng/EVO-App-Platform/pull/1121)，合并提交 `4a1ab8d7716801bdabf9ff071597d43ec2094c18`：设置仅展示真正已安装、可配置插件；无可配置插件时空状态与前往商店；隐藏 SETTINGS_GROUP。同步 main 后 exact HEAD 8/8 CI PASS。
- 部署时以**合并本 PR 后新的 main 完整 SHA** 为唯一不可变镜像标签，禁止复用旧镜像作为成功证据。

## 发布门禁与限制

1. Release PR 自身完成 required CI，独立合并到 main。不直接 push main。
2. 当前 [`.github/workflows/evo-tokyo-dev-deploy.yml`](../../.github/workflows/evo-tokyo-dev-deploy.yml) 原有 Deploy workflow **先运行平台测试，再构建不可变镜像，并且先核验 SSH 身份与现有 VPS 环境**。保留之前的已知-good SHA 本地健康失败回退，不修改或清除现有数据卷。
3. 最终 GitHub Hosted Runner 严格检查公网 HTTPS `/health` 返回正确 JSON，未认证首页为 HTTP 401；不会获取或输出 Caddy 密码。此检测不代替用户 Human 页面点击验收。
4. **不迁移 Railway，不修改 Railway 环境/数据/域名，不重建 SSH Secrets、Docker 或数据库，不开放 4100/5432。**
5. 如果部署失败，记录完整 Actions 证据、线上残留 SHA、回退状态；不能宣布更新成功，也不自动删除卷。
6. 此为**单次手动意图的自动执行**，不是启用后续每次 main 提交自动发布。完成后移除 push+marker 路径触发器，保留人工 workflow_dispatch 路径。

## 验收账

| 门禁 | 当前 |
| --- | --- |
| 代码 #1120 / #1121 合并 | PASS，已独立合入 main |
| release PR CI 与合并 | 待本 PR 完成 |
| VPS 部署 SHA 与本地 HTTP 健康 | 未执行，待部署 Actions |
| 公网严格 HTTPS 与 Basic Auth | 待当次 Actions |
| 真正前端无企业提示/设置首页、Human | 待刷新东京浏览器检查 |
| 东京持久卷/备份/回滚演练 | 独立门禁，不能因本次镜像替换宣布通过 |
| Railway | 保持不变 |
