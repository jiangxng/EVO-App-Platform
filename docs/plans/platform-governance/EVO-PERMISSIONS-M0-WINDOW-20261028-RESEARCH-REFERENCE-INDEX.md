# EVO 权限管理 0→1 / 研究资料与决策详细参考索引

> 交接日期：2026-10-28。所属工作线：EVO App Platform / 平台权限与企业上下文 / M0→M3。
> 状态：研究归档与继续开发依据；**不是权限中心已完成的证明**。该索引引用本窗口现有研究档案并核对 GitHub 工程证据，**未在交接这一步逐一重新打开下表外部网页**，保留当时来源分级而不虚构复核。

## A. 目标、明确要求和决定

**当前目标**：先解决平台创建企业时的权限错误，做有界的“权限管理 0→1”，由平台管理员为用户 A 管理“创建企业”资格；A 创建后成为其新企业 OWNER；界面应在操作前给出可理解的权限状态。

**用户已定**：LLM 主导、简短汇报；轻量 Host 与业务插件按需安装；权限事实不能靠隐藏导航伪装；固定 M0/M1/M2/M3 四里程碑；每次统一状态表、可量化验证、CI/部署/Human 分开；独立 PR、不直接推 main、不破坏数据卷与 Railway，不覆盖 PA05/BEX/Eidos/EC 并行 owner。

**用户尚未决定**：众包商业结构、单实例复制与集中多租户关系、收费模式、套餐/席位/AI 额度价格、自助建企业/平台审批的最终长期政策，以及多 OWNER/账单关系的商业规则。既有套餐草案只保留为参考，不进入当前开发。

**架构采用**：平台身份与授权 Provider 是 Authority；Eidos 是 UI；Enterprise Context Governance Experience 是企业治理呈现；业务插件声明 Action/Resource；个人平台资格与具体企业 OWNER 不互相继承；显式 DENY 优先，服务端强制，跨企业隔离；“订阅权益 ≠ 人员权限 ≠ 插件安装/企业绑定/后端就绪”。

## B. 本窗口已索引的国际与中国官方资料（全量原始 URL）

标记含义：**P1**＝既有窗口曾取得可读官方原文；**P2**＝只读官网搜索结果摘要/网页正文无法有效打开；**P3**＝未读具体内容或待验证。证据等级是当时索引记录，非本交接再次核验。所有日期为当时的查阅日期，而非网页发布日期。

| 标题 | 原始网址 | 查阅日期 | 对应主题 | 等级 | 当时取得的关键发现 | EVO 用途、限制或采排理由 |
| --- | --- | --- | --- | --- | --- | --- |
| Microsoft Entra — Default user permissions | https://learn.microsoft.com/en-us/entra/fundamentals/users-default-permissions | 2026-10-28 | 平台建企业资格 | **P1 已打开原文** | 可以限制普通用户创建租户，仅向被授 Tenant Creator 角色者开放；创建的新租户创建人自动为 Global Administrator，并记审计。 | **采用** EVO 平台创建资格与新企业 OWNER 分离。EVO 不复制 Entra 的管理员权限清单。 |
| Microsoft Azure Well-Architected — Identity and Access Management for SaaS | https://learn.microsoft.com/en-us/azure/well-architected/saas/identity-access | 2026-10-28 | SaaS 身份与隔离 | **P1 已打开原文** | SaaS 分角色/资源权限、租户隔离、多租户个人会员；建议提供租户管理员自助权限管理 Portal。 | **采用** 平台与企业管理入口分离及企业级授权，不假设一人只在一家企业。 |
| Atlassian — Different types of admin roles | https://support.atlassian.com/user-management/docs/what-are-the-different-types-of-admin-roles/ | 2026-10-28 | 平台/组织/应用角色 | **P1 已打开原文** | 创建组织自动成为组织管理员；组织管理员、站点管理员、App 管理员、用户访问管理员分层。 | **采用** 创建后自动企业 Owner，企业可委派应用管理员，授权应用不等于授权平台。 |
| Atlassian — Understand billing administration | https://support.atlassian.com/subscriptions-and-billing/docs/understand-billing-administration/ | 2026-10-28 | 账务管理员分权 | **P1 已打开原文** | Billing admin 与 Organization/Site admin 的可访问账务范围不同，能有多位 Billing admin。 | **采用** 企业财务管理员与企业 OWNER/平台安全管理员可分离。 |
| Salesforce — Permission Set Licenses | https://help.salesforce.com/s/articleView?id=users_permissionset_licenses_about.htm&language=en_US | 2026-10-28 | License 与 Permission 分离 | **P2 官方搜索摘要；原文打开只返回加载错误** | 官方摘要指出 license 定义可用上限，Permission Set 决定特定个人可用的子集，需要二者同时满足。 | **采用** Subscription Entitlement 与个人 Action Grant 分离；不复制 Salesforce 复杂对象模型。 |
| Salesforce — Permission Sets | https://help.salesforce.com/s/articleView?id=admin_perm_sets.htm&language=en_US&type=5 | 2026-10-28 | 权限集与组合 | **P2 官方搜索摘要** | 一个 Profile 配多个 Permission Sets；按职责任务组合权限。 | **采用** 默认角色 + 可组合权限组，不在第一版建立海量静态岗位模板。 |
| Vercel — Access Roles | https://vercel.com/docs/rbac/access-roles | 2026-10-28 | 团队/项目角色 | **P2 官方搜索正文片段；打开失败** | Team Owner/Billing/Developer/Viewer 与 Project Role 分层。 | **采用** 平台/企业/插件三级授权与 Billing 身份分离；不复制 Vercel 的具体席位限制。 |
| GitHub — Roles in an organization | https://docs.github.com/en/organizations/managing-peoples-access-to-your-organization-with-roles/roles-in-an-organization | 2026-10-28 | 组织 Owner 可靠性 | **P2 官方搜索摘要** | 组织 Owner/Member/Moderator/Billing Manager 与仓库细分权限，并建议维护至少两位 owner。 | **采用** 防止企业无有效管理人的运营原则；与 Shopify 单一 Owner 不同，需 EVO 自己定治理合同。 |
| Shopify — Creating stores | https://help.shopify.com/en/manual/your-account/manage-orgs-and-stores/manage-orgs/create-store | 2026-10-28 | 商店创建许可 | **P1 已打开原文** | 只有组织 Owner/Administrator 或持 Stores 创建权限的人能创建新 Store，套餐影响创建流程。 | **采用** 平台 Creator Grant 与配额/套餐同时裁决；Store 不等同 EVO 企业，不能照搬所有权规则。 |
| Shopify — Roles managed by Shopify | https://help.shopify.com/en/manual/your-account/users/roles/roles-managed-by-shopify | 2026-10-28 | 所有权与转移 | **P2 官方搜索摘要** | 一组织/Store 各一个 owner，所有权转移与普通角色分配分离。 | **采用** OWNER 转移单独受控操作；**不采用** 一刀切将平台管理员设为所有 Store Owner。 |
| Odoo — Pricing | https://www.odoo.com/pricing | 2026-10-28 | 应用与套餐定价形态 | **P2 官方搜索原文片段，打开超时** | One App Free（一个应用）、Standard/Custom（按用户和可用功能划分）公开模型。 | **采用** 套餐 + 应用增购可并存；**不采用** 默认安装一个业务 App 或直接照搬美元定价。 |
| Stripe — Entitlements | https://docs.stripe.com/billing/entitlements | 2026-10-28 | 功能权益模型 | **P3 官方索引已打开但具体 Dashboard/API 正文未成功读取；概念需进一步核对** | 官网索引确认 Entitlements 专题存在；官方 API 搜索展示 features 和 active entitlement 资源，但本轮未完整读取流程。 | **采用方向**：产品套餐与功能权益映射，严格标注实现细则待查；不宣称已经核实 Webhook 的所有时序。 |
| Stripe — Basic usage-based billing | https://docs.stripe.com/billing/subscriptions/usage-based | 2026-10-28 | 用量计费 | **P1 已打开原文** | 用量型计费与普通订阅可组合；官方目前推荐新集成评估 Metronome，基础 Meter 仍为已有方案。 | **采用** EVO 先定义统一用量事件和额度，不在一开始绑定某特定支付 API。 |
| AWS — SaaS tenant isolation | https://docs.aws.amazon.com/whitepapers/latest/saas-tenant-isolation-strategies/the-isolation-mindset.html | 2026-10-28 | 多租户强隔离 | **P1 已打开原文** | Authentication / authorization 不能代替 tenant isolation，租户作用域强制执行。 | **采用** 即使平台超级管理员、企业 Owner 和订阅高级也不能混淆跨企业数据边界。 |
| 飞书 — 飞书项目之企业管理 | https://www.feishu.cn/content/30p7jfqj | 2026-10-28 | 企业管理后台 | **P1 已打开原文** | 企业后台集中管理产品版本、成员席位、安全/操作日志；企业管理员初始化继承相关企业管理员配置。 | **采用** 企业管理首页显示角色、套餐和席位，不把内部 Provider 技术页交给普通用户。**限制** 此文章专指飞书项目，不代表飞书所有版本。 |
| 飞书 — 管理员类型和角色介绍 | https://www.feishu.cn/hc/zh-CN/articles/927897012636-管理员类型和角色介绍 | 2026-10-28 | 超管与委派 | **P2 官方搜索摘要；正文打开没有可读行** | 创建人默认首位超级管理员，可移交创建人；超管与自定义管理员不同，管理员角色上限可按版本区分。 | **采用** 创建人自动 OWNER、可委派角色、套餐可控制高级治理能力；**不能让基本身份安全依赖付费**。 |
| 飞书 — 定价版本介绍 | https://www.feishu.cn/hc/zh-CN/articles/360049067600-飞书定价版本介绍 | 2026-10-28 | 版本/席位 | **P2 官方搜索摘要；原文打开无行** | 企业版本过期回落基础权益，成员/管理员数量随版本变化；套餐成员数有配额与分配。 | **采用** 权益过期/降级和超额新增管制，具体费用和产品版本需二次核对。 |
| 简道云 — 官方定价 | https://www.jiandaoyun.com/index/price | 2026-10-28 | 套餐、资源、AI | **P1 已打开原文** | 免费/标准/企业/旗舰/独享版，以账号人数、数据量、高级权限、AI 点数和部署方案差异化。 | **采用** 版本、席位、数据/AI 点数与独立部署可组合，金额只作参考不复制。 |
| 简道云 — 控制中心/权限体系 | https://www.jiandaoyun.com/index/control_center | 2026-10-28 | 数据/字段权限 | **P2 官方搜索摘要** | 支持个人/部门的数据范围及字段权限。 | **采用** 首期先有企业角色与业务操作，后期才做部门/字段 ABAC，不让第一期卡死在细粒度权限。 |
| 明道云 — 组织管理首页 | https://help.mingdao.com/org/home/ | 2026-10-28 | 组织套餐、配额、AI | **P1 已打开原文** | 组织首页可看套餐/续期、席位上下限、信用点/消耗，支持工作流和 AI 等资源增补及阈值预警。 | **采用** 订阅权益/席位/AI 限额统一仪表板、预算警报。 |
| 明道云 — 组织管理员介绍 | https://help.mingdao.com/org/administrators/ | 2026-10-28 | 组织套餐、配额、AI | **P1 已打开原文** | 组织超管、自定义组织/应用管理员按模块管理权限分离，可配置权限组。 | **采用** 企业角色与插件管理权限模板，平台权限不能直接继承。 |
| 明道云 — 组织角色介绍 | https://help.mingdao.com/org/roles/ | 2026-10-28 | 权限组 | **P2 官方搜索摘要** | 组织角色可以复用到应用、流程和字段权限，独立于具体部门树。 | **采用** 复用角色组，插件声明权限点。 |
| 金蝶云 — 系统管理使用流程 | https://help.open.kingdee.com/dokuwiki_std/doku.php?id=系统管理使用流程 | 2026-10-28 | 角色/用户/功能权限 | **P1 已打开官方原文** | 管理员先建角色，再建用户，再分配功能/字段权限并查看权限报表。 | **采用** 企业管理员易理解的角色、成员、权限报表管理流程；不复制其庞大 ERP 工作台。 |

本表逐条继承的原始索引（也是今后修订的唯一外部来源清单）：[EVO-SAAS-ROLES-PLANS-EXTERNAL-RESEARCH-INDEX-20261028.md](EVO-SAAS-ROLES-PLANS-EXTERNAL-RESEARCH-INDEX-20261028.md)。共 23 项；不推断这些官网当前价格或默认策略必然仍有效。

## C. 本项目一手源码、文档与动作证据

| 资料 / URL（原始路径） | 查阅或确认日期 | 主题及关键证据 | 等级与具体用途 |
| --- | --- | --- | --- |
| [PLUGIN-PLATFORM-MAINLINE-v0.1](../../architecture/PLUGIN-PLATFORM-MAINLINE-v0.1.md) | 2026-10-28 | Host Package/Feature/Capability；Eidos 负责界面呈现，不自建业务授权 Authority | 既有窗口 P1 源码/架构已读；平台/插件边界 |
| [providers/authorization/runtime.ts](../../../providers/authorization/runtime.ts) | 2026-10-28 | `authorization.check`，静态策略无匹配默认拒绝、显式 DENY 优先 | 既有窗口 P1 原文；M0/M2 复用判定，不绕过 API |
| [manager/server.ts](../../../manager/server.ts) 和 [actions/material-write-authorization.ts](../../../actions/material-write-authorization.ts) | 2026-10-28 | Host 按请求身份与 Context 做最后授权；早期默认业务插件曾自动安装 | 既有窗口 P1 原文；M0 读接口与创建写入口的边界 |
| [manager/enterprise-context-creation.ts](../../../manager/enterprise-context-creation.ts) | 2026-10-28 | 授权通过后创建企业及初始 OWNER/Grant；失败不应产生孤儿企业 | 既有窗口 P1 原文；M3 端到端验证 |
| [manager/identity-user-directory-store.ts](../../../manager/identity-user-directory-store.ts) 与 [身份目录架构](../../architecture/HOST-IDENTITY-USER-DIRECTORY-EA3B1-v0.1.md) | 2026-10-28 | 有身份目录事实，但不是完整账户登录/授权管理 UI | 既有窗口 P1 原文；M1 可信平台 Owner 前置 |
| [apps/enterprise-context-governance](../../../apps/enterprise-context-governance/README.md) / [context-page.ts](../../../apps/enterprise-context-governance/context-page.ts) | 2026-10-28 | 企业上下文目录、创建、概览存在；旧 `/enterprise-contexts/members` 仅为映射，并非独立成员编辑器 | 既有窗口 P1 原文；M0 页面入口，避免误称成员/权限页已存在 |
| [manager/provider-manager-page.ts](../../../manager/provider-manager-page.ts) 与 [manager/settings-page.ts](../../../manager/settings-page.ts) | 2026-10-28 | `/providers` 是技术 Provider 配置，`/settings` 是已安装可配置插件的设置；均非平台权限中心 | 既有窗口 P1 原文；防止重复界面 |
| [ENTERPRISE-CONTEXT-RESOURCE-CONTAINER-v1.0](../../architecture/ENTERPRISE-CONTEXT-RESOURCE-CONTAINER-v1.0.md) | 2026-10-28 | 安装插件、绑定企业、Provision 服务是三个步骤 | 既有窗口 P1 原文；避免错误归因 |
| [M0 功能 PR #1130](https://github.com/jiangxng/EVO-App-Platform/pull/1130) / [M0 测试原文](https://github.com/jiangxng/EVO-App-Platform/blob/fd0e5ad55040ee92de79b9652e4e4b1cd778bde0/tests/protocol/enterprise-create-eligibility.test.mjs) | 2026-10-28 | `GET /v1/permissions/me/enterprise-create`、`/enterprise-contexts/my-permissions`、表单预检、中文友好提示，4 状态负向测试；功能 HEAD 47/47 checks PASS、合并 SHA `fd0e5ad5` | **P1 本轮 GitHub PR/checks 已核验；代码验证与网页 Human 不混同** |
| [首次部署失败 #40631492619](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40631492619) / [重试 PR #1132](https://github.com/jiangxng/EVO-App-Platform/pull/1132) | 2026-10-28 | 首次 Workflow YAML `on.push` 重复，0 jobs；修复后成功执行 | 既有交接 P1 Actions 记录；复用已知修复，不再重复排查 |
| [M0 东京成功部署 #40632097615](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40632097615) / [部署 Job #122630601414](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40632097615/job/122630601414) | 2026-10-28 | 实际 VPS 部署 SHA `ba1498e951a5abcea1244f3b78e6a574a580c20b`，本地 /health、公网严格 HTTPS、未授权首页 401 PASS | **P1 本轮重新核验 Actions SUCCESS 和 SHA**；不证明创建企业的 Human 业务验收 |
| [发布触发收口 PR #1133](https://github.com/jiangxng/EVO-App-Platform/pull/1133) | 2026-10-28 | 合并 SHA `e37fa1f224d8062076c25f4697b72084f8db0743`；主部署 Workflow 恢复只保留 workflow_dispatch | P1 项目追踪与 main commit 已核验；勿在新窗口重复触发无关部署 |
| [东京预览授权 PR #1126](https://github.com/jiangxng/EVO-App-Platform/pull/1126) / [发布 #40625798833](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40625798833) | 2026-10-28 | 用共享 `demo-user` 的受限预览策略验证企业创建授权路径，不是独立真实用户权限中心 | P1 既有工程记录；严禁当生产身份/正式 Platform Owner |

## D. 方案比较：来源事实与 EVO 选择分开

| 对比 | 来源事实 / 证据 | EVO 已确认选择或保留方向 | 不采用的方案及原因、条件限制 |
| --- | --- | --- | --- |
| 平台建企业资格 vs 普通注册即建 | Microsoft Entra P1 支持限制租户创建与单独 Tenant Creator | 第一阶段平台单独授予 `enterprise.context.create`；创建者是该新企业 OWNER | 不把企业 OWNER 当平台管理员；长期是否开放自助建企业仍未决 |
| 创建者 OWNER 与多人 OWNER | Microsoft/Atlassian P1 创建人是组织管理员；GitHub P2 鼓励多个 Owner、Shopify P2 单一 Owner 模式 | 创建成功自动具有本企业 OWNER，防止无主；未来可转移与委派 | 不能照搬单 Owner 或多 Owner 规则；正式多 OWNER 政策需单独定 |
| 套餐与授权 | Salesforce P2 License/Permission Set 分离；简道云/明道云 P1 提供版本/席位/点数 | 保留 Plan/Subscription/Entitlement 与 Permission 拆分的架构选项 | **本期不实施收费和套餐限制**；不可把“买了套餐”变成“某人能操作” |
| 单实例复制、中心多租户与众包 | 当前用户产品方向，非已经定型的竞品事实 | Permission = deployment/control-domain + Principal + Action + Resource + Scope，保持可扩展 | 不把所有权限硬写死为企业员工、不强制全局账单/登录共享 |
| 平台 Owner 与租户数据 | AWS SaaS Tenant Isolation P1 明确认证/授权不代替隔离 | 平台管理权与企业数据访问分开，危险访问留审计 | 不采用全局超管可直接读取全部企业客户记录 |
| 用户体验权限错误 | 当前截图与 EVO 源码 P1：NO_MATCH 默认拒绝；Eidos 原页面曾只显示空白/内部错误 | 只读资格预检 + 中文解释 + 服务端实际提交重验 | 不采用仅前端隐藏按钮、全局 ALLOW 或直接暴露技术码 |
| 共享预览身份 vs 真实管理员 | 东京 Basic Auth + compatibility `demo-user` 是本项目运行事实 | M0 可预览；M1 必须安全初始化真实 Platform Owner | 不能将 demo-user 设置为正式超级管理员，也不能因此宣布 M1/M2 通过 |

## E. 冲突、过时性和未决问题

1. **“创建者默认管理员”的细节并不一致**：微软/Atlassian 有自动管理员语义，但 GitHub 提倡多 Owner，Shopify 资料偏向单 Owner；这不是同一租户对象定义，不能简单判定某方错误。EVO 当前只确认创建者是**该新企业** OWNER。
2. **角色管理与套餐售卖的粒度不一致**：Salesforce License、Vercel Team/Project、简道云/明道云席位/AI 额度是不同商业合同；M0–M3 不实施任何竞品计费值。
3. **已读等级冲突**：Salesforce 原文网页打不开、Vercel 原文打开失败、飞书部分页面无可读行、Stripe Entitlements 的 API 具体内容未读；这些仍 P2/P3，不应在下一窗口上调等级。
4. **前后部署状态不应混为当前状态**：早期东京曾 TCP443 超时、旧发布 Workflow YAML `on.push` 冲突，但截至本次 M0 成功部署已分别被新的公网 HTTPS PASS 和去重/收口覆盖。保留历史故障，不当作当前阻塞。
5. **未决产品事项**：众包角色/结算、复制实例授权同步、正式多租户 SaaS 模型、套餐价格和级别、多个 OWNER 的治理方式、正式首位 Platform Owner 的受信任引导、跨实例身份与授权联邦。
6. **当前真正阻塞**：M0 代码与发布 PASS，但**没有 Human 浏览器签收**；M1–M3 的三个真实独立身份仍不可用，不能借共享 demo-user 假验多用户。

## F. 易变或难以重访的资料、截图和原始记录

- **官网易变资料**：价格、席位、版本、AI 点数均不保存未核实的数值。重点保留简道云 /index/price、Odoo /pricing、明道云 /org/home/ 的结构性结论；日后定价时必须按地区/计费周期重新取证。
- **受限原文**：Salesforce 权限许可、飞书权限/定价、Vercel RBAC 原文访问受限；本索引保留全文原始 URL、官方搜索摘要结论与 P2 标记，不伪称截图或全文存档。
- **官方内容章节定位**：Microsoft Entra《Default user permissions》中的租户创建权限；Atlassian《Different types of admin roles》组织/应用管理员；AWS《The isolation mindset》认证授权与租户隔离；明道云《组织管理首页》套餐/资源用量；金蝶《系统管理使用流程》角色/用户/授权步骤。以上是**检索主题定位**，不是重新打开后核对的逐字标题/行号。
- **真实线上证据优先**：PR #1130 代码与测试，Actions #40632097615 Job #122630601414（VPS SHA、localhost health、公网严格 TLS 与 401），均有 GitHub 持久 URL；M0 尚无获签收的浏览器操作录屏。
- **用户图片位置**：本窗口会话中的上传截图包括①“应用”侧栏默认业务链接与无企业空白区、②“设置”四组及 SETTINGS_GROUP、③“创建企业”报 `STATIC_POLICY_NO_MATCH`。**截图原始文件未作为 GitHub 仓库图片附件归档，现无可验证的仓库路径或 SHA**；本索引仅保留现象和用途，不伪造图片链接。如后续 Human 签收确实需要原图，须从原会话重新上传或补存受控证据文件。

## G. 固定里程碑、模块映射和下一窗口任务

| 里程碑/状态（截至交接） | 对应模块/文件 | 下一步与验收证据 |
| --- | --- | --- |
| **M0：代码 47/47、合并、东京发布、公网 PASS；Human 待签收** | `manager/server.ts`、`manager/enterprise-context-creation.ts`、`apps/enterprise-context-governance`、`tests/protocol/enterprise-create-eligibility.test.mjs`；PR #1130、#1132、#1133 | 先在东京已认证浏览器验证“企业上下文 → 我的权限”“创建企业”中文提示与可进入表单；只对 M0 Human 未关闭项继续；不为测拒绝擅自撤销真实权限 |
| **M1：未开始** | Host 身份目录/Session、Platform Owner 初始化路径 | 三个真实身份（Owner/A/B）与禁用撤权、预览 demo-user 不得自封超管 |
| **M2：未开始** | Host 授权 Provider、持久 Grant、Eidos 平台管理 → 权限管理界面 | 授予/撤销 `enterprise.context.create`，重启持久、即时生效、至少两条审计记录、非 Owner 拒绝 |
| **M3：未开始** | Enterprise Context 创建/OWNER/Grant、跨企业资源边界 | A 创建后 OWNER、撤权不影响旧企业、B 越权拒绝、发布与 Human 实测分开 |

**唯一进度表**：[EVO-PERMISSIONS-MVP-FIXED-MILESTONES-20261028.md](EVO-PERMISSIONS-MVP-FIXED-MILESTONES-20261028.md)。**MVP 实施规格**：[EVO-PERMISSIONS-MVP-0-TO-1-20261028.md](EVO-PERMISSIONS-MVP-0-TO-1-20261028.md)。扩展架构和商业资料只作背景，不应变成新任务。

**工作分支/PR**：规划归档分支 `docs/evo-platform-access-management-plan-20261028` / Draft PR #1129，不能假设已合并 main；当前产品 main `e37fa1f224d8062076c25f4697b72084f8db0743`，东京 M0 实际健康镜像 SHA `ba1498e951a5abcea1244f3b78e6a574a580c20b`。下一窗口仍按独立 feature branch/PR 开发，不能直接 push main；保护 Railway/既有卷及 PA05/BEX/Eidos/EC owner。

## H. 继续研究优先级（不在 M0 期间自动开工）

- 仅当 M1 真正需要：核验已有正式用户登录和首次 Platform Owner 可信引导，读当前代码和已有 PA05 文档后定向查官方安全规范；本期不先决定供应商。
- 仅当 M2 真正需要：明确授权 Grant 动态存储、乐观并发、多 Worker/重启一致性、审计设计，并与现有 Provider 权限契约对照。
- 仅当商业化另立项：重新查 Stripe Entitlements 具体 API/Hook、不同地区收单/税务，补充钉钉、企业微信、用友/SAP/Oracle 当前官方资料。**本次均未作为已读原文**。

## I. 与当前窗口结论的映射

- 研究/方案 → `docs/plans/platform-governance/EVO-ACCESS-MANAGEMENT-ARCHITECTURE-AND-UX-PLAN-20261028.md` 和 `EVO-SAAS-PLATFORM-ROLES-PLANS-AND-ENTITLEMENTS-20261028.md`；仅参考。
- 确认范围 → `EVO-PERMISSIONS-MVP-0-TO-1-20261028.md`，唯一里程碑 → `EVO-PERMISSIONS-MVP-FIXED-MILESTONES-20261028.md`；不得另建状态表。
- M0 代码与部署 → PR #1130 / #1132 / #1133，Actions #40632097615；M0 Human 仍未完成；先做这一项。
- 来源等级：P1/P2/P3 保持不变；用户截图单列 U；项目/外部事实和 EVO 决策不可互换。
