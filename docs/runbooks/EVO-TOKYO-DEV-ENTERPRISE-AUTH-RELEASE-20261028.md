# EVO Tokyo Preview — 企业创建授权单次发布（2026-10-28）

授权意图：用户当前通过网页创建企业时遇到 `STATIC_POLICY_NO_MATCH`。只在东京验证环境发布本轮经过 CI 的预览身份创建企业授权，不改变其它环境。

## 已合并源码
- [PR #1126](https://github.com/jiangxng/EVO-App-Platform/pull/1126) 已合并 `main@d02491fc119bf17e91615f1f7c245b5ffc8a6986`；exact HEAD `56c9c7dcbb56085698c99ca24d4b8e742daa4667` 的 10/10 CI 成功。
- 东京 Compose 仅允许 `demo-user` 的 `enterprise.context.create`，未放行其它管理写操作。协议 DENY 优先。无需重设 SSH、Basic Auth 或 Docker。
- 这是 **Caddy Basic Auth+compatibility-local Principal 的单操作员验证环境**，访问预览口令的人共享 demo-user。该规则不准进入生产或 Railway。

## 一次性安全发布
- 本 PR 内只给 workflow 增加一个针对**本文件唯一新增路径**的 push 触发，其他 main commits 不自动发布；合并后以当前 `main` 的新 SHA 发布 Docker image。
- Workflow 前置验证 Secrets/SSH、npm 平台测试、远端 Docker、镜像就绪、VPS 本地健康、严格公网 HTTPS、未认证根页 401；不会删除数据库或 Docker volume。
- 当次成功后独立 PR 移除该 push 触发；保留 workflow_dispatch。
- 本文件仅请求受控东京验证环境更新，不是企业创建 Human 签收。公网健康与 Basic Auth 通过后，仍需在已认证浏览器里创建企业、验证自动选择和重载。绝不因部署 PASS 宣称业务操作 PASS。
