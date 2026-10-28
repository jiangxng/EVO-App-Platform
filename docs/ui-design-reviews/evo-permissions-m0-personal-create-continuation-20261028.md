# M0 创建第二家企业：个人空间入口与资格预检闭环（2026-10-28）

U：用户东京两张真实截图显示已有企业时创建按钮消失，“查看创建资格”只要求切换个人空间，却没有实际切换操作。P1：源码显示顶部下拉框只保留 ENTERPRISE，目录把 PERSONAL_CONTEXT_REQUIRED 当成真实授权拒绝。没有一人一家企业的配额。本 PR 只修复 M0 用户任务入口，不包含 M1–M3。

## 目标与完成条件
已拥有企业的 Human 在企业空间仍能点击“创建新企业”，安全切到自己的个人空间再进入创建表单。DENIED、未登录、非 Human 和 Provider 故障继续 fail closed，不允许自动授予权限。企业既有 OWNER 与数据不变。

## 流程与步骤
1. 顶部选择器提供本人 PERSONAL 和可访问 ENTERPRISE，而非只显示企业。
2. 企业目录在 PERSONAL_CONTEXT_REQUIRED 状态下保留主“创建新企业”，通过 enterprise.context.select 命令验证选择本人个人空间，再进入 /enterprise-contexts/new。
3. 资格页与被拦截的创建深链提供“切换个人空间并创建企业”，去掉没有操作价值的假资格卡。
4. 在创建页和提交时分别重新核实是否有资格，提交仍要求显式 Human 确认。

## 导航与信息架构
继续使用 Eidos Workbench 原有全局上下文选择器、CatalogBrowser 页级动作和已有创建表单。没有新增全局导航，也没有将资格查询冒充 M2 的平台权限授予管理。

## 视觉与颜色
按钮在目录头部固定可发现，低频资格查看为辅助操作；空资格卡改成明确动作。未增加私有 CSS、按钮风格或颜色，复用 Eidos token。原用户截图是旧版负面证据，修复版浏览器尚未验收。

## 记忆与注意力
被用户选中的 personal context ID 保留到 evo.context.id，不再被默认企业覆盖。创建另一企业无须先猜测技术上下文的含义。真实账号授权失败仍解释原因，失败不改变已有企业。

## 无障碍与跨年龄
原生 select 和带文本的 Eidos 按钮保留语义与键盘能力；个人空间标签直写中文“个人空间”，英文“Personal space”。桌面及 390px 可见性、焦点顺序仍待实机。

## 安全与数据修复
目标 personal ID 由 Host 已认证 Context Registry 提供，选择命令仅接受 principal 可访问的 ID，不能切换到别人空间；实际创建权限 Provider/Personal/Human/确认门禁不变。不得修改 Railway、PG、持久卷、东京部署或 PA05/BEX/Eidos owner 代码。

## 证据与剩余问题
用户两张原版东京浏览器截图为 U，仓库 manager/desktop-workbench-runtime.ts、manager/server.ts、manager/enterprise-create-eligibility.ts、apps/enterprise-context-governance/context-page.ts 与 context-actions.ts 是 P1 源码。tests/protocol/enterprise-create-eligibility.test.mjs 新增已拥有企业的二次创建、个人空间与跨用户拒绝、DENIED 仍拒绝等测试。CI、main 合并、东京发布、公网与 Human 分开核实，不以此文档冒充通过。

## 页面模式与导航归属
页级创建操作属于企业目录，个人/企业切换属于 Workbench 顶部全局选择器；仍然使用 Eidos CatalogBrowser + ActionHost 既有动作契约，不复制 V3 CSS。

## 功能、布局、颜色对照
功能：二次创建、受保护的本人个人空间切换、拒绝权限继续 fail closed，代码提交后待准确 HEAD CI。
布局：目录保留创建动作，资格页用可执行继续操作代替虚假状态卡，待实际浏览器。
颜色：Eidos 已有主次操作色彩，无硬编码，待 Human。

## 入口、退出与恢复矩阵
入口：我的企业 → 创建新企业 → 如果企业上下文，则选择本人个人空间 → /enterprise-contexts/new → 资格与提交重新核验。
退出：原“返回企业列表”回到 /enterprise-contexts，顶部可以重新选择企业。
异常恢复：未登录、DENIED、非法目标、Provider 异常均不能创建；切换失败不影响旧企业与 OWNER。

## 浏览器与 Human 证据
桌面：旧版截图负面实证，新代码尚未真实浏览器验收。
移动：390px 新代码尚未实测。
Human：未签收。