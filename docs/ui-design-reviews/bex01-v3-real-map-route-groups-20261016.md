# BEX-01 V3｜真实 /map 页面紧凑审核修正（2026-10-16）

**触发证据：** 用户线上 `https://ledger-configurator-production.up.railway.app/#/data-import/jobs/<job>/map` 的真实截图仍旧展示“原始样本一个输入、映射下拉一个输入、重复的逐列创建入口”。[Eidos #187](https://github.com/jiangxng/eidos/pull/187) 和 [Platform #957](https://github.com/jiangxng/EVO-App-Platform/pull/957) 的部署虽然成功，但 #957 只更新了独立 `/object-extensions/from-import?job=...&mode=batch` 页面，未改用户正在使用的 `/map`。先前称“线上新页面已实现”只对专门的 batch route 成立，不能算 /map Human 验收。

## 目标与完成条件

用户在真实 `/data-import/jobs/:importJobId/map` 入口快速核对全部来源列；每列只需看到一个紧凑分组中的**原表头、原值样本、非空数量和始终可操作的映射选择**。必要时展开原始样本及同名目标用途。保留原 Job、Recipe、所有表头与原始行，并保持原字段映射保存及独立数据提交命令不变；不能仅验证另一个路由。

## 流程与步骤

原：`/map` 中未映射列先显示额外 readonly 原始样本输入框，再显示映射 select+创建字段链接，20 多列重复。新：同一路由生成 Eidos `reviewGroups`，一列一行，映射 select 是 group.primaryFieldKey，Host 原始值计数/最多三样本显示为摘要，额外证据折叠或默认在有歧义时展开。工作流仍是上传→映射/批量审核→预检查→明确提交，批量创建仍需直接到受权的 batch route 操作；不通过折叠动作写入企业字段。

## 导航与信息架构

不改变当前 `/map` 路径、路由 ID、page kind、Workbench 活动或已有命令。专用 batch 审核入口继续保留在 `contextNavigation` 和现有 `contextLink`，但移除过时的“（B 方案）”文案。当前 Job 与 AI 自动匹配行为保持，用户不需要迁移到另一个路由才能看到紧凑源列。相关 Platform owner 为 `apps/data-import/page.ts`；不是 Eidos 内部业务页。

## 视觉与颜色

直接使用已交付的 Eidos 公共 `reviewGroups` Form 和 Design Language CSS（[Eidos #187](https://github.com/jiangxng/eidos/pull/187)），**不增加任何 Platform 私有 CSS，不复制高保真 HTML 原型**。分组行的标题/摘要/主要选择清晰对齐、桌面双栏、390px 单栏，长样本换行。Eidos 继续只负责通用布局/渲染。

## 记忆与注意力

摘要始终在原来源列选择旁可见，避免反复回忆前一页表头/样本；保留同一列的 `map_N` 输入名和已有映射选择、字段候选 ID、排他选择组；经刷新和另一个页面返回时，依照当前 Host Job 重建所有分组，不用客户端内存冒充持久化。具同名目标/旧 field ID 不可用时默认展开详情辅助 Human 判断，不自动从同名猜 ID。原文表头、源值、映射来源及 AI 建议继续可用。

## 无障碍与跨年龄

主要 select 在 `details` 外直接可操作，辅助信息在原生 summary 下以键盘/触屏展开，所有表单字段依旧由 Eidos 输出 label；内容不靠颜色区分。真实 Host 使用 Chromium 桌面与 390px Touch 模拟同一 `#/data-import/jobs/.../map`，核实分组、输入值/原始样本、正文与无横向溢出。Chrome 模拟不替代用户真机或真人验收。

## 安全与数据修复

`DATA_IMPORT_REVIEW_COMMAND_V010` 以及 `data-import.stage-file`、批量字段创建、独立提交、Host 认证/授权、原始行修正与撤销的执行代码全部不修改。Eidos 通用 Validator 拒绝重复和无效 group key；应用只是为它提供真实被授权的数据与已有 form field key。不自动决定真实客户同名“开户银行”或三个缺少 `subjectType` 的业务身份。

## 证据与剩余问题

- 真正修复文件：`apps/data-import/page.ts`；本来已经拥有该场景的唯一 Form `evo-data-import.mapping`。
- 协议测试：`tests/protocol/data-import-human-experience.test.mjs`，4列样本保留、Eidos 4分组、每 select 只出现一次、上下文 batch 链接、旧字符串移除、无数据变更。
- 真实隔离 Host 端到端：`tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py`，**必须明确访问真实 `/map` 路由**、172行22原始列、桌面/390px手机分组与可展开详情后，再继续 18 组 batch 字段审核和供应商创建/数据留存证据。以前 #957 只检查 batch route 的局限在此补齐。
- 验收分级：最终 PR HEAD CI 必须 PASS、最新 main 复查、合并后 Railway `main` 部署 SUCCESS 才能说“线上已更新”；客户这一实际 Job 的 UI Human 签收仍需用户亲自验收。
- #909 Draft 高保真原型和其他业务交互尚未全量实现；此处是对实际页面的精确修复，不能虚称已实现 V3 全部设计。
