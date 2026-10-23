# 桌面与移动运营观测按需装配的界面兼容检查

## 目标与完成条件
Human通过原桌面或移动观测入口读取企业运行情况。本批仅调整加载时机和常量出口；安装未用不加载，两端各自按需加载，有效页面与原factory等价。

## 流程与步骤
桌面保留选择时间预设、读取图及只读操作反馈；移动保留24h默认范围与实体摘要。没有新增点击、对话或输入；原Provider和事实投影算法不改。

## 导航与信息架构
原`/operating-graph/observe`与`/m/operating-graph/observe`保持，MOBILE_TASK不支持时的MOBILE_READ fallback保持。桌面读取移动路由改用轻量package，无导航重设。

## 视觉与颜色
未改颜色、token、布局、按钮或文案。真实Host逐字段比较原页面factory（对齐时间），原事实投影回归继续执行；JSON等价不冒充浏览器视觉验收。

## 记忆与注意力
原时间预设、上下文、view store保持；停用不删除已有视图，恢复结果不变。移动原本无需创建桌面视图，测试允许该文件不存在，不强制副作用。

## 无障碍与跨年龄
原桌面/移动渲染与控件保持，不改变焦点、键盘、触控目标或缩放。移动只读和fallback由原测试验证；没有屏幕阅读器、手机真机或跨年龄Human验收。

## 安全与数据修复
原Feature/Context/Human/企业规则及Provider解析保持；动态加载后复查Feature。桌面operation仍拒绝写入，移动没有写命令；拒绝与恢复回归通过。没有新增清理业务数据逻辑，不承诺撤销在途请求。

## 证据与剩余问题
真实Host新增两端独立加载/停用/恢复测试，合并原行为共17项本地通过。使用合成图与loopback，不冒充真实外部服务或精确await停用竞态验收；无新截图。
实际UI源码变更：`apps/enterprise-observatory/desktop-page.ts`、`apps/enterprise-observatory/mobile-read-page.ts`，仅metadata常量引用与旧出口兼容；Host装配在`manager/server.ts`。

复用本窗口2026-10-19已完整读取原文的权威：
- https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md ，blob `eebd25cafb52d1f7ae032e83b5448f1f46b78646`。
- https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-HUMAN-UI-DESIGN-REVIEW-CHECKLIST-v1.0.md ，blob `5110ed437dc2afc195b447de30aa4d3263b69c1c`。
应用原流程/导航、直接操作、数据保持与证据分级原则；无新增视觉或移动交互方案，无新增外网来源。
