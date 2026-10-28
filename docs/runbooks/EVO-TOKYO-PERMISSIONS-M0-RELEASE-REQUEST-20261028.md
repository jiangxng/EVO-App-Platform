# EVO Tokyo · M0 权限预检单次发布（2026-10-28）

**范围已锁定**：只发布 [PR #1130](https://github.com/jiangxng/EVO-App-Platform/pull/1130) 所实现的“我的创建企业资格、提交前提示、服务端拒绝保留”。M1–M3 不在本次发布。

- 已合并主线：`fd0e5ad55040ee92de79b9652e4e4b1cd778bde0`；PR #1130 HEAD `66df22f4a5091f06846f86d5ea6fb307a6263f11`，正式评审 CI **46/46 PASS**。
- 一次性触发条件仅为本文件在 main **首次增加**，其它 main 提交不自动部署；使用现有 SHA 镜像、SSH 验证、Docker、平台测试、失败回滚、VPS 本地 /health、公网严格 HTTPS /health 和无认证 root 401。
- 保留 Docker/PostgreSQL/平台持久卷与既有企业权限事实。不清理插件、不更新 Railway、不重配 SSH Secrets/known_hosts、不直接推 main。
- **仅受控东京验证环境**。CI 合并、实际部署、公网健康与真正“用户权限 4 类状态”的浏览器 Human 验收分开记录。健康检查成功不能算 M0 人工验收。
- 部署后应由独立收尾 PR 移除单次 push 触发器，只留下 workflow_dispatch。
- M0 Human 要检查无权限时中文提示且创建入口不可执行、允许时仍显示入口、无身份时提示登录、撤权后禁用；受限于东京共享 demo-user，本次只能实测当前预览身份，不把它当真实多人 IAM。
