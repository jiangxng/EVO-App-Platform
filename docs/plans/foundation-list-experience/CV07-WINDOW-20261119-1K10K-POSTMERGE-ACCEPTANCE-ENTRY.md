# CV07 · Item 1k/10k 最小纵切合并后验收与接续入口（2026-11-19）

> **仅标注已核对的原始证据；本文件不是 List Foundation 全功能完成或独立 Human 签署。** 主线工程、代码与 Eidos 以 GitHub 当前精确 SHA 为准。继续沿用 [Foundation CV 八步计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md)、[Item 第三插件工程入口](CV07-ITEM-THIRD-COLLECTION-20261119.md)、[新插件作者清单](CV07-COLLECTION-THIRD-PLUGIN-ONBOARDING-20261119.md)，而非重新调查/复制通用列表框架。

## 1. 已合并成果（GitHub API + Actions 原证）

| 边界 | 精确证据与结论 |
| --- | --- |
| 原 PR | [#1368](https://github.com/jiangxng/EVO-App-Platform/pull/1368)（Draft→Ready→普通 merge commit）；原分支 `perf/cv07-item-owner-paged-hydration-1k10k-20261119`，准确 HEAD `9a0b75d0f792f0b164e334002286bfb0f9543157`。 |
| 受保护主线 | 合并提交 `702a74e566ebb3c0a8f4c0a4d49ead84af8ef9cf`，直接核对为 GitHub protected main（注意后续新提交需要重新读取）。 |
| PR HEAD 6/6 | [Platform #44508912363](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44508912363)、[Continuity #44508912323](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44508912323)、[Lightweight #44508912232](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44508912232)、[Human UI Gate #44508912281](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44508912281)、[Item 1k/10k #44508912305](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44508912305)、[实际 Host Chromium #44508912286](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44508912286) 均 SUCCESS。后者真实原日志有 `CV07_ITEM_REAL_HOST_CHROMIUM_PASS:1280`、`PASS:390`。 |
| Actions 分支精确退役 | [Branch Hygiene #44509904385](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44509904385) 原始日志 `DELETED_VERIFIED_MERGED_PR_BRANCH perf/cv07-item-owner-paged-hydration-1k10k-20261119 @ 9a0b75d0f792f0b164e334002286bfb0f9543157`；直接查目标分支返回 404。没有触碰并行 #1184 或其他窗口分支。 |
| 主线检查 | 已核验合并 SHA 的 [Continuity #44509904652](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44509904652)、[Platform #44509904648](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44509904648) 与 [1k/10k #44509904752](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44509904752) SUCCESS；其余 Lightweight/Chromium/东京发布在本文件首次编写时仍未完成，**本记录不得提前替其签收**。 |

## 2. 真实问题、最小改动与可复测证据

源代码 `apps/item/projection-service.ts` 曾在 Item Owner 授权后，但在服务器端 search/sort/page 之前对所有合法 Item 执行 `responsibilities.filter` 和 `extensionValueRepository.listForObject`。这会使 10 条当前页对 10,000 条合法数据仍作 10,000 次扩展装配，并重复全量过滤责任关系。

PR #1368 在**保持原行/字段/企业完整授权在前**的约束下，先使用现有 `pageAuthorizedItemProjectionV010` 对有权 Item 字段做查询/排序/分页，然后**仅装配选中的当前页**，责任关系先索引一次。无 `query` 的旧调用仍维持所有合法记录和扩展装配，不改变 Schema、Host Action、Eidos UI、Agent READ 或插件权限。协议新增 120 条合法记录当前页 5 条扩展读取、旧路径 120 次扩展读取的精确回归。

## 3. 1k/10k 来源分级：内存真实 Owner，不是生产吞吐

当次 GitHub Actions 使用真实 Item Repository、内存 Enterprise Resource、现有 Responsibility、静态 Host Authorization 和实际有权 Collection Query；每组仅测 4 次 Owner 读取（首页/末页/窄搜索/我的 Item），禁止把四次样本的 p95 视为可信生产 SLA。

| 准确 SHA | 数据量 | 种子 | 四次样本 p95=max | Runner RSS | 扩展读取数 |
| --- | ---: | ---: | ---: | ---: | ---: |
| PR #1368 HEAD, [Run #44508912305](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44508912305) | 1,000 | 83.57 ms | 51.82 ms | 109.5 MiB | 23 |
| PR #1368 HEAD, 同 Run | 10,000 | 761.27 ms | 440.50 ms | 377.1 MiB | 23 |
| 合并 main, [Run #44509904752](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44509904752) | 1,000 | 92.93 ms | 54.79 ms | 108.1 MiB | 23 |
| 合并 main, 同 Run | 10,000 | 791.24 ms | 457.03 ms | 374.0 MiB | 23 |

结果字段明确 `source=DISPOSABLE_MEMORY_RESOURCE_REAL_OWNER`、`realPostgres=false`、`realBrowser=false`、`realHuman=false`。正式大规模数据库索引查询、100k 行、外部真实 OIDC/手持设备仍是其他证据等级；不能从本次测试推导它们 PASS。

## 4. 用户可演示 MVP 的最小验收路线（待当前真实预览核对）

**当前腾讯云东京 DEV/PREVIEW 的预期入口（来自实际部署工作流，不是本轮浏览器已成功登录的证明）：** `https://evo.43.167.252.197.sslip.io/`。它带 Basic Auth 未授权 401；此文件不保存/申请/输出用户名或密码。**真实东京容器、实际预览实例的 Item Feature 安装与有权数据仍须在本次最终发布后核查**。CI 的隔离 A/B 静态身份和 `CV07_A_APPLE` 等测试 Item **不在**东京正式业务数据里，不能作为预览内已有样本。

具备授权的真实预览后，产品负责人最短只读验收步骤：

1. 打开已获授权的东京 DEV/PREVIEW，进入 Item「物料 / 项目」的 `/items` 列表（既有 Host 路由，非独立新页面）。
2. 选有权企业、输入真实已存在的 Item 关键字，检查服务器端搜索/排序/分页（结果数只计算授权记录，不依据当前页假统计）。
3. 进入一个 Item 详情，再返回上页，确认搜索/排序/分页和页面上下文保持；不执行需要生产 WRITE 的编辑动作。
4. 切换「我的 Item」和「全部 Item」，确认只有有权且归属本人的记录进入「我的」列表；换企业后重新由 Owner 授权，无旧记录残留。
5. 在约 390px 手机宽度上重复搜索/视图切换/详情返回，留意是否横向溢出、按钮过小。遇到无数据/未安装/未授权应如实记录，而非静默降低验证条件。

如果 **Basic Auth、实际预览数据、Item 安装或真实操作路径不具备**，就继续标记 `MVP_USER_ACCEPTANCE_NOT_READY`，而不是因本地 Chromium 2/2 成功就发完成通知。开发者按 [CV07 Onboarding 清单](CV07-COLLECTION-THIRD-PLUGIN-ONBOARDING-20261119.md) 接入新 Collection 的独立复核仍需真实第三方开发者，不能用框架开发者编写指南代签。

## 5. 安全和排期不变

- 本轮不再推进付费 DeepSeek 余额提醒/本地费用估算；未来私有模型仅走现有 `llm.inference` Provider/Host/Agent。离线用户可演示 MVP 不被收费 L01–L05 阻塞，单独 [#1359](https://github.com/jiangxng/EVO-App-Platform/issues/1359) 保持 LIVE_LLM_UNVERIFIED。
- Human OIDC [#1343](https://github.com/jiangxng/EVO-App-Platform/issues/1343)、CV03 Saved View WRITE [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、CV04 后台 EXPORT、PA05 Operator [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 与生产 WRITE 仍各自关闭；不修改并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184)。
- 已启用条件提醒 `List Foundation 开发完成验收提醒`，每天依据实际 protected main CI、东京真实部署和可操作的预览验收路径判断，**不能**把本文单项工程合并当作全功能完成通知。下一步只补证据缺口/具体失败，不重造基础框架。
