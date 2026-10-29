# BEX-01 V3 确认新增字段与预检查（2026-10-29）

> 用户 2026-10-29 截图显示“保存映射并预检查”后落入完整批次工作台。版本固定的 V3 原型为 `docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html`，`#confirm`、`renderPlan`、`#schemaConfirm` 是本次直接对照的 HTML/JS。UI 源码：`apps/object-extension/batch-page.ts`、`vendor/eidos/src/renderers/html/index.ts`、`vendor/eidos/src/design-language/productive-workbench-css.ts`。通用三列 Eidos 源独立送审 [Eidos #205](https://github.com/jiangxng/eidos/pull/205)，Platform 仅同步该模式的相应选定代码。Host 路由和动作：`apps/data-import/actions.ts`、`apps/object-extension/actions.ts`、`manager/server.ts`。

## 目标与完成条件

企业导入操作人核对即将创建的字段名称和类型，返回可恢复映射，确认后仅创建企业字段、保存映射并运行真实预检查。供应商数据仍由预检查结果页的独立确认动作提交。若某列未决或同名目标需核对，保持完整批次审核入口。

## 流程与步骤

映射页保存 → 完整决定进入确认页 → 三列检查 → 确认创建并预检查 → 真实结果页。未决列进入原集中审核工作台。创建后预检查异常返回映射页并保留已创建定义，重试复用字段，不宣称回滚。

## 导航与信息架构

确认页是单个导入任务的 contextual 步骤，无新全局菜单。面包屑和“← 返回核对”均回到同一任务映射页；成功进入同一任务的预检查页。`mode=confirm` 与 `mode=batch` 保持用途区分。

## 视觉与颜色

沿用 V3 的页面底色、正文、辅助文字、表面、边框、主按钮及焦点色，限定到本确认表单；复用 Eidos 表格、原生 Select、响应式卡片和 44px 触控目标。三列分别为 Excel 列、新增字段名称、字段类型；响应式不固定行高。

## 记忆与注意力

字段选择来自已保存的 Import Job 和当前操作者草稿。确认页只列待新增项，文件名、行列数仍可见。未决列不会被隐藏成默认忽略；类型可在当前行修改，不要求用户跨页记忆。

## 无障碍与跨年龄

表格有列头/行头，Select 保留可访问标签，焦点和键盘操作使用 Eidos 原控件；窄屏转卡片后仍显示字段名和类型，目标控件至少 44px。颜色不单独承担状态信息。

## 安全与数据修复

Host 仍校验企业管理资格、源列修订、字段类型、目标占用和重试幂等；`confirmAndPrecheck` 只是要求成功创建后运行服务端验证，不是授权令牌。原始 Excel 不变，导入提交仍独立。创建后验证失败时保留已保存映射并返回可恢复入口。

## 证据与剩余问题

源码级：已直接核对 V3 固定 HTML/JS。`npm run build` 与 BEX 导入/路由定向协议 37/37 通过。Eidos 选择性公共表格源码已在独立 Eidos 分支编译、设计语言测试 18/18 通过。最终 exact-HEAD CI、真实 Host 桌面/390px 浏览器结果、本地部署与 Human 实际操作状态需在 PR 中更新。不能用协议 PASS 声称 Human 100%。

## 页面模式与导航归属

Eidos 现有 Form / Review Table 工作页的 opt-in `confirmation` 三列表现，保留同一 Form 字段和 Host 命令。导航属于导入任务的 contextual 层；唯一主操作为“确认创建并预检查”。无新卡片入口或技术枚举。

## 功能、布局、颜色对照

功能：V3 `#confirmBack` 回核对、`#schemaConfirm` 创建后预检查；真实 Host 对应回映射、字段创建/映射后 dryRun，提交供应商数据仍在下一步，待真实操作核验。

布局：V3 `#confirm` 三列、无四指标/重复映射表/方案预览；真实确认页采用三列表、文件事实及返回/确认底部操作。Eidos 壳层不同于原型演示顶栏；桌面与移动截图待取得。

颜色：V3 `--page/#f5f7fa`、`--text/#172b44`、`--muted/#6a7c91`、`--line/#e3e9ef`、`--primary/#2563a6` 和 `--focus/#73aaf4` 已限定到确认表单；浏览器像素与对比度复核待取得。

## 入口、退出与恢复矩阵

| 上下文 | 入口 → 动作 → 目标 | 返回父级 | 异常恢复 |
| --- | --- | --- | --- |
| 有管理资格、完整映射 | `/map` 保存 → `mode=confirm` → 创建并预检查 → `/review` | 确认页返回 `/map` | 验证失败回映射；源修订失效拒绝创建 |
| 有管理资格、仍有未决列 | `/map` 保存 → `mode=batch` → 完整审核 | 返回 `/map` | 不能把未决列静默忽略 |
| 无企业管理资格/个人上下文 | 原 Host 权限门禁拒绝 | 原页保留 | 不创建、不 dryRun |
| 中途取消/重复提交 | 确认页返回映射，或重进确认页 | 同一 Import Job | 已创建字段可幂等复用，原始行保留 |

入口：`tests/protocol/data-import-human-experience.test.mjs` 区分完整与未决选择的路由；`tests/protocol/bex01-v3-wide-route-focus.test.mjs` 覆盖确认路由。

退出：`tests/protocol/bex01-batch-extension-import.test.mjs` 校验同一任务返回入口和确认后 `/review`。

异常恢复：既有批次测试覆盖无资格、未决列、部分创建后重试；本次新增确认路径在创建后验证失败的回退还需真实 Host 浏览器证据。

## 浏览器与 Human 证据

桌面：尚未取得本变更 exact-HEAD 真实 Host 截图，待浏览器回归。

移动：尚未取得 390px 真实 Host 截图，待浏览器回归。

Human：当前用户截图是修复前缺陷证据；修复后需要用户在本地实际任务中确认，未签收。
