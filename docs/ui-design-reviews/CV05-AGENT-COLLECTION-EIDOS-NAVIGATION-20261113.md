# CV-05 — Personal Agent Collection READ → Eidos Chat 列表导航（2026-11-13）

> 本文为同 PR 的**设计审查与可复验自动证据**，非 Human/手机截图签收。严格复用 Eidos Chat v0.2 原 `proposal/actions` 结构与 `page-controller.ts` 已有 `data-eidos-chat-action` 受控导航通道，没有新增组件/配色/独立 List UI。

## 目标与完成条件

自然语言驱动的 Personal Agent 经现有 `search/describe` 与 CV-05 `evo.collection.read.preview` 实际 Host-Authorized READ 后，应当在当前聊天中看到清晰中文“有权列表查询结果”和“在列表中打开”按钮；点击只进入原 Business Dictionary / My Customers / My Suppliers Eidos 页面，由页面端重新读取并验证企业和权限。仅符合 `kind=evo.personal-agent-collection.read-preview`、`authority=PRESENTATION_ONLY_REAUTHORIZE_ON_OPEN` 的当前**成功** READ 可见按钮；失败、撤权、未知 Operation、伪造 URL 不出现。

## 流程与步骤

用户在现有 Personal Agent Chat 发出集合查询请求；模型按现有 Capability 工具发现并描述当前授权 Collection，生成受限结构化查询；真实 Owner ActionRouter 执行 READ 并返回有界页面；已合并的 CV05 预览适配器返回 Eidos route；本 PR 只补 `reply-presentation.ts` 的 Eidos Chat 交互卡。用户点击后原 Eidos `data-eidos-action-type=navigate` 机制前进到该业务列表；URL 仅表示查询状态，绝不授予数据权限。

## 导航与信息架构

入口仍是 `/enterprise-agent` 原 Chat；目标限制为 `/business-dictionaries`、`/counterparties/my-customers` 和 `/counterparties/my-suppliers`。不新增全局菜单、第二路由或平行详情；退出/返回沿用原 Eidos Workspace 浏览历史和 Domain 列表 Detail returnTo，不能在 Agent 侧缓存企业凭证。

## 视觉与颜色

使用现有 Eidos Chat `proposal` 的原 action 按钮，沿用 Eidos Productive Design Language 字重、间距、圆角及主动作色；无自定义 CSS。中文主文案是“有权列表查询结果”“在列表中打开”，根据 Locale 提供英文、日文回退。Card 只展示服务端精确计数与页码，不把 JSON/私密单元格当屏幕文案。

## 记忆与注意力

用户不需复制粘贴列表 URL，也不需要重输过滤条件；route 保留已核验的 Search、Sort、View、Page、PageSize。若 LLM 文本意见与 Owner 实际结果冲突，行动卡只从真实 Host 工具 Observation 生成，提示“打开时重新核验”，而不是承诺缓存数据永久可见。聊天 Context 切企业后旧链接不会突破当前授权；下一次读取有权范围会重新判定。

## 无障碍与跨年龄

复用 Eidos 原生 `button type=button`、带文字的 navigate 动作以及键盘 Enter/Space；不自己建立键盘监听。中文操作词明确、含义可辨；真实屏幕阅读器及 390px 手机触控/焦点顺序**尚未实测**，标记 HUMAN_PENDING，不以 DOM 回归冒充物理验收。

## 安全与数据修复

- Chat 只消费 **最新的同工具 Observation**；后续失败/撤权不可复用较早成功链接；Host 当前企业、Feature、READ 权限及业务行/字段限制保留。
- 校验 observation tool ID/effect、result kind/version/operationId、navigation kind/authority、精确计数及 Eidos 预设 pathname，拒绝外域、`//`、反斜杠、hash、未知/重复 query 字段。Eidos/Domain 仍以重新执行实际 READ 决定权限，不以按钮或 URL 为授权凭据。
- 该 Chat 结果不含真实业务 WRITE/保存/全量 EXPORT：`CV03 HUMAN SAVE=OFF`、`CV04 formal EXPORT=OFF`、`N1=NOT_CERTIFIED` 不变。
- 出错时不生成新跳转卡、不改变业务对象；保持聊天失败 Activity，并通过原 Host 重新读取纠正。

## 证据与剩余问题

源码已读：`agents/enterprise-agent/reply-presentation.ts`、`agents/enterprise-agent/collection-read-preview.ts`、`vendor/eidos/src/chat/{contracts,render}.ts`、`vendor/eidos/src/app-host/page-controller.ts`；已合并的 #1314 Real Owner READ/负面用例。
新增机器证据：`tests/protocol/cv05-agent-eidos-collection-navigation.test.mjs` 的真实 Eidos DOM Render/路径白名单与拒绝矩阵；`tests/integration/cv02-personal-agent-authorized-collection.test.mjs` 真实 My Supplier Owner/ActionRouter/Chat Render 纵切。最终精确 HEAD Actions 结果以 PR 原始 Logs 为准。未获得真实登录 LLM/Human 390px 实测，不宣称 PRODUCT/HUMAN_PASS。

## 页面模式与导航归属

Personal Agent Chat v0.2（Eidos 原消息卡片）→ 原 Catalog Browser/Counterparty Projection 列表；没有其他应用层 UI。链接不属于公开路由鉴权策略，所有数据仍由目标业务 Plugin Owner 负责。

## 功能、布局、颜色对照

功能：已有原 READ/预览结果 + 新增可点击原 Eidos 导航。布局：卡片跟随原 Chat Message 的 Evidence 与 Proposal，窄屏使用原响应式容器。颜色：保持 Eidos Design Tokens，无私有色。未取得截图，故无像素还原声明。

## 入口、退出与恢复矩阵

| 入口 | 正常结果 | 退出 / 返回 | 异常恢复 |
| --- | --- | --- | --- |
| 已授权 Dictionary READ | Chat 看到“在列表中打开”，打开原字典当前 View/Search/Page | 原 Eidos 目录及浏览历史导航 | READ 失败/撤权后无新行动卡，刷新页面仍重审授权 |
| 已授权 My Customers/Suppliers READ | Chat 显示有权精确计数，进入原“我的”视图 | 原 Counterparty 详情 returnTo / 列表 | 企业切换后只见新企业当前有权记录或空列表 |
| 未知/伪造/外部链接 Observation | 不生成点击动作 | 留在 Chat | Host 错误 Activity，不能跳外域 |
| 插件停用/Owner 拒绝 | 不生成新卡，旧卡也非权限凭据 | 留在 Chat | 重新安装/恢复权后必须再次查询 |

## 浏览器与 Human 证据

桌面：机器断言使用真正 Eidos Chat Render 及已有按钮契约；实际已登录 Chrome 人工操作待验。
390px：现有 Eidos Chat 布局理论复用；无实时手机录屏/截图，不标 PASS。
Agent：真实模型的自然语言选择、误识别率和完整连续工作流仍待真实可授权会话验证。
