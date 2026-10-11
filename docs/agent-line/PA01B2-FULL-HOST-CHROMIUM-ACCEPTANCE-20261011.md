# PA-01B2 隔离环境真实 Host + Chromium 验收 — 2026-10-11

Document class: HISTORICAL_SNAPSHOT
Scope: 企业个人 Agent 独立开发线；PA-00/PA-01A/B1/B2 原实现保持不变。本页不是 TR 或 2D 验收证据。

## 1. 精确版本及权限边界

- Platform 实现 [#579](https://github.com/jiangxng/EVO-App-Platform/pull/579) `agent/pa01b2-page-assistance-20261010` head `db555162370b3c3c992c7aef88f605f9ebf2d0cd`；依赖 #575→#577→#579。Eidos通用 owner [#142](https://github.com/jiangxng/eidos/pull/142) head `f1057a64e26377ecf719c34ea83ff74b9dee9dc9`。
- 验收 [Draft PR #638](https://github.com/jiangxng/EVO-App-Platform/pull/638) 直接以 #579 分支为 base；当前通过的准确测试 head `56a18615efdd6029ddf9057b85510b43b835fe8c`，只增加自动化及隔离运行器，未改原实现及vendor、server业务代码。
- 完整 CI [run 38097668578](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097668578) / job `114346855709`：**SUCCESS / 8 cases passed / 0 failed**，GitHub Runner `Chromium 141.0.7390.37`，Node 24、`npm ci`、`npm run build`、Playwright安装及真实浏览器步骤全部 SUCCESS；[报告及截图 artifact 11686346415](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097668578/artifacts/11686346415)。
- 运行全在 GitHub 临时 runner：真实编译后的 App Host server / Workbench / Enterprise Context 创建 / 当前 Enterprise Owner / four installed packages（`evo-counterparty`、`evo-data-import`、`enterprise-agent`、`openai-llm-provider`）；Responses API 指向 `http://127.0.0.1:41238/v1` 本地确定性模型替身，无外部模型/生产密码。临时路径与进程 cleanup 已在工作流中执行。
- 业务数据为临时企业上下文和测试 Counterparty 文件；无 Railway 访问、正式生产用户数据、生产迁移、真实生产部署或合并授权。
- 源码：[host fixture](https://github.com/jiangxng/EVO-App-Platform/blob/56a18615efdd6029ddf9057b85510b43b835fe8c/tools/agent-line/pa01b2-full-host-fixture.mjs)、[Playwright case script](https://github.com/jiangxng/EVO-App-Platform/blob/56a18615efdd6029ddf9057b85510b43b835fe8c/tests/agent-line/pa01b2_full_host_chromium.py)、[workflow](https://github.com/jiangxng/EVO-App-Platform/blob/56a18615efdd6029ddf9057b85510b43b835fe8c/.github/workflows/agent-pa01b2-full-browser.yml)。

## 2. 真实运行通过的8项（所有结果来自上述完整CI日志）

| ID | 场景与严格检查 | CI |
|---|---|---|
| FB-01 | 真实App Host已安装导入页面并挂载，找到 `ai-auto-map` 与原生映射select | PASS |
| FB-02 | 干净来源页点击 Agent，发起 `enterprise-agent.thread.send`，版本化 `assistanceRequest` 指向准确 `importJobId`，真实HTTP源页重读 **恰好一次** | PASS |
| FB-03 | 请求前用户修改 select 后模型返回，原值保持，界面提示未保存数据保留，额外源页GET为0 | PASS |
| FB-04 | 模型服务被环回fixture挂起，用户等待中修改select，释放后保持草稿与提示，无额外GET | PASS |
| FB-05 | Agent等待中离开页面，再回相同route（新mount），旧结果不刷新新页面 | PASS |
| FB-06 | 受控Responses服务503，实际 Agent请求失败，按钮恢复，原页面不刷新 | PASS |
| FB-07 | 原普通聊天在真实页面按Enter发送，使用真实thread transport但 **没有** 版本化assistanceRequest，不回归 | PASS |
| FB-08 | 使用真实授权 `data-import.stage-file/review/commit` 完成测试文件入库，第二份结构等价CSV自动采用 `RECIPE` 且已处于 `DRY_RUN_READY`，不需重新映射 | PASS |

上述测试不是只靠DOM替身：真实HTTP Host、企业上下文、线程handler、Run、浏览器和Data Import业务Action都已执行。只在模型推理阶段替代外部服务；此替身返回确定性文本，**不声称它做了字段匹配写入**。

## 3. 失败尝试与修正理由（保留原始证据）

| 运行/head | 已观测 | 诊断与修复 |
|---|---|---|
| [38097262322](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097262322) / `5b3c0933` | 5/8 | 线程请求监听仅看response事件，导航后可能漏报；普通聊天两个提交按钮造成定位歧义 |
| [38097433261](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097433261) / `d67e9305` | 7/8 | 改为记录真实outbound thread request、按可见工作区Enter，仍发现刷新计数失效 |
| [38097557504](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097557504) / `ba1c7ea1` | 7/8 | 处理Playwright回调后日志已明确有成功 `thread.send` 及源页GET200，但原计数器按未编码URL查找路由；没有匹配 `%2Fdata-import%2F...` |
| [38097668578](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38097668578) / `56a18615` | 8/8 | 用 `urllib.parse.unquote` 还原route再严格统计HTTP请求；干净页要求正好一次，保护场景要求零额外请求 |

这些均是测试观测口径修正，**没有为测试变绿修改产品校验/放宽dirty规则/扩大Agent权限**。负路径计数器在最后一次变成可核的断言，不能用先前的假零读作为证据。

## 4. 受限通过、未覆盖与下一步

**本次门禁的精确状态：`PA01B2_ISOLATED_FULL_HOST_BROWSER_PASS_DETERMINISTIC_MODEL`。**

它覆盖了交接要求的五组浏览器验收（干净成功、已有及等待中草稿、离开重进、失败、普通聊天与真实导入/Recipe）。严禁提升为以下任何状态：
- `REAL_LLM_AUTONOMOUS_MAPPING_PASS`：模型替身只给静态文本，没有执行 `mapping.inspect/apply` 写入；
- `PRODUCTION_DEPLOYED`：#575/#577/#579/#142/#638均保持原PR并行边界；
- `RICH_EDITOR_DIRTY_SUPPORTED`：原生input/textarea/select之外的富文本、画布未覆盖；
- `PA01_ALL_ACCEPTED`：提案/回执统一人机交互、PA-02持久Run/receipt、跨进程恢复仍待验。

下一可拆独立门禁：在隔离环境让模型替身**通过正式 `enterprise.data-import.mapping.apply` Capability Operation** 做一次受权映射、保留真实business action/receipt IDs和源页刷新证据；做一次AI权限拒绝不变更测试，绝不跳过write授权。

完成PA-01B2浏览器限定门禁后，可按原总纲进入PA-02A异步Run/receipt端口及真实存储唯一性、Lease/Outbox/恢复方案的可逆设计/隔离验证，不做生产迁移和共享server.ts抢改。

## 5. 与前一证据区分

[Helper Chromium 10/10证据](PA01B2-NATIVE-CHROMIUM-PREFLIGHT-20261011.md) 是真实DOM但没有Host的较低层证明；本文件独立补齐真实Host/Thread/Run/Data Import链路。外部14项参考本次未重新查阅，沿用历史索引的“待验证”阅读状态。
