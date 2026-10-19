# 导入目录轻量摘要接入：兼容性审核

本批实际涉及 `apps/data-import/page.ts` 的目录参数类型、`manager/server.ts` 的目录数据来源。目录渲染函数体不变，BEX #999 的草稿/字段映射实现未修改。

## 目标与完成条件

企业人员打开 `/data-import`，查看可用导入入口、当前企业历史并继续未完成任务。目录发现不创建各对象导入运行时；页面内容与原合同一致，后续实际导入仍需原权限/有效目标。

## 流程与步骤

原有效目标全量工厂解析改为manager已有有效贡献清单，目录只接受targetId与label摘要。原点击上传、继续映射/预检查和独立提交步骤不变，没有增加Agent对话或自动执行。

## 导航与信息架构

保留原目录路径、动作ID、对象目标排序、上传与作业路由。停用目标不显示新导入入口；历史仍保留，不能将已提交/部分提交作业错误标为可安全继续的草稿。

## 视觉与颜色

原Catalog Browser列表、单一主动作、状态文案、颜色与密度均不变；只收窄输入类型。没有新增CSS、token、图标或页面组件。中文/英文/未知locale回退输出与实际Counterparty运行时目标等价。

## 记忆与注意力

沿用持久Job/Recipe、未完成优先与原安全恢复规则。不要求用户重新上传或回忆映射，不把Host清单缓存当作用户草稿。真实HTTP验证已保存Job的继续链接与停用后的历史保留。

## 无障碍与跨年龄

沿用同一Eidos目录schema及响应式实现，键盘、焦点、文字缩放和触控目标没有修改。手机继续采用同一语义列表；未新增人工手机/屏幕阅读器验收，不将输出等价冒充真机签收。

## 安全与数据修复

有效贡献仍来自manager当前安装/激活状态。摘要不是授权；访问Job、执行导入和对象停止/恢复沿用既有边界。目录不调用describe/validate/commit，也不伪造这些方法。没有复制企业数据或新增存储，读取不修改Job。

## 证据与剩余问题

本地build与22项定向回归通过。新增协议测试比较真实Counterparty目标和manifest摘要在3种locale、空/未完成/已提交/部分提交组合的完整目录输出，并用Proxy拒绝目录读取业务运行时属性。真实隔离Host验证三目标目录、物料停用/恢复入口变化与全部恢复一致，随后模块清单仍无三个import-target；原后续供应商导入与三批持久化恢复回归保持。CI结果见PR，不声称生产部署/Human验收。

2026-10-17完整读取Eidos当前原文（分段补读被截断内容）：
- `docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md`，blob `eebd25cafb52d1f7ae032e83b5448f1f46b78646`；
- `docs/product/EIDOS-HUMAN-UI-DESIGN-REVIEW-CHECKLIST-v1.0.md`，blob `5110ed437dc2afc195b447de30aa4d3263b69c1c`；
- `docs/product/EIDOS-ENTERPRISE-NAVIGATION-INFORMATION-ARCHITECTURE-v0.1.md`，blob `5f748ec4e7f4e58cc20e4e7027d1014e56c85ce6`；
- `docs/product/EIDOS-PRODUCTIVE-DESIGN-LANGUAGE-v0.1.md`，blob `90cbf719773f0406e1a328e0214400a73d7d44ee`；
- `docs/product/EIDOS-BUSINESS-OFFICE-VISUAL-LANGUAGE-v0.2.md`，blob `9c63374376583983451244fa3e815e9d8b8cb765`；
- `MOBILE-DESIGN-LANGUAGE.md`，blob `854a77fc3d8387cf2f0a23af6cb3bfe83e0ad309`。

原始网址均为 `https://github.com/jiangxng/eidos/blob/main/` 加上述路径。采用理由：保留直接操作、就近继续、系统记忆及统一桌面/手机语义；本批无需引入新视觉模式。未访问这些文档引用的外部研究，不将间接引用标为已读。
