# EVO 企业页面完整往返体验纠偏（2026-10-28）

> **事实等级**：U = 用户已登录东京预览截图与反馈；P1 = 本窗口实际读取 GitHub 主干代码、Eidos 契约与已有协议测试；代码回归和 CI 以本 PR 准确 HEAD 重新验证；Human 仍待复验。跨插件规范权威仍是 Eidos；此处是一个 M0 Human UX 不合格项的定向修复，不增加权限 M1/M2/M3 功能。

## 目标与完成条件

- U 实图一：新版“我的企业”仍将“归档企业”和“进入企业”挤在同一卡片的动作栏，并让归档解释换行占据主操作区域；企业状态/默认状态反复出现。用户指出按钮摆放需要整改。
- U 实图二：用户选择“进入企业”后，页面没有“返回我的企业”；首页显示“薄资源容器”“插件操作资源”“enterprise ID / Context ID / ACTIVE / OWNER”等研发术语，缺少实际业务价值和正常任务返回。
- 目标不是替用户列出所有页面 bug；开发必须一次性验证 **入口→操作→后续页面→返回→错误恢复**，把失败作为交付门禁，而非每次靠用户撞到死路。
- 范围：只改 `apps/enterprise-context-governance/context-page.ts` 企业目录与概览结构，复用 Eidos 现有 CatalogBrowser `list/compact`、`contextNavigation`。不动权限 Provider、企业数据、Host/Eidos 共用运行时、真实部署配置及并行 owner。

## 流程与步骤

| Human 路线 | 进入 | 退出 / 返回 | 操作与安全性质 | 回归证据 |
| --- | --- | --- | --- | --- |
| 企业目录 → 企业概览 | 企业记录的“进入企业”执行原 `enterprise.context.select` | Eidos `我的企业 › 当前企业` 面包屑含 `/enterprise-contexts` 按钮，移动端有独立父级返回 | 不变更服务端身份及上下文切换授权 | `tests/protocol/enterprise-context-human-journey.test.mjs` |
| 目录 → 创建资格 → 目录 | 已上线 M0 的“查看创建资格” | 原 #1135 “返回企业列表” | 只读预检；上下文不可用不冒充被撤权 | 沿用 `tests/protocol/enterprise-create-eligibility.test.mjs` |
| 目录 → 创建企业 | 仅原资格允许时呈现创建入口 | 原表单仍待跨插件统一流程评审，不能假冒已验收 | 创建提交仍独立授权与确认 | 先前协议+需要真人页面 |
| 目录/概览 → 低频管理 | 目录专注“进入企业”，归档/设默认移动至当前企业概览的“管理操作” | 面包屑返回目录 | 归档仅 OWNER 看见、命令继续需确认；设默认仍保留原命令 | OWNER/MEMBER/default/non-default 矩阵 |

## 导航与信息架构

- 按 Eidos Navigation & IA，业务列表是目的地，企业概览是该目的地的子旅程。不能用浏览器后退按钮代替产品的返回路线。
- 使用 Eidos 现成 `contextNavigation.items` 的 `我的企业` 路由；其渲染器同时提供 desktop breadcrumb 与 mobile 父级按钮，非插件另造 navigation CSS。列表项仅保留“进入企业”主操作。
- 不因新增一个页面，自动增加全局主导航或在设置里制造重复入口。权限 M2 平台管理仍未开始。

## 视觉与颜色

- 企业目录 `layout:list`、`density:compact`，减少单企业一张大画廊卡的空旷感；入口动作专注主要任务。
- 概览使用业务名、状态、当前身份、企业代码，移除默认 UI 可见的内部 ID 和 `薄容器`、`插件操作资源` 开发说明。低频管理动作独立一组。**没有新增任何 CSS、token、颜色或插件私有视觉体系**。
- 是否达到最终 V3 品质必须通过 1280px 桌面、390px 窄屏、中文实体页面查看；代码与 CI 不能自动宣称视觉 Human PASS。

## 记忆与注意力

- 当前企业名、默认企业、身份在概览当场可见；无需记忆上一屏的 ID。
- 用户能通过“我的企业”父级返回企业列表，原 Context 切换仍保留服务端管理，不能另建一套客户端缓存伪造上下文。
- “进入企业”与归档等高风险动作物理分离；不再要求用户避开邻近按钮才能完成常规任务。

## 无障碍与跨年龄

- 使用 Eidos `contextNavigation` 已有语义导航和桌面、移动返回 affordance，不引入新键盘事件/手势。
- 实机键盘焦点顺序、390px 控件可见性、中文字体放大、读屏等仍待浏览器级实测；仅静态 DOM 无法证明通过。

## 安全与数据修复

- 原 `enterprise.context.select`、`enterprise.context.archive`、`enterprise.context.default.set` 与输入参数 `targetContextId` 不变；OWNER 条件控制归档按钮可见性，权限后端独立执行。归档仍 `requiresConfirmation:true`，保留历史数据/审计，不自动提交。
- 不变更共享 demo-user 的任何权限、不创建/删除企业、不接触 Railway/PostgreSQL/持久卷、不放宽 CI 或 Docker 限制。真实企业资产不得用截图试验归档。

## 证据与剩余问题

- U：本次用户发送的“我的企业”和进入企业后的截图（存在于对话附件，未伪造仓库附件位置）。
- P1：GitHub `apps/enterprise-context-governance/context-page.ts`，Eidos `catalog-browser/contracts.ts`、`render.ts`、`navigation/context-navigation.ts`，`manager/server.ts` 当前 overview 只验证 ENTERPRISE context；旧 `tests/protocol/enterprise-create-eligibility.test.mjs` 仅检查目录→资格页，没有检查目录→概览→返回，**这是测试覆盖缺口**。
- 新回归测试 `tests/protocol/enterprise-context-human-journey.test.mjs`：分别验证目录的唯一主动作、概览两端的返回导航、无原始 ID/术语、低频管理原指令及授权矩阵、overview 别名路由复用。**以 exact-HEAD CI 结果为准**。
- 新版部署、真实浏览器桌面/手机、人类验收在代码发布前均**未取得**，M0 Human 保持失败/待修复；不可宣称完整平台权限已交付。

## 页面模式与导航归属

- 页面模式：Eidos CatalogBrowser LIST/COMPACT，子路由用 Eidos `contextNavigation`；不复制 BEX V3 HTML 或 CSS。列表页的主动作“进入”，概览页的低频管理独立在管理操作区；未来其它插件应照此确定角色、入口、出口，而不是照搬卡片数量。

## 功能、布局、颜色对照

- 功能：新增完整入口→概览→返回路径测试；权限和企业写入契约不变；需在 CI 和真人验证。
- 布局：原目录 card/grid 导致操作堆积；修复为已有 list/compact 与概览 parent navigation；需桌面/手机实际截图。
- 颜色：只使用 Eidos token 和状态语义，没有定义新颜色，具体色彩体验待 Human。

## 浏览器与 Human 证据

- 桌面：旧版两张真实截图为不合格证据；修复版未登录实测。
- 移动：390px 浏览器证据未取得。
- Human：**未签收**。不因 CI 文档存在或源码测试通过而提升状态。

