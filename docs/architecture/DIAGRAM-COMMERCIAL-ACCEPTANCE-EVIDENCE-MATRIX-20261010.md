# EVO 2D Designer — 39 项商业化验收证据矩阵（工作记录）

**创建：** 2026-10-10（UTC+08）  
**权威要求：** [EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md](./EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md) §14（目前在独立研究交接 PR #552 中，尚未合并）。  
**范围：** Eidos #130–#136 + B5a；App Platform #537/#547/#549/#550 + B5a。**不是投产证书。**

## 判定规则

- **PASS**：须注明能直接验证该项结果的测试方法、环境、commit / CI 或人工截图/录屏；自动化单测只证明其实际断言，不自动证明真实交互验收。
- **FAIL**：实际执行且失败，附可复现步骤。
- **NOT TESTED**：尚未按该项验收完成；即使有相关代码、工具构建成功、静态断言，也保持此项。
- 状态严格区分：已写代码 / CI 成功 / PR 合并 / 部署 / 实机验收；不可把其中一项推断成另一项。
- 每轮填写：设备型号、OS、浏览器版本、输入类型、图规模、测量手段、截图/录像或工作流 URL、准确 commit SHA。不得虚构任何图像、FPS 或录屏。
- 本文为针对性独立文档，不覆盖主线状态文件；所有行首次以 **NOT TESTED** 开始。

## 逐行登记（共 39 项）

| ID | 原要求 §14 的测试场景 | 当前代码/单测候选（不等于验收 PASS） | 验收结论 |
| --- | --- | --- | --- |
| V01 | 同一关系切换四种路径 | Eidos tests/diagram-edge-paths.test.mjs；待浏览器验证 | NOT TESTED |
| V02 | 旧投影没有新增字段 | Eidos tests/diagram-edge-paths.test.mjs；旧投影不迁移待复核 | NOT TESTED |
| V03 | 线型/箭头有业务语义 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| V04 | 在 10%、100%、300% 查看边 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| V05 | 长中文/英文节点名与关系标签 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| V06 | 选中、悬停、焦点与错误并存 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| M01 | 左键拖空白 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| M02 | 左键单击/拖动节点 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| M03 | Shift 点选与追加框选 | Eidos tests/diagram-selection.test.mjs；待真实鼠标 | NOT TESTED |
| M04 | 多选后拖动其中一个节点 | Eidos tests/diagram-selection.test.mjs；待浏览器 | NOT TESTED |
| M05 | 右键从节点上拖动画布 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| M06 | 原地右键 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| M07 | 中键、Space + 拖动 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| M08 | 输入框内 Space、Delete、Ctrl+A | 尚无足以确认该场景的专项证据 | NOT TESTED |
| M09 | 拖动出画布再释放/切换窗口 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| T01 | 触控板双指平移和捏合 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| T02 | 触摸未选节点开始滑动 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| T03 | 触摸选中后拖动 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| T04 | 节点拖动中加入第二指 | Eidos #136、App #550 自动/结构测试；待实机 | NOT TESTED |
| T05 | 双指变单指 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| T06 | 手机多选/框选 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| T07 | 手机抽屉、旋转、软键盘 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| E01 | 自动折线遇到中间节点 | Eidos tests/diagram-obstacle-routing.test.mjs；待真实渲染 | NOT TESTED |
| E02 | 同向多边、反向边、自环 | Eidos tests/diagram-edge-lanes.test.mjs；待交互 | NOT TESTED |
| E03 | 拖动折线段或路径点 | B5a tests/diagram-visual-handles.test.mjs 与 App integration；CI 待核，真实操作待测 | NOT TESTED |
| E04 | 点击曲线远离端点直线的位置 | Eidos tests/diagram-edge-paths.test.mjs；待真实命中 | NOT TESTED |
| E05 | 移动一个/两个端点 | Eidos tests/diagram-waypoints.test.mjs；待真实操作 | NOT TESTED |
| E06 | 曲线/折线转直线再撤销 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| E07 | 标签拖动和节点移动 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| D01 | 隐藏节点/边再保存 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| D02 | 连续编辑、撤销、重做、保存 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| D03 | 保存失败后重试 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| D04 | 保存后刷新、Viewer、模板预览 | App tests/integration/definition-projection-edge-routes.test.mjs；待 Viewer 手动 | NOT TESTED |
| D05 | 两窗口冲突保存或 Agent 更新 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| D06 | 切换到另一投影 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| A01 | 自动排版含隐藏/锁定节点 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| A02 | 系统大字与键盘操作 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| P01 | 规模样例与连续操作 | 尚无足以确认该场景的专项证据 | NOT TESTED |
| P02 | 同一页面两个图形实例 | marker ID 已做实例隔离；实际双实例测试待做 | NOT TESTED |

## B5a 增量的测试边界

- 路径点控制柄与正交线段控制柄属于 **Eidos 通用图形交互**；App Platform 仅小范围同步 vendored 几何和 Surface 交互，明确保留 `renderContextNavigationV010`。
- B5a 预计的可自动测试项：路径点有限值/上限验证、正交线段方向约束、端点不变性、鼠标坐标转换所用纯几何函数、vendor seam 静态回归。测试运行与结果需以对应 PR CI 为准。
- B5a 浏览器尚未验收：真实 pointer capture、长拖动/取消、第二指中途加入、手柄与节点的点击层级、不同缩放级别/手机 Safari；**E03 仍是 NOT TESTED**。
- 自动路由（无手工 waypoint）的直接线段拖动、curve 标签移动、自环控制柄、密集重叠线段消歧仍需后续切片；不得把 B5a 宣称为 E03/E07 全部完成。

## 实机证据模板

| 日期/执行人 | ID | 设备 + OS | 浏览器版本 | 图规模 | 操作与预期 | 结果 | 证据链接 / issue |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 未执行 | — | — | — | — | — | NOT TESTED | — |

目标环境：Windows Chrome/Edge 鼠标、macOS 触控板、iPhone/iPad Safari、Android Chrome；图规模覆盖桌面 200/400、500/1000，手机 100/200。后续将实际证据写回矩阵，不凭推测填 PASS。
