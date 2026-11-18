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

**GitHub Actions：** 仅从**受保护 `main`** 手动启动 `CV05 Isolated Live LLM Acceptance (manual)`；选 `openai` / `deepseek`、获授权的模型 ID，手动输入 `I_ACCEPT_TEST_LLM_CHARGES`。真实付费调用还必须先完成下列**仓库管理员控制面配置**；工作流自身的 `if: main` 不是独立信任边界。

**环境级安全前置（未配置/未核验时 BLOCKED）：** 在 GitHub 仓库 **Settings → Environments** 新建/核验名称严格为 `cv05-live-qa` 的 Environment。将 **Deployment branches and tags** 设置为 **Selected branches and tags**，**仅添加 `main`**（不能配置匹配任意分支的通配规则）；按仓库权限能力设置 Required reviewers、Prevent self-review，并避免未经审核的绕过。只在该 Environment 的 **Environment secrets** 中保存独立、低额度、可轮换的 `CV05_LIVE_QA_ENVIRONMENT_ONLY_API_KEY`；**绝不能**在 Repository secrets 或 Organization secrets 中保存这个名称的密钥，也不要把之前可能存在的 `CV05_LIVE_LLM_TEST_API_KEY` 仓库/组织级密钥保留为运行入口：必须由管理员审核并撤销或迁移。需要证明环境部署分支保护确实启用、环境级 Secret 有效且库级/组织级无同名可被其它工作流读取，方可执行真实付费 QA。

**重要限制：** `workflow_dispatch` 允许指定其它 Git ref，且分支代码可被修改；即使原 YAML 内含 `if` 条件，也可以在修改后的分支 YAML 中被删除。真正的凭据访问限制来自**仓库管理控制面**的 Environment branch policy，而非 PR 内可编辑的 YAML。工作流现在具有不带 Secret 的独立 Admission 与绑定 `environment: cv05-live-qa` 的专用作业，但**仅提交这段 YAML 不证明外部 Environment 已配置**。本窗口无法通过现有 GitHub 连接器读取或修改该 Environment 配置，不能自我宣称完成了管理员配置。GitHub 官方机制详见 https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments 。

无正确 Environment Secret、费用授权、Provider 可达性或真实模型时，本验收仍必须 FAILED / BLOCKED，不能回退模拟模型。

**隔离本地同等验证：** 使用现有 `npm run test:cv05:live-llm`，并在进程环境中显式提供 `EVO_CV05_LIVE_LLM_PROVIDER`、`EVO_CV05_LIVE_LLM_MODEL`、`EVO_CV05_LIVE_LLM_CONSENT=I_ACCEPT_TEST_LLM_CHARGES`、`EVO_CV05_LIVE_LLM_TEST_API_KEY`。密钥应由受控环境/密钥管理系统注入，不放入命令行、脚本、截图或仓库。此命令会产生真实 API 费用与网络请求。

**证据升级规则：** 仅当准确 SHA 的实际模型调用日志具备完整的 L01–L05、真实 Provider ID/型号、原始 Run URL 和通过检查时，才可标记 `LIVE_ACCEPTED_IN_ISOLATION`。隔离验收不等于使用者登录、真实 Human 设备验收、商业上线或所有语义的准确性证明。失败场景应成为新的产品问题或模型输入设计问题，不可用 scripted 覆盖。

## 不可越过的原有门禁

- [#1343](https://github.com/jiangxng/EVO-App-Platform/issues/1343)：Human 真实 OIDC / 设备 / 无障碍 `HUMAN_NOT_SIGNED`；优先 demo MVP，正式上线前再处理。
- [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)：CV03 N1 未认证、Human SAVE OFF；CV04 后台批量正式 EXPORT OFF。
- [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092)：PA05 Operator `NOT_SIGNED`；并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 不触碰。
- 东京 Tencent DEV/PREVIEW 与生产 RELEASE 不能混称；没有真实在线推理证据时仅标 `LIVE_LLM_UNVERIFIED`。

参见：[CV05 小切片交接首页](CV05-MVP-0506-20261118-RECOVERY-HANDOFF.md) 和 [现有研究原证索引](CV05-MVP-0506-20261118-RESEARCH-EVIDENCE-INDEX.md)。


## 自动续跑 #04/07（2026-11-18）· 人工执行工作流加固与撤权真负例

此次复核定位 **已上线的手动工作流缺少 protected main 引用约束**：原 `workflow_dispatch` 可选择分支，`actions/checkout` 在有专用 QA Secret 的作业中执行，不能允许测试密钥暴露给过程分支代码。修复在独立短期分支 `fix/cv05-live-acceptance-main-secrets-reauth-20261118`：

1. 新增**不使用 Secret、不 checkout** 的 `admission` 作业，明确校验 `GITHUB_REF=refs/heads/main`、费用同意、Provider、模型 ID；`isolated-real-inference` 作业通过 `needs: admission` 且自身再次检验 main 引用，之后才 checkout、安装依赖、注入专用 QA key。任何其他 ref/费用未授权/输入非法均 FAIL/BLOCKED，**不能触发付费测试，也不能进入有密钥的 Job**。
2. `tests/protocol/cv05-live-llm-acceptance-gate.test.mjs` 为上述分支/密钥分离添加静态回归门禁。既有成本同意、密钥不回退生产变量、Endpoint 白名单负例继续保留。
3. L05 修复了**只检查 Agent 不生成按钮却不验证旧 Eidos 路由重新访问**的证据漏洞：保留 L04 的真实有权路由，禁用 Counterparty Plugin 后，分别用旧路由的真实 ActionRouter/Domain Owner READ、现有 Agent Preview READ 重新访问，**两者必须被拒绝**；再要求 LLM 回答并确认无新导航。在线失败消息改为固定错误码，歧义追问等断言不打印模型文本、Owner 行体或 Provider HTTP 错误原文。
4. 这些改进只加固测试基础设施，不新增业务权限、模型访问或可写工具。隔离在线测试依然需要授权人员配置的 `CV05_LIVE_LLM_TEST_API_KEY`、明确 API 计费同意和真实手动 Run；直到实际完成，`LIVE_LLM_UNVERIFIED` 不变。

**证据纪律：** 工程 PR 需先完成其精确 HEAD CI、受保护 main 合并、合并后验收、东京 SHA/healthy/HTTPS/401 和 Actions 安全分支清理，才能写 `ENGINEERING_ACCEPTED`。本段仅描述修复意图，不代替原始 CI 或真实 LLM 记录。


## 自动续跑 #05/07 · 独立控制面门禁发现与补齐（2026-11-18）

- 固定创建基线：`main@59de29a8d56ffaebb5b46fa2723015b1318c6d02`（#1356 merged；Tokyo #1356 发布 WorkFlow `preflight SUCCESS / deploy SKIPPED NON_RUNTIME_CHANGE`，最后实际 Tokyo 运行镜像 `f704394474fcf4d11d66d3714c060491a178e698`）。
- 审核结论：**#1356 的 workflow-level main 检查不足以隔离可编辑分支代码**。官方 `workflow_dispatch` 可以指定任意 ref，且分支中的 YAML 本身可改写。必须使用 GitHub **Environment** 级别的 deployment branch restriction + 环境级 Secret 限制独立访问，不能继续把普通 Repository Secret 当成“只限 main”。
- 本轮独立 PR `fix/cv05-live-qa-protected-environment-20261118` 将有 Secret 的 Job 绑定 `cv05-live-qa`、额外检查 `github.ref_protected` 和 `GITHUB_REF_PROTECTED`；Secret 改为显式环境专属名称 `CV05_LIVE_QA_ENVIRONMENT_ONLY_API_KEY`；补离线回归保护工作流结构。**此处为待 CI 候选，并非环境已配置证明。**
- 当前 GitHub 连接器没有列举/配置 Environment 或 Secret 的接口，且 read-only URL 获取 Environment 已明确不支持；**环境实际创建、主线限制、独立 QA Secret 管理、费用授权需仓库管理员通过 GitHub 控制面核验**。所有这些不足以阻碍工程 PR/CI 验收，但足以阻止在线 L01–L05 实际运行。
- 不调用在线模型、不访问生产密钥、不修改 Human/OIDC/N1/SAVE/EXPORT/WRITE/PA05 门禁，也不动并行 #1184。
