# BEX-01 V3｜M03–M04 本窗口简短交接入口（2026-10-19，自动续跑 #01–#05）

> **新窗口先读本页，再读 [本窗口详细研究与决策索引](BEX-01-V3-M04-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)，最后按需要查 [V3 前序完整参考遗产](BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)。** 这些是不同时间的快照，旧入口里“#999 OPEN”已经过时，不得覆盖历史文本来制造假连续性。
>
> **范围与保存方式：** 只保存研究交接文档；本分支不修改业务代码、`vendor/eidos/`、PA05、治理、Railway 配置或 `project.status.json`；不直接推 `main`。开始归档时 Platform `main@9b80babdc31fafbcb98f043fde01a6f388c7ce03`；Railway production / Ledger Configurator 部署同 SHA **SUCCESS**（GitHub/Railway 本次直接核验，2026-10-19）。此 SHA 是**归档起点**，不是保证未来始终最新；交接 PR 的最终 HEAD/合并 SHA 应读 PR 记录，下一窗口须重查。

## 一、不可改变的用户目标与已确认决定

完成 EVO-App-Platform / BEX-01 供应商导入 **V3 真正的 Human 审核工作台**，严格保持 **M01–M06 里程碑原范围**；每次报告完整进度状态表和剩余门禁，**不要需求偏移、扩展或为刷 PR 数补功能**。视觉与业务逻辑基准是 [#909 Draft 原型](https://github.com/jiangxng/EVO-App-Platform/pull/909)：异常优先、四列对应、来源样本及候选用途就地核对、批次共同决定上提、机器提议与人工批准分离、保存草稿可恢复、schema 新增须权限批准、独立预检查、最终明确提交。Eidos 做通用控件与响应式，Platform 做真实 Import Job/业务字段语义/Host 授权、导入和审计；不要复制原型私有 UI 或把业务规则写入 Eidos。

**必须区分的两类决定：** (1) 两个显示名称相同的“开户银行”可能是不同企业字段；首次自动规则及 Experience Compiler 经验推荐均不得按顺序或高置信度猜一个具体 fieldId，要保留原列，提供候选 fieldId/用途让 Human 明确选择；**已经 Human 确认且成功预检查的 Recipe 则可按原契约精确复用**。(2) `SUPPLIER` 是往来角色，不是 `ORGANIZATION` 主体身份证据；有主体类型源列且部分值缺失时需逐行纠错，不对整批擅自补值。所谓“不导入”是本次可撤销选择，不删 Excel 原始列。

## 二、里程碑状态（2026-10-19 归档快照）

| 固定里程碑 | 目前可证明的结果 | 准确判定 | 尚未完成的原门禁 |
| --- | --- | --- | --- |
| **M01** 四列审核、异常优先、即时反馈、响应式 | #973/#978/#981/#984/#989 已合并 | **工程完成** | 登录后最终视觉核对归 M06 |
| **M02** 批次主体类型与字段方案预览 | #991/#993/#996 已合并 | **工程完成** | 客户真实主体身份归 M04 |
| **M03** 草稿保存/重入/权限/失效 | [#1028](https://github.com/jiangxng/EVO-App-Platform/pull/1028) → [#999](https://github.com/jiangxng/EVO-App-Platform/pull/999) 合并 main `bdd5ee3b39465bd025a100582e40e7113653d041`；最后生产成功 | **工程和部署完成** | 真实授权客户账号与真实 Job 现场验收不能以隔离测试替代 |
| **M04** 两个银行字段与三条主体类型 | #1033（确定性防误选）、#1035（真实隔离 Host XLSX Stage）、#1037（EC 防误选）、#1039（人工确认 Recipe 复用）均已合并并通过对应 CI | **工程安全子项完成，M04 整体仍 OPEN** | 指定原 Excel、授权 Job、两个银行真实 fieldId/业务用途、三条实际身份确认 |
| **M05** Recipe、Schema、预检查、正式独立提交 | 已有隔离 Host 和 Recipe 回归 | **真实业务待验** | 权限、Schema 变化使预检失效、重新预检、幂等、最后明确 commit、结果审计 |
| **M06** 1280px/390px V3 业务/视觉 Human 签收 | #909 原型、合成 Chromium/CI 截图与当前通用 UI 证据 | **人工待签收** | Railway 已登录真实客户界面长页，对照用户四张原图并由用户确认 |

**总览依旧是 3/6 个工程里程碑已完成**；M04 的每一个新增回归都不能把整个 M04 错标为完成。

## 三、本窗口交付与链接

| 交付 | 合并提交 / 核证结果 | 业务影响 |
| --- | --- | --- |
| [#1028](https://github.com/jiangxng/EVO-App-Platform/pull/1028) → [#999](https://github.com/jiangxng/EVO-App-Platform/pull/999) | #1028 合进 #999 `fa5278c61acdd62cd1eb039055a8c4a9f1c3c032`；#999 合进 main `bdd5ee3b39465bd025a100582e40e7113653d041` | 旧批次页 `choice_N` 来源列身份/并发二次核验；草稿与批准分离 |
| [#1032](https://github.com/jiangxng/EVO-App-Platform/pull/1032) | `7238931ba6a223eee41f0d16ad8360e1e84d48b9` | 前序研究索引 §13 记录 M03 合并/部署和六行状态 |
| [#1033](https://github.com/jiangxng/EVO-App-Platform/pull/1033) | `9654da1736f69bf04235ee42350aad9e384ab5ab` | 唯一标签可建议；两个同名银行不按第一个/剩余字段猜选 |
| [#1035](https://github.com/jiangxng/EVO-App-Platform/pull/1035) | `0cb319e32f17f87b5cd18fe9f4fa5e107bbad28a` | 仅测试：隔离 Host / 172×22 合成 XLSX、候选 ID/用途、来源保真、不提交 |
| [#1037](https://github.com/jiangxng/EVO-App-Platform/pull/1037) | `65e970321017bbb022efad9a6ff1d2d9809a407a` | EC `advisoryOnly` 高置信度也不能提前预选同名字段；保留无歧义 EC |
| [#1039](https://github.com/jiangxng/EVO-App-Platform/pull/1039) | `3168a7e39f21fe1de30273fce5a4bfd04116c6ff` | 仅测试：Human 明确选择的同名银行 ID 经 dry-run 后被 Recipe 复用，绕过 EC，不执行供应商 commit |

CI 的 RED/GREEN run、实际源码路径、采用/排除理由、外站资料**历史查阅等级**与截图/附件位置在配套[详细索引](BEX-01-V3-M04-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)。**PR 合并和 Railway SUCCESS 仅证明代码与部署；不等于原客户数据、真实 UI 或业务签收。**

## 四、未决与下一窗口的唯一执行次序

1. **先刷新** Platform `main` 与 Railway 同 SHA、#909 原型是否仍 Draft、已合 PR/独立分支（不能按旧 handoff 的 #999 OPEN 作事实），读本交接包及原 [2026-10-19 总索引](BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md) §2–§5、§12–§15；**不重查已做完的广泛竞品研究**。
2. **M04 的真实证据优先**：找用户授权的 `往来账户2026_10_08_10_15_23.xlsx` 和对应有效 Import Job；核实两个“开户银行”的**真实字段 ID、用途、来源样本及人工决定**，再按原 Excel 的实际问题行核实三条 `subjectType`。**合成测试行 165/169/172 是合成夹具，不是客户真实行号。**
3. 若原文件/权限仍不可得，**保持 M04 OPEN**，只对已有机制做确有必要且不重复的证据核对；没有实测缺口不再产出探索性修复 PR。任何字段创建、数据写入、正式提交都须原授权/用户确认。
4. 在 M04 真实证据具备后，才按原 M05、M06 验证 Recipe/预检/提交与登录后 1280px/390px 全页 V3 Human 签收。报告固定六行状态，区分“实现/自动化/部署/用户签收”。
5. 开发若确有必要：独立 bounded 分支/PR；先比较最新 main 与其他窗口改动，不直接 push main、不改 Railway 到 release、不碰 PA05、共享 Host/Eidos owner 文件（除非任务明确协调）、`project.status.json`，不清理仍活跃的分支。

## 五、没有被 GitHub 本交接包保存的资料

**未取得并非漏上传成功：** 原客户 XLSX 二进制、授权 Import Job 的可审计真实数据、两个银行真实 field ID 和用途决策、三条真实身份修正、登录后 1280px/390px 完整页面和用户最终签收；原聊天四张 PNG 的二进制仍未永久进 GitHub（只保存文件名/附件指针/文字观察）。2026-10-15 的外站资料在前序研究索引有 URL 和阅读等级，**本次没有重新读取那些外站网页**。无需从不存在的来源推断具体客户内容。
