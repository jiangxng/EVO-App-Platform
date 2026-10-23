# 空间运营观测加载位置调整的界面兼容检查

## 目标与完成条件
从原空间观测入口查看企业运行图与事实叠加。本批仅调整`apps/enterprise-observatory/spatial-page.ts`的加载时机与常量出口；有效页面输出保持，安装未用不加载，停用不可进入。

## 流程与步骤
原入口→选择时间预设→读取观测结果的流程保持，没有增加点击或Agent步骤。原Provider选择、时间范围解析和分析叠加不改。Host加载完成后复查Feature。

## 导航与信息架构
保留`/operating-graph/observe/3d`、page source、命令标识及独立观测Feature；与中性3D Viewer仍分工明确。旧导出兼容，无新增菜单。

## 视觉与颜色
无颜色、token、按钮、排版或空间渲染修改。真实Host中文页面JSON与原factory在相同时刻逐字段相等；不以此冒充浏览器视觉验收。

## 记忆与注意力
保留4h/24h/7d/1h预设与比较周期、原view store和空态说明。停用保留视图数据，恢复不用重新配置；不增加跨企业缓存。

## 无障碍与跨年龄
原控件、键盘、缩放和手机渲染路径不变；未执行屏幕阅读器或手机体验验收，不宣称新增适配能力。

## 安全与数据修复
原Context/企业检查及错误语义保持，原Action Router与页面资格检查保持；await后再次核对Feature。停用不删除业务数据，不宣称撤销已在途请求。

## 证据与剩余问题
`tests/integration/eog-spatial-lazy-host.test.mjs`覆盖冷启动、安装未用、停用拒绝、恢复、页面/时间预设等价、缺图错误及并发读取；12项本地定向测试通过。未对真实事实Provider或精确停用竞态故障注入；无新截图或Human视觉验收。

复用本窗口2026-10-19已完整读取原文的Eidos权威（非搜索摘要）：
- https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md ，blob `eebd25cafb52d1f7ae032e83b5448f1f46b78646`。
- https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-HUMAN-UI-DESIGN-REVIEW-CHECKLIST-v1.0.md ，blob `5110ed437dc2afc195b447de30aa4d3263b69c1c`。

应用原导航保留、直接操作、用户数据/资格边界与证据分级原则；本批没有新增视觉方案。实际页面源码修改仅`apps/enterprise-observatory/spatial-page.ts`常量导入/重导出；装配修改在`manager/server.ts`。
