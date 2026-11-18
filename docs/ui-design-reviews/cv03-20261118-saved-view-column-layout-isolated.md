# CV03 / List Foundation MVP #02 — 保存个人视图时保留列布局（2026-11-18）

> 唯一 Human UI 代码：`manager/cv03-personal-saved-view-human-form.ts`。仅修复**隔离测试**的 Human Save-As → 原 Dictionary Owner READ → 原 Signed Host WRITE → 原 Eidos 视图恢复。正式服务器 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、`N1=NOT_CERTIFIED`；无任何对外登录、生产 Feature 注册或授权变更。此评审是工程证据，不是 Human 实机签署。

## 目标与完成条件

现有隔离测试的「将当前筛选保存为我的视图」会保存 search/sort，却丢失 `columns`，导致用户已经隐藏、重排的列在重新打开时恢复成默认列。修复后，现有 Domain allowlisted `columns`（包含 first `displayName`，无重复/未知）按用户正在看到的顺序进入保存表单返回路径；签名写入前再与实时 Owner 的有权字段集合交叉验证。查询和列布局需在真正保存的私人视图中一致，恢复显示同样顺序。

## 流程与步骤

隔离 Human 打开「业务字典」，筛选 Hong，排序，选择列 `displayName,state,dictionaryId` → 进入已有「保存我的视图」表单 → 表单保留 allowlisted 目录路径，包括显示列但**不保留**之前 `personalViewId` → 用户填新标题并确认 → Host 实时重读 Dictionary Owner → 验证用户要保存的每列在当前 `readableFieldIds` → 走原 Capability WRITE + Host 签名 + PostgreSQL 原子 Receipt → Eidos 导航到新私人标签页，列表显示原来的三列及顺序 → 切回查看时再次经过 Host READ。若列权限已撤销，只回错误、不进入 WRITE。

## 导航与信息架构

入口仍属 Eidos Dictionary Catalog 的个人 Saved View 私有设置表单，页面 archetype 是现有 `UidlFormV011`；不是全局菜单或新增第二个 List Framework。上下文返回导航由 `businessDictionaryDirectoryQueryRouteV010` 构造，`personalViewId` 为不可信浏览器 Hint，不是 owner 令牌。新 View ID 必须来自可信 Host，不复用旧 view 的身份。

## 视觉与颜色

Eidos 原有表单控件、标题、中文「保存为我的视图」和 `requiresConfirmation` 不变；不创建新的 HTML、CSS、图标或按钮色。列表的列序恢复仅由原 Eidos Catalog `table.columns` 展示。正式服务中此保存表单仍不可路由，不使未获批准的控制意外出现。

## 记忆与注意力

保存的目标是**用户现在正在看的列序**，不应该悄悄回到所有默认列；用户不需要记忆自己隐藏了哪些字段。仅保存源查询配置与授权列名，不缓存业务行、个人会话、跨企业状态或未经授权字段。历史 `personalViewId` 从 Save-As 表单中剥离，避免错误覆盖/混淆上个个人视图。

## 无障碍与跨年龄

仍由原 Eidos 表单标签、确认和 Catalog 表头提供文字/键盘可用路径；不新增焦点陷阱、隐藏式仅图标行为。协议回归只核实字段与路由，不冒充实体键盘、物理手机或 NVDA/VoiceOver 通过；正式 #1343 Human 仍 0/12 NOT_SIGNED，内部 MVP 开发继续。

## 安全与数据修复

- URL 的 `columns` 在原 Directory parser 限制枚举/长度/唯一/首列；仅是**展示意图**。
- 保存时调用当前 Principal/Enterprise 的真实 Dictionary Owner READ，全部 `columns` 必须仍在实际 `readableFieldIds`，撤权即 fail-closed，**无签名 WRITE**。
- 无 `columns` 的旧路由继续采用先前的可读默认列，兼容历史使用；`personalViewId` 不进入新资源身份或权限。
- 审批、签名 Receipt、PG Resource CAS、replay、unknown ACK、跨人/企业隔离、Feature 停用仍归现有 Host/Domain/Provider；不扩大 SAVE、CSV、后台 EXPORT 或 Agent WRITE 能力。

## 证据与剩余问题

- 已存在的 PostgreSQL 18 隔离 Human/Agent/Host 测试扩展为真实 `SAVE → receipt → readback → Eidos restore` 保持 `displayName,state,dictionaryId` 顺序。不得以无数据库的 protocol test 冒充真实 PG 证据。
- 新的 `tests/protocol/cv03-personal-saved-view-form-columns.test.mjs` 定向覆盖未授权 `state` 被撤权、非法/重复列、旧 `personalViewId` 不继承、保存前新 Owner READ，且不创建第二份 Authorizer。
- 精确 PR HEAD CI / 真实 PostgreSQL 专项工作流、合并后 main CI 和 Tokyo 运行时分类以 GitHub 原日志为准；本文件未预写 PASS。
- 未覆盖：真实生产 IdP、持久 PA05/AuthorizationProvider 同 PG T0、跨物理 Host、安全 Owner/DB 批准、独立 Human 手机/读屏签署。因此商业 SAVE 仍是上线前门禁，不能通过本次补列序开通。

## 页面模式与导航归属

Eidos `CatalogBrowser` 的保存个人视图原表单，属应用内当前列表的上下文动作；不是工作台的顶层入口。唯一主动作 `Save As` 需要当前 Human 企业上下文和确认。误来源/撤权时错误在原 Action Reply 显示，由用户返回列表或更改权限后重试，不进行盲目保存。

## 功能、布局、颜色对照

| 维度 | 原有证据/缺陷 | 本次最小修复 |
| --- | --- | --- |
| 功能 | 搜索、排序与 Source READ/签名写回已有；现有 Save-As 丢失列布局 | 保留当前列显隐与顺序 + 写前 Owner 授权交叉验证 |
| 布局 | Eidos 现有 Form → Catalog 个人 View 标签 | 不新增控件；保存/恢复使用原表格列次序 |
| 颜色 | 原 Eidos token | 不增加 CSS、品牌色或新的 selected 状态 |
| 权限 | PG 测试签名，生产 SAVE 始终 OFF | 保留原门禁，不允许通过列意图提升字段授权 |

## 入口、退出与恢复矩阵

| 场景 | 入口 | 退出 / 原父级返回 | 失败恢复 |
| --- | --- | --- | --- |
| 从系统 View Save-As | 有权 Dictionary 列表及自选显示列 | 新视图确认后返回 Eidos 原业务字典页并呈现新私有 Tab | 旧路由/非法列在表单或 Host 拒绝 |
| 从已有私有 Tab Save-As | 合法 `personalViewId` + 当前列序 | 新视图有独立 Host 生成 ID，原私有资源不覆盖 | 去掉旧 view Hint，不能把它当 WRITE 凭据 |
| 已撤权字段 | 原 URL 仍带 `state` | Host 返回拒绝，不导航到虚假成功页面 | 重开源列表获取当前授权列再保存 |
| 两个企业 / 真人与 Agent | 仍用原 Scope Host 和真实 Owner READ | 读取/恢复在当前 principal 下再次授权 | 禁用 Saved View Feature 或换企业原 Reader 不泄漏 |
| 默认列（旧链接） | 未携带 `columns` | 保留旧有默认读列行为 | 不要求迁移历史保存配置 |

## 浏览器与 Human 证据

桌面：本 PR 以协议与隔离 PG 自动化证明列设置/恢复的正确性；未声称新真实 Human 截图已取得。
移动：Eidos 原表单/列表 390px 已有历史自动 UI 证据，本 PR 未新增实体手机真实点击或外接键盘证明。
Human：未签收，#1343 保留 0/12；所需独立真人资源延期至对外真实身份场景。

功能：隔离环境中的个人视图保存现在保留用户选择的列顺序，不修改业务数据。
布局：既有 Form → Eidos Catalog + 个人视图导航，无额外通用组件。
颜色：完全使用原 Design Tokens，无私有样式。
入口：当前有权 Dictionary 的 Save-As 表单，不新增生产链接。
退出：成功只导航到当前企业下的新私人 View；在原 Eidos 重新授权。
异常恢复：旧 URL/权限撤销/错误列前置拒绝，不能产生误导的成功回执。
桌面：自动协议/隔离 PG 的代码回归，不等同实机 Human。
移动：390px 人工体验本轮未取得。
Human：0/12，商业上线前才进入签收。
