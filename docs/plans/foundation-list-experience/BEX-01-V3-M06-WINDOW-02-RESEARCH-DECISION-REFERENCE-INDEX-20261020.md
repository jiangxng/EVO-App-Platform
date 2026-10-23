# BEX-01 V3｜M06 Window 02 研究资料与决策详细参考索引（2026-10-20）

> 配套简短入口：[M06 Window 02 交接入口](BEX-01-V3-M06-WINDOW-02-HANDOFF-ENTRY-20261020.md)。这是**只新增不覆盖**的增量索引：与 [M06 旧交接 PR #1058](https://github.com/jiangxng/EVO-App-Platform/pull/1058) 及 [M04 索引](BEX-01-V3-M04-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)、[V3 总索引](BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md) 并列保存。PR #1058 的两文档没有合入 main，需以 `1e03d120770462190818528b657e72c3e9d76a3a` 或该 PR 更新后的 HEAD 读取；**不要因 main 返回 404 判定资料不存在**。

## 1. 目的、口径和不能混用的证据层级

- 用户最终要求：**100% 还原 #909 原型**，先真实页面 1280px/390px + 用户 Human 视觉签收，后 M04 客户 Excel 真实业务验收，最后 M05 真实完整导入。M01–M03 已完成，总体严格 **3/6**；M04/M05/M06 OPEN。
- **R / 直接读源**：本窗口已经直接读取的 GitHub 原型 HTML、TypeScript、CSS、Python/MJS、GitHub PR/Actions 日志、Railway 元数据；正文只可按实际阅读范围宣称。
- **RM / 元数据核实**：直接读取 PR、CI、Actions artifact 文件名/大小/结果或某一文件的片段，但没有本次逐图打开 artifact 压缩包内每张 PNG；不可宣称像素签收。
- **H / 遗产索引**：此前外站真实阅读记录已归档，本窗口只直接阅读 GitHub 中保存的 M04/M06/V3 索引，没有重新查外站网站；继承当时的 A（读正文）/B（章节）/C（搜索摘要）等级，不把 H 冒充新读原文。
- **D / 待验证**：客户授权 Excel、Job、银行真实身份/用途、三条实体身份、最终视觉签收、生产 #1060 部署（实际未部署）。**来源事实**（源码、CI、部署）与**项目决策**（签收顺序、不许猜同名银行、禁止乱改）严格分开。
- 查阅日期：本文下述 R/RM 项均核验于 **2026-10-20**。链接均为原始 GitHub/Railway 来源；旧网站查阅日期沿用旧索引的 2026-10-14～15，不新造阅读记录。

## 2. 直接已读 GitHub / Railway 参考资料索引（R/RM）

| 编号 | 原始标题与网址（均核于 2026-10-20） | 阅读范围 / 等级 | 已证实发现 | 对项目的具体作用 |
|---|---|---|---|---|
| R01 | [#909 原型 HTML：BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html](https://github.com/jiangxng/EVO-App-Platform/blob/af58e0abad880439d54230485305bf2b4e05decc/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html) | R：直接读原型 30,883 字节源码、关键 ID、HTML/CSS 章节 | `stageOne`/`stageTwo` 为两步；`review` 中有文件卡、四指标、3 类问题、四列表；`mappingRows`、`tableFilter`、`.actionbar`、`saveStatus` 以及 Schema 确认、预检、提交各阶段 | 最高视觉/交互参照，**原型自身的数据仅演示** |
| R02 | [原型 PR #909](https://github.com/jiangxng/EVO-App-Platform/pull/909) 与 [原型截图 run 38704093619](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38704093619) | R：PR 源状态；RM：原型 artifact `11957646429` 位置，较早本窗口曾获取/查看原型截图 | HTML 原型仍 Draft；原型附件含 `01-desktop-overview.png`、`03-complete-field-table.png`，可供新窗口下载重开 | 对照同一状态的桌面与手机真实 Host，不能把原型视作已部署 |
| R03 | [旧 M06 入口](https://github.com/jiangxng/EVO-App-Platform/blob/1e03d120770462190818528b657e72c3e9d76a3a/docs/plans/foundation-list-experience/BEX-01-V3-M06-WINDOW-HANDOFF-ENTRY-20261020.md)、[旧详细索引](https://github.com/jiangxng/EVO-App-Platform/blob/1e03d120770462190818528b657e72c3e9d76a3a/docs/plans/foundation-list-experience/BEX-01-V3-M06-RESEARCH-DECISION-REFERENCE-INDEX-20261020.md)、[PR #1058](https://github.com/jiangxng/EVO-App-Platform/pull/1058) | R：直接读取两个 Markdown 的开头、续跑 #08～#17 段落和索引章节；该 PR 最新仍未并入 main | 记录 CSS 根因、真实 Host 三问题 fixture、各代 HEAD/CI/截图以及已排除方案；原始交接提交 `ca96…` 已非最新 | 完整保存历史，**不覆盖旧文档**，新窗口须先继承它 |
| R04 | [M04 详细研究索引](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/plans/foundation-list-experience/BEX-01-V3-M04-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md) 与 [V3 总研究索引](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/plans/foundation-list-experience/BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md) | R：本窗口直接读取 M04 研究文件和旧 M06 里引用的结论；未重新读全部外站文献 | 银行双候选防误选、EC advisory 不预选、Human 确认 Recipe 可复用、主体身份不推断；客户证据缺口 | 防止 M04 已完成的安全子项被重复实现 |
| R05 | [Platform #1054](https://github.com/jiangxng/EVO-App-Platform/pull/1054)、[Platform #1060](https://github.com/jiangxng/EVO-App-Platform/pull/1060) | R：多次直接读 PR 元数据、比较 HEAD、文件差异 | #1054 Draft，旧 HEAD `3845c9d9…`；#1060 为隔离续接 Draft，精确 HEAD `0f5b5b3…`；对 main `eaa5e813…` 为 ahead 44 / behind 0 | 以 #1060 作为本窗口最后证据完整的候选；不盲目 rebase、不自动合并 |
| R06 | [Platform #1066](https://github.com/jiangxng/EVO-App-Platform/pull/1066)、[#1070](https://github.com/jiangxng/EVO-App-Platform/pull/1070) | R：直接阅读 PR 标题/正文/状态；未合并 Draft | 两者为当时主线重建的 V3 并行候选；与 #1060 可能含重复实现，HEAD 更早 | 后续先决定单一权威 owner；切忌同批 PR 重复合并相同文件 |
| R07 | [Platform CSS：productive-workbench-css.ts](https://github.com/jiangxng/EVO-App-Platform/blob/0f5b5b301749cbbb4d13d14cd2c2d582c6fdee23/vendor/eidos/src/design-language/productive-workbench-css.ts) | R：直接读 CSS 段落与真实浏览器 CSSOM 诊断 | 原桌面 `min-width:701px` 媒体块边界不当，意外套住目录通用规则；修复后手机 `max-width:700px` 应用，表格 wrapper 隐藏且卡片网格显示 | 真正修复 390px，而非弱化 `PHONE_TABLE_SHOULD_REFLOW_TO_CARDS` |
| R08 | [Workbench shell.ts](https://github.com/jiangxng/EVO-App-Platform/blob/0f5b5b301749cbbb4d13d14cd2c2d582c6fdee23/vendor/eidos/src/workbench/shell.ts)、[Platform desktop-workbench-runtime.ts](https://github.com/jiangxng/EVO-App-Platform/blob/0f5b5b301749cbbb4d13d14cd2c2d582c6fdee23/manager/desktop-workbench-runtime.ts) | R：直接读部分函数/调用和路由焦点机制 | 聚焦只作用 Host 选定路由；Ctrl/Cmd+B、活动栏可恢复导航；本地保存偏好不可被临时聚焦覆盖 | Eidos 通用边界与 Platform 路由选择分离 |
| R09 | [mapping page.ts](https://github.com/jiangxng/EVO-App-Platform/blob/0f5b5b301749cbbb4d13d14cd2c2d582c6fdee23/apps/data-import/page.ts) | R：直接读取映射、reviewTask、sourceProfiles、issue 聚合和实际问题排序片段 | 页面四列映射、二阶段导航与文件指标来自 Host Job；银行问题／主体类型／系统编码按三种行动区分，不造值 | 修复只能改合法业务描述与动作，不硬编码 synthetic 客户证据 |
| R10 | [review renderer](https://github.com/jiangxng/EVO-App-Platform/blob/0f5b5b301749cbbb4d13d14cd2c2d582c6fdee23/vendor/eidos/src/renderers/html/index.ts)、[validator](https://github.com/jiangxng/EVO-App-Platform/blob/0f5b5b301749cbbb4d13d14cd2c2d582c6fdee23/vendor/eidos/src/runtime/validate.ts) | R：直接读 renderer 段落、validate 的表格/任务契约检查 | Eidos 管 DOM/四列、筛选、上下文按钮、通用动作；Platform 管语义 | 补文件 badge、Footer / reset 应先选通用契约，不能画无效装饰按钮 |
| R11 | [live_supplier_chromium.py](https://github.com/jiangxng/EVO-App-Platform/blob/0f5b5b301749cbbb4d13d14cd2c2d582c6fdee23/tests/bex01/live_supplier_chromium.py)、[isolated-host-fixture.mjs](https://github.com/jiangxng/EVO-App-Platform/blob/0f5b5b301749cbbb4d13d14cd2c2d582c6fdee23/tools/bex01/isolated-host-fixture.mjs) | R：直接读完整测试核心和 fixture，多次精确 HEAD 失败日志 | 先前旧测试断言把批次两处入口误匹配；隔离 fixture 原来 53 记录而断言手机列表总数 55；后调整为 54 条普通记录 + 1 条批次记录，精确修正总数与断言 | 警惕“为了变绿改假数据”；本次是测试场景数据契约同步，并无真实客户写入 |
| R12 | [V3 真实 Host XLSX 测试](https://github.com/jiangxng/EVO-App-Platform/blob/0f5b5b301749cbbb4d13d14cd2c2d582c6fdee23/tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py) | R：直接读取浏览器步骤、截图写入路径、三种问题断言 | 隔离 172×22 数据、问题状态和手机 390px 检查；新增 `v3-prototype-parity-*` 两设备截图，脚本断言三类问题动作与顺序 | 真实 Host 的实现证明，不是客户 XLSX / User Human 的事实 |
| R13 | [UI 设计复核记录](https://github.com/jiangxng/EVO-App-Platform/blob/0f5b5b301749cbbb4d13d14cd2c2d582c6fdee23/docs/ui-design-reviews/bex01-v3-decision-first-live-fidelity-20261019.md) | R：直接读取多轮视觉差异、后续附录 | 文件卡缺明显 XLSX 徽标；初期只有主体身份一类问题，后补足三种 synthetic 异常；步骤顶层改回两阶段；底部 Host 真动作尚未对齐 | 已有差异表是下一阶段首要材料，不重复无根据的竞品调研 |
| R14 | [最新 Platform CI run 39391932575](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391932575)、[BEX Chromium run 39391932514](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391932514) | RM：直接读取精确 HEAD 成功结果，Chromium 工作流 job 的各步骤 success | `0f5b5b3…` 全套 BEX Chromium 命名步骤执行，包括 V3 source audit、row correction、batch constant、synthetic 172×22、retained XLSX | **最后已核验的工程全绿快照**，仍须查是否有更晚提交 |
| R15 | [BEX In-Context Resume 39391932600](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391932600)、[Human UI Gate 39391932610](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391932610)、[Lightweight Host 39391932530](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391932530) | RM：工作流状态直接核实为 success | 精确 HEAD 工程门禁全部通过；Human UI Design Review Gate 是 CI 名称，不是用户签字 | 防止把机器 Gate 写成最终签收 |
| R16 | [BEX artifact 12250007262](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391932514/artifacts/12250007262) | RM：直接读 artifact 元数据 6,661,590 字节、未过期；已有截图文件名来自脚本与既有索引，本次未逐张打开最新 artifact | 真实隔离 Host screenshot 位置可恢复 | 下一窗口可下载并检查 1280px/390px 图；不可声称本次完成像素级逐图签收 |
| R17 | [Eidos #202](https://github.com/jiangxng/eidos/pull/202)、[#203](https://github.com/jiangxng/eidos/pull/203)、[#204](https://github.com/jiangxng/eidos/pull/204) | R：直接读 PR 元数据与正文；RM：分别查 CI 与 Human Gate | #202 可逆 route focus；#203 通用 hidden 及审查源卡图标 iconLabel；#204 编号问题卡及手机按钮布局；均 Open/Draft 状态以各 PR 为准 | 通用框架由 owner PR 审核，不把 Platform vendor 副本误合进 Eidos main |
| R18 | [Railway Ledger Configurator](https://railway.com/project/aee4643e-912b-4ca1-ae95-fe4ec64f5601) / production | RM：通过 Railway connector 直接读 live service、branch 与 deployment metadata | service Online，来自 Platform `main`，SUCCESS deployment `e5c56ed8-aac9-4177-bc83-9f01b07ad9b9`，commit `eaa5e813b1e86a6460d988c76eb2076512c35127` | **没有部署 #1060**，CI 成功不能说已上线 |

## 3. 历史外部网站研究遗产：未重新访问原文（H）

本窗口**没有使用外站网络重新查竞品**。下表仅提供原始 URL/章节定位和旧索引当时的阅读等级，不补写不存在的原文阅读。

| 原题与原 URL | 历史查阅日期/级别（继承） | 已记录的发现与 BEX 用途 | 本窗口阅读状态 |
|---|---|---|---|
| [USWDS Table](https://designsystem.digital.gov/components/table/) | 2026-10-15；H-A＝此前读官方正文 | 桌面四列与手机数据可审查性；不能只把表格缩小到 390px | **仅继承 GitHub M04/V3 索引，未重访外站** |
| [NN/g Aesthetic-Usability Effect](https://www.nngroup.com/articles/aesthetic-usability-effect/) | 2026-10-15；H-A＝此前读正文 | 感知美观不取代系统正确性；视觉满意与业务验收分离 | **仅继承索引，未重访** |
| [飞书响应式设计指南](https://open.feishu.cn/document/design-specification/responsive-design/responsive-design-guidelines?lang=zh-CN) | 2026-10-15；H-B＝此前仅章节/段落 | 桌面/手机布局转换方向；不照抄特定断点 | **仅继承索引，未重访** |
| 其他 CN、M、V、EX、UI 竞品参考 | 2026-10-14～15，精确 URL 与 H-A/H-B/H-C 见 [M04 索引 §3](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/plans/foundation-list-experience/BEX-01-V3-M04-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md)、[V3 总索引](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/plans/foundation-list-experience/BEX-01-V3-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md) | 不复制未完整阅读内容或制造新来源；只有真实 UI 冲突才定向重查 | H＝遗产引用，不视作本窗口读过原文 |

## 4. 方案比较、采用理由、排除方案与限制

| 议题 | 已采用方案（证据/产品判断） | 排除方案及理由 | 条件/风险 |
|---|---|---|---|
| 主线同步 | 先核对每次 GitHub main 和双向 compare；#1060 在最终快照对 `main@eaa5e813…` ahead 44 / behind 0 | 旧版 #1054 51 ahead/43 behind 下盲目 rebase、强制推送、把三份 Draft 一股脑合并，会覆盖或重复 PA05/EOG/治理 | 以后 main 可能改变，需每轮重查；不能依旧数字 |
| 390px 响应式 | 修复 Eidos CSS 块边界，保留 phone cards/table assertions，真实 DOM 与 computed style 验证 | 删测试、降低断言、只加一个覆盖 CSS 而不查级联 | 物理手机/Safari 未验证 |
| 工具栏与宽审核 | 保留聚焦按钮，更新过时断言；Eidos #202 通用可逆 route-focus，Host 限定路由 | 删除按钮“换绿灯”、将全站所有页面强制宽屏 | 不能写入用户持久布局偏好 |
| 映射的 Human 决策 | 同名银行仅提出可审候选；明确的 fieldId 经预检后 Recipe 可复用 | LLM 信心高即自选、依字段顺序选第一个剩余目标 | 客户实际两个 fieldId/用途尚未取得 |
| 主体身份 | SUPPLIER 仅关系；三条真实缺失行须逐行 Human 证据 | 供应商一律填 ORGANIZATION | synthetic 第 165/169/172 行不能冒充真实客户行 |
| 同状态视觉比对 | 另设不提交业务的 synthetic 22×172 fixture，16 mapped / 4 proposed / 0 ignored / 3 issue types | 拿正常映射首屏 vs 原型异常状态截图就宣称100% | 只证明呈现能力，不证明客户数据 |
| 文件图标与底部动作 | Eidos #203 提供 iconLabel/hidden 通用组件；Platform 提供真正返回与 reset 的 Host 语义 | 在页面画假 XLSX 徽标或没有实现的返回/重置按钮 | 契约需检验，不能直接合入 Eidos 其他 PR |
| 版本/部署/签收 | 保留 #1060 Draft 与每轮精确 HEAD CI，Railway 保持 main；Human 批准才关闭 M06 | CI PASS 等同生产部署、或用户已视觉签收 | 当前仍处于 3/6，M04/M05 不启动 |

注意：以上“采用/排除”属**用户决策/工程判断**；CSSOM、运行日志、源码结构等才是来源事实。

## 5. 重要冲突、失败→修复→验证链

1. **早期问题一：聚焦按钮 vs 旧源码测试。** `tests/app-host/mobile-design-language.test.mjs:68` 仍断言 `browserToolbar.append(globalControls)`；实际已改为 `browserToolbar.append(focusToggle,globalControls)`。更正后 Platform CI 通过。不能因为测试期望旧结构删除聚焦按钮。
2. **早期问题二：390px 表格未隐藏。** 旧 Chromium `PHONE_TABLE_SHOULD_REFLOW_TO_CARDS` RED；浏览器证实 viewport 与手机 media query 成立、规则存在，却被不当媒体块边界遮蔽。修复 vendored Eidos CSS 边界，真正出现 wrapper `display:none` 与 cards `display:grid`；最终精确 HEAD Real Host PASS。
3. **早期问题三：Host fixture/导航断言错位。** 期间 `live_supplier_chromium.py` 把批次页面两个导航出口都当成一个；另在 53/54/55 记录分页的测试数据与预期总数之间有不一致。修复 header 路由限定、fixture 行数和所有相应总数断言后才绿。中间 `e4ea346f…`、`ba3621e…`、`169b863e…` 的失败不能被删除，也不能错误归为生产故障。
4. **早期问题四：聚焦偏好前置状态。** 测试初始未写明保存的侧栏布局，却断言偏好未变化。设定显式保存值，并核真实操作后复验。不得改导航行为来迎合错误的测试初始化。
5. **原型两步骤 vs 曾经三步骤。** 原型只把“选择文件”与“核对并导入”当顶层；真实工作台曾把预检独立抬升为第三步，后回归两步骤，内部预检/确认/commit 仍保留。随源码同步修正浏览器旧三步骤数量断言。若有新失败，精确核对应版本。
6. **视觉问题区旧 fixture 信息不全。** 曾只有“主体类型缺失”聚合卡。新 synthetic visual job 在真实 Host 中加入银行同名、主体类型缺失、系统编码未决三类，工作流测试通过；但还没有证明完整原型的全部互动与像素结构。
7. **历史成功与最新状态的关系。** 此窗口连续有多个失败、修复、绿灯，最终 `0f5b5b301749cbbb4d13d14cd2c2d582c6fdee23` 的 [Platform CI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391932575)、[BEX Chromium](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391932514)、[In-Context](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391932600) 均 PASS；后续提交若变则以新 HEAD 为准。
8. **原型 vs 合成 Host vs Railway vs 客户。** 原型 Draft；#1060 Draft 在分支 CI PASS；Railway 仅部署 main；客户文件/授权/身份缺失；**四者不能互相替代**。

## 6. 截图、报告、脆弱附件与章节位置

| 参考 | URL / 精确位置 | 已知文件/事实 | 使用限制 |
|---|---|---|---|
| 不可变原型源码 | [#909 原型 HTML](https://github.com/jiangxng/EVO-App-Platform/blob/af58e0abad880439d54230485305bf2b4e05decc/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html) 行约 53–95 | `stageOne`/`stageTwo`、`fileinfo`、问题区、`mappingRows`、`actionbar`；HTML 原型约 30,883 字节 | 原型为示意数据 |
| 原型截图 artifact | [run 38704093619](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38704093619/artifacts/11957646429) | `01-desktop-overview.png`、`03-complete-field-table.png`，另有原型手机图；此处仅登记文件名 | 需要新窗口重新下载/查看全部页 |
| 最新隔离 Host 截图 | [run 39391932514 artifact 12250007262](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391932514/artifacts/12250007262) | `v3-fidelity-workbench-map-1280.png`、`v3-fidelity-first-viewport-batch-390.png`、`v3-e4-map-desktop-submit.png`、`v3-e4-map-phone-submit.png`、连续滚动图、`v3-prototype-parity-issues-desktop.png`、`...-phone.png`、`v3-prototype-parity-submit-desktop.png`、`...-phone.png`；以及报告/日志。部分文件名以脚本/旧索引为据 | 最新 artifact 元数据已验证未过期，但本次未打开其全部图片；新窗口必须逐图看 |
| 旧失败与成功 | [旧失败 run 39285016537](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39285016537)、[成功 run 39363181134](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39363181134) | 可回查移动端 CSS 失败与第一次修复完成的轨迹 | 不要拿历史 run 代替当前 HEAD |
| 最终 V3 设计评审 | [Platform review doc](https://github.com/jiangxng/EVO-App-Platform/blob/0f5b5b301749cbbb4d13d14cd2c2d582c6fdee23/docs/ui-design-reviews/bex01-v3-decision-first-live-fidelity-20261019.md) | 局部差异、流程与图形评审附录；最新三类问题 fixture 记录 | 仍未 Human 视觉签收 |
| 用户原始四张对照图 S01–S04 | [M04 索引 §6/附件指针](https://github.com/jiangxng/EVO-App-Platform/blob/main/docs/plans/foundation-list-experience/BEX-01-V3-M04-RESEARCH-DECISION-REFERENCE-INDEX-20261019.md) | 旧文记录 `image(20261016-123851).png`、`image(20261016-123943).png`、`image(20261016-124020).png`、`image(20261016-124036).png` 的上下文 file_id 与文字观察 | 原始图片二进制**没有经本轮永久存入 GitHub**，不得编造持久链接 |
| 客户真实 Excel 与 Import Job | M04 索引中客户文件名与旧 Job 线索 | 缺少当前文件二进制、真实字段用途证据、授权 Job，不能进行 M04/M05 | 不复制客户资料入测试 repo 或用 synthetic 冒充 |

较长或容易丢失的素材优先依赖 GitHub CI artifacts、不可变源码链接和上述确切文件名；聊天内曾有上传图片/本地临时路径，那些路径不保证跨聊天有效，不用作唯一保存位置。

## 7. 落地位置与安全接续

| 模块 | 现在有什么 | 下一项精确任务 |
|---|---|---|
| `apps/data-import/page.ts` | reviewTask、源文件指标、mapping four columns、三类 synthetic issue actions | 源卡 XLSX/CSV 徽标、真实动作与 #909 文案顺序，对照新浏览器图 |
| `apps/object-extension/batch-page.ts` | 集中审核与批次固定值提示、Eidos 四列/计划预览 | 按已确认的源列身份与真实 Host 预检流程完整核对 |
| `vendor/eidos/src/renderers/html/index.ts` / `runtime/contracts.ts` / `runtime/validate.ts` | 通用 HTML/合同/校验，Platform vendored copy | 如需图标、hidden、返回/原生重置，先审查 Eidos owner #203 的适用契约并同步，不能侵入业务层 |
| `vendor/eidos/src/design-language/productive-workbench-css.ts` | 已修 CSS media 边界与 opt-in workbench 样式 | 不回退手机真实 reflow；#204 owner 样式需独立合规对齐 |
| `vendor/eidos/src/workbench/shell.ts` + `manager/desktop-workbench-runtime.ts` | reversible route focus、Host 仅限指定路由 | 保护持久 sidebar、Ctrl+B/活动栏导航与普通页面 |
| `tests/bex01/live_supplier_chromium.py`、`v3_synthetic_xlsx_retained_fields_chromium.py` | 实际 Host 桌面手机验证、synthetic issue screenshot | 同状态全流程、底部 return/reset/confirm 的真实交互测试、最终 1280/390 截图 |
| `tests/protocol/data-import-human-experience.test.mjs`、`bex01-v3-decision-first-visual-review.test.mjs` | 两步骤、源审核、默认过滤及问题顺序结构回归 | 添功能性不变量，绝不删去失败断言 |
| `docs/ui-design-reviews/bex01-v3-decision-first-live-fidelity-20261019.md` | 已有实际像素/层级差异附录 | 将最终 screenshot、差异闭环与用户 Human 签收证据加在实施线审查记录，不混进其它项目文档 |
| `project.status.json`、Railway production、PA05/EOG | 并行 owner 独立治理 | **不动** |

### 尚未解决及最值得继续阅读的方向（D）

- [ ] 当前 #1060 的 1280px/390px **完整**新 artifact 与 #909 原型 artifact 做同状态对照；特别注意文件卡片、任务/问题区、四列密度、底部操作与跨阶段细节。
- [ ] 缺口: Eidos #203 iconLabel 与 hidden 通用方案尚为 Draft；需确认 Platform vendor/owner 最小安全同步，不把业务字段语义塞 Eidos。
- [ ] 缺口: “返回文件 / 恢复初始选择”必须真实导航和原生 reset；确认对持久 Import Job 的影响边界，不能让 UI reset 偷改服务器 mapping 或静默 commit。
- [ ] 缺口: 单一实施 owner 确认：#1054、#1060、#1066、#1070 并行保留历史但不应重复合并同源工作。
- [ ] 缺口: Eidos #202/#203/#204 均未合并；后续检查 Host vendored 文件与 Eidos main 的真正对应关系以及测试。
- [ ] 缺口: 用户 Human 视觉签收；客户 Excel 原件、授权真实 Import Job、两条银行真实身份/用途/样本和三条主体身份（依 M04）尚无授权证据。
- [ ] 缺口: Railway production 并未部署 #1060；合并/部署必须经过用户要求的门禁，不得让 PR CI 替代真实生产版本与签收。

若无新的争议，不重复 2026-10-14～15 已完成的外站研究。对新证据依次查：**真实 Host 最新截图 → #909 精确原型 HTML/截图 → Platform/Eidos 合同与交互源码 → 精确 HEAD CI/日志 → 有必要时才定向复访旧 H-B/H-C 外站资料**。

## 8. 本交接文档自身保存方式

只新增 `BEX-01-V3-M06-WINDOW-02-HANDOFF-ENTRY-20261020.md` 和 `BEX-01-V3-M06-WINDOW-02-RESEARCH-DECISION-REFERENCE-INDEX-20261020.md`；独立 documentation branch 上提交，未编辑 PR #1058 原两文档、M04、V3 总索引、实施 PR、Eidos、`project.status.json` 或 Railway。此轮若后续出现新证据，应在新的后续增量或明确 owner PR 中追加，旧快照保持可回溯。