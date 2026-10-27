# EVO 东京验证环境：公网入口验收证据（2026-10-27）

**专项状态：公网 HTTPS FAIL / OPEN；VPS 本地部署与健康 PASS。** 本文属于同一套东京部署 runbook，关联 [部署手册](EVO-TOKYO-DEV-DEPLOYMENT-20261027.md)、[原交接 PR #1118](https://github.com/jiangxng/EVO-App-Platform/pull/1118)，新诊断 [PR #1119](https://github.com/jiangxng/EVO-App-Platform/pull/1119)。不覆盖 PA05/BEX/Eidos/EC，也不构成生产或 Human 签收。

## 1. 继承已证实事实（旧窗口 P1 原始证据）

- main 基线：7b95c3b70d947c83476e9ca966c3252ade96e384；[Actions #40460609744](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40460609744) SUCCESS，远端 SSH/Docker/PG/EVO/Caddy 运行并通过 VPS-local HTTP /health。禁止重新处理旧 Known Hosts/Docker 安装问题。
- [compose.yaml 原文](https://github.com/jiangxng/EVO-App-Platform/blob/7b95c3b70d947c83476e9ca966c3252ade96e384/deploy/tencent-tokyo/compose.yaml)：Caddy 映射 TCP 80/443；EVO 仅回环 4100；PostgreSQL 走容器私网；PG、EVO、Caddy 使用四个独立持久卷。
- [Caddyfile 模板原文](https://github.com/jiangxng/EVO-App-Platform/blob/7b95c3b70d947c83476e9ca966c3252ade96e384/deploy/tencent-tokyo/Caddyfile.template)：裸 IP HTTP 应 302 跳转 HTTPS 主机；/health 不经 Basic Auth；其它路径使用 Basic Auth。尚未从 VPS 读取实际渲染文件或证书。
- 交接 #1118 Draft，准确 HEAD a96ea258862ed0ca16049ff1ca006755025376e1，重新查证 4/4 checks SUCCESS。现有东京 deploy workflow 只在手动调用时验证 VPS 本地 /health，不验证公网。

## 2. 新取得的外部真实运行日志（P1：2026-10-27 直接读取 GitHub Job 日志）

| 原始来源 | 原始证据 | 可以与不可以推断 |
| --- | --- | --- |
| [第一次公网探针 run #40463297608 / job #122052688019](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40463297608/job/122052688019) | SYSTEM_RESOLVER_A=43.167.252.197；DNS PASS；公网 TCP443 连接超时；HTTPS curl (28)，8 秒超时 | 首轮工作流受 GitHub Bash 默认 -e 影响，未执行后面所有探针。已修改诊断脚本，不能把缺失的检查当作通过。 |
| **[完整第二轮 run #40463405902 / job #122053036724](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40463405902/job/122053036724)** | DNS A 指向 43.167.252.197，PASS；TCP 443 **FAIL（10s）**；通过 DNS、指定 IP 的两次 HTTPS /health 均 curl (28) 且 HTTP 000；HTTPS root 同样连接超时；**裸 IP HTTP 80 返回 302，PASS**。 | 说明公网 DNS 正确，TCP80 与 Caddy 重定向响应存在，**公网 443 不通**。TLS 证书、HTTPS 路由与 Basic Auth **尚不能测量**。未证实具体哪层防火墙拦截。 |

两次探针都来自 GitHub-hosted Ubuntu Runner，无 Secrets、无 SSH、无写入 VPS。模型自身网页读取工具访问失败不作为公网故障证据。

## 3. 新阅读的官方原文及来源等级（P1，查阅 2026-10-27）

| 来源与原始 URL | 原文关键发现 | 工程用途 / 限制 |
| --- | --- | --- |
| 腾讯云《防火墙应用案例》，更新 2026-08-25：https://cloud.tencent.com.cn/document/product/1207/136745 | Linux 系统或容器镜像默认放通 **22、80、ICMP**，并没有列出 443；来源默认 0.0.0.0/0。 | 支持 **443 入站规则可能缺失** 这一优先假设，但并未实际读取当前实例规则，不能断言已经找到唯一根因。 |
| 腾讯云《管理实例防火墙》，更新 2026-01-27：https://cloud.tencent.com/document/product/1207/44577 | 目标实例详情 → 防火墙 → 添加规则；TCP 443、允许、按需来源，规则有顺序/优先级，修改无需重启。 | 用于最小化调整及审计，不能盲目覆盖/清空规则；如已有规则，先看更前面的拒绝策略。 |
| Caddy 官方《Troubleshooting Strategies》：https://caddyserver.com/docs/troubleshooting | DNS、宿主端口、云防火墙、主机监听均是 HTTPS 故障基本排查层级。 | 需要公网 TCP 443 可连后再评估 ACME 证书与反向代理；证书签发目前 **没有实证**。 |

**事实和判断分开**：公网 TCP443 超时是已复现事实；“腾讯云 443 入站规则缺失”是最有根据的优先诊断，尚非已验证配置结论。备选原因包括 VPS OS firewall、Caddy 443 没有实际监听、云侧其他拒绝策略。

## 4. 下一处最小修复与重新验收

1. 核实腾讯云 Lighthouse 东京实例 evo-dev-tokyo-01 / lhins-0pk1fw21 的 **防火墙入站 TCP 443**。若不存在放行规则，可单独添加 **允许 TCP 443、来源 0.0.0.0/0**（预览公网访问）；如已有相同规则需确认不存在优先拒绝。不要动 22/80 既有规则，不开放 4100/5432，也不删除数据卷、重建 Secret 或重装 Docker。
2. 在端口可达后重跑 [诊断 workflow](../../.github/workflows/evo-tokyo-public-smoke.yml)；期望公网 TCP443 PASS、严格 HTTPS 证书可验证、/health 200 且 EVO JSON、HTTPS 根路径未认证 **401**（认证保护正常）、裸 IP HTTP 继续 302。
3. 若云侧 443 已允许仍超时，通过既有可信 SSH 路线只读检查 VPS 端口监听、OS 防火墙及 Docker Caddy 状态。仅在 TCP 可连但 TLS 失败时检查 Caddy ACME 日志；不得把私钥、Caddy 密码、数据库凭据、完整环境文件写入 Actions。
4. 之后非破坏性验证卷重启、外部备份与恢复、已知良好 SHA 回滚，逐项留下证据；**通过上述门禁后**才独立 PR 增加 CI-gated main 自动部署。

## 5. 独立验收账

| 里程碑 | 当前 |
| --- | --- |
| 原 handoff exact-HEAD CI | PASS，#1118 当前 a96ea258... 的 4/4 checks |
| 主线 GitHub→VPS 本地健康部署 | PASS，#40460609744 |
| 公网 DNS A、HTTP80 302 | PASS，#40463405902 |
| 公网 TCP443、严格 HTTPS、证书、Basic Auth | **FAIL / OPEN**；443 TCP 超时，后面均无法成立 |
| 页面功能、Google OAuth、Human 体验签收 | **未验收** |
| PG/EVO/Caddy 持久卷重启，异机备份/恢复，回滚演练 | **未验收**，禁止删除卷 |
| CI-gated main 全自动发布 | **未实现**；等待公网、数据和回滚门禁 |
| Railway 原实例及数据 | 本专项 **未修改、未迁移** |

新增资料应在原 #1118 研究索引关联本文件和 PR #1119。以上检查是一项诊断，不等于自动发布或生产级认证。
