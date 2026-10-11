# EOG 2D Designer §14 — 39 项验收证据矩阵（首版）

**更新日期**：2026-10-10。**范围**：2D 专项独立工作分支；基线 [完整原始需求](./EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md) §14；[交接入口](./EOG-2D-DESIGNER-RESEARCH-HANDOFF-20261010.md)；[资料索引](./EOG-2D-DESIGNER-RESEARCH-REFERENCE-INDEX-20261010.md)。

> **证据规则**：以下所有条目验收状态一律为 **NOT TESTED**。第三列只表示已有实现线索或缺口，**不表示对应场景 PASS**。这份台账没有伪造任何手工测试、录屏或基准数据。每条需补充测试环境、commit SHA、自动化报告或真实设备证据链接、执行人和日期，才能标记 PASS / FAIL。CI 只记为对应 SHA 的自动检查事实，不能替代任何一项实机验收。

**已核对的堆叠依赖**：Eidos #130 → #131 → #132 → #133 → #134 → #135 → #136；App Platform #537 → #547 → #549 → #550；研究交接 #552。上述 PR 在核对时均为 open、unmerged。Eidos #136 的 CI success；App #550 的 Platform CI、Diagram Designer Integration CI、Project Continuity CI success；交接 #552 的 Project Continuity CI success。均未据此宣称 merged/deployed/device accepted。

| 编号 | 场景 | 已有实现线索 / 缺口（非验收结论） | 待取得的证据 | 验收 | 证据链接 / 设备 |
| --- | --- | --- | --- | --- | --- |
| V01 | 四种路径切换 | Eidos A1/A3；App #537 | 自动几何+浏览器切换+往返 | NOT TESTED | — |
| V02 | 旧投影直线兼容 | Eidos A1；App #537 | 旧数据 Fixture + Viewer | NOT TESTED | — |
| V03 | 纹理箭头语义不可伪造 | Eidos A3；Host permission | 权限负例与字段比较 | NOT TESTED | — |
| V04 | 10/100/300% 缩放 | Eidos SVG | 浏览器视觉与点击命中 | NOT TESTED | — |
| V05 | 中英文长文案 | Eidos surface | 真实渲染/可访问名称 | NOT TESTED | — |
| V06 | 选择悬停焦点错误叠加 | Eidos surface | 视觉/键盘核验 | NOT TESTED | — |
| M01 | 空白左拖框选 | Eidos A2 | 鼠标端到端 | NOT TESTED | — |
| M02 | 节点单击与拖动阈值 | Eidos A2 | 鼠标端到端 | NOT TESTED | — |
| M03 | Shift 多选与框选追加 | Eidos A2 | 鼠标端到端 | NOT TESTED | — |
| M04 | 群移和相邻边实时更新 | Eidos A2 | 节点/边同步录屏 | NOT TESTED | — |
| M05 | 从节点右拖平移 | Eidos A2；vendor 差异 | Host 真实右键 | NOT TESTED | — |
| M06 | 原地右键菜单 | Eidos surface | 节点与群组上下文 | NOT TESTED | — |
| M07 | 中键及 Space 平移 | Eidos A2 | 浏览器中键和键盘 | NOT TESTED | — |
| M08 | 文本框输入隔离 | Eidos surface | 焦点输入回归 | NOT TESTED | — |
| M09 | 出画布/失焦取消 | Eidos B4a | 捕获/取消实测 | NOT TESTED | — |
| T01 | 触控板双指平移捏合 | Eidos A2/B4a | macOS 实机 | NOT TESTED | — |
| T02 | 触摸未选节点滑动 | Eidos B4a | iOS/Android 实机 | NOT TESTED | — |
| T03 | 选中节点触拖只在编辑态 | Eidos B4a / Host | iOS/Android 实机 | NOT TESTED | — |
| T04 | 第二指取消未提交拖动 | Eidos B4a；App #550 | 多指浏览器实测 | NOT TESTED | — |
| T05 | 双变单无节点误拖 | Eidos B4a | 多指浏览器实测 | NOT TESTED | — |
| T06 | 手机非隐藏手势多选 | Eidos mobile surface | 单指针替代体验 | NOT TESTED | — |
| T07 | 旋转/抽屉/软键盘/安全区 | Eidos + App Host | Safari/Chrome 真实设备 | NOT TESTED | — |
| E01 | 中间节点正交避障 | Eidos B1 | 几何+真实渲染+回退 | NOT TESTED | — |
| E02 | 并行/反向/自环区分 | Eidos B2 | 几何+浏览器命中 | NOT TESTED | — |
| E03 | 拖动路径点或正交线段 | B3 仅数值/按钮；直接拖动未实现 | 新增拖动与撤销测试 | NOT TESTED | — |
| E04 | 曲线真实命中区域 | Eidos A1 | SVG 路径浏览器命中 | NOT TESTED | — |
| E05 | 单/双端移动维持人工路径 | Eidos B3 部分支持 | 群移提交和持久化 | NOT TESTED | — |
| E06 | 切直线重置/撤销 | Eidos B3 | 数据和界面撤销 | NOT TESTED | — |
| E07 | 标签拖动/跟随 | Eidos 部分路径标签 | 交互+保存复现 | NOT TESTED | — |
| D01 | 隐藏内容保存仅影响投影 | App #537 | 业务数据负例与往返 | NOT TESTED | — |
| D02 | 连续操作撤销重做保存基线 | Eidos A2；App #537 | 50 步+保存后继续修改 | NOT TESTED | — |
| D03 | 保存失败保留数据重试 | Host 未完整核证 | 网络失败注入 | NOT TESTED | — |
| D04 | 刷新/Viewer/模板预览/缩略图 | App #537/#549 | 真实数据往返 | NOT TESTED | — |
| D05 | 双窗口/Agent 冲突恢复 | Host 未完整核证 | revision 冲突注入 | NOT TESTED | — |
| D06 | 不同投影隔离 | Eidos mount + Host | 双投影切换测试 | NOT TESTED | — |
| A01 | 自动布局隐藏和锁定 | Host 自动布局 | 锁定和撤销 | NOT TESTED | — |
| A02 | 大字键盘与非拖动替代 | Eidos B3 数值入口 | WCAG 单指针手动审核 | NOT TESTED | — |
| P01 | 200/400 500/1000 手机100/200 | 性能未测 | 设备 FPS/延迟记录 | NOT TESTED | — |
| P02 | 双实例互不串扰 | Eidos per-instance ID | 双图真实测试 | NOT TESTED | — |

## 执行约束与建议实施序列

1. B4b：对 iPhone/iPad Safari、Android Chrome、macOS 触控板、Windows Chrome/Edge 做 pointerdown/move/up/cancel/blur/第二指进入与撤离的行为记录。实际未操作设备之前，一律 NOT TESTED。
2. B5（Eidos）：路径点可视控制柄、命中与拖动状态机；正交线段法向位移、最小合法几何约束、取消回滚、单步撤销。保持纯几何模块/输入契约分离。对应 E03/E05/E06。
3. B5 下游（App Platform）：只移植 Eidos 通用交互差分，保留 vendor contextNavigation；验证路由/锚点/点序列 Save/Viewer/缩略图数据不变。对应 D04。
4. B6：吸附/对齐和辅助线、锁定节点保护、群移时性能退化策略。对应 A01、M04、P01。
5. B7（Host）：故障注入、待保存标志/未提交快照、冲突 revision/重新加载或保留本地操作及 Agent 更新；明确 App Platform 所有权。对应 D02/D03/D05/D06。
6. B8：大图基准、双实例、可访问性及 39 项完整设备矩阵；性能预算参照原稿 §12，不在未测前填 FPS。

## 验收证据记录模板

每次测试新增记录：

- 编号、结论（PASS / FAIL / NOT TESTED）、测试日期、执行人。
- Eidos 与 App Platform 完整 commit SHA、PR、构建/部署环境（本地/预览/生产分别写明）。
- 操作系统及版本、浏览器及版本、设备/鼠标/触控板/触摸硬件、输入步骤与期望/实际结果。
- 录屏/截图/测试日志 URL；失败复现步骤及回归链接。
- 对 P01 另附节点数、边数、测量方法、帧率/延迟分位数与是否降级。

## 决策继承与风险

保留交接索引 S1–S7 的来源标记与设计取舍。Eidos 不承担投影事务/授权；App Platform 不改变业务边 source/target/箭头含义。旧数据缺少 pathKind 时维持原直线，未知枚举不应静默覆写。**不得将此矩阵视为合并/部署授权。** 新研究需更新同目录研究索引中的原始 URL、日期、已读状态、事实/判断边界，以及其对具体编号的影响。
