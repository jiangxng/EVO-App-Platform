# CV-04 / 2026-11-12 长窗口恢复 — 当前入口与交接

> **RECOVERY / DOCS ONLY / 非验收声明**。本轮从可恢复的旧聊天上下文、已存研究索引及直接读取的 GitHub `main` / PR / Actions / 源码交叉核对；**没有完整旧聊天逐字导出可供逐条复原**。详细来源/旧网址/取舍见 [研究决策及证据索引](CV04-WINDOW-20261112-RESEARCH-DECISION-REFERENCE-INDEX.md)。本条为增量导航，不替换 [CV-00～07 唯一计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md) 或 [CV-03 N1 Owner 门禁](CV03-N1-PRODUCTION-AUTHORITY-INTEGRATION-DECISION-AND-ACCEPTANCE-20261110.md)。

## 1. 本次准确核验及来源分层

- **核验时 main**：`fd357d988df99602545655a457fe3d79a9b412e2`（2026-11-12）。[PR #1263](https://github.com/jiangxng/EVO-App-Platform/pull/1263) MERGED → `8a7d3d6811ba7eccfd3d1d4984a82d77dc8d81ed`；[PR #1264](https://github.com/jiangxng/EVO-App-Platform/pull/1264) MERGED → `fd357d988df99602545655a457fe3d79a9b412e2`。GitHub live PR 元数据已重查，本次没有运行本地测试或执行新东京登录。
- **CODE 已有**：`foundation/collection-query/page-csv.ts` 只序列化当次 Owner 授权的当前页（最多 100 行、20 列，公式前缀安全处理）；Dictionary `dictionary.collection.page.export.csv`、Counterparty `my-customers/my-suppliers` 两个受管 Operation → 现有 ActionHost → 原 Eidos 下载 Command，均使用原业务 Owner 权限、投影、字段裁剪。实现资料见 [底座](CV04-AUTHORIZED-COLLECTION-PAGE-CSV-20261112.md)、[字典](CV04-DICTIONARY-CURRENT-PAGE-EXPORT-HOST-EIDOS-20261112.md)、[往来](CV04-COUNTERPARTY-MY-PROJECTION-PAGE-CSV-20261112.md)。
- **CI/AUTOMATED_BROWSER 已证实**：[主线 Chromium Actions #43155275632](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43155275632) 状态 COMPLETED/SUCCESS，`head_sha=8a7d3d6811ba7eccfd3d1d4984a82d77dc8d81ed`；字典、我的客户、我的供应商各在 1280px/模拟触控 390px 下载共 **6/6 PASS**，隔离的真实安装 Host + Eidos + 浏览器下载落地文件/授权内容验证。原始日志标记、六张截图和 artifact ID `13915826586` 的历史核验记录见 [真实浏览器验收](CV04-REAL-HOST-CHROMIUM-CSV-ACCEPTANCE-20261112.md)。这是自动验收，不是生产账号 HUMAN_PASS。
- **DEPLOYED_PREVIEW**：Dictionary 与 Counterparty 导出业务代码此前已由东京真实发布 job 记录成功；[东京 #43152812989](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43152812989) 最后一次记录的业务镜像 `73b5875756a41b20d560cd1b2f95523efdf46f93`；本轮仅浏览器测试/文档变更，[#43155305268](https://github.com/jiangxng/EVO-App-Platform/actions/runs/43155305268) preflight SUCCESS / deploy SKIPPED。不要把最后 `main` SHA 说成在线镜像 SHA。
- **HUMAN_PENDING / PRODUCTION_NOT_CERTIFIED**：尚未证明真实东京账号登录下载、跨企业/撤权真实 UI Session、真正外部 LLM Personal Agent 自然语言运行、物理手机/键盘/读屏人工签收。验收测试的静态 HUMAN session 是 **非生产测试**。

## 2. 用户要求与不可改变的决定（CHAT + 已存 DESIGN）

1. 在现有 **Eidos + EVO App Platform + 插件 Domain Owner/ActionRouter + Personal Agent** 上建设统一 List 经验，不另起框架；列表、详情、搜索/筛选/排序、服务器分页、列控制、保存系统/个人/企业视图、导入/导出、Kanban/合法聚合图表、手机与 AI 原生能力逐步通过不同真实插件复用，Eidos/V3 的功能/布局/颜色/导航是一致性基准。
2. 个人 Agent 可以操作但必须遵守 Human 相同的企业/字段/行权限；READ/PLAN 与受管 WRITE/Receipt 严格分层，不允许 Agent 直接 SQL、绕过 Owner 或从某一页假造全量记录。
3. **List 基础插件完成前，日常开发/测试/PR/合并/按现有规则部署不需要用户逐项审批**。独立分支 → Draft PR → 精确 HEAD CI → Ready → 合并 main → Branch Hygiene → main 核验；多窗口之间不抢改已归其他 Owner 管理的文件。
4. **生产 CV-03 SAVE 门禁例外**：`N1=NOT_CERTIFIED`、`APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、正式 SAVE POST 403、未注册 GET 404。用户选定方案 A：正式授权事实、`source_generation`、`authority_epoch` 与 immutable Outbox 必须共享真正 PG ACID T0；不是允许 LLM 自行代替 DB/PA05/安全 Owner 签核。
5. [Issue #1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212) 于本轮直接核对仍 OPEN/PENDING（checkbox 勾选不等于审批）；[并行 PR #1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 仍 OPEN，不触碰其三份受管文档，包括本目录的 `COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md`。

## 3. 当前阶段：区分聊天提出、代码、实际验证

| 里程碑 | CHAT / DESIGN | CODE MERGED | VERIFIED | 待完成 |
| --- | --- | --- | --- | --- |
| CV-00 / CV-01 | 受管 Collection Query、业务 Owner 复用 | Dictionary + Counterparty READ（#1163/#1165） | 既有合同/CI；本轮只复核已存索引 | Eidos Owner 完整签收、真实 Human/Agent 账号 |
| CV-02 | 共享 Eidos 多视图、详情返回、Agent 同权 | Eidos #209；Platform #1167/#1169/#1170/#1172/#1173 | 真实 Repo/ActionRouter/内部 Agent 确定性回归已有归档 | 自然语言、真实会话、焦点、物理手机、人验 |
| CV-03 | Saved Views、同权 Agent WRITE、生产 T0 | C3-01/02 受限 CAS/PG + Host/隔离/负向门禁；N1-05c QA 试验 | PG QA/同机进程/HBA/真实 Tokyo 只读探针等**有限**证据 | 真正 PA05/Authorization Provider/DB/KMS Owner 签名、不同物理 Host、正式切换，C3-03/04；SAVE OFF |
| CV-04 | 导入复用、授权导出 | 当前页 CSV helper + Dictionary/Counterparty Owner + Eidos | 隔离真实 Host/Chromium 1280px/390px 下载 6/6，主线 CI | 登录账号跨企业撤权/Agent；独立 EXPORT 权限、安全跨页异步 Job/审计/预算；现有 Import 纵切验收 |
| CV-05～07 | Agent 自然语言、Kanban/Chart、第三插件/性能/人验 | 按原计划推进，不能视为全部完成 | 本次未发现足以宣布全部完成的综合 Human 证据 | 对应正式纵切与退出验收 |

## 4. 下一步（不重复先前工程）

1. **CV-04 真实权限/身份验收**：先沿用现有 Host fixture/Chromium 实证，扩展跨两个 Enterprise 的 Session 变更、即时撤权、Feature 停用，以及内部 Personal Agent search/describe/invoke READ 的同权与拒绝；取得测试结果后再要求真正 Tokyo 登录账号及外部 LLM/物理手机 Human 证据。无真实账号时保持 `HUMAN_PENDING`，不得触碰生产客户数据。
2. **安全跨页导出**：独立 Owner `EXPORT` Capability/许可和审计，而非仅 READ；服务端稳定授权快照、明确行列白名单、过滤范围、大小/时间/并发预算、任务 TTL/回收、下载授权再校验、幂等与失败恢复，Human 和 Agent 同一权限。不能客户端分页循环抓取、一次性导出无边界全表。
3. **继续 CV-04 / CV-05～07**：ImportTarget/Job/Recipe 原机制的列表入口及返回；Kanban 合法分组、后端聚合 Chart、第三插件 Item/Warehouse 的复用及多端/辅助技术实证。先按 owner 交付真实纵切再更新八步状态。
4. **CV-03 安全线独立**：保留 #1212 真正签核与 #1184 边界；不得因为 CV-04 CI 通过而启用 SAVE，勿重做 N1-05b/05c 同机 synthetic QA 作为“新生产验收”。

> 恢复缺口：未取得完整逐字旧聊天记录/未归档的旧网页截图；旧外部来源只继承[11-06 原索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md)、[11-09 恢复交叉索引](CV-20261109-RECOVERY-RESEARCH-EVIDENCE-INDEX.md)、[11-11 CV-03 索引](CV03-N105C-WINDOW-20261111-RESEARCH-DECISION-REFERENCE-INDEX.md)的原始 URL、章节和阅读等级。本轮未新访问第三方网页，未虚构原文或新验收。
