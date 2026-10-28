# EVO 东京开发预览：main CI 全绿后自动发布（2026-10-28）

## 背景和用户授权
用户反复指出：权限管理页面代码已合并却无法看到最新版，每次需要手动 Run workflow，自动继续反复询问发布。根因是 PR #1133 为首轮排障临时取消 `push`，只保留 `workflow_dispatch`。现已多次成功通过东京手动发布和健康验证。用户明确授权“你可以发布”。

## 范围与取舍
- **仅**腾讯东京 EVO 开发/预览：`evo.43.167.252.197.sslip.io`。不是生产部署策略，也不涉及 Railway、PG、卷、并行 owner。
- 采用 `workflow_run` 监听既有 `Project Continuity CI` 在 `main` 结束；不使用 `push` 直接部署，不引入重复推送触发。保留手动 `workflow_dispatch` 用于受控恢复。
- 自动流程只在同仓库 `main` 的 CI conclusion=success、SHA 与实时 main 完全一致、且有部署相关源码变化时启动；纯 docs 不触发镜像构建。
- 等到准确 main SHA 的 check-runs 完成且 continuity 和 lightweight-host 成功；如果存在 protocol-and-core 则同样要求成功；任何实际失败/超时拒绝发布。
- 原部署 job 仍先检查 SSH secret/远端身份，跑 `npm run test:platform`、按不可变 SHA 构建 GHCR 镜像、执行 compose pull/up readiness、公网 HTTPS 和 Caddy 未认证 401。复用原本 `.last-health-pass-sha` 的失败恢复行为；**不宣称公网探测失败时有同等回滚**。

## 证据与流程
1. 变更 `.github/workflows/evo-tokyo-dev-deploy.yml`：`preflight` 仅用 GitHub 只读 API 查 main/check-runs，不接触东京私密数据；`deploy` 依赖通过的目标 SHA。
2. 改动只经独立 PR 与所需 CI；保护分支不允许直接 push。
3. PR 合并 main 后由 `Project Continuity CI` 的完成事件触发自动发布。先确认 GitHub Actions 的确切目标 SHA 和 CI 全绿，再观察本地 /health、公网 HTTPS /health、未授权 401。
4. 任何成功的 CI/发布都**不替代** M0 创建第二个企业路径的已登录真人验收。真实 Human 必须验证“个人空间 ↔ 已有企业”，点击“创建新企业”进入表单，实际权限拒绝不绕过。
5. 若自动触发出现平台禁止 workflow_run、分支保护或安全/检查失败，必须据 Actions 运行事实暂停，不退回任意 push 强行部署，也不覆盖其他环境。

## 风险与约束
- workflow_run 的 token 可能有写包权限，所以只 checkout 经过保护的同仓库 main SHA，且在任何含 secrets 步骤前再次确认 main HEAD；不得 checkout PR 或不可信 fork 内容。
- workflow_run 是一次来源 CI 完成事件，部署并发组不取消正在部署的任务；被更新的旧 main 版本会被跳过。
- 仅发布 runtime 相关代码，跳过纯文档变更以避免成本；manual dispatch 对应显式人工恢复。
- 仅保留现有 SSH key 的运行时临时存储与清理，不日志输出 token/secrets。
- 不更改企业创建权限、账号身份或数据持久化。