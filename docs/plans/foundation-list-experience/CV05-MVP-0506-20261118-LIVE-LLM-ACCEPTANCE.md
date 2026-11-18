# CV05 MVP #05/06 — 隔离在线 LLM 验收协议（2026-11-18）

> 状态：**EVAL_HARNESS_IMPLEMENTED / LIVE_LLM_UNVERIFIED**。本文件不会把合成 Provider 回放、离线规则或原 CV05 Chromium 证明误记为真实在线模型验收。只有未来一条具有真实网络推理、独立测试密钥、准确提交 SHA 和全部场景通过的原始 Actions 记录，才能把相应场景标为 LIVE_ACCEPTED。本文件所在 PR 未合并前，以下命令视作待验收工程候选。

## 背景与已经完成的证据

- 现有 Personal Agent 已采用 `llm.inference` Provider 抽象，OpenAI 与 DeepSeek 各自已有公开 Provider 实现。线上 Host 的 Provider/Secrets 可用性由 Host 自主治理；不要创建第二个 Agent、查询引擎、动态权限或视图框架。
- [#1353](https://github.com/jiangxng/EVO-App-Platform/pull/1353) 和 [#1354](https://github.com/jiangxng/EVO-App-Platform/pull/1354) 均已合入；后者的 PR HEAD 22/22、合并后主线 19/19 和 [东京 DEV/PREVIEW 发布 #44290644461](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44290644461) 已核对：实际容器为 `main@8e2347fb05bab6dd3bab2dac980334ce33d690e9`，health、HTTPS、Basic Auth 成功。
- [原主线 CV05 真浏览器工作流 #44290582355](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44290582355) 4/4，验证了 1280/390 的 Domain Owner 查询、Eidos 路由和二次授权；Provider 决策仍是 scripted；不可宣称在线自然语言质量。

## 本次小切片的代码入口

1. `tools/agent-line/cv05-live-llm-acceptance.mjs` 仅在明确同意测试计费、指定现有 OpenAI/DeepSeek Provider 和模型名、提供**独立 QA 凭据**之后，才进入真实网络测试。读取的唯一模型密钥变量是 `EVO_CV05_LIVE_LLM_TEST_API_KEY`；不读取 `OPENAI_API_KEY` 或 `DEEPSEEK_API_KEY`，不支持自定义 Base URL。
2. `tests/integration/cv02-personal-agent-authorized-collection.test.mjs` 原有全部离线/真实 Owner 测试不变。只有 Launcher 设置 `EVO_CV05_LIVE_LLM_RUN=1` 时才注册真实在线测试，普通 Platform CI 不增加 SKIP，也没有外网费用。
3. 真实 Provider 仅可访问官方 `/responses` API，最多 32 次网络推理且每请求 25 秒超时；每次模型决策上限与回复 Token 上限均明确限定。原 Host Agent Catalog 被**收窄**为已存在的 Capability Search / Describe / Collection Preview 三个 READ，实际调用仍进入现有 Host 授权 → ActionRouter → Domain Owner，不提供 WRITE、PLAN、私有视图或跨企业授权。
4. 业务实体全部来自测试夹具内的 `seller-a` / `ent-a`、合成 Supplier 和 Dictionary 记录，使用内存 Lifecycle/Repository。失败不得降级成假 READ 或非授权列表链接；任何旧路由打开均需原 Domain Owner 再授权。
5. 新增普通 `tests/protocol/cv05-live-llm-acceptance-gate.test.mjs` 测试同意门槛、独立 key、Provider/model 白名单和禁用自定义目标 URL。此测试会在常规 PR/Platform CI 运行，**不对外发请求**。
6. `.github/workflows/cv05-live-llm-isolated-acceptance.yml` 仅允许 `workflow_dispatch`，不在 push、PR、部署自动触发；只在实际执行测试那一步注入专用 `CV05_LIVE_LLM_TEST_API_KEY` secret，不让 npm install 步骤看到密钥。

## 五个必须保留原始结果的在线场景

| 编号 | 实际自然语言决策 | 必须通过的真实 Host/Eidos 断言 |
|---|---|---|
| L01 | 人类输入同时提到供应商及业务字典、对象有歧义 | 不猜测执行 Owner Collection READ，不生成导航，并给出明确追问 |
| L02 | 人类通过对话历史澄清为“我负责的供应商、Supplier、ORGANIZATION” | 实际当前企业 Owner READ 返回仅自己的 `supplier-hk`，Eidos `navigate` 进入相同过滤页，Owner 二次读相同 |
| L03 | 人类要求未获字段权限的 `status=ACTIVE` 并强调不许放宽 | 实际 Host/Owner 拒绝，有失败 Observation，没有当前轮可导航按钮 |
| L04 | Human 在 L03 后明确取消 status，改为合法对象类型过滤 | 使用本轮当前 Host 重新查询并取得新的可导航链接，Owner 二次读相同，没有默默删除未经允许的条件 |
| L05 | 临时禁用 Counterparty 插件后再要求打开刚才的供应商列表 | 不会输出可操作旧入口，Host 授权边界仍拒绝 |

所有场景须同一条原始人工触发的工作流成功。打印的 `CV05_LIVE_INFERENCE_RECEIPT` 只能包含 Provider ID、模型 ID、场景数量、调用次数与模型上报的汇总 token 用量（缺失时 UNKNOWN）；不打印提示词、响应正文、工具参数、密钥、请求 URL、企业记录或用户数据。

## 如何真正执行（不伪造结果）

**GitHub Actions：** 在 `CV05 Isolated Live LLM Acceptance (manual)` 选择受保护 main 对应的提交、provider `openai` 或 `deepseek`、授权的模型 ID，手动输入 `I_ACCEPT_TEST_LLM_CHARGES`。先由拥有密钥管理权限的操作者为仓库配置仅用于测试的 `CV05_LIVE_LLM_TEST_API_KEY` GitHub Actions Secret（账户、配额与轮换由操作员治理；请勿提交明文）。无 Secret、无授权或模型暂不可达时，本验收必须 FAILED / BLOCKED，不能回退模拟模型。

**隔离本地同等验证：** 使用现有 `npm run test:cv05:live-llm`，并在进程环境中显式提供 `EVO_CV05_LIVE_LLM_PROVIDER`、`EVO_CV05_LIVE_LLM_MODEL`、`EVO_CV05_LIVE_LLM_CONSENT=I_ACCEPT_TEST_LLM_CHARGES`、`EVO_CV05_LIVE_LLM_TEST_API_KEY`。密钥应由受控环境/密钥管理系统注入，不放入命令行、脚本、截图或仓库。此命令会产生真实 API 费用与网络请求。

**证据升级规则：** 仅当准确 SHA 的实际模型调用日志具备完整的 L01–L05、真实 Provider ID/型号、原始 Run URL 和通过检查时，才可标记 `LIVE_ACCEPTED_IN_ISOLATION`。隔离验收不等于使用者登录、真实 Human 设备验收、商业上线或所有语义的准确性证明。失败场景应成为新的产品问题或模型输入设计问题，不可用 scripted 覆盖。

## 不可越过的原有门禁

- [#1343](https://github.com/jiangxng/EVO-App-Platform/issues/1343)：Human 真实 OIDC / 设备 / 无障碍 `HUMAN_NOT_SIGNED`；优先 demo MVP，正式上线前再处理。
- [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)：CV03 N1 未认证、Human SAVE OFF；CV04 后台批量正式 EXPORT OFF。
- [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092)：PA05 Operator `NOT_SIGNED`；并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 不触碰。
- 东京 Tencent DEV/PREVIEW 与生产 RELEASE 不能混称；没有真实在线推理证据时仅标 `LIVE_LLM_UNVERIFIED`。

参见：[CV05 小切片交接首页](CV05-MVP-0506-20261118-RECOVERY-HANDOFF.md) 和 [现有研究原证索引](CV05-MVP-0506-20261118-RESEARCH-EVIDENCE-INDEX.md)。
