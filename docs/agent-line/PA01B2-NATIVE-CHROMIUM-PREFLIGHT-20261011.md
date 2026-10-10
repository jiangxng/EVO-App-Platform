# PA-01B2 原生 Chromium DOM 预验收与独立 CI — 2026-10-11

Document class: HISTORICAL_SNAPSHOT  
**证据等级：原生浏览器中的通用 Helper / DOM 预检；不是整套 App Host + 匹配后端的正式浏览器验收。**

## 1. 本次严格范围

- 分支基线：Platform `agent/pa01b2-page-assistance-20261010` / `db555162370b3c3c992c7aef88f605f9ebf2d0cd`，依赖 `#575 → #577 → #579`。
- Eidos owner：[#142](https://github.com/jiangxng/eidos/pull/142)，未合并。
- 从 [#579 的 `vendor/eidos/src/app-host/contextual-assistance.ts`](https://github.com/jiangxng/EVO-App-Platform/blob/db555162370b3c3c992c7aef88f605f9ebf2d0cd/vendor/eidos/src/app-host/contextual-assistance.ts) 获取代码，核对 Git blob SHA `38cb45a81691d863d9c6ba79a377fb8c6e9a7699`，本地以 TypeScript 转译 JS 后在真正的 Chromium DOM 中调用。
- 原生 Chromium 版本：`144.0.7559.96`。本地隔离运行，未连接 GitHub Runner 以外的业务服务、生产、LLM、数据导入作业或数据库。
- 已建立新的 [测试 Draft PR #638](https://github.com/jiangxng/EVO-App-Platform/pull/638)，branch `agent/pa01b2-native-chromium-preflight-20261011`，**base 为 #579 分支**，不是 main。脚本 [pa01b2_chromium_preflight.py](https://github.com/jiangxng/EVO-App-Platform/blob/agent/pa01b2-native-chromium-preflight-20261011/tests/agent-line/pa01b2_chromium_preflight.py) 读取该 checkout 的 `dist/vendor/eidos/src/app-host/contextual-assistance.js`，避免手工复制造成版本漂移。workflow [agent-pa01b2-native-chromium.yml](https://github.com/jiangxng/EVO-App-Platform/blob/agent/pa01b2-native-chromium-preflight-20261011/.github/workflows/agent-pa01b2-native-chromium.yml) 执行 `npm ci` / `npm run build` / Playwright Chromium。
- 首次本地模拟调用复核 9/9；再以精确 Git blob 源码转译的独立原生 DOM 测试 10/10 PASS。它们都是**helper 级别**，不能证明整个工作台、真实后端或业务结果。

## 2. Chromium native DOM 10项观察

| 场景 | 原生 DOM + helper 预检 | 完整 App Host / 后端 |
|---|---|---|
| 干净表单成功，决定 REFRESH 并可重绘 | PASS | 未执行 |
| 请求前已经编辑，决定 PRESERVE_DRAFT 且值保留 | PASS | 未执行 |
| 请求等待中编辑 textarea，保留内容 | PASS | 未执行 |
| 离开后回同 route 新挂载，旧结果 IGNORE | PASS（fixture 明确模拟 mount 变化） | 未执行 |
| Run FAILED 不刷新 | PASS | 未执行 |
| Run PAUSED 不刷新 | PASS | 未执行 |
| Run CANCELLED 不刷新 | PASS | 未执行 |
| requestId 不匹配不刷新 | PASS | 未执行 |
| 普通聊天不生成 contextual assistanceRequest | PASS（helper 请求生成层） | 未执行 |
| 数据导入映射携带 taskKind/importJobId/来源；不伪造 principal | PASS（封装层） | 未执行 |

这一层使用真实 Chromium input/textarea/select DOM 和真实 Playwright 填写，但按钮→侧栏→thread transport→已授权匹配后端→真实 Run/result→来源刷新链路仍未启动。因此不得修改 `BROWSER_PENDING` 门禁，也不得把本测试中构造的 `SUCCEEDED` 当业务写入证据。

## 3. GitHub CI、可恢复证据

- 工作流：[#638](https://github.com/jiangxng/EVO-App-Platform/pull/638)，第一次运行 [38095315018](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38095315018)，本记录创建时 **IN_PROGRESS**；最终 CI 状态应以后续真实结果更新 `docs/agent-line/HANDOFF.md`，不能先称成功。
- CI 生成 artifact `pa01b2-native-chromium-evidence`：`report.json` 与草稿保存的辅助截图。若 Actions 中断或结果过期，以准确 Git head 和 workflow 为复验入口。
- 首轮本地浏览器运行不代表 PR CI 完成。外部研究资料 S1-S14 此阶段没有新访问；原交接索引的历史阅读等级不变。
- 未在 GitHub 归档本地临时 HTML/JS 转译件及本地 Chromium 截图；可复现用代码和 CI 在 #638。不能虚构完整运行时截图。

## 4. 只读刷新 main 与并行检查

2026-10-11 只读读取：
- Platform `main` 实际 commit `653a1646bf4178b5b068b85323189304f89e76fa`；对 `#579` 分支比较为 diverged（B2 behind main 89、ahead 20，按 GitHub compare 统计）。
- `project.status.json` 与其生成的 `HANDOFF-LATEST.md` 仍保留 TR-01B2D2 时点快照，其中生产预览 commit 是 `3d5cc5a0793b3db990cde36564838d6097cc8d8f`；`main` 相较此 commit 已新增 29 commits，不能把旧 handoff 当所有开放 PR 的最新实时快照，更不能据此重排业务主线。
- Platform 文档 #570、实现 #575/#577/#579、Eidos #142 都保持未合并；实现是 Draft。并行 TR、2D 项目 PR 另有大量开放状态，本线没有读写它们的实现、状态或工作树。
- 仓库边界 `AI-BOOTSTRAP.md`、`LLM.md`、四仓 owner 与 Eidos Human Experience 权威已核对。保持既有分层与权限，不同步整个 vendor。

## 5. 尚未关闭的真实浏览器门禁

下一步必须在**隔离环境运行 Platform #579 精确源及匹配 #577/#575 后端**，安装 App Host Workbench 和导入作业 fixture，使用真正的点击、导航和延迟/失败控制点验证：

1. 干净来源页发起请求，复合标识关联成功，刷新一次且业务证据不冒充 Run 文本。
2. 已有和等待中草稿保持，提示可见，按钮恢复。
3. 导航离开后回同路径旧结果不刷新。
4. 失败、非成功终态、异常结果均不刷新。
5. 普通聊天 + 实际数据导入 AI 自动匹配回归，含可用 Recipe 的二次导入。

保留准确前后端 head、浏览器版本、原生网络/console/截图、请求/Run/receipt 关联、夹具和无生产访问证据。富文本/画布 dirty 边界仍未覆盖。若环境无法启动要明确 blocker，不签发 BROWSER_PASS。

本文件记录阶段性证据，不代替项目主线状态；[Agent 独立 HANDOFF](HANDOFF.md) 是后续进度唯一持续入口。
