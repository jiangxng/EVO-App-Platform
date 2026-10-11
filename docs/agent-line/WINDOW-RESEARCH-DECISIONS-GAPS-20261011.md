# Agent 线方案、决策与未决问题 — 2026-10-11

Document class: HISTORICAL_SNAPSHOT
配套：[简短入口](WINDOW-RESEARCH-HANDOFF-ENTRY-20261011.md)；[详细来源](WINDOW-RESEARCH-SOURCE-INDEX-20261011.md)。

## 1. 用户目标与明确要求

建设能长期发展的企业个人Agent，完整规划产品要求、架构、开发步骤、插件接口/协议基础与跨平台交互。覆盖从复制按钮、状态样式到存储、恢复、治理的细节，减少每个页面重复补通用功能。确定的写具体，不确定的保留方向与验证方法。以导入页“AI自动匹配字段”为实际场景，不能把一切交给LLM。

本线独立于TR业务主线和2D专项；用户授权开始并多次继续，要求每阶段保存进度、节约有限额度。文档存入EVO-App-Platform。日常已授权工程不需逐步确认，但继续授权不等于合并、生产部署或迁移授权。本次换窗要求保存研究来源、比较理由、缺口和准确接续指令，不重做研究或覆盖别的窗口。

## 2. 已采用与暂缓方案

“来源事实”是已读仓库/实现可支持的结论；“设计判断”是我们对本项目的选择，不借外部文章替其背书。

| 主题 | 来源事实 | 采用的设计判断及理由 | 排除/暂缓方案、适用边界 |
|---|---|---|---|
| 产品/四仓边界 | 历史宪法分配平台编排、EVO业务账本、Eidos体验、EC知识经验 | 保留四仓owner；单一主Agent+确定性工作流+受限专业能力 | 暂缓多自治Agent群；不得由LLM替代权限、验证、记账、固定布局 |
| 入口复用 | 导入已有agent.personal/context/taskKind；thread.send已存在 | 在原入口加版本化assistanceRequest/result，兼容旧调用 | 不另造导入聊天应用、不重写所有插件；B1与B2匹配发布 |
| 身份/幂等 | 旧代码同clientTurnId只比较文本，跨作业可误复用；仅扫描100 Run | A先比较完整JSON任务身份，再B保存协议封装；错用键在副作用前拒绝 | 不把UUID/进程single-flight当永久幂等；数据库唯一键/跨进程保护仍待PA-02 |
| 权限 | Host requestContext/resolvedContext是身份入口 | 客户端source只提供来源，不授予权限；执行仍走已有能力边界 | 不信任模型或客户端传来的tenant/principal，不扩大WRITE权限 |
| 结果 | Run状态与业务receipt独立 | 结构化关联来源/任务/Run，引用真实receipt；Run成功只允许重新读取干净页 | 不解析自然语言“已完成”刷新，不把Run成功当业务提交成功 |
| 页面刷新 | 路径相同并不能证明是同一页面实例；有等待期间编辑风险 | 捕获来源mount+UUID，结果严格匹配；草稿事件与值快照双重保护 | 排除无条件刷新/仅按route刷新；离开重进不刷新，旧结果不刷新 |
| 草稿边界 | 当前native input/textarea/select可跟踪，测试用DOM替身 | 编辑后恢复原值仍保守标脏，保留并提示用户 | 未覆盖富文本/画布；自动保存但不重挂载可能保守不刷新；需显式dirty接口扩展 |
| owner/vendor | 平台vendor已有上游当时没有的contextual Host路径 | Eidos创建通用helper；平台窄范围同步并接已有Host | 不整包覆盖，不把历史差异当本轮已消除；合并前定向治理冲突 |
| 会话与Run存储 | Conversation已有PostgreSQL；Run/receipt实际构造仍JSONL/memory、公开端口同步 | 保留AF-01/02，先设计异步Run/receipt端口再迁移；复用已有实时通道 | 不重做会话层，不将async数据库强塞sync端口，不另建第二套事件总线 |
| 学习/上下文 | 导入Recipe与EC经验已有独立角色，AF-02已有组装 | Recipe优先复用，学习保持评估门槛；补预算、来源、失效而非重复建设 | 不自动把所有聊天写成长效知识；跨租户学习默认关闭；向量库按测量增益决定 |
| 工作流/互操作 | 总纲仅参考Temporal/AG-UI/A2UI/A2A等 | 保留可替换端口，定向锁协议版本后再适配 | 未选择Temporal为强依赖，未声明兼容外部协议，不替代Eidos注册组件 |
| 验证与交付 | 实现存在、测试存在、CI、生产、人验是不同层 | 精确head记录CI；先隔离浏览器验B2，再进入持久化阶段 | 不以静态文档或单测关闭端到端/生产gate，不自行部署或改主线状态 |

## 3. 实施落点与接续路径

| 切片/结论 | 主要模块 | 已有文档/PR | 下一步 |
|---|---|---|---|
| PA-00静态盘点 | manager/server.ts（只读）、Run/Receipt store、conversation authority | PA00-BASELINE-AND-PA01A-SCOPE-20261010.md | 补实际环境、容量、恢复基线，源默认不能推断生产绑定 |
| PA-01A身份修复 | agents/enterprise-agent/thread-turn-action-handlers.ts；p1-7b测试 | 平台#575；PA01A-CONTEXTUAL-TURN-IDENTITY-20261010.md在实现分支 | 保持已有兼容/拒绝无副作用测试；集成前刷新main冲突 |
| PA-01B1协议 | contracts/agent-assistance.ts、agent-run.ts；assistance-request.ts；thread handler | 平台#577；PA01B1-ASSISTANCE-CONTRACT-20261010.md | 保持closed schema/大小深度限制，source revision不是写入后版本 |
| PA-01B2通用保护 | Eidos src/app-host/contextual-assistance.ts；index；localization | Eidos#142；docs/agent-line/PA01B2-CONTEXTUAL-ASSISTANCE.md | 真实DOM/浏览器验收；未来统一dirty provider |
| PA-01B2平台接线 | vendor/eidos/src/app-host/page-controller.ts、personal-agent-thread-chat.ts；workbench/shell.ts；durable-thread-chat.test.mjs | 平台#579；PA01B2-PAGE-ASSISTANCE-20261010.md | 验证button→side chat→后端→result→source，普通聊天不回归 |
| PA-01剩余体验 | Eidos标准提案/回执/复制/状态组件、插件入口 | 总纲§7、§9–12、§22、§26 | B2并不等于PA-01全完成；按真实场景补提案/采用/回执，不重复已有组件 |
| PA-02可靠执行 | async store、唯一键、租约/fencing/outbox、未知写入核验、cancel | 总纲§13–14、§18、§24；PA00记录 | 先明确端口与隔离DB恢复测试，避免直接改共享server.ts |
| PA-03至06 | 导入闭环、上下文、插件认证、企业运营 | 总纲§26工作包与§22验收编号 | 保留依赖门槛，不能仅按代码完成度推进试点 |

## 4. 冲突、修正与未确定事项

1. **状态文件滞后**：总纲研究时README/P1.4X、局部CP-05与TR主线有差异，EVO状态指针亦可能滞后。使用固定代码与权威handoff组合判断，不能拿历史阶段安排当前主线。本包未重新盘点2026-10-11全仓主线。
2. **旧说明CI_PENDING**：实现分支文档保留提交时状态；HANDOFF/PR中的精确head CI结果更新了验证状态，不为改一句状态反复触发实现CI。
3. **总纲“仅设计/未实现”**：它是历史快照；A/B1/B2后续已实现但未合入。该快照不应该改写成全部已实现，也不要沿用§29“只做PA-00”的旧下一步。
4. **owner与vendor偏差**：未证明上游Host整体等价，故仅同步helper。后续合并不能凭同名文件直接覆盖。
5. **PR集成状态**：2026-10-11核对#570与#575返回mergeable=false；#577/#579/#142返回true，均未合并。这里只是GitHub检查快照，未诊断具体冲突，不在交接任务中rebase、merge或解决他线改动。下一窗口先查并行PR和真实diff。
6. **外部资料证据深度**：14项来源有旧总纲摘要，但原始逐页阅读记录不能完整恢复；应保守待核，不补写虚假阅读日期/截图。S3及各动态规范优先核原文，再用于新ADR。
7. **仍待定**：Task是否首期独立表；数据库Run/receipt实际容量及迁移窗口；租约/取消与未知写入语义；保留/备份/数据区域；企业审批规则；上下文总预算；SLO/RPO/RTO；向量库/工作流引擎是否有必要；个人记忆采集边界。
8. **工期**：用户曾要求评估此级别Agent开发时间；本窗口没有可靠全项目工时基线，不承诺固定日期。首轮编码/CI速度不能外推真实浏览器、恢复演练、多租户和生产验收。逐可验收工作包估计并随证据校准。

## 5. 下一步最小验收计划

继续独立Agent线，使用#579堆叠分支及B1后端，在隔离环境准备可控导入作业和可延迟/失败的结果；先确认测试不连接生产或写真实企业数据。不要求为了测试先合main。

| 用例 | 观察点/应保存证据 |
|---|---|
| 干净来源页成功 | 真实按钮发起正确请求；返回严格关联；只刷新正确来源一次，读取结果不冒充写入凭证 |
| 已有及等待中草稿 | 分别修改输入再发起/发起后修改；返回后内容保留、提示可见，按钮恢复 |
| 导航离开后重开同route | mount变化后旧结果不刷新新页面 |
| 失败/暂停/取消/无关联 | 页面不刷新；不宣称正式Run取消已实现，取消终态可用测试桩验证 |
| 普通聊天/导入 | 旧普通聊天兼容；AI字段匹配来源/作业不串；二次Recipe复用不被新入口破坏 |

保存准确构建head、浏览器版本、运行命令/夹具、场景断言及失败日志；截图只作为辅助。若环境不能完成，明确阻塞原因，不关闭gate。完成后更新Agent HANDOFF，再推进PA-02A接口/存储设计。禁止顺便修改主线状态或2D功能。

## 6. 附件与未保存事项

核心设计、盘点、代码、自动化测试、实施说明、CI摘要和本交接包均在GitHub各自分支。没有待上传的已完成代码变更。旧总纲的Library副本不是当前执行状态权威。

未保存到GitHub：外部网页完整快照/PDF/截图、原始完整CI日志、本地临时TS转译产物。前两类只有原始URL及保留摘要；转译产物可由对应head源码重建。真实浏览器截图/报告、生产或DB恢复证据尚未产生，并非遗漏上传；不能暗示它们存在。未来重要且易失的原文应定向保存版本/章节/必要短摘录，遵循版权边界。
