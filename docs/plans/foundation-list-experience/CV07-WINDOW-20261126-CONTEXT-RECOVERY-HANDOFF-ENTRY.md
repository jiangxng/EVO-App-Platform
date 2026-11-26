# CV07 / List Foundation — 2026-11-26 旧窗口恢复接续入口

**START_HERE / CONTEXT_RECOVERY / HUMAN_NOT_SIGNED**。先读[详细恢复索引](CV07-WINDOW-20261126-RECOVERED-RESEARCH-DECISION-INDEX.md)，再读[11-25导入交付](CV07-WINDOW-20261125-EIDOS-DICTIONARY-IMPORT-DELIVERY.md)、[11-26 UI评审](https://github.com/jiangxng/EVO-App-Platform/blob/44da0a35ccf3191d90b9817fc21ffa667628a3b7/docs/ui-design-reviews/CV07-DICTIONARY-HIERARCHY-IMPORT-20261126.md)和[11-19原研究索引](CV07-WINDOW-20261119-RESEARCH-REFERENCE-INDEX.md)。只新增本工作线文档，不覆盖旧窗口记录。

## 当前基线
- 本轮读取受保护 main @ 44da0a35ccf3191d90b9817fc21ffa667628a3b7；[#1379–#1384](https://github.com/jiangxng/EVO-App-Platform/pull/1384) 均合并（逐个链接见详细索引）。#1384 exact HEAD 55成功/5跳过，main返回30成功，协议1521 tests/1520 pass/0 fail；[东京部署](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45745953221)、[只读巡检](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45746378713) 成功，实际运行同SHA，字典与导入均 active；Item active 但无实际资源样本。
- 用户要求：Eidos 既有设计语言、PC 优先而非手机降级、List Foundation 通用导入、完整三阶段导入、核对默认字段、父子字典与编辑。Owner/Host/Eidos 边界及草稿与发布隔离不变。
- 已实现：共享列工具条/桌面布局、列表范围导入选项、动态空白 CSV 模板、字典 CSV/XLSX 目标、来源别名/状态精准表头别名、独立确认导入、多层 parentCode 及编辑、预检与最终树校验。旧CSV七列中的选项主键未定义，不能猜测。
- **尚未完成：** 原193行文件没有实际导入证据；Human未签；合法企业会话、PC/390px真实视觉、权限/编辑/发布验收、Item真实样本和独立开发者接入仍缺。旧聊天全文、原截图及CSV未找到，保留可恢复摘录/评审/PR/日志；外站历史索引不重新查阅或冒称原文。

## 下一步（按优先级）
P0 真实193行批次：明确主键含义，核对映射、预检查、独立确认、草稿/发布分离与实际结果。P0 字典父子及权限/拒绝/返回回归。P1 PC 1096/1280/1440及390px人验，模板与其他列表共用路径。P1 仅必要时定向核查上游 Eidos 差异；不要重复开发已合入功能。完整CV07退出仍需要Item合法样本与独立开发者验证；不将收费模型作为本切片阻塞，不开正式CV03/CV04/OIDC/PA05/Agent WRITE，不触碰#1184。

## 治理
main 为唯一集成主线，受保护，不直接 push。按已有11-19交接治理，以最短独立 docs PR 承载恢复文档，Draft→准确HEAD CI→Ready→普通 merge；仅 docs 可合法跳过物理部署，合并后精确分支清理。新窗口先刷新 main/PR/部署SHA，不把本次文档提交当实际运行镜像。本文不预写本交接PR的CI/合并结果。