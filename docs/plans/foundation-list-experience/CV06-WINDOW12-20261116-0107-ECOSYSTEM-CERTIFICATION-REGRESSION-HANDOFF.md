# CV06 Window12 自动续跑 #01/07 — Ecosystem Certification 14 项失败收口

> 2026-11-16。接续 [#07/08 上一步恢复交接](CV06-WINDOW11-20261113-0708-EIDOS-AUTHORIZED-CHART-HANDOFF.md) / [PR #1322](https://github.com/jiangxng/EVO-App-Platform/pull/1322)，不重新开发 Eidos Chart、Kanban、业务权限或新列表框架。
>
> 证据等级：A=源码与已提交测试，B=GitHub 原始 Actions/PR，C=已明确聊天要求，D=本轮工程决策，U=尚未验收。**未获得 exact-HEAD CI 前不可写成功**。

## 1. 复核基线与源证

- protected `main@68990fa8d5be918d7157a6caf13d8d4752f54436`；检查 9 条并发 open PR，均未承担这批定时测试修复；本轮只在独立短期分支 `test/ecosystem-certification-14-regressions-20261116` 操作。
- [11-14 定时认证失败](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43584655559) 与 [11-15 失败](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43705726474) 均在旧 `main@d3d07b7ed981fc8f6b92218091c47e53f7e34720`；11-15 原始 full-suite Job #132786256711：2368 total、2227 pass、14 fail、127 skip。不能把这些定时失败伪装成已通过或直接归罪于 #1321 Chart。
- 旧 #1321 [当时完整通过证据](https://github.com/jiangxng/EVO-App-Platform/pull/1321#issuecomment-6855073273) 与后来全量定时失败是两个不同证据时点。

## 2. 失败归因与改动（精确 14 项）

| 原失败数 | 现有合同事实（A/B） | 有界修复/不可削弱项（D） |
| ---: | --- | --- |
| 2 · CV04 PostgreSQL 加密 Store / Poll | `export-job-pg-store.ts` 和 `export-job-pg-dispatch.ts` 先拒绝 `NODE_ENV !== test` 的隔离模块；专项 CV04 workflows 都声明 `NODE_ENV: test`，但定时全量认证原未声明，负例无法进入参数验证 | Ecosystem Certification 的 `test:all` 一步设置 `NODE_ENV: test`；**保留生产代码 admission 未改、无生产 Host EXPORT 注册**。 |
| 1 · App Host readonly submit | Eidos `collectFormValues` 仍 `if(field.readOnly) continue`，TypeScript 生成产物拆成两行；测试假定一行字符串 | 正则允许 `if` 与 `continue` 的空白换行，仍紧邻验证。保留 Eidos server-side forged readonly 字段拒绝。 |
| 2 · CV02 view navigation | 当前 Eidos Context Navigation 最少两个 breadcrumb item；旧测试 fixture 仅一项 | 增加合法父/当前两个节点，保持全部非法 view route、重复选择负例。 |
| 2 · Localization | 产品已经统一 `EVO Plugin Platform` / Personal Agent，并扩至 en、ja、zh-CN、zh-TW | 更新 UI 文案/语言列表预期，保留真实 Feature 启停导致语言包增删的断言。 |
| 7 · Manager lifecycle | Trading Lite 新增 `enterprise.application-runtime-binding` 依赖；旧模拟目录无提供方。Ledger 编译兼容包改为受管 `ledger.runtime.configuration` READ 能力，无声明可导航的 Eidos 旧页面；Agent 四语言 | 在测试中引入仅供 `planInstall` 图依赖的**显式 synthetic provider**，同时新增无 provider 时 `MISSING_CAPABILITY` 的拒绝断言；旧 Ledger 表单检查改为受管 READ Operation 有/无验证；文件 reopen/disable/uninstall 生命周期仍验。测试用 provider 不代表正式 Host AuthorizationProvider 或生产授权。 |
| **14** | **不同历史业务线的测试预期漂移，尚无数据证明 Eidos Chart 有新回归** | **不修改领域授权、安全 gate、主机生产设置、不准通过 skip/remove tests 处理** |

## 3. CI 工作流与原证验收

本 PR 定向修改已有 [`ecosystem-certification.yml`](../../../.github/workflows/ecosystem-certification.yml)：原 `schedule` + `workflow_dispatch` 保留；增加只针对其自身和上述旧测试文件的 PR、main push 触发，以便**精确 HEAD 全量 `npm run test:all`**（不是只跑 14 项的白名单）；`NODE_ENV: test` 只作用于 test 步骤。全量测试仍可失败并阻止本 PR 合并，不能把“预期修复”当成“已验证 PASS”。

最终 PR HEAD / 原始 Job / merged main / Branch Hygiene 与东京自动 Skip 的现场结果，以本 PR 最终评论的 GitHub 原证为准；在完成前不预填成功。

## 4. 未动边界与后续

- #1320–#1322、Eidos #210 既有受权 READ + Chart 不重复开发；#1184 Owner 文件 untouched。
- #1092 Railway Operator 和 #1212 生产 Owner 继续 OPEN；`N1=NOT_CERTIFIED`、CV03 Human SAVE OFF、CV04 正式后台 EXPORT OFF。
- 如果 exact-HEAD CI 仍失败，读取其原始失败行在**同一 PR**修复，不跳过不放宽；只有全量、轻量 Host、Continuity 和所有自动触发的 Owner/跨项目 Gate 成功才 Ready→protected main。
- 本窗口仅收口定时全量基础测试证据；后续 #02/07 依赖真实新缺口而定，Kanban 的业务 Owner 枚举和 Eidos 上游仍须先行，不得在 Platform 私造。
