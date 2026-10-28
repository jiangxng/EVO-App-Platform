# EVO 权限、租户创建与 SaaS 套餐 — 外部研究来源与决策索引

**研究日期：2026-10-28。** 原始链接均为本次在 Web 检索中实际找到的来源（不会制造未访问资料）。优先官方原文；不将网页搜索摘要视为已通读的原文。

## 证据分级
- **P1 已打开原文**：工具成功返回可读官方页面正文（即使某章节很长，结论只引用实际可见段落）。
- **P2 官方搜索结果摘要**：官网原文可定位、搜索结果提供可用片段，但打开未取得完整正文/未阅读全文；只可作为有限证据，细则待复核。
- **P3 未读/访问失败/待验证**：绝不据此声称已经核实功能/价格。

所有价格、席位和版本可能随时间及地区发生变化。EVO 套餐里的数量和价格**尚未由用户确认**，不得将参考产品公开价复制到代码。

## 国际官方研究

| 来源、原始 URL、查阅日期 | 状态 | 本轮关键事实、采用与限制 |
| --- | --- | --- |
| Microsoft Entra — Default user permissions, https://learn.microsoft.com/en-us/entra/fundamentals/users-default-permissions, 2026-10-28 | **P1 已打开原文** | 可以限制普通用户创建租户，仅向被授 Tenant Creator 角色者开放；创建的新租户创建人自动为 Global Administrator，并记审计。**采用** EVO 平台创建资格与新企业 OWNER 分离。EVO 不复制 Entra 的管理员权限清单。 |
| Microsoft Azure Well-Architected — Identity and Access Management for SaaS, https://learn.microsoft.com/en-us/azure/well-architected/saas/identity-access, 2026-10-28 | **P1 已打开原文** | SaaS 分角色/资源权限、租户隔离、多租户个人会员；建议提供租户管理员自助权限管理 Portal。**采用** 平台与企业管理入口分离及企业级授权，不假设一人只在一家企业。 |
| Atlassian — Different types of admin roles, https://support.atlassian.com/user-management/docs/what-are-the-different-types-of-admin-roles/, 2026-10-28 | **P1 已打开原文** | 创建组织自动成为组织管理员；组织管理员、站点管理员、App 管理员、用户访问管理员分层。**采用** 创建后自动企业 Owner，企业可委派应用管理员，授权应用不等于授权平台。 |
| Atlassian — Understand billing administration, https://support.atlassian.com/subscriptions-and-billing/docs/understand-billing-administration/, 2026-10-28 | **P1 已打开原文** | Billing admin 与 Organization/Site admin 的可访问账务范围不同，能有多位 Billing admin。**采用** 企业财务管理员与企业 OWNER/平台安全管理员可分离。 |
| Salesforce — Permission Set Licenses, https://help.salesforce.com/s/articleView?id=users_permissionset_licenses_about.htm&language=en_US, 2026-10-28 | **P2 官方搜索摘要；原文打开只返回加载错误** | 官方摘要指出 license 定义可用上限，Permission Set 决定特定个人可用的子集，需要二者同时满足。**采用** Subscription Entitlement 与个人 Action Grant 分离；不复制 Salesforce 复杂对象模型。 |
| Salesforce — Permission Sets, https://help.salesforce.com/s/articleView?id=admin_perm_sets.htm&language=en_US&type=5, 2026-10-28 | **P2 官方搜索摘要** | 一个 Profile 配多个 Permission Sets；按职责任务组合权限。**采用** 默认角色 + 可组合权限组，不在第一版建立海量静态岗位模板。 |
| Vercel — Access Roles, https://vercel.com/docs/rbac/access-roles, 2026-10-28 | **P2 官方搜索正文片段；打开失败** | Team Owner/Billing/Developer/Viewer 与 Project Role 分层。**采用** 平台/企业/插件三级授权与 Billing 身份分离；不复制 Vercel 的具体席位限制。 |
| GitHub — Roles in an organization, https://docs.github.com/en/organizations/managing-peoples-access-to-your-organization-with-roles/roles-in-an-organization, 2026-10-28 | **P2 官方搜索摘要** | 组织 Owner/Member/Moderator/Billing Manager 与仓库细分权限，并建议维护至少两位 owner。**采用** 防止企业无有效管理人的运营原则；与 Shopify 单一 Owner 不同，需 EVO 自己定治理合同。 |
| Shopify — Creating stores, https://help.shopify.com/en/manual/your-account/manage-orgs-and-stores/manage-orgs/create-store, 2026-10-28 | **P1 已打开原文** | 只有组织 Owner/Administrator 或持 Stores 创建权限的人能创建新 Store，套餐影响创建流程。**采用** 平台 Creator Grant 与配额/套餐同时裁决；Store 不等同 EVO 企业，不能照搬所有权规则。 |
| Shopify — Roles managed by Shopify, https://help.shopify.com/en/manual/your-account/users/roles/roles-managed-by-shopify, 2026-10-28 | **P2 官方搜索摘要** | 一组织/Store 各一个 owner，所有权转移与普通角色分配分离。**采用** OWNER 转移单独受控操作；**不采用** 一刀切将平台管理员设为所有 Store Owner。 |
| Odoo — Pricing, https://www.odoo.com/pricing, 2026-10-28 | **P2 官方搜索原文片段，打开超时** | One App Free（一个应用）、Standard/Custom（按用户和可用功能划分）公开模型。**采用** 套餐 + 应用增购可并存；**不采用** 默认安装一个业务 App 或直接照搬美元定价。 |
| Stripe — Entitlements, https://docs.stripe.com/billing/entitlements, 2026-10-28 | **P3 官方索引已打开但具体 Dashboard/API 正文未成功读取；概念需进一步核对** | 官网索引确认 Entitlements 专题存在；官方 API 搜索展示 features 和 active entitlement 资源，但本轮未完整读取流程。**采用方向**：产品套餐与功能权益映射，严格标注实现细则待查；不宣称已经核实 Webhook 的所有时序。 |
| Stripe — Basic usage-based billing, https://docs.stripe.com/billing/subscriptions/usage-based, 2026-10-28 | **P1 已打开原文** | 用量型计费与普通订阅可组合；官方目前推荐新集成评估 Metronome，基础 Meter 仍为已有方案。**采用** EVO 先定义统一用量事件和额度，不在一开始绑定某特定支付 API。 |
| AWS — SaaS tenant isolation, https://docs.aws.amazon.com/whitepapers/latest/saas-tenant-isolation-strategies/the-isolation-mindset.html, 2026-10-28 | **P1 已打开原文** | Authentication / authorization 不能代替 tenant isolation，租户作用域强制执行。**采用** 即使平台超级管理员、企业 Owner 和订阅高级也不能混淆跨企业数据边界。 |

## 中国官方研究

| 来源、原始 URL、查阅日期 | 状态 | 本轮关键事实、采用与限制 |
| --- | --- | --- |
| 飞书 — 飞书项目之企业管理, https://www.feishu.cn/content/30p7jfqj, 2026-10-28（原文日期 2024-12-23） | **P1 已打开原文** | 企业后台集中管理产品版本、成员席位、安全/操作日志；企业管理员初始化继承相关企业管理员配置。**采用** 企业管理首页显示角色、套餐和席位，不把内部 Provider 技术页交给普通用户。**限制** 此文章专指飞书项目，不代表飞书所有版本。 |
| 飞书 — 管理员类型和角色介绍, https://www.feishu.cn/hc/zh-CN/articles/927897012636-管理员类型和角色介绍, 2026-10-28 | **P2 官方搜索摘要；正文打开没有可读行** | 创建人默认首位超级管理员，可移交创建人；超管与自定义管理员不同，管理员角色上限可按版本区分。**采用** 创建人自动 OWNER、可委派角色、套餐可控制高级治理能力；**不能让基本身份安全依赖付费**。 |
| 飞书 — 定价版本介绍, https://www.feishu.cn/hc/zh-CN/articles/360049067600-飞书定价版本介绍, 2026-10-28 | **P2 官方搜索摘要；原文打开无行** | 企业版本过期回落基础权益，成员/管理员数量随版本变化；套餐成员数有配额与分配。**采用** 权益过期/降级和超额新增管制，具体费用和产品版本需二次核对。 |
| 简道云 — 官方定价, https://www.jiandaoyun.com/index/price, 2026-10-28 | **P1 已打开原文** | 免费/标准/企业/旗舰/独享版，以账号人数、数据量、高级权限、AI 点数和部署方案差异化。**采用** 版本、席位、数据/AI 点数与独立部署可组合，金额只作参考不复制。 |
| 简道云 — 控制中心/权限体系, https://www.jiandaoyun.com/index/control_center, 2026-10-28 | **P2 官方搜索摘要** | 支持个人/部门的数据范围及字段权限。**采用** 首期先有企业角色与业务操作，后期才做部门/字段 ABAC，不让第一期卡死在细粒度权限。 |
| 明道云 — 组织管理首页, https://help.mingdao.com/org/home/, 2026-10-28 | **P1 已打开原文** | 组织首页可看套餐/续期、席位上下限、信用点/消耗，支持工作流和 AI 等资源增补及阈值预警。**采用** 订阅权益/席位/AI 限额统一仪表板、预算警报。 |
| 明道云 — 组织管理员介绍, https://help.mingdao.com/org/administrators/, 2026-10-28 | **P1 已打开原文** | 组织超管、自定义组织/应用管理员按模块管理权限分离，可配置权限组。**采用** 企业角色与插件管理权限模板，平台权限不能直接继承。 |
| 明道云 — 组织角色介绍, https://help.mingdao.com/org/roles/, 2026-10-28 | **P2 官方搜索摘要** | 组织角色可以复用到应用、流程和字段权限，独立于具体部门树。**采用** 复用角色组，插件声明权限点。 |
| 金蝶云 — 系统管理使用流程, https://help.open.kingdee.com/dokuwiki_std/doku.php?id=系统管理使用流程, 2026-10-28 | **P1 已打开官方原文** | 管理员先建角色，再建用户，再分配功能/字段权限并查看权限报表。**采用** 企业管理员易理解的角色、成员、权限报表管理流程；不复制其庞大 ERP 工作台。 |

## 比较、冲突和方案裁决

1. **平台创建权限的默认值**：Microsoft Entra 允许控制是否让普通用户创建租户。EVO 初期建议 **默认关闭匿名/普通用户的创建资格**，由平台管理员授予 A；未来才考虑风控和套餐限制下的开放自助注册模式。不能据此推断用户 A 必须是平台管理员。
2. **谁能成为 Owner**：Atlassian/微软创建人自动为管理员；Shopify 通常每企业仅单一 owner；GitHub 反而鼓励至少两位 owner。EVO 建议创建人默认初始 OWNER，保证永不无主、允许正式受控转移所有权和多人 ADMIN；OWNER 多人事实是否允许需要单独产品决议。
3. **版本与权限的关系**：Salesforce 把 License 上限与 Permission Set 分开；国内飞书/简道云套餐可限制角色数和席位；**EVO 不收费限制最基本的数据隔离、拒绝越权、撤销权限和审计最小保护**。高级管理/细粒度委托可以成为付费增值。
4. **不同产品的收费形态**：Odoo 用 One App Free + 全应用方案；简道云/明道云用版本+人数+资源/点数；Vercel 用团队/项目角色加用量。EVO 选 **基础订阅 + 席位 + 可选插件 + AI/自动化用量**，不简单照抄一个 App 包年。
5. **身份与隔离**：AWS 明确认证和授权不能代替租户隔离。EVO 的平台 Owner 不获得无条件跨租户业务读权限；要通过审计和明确支持授权。
6. **创建企业权限的额度**：本提案把平台 Creator Grant/配额与新企业套餐分开；商城增购套餐不能自然放大全平台创建企业资格，须由平台 policy 明确授权。
7. **价格来源易变**：所查产品价格及版本随地区/周期改变，先比较结构，**EVO Free/Team/Business/Enterprise 没有已确认价格、席位数量或发布日期**。

## 未核实与最值得继续查阅的资料

- Stripe Entitlements API 的完整功能生效时序、Active Entitlement webhook 幂等与降级同步语义：索引已读，具体 API 正文未成功打开，需定向继续核验。
- 多地区/支付渠道（Stripe/国内收单）订阅退款、税费、发票、资金合规，应在正式商业化 S4 专题研究，非此项已完成。
- 钉钉、企业微信、用友 YonSuite、SAP BTP/Business One、Oracle Fusion：**本轮未获得足以可靠逐条引用的官网具体角色/套餐原文**，不把非官方镜像或营销抓取当官方事实；下次再定向研究。
- 客户数据的实际跨企业授权负面测试、EVO 当前平台级用户的正式控制台及套餐页面：**尚未实现或验收**，不因本研究引用竞品就宣称 EVO 已具备。
- 是否允许一位 OWNER 对多个企业同时购买套餐、赠送试用、授予创建资格的运营模式、席位计算和付款责任：需产品确认。

## 落地映射

- Host/Auth 基础：复用 providers/authorization、manager/enterprise-context-authorization、manager/identity-user-directory-store 和现有 Provider 契约，谨防重复权限引擎。
- Tenant/Owner：复用 Enterprise Context Governance Provider/Grant，业务 UI 复用 apps/enterprise-context-governance 与 Eidos。
- 套餐/订阅/Entitlement：属于**新增平台商业控制面**，先文档/contracts，再实现统一 Provider API，不将支付等同权限。
- 插件：Plugin Manifest 声明可售/可用 feature、Action/Resource 和企业绑定前置条件；没有安装不出现虚假应用菜单。
- Agent：Delegation 复用 PA05 owner 机制，不擅自改变 PA05 Worker 身份与授权边界。
- 工程：当前只在独立 docs/evo-platform-access-management-plan-20261028 分支、Draft PR #1129 做研究规划；不直接 push main、不部署、不动东京/Railway/企业数据；独立 exact CI、Human/线上验收账。
