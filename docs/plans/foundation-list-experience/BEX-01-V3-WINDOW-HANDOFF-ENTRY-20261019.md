# BEX-01 / V3｜新窗口简短交接入口（2026-10-19）

> **新窗口先读本页，再读 [详细研究资料与决策索引](BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)**。本次为文档归档线，不覆盖历史研究、不修改业务代码、共享 Eidos、Host、`project.status.json`、Railway 或 PA05/治理并行工作。**每次接续仍须刷新 main / PR / CI / Railway**；本页状态是 2026-10-19 核验时快照。

## 本轮目标和用户明确决定

**直接按保存的 V3 高保真原型完成真实供应商导入的审核工作台，不是“多一个按钮、少一个按钮”。** 用户在本聊天提供四张局部对照截图，明确要求**高度还原背后的信息层级和决策逻辑**：异常优先、批次共同决定上提、来源与候选用途就地展开、机器建议并由人确认、同名字段按真实 ID 和业务用途辨别、企业扩展字段受控批准、状态引导下一步、原数据和 Human 选择可追溯。主流程“上传 → 核对并导入”对人简洁，但不跳过 Schema 权限、预检查与单独提交。

- **设计权威**：[原始 V3 HTML（#909 Draft 原型）](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html)。`#review`、`#mappingRows`、`#tableFilter`、`.actionbar`；原型 synthetic 数据和真实 Host 永远区分。
- **既有详细资料不重爬**：[2026-10-15 V3 源索引（#909）](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-UI-V3-SESSION-RESEARCH-INDEX-20261015.md)；main 内 [UI 认知研究](BEX-01-UI-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)、[导入流程研究](BEX-01-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)。查阅等级、网址、取舍、矛盾、截图位置、与工程关系均在本轮[详细增量索引](BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)。
- **用户四张对照图**：本聊天 `image(20261016-123851).png`、`image(20261016-123943).png`、`image(20261016-124020).png`、`image(20261016-124036).png`。研究索引 §4 有内容摘要及附件 ID；**原始 PNG 没有永久入 GitHub**，不要猜图或把临时 sandbox 路径当永久资产。

## 最新已核实的真实进度

| 阶段 | 精确证据 | 结论 |
| --- | --- | --- |
| 基线 | Platform `main@42ce894b4129089cbd8a270bd3473f0c93b7657b`；Eidos `main@6f51b6ce55798521c0c7be3fc69c2897aafc4297`；Railway Ledger Configurator production 同 Platform SHA **SUCCESS**（2026-10-19 核验） | 仓库/部署已核对，**不是用户登录后视觉签收** |
| 原映射页 E4 | [#973](https://github.com/jiangxng/EVO-App-Platform/pull/973)、[#978](https://github.com/jiangxng/EVO-App-Platform/pull/978)、[#981](https://github.com/jiangxng/EVO-App-Platform/pull/981) | 真实 /map 短样本/状态/多屏连续证据；手机合成测试 9139→7621px |
| V3 集中审核 | [#984](https://github.com/jiangxng/EVO-App-Platform/pull/984)、[#989](https://github.com/jiangxng/EVO-App-Platform/pull/989)、[#996](https://github.com/jiangxng/EVO-App-Platform/pull/996) **已合并** | 真实四列集中审核、选择即时状态/筛选/统计、就地受控字段方案预览 |
| 批次固定值 | [#991](https://github.com/jiangxng/EVO-App-Platform/pull/991)、[#993](https://github.com/jiangxng/EVO-App-Platform/pull/993) **已合并** | Human 明确选择合法 `subjectType` CONSTANT、Host 持久化与重开回显；存在真实来源列时禁止整批覆盖 |
| 草稿继续 | [#999](https://github.com/jiangxng/EVO-App-Platform/pull/999)，核验时 **OPEN**、HEAD `78aa43d666c24df848bf1b1fe795c381a9c389ef` | 并行 owner 正在做“保存草稿/恢复但不批准字段”，**未完成，不能重复开发或提前宣称已合并** |
| 去重与保全 | [#987](https://github.com/jiangxng/EVO-App-Platform/pull/987) **已关闭/未合并**；[原型 Draft #909](https://github.com/jiangxng/EVO-App-Platform/pull/909)、旧 #878/#846 仍开放 | #987 与已合入 #984 重叠，禁止复活；#909 只作为原型资产，不整体合并旧实现 |

## 决策边界和未决事项

已决定：Eidos 维护通用组件、状态/响应式和多动作契约；Platform 维护真实 Job、业务语义、schema/Host 权限、确认与导入。**不要从 SUPPLIER 推断 ORGANIZATION，也不要按“开户银行”同名合并实际不同 field ID。** 有来源列时对缺少主体类型的行逐条纠错；批次常量不是“仅填三条空值”。“不导入”是可逆本次选择，不删除 Excel 原始列。

**未完成（不能以 CI PASS 冒充 Human 签收）：** #999 的草稿权限/过期/重开及真实 Host 端到端验收；客户原 Excel `往来账户2026_10_08_10_15_23.xlsx` 和授权 Job 数据、两个同名开户银行 field ID/三行主体身份的当前状态；登录后 Railway 桌面与 390px 全页对照、底部 CTA、客户视觉最终认可、真实 Recipe/预检查/提交结果。原始四张用户截图二进制也未入 GitHub。

## 下一窗口执行次序与防冲突

1. **先核实最新** Platform/Eidos `main`、#999 的 HEAD/CI/是否已合并、Railway 部署 SHA。先读 [本轮详细研究索引](BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md) §2、§4、§5、§6、§7，不重做原 2026-10-15 外站研究。
2. 以 #909 V3 和四图的**信息/决策职责**验收 #984/#989/#991/#993/#996 的真实 Host 页面；若 #999 已完成，真实验证保存未批准草稿、跨页/权限/过期；若未完成，**不要并行改同批业务代码**。
3. 获得授权后核实客户原始 Excel、同名银行候选用途/实际 ID、三条主体类型纠错、Recipe 复用、schema Owner 批准、dry-run 失效与重新执行、最终确认导入和权限/审计；再请用户对 1280px/390px 真页面与 V3 视觉进行 Human 签收。
4. 仅针对剩余**实测差异**开独立 bounded 分支和 PR；不直接推 main，不切 Railway release，不删除开放 PR/有独有提交分支，不覆盖 PA05/治理或全局状态。

**资料缺失、来源状态、截图/Actions 附件与准确代码落点**全部以[详细参考索引](BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)为准。
