# BEX-01 V3｜企业授权草稿保存与批准动作分离（2026-10-16）

> 本轮以用户确认的 [V3 原型 Draft #909](https://github.com/jiangxng/EVO-App-Platform/pull/909) 为设计基准。原型用 localStorage 保存选择，但该机制**无企业权限与人员隔离，也不能代替可审计的 Host 持久化**。前置 Eidos [#199](https://github.com/jiangxng/eidos/pull/199) 已通过 CI、Human UI gate 合并。本 PR 仅选择性同步七个 Eidos 已批准的 Form 提交桥文件，而不替换整包 Eidos。真实业务代码路径：`apps/data-import/types.ts`、`apps/data-import/service.ts`、`apps/object-extension/batch-page.ts`、`apps/object-extension/batch-draft.ts`、`apps/object-extension/actions.ts`、`apps/object-extension/constants.ts`、`manager/server.ts`，由协议测试和真实 Host Chromium 回归验证。

## 目标与完成条件

审核人允许先在真实 4 列映射表中修改拟新建／复用／不导入决策、字段名称与类型、批次主体固定值，再明确「保存当前审核草稿（不创建字段）」，稍后重进当前导入任务恢复。保存草稿必须完成真实持久化并返回可理解状态，但绝不自动批准企业字段、保存新的映射关系、更新任何原始 Excel 单元格、执行供应商导入、修改 Dry Run 或触发 Agent。与原来的「确认：批量创建并自动映射」是**两个不同按钮、两种 Host 命令及权限门槛**。

## 流程与步骤

用户进入 `/object-extensions/from-import?job=...&mode=batch` 审核 4 列表，变更 1 个或多个项目，查看同行的实时状态与字段预览，再点击次级的保存草稿。Eidos 仅从用户点击的声明 submitter 生成 `object-extension.batch-review.save-draft` 请求；Host 验证当前企业、Owner/Admin、插件启用、目标 Job、批量审核模式以及每个来源列的可用真实目标字段，最后保存到 Import Job 下**当前审核人独立草稿**。回显标注「当前审核人的未批准草稿已恢复」。原来的主动作则走 `object-extension.definition.create-from-import`，需要单独人工批准。

## 导航与信息架构

复用现有供应商导入 Job 和 Eidos 原生 Form；无新页面、无新的浏览器本地缓存、无 BEX 私有 skin。草稿属于当前企业 context、当前 Job 和 actorSubjectId；相同导入任务下不同 Owner/Admin 不自动共享未批准选择。已提交审批/变更正式映射时旧草稿失效，以权威 Job 为准。已有复用 Recipe、字段定义、批次常量、来源追踪依旧归各自业务 owner，不凭草稿提交。

## 视觉与颜色

「确认」仍是首要 Form submit，保留 Eidos 原主按钮样式；「保存当前审核草稿（不创建字段）」是明确标签的次级 submit。回显提示用可读文字、非依赖颜色，不在每行堆储存图标。页面继续遵循 Eidos 标准 4 列 ReviewTable、业务字段名、可折叠证据、窄屏卡片及 44px 交互要求。变更 UI 仍由 Eidos 通用控件负责，不在 Platform 内复制按钮 CSS。

## 记忆与注意力

草稿存储字段对应的**真实来源列名称**，避免列表筛选造成数组偏移和错位复用；保存后即使筛选为「需要关注」，所有列的决定仍作为一批保存。重开后按相同来源列还原合法候选，字段名和类型编辑不丢失；若目标字段已不可用则恢复为「需要人工确认」，不自动应用旧的 fieldId。用户看得见“仅是草稿”的状态，理解后续仍须明确批准与真实导入预检查。

## 无障碍与跨年龄

多个 submit 都是原生 button，可由键盘焦点与 Enter 调用；原生 SubmitEvent.submitter 确定 User 实际点击动作，Form 使用明确语义文本而非按钮颜色区分。Host 调用进行时禁用全部提交按钮以降低重复写入，成功或失败的结果通过已有 `role=status` 提示。细长手机页面、高缩放与读屏器需要后续人工验收，不能仅凭 CI 签收。

## 安全与数据修复

Host 对草稿执行 Owner/Admin 鉴权，异步解析导入服务后重新检查授权、插件状态和 Job 现状。严格限制每批字段数量 200、保留合法类型、真实可用目标 ID、目标排他，并限制草稿总数/操作者维度。草稿在 Enterprise Resource 实际 Import Job 持久化，**不变更 mapping、schema、Excel source、dryRun、receipt**；正式映射覆盖时显式清除旧草稿。未知提交按钮命令在 Eidos Form 协议层就被拒绝，不可能通过伪造 DOM actionId 绕过 Host 许可。已提交业务任务不允许保存新草稿。

## 证据与未完成边界

本 PR 验证目标：真实命令 ID 与 approval flag 不可混淆、审核人原始数据/映射不变、另一个审核人无法看到草稿、重进页面复原合法草稿、无字段定义增加、伪造选项拒绝、提交与原 Host 供应商导入回归仍成功。**本阶段为明确点击保存草稿，不是自动保存**；如果用户要求与 V3 原型相同的“修改即自动保存”，需要在获得明确可审计连续写入策略后单独评估。原客户 Excel 和登录后的 Railway 页面还未取得，CI 合成数据不能算正式客户验收。
