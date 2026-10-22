# BEX-01 V3 / M06｜锁定原型与真实 Host 双视口对照证据（2026-10-22）

## 不重新设计；固定来源，独立三维判定
Approved #909 HTML: \`af58e0abad880439d54230485305bf2b4e05decc\`, Git blob \`9f57e9320eb527786ff7b737be27777eba6f8a92\`。现有真实业务 Draft PR #1086 沿用先前所签来源与研究索引。本批用已存在的 **合成** 172 行／22 列 Real Host fixture（16 matched, 4 proposed, 2 pending, 3 actionable issues），不复制或声称得到客户 Excel；未做真实客户导入。新的 Chromium 工作流仅以精确 SHA 下载锁定原型并校验 Git blob hash，再启动两个浏览器以 1280/390px 同尺寸生成对照截图。

## 自动化检查与 Human 审核分工
- **功能**：真实 Host 加载持久化 Import Job；文件、22 来源列、四项指标及三项问题一致；全字段筛选、未保存选择触发状态更新，撤销恢复；本地选择不触发 Host 命令、不减少需审核的 Host issue 指标。
- **布局**：文件、指标、问题列表、四字段表的阅读顺序；手机卡片、无水平整体溢出、真实控件可点击。原型 topbar 与真实 Eidos Host 身份壳不可按像素直接比。
- **颜色**：用浏览器计算样式核对源色板的文字 \`#172b44\`、重点指标 \`#fffdfa\`、matched \`#eaf7f1/#18765a\`、proposed \`#eef5fd/#2b65aa\`、attention \`#fff6e7/#a66712\` 和 excluded \`#f0f3f6\`。取真实 CSS computedStyle，非只凭静态字符串。
- **截图**：\`v3-locked-prototype-1280px.png\`、\`v3-real-host-1280px.png\`、\`v3-locked-prototype-390px.png\`、\`v3-real-host-390px.png\`；同一 artifact 内还包括 \`v3-prototype-host-human-review.html\` 并排阅览页及 \`v3-prototype-host-parity-observation.json\` 数字观测。
- **Human 仍必须分别签署**：功能、布局、颜色每轴各自 100%。源原型的模拟自动保存、模拟成功和非 Host 外壳不得复制为生产行为；真实授权审批路由分步保留。截图程序并不会替用户签收，也不使用客户原始数据。
- **边界**：如 CI 红灯先核实运行日志与固定原型资源可达性，不做无关修补；只在本 Draft 分支提交。不影响另一个主线窗口。M04、M05、M06 保持 OPEN，阶段总计 3/6；不得 merge main / Railway deploy。

## 首轮失败证据与原因判定
- 首轮 `ae85472` 的真实 Chromium 失败于测试的错误假设 `attention==2`。当前真实页面还有 `suggested` 或 `pending` 来源列；Host 保留三项问题还包括 3 行主体类型校验，不应简单等同于“黄色状态行的数目”。源原型哈希下载已经通过。
- 仅修正 **测试断言的语义**：matched/proposed 继续精确检查 16/4；所有 attention/pending/suggested 合计 2 列且每类警告标签均为原型颜色；Host 固定问题数仍独立要求 3。保留截图、撤销、权限和业务 UI 不变。不得以这次测试更正宣称人工完成验收。

## 第二轮更正：已授权字段身份不等于原型演示占位符
- 首轮语义修正后，第二轮真实浏览器成功验证 22 列与原型色标，但断言仍错误要求第 21 列银行为 `__PENDING__`。已有批次作业创建的企业扩展字段可能已经写入当前隔离企业，其初始 select 值是 Host 实际生成的 `ext_*` 稳定 ID。
- 这不是应当回退的业务错误。浏览器测试改为从当前获授权的 HTML select 中读取真实初始值与状态，临时选 `__IGNORE__`，然后 reset 必须准确回到 **同一原值和状态** 且不发 Host action。不得凭演示源猜银行字段、不得用静态 `__PENDING__` 伪装已批准映射。保留失败记录，不偷换客户 M04/M05 门禁。
