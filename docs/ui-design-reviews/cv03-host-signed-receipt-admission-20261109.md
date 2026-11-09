# CV-03 C3-02 Host 签名准入：人机体验与原 Eidos 边界审查（2026-11-09）

> 工程 PR [#1183](https://github.com/jiangxng/EVO-App-Platform/pull/1183)。本 PR 触及 `manager/cv03-personal-saved-view-host-issuer.ts`，名称包含 Saved View，但这**只是 Host 权限签发边界**，不生成或修改任何页面、按钮、颜色、Eidos 渲染器或路由。此工单的 UI 审查是为了明确何者尚未验收，**不代表 Human PASS**。

## 目标与完成条件

让已有、默认不注册的 Personal Saved View WRITE 严格由可信 Host 对当前 Principal/Enterprise、已启用 Capability Operation、授权 Provider 决策和资源精确写入摘要签发 HMAC 证据；共享 PostgreSQL Provider 不再只接受任何调用方可以构造的未签名 `AgentActionReceiptBeginInputV010`。真实 PG18 tests 和轻量宿主/权限回归通过后只将代码合 main，不开放用户入口。

## 流程与步骤

Human 或 Personal Agent 在未来注册后触发原 `collection.saved-view.personal.save` Action；原 ActionRouter 先做权限检查；Host issuer 再实时复查 Feature/Operation/Actor/Context 和 WRITE Safety，签发域隔离 proof；PG Owner 校验 HMAC、CAS 版本，资源与历史 Agent receipt 同事务提交。认证失败、停用、跨企业、签名错或无 verifier secret 时**拒绝写入**，不展示虚假“已保存”结果。当前只在隔离 Host fixture 中实测。

## 导航与信息架构

不引入新导航层级，也不修改 Business Dictionary、Counterparty、Catalog Browser 或已有系统视图的入口及返回路径。生产 Feature 不注册，用户界面中不出现新的 Saved View 保存按钮。下一阶段必须在原 Eidos Catalog Browser、受管 Host Action 接口上实现“进入列表→保存我的视图→切换→详情返回→错误恢复”，本 PR 没有完成这一路径。

## 视觉与颜色

功能：仅签发器、存储校验及协议测试，不改变页面可见功能。

布局：未改动列表布局、按钮位置或导航位置，继续使用既有 Eidos 组件。

颜色：没有增加新颜色、阴影、字体、主题 token 或 CSS。任何“保存成功”颜色提示均需来自后续真实 Host 提交回执。

## 记忆与注意力

用户不应记住 idempotency key 或密钥，也不应自行判断是否写入成功；这些由 Host 与 PG 完成，未知 ACK 只能核验历史 receipt，不自动重复创建。本 PR 不增加弹窗、确认流程或额外录入步骤。

## 无障碍与跨年龄

没有新增 DOM 或交互控件，所以不声称 390px、键盘焦点、触摸、阅读器或真实 Human 完成验收。未来 Eidos 保存/切换入口必须符合原设计语言和可恢复的导航焦点，特别验证老用户和低视觉负担场景。

## 安全与数据修复

签名仅证明同一签发域里的批准材料完整，**不是**生产独立 SQL 账号、触发器物理授权、正式 Host permit/PA05 身份或跨数据库事务认证。隔离测试密钥不可用于生产；真实 secrets 的生成/轮换/撤销、部署拓扑、备份与旧数据迁移继续由正式 Host/Provider Owner 验证。没密钥直接 fail-closed，不能退回无签名 `putIfRevision`。

## 证据与剩余问题

- GitHub 隔离真实 PostgreSQL 18 跑正常 Human/Agent、同事务资源与不可变回执、双进程、丢 ACK/重复 key；增加签名错、无密钥、当前权限撤销和插件停用等负例，以 #1183 **最终 HEAD** 为准。
- `manager/cv03-personal-saved-view-host-issuer.ts` 是本 PR 唯一带 `saved-view` 名称的 Manager 新增代码，不是 Eidos 页面；不因 CI 的“Human UI Design Review PASS”而宣告真实 Human UI 体验通过。
- 未完成：生产 Host 正式 issuer/secret 接线及独立 SQL admission、Eidos 桌面/移动端 390px 视图操作、真实 LLM Plan→WRITE→receipt 和 Human 签收；CV-03/C3-02 仍有生产门禁。
