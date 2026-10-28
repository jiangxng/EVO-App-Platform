# EVO 东京验证环境创建企业授权：发布结果（2026-10-28）

## 源码和 CI
- [PR #1126](https://github.com/jiangxng/EVO-App-Platform/pull/1126) exact HEAD `56c9c7dcbb56085698c99ca24d4b8e742daa4667`，Ready 后 10/10 CI SUCCESS，合并 SHA `d02491fc119bf17e91615f1f7c245b5ffc8a6986`。
- [PR #1127](https://github.com/jiangxng/EVO-App-Platform/pull/1127) exact HEAD `5c80d1e3407e956486f42e49cc05e0ed4e830b67` 5/5 CI SUCCESS，合并 SHA `a47a6a6ef7116ad04a969896ce374f33c39ab2f1`，含本轮已评审的东京 Compose 授权规则。
- **P1 一手 GitHub Actions**：[Run #40625798833](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40625798833)，[job #122610276054](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40625798833/job/122610276054) final SUCCESS。VPS Deploy with readiness checks PASS；独立 Runner 公网严格 HTTPS `/health` 与无认证根页面 HTTP401 PASS。部署 SHA `a47a6a6ef7116ad04a969896ce374f33c39ab2f1`。

## 仍需区分的验收
- 当前用户错误 `STATIC_POLICY_NO_MATCH` 的**源码路径已核实**：东京预览 `demo-user` 缺少 `enterprise.context.create` 匹配规则。只为此环境补了明确且受限的预览权限；未放开生产权限。
- **实际 Human 创建企业页面尚未签收**：需要登录东京站点，用 Personal Context 执行一次真实创建，验证新增企业进入选择器、能切换并在重载后保持，不以健康检查代替业务执行证明。
- **预览 Basic Auth 不是真正的按人认证**：所有持预览凭据者同用 demo-user；不应引入真实客户数据。产品级正式用户登录/角色授权和操作前就绪预检是独立开放门禁。
- 部署保留现有数据库和 Docker volume，不修改 Railway。异机备份/跨版本数据回滚、人机完整验收并未从本次发布自动获得 PASS。

## 发布触发器收口
本独立清理 PR 只移除一次性 marker push 触发，恢复 workflow_dispatch 手动模式；不触发新部署，不修改已有东京镜像。
