# EVO 2D Designer｜本窗口决策、取舍、冲突与下一步任务（2026-10-11）

> 范围只限原 [v1.0 §14 的 39 项](./EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md)。本文件不是新的需求清单，也不是商用签收证明。若内容与当前源码或 GitHub PR 状态冲突，先查精确 commit 和 CI；若与原 §14 冲突，则原 §14 优先。

## 一、用户已经确认、下个窗口不应重新争论的决定

1. **只收敛原定 2D Designer 商业化目标，不增加莫名其妙的新模块/新任务**，不延期 §13 的 A/B 阶段目标；§13 C 阶段的明确后续增强不擅自插入。
2. 用户允许余下 34 项独立 PR，要求独立分支、小范围检查、通过后及时 merge main，不积压大量 Draft；当剩余 15 项时用户确认按三批：M06/E04–E07、D01–D06、A01/A02/P01/P02。**第一批五项已合并**，仅余 10 项；不需要每个 PR 重新问确认。
3. **Eidos 是通用图形操作的唯一 Owner**；App Platform 负责投影视图、授权、独立 CAS、Designer/Viewer，并有明确的 Host Surface 差异保护。不盲目覆盖 vendor/eidos；不修改 EVO Ledger Runtime、Agent 主线、全局 authority/status 文件。
4. 投影是**展示层**，调整可见性、位置、路径、关系标签；不得更改真实业务关系 source/target、箭头含义，不创造账本/业务定义新版本。自动排版作为**固定产品能力**而非只交给 Agent 即兴运行。
5. 29/39 只表示有对应编号的受控浏览器机器子场景已完成；正式人工商业签收仍 0/39。单元测试、Chromium 合成输入、PR 合并、部署、物理设备/客户签字必须独立记录。

## 二、方案比较：外部来源事实与 EVO 项目判断明确区分

| 议题 | 可追溯来源事实 | EVO 已采用方案及理由 | 排除方案 / 限制 |
| --- | --- | --- | --- |
| 画布导航 | 前序已读 [Miro S1](https://help.miro.com/hc/en-us/articles/360017731053-Using-Miro-with-a-mouse-trackpad-or-touchscreen)、[React Flow S2](https://reactflow.dev/learn/concepts/the-viewport) 对比鼠标/触控板及 map-first/design-tool | 左键选择/框选；右键、中键、Space+拖动移视角；触控板双指导航；移动端显式多选/框选工具。与业务图频繁选择匹配 | 不采用地图式空白左拖平移作为默认；不为参考交互引入 React Flow 运行时，不能把 CDP 触摸当物理设备手感 |
| 通用图形归属 | Eidos 产品公共 2D Surface/Host 源码、Platform manifest | 通用路径/手势/控制柄由 Eidos Owner 承担，Platform 受控前移并精确锁定 Host overlay blob；防止通用图实现分叉 | 不整份覆盖 vendor surface.ts；不把业务 Store/CAS 或账本操作塞入 Eidos |
| 路由与业务语义 | 前序 [draw.io S3](https://www.drawio.com/docs/manual/styles/connector-styles/) 与 [S5](https://www.drawio.com/docs/manual/connectors/) 区分几何、样式、箭头、连接锚点 | 直线、直角折线、圆角折线、曲线仅为 pathKind 外观，arrow/source/target 独立且不可伪造。旧投影无新字段保持直线 | 不将视觉编辑器变成可以重建业务关系的图形编辑器，不擅自将历史投影自动升级 |
| 手工路径点跟随策略 | 前序 [draw.io S4](https://www.drawio.com/docs/manual/connectors/waypoints-connectors/) 记录 Follow Terminals 可选 | E05 **单端点移动保留手工世界坐标点，双端点等距移动则同步平移手工点**，保持可预测性 | 这不是 draw.io 强制行为，是 EVO 具体选择；不能因端点移动就静默清空手工控制点 |
| 路径重置 | v1.0 §14 E06 要求提示/撤销，既有界面曾直接删除手工点 | E06 改直线先告警，拒绝维持原状、确认后一笔 Undo 可恢复，避免损害用户工作成果 | 只修改展示路径，不能修改实际业务关系类型或真实方向 |
| 标签调整 | S3 曲线标签参考，§14 E07；项目已有 Viewer/Projection 模型 | E07 使用“计算路径标签锚点 + 可选世界位置偏移 labelOffset”，实现鼠标拖动、Undo/Redo、保存、新 Designer 和只读 Viewer 一致 | labelOffset 只进 Projection view，非业务关系字段；复杂碰撞和 **W3C S6** 的非拖动替代不是 E07 浏览器子测试已签，须在原 A02 核查 |
| 保存/并发 | 项目 [B7 CAS](./DIAGRAM-B7-PROJECTION-CAS-20261010.md) 明确历史定义 revision 不代表投影编辑版本 | 投影 CAS 独立写 token、冲突显式阻断并保留本地编辑，有序重试或另存 | 老客户端缺 token 的兼容读取/写入风险、真实分布式 Store 原子性与 Agent 行为仍要 D05 复测，不能凭旧技术文档宣称生产安全 |
| 自动路由/性能 | 项目 [P01a 性能记录](./DIAGRAM-P01A-LARGE-GRAPH-PERFORMANCE-INTEGRATION-20261010.md) 有真实 Chromium 合成图的改善与退化数字，B8t 还有 congestion 案例 | 使用有界路由、明确降级，不造假避障；P01 必须有规模/连续动作测量及诚实呈现失败 | 不扩大无界搜索预算，不拿 2–5 节点图代替 200/400 或 500/1000，不只引用成功数字或宣称所有平台达到 FPS |
| 验收与发布 | [正式台账](./DIAGRAM-V1-FORMAL-ACCEPTANCE-EXECUTION-20261011.md)、[B9r 协议](./DIAGRAM-B9R-39-ITEM-DEVICE-ACCEPTANCE-PROTOCOL-20261011.md) 分隔证据层级 | 每编号最小可验证浏览器用例 + 真实物理系统与授权数据的独立人工台账；已 merge 不等于部署、已部署不等于 plugin 激活 | 不能用“29/39 子测试”冒充“29/39 用户签收”，更不能虚构截图、性能值、客户签名 |

## 三、本窗口产品/测试得出的具体事实与仍存在的风险

**机器已通过（2026-10-11 真实 Chromium 154 与项目 Host 临时 FileStore/CAS，非实体设备）：**
- M06：原地右键显示所选群组上下文，两个节点选中状态不变、节点与 camera 不变、无隐式 Save。[PR #739](https://github.com/jiangxng/EVO-App-Platform/pull/739)
- E04：真正三次曲线上的鼠标点击命中、原本直线走廊点不误命中，实际偏离约 19.277px。[PR #756](https://github.com/jiangxng/EVO-App-Platform/pull/756)
- E05：单端点移动后手工点坐标固定；两端等量移动时手工点按 delta 平移；箭头仍指向原业务方向。[PR #758](https://github.com/jiangxng/EVO-App-Platform/pull/758)
- E06：Curve 与 Orthogonal 两种已设手工点的线改 Straight，均有用户确认/取消、确实清点、单步 Undo 复原。[PR #760](https://github.com/jiangxng/EVO-App-Platform/pull/760)、[Eidos #168](https://github.com/jiangxng/eidos/pull/168)
- E07：实际标签拖动、撤销/重做、节点移动时标签跟随路由；保存后新 Designer + 独立 readonly Viewer labelOffset 一致，业务定义历史仍 1。[PR #761](https://github.com/jiangxng/EVO-App-Platform/pull/761)、[Eidos #169](https://github.com/jiangxng/eidos/pull/169)

**失败并未隐瞒（真实失败 → 修复 → 最终 PASS）：**
- E05 早期在测试之前的 E04 回归因为 Inspector 关闭后页面变动，测试仍点旧屏幕坐标而超时；复测重新测量真实 curve hit，产品本身无相关改变。
- E07 首轮不是纯测试噪音：独立 Viewer 读取映射**真实遗漏 labelOffset**，已修改 apps/eog-2d-viewer/template-preview.ts；再测 Designer→Viewer 通过。
- E07 次轮因“提前运行 E07 的保存”改变共享 Store version，破坏后续 V01–V04 旧回归对初始 CAS=0 的假设；已把 E07 Save 测试移到原回归后，整套 CI 均成功。
- 上述均只覆盖真实 Chromium 与合成企业图；**没有证明 Windows/macOS/iOS/Android 实机操作、辅助技术、生产真实租户、Railway 新版本已部署或客户同意签收**。

## 四、资料冲突、未决问题和重点后续查阅

1. **旧 PR 状态冲突**：2026-10-10 原研究入口、B7/B8/B9j 文件仍描述当时 stacked Draft 和未合并状态，不能视为今天状态。本窗口五项及配套 Eidos PR 已核实 merged。后续以当前 GitHub HEAD/PR/Actions 为准，不重复做旧工作。
2. **计数口径冲突**：正式 39 行仍 NOT TESTED、人工签收 0/39；与此同时 29/39 编号已经有自动化浏览器子门禁。不是两种不同的 39 项体系。
3. **E07 与可访问性**：标签拖动功能存在，但 W3C SC 2.5.7 的非拖动单指针替代仍需原 A02 检查。不要因此增设新编号或另启第四批，也不能过早写“WCAG 完全合规”。
4. **D05 CAS 与旧客户端**：历史 B7 说明过渡客户端省略 expectedWriteToken 的写入仍存在风险；最终用户环境、Agent 并行写入/真实双窗口冲突不可以只凭合成测试概括。
5. **D04 部署落差**：Github CI 的文件型临时 Store / readonly Viewer 不等于租户里 2D Plugin 已安装激活，也不等于生产数据库；需查 [插件边界报告](./DIAGRAM-EIDOS-PLUGIN-BOUNDARY-CLOSEOUT-20261011.md)。
6. **P01 性能统计不一致**：合成图/runner JIT、预热顺序造成样本可变，原性能报告包含回退，不能宣称通用 FPS SLA 已达标。优先查真实 S2C/P2P 复杂业务图、持续输入与滚动时帧间隔。
7. **真实设备及附件**：根据 B9r 记录需要 Windows 鼠标、macOS 触控板、iOS Safari、Android Chrome 和物理录屏；本窗口没有任何已保存用户实机截图或签收，不能编造附件路径。
8. **C 阶段与任务漂移**：原 §13 的 C 是明确后续增强而非当前第二/三批；如遇到真实超出 §14 的产品建议，另外记录，未经用户同意不并入本次 10 项。

## 五、唯一剩余十项：对照 §14，按原第二、三批实施

| 批次/ID | 原场景的可观察结果与推荐机器动作 | 现有证据/模块 |
| --- | --- | --- |
| 2 / D01 | 隐藏业务图节点/边再显式 Save → 新 Designer/Viewer 不可见，但原企业 Business Definition 业务对象关系数量不变 | B9j 既有隐藏 CAS 证据；Eidos Surface、Projection Editor、Store |
| 2 / D02 | 连续多次编辑，分别单步 Undo、Redo，再 Save；未保存态/保存基线清楚，避免清历史或脏状态误判 | B6b/B8b Undo/Viewer；Eidos ViewSnapshot 与 Host captured view |
| 2 / D03 | 真实 UI 保存失败（如 503/权限失败）后保留所有位置/样式/控制点，重试成功不丢数据 | B7b HTTP503 子实验；Host 保存与状态 UI |
| 2 / D04 | Save 后刷新，新 Designer、真正 readonly Viewer、模板预览和缩略图读取同一形状/标签/位置 | B8b 已有子场景；EOG Designer、Viewer、thumbnail、Projection Store |
| 2 / D05 | 两窗口同一投影同一 base writeToken 竞争，仅一方成功，另一方有明确冲突/恢复/另存并保留草稿；Agent 版本更新复核不越界 | B7/B9 CAS；注意不借此修改独立 Agent 主线 |
| 2 / D06 | 从投影 A 切到 B 再回 A：camera、选择、多次 Undo 历史、样式、保存不会泄漏 | Gallery、Host mount/unmount、Surface 状态 |
| 3 / A01 | 自动排版包含隐藏/锁定节点，不恢复隐藏节点、不移动锁定节点，可 Undo | Eidos 固定自动排版；不让 Agent 即兴替代 |
| 3 / A02 | 系统大字、真实键盘与焦点、菜单和表单可用，有无需拖动的替代操作 | Eidos/Host 控件、W3C S6，实机/屏读不可用 DOM 静态断言冒充 |
| 3 / P01 | 包含 200/400、500/1000 等规模真实连续操作，报告 FPS/时延及可重复测量法，不选 5 节点截图当证明 | P01a 配对性能报告、Eidos 路由/索引与实际硬件 |
| 3 / P02 | 同一 DOM 页面两套真实 2D 图，独立 marker ID、选择、快捷键、事件、权限和显式保存，互不串扰 | B8x 双实例初步实验；不能用两个 Tab 替代同页双图 |

## 六、下一窗口按此顺序执行（无需重复研究）

1. 从 GitHub 读取两个仓库最新 main/PR 检查，严格读取本交接三文件、原 §14、已有 B7/B8/B9 证据；不要信旧分支/旧 SHA。
2. **先做 D01–D06，每项独立 branch/PR，对真实产品 Chrome DOM、Host/Projection CAS、Viewer 验证；必需 CI 成功才 squash 合并 main**。产品层若需通用交互修复，先独立 Eidos Owner PR，再窄范围回填 Platform vendor，保留 Host 差异/manifest。
3. 第二批完成后第三批 A01/A02/P01/P02 连续推进；不新增原始验收项，不修改 Agent/账本主线；每步若并行窗口改变 main 重新基线核对。
4. 机器子测试继续积累，但**正式人工签收单独走** [B9r 设备协议](./DIAGRAM-B9R-39-ITEM-DEVICE-ACCEPTANCE-PROTOCOL-20261011.md)；核实 main 公网部署和租户 EOG 2D Plugin 激活，不能虚构结果。
5. 技术细节写独立对应 PR/架构证据；用户只需看到 39 项进度、每批 PR、当前阻塞和“人工 0/39”独立状态。本 docs-only 交接分支不用覆盖 39 项主矩阵或其他窗口研究 PR [#715](https://github.com/jiangxng/EVO-App-Platform/pull/715)。
