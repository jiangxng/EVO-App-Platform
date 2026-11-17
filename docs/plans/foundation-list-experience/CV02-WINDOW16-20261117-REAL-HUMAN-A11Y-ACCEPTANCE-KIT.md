# CV-02 Window16｜真实企业 Human / 键盘 / 读屏 / 实体手机验收执行包（#03/07）

> **2026-11-17，状态：READY_TO_EXECUTE / HUMAN_NOT_SIGNED。** 此页是操作规程和空白验收回执，**不是**真人验收完成记录、生产授权审批或产品发布许可。当前只有工程/隔离 Chromium/东京 DEV 证据。没有真实账号、真实设备及有权签收者时所有 Human 项均为 `NOT_RUN` / `BLOCKED`，绝不把 CI Human UI Review Gate、自动化截图、静态测试身份或 Basic Auth 401 当做人类签收。
>
> **范围限定：** 现有客户、供应商、我的客户、我的供应商四个 Eidos Catalog READ 列表；原 Domain Owner 的状态 `ACTIVE|INACTIVE` AND 搜索、焦点恢复、排序、分页、详情返回与当前页有权 CSV；禁止新增 List、Agent 专用查询、权限例外、数据库迁移或页面重写。正式 CV03 Saved Views Human SAVE 仍 OFF／N1 NOT_CERTIFIED、CV04 跨页后台 EXPORT 仍 OFF；Owner [#1212](https://github.com/jiangxng/EVO-App-Platform/issues/1212)、Operator [#1092](https://github.com/jiangxng/EVO-App-Platform/issues/1092) 不因此关闭，并行 [#1184](https://github.com/jiangxng/EVO-App-Platform/pull/1184) 不动。

## 0. 进场条件（缺一条即 BLOCKED）

1. **真实身份：** 在获授权的 DEV / PREVIEW 环境，实际 Human 企业登录得到可识别但不公开的用户/企业上下文；仅通过外层 **HTTP Basic Auth** 或 Local Experience 静态 `HUMAN` Session 不足以满足。不得在此文件、Issue、截图或日志存密码、令牌、Cookie、个人税号、客户明细、完整企业 ID。
2. **可测试的最小真实 READ 权限：** 由真正的测试企业/业务 Owner 提供一个对四个列表均可阅读、允许读取 `status` 字段的合规账号；另一个现有受限账号用于验证字段或跨企业拒绝。不要为测试临时扩大生产角色；如没有账号或合适的 ACTIVE/INACTIVE 数据，记录 `BLOCKED` 而不是伪造。
3. **目标版本：** 每次执行前由运营人员从实际运行环境确认服务器 **runtime image SHA、环境别名、认证方式及时间**，而非仅复制仓库最新 main。基准已核验 [Platform main `a211b5bfcfbed4ceadc942dff3df27bb5fc3327b`](https://github.com/jiangxng/EVO-App-Platform/commit/a211b5bfcfbed4ceadc942dff3df27bb5fc3327b) 和同 SHA [东京 DEV 发布 #44023312229](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44023312229) healthy/HTTPS/匿名 Basic Auth 401；**这不是企业登录证据**。如实际运行 SHA 已变化，先核对其变更和 CI，禁止套用旧版本 PASS。
4. **实物与辅助技术：** 真实桌面键盘、真实手机及外接键盘（如果声明此项 PASS）、一套实际 NVDA + 浏览器以及一套实际 VoiceOver + Safari（或据实注明另一读屏组合）和可复核录屏方式。390px Playwright 触屏模拟 **不能**替代手机；读屏器模拟属性检查 **不能**替代读屏。
5. **独立签收人：** 指定真实业务 Human 体验者和有授权的验收审核者，记录实际角色与 GitHub 审核链接；AI 生成的摘要、CI Job 机器人和开发者自报不等于独立 Human 签署。

## 1. 固定受测路线和预期

| 案例 | 已有 Eidos 路由 | 人工权限预期 |
| --- | --- | --- |
| C1 客户 | `/counterparties/customers` | 当前企业内授权客户 |
| C2 供应商 | `/counterparties/suppliers` | 当前企业内授权供应商 |
| C3 我的客户 | `/counterparties/my-customers` | 仅本人责任范围内有权客户 |
| C4 我的供应商 | `/counterparties/my-suppliers` | 仅本人责任范围内有权供应商 |

每个案例在 **桌面实物键盘**、**实体手机触控** 和 **真实读屏器/辅助技术** 下分别记录。没有相应 READ grant 时预期的是明确拒绝/隐藏控件，而非借管理员账号跳过权限。个人 Agent READ 和当前页 CSV 已有自动回归，但不能从人类 UI 报告扩张到 Agent WRITE、后台跨页 EXPORT。

## 2. 人工逐步执行（每个有权页面均重复）

| ID | 实际操作 | 必须实际观察的结果 |
| --- | --- | --- |
| H01 | 进入真实登录的企业及相应 C1–C4 列表，先记实际环境和受测角色 | 无越权资料；业务页面确实来自已确认 runtime SHA，非静态 HTML/fixture |
| H02 | **桌面全程不碰鼠标**，Tab 顺序进入三个状态原生按钮；使用 Enter 选择 `启用` | 唯一 `aria-current` 状态改变；Owner 请求后结果更新且焦点仍回到 `启用` 新控件 |
| H03 | 使用实体键盘 **Space** 切换 `停用`，再 Enter 返回 `全部状态`；连续重复两轮 | 每次只触发一次合法 Owner 导航；不丢焦点、不回到 body、不误跳到旁页；`ALL` 不保留 `status` 参数 |
| H04 | 搜索框输入**预先获准的非敏感测试关键词**并 Enter，随后改状态、清除状态、清空搜索 | `status AND search` 而非页面内假筛选；条件切换 `page=0`，合法排序/列布局保持，焦点回到同一搜索框/按钮 |
| H05 | 对授权页使用表头排序、列隐藏/恢复、上一页/下一页，打开详情并返回 | 同一有权查询，总数/列头/搜索/排序/合法分页不丢；不能隐藏必需主列或用 URL 获得未授权列 |
| H06 | 下载**仅当前页** CSV；选一组确有授权数据与一组空结果 | CSV 只包含当前可读列和当前页；空结果只有表头；无其他责任人/企业或隐藏字段；不是跨页后台 EXPORT |
| H07 | **真实手机**用触控完成 C1–C4 状态/搜索/详情返回；另用实体手机外接键盘复测 H02–H04（若具备） | 文字清晰、状态不只靠颜色、无横向页面溢出、按钮可达；手机键盘 Space/Enter 只有真正执行后才可 PASS |
| H08 | **真实 NVDA 或 VoiceOver** 逐个宣读状态分组/选中项、搜索标签、表头排序方向、结果和空结果，再经 Owner 重新查询 | 人可以听懂控件名称、角色和选中状态；焦点/阅读位置连续且没有读出被撤销字段 |
| H09 | 在**有权操作的现有**受限身份或已合法切换的企业上下文复核无字段 grant / 不属于本人责任范围 / 无权限的页面 | 应隐藏或拒绝，`total`、CSV、浏览器缓存、URL 不能泄漏被拒绝数据；禁止测试中自行伪造 Principal 或修改权限 |
| H10 | 用正常导航退出当前列表/切换企业/返回浏览器历史，再重新进入 | 不携带前一个企业/会话/页面不合法的受管焦点、旧数据或已失效查询；失败关闭 |
| H11 | 真实审核人检查日志、经遮挡的录像及用户反馈，填写下面的矩阵并签署 | 对未测试项保留 `NOT_RUN`，环境不满足标 `BLOCKED`，任何失败标 `FAIL` 并创建有复现步骤的 Issue |

**失败判定：** 任一跨企业/无权字段泄漏、读屏误导、按钮只能用鼠标、Space 无效、重新查询后不可继续键盘路径、重要错误不可恢复，均不是 PASS。不得为得到绿灯而跳过该场景或将真实登录换成静态会话。若数据不含满足测试的合法记录，结论是 `BLOCKED`，不是成功空列表。

## 3. 未签收的空白执行矩阵（本文件为模板，勿预填 PASS）

使用一条具有真实签署链接的外部受控回执按下表逐行记录；三类“通道”的含义不同：

| 真实场景 | 桌面实体键盘 H01–H06 | 物理手机 H07 | 真实读屏 H08–H10 |
| --- | --- | --- | --- |
| C1 客户 | NOT_RUN | NOT_RUN | NOT_RUN |
| C2 供应商 | NOT_RUN | NOT_RUN | NOT_RUN |
| C3 我的客户 | NOT_RUN | NOT_RUN | NOT_RUN |
| C4 我的供应商 | NOT_RUN | NOT_RUN | NOT_RUN |

另独立填写 H09 的无授权账号/换企业拒绝以及 H11 审核人确认。只有 **12 个通道均实际执行并有逐项证据、H09 拒绝通过、H11 实际审核签名**，才可由有权 Human/业务 Owner 宣布本 **CV-02 范围**的 Human 验收。没有物理设备/读屏器时只可结论 `PARTIAL/NOT_SIGNED`；不以自动测试填空。

### 可复制的人工回执字段（模板，尚未发生的均填 NOT_RUN）

```text
CV02 Human accessibility acceptance / status: NOT_SIGNED
实测日期/时区: NOT_RUN
实际站点环境别名（非秘钥）: NOT_RUN
实际运行镜像 SHA（从目标环境查询）: NOT_RUN
真实企业登录类型（不要身份令牌）: NOT_RUN
测试者 GitHub/组织审核角色（不记录个人隐私）：NOT_RUN
独立审核者 GitHub/职责：NOT_RUN
实物设备/系统版本/浏览器/外接键盘：NOT_RUN
读屏器产品与版本、浏览器：NOT_RUN
C1桌面 / 手机 / 读屏：NOT_RUN / NOT_RUN / NOT_RUN
C2桌面 / 手机 / 读屏：NOT_RUN / NOT_RUN / NOT_RUN
C3桌面 / 手机 / 读屏：NOT_RUN / NOT_RUN / NOT_RUN
C4桌面 / 手机 / 读屏：NOT_RUN / NOT_RUN / NOT_RUN
H09无授权与跨企业拒绝（合法受限身份）：NOT_RUN
H10退出/换企业/返回后的焦点与数据：NOT_RUN
失败/阻塞及其 Issues：NOT_RUN
受限访问的脱敏截图/视频/回执指纹、存放位置：NOT_RUN
实际测试者 GitHub 评论或签核链接：NOT_RUN
独立 Human/Owner 审核签核链接与决定：NOT_RUN
结论：NOT_SIGNED（无上述两项真实签署不得改变）
```

**最小证据要求：** 回执绑定实际 **runtime SHA+环境+操作时间+真实设备/读屏器版本+案例 ID+期望/实际+失败记录/脱敏截图或视频+真实测试者/独立审核者链接**；证据保存到获得授权的私有位置，GitHub 仅保留可访问性受控链接、文件 hash 与非敏感摘要。不要上传 Cookie、登录态、私密客户 CSV、未遮挡的姓名、电话、税号、敏感企业数据；必要时用严格授权测试数据并标明来源。人类审核若否决应保留 FAIL，不得修订为自动 CI PASS。

## 4. 已获得的工程证据（仅作为预检前置，不是 Human 回执）

- [Eidos #217](https://github.com/jiangxng/eidos/pull/217) 与 [Platform #1341](https://github.com/jiangxng/EVO-App-Platform/pull/1341)：真实入口是 **Eidos Workbench**，共享受管焦点 helper，旧 Browser Shell-only 修复不能当成实际用户验收。
- Platform [`main@a211b5b...` 的 8 项检查](https://github.com/jiangxng/EVO-App-Platform/commit/a211b5bfcfbed4ceadc942dff3df27bb5fc3327b/checks) 均 SUCCESS，含 [真实 Host Chromium #44023278978](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44023278978) 四组焦点恢复与组合筛选、六组 CSV，及 [东京 DEV #44023312229](https://github.com/jiangxng/EVO-App-Platform/actions/runs/44023312229) 镜像发布/healthy/HTTPS/匿名 401；都不能证明现实企业 SSO/人类读屏、实体 Space。
- 原 [#1337–#1340 失败和边界记录](https://github.com/jiangxng/EVO-App-Platform/pull/1340#issuecomment-6938754854) 与 [#1341 最终工程交接](https://github.com/jiangxng/EVO-App-Platform/pull/1341#issuecomment-6939437298) 均保留；**不删除失败、也不重复开发**。
- 原始 [八部分 UI 评审](../../ui-design-reviews/CV02-20261117-COUNTERPARTY-OWNER-ROUTE-FOCUS-ACCEPTANCE.md)，[唯一 CV-00～07 计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md) 是设计与里程碑权威；此页只把真实 Human 入口做成可执行清单。

## 5. 工程与 Human 的独立最终状态

本页创建时 **CODE/CI/DEV_DEPLOY = 已按准确 SHA 核实；HUMAN = NOT_SIGNED，生产认证 = 未开启**。未来实际签收应由被授权的真实参与者创建独立有时间戳的 Human 回执/Issue 或 PR 审核；本文件不自行修改为 PASS。得到回执之后，下一窗口只核查该回执的身份/场景/证据完整性，处理真实 FAIL；**不能因文档合并直接开放 CV03 SAVE、CV04 后台 EXPORT，或关闭 #1212/#1092**。
