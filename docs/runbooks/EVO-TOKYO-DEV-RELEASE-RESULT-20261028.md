# EVO Tokyo Dev — UI 修复公网发布结果（2026-10-28）

## 已完成的一手证据（P1）

- 发布流水线：[GitHub Actions #40620148375](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40620148375)，event `push`，job `deploy` **SUCCESS**。
- **真实部署 SHA**：`35baedcad147dde9403d7bc26e2ca9734e906f5a`，包含先前独立合入的 PR #1120（应用未绑定企业提示、重复 Workspace 图标）与 PR #1121（设置页按已安装可配置插件显示）。
- 2026-10-28 UTC 02:18–02:20 Actions 原始 Job 日志显示 **SSH Secret format PASS**、**远端 SSH/Docker preflight PASS**、`npm run test:platform` 通过、不可变 SHA 镜像构建上传、Compose 等待就绪成功。
- UTC 02:20:25 VPS 真正 HTTP `127.0.0.1:4100/health` 返回 `{"ok":true,"service":"evo-app-manager"}`；紧接 `EVO_TOKYO_DEV_LOCAL_HEALTH_PASS sha=35baedcad147dde9403d7bc26e2ca9734e906f5a`。
- UTC 02:20:26 GitHub Hosted Runner 从公网以严格 TLS 校验访问 `https://evo.43.167.252.197.sslip.io/health`，**EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS**；无凭据访问根路径 HTTP **401**，**EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS**。
- 来源级别：**P1 已实际读取 GitHub Actions 原始日志**；原始日志位置 [run #40620148375 / job #122591942243](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40620148375/job/122591942243)。记录各个门禁，而非仅凭 CI 成功声称网页功能 Human 已签收。

## 本次明确未涉及

- 没有重新安装 Docker、重建 SSH Secrets 或 Known Hosts；没有在 GitHub Actions 输出凭据。
- 原有东京数据库和持久卷未删除，部署脚本保留旧 SHA 的本地健康失败回滚；**未执行非破坏性持久化重启、异地备份验证或数据回滚演练**。
- Railway 环境/生产数据、PA05、BEX、Eidos、EC 的并行 owner 不在本次发布写入范围。
- **Human 浏览器验收尚未完成**：用户需强制刷新东京网站，核对在“暂无企业”时点客户是否显示提示、设置页是否只展示真实配置项、第二个 Workspace 图标已消失。页面实际状态与后端企业绑定状态不可由 `/health` 代替。

## 结束本次临时发布触发

本次通过 [release PR #1122](https://github.com/jiangxng/EVO-App-Platform/pull/1122) 的唯一 `docs/runbooks/EVO-TOKYO-DEV-RELEASE-REQUEST-20261028.md` marker 触发受控部署，**不是长期开放 main 自动发布**。本独立清理 PR 去掉 `.github/workflows/evo-tokyo-dev-deploy.yml` 的一次性 `on.push` 条件，保留 `workflow_dispatch`、原本 SSH/测试/回滚流程和现在的公网 HTTPS/401 验证，不修改已验证镜像或 Docker 数据。

## 当前里程碑

| 里程碑 | 状态 |
| --- | --- |
| PR #1120/#1121 CI 与 main 合并 | PASS |
| #1122 单次受控发布 | PASS，#40620148375，SHA `35baedca` |
| VPS 本地健康 | PASS |
| 公网 HTTPS / 严格 TLS、未授权 root 401 | PASS |
| 浏览器真实内容、企业绑定、配置页、人审 | 待用户刷新检查 |
| 卷持久化、异机备份、完整回滚演练 | OPEN |
| 普通 main 自动持续部署 | 未启用，继续手动流程 |
