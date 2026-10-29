# EVO 权限管理架构与管理界面规划（2026-10-28）

**状态：研究确认 + 设计建议，尚未批准为产品实现规范，也没有实现权限管理 UI。**
**工作线：** EVO App Platform / Tokyo Dev / Enterprise Context / 插件平台。仅记录设计，不改 runtime、部署与生产数据，不覆盖 PA05、Eidos、BEX 等 owner。

## 一、问题与用户目标

用户在东京环境创建企业时遭遇 `STATIC_POLICY_NO_MATCH`，并询问“现有权限管理模块在整体架构中的位置、管理界面在哪里、如何规划”。此前还明确：轻量宿主、业务插件按需安装、空插件不出现虚假设置项、LLM 主导开发而用户不希望阅读冗长技术说明。

**一条总原则**：身份、企业可访问关系、操作授权和安全审计是平台级事实；业务插件**声明**自身动作与资源，使用统一平台鉴权；不同管理角色的界面由可更换的体验组件呈现，不能每个插件复制一个权限中心。

## 二、2026-10-28 已读源码事实（P1）

1. [PLUGIN-PLATFORM-MAINLINE-v0.1](../../architecture/PLUGIN-PLATFORM-MAINLINE-v0.1.md)：App Platform 拥有 Package/Feature/Capability/Lifecycle；Eidos 拥有 Workbench 和贡献呈现；基础权限以 Provider/公开契约为边界，业务插件只是消费者。已读原文。
2. [providers/authorization/runtime.ts](../../../providers/authorization/runtime.ts)、[package.ts](../../../providers/authorization/package.ts)：`authorization.check` Provider 已实现；静态策略无规则匹配默认 DENY，匹配 DENY 优先。是可执行权限服务，不是完整用户管理界面。
3. [manager/server.ts](../../../manager/server.ts)、[actions/material-write-authorization.ts](../../../actions/material-write-authorization.ts)：企业创建等写操作走服务端真实身份和 Context 授权，不应因 UI 过滤绕过；Host 装载各业务领域策略与授权 Provider。
4. [apps/enterprise-context-governance/README.md](../../../apps/enterprise-context-governance/README.md) 和 [Enterprise Context Governance Experience](../../architecture/ENTERPRISE-CONTEXT-GOVERNANCE-EXPERIENCE-PLUGIN-v0.1.md)：Host/provider 已有 OWNER/ADMIN/MEMBER/AUDITOR 关系、Grant、邀请和所有权转移的事实/生命周期能力；UI Experience 为独立**可安装**管理插件，Provider 拥有事实、Eidos 负责渲染。已读原文。
5. [apps/enterprise-context-governance/package.ts](../../../apps/enterprise-context-governance/package.ts)、[constants.ts](../../../apps/enterprise-context-governance/constants.ts)、[context-page.ts](../../../apps/enterprise-context-governance/context-page.ts)：已声明/实现 `/enterprise-contexts`（目录）、`/enterprise-contexts/new`（创建）、`/enterprise-contexts/overview`（概览）；`/enterprise-contexts/members` 等 **legacy route 仅映射 overview page**，不是独立成员/角色编辑器。概览只显示当前角色，无成员配置表。
6. [manager/provider-manager-page.ts](../../../manager/provider-manager-page.ts)：`/providers` 配置平台 Capability 与 Provider 的绑定，**不是业务用户权限/角色分配**。
7. [manager/settings-page.ts](../../../manager/settings-page.ts)：`/settings` 当前动态呈现**已安装且可配置**的插件设置；不能无插件时添加四张硬编码“业务管理/权限管理”卡。
8. [HOST-IDENTITY-USER-DIRECTORY-EA3B1](../../architecture/HOST-IDENTITY-USER-DIRECTORY-EA3B1-v0.1.md)：当前 Human Principal Directory 是基础身份事实，明确**不是** HR、企业组织树、角色管理、替代授权策略或传统 IdP。
9. [ENTERPRISE-CONTEXT-RESOURCE-CONTAINER-v1.0](../../architecture/ENTERPRISE-CONTEXT-RESOURCE-CONTAINER-v1.0.md)：企业上下文是访问隔离与资源命名边界；**安装 Package → 绑定某企业 → 按需 Provision** 必须分开。不同插件可有不同绑定要求，不能简单认为选择企业即一切业务后台自动就绪。

**现场 U 证据（非服务端实测）**：创建企业失败截图显示 `STATIC_POLICY_NO_MATCH`；东京兼容身份 `demo-user` 的 Basic Auth 不是正式个人用户认证。[预览环境授权 PR #1126](https://github.com/jiangxng/EVO-App-Platform/pull/1126) 及 [部署 Actions #40625798833](https://github.com/jiangxng/EVO-App-Platform/actions/runs/40625798833) 仅证明东京预览策略和部署门禁，不证明已完成生产 IAM 或企业权限管理界面。

## 三、建议采用的三层权限模型

### A. 平台层（Host 基础能力，非普通业务插件）
- **身份（Who）**：认证真实 Principal（Human、Agent、Service），有效 Session、撤销与停用；独立于企业组织。
- **平台权限（Platform）**：仅受信任平台管理员能发布/停用插件、配置 Provider、管理机密与全局安全策略。不得把“企业 OWNER”等同于平台超级管理员。
- **授权引擎（Decision）**：对当前 Principal + Enterprise Context + 操作 + 资源 + 生效策略做判定。默认拒绝、显式拒绝优先、服务端强制、每次请求重新检查、审计记录。
- **插件契约**：插件声明所需操作代码（Action）、资源类型、数据作用域；平台集中检查。禁止每个插件自建共享权限数据库。
- **主体代理**：Agent 的权限是受限委托，不能因 LLM 生成操作而自动继承全权；复用 PA05 的现有授予/撤销研究，不平行实现第二套 Agent IAM。

### B. 企业层（Enterprise Context 治理能力）
- 一个用户可以属于多个企业，每个企业的角色、授权和资源隔离不同。企业 OWNER 不跨企业生效。
- **基础成员关系**：OWNER、ADMIN、MEMBER、AUDITOR 维持现有模型；禁用、邀请、转移、撤销皆有审计；必须确保企业始终至少有一名有效 OWNER。
- **企业权限**：决定谁可邀请成员、分配角色、管理企业应用、审计企业行为；普通用户不能只凭看见页面就获授权。
- **企业应用关联**：Package 全平台安装，不代表自动对所有企业提供业务。展示每个企业的插件已安装 / 已绑定 / 服务就绪 / 无权限四种状态，不把选择企业等于 Provision 或后台在线。

### C. 应用与资源层（各插件声明、平台统一执行）
- 以插件提供的业务动作定义权限：如客户查看/新增/修改/删除、供应商导入、采购审批等，不为“所有插件”固化静态巨型总表。
- 第一版采用易理解的预置角色（企业 OWNER/ADMIN、业务操作员、只读人员）+ 可配置应用角色映射，权限粒度以操作为主。
- 第二版扩展到数据范围（企业共享、组织/部门、本人、指定资源），必要时属性条件（ABAC），审批及职责冲突防护（SoD）。
- **安全判定全部发生在 API/Host**；界面隐藏无权限动作仅为体验，不作为授权证据。

## 四、用户体验信息架构（建议，当前未实现）

### 入口一：平台管理（仅真正平台管理员）
用户头像/平台菜单 → **平台管理**（在无权时完全不出现或显示不可访问）：
- 用户与身份连接状态
- 平台管理员与全局权限
- 插件安装/版本/信任与 Provider / Secrets
- 授权规则、策略版本、紧急撤销
- 审计与故障诊断

不把上述项目放进普通企业的“设置”或普通业务导航；与现有 `/providers` 技术配置页面分层呈现。

### 入口二：当前企业 → 企业管理（由治理 Experience 插件贡献）
顶部选择企业 → 企业管理 / `/enterprise-contexts` → 当前企业详情：
- 企业信息（现有）
- **成员与邀请**（新增独立页面）：成员列表、邀请、撤销、角色、操作结果
- **角色与权限**（新增）：企业内角色以及可使用的应用
- **应用授权**（新增）：已安装应用、企业绑定/运行就绪、每个角色所获动作权限
- **访问记录**（后续）：谁何时以哪个身份对哪个资源做了什么

**不创建一个与 Enterprise Context Governance 重叠的第二套“权限 App”**。前台通过该可安装 Experience 暴露治理 UI，但底层 Authority 永远属于平台 Provider。插件未安装时不出现空导航；已经存在的企业事实不因 UI 插件卸载而丢失。

### 入口三：业务应用上下文中的便捷授权
业务页面中必要时显示“需要某权限 / 请联系当前企业管理员 / 查看权限申请状态”，链接到当前企业管理，且不绕过服务端拒绝。

## 五、避免本次问题反复发生的体验门禁

- **能不能展示**（Feature 是否安装并生效）与 **能不能打开**（Enterprise Context/服务绑定是否就绪）和 **能不能操作**（权限是否通过）是三项独立状态。
- 所有写入按钮（创建企业、邀请用户、授权、导入）在用户操作前查询可执行性、配置状态；缺授权则显示“当前账号没有权限”或管理员联系路径。API 每次仍强制重新校验，防止按钮状态过期。
- 错误要分层归因：未登录、无企业、未绑定业务服务、没有权限、规则未初始化、服务异常；不要再把 `STATIC_POLICY_NO_MATCH` 原文暴露给业务用户。
- 初始创建第一个企业要有**窄范围受控引导**：真实 Human 先完成登录/身份验证；受保护的企业创建策略只允许符合配置条件的 Principal；创建后记录 OWNER 与 Grant；不得给全部用户通配 CREATE 权限。
- 东京的共享 `demo-user` 是临时预览身份。正式部署前必须启用个人真实身份、身份失效/撤销验证及安全审计，不能复制东京覆盖规则到 Railway/生产。

## 六、实施顺序与验收

| 阶段 | 交付物 | 不可跳过的验收 |
| --- | --- | --- |
| **P0 权限基础与引导** | 首家企业安全创建、已登录用户有明确的创建资格、API 可执行预检、中文友好拒绝提示；界面显示有效权限/企业服务状态 | 未授权者仍被服务端拒绝；不会误授权其它 Principal；首次登录到创建企业全路径通过 |
| **P1 企业成员管理** | 在现有治理 Experience 增加独立成员/邀请/角色/撤销页面和 UI 签收；完整上下文隔离 | OWNER 保护、邀请/撤销与重新登录生效、多企业不可串权、角色变化留证 |
| **P2 插件与业务权限** | Action/Resource 权限声明注册、企业应用绑定和服务就绪状态、角色到动作的授权编辑器 | 安装/禁用插件即时反映界面；越权 API 全拒绝；不同企业/角色独立 |
| **P3 精细范围与 Agent** | 部门/本人/资源级权限、委托 Agent、过期/撤销、审批/敏感操作审计 | 复杂范围矩阵、跨 Agent/Worker 权限撤销、最小权限与审计可追溯 |

### 工程边界与下一步

1. 本文先定**现状、架构边界和建议路线**，不直接向东京发放额外权限或迁移任何数据。
2. 产品评审先确认：平台管理员 vs 企业管理员的导航关系、是否允许自定义角色、企业应用绑定的默认权限、正式新企业创建规则。
3. 由企业治理 Experience owner 实现 UI；Host owner 提供统一权限结果与管理 API；Eidos owner 继续统一样式；PA05 owner 维持 Agent 安全/身份架构。
4. 每一阶段保留 exact PR SHA/CI、部署、公网检查、Human 实测及权限负向测试**五种独立证据**；禁止通过健康检查冒充业务签收。
5. 本规划属于建议方案，不将尚未实现的管理 UI 或产品决策描述为已经部署完成。


## 2026-10-28 扩展：平台超级管理员、创建企业资格和商业套餐（必须一并阅读）

用户明确要求平台超级管理员给用户 A 授权“创建企业”；用户 A 创建企业后自动成为**所创建企业的 OWNER/超级管理员**，但不是平台超级管理员；EVO 还要支持多种套餐。

本文件此前专注于“现有授权引擎/企业治理 UI”。为避免另起第二套 IAM，新增两份**同一条工作线**的研究与实施提案，作为此规划的扩充而非替代：
- [EVO SaaS 平台权限、创建企业与套餐权益方案](EVO-SAAS-PLATFORM-ROLES-PLANS-AND-ENTITLEMENTS-20261028.md) —— 平台/企业角色、Creator Grant、创建事务、OWNER、订阅、权益、席位、AI、插件使用及分阶段验收。
- [国内外 SaaS 官方资料、等级与决策索引](EVO-SAAS-ROLES-PLANS-EXTERNAL-RESEARCH-INDEX-20261028.md) —— 2026-10-28 微软、Atlassian、Salesforce、GitHub、Vercel、Shopify、Stripe、Odoo、AWS、飞书、简道云、明道云、金蝶的原始链接；已读原文/P2 搜索摘要/P3 未验证明确分级，不把摘要等同完整原文。

**核心设计新增**：平台 Tenant Creator 授权 ≠ 企业 OWNER ≠ 用户角色 ≠ 套餐 Entitlement ≠ 插件安装/企业绑定。创建资格由平台控制，创建成功自动产生新企业 OWNER 与 Grant；套餐按企业订阅且限制功能/席位/用量，不能替代用户权限。Eidos 呈现，Host/Provider 统一强制；业务应用仍按需安装。基础权限检查、企业隔离与审计不应因订阅级别被关闭。

**此为产品规划文档**。当前没有平台超级管理员 UI、商业套餐 UI 或真实计费引擎，不能因规划 PR 合并而对用户声称已上线；不改 PA05/BEX/Eidos/EC 并行 owner、不迁移 Railway、不改东京现有数据。

## 最新用户决策（2026-10-28）：先做权限 0→1，不预定商业形态

用户强调未来 EVO 可能走**众包**、**复制独立实例部署**、**集中多租户**或混合盈利模式，暂时不应锁定 SaaS 套餐和角色模型。优先解决当前创建企业时的权限错误和缺乏管理页面。

- **新的近期实施边界与具体验收**：[EVO 权限中心 0→1 方案](EVO-PERMISSIONS-MVP-0-TO-1-20261028.md)。先 M0（只读资格/友好提示）、M1（可信登录与 Platform Owner 初始化）、M2（创建企业资格 Grant/撤销管理页）、M3（真实企业 OWNER 及跨租户验收）。
- 本方案取代此前把“套餐和计费中心”作为近期开发前置条件的建议；**套餐仍在研究计划**，但不进入第一阶段开发，也不作为企业创建的强制依赖。
- 保留平台授权的稳定通用契约（Principal/Action/Resource/Scope）、企业治理事实和可替换 Provider，兼容未来众包任务授权、实例复制和集中多租户。**平台 Owner 属于部署控制域，企业 OWNER 属于具体企业**，不得相互继承。
- 当前东京兼容 demo-user + Basic Auth 仅能作为单人 Preview。不能让共享演示身份成为正式多用户授权管理的超级管理员；上线可写管理页面前必须确立真实个人身份与管理员安全初始化。
- 此轮只改规划文档，不修改 Tokyo、Railway、生产数据或并行 owner。真实 UI 仍未完成，不能以 PR 合并或预览单项 Grant 掩盖未闭环的权限中心。
