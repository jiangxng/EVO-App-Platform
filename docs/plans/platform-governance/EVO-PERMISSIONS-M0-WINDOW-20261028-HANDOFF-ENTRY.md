# EVO 权限管理 0→1 · 2026-10-28 窗口交接入口（简短）

> **必读顺序**：先本文 → [详细研究与决策索引](EVO-PERMISSIONS-M0-WINDOW-20261028-RESEARCH-REFERENCE-INDEX.md) → [唯一固定里程碑表](EVO-PERMISSIONS-MVP-FIXED-MILESTONES-20261028.md) → 当前 M0 功能代码与部署记录。不要从 main 读取未合并的研究文档。

## 1. 项目、分支与状态

- 仓库：[jiangxng/EVO-App-Platform](https://github.com/jiangxng/EVO-App-Platform)。
- 研究/规划/本交接均在**分支**：`docs/evo-platform-access-management-plan-20261028`，[Draft PR #1129](https://github.com/jiangxng/EVO-App-Platform/pull/1129)。**尚未合并 main**；阅读上述文档时必须以此分支或指定 SHA 为准。本入口的准确最终 HEAD 以后续 PR 页面及交接指令中的精确 SHA 为准。
- 本交接前已核对的产品 **main 基线**：`e37fa1f224d8062076c25f4697b72084f8db0743`。main 可继续变化，接续时先重新核对。
- 最新经过实际 VPS 健康验证的 M0 发布 SHA：`ba1498e951a5abcea1244f3b78e6a574a580c20b`；[Actions #40632097615](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40632097615) SUCCESS。**它不是当前 main HEAD，也不是 Human 页面签收**。
- 已用独立分支/PR 治理；不直接 push main、不覆盖 PA05/BEX/Eidos/EC 并行 owner，不删除东京卷、不迁移或更改 Railway 数据。

## 2. 用户确认的产品决定

- **先解决眼前问题**：创建企业权限错误和缺少管理界面，权限中心只做 **0→1**。
- **固定 M0、M1、M2、M3 四个里程碑**；每次汇报保留同一张完整进度表，代码/准确 HEAD CI/合并/东京部署/公网/Human 签收分别标记。禁止未经批准扩展或偏移。
- 平台超级管理员可以授予用户 A **创建企业资格**；A 成功创建某家企业后成为**这家企业的 OWNER**，不因此成为平台管理员。
- 平台身份与授权归 Host/Provider；Eidos 负责界面，Enterprise Context Governance Experience 提供企业治理入口，业务插件仅声明权限并按需安装。**不默认安装业务插件；不会因为导航出现就推断后端就绪**。
- 众包、复制部署、集中多租户、套餐与商业化暂时**不选型、不开发**；通用的 Principal/Action/Resource/Scope 授权接口必须留出扩展余地。
- 用户希望 LLM 主导执行；**汇报只说进度、结果和必要的用户动作**，技术细节留在文档。

## 3. 当前唯一固定状态（依据本分支里程碑原表，2026-10-28）

| 里程碑 | 已取得可核验证据 | 当前结论 |
| --- | --- | --- |
| **M0** 权限预检/友好提示 | [功能 PR #1130](https://github.com/jiangxng/EVO-App-Platform/pull/1130) 合并 `fd0e5ad55040ee92de79b9652e4e4b1cd778bde0`；准确 HEAD `66df22f4a5091f06846f86d5ea6fb307a6263f11` **47/47 checks SUCCESS**；[部署 #40632097615](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40632097615) 成功（公网 TLS 和未授权 401 PASS） | **已部署东京，待 Human 签收**。不要重复开发 M0 或写成 M0 全部完成 |
| **M1** 可信身份/平台 Owner | 尚无这条专项的完成功能和真人三身份验收 | **未开始** |
| **M2** 平台权限管理页面/授予撤销 | 尚无完整可用权限管理页、持久 Grant/审计签收 | **未开始** |
| **M3** 企业创建 OWNER 与跨企业隔离 | 既有创建 Provider 可写 OWNER，但没有本专项 A/B 端到端签收 | **未开始本专项验收** |
| **整体** | M0 代码/CI/发布 PASS，其余门禁未关闭 | **进行中，不得扩项** |

具体可测条件、原表状态与自动续跑 #01–#04 的所有增量均在 [固定里程碑文档](EVO-PERMISSIONS-MVP-FIXED-MILESTONES-20261028.md)。**这里是快速导航，不维护第二套状态表。**

## 4. 下一项真正未关闭的门禁

**先做 M0 Human 签收，之后才进入 M1。**

- 在已认证的东京预览浏览器打开“企业上下文 → 我的权限”（`/enterprise-contexts/my-permissions`）与“创建企业”。
- 确认当前共享预览身份的权限状态可见、中文说明易懂、具资格时能进入创建表单；没有权限时得到说明而不是裸露 `STATIC_POLICY_NO_MATCH`。
- 不要为制造拒绝案例而擅自撤销已存在的真实授权；“未登录、撤权和 DENY”负向自动测试见 [M0 测试](https://github.com/jiangxng/EVO-App-Platform/blob/fd0e5ad55040ee92de79b9652e4e4b1cd778bde0/tests/protocol/enterprise-create-eligibility.test.mjs)。
- 将真实页面结果或缺陷记录到固定里程碑表的 M0 证据区。共享 `demo-user` **不能代替** M1 的 Platform Owner、A、B 三个独立正式账号。
- 若用户暂不能提供 Human 签收，准确汇报“待 Human 签收”；**不要重跑无必要的东京部署、修改 SSH、启用生产数据或直接进入 M2**。

## 5. 已读参考资产与保留边界

- [详细参考索引](EVO-PERMISSIONS-M0-WINDOW-20261028-RESEARCH-REFERENCE-INDEX.md)：23 条国际/中国官方原始 URL、日期、证据等级（P1 原文/P2 摘要/P3 待核验）、关键结论、采用/排除、冲突、截图位置与模块映射。
- [原始完整 SaaS 资料索引](EVO-SAAS-ROLES-PLANS-EXTERNAL-RESEARCH-INDEX-20261028.md) 与 [SaaS 方案](EVO-SAAS-PLATFORM-ROLES-PLANS-AND-ENTITLEMENTS-20261028.md) 只做**参考遗产**，不自动转入本专项。
- [MVP 规格](EVO-PERMISSIONS-MVP-0-TO-1-20261028.md) / [架构规划](EVO-ACCESS-MANAGEMENT-ARCHITECTURE-AND-UX-PLAN-20261028.md) 明确 Authority/界面边界。
- 用户上传的应用链接、设置空分组、企业创建报错截图在**原会话**中，**原始图片未确认写入 GitHub**；交接只记录观察和具体页面路径，不虚构文件路径。
- 东京最早的 Draft 研究 PR #1118、早期 HTTPS/443 故障、共享 Basic Auth 等旧信息均要依最新部署记录区分历史与当前；参考 [M0 部署](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40632097615)，不要重新解决已关闭问题。

## 6. 下一窗口接续原则

先阅读本入口及索引，再看唯一进度表和 M0 代码/发布证据。**不把研究清单当已读全文，不把旧窗口推断当现场实测**。发现资料过时或冲突才做定向查证，追加记录原始 URL、日期、等级、用处、为何采纳。若需开发，独立功能分支/PR、required CI 通过后再进入发布和 Human，保护 Railway 与其它 owner。保留原四里程碑、禁止持续扩展。