# BEX-01 / CP-03 扩展字段体验：新窗口简短交接入口（2026-10-15）

> 本文是**可执行的接续入口**，详细来源、冲突、阅读状态、证据与比较见同目录 [BEX-01-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md](BEX-01-RESEARCH-DECISION-REFERENCE-INDEX-20261015.md)。既有专项进度见 [BEX-01-INLINE-EXTENSION-DISCOVERY-20261014.md](BEX-01-INLINE-EXTENSION-DISCOVERY-20261014.md)；原扩展字段完整交接在 **Draft PR #846** 分支，不可仅阅读 main 的旧版文件。批量方案原始决策见 **开放 PR #878** 的 [BEX-01-BATCH-EXTENSION-REVIEW-20261015.md](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-batch-extension-review-20261015/docs/plans/foundation-list-experience/BEX-01-BATCH-EXTENSION-REVIEW-20261015.md)（目前尚不在 main）。

## 1. 当前任务与不能再重做的部分

**唯一剩余产品目标**：把供应商 Excel 导入从“逐字段创建→返回→继续创建”升级为 **已有字段优先复用、未匹配业务字段一屏建议/编辑、一次确认批量创建并自动映射、再执行 dry-run 与明确提交**。首要实测场景：已经完成“默认支付方式”的单字段闭环，接着需要同时处理“结算方式”“默认账期方式”“账期天数”；不能让用户再逐列重复跳转。

已完成的功能不要重做：供应商表格、分页、移动布局、导入返回、单列就地创建入口、来源列和字段名自动预填、创建后返回自动选中、按唯一同名字段复用、重复定义保护。单列流程用户已实测并明确认可“默认支付方式”，但 **单列可用并不代表整表导入体验签收**。

插件平台与其他窗口边界：BEX 仅负责供应商页面、数据导入与扩展字段用户体验；Eidos 负责通用控件；PA-02 负责个人 Agent、异步执行及 Object Extension Owner 存储；不修改 project.status.json、docs/roadmap/HANDOFF-LATEST.md、docs/agent-line/** 或其他窗口的业务/共享 Host；不引入 Item、Warehouse、BEX-02、通用自由建表、BI 或物理分页优化。原交接 PR #846 保持 Draft，**不得顺手合并**。

## 2. 最新技术与验收快照（需在新窗口重新查询）

- 仓库：https://github.com/jiangxng/EVO-App-Platform
- 创建本交接分支所依据的 main：**991ac3e030884b69586b3c1732db9953dc17ef91**（2026-10-15 查询快照，不是永久最新 HEAD；主线并行推进很快）。
- 本交接独立分支：**docs/bex01-research-decision-handoff-20261015**；只提交本专项新增两份 docs。其准确最后 HEAD 以 GitHub PR/新窗口指令核实。
- **PR #866** https://github.com/jiangxng/EVO-App-Platform/pull/866，分支 fix/bex01-unique-target-mapping-20261014，HEAD **1f8badc5fafad3071ee3dfc8d2ac2c1c915d774f**；截至交接查询仍 OPEN、未合并。实现“一目标字段只能给一个来源列选择；选中即从其他下拉消失；释放后恢复；忽略可多列使用”，并在 updateMapping/dryRun 拦截重复目标。其 BEX Chromium、Platform、Continuity 通过；**Agent PA-01B2 Full Isolated Chrome Host Acceptance 与 Cross Project CI - Trading Lite Eidos Browser EVO 两项失败，尚未有合格归因/清障证据，不能宣称全绿**。Eidos 通用 exclusiveSelect **PR #182 已合并**。避免与 #866 并行修改 apps/data-import/page.ts、service.ts、vendor/eidos/**。
- **PR #878** https://github.com/jiangxng/EVO-App-Platform/pull/878，分支 docs/bex01-batch-extension-review-20261015，HEAD **93a2d543a98c24985f066ed34c2db72451bb0e11**；截至查询 OPEN、未合并（CI 已通过但因 main 继续更新而显示 behind）；保存了上一轮批量交互研究与方案。无需重新做已有研究，也不要把 PR 已通过的 CI 写成已合并。
- **PR #846** https://github.com/jiangxng/EVO-App-Platform/pull/846，Draft，分支 docs/bex01-cp03-extension-handoff-20261014，HEAD **08c48d682d5a3795e23593c0b3bb11edd7b6cc20**。重要资料：BEX-01-EXTENSION-USER-CLOSURE-20261014.md、REFERENCES.md（S10–S13），及 BEX-01-IMPLEMENTATION-20261014.md、BEX-01-IMPORT-NAVIGATION-AUDIT-20261014.md。
- Railway **是项目开发测试环境**，服务网址 https://ledger-configurator-production.up.railway.app/#/counterparties/suppliers（环境技术名称 production 不代表业务正式生产）。固定发布分支 **release/bex01-dev-20261014** 目前指向 **8b7e2cc9e12c13e6086803e5b6f81d78833e7069**；Railway deployment **35bdd1c5-3f85-475a-9174-05265cc8548d** 为 SUCCESS。**#866、#878 和本交接均未部署**。用户已授权在原 Railway 开发环境部署 BEX，但新 PR 仍须先验证并合并，部署要选择准确固定提交，避免自动跟随移动中的 main 包含 PA-02。
- 用户原始 XLSX **往来账户2026_10_08_10_15_23.xlsx** 尚未由本窗口取得可程序操作的文件；用户当前浏览器曾见 Import Job **import-0c89df2e-c4e1-40ce-b96b-a4a341bd69a2**（截图可见）。不能假定该作业仍在相同状态，需用户实际页面确认。

## 3. 固定产品决定（不是新提议）

1. **已有字段优先**：先检查成功复用的 Recipe / 已保存映射、有效 Schema、目标业务字段；唯一且合理的匹配可以直接作为建议。名称相同但有歧义或目标已占用时，必须让 Human 处理。
2. **未匹配业务列建议新建，不静默写入**：在映射页批量预览来源列、建议动作、建议业务名、候选类型和必要的脱敏样例。文本可保守默认；“账期天数”应建议数字但由人确认；Excel 的“系统编码”、日志、历史标记等不是自动新增企业扩展字段的理由。对模糊/敏感列显示“需要确认”而不是自动保存。
3. **一次确认，多项创建与映射**：Human 一次审核全部候选、调整忽略/已有/新建，确认后由已有 Object Extension Owner 按权限持久化字段；直接把相应来源列映射到实际新字段。可重试、不生成重复字段，局部失败必须显示已创建部分并可恢复；不得未经核对删除历史两条同名“开户银行”。
4. **一对一系统目标约束**：一个系统目标字段不能被同次导入两个不同 Excel 列重复选用；在 UI 上选中即从其他下拉消失，取消/替换后恢复；“忽略此列”可复用。服务端同样校验，Agent/API 不得绕过。先让 #866 收口再实施批量。
5. **Agent 不阻断手工流程**：保留 ai-auto-map / taskKind=data-import.mapping / importJobId / targetId / refreshSourceOnComplete，不顺手修改 PA-02。Agent 仅提供建议，仍须人类确认及 Owner 规则。
6. **核心规则不变**：原 Excel 有 **3 行 subjectType（主体类型）缺失**。它是基础对象必填身份，与 SUPPLIER/“往来类型”不同；不得自动由“往来类型”推断，不得通过扩展字段绕过。字段创建≠真实供应商导入；dry-run 与明确 commit 仍独立。

## 4. 固定验收进度表（当前专项）

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| 单列创建：来源、名称预填，返回自动选中 | ✅ 已部署，用户已验证 | 保留例外入口，不再做重复开发 |
| 一对一目标字段选择/释放/后端防重复 | ⏳ #866 开放；BEX 回归 PASS，跨项目检查有 2 项失败 | 定向查看失败日志、判断与 PR 的因果，处理门禁后合并 |
| 批量“已有/新建/忽略/需确认”建议页面 | 📋 方案已定，尚未实施 | 在 #866 合并基线上做 BEX 专项 PR |
| 批量一次创建并自动映射、失败可恢复 | 📋 尚未实施 | 先定原子/幂等和重复保护，完成 Host+Chromium 实测 |
| 个人 Agent 回归与核心 subjectType 校验 | ⏳ 批量路径待验 | 保留原 Agent 契约；三行必填缺失必须暴露 |
| Railway 开发版与用户原 Excel 验收 | ⏳ 当前部署旧版 SUCCESS，尚未跑新批量功能 | 绿色门禁→合并→固定开发提交部署→真实操作与详情验收 |
| 历史重复“开户银行” | ⏳ 两个 ID 已存在，尚未审定 | 检查字段引用/值后人工选定保留方案，禁止直接删改 |
| **BEX-01 / CP-03 整体** | **进行中，未 Human Accepted** | 解决上述待办后以真实验收证据正式签收 |

报告格式永久遵守 .clinerules/01-delivery.md 的 **“验收项目｜当前状态｜下一步”固定进度表**，不是数字 4→3→2→1 倒数。每个验收项应保留，不得无止境扩展任务。

## 5. 新窗口立即执行（顺序明确）

1. **先读本入口 + 详细索引**，再读 #878 的原批量方案、#846 的原交接和 S10–S13 原参考，不重做已经完成的网络研究。
2. 重新核实 main/PR #866/#878/#846、Eidos #182、Railway 版本、已有并行 PR 与 owner 文件，确保别的窗口没在改同一处。
3. 先解决 #866 跨项目 CI 的 2 个失败：仅有工作流名称与失败步骤，缺少根因。拿到日志后判定“本变更引起”还是“外部并行回归”；**不得因 BEX 单独测试绿就绕过必要门禁**。
4. #866 收口后，以最新 main 新建**独立 BEX 批量实现 PR**；实施“集中审阅候选→一次确认→多字段创建+自动映射→可恢复/去重→预检查”最小闭环。类型、权限、敏感字段、同名冲突与 Agent 兼容都在 CI/Chromium 覆盖。
5. 测试通过才按项目习惯合并 main/清理实现分支，并将既有 Railway 固定发布分支指向准确合并 SHA；不新建环境、不盲目部署移动中的 main。
6. 用户在原 Excel 作业现场核验“默认支付方式、结算方式、默认账期方式、账期天数”只需一次集中操作；三行 subjectType 缺失仍单独处理，确认供应商详情真实扩展值后才签收。

## 6. 证据和资料归位

- 本聊天至少包含：2026-10-14 09:32–09:34 的五张单列创建/重复“开户银行”截图、2026-10-14 10:24 的“默认支付方式/后三列”截图；详细文件名、Import Job、能证明/不能证明的事项请看详细索引“用户截图与证据”。
- **图片本体未上传 GitHub**。原聊天与暂存容器路径是线索，不是保证新窗口可访问的永久 URL；如需要自动化验收固定截图，应从用户重新附件取得或在新 PR Chromium 中重新输出。
- 网络资料的查阅层级：“本次原文实际复核/已有窗口文档记录原文已读/仅摘要或未能重开/待验证”均在详细索引逐项注明；只借鉴事实，不将本文判断当成来源宣称。
