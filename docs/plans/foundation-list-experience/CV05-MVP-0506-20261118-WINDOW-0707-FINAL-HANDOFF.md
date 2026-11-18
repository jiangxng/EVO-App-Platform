# CV05 MVP #05/06 · 自动续跑 #01–#07 最终交接与证据门禁（2026-11-18）

> **当前工程判断：ENGINEERING_ACCEPTED_FOR_DEV_PREVIEW；ENVIRONMENT_POLICY_NOT_VERIFIED / LIVE_LLM_UNVERIFIED。**
>
> 本文件优先于 11 月 18 日旧恢复文件中的 `待 CI`、`本分支尚未合并` 等**历史时间切片**。本文件创建时经 GitHub 独立核验的受保护工程基线是 `main@c901fae232af3133277e9f41908eaaf740089a89`；**本交接 PR 合并后会生成新的 main SHA，应以该 PR 的准确合并后 CI 回执为准**。切勿从此处推断东京运行镜像已更新。

## 1. 结论优先：已实现了什么，什么尚不能签收

| 范围 | 验证状态 | 不可混称 |
| --- | --- | --- |
| #04 多视图共用 Owner、Eidos Table/Board、Chart 独立聚合授权 | 已合入、隔离 Host/Chromium 验证；#1352、#1353；Eidos #219 | 不是 Human 实机登录/可访问性与商业 RELEASE |
| #05 Agent 自然语言到 Domain Owner Collection READ、Eidos 正确导航 | **真实 Owner/ActionRouter/Eidos + scripted 模型决策** 已通过；#1354；Chromium 1280/390 有独立原始日志 | scripted 决策不等于真实在线模型理解 |
| 歧义→追问、非法状态筛选→拒绝、用户修正→新 READ、后续失败不复用旧按钮 | #1354 真实 Host 契约、模型指令与脚本测试已合入 | 模型真实选择这些动作的质量未经在线检验 |
| 真实在线 Provider 质量验收入口 | #1355 的 manual-only 启动器、OpenAI/DeepSeek 既有 Provider、实际 Host/Owner 合成夹具；#1356 安全修补；#1357 环境专用 Secret 绑定 | **没有已签收的 Environment 配置、真实外网推理或 L01–L05 PASS** |
| OpenAI / DeepSeek 的 Responses → Agent → Host → Domain Owner → Eidos 协议联调 | #1358 分别通过 **12 次预设工具决策** 的离线 HTTP 注入集成测试，Owner 拒绝及撤权旧路由复读通过 | `CV05_OFFLINE_RESPONSES_HOST_REHEARSAL_PASS` 只证明 **零网络协议联调** |
| 东京 DEV/PREVIEW | 最近一次实际健康容器、SHA 固定镜像、HTTPS 和未认证 401 已成功 | Preview ≠ production；后续 docs/test/workflow 变更部署被**正确跳过** |

## 2. 七轮成果：全部已合并 PR 的原始证据

| 轮次 | 代码与源证 | 合并到 main SHA / 状态 |
| --- | --- | --- |
| #01–#02 | [#1354 歧义/失败恢复最终回执](https://github.com/jiangxng/EVO-App-Platform/pull/1354#issuecomment-6976838749)；[合并后真实 Host/Chromium #44290582355](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44290582355) | `8e2347fb05bab6dd3bab2dac980334ce33d690e9`，主线 19/19，东京 [#44290644461](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44290644461) 实际发布 SUCCESS |
| #03 | [#1355 在线 QA harness 与准确 HEAD/部署回执](https://github.com/jiangxng/EVO-App-Platform/pull/1355#issuecomment-6977297723) | `f704394474fcf4d11d66d3714c060491a178e698`，PR 44/44、main 44/44、[东京实际发布 #44294553561](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44294553561) |
| #04 | [#1356 手动工作流 admission + 旧路由撤权负例](https://github.com/jiangxng/EVO-App-Platform/pull/1356#issuecomment-6977568597) | `59de29a8d56ffaebb5b46fa2723015b1318c6d02`，PR 5/5、合并后 4 SUCCESS + deploy SKIPPED |
| #05 | [#1357 Environment binding + 主线权限约束及回归](https://github.com/jiangxng/EVO-App-Platform/pull/1357#issuecomment-6977873813) | `9c96f52023ff1bb3f7ff854d9b2692663d5ba9a4`，PR 5/5、合并后 5 SUCCESS + 3 SKIPPED（含分支治理跳过项） |
| #06 | [#1358 双 Responses Adapter → 真 Host 的零费用联调](https://github.com/jiangxng/EVO-App-Platform/pull/1358#issuecomment-6978163546)；[Platform #44300440715](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44300440715) | `c901fae232af3133277e9f41908eaaf740089a89`，PR 5/5、main 4 SUCCESS + deploy SKIPPED；Platform **1461 tests / 1460 PASS / 0 FAIL / 1 SKIP** |
| #07 | **本文件 + 唯一管理员阻塞 Issue** [#1359](https://github.com/jiangxng/EVO-App-Platform/issues/1359) | 此为独立 docs-only 交接 PR；需以最终 PR 回执签收其准确 HEAD、main CI、Tokyo SKIP、Branch Hygiene |

以上来自 GitHub PR、合并提交和 Actions 原始记录，不将前一时点的状态列替换为“最新线上状态”。

## 3. 发布与分支治理的正确解释

**东京最近一次真实运行/健康验收：**

- Workflow [#44294553561](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44294553561)，`preflight SUCCESS` + `deploy SUCCESS`，部署对象为 `ghcr.io/jiangxng/evo-app-platform:f704394474fcf4d11d66d3714c060491a178e698`；原始 VPS `docker compose ps` 显示 `evo-tokyo-dev-evo-1 ... Up 6 seconds (healthy)`，本地健康 `EVO_TOKYO_DEV_LOCAL_HEALTH_PASS`、公开 HTTPS `EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS`、Basic Auth `EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS`。
- Buildx 发布 manifest 为 `sha256:444d4bad7d5e5ea2becbeeef8ddf46b739518c2b0c57f5e9cd5c71c85ae3097b`，这是**发布清单 digest**，不是独立读取的运行容器 digest。
- 后续 [#44296876589](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44296876589)、[#44298911904](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44298911904)、[#44300931739](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44300931739) 均仅 `preflight SUCCESS`、`deploy SKIPPED`，原证 `EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE`。**不能把 main 最新 SHA 当作东京已实际运行的镜像。**
- #1354–#1358 的过程分支由 Actions `Branch Hygiene` 各自按 exact merged HEAD 退役；原证在上述 PR 评论中。保留并行 PR #1184 及其他责任人分支，不按名称大范围删除。

## 4. 唯一仍阻断真实 LLM 质量验收的外部条件

跟踪入口：[**#1359 GitHub Environment + 独立 QA 密钥 + 真实 L01–L05**](https://github.com/jiangxng/EVO-App-Platform/issues/1359)。

**先完成管理员控制面：** GitHub Settings → Environments → `cv05-live-qa`；Deployment branches and tags 只能选择 `main`，Secret `CV05_LIVE_QA_ENVIRONMENT_ONLY_API_KEY` **只能在该 Environment 作用域**。核对无仓库/组织级同名密钥或老 `CV05_LIVE_LLM_TEST_API_KEY` 暴露给其他分支，必要时撤销；采用独立低预算可轮换密钥并授权测试费用。

**为什么不能仅信任 YAML：** `workflow_dispatch` 可以对其他分支运行该分支自己的工作流文件，分支代码可以修改其 `if main` 条件；只有 GitHub 控制面的 Environment 部署分支策略和 Environment-only Secret 才能提供代码外的边界。现有 GitHub 连接器没有读取/修改 Environment 或 Secret 的能力，连接的浏览器没有 GitHub Settings 标签，因此未取得管理层原证。**当前只能说 `ENVIRONMENT_POLICY_NOT_VERIFIED`。**

**再做真实模型：** 仅使用保护的 `main` 手动发起 `CV05 Isolated Live LLM Acceptance (manual)`，选择已批准 Provider/模型、输入独立计费同意 `I_ACCEPT_TEST_LLM_CHARGES`。原始 Actions Run 必须证实真实远端 Responses API 调用且五场景 L01（歧义不猜测）、L02（澄清→真 Owner）、L03（非法 status 拒绝）、L04（明确修正→新导航）、L05（插件停用后旧路由双重拒绝）均通过；只保存脱敏模型、次数、token 统计与 Run URL，绝不输出密钥、完整 prompt、企业行体。**离线 12-step protocol replay 不替代这一验收。**

验证通过也最多升级到 `LIVE_ACCEPTED_IN_ISOLATION`，**不等于**物理设备 Human/Google OIDC、正式商业上线或未知业务语义全覆盖。

## 5. 对未来窗口的执行指令与明确不做事项

1. **开工先核对受保护 main 与 #1359 当前状态**。如果 Environment 仍无管理员配置证据，禁止反复重写 Agent/harness 或启动付费 API；直接根据 #1359 清单处理缺失条件。
2. 若管理员已完成并批准，可用当前原有 `workflow_dispatch` 在受保护 main 执行一次真实在线 L01–L05；失败保留原始证据，针对具体模型/Host 输入缺陷作窄范围修复，不用 synthetic 覆盖失败。
3. 若代码仍需变更：独立短分支、Draft PR、真实测试、精确 HEAD CI、Ready、Protected Main 合并、主线 CI、东京真实/跳过判定（严格区分）、Actions 精确退役，并在交接写明原始 Run/PR URL。
4. 不重新造个人 Agent、Domain Owner、View/Board/Chart、动态权限或 SQL 执行器；不把 `status` 无权过滤偷偷丢弃或把旧路由当通行证。
5. Human/OIDC [#1343](https://github.com/jiangxng/EVO-App-Platform/issues/1343) 仍未正式签收；CV03 [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) N1 NOT_CERTIFIED / Human SAVE OFF；CV04 正式后台 EXPORT OFF；PA05 [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) Operator NOT_SIGNED；**生产 WRITE 不开放**；并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 不触碰。

## 6. 原始文档与恢复路径

- [原始 #04→#05 恢复交接](CV05-MVP-0506-20261118-RECOVERY-HANDOFF.md)（第 1–10 节为先后时点历史记录，其中的“待 CI”等措辞不能覆盖本文件的最终 PR 事实）。
- [已有研究资料和采用/拒绝方案索引](CV05-MVP-0506-20261118-RESEARCH-EVIDENCE-INDEX.md)（旧竞品研究标记为历史资料而非当日网页复核）。
- [在线模型正式验收协议/权限/脱敏规则](CV05-MVP-0506-20261118-LIVE-LLM-ACCEPTANCE.md)（不允许违反 GitHub Environment 前置约束）。
- [管理员阻塞 #1359](https://github.com/jiangxng/EVO-App-Platform/issues/1359)（唯一执行依赖清单）。

**最终状态简写：** `CV05_MVP_AGENT_HOST_OWNER_EIDOS_DEV_PREVIEW_IMPLEMENTED` + `OFFLINE_RESPONSES_INTEGRATION_PASS` + `ENVIRONMENT_POLICY_NOT_VERIFIED` + `LIVE_LLM_UNVERIFIED` + `HUMAN_PRODUCTION_GATES_RETAINED`。
