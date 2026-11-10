# CV-03 N1-04j — 恢复的 Saved View Feature 启动隔离兼容审查

## 目标与完成条件
在正式 Host 读取 PA05 持久状态后、HTTP 开始监听前，拒绝未经生产认证却恢复为活跃的 `host-enterprise-context-provider.personal-saved-views`。已安装宿主包、普通 Default Feature、只读 Eidos 页面继续可用。生产 `APP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF`、SAVE 403、未注册 Page GET 404 不变。

## 流程与步骤
无新增用户交互或配置字段。恢复到未经注册的活跃 Saved View Feature 时 Host fail-closed，报固定错误 `CV03_N104J_RESTORED_SAVED_VIEW_FEATURE_RECERTIFICATION_REQUIRED`，不删除或重写 Operator 状态文件。仅由原持久状态管理流程和具备授权的运维人员处理异常；本 PR 不提供 CLI、自动卸载、DB 修复、人工开关绕过。

## 导航与信息架构
未增加菜单、页面、插件卡片、个人代理工具、Context 切换、路由或 Handler。原 `APP_PLATFORM_CV03_PERSONAL_VIEW_PAGE_MODE=READ_ONLY` 不是 WRITE 授权；即使它为 READ_ONLY，恢复未经认证的 WRITE Feature 也必须停止启动。正常 Host 的目录 API `/v1/catalog` 仍可用。

## 视觉与颜色
没有修改布局、主题、Token、字体、颜色、按钮位置或导航。沿用 Eidos + Platform 现有设计语言，不创造另一套 List/Collection 框架；`manager/server.ts` 和 `manager/cv03-personal-saved-view-host-admission.ts` 因影响启动/入口被 UI CI 识别，故在本 PR 补充此审查而非跳过门禁。

## 记忆与注意力
用户无需记忆新开关或手动清除历史视图数据。启动拒绝保留现有文件字节，避免未经授权的静默修复或状态覆盖；未活跃的安装元数据和普通 Host Default Feature 保持正常。不把 Page 模式或配置字段作为“已经授权”的暗示。

## 无障碍与跨年龄
不改变键盘、焦点、ARIA、控件尺寸、屏幕阅读器朗读、色彩对比或触摸行为；本轮是后端 Host 启动守卫。未做实际浏览器、移动端 390px、人类视觉或辅助技术验收，不把 CI 的 Human UI Gate 冒充真实签收。

## 安全与数据修复
实际 FileLifecycleStore Snapshot 含精确可选 Saved View Active Feature ID 时在任何 HTTP 服务前拒绝；仅需检查可信本地结构，不信任已持久的 `packageId` 声称来豁免，不导入完整可选 Feature Manifest 造成 Host 懒加载副作用。检查不自动查/改生产 SQL、未提供向外部 LLM 的新 Capability，不能解决跨 Worker 漏投撤权后 SQL Mirror 保留的旧 ALLOW。正式 SAVE OFF/403、GET 404 不变；N1 继续 `NOT_CERTIFIED`。

## 证据与剩余问题
[本 PR N1-04j 专项交接](../plans/foundation-list-experience/CV03-N104J-REAL-HOST-RESTORED-FEATURE-STARTUP-QUARANTINE-20261110.md) 和原决策索引第 11 节记录准确源码/范围。新 `tests/agent-line/cv03-n104j-real-host-startup-quarantine.test.mjs` 对**真实 dist/manager/server.js 子进程**执行拒绝（两种 opt-in 活跃状态）与继续 HTTP 200（两个不应受阻状态），核实拒绝不修改本地持久文件；正常启动可能沿原启动默认流程安装基础服务，必须保留原有记录且不得激活 Saved View opt-in Feature；最终是否 PASS 以本 PR 最终 HEAD 的 PG18 Actions 为准。保留真实 PA05/AuthorizationProvider/SQL Owner 的原子 outbox、可信 producer/KMS、完整 snapshot、冷启动跨存储 reconciliation、Human/LLM/生产安全 Owner 验收 OPEN。
