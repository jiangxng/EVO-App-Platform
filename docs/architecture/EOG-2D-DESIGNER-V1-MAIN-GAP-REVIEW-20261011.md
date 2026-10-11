# EVO 2D Designer｜v1.0 对照 2026-10-11 双仓 main 的差距核对

> **审查范围 / 固定快照**：Platform `851ac9c92f3cf19ddc4e9e18e6f92355e4024a49`；eidos `3fde008f372bcbcaad45563f511c7b7cf1f8924e`。需求唯一基准为 [2026-10-09 v1.0](./EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md) §4–§14。当前为**历史资料恢复 + 源码定向阅读 + PR 元数据核对**，**未本次运行 CI/打开线上画布/进行实机人工验收**。阅读等级及来源见[恢复资料索引](./EOG-2D-DESIGNER-RECOVERED-RESEARCH-DECISIONS-20261011.md)。

## 1. 完成口径先复位

- v1.0 §13 **A 基础闭环和 B 专业编辑都属于本次交付**，只有 C 才可延期；不能只凭四种连线、避障算法、浏览器脚本通过称整个产品完成。
- §14 39 项正式商业签收仍为 **0/39**。这是**有签署证据的正式验收数，不是实现率，也不是自动化测试通过数**。继续使用[原 39 项证据矩阵](./DIAGRAM-COMMERCIAL-ACCEPTANCE-EVIDENCE-MATRIX-20261010.md)，不得以本文件的“已实现”替代原矩阵的人为 PASS。
- 明确五层：**聊天提出**（用户要求）；**文档定稿**（v1.0）；**源码存在**（当前 main）；**自动/浏览器测试**（历史 CI，有 SHA 和设备边界）；**正式实机/客户签收**（尚缺）。部署和授权身份另列，不凭 PR 已合并推导上线或验收。

## 2. 双仓当前采用事实

| 对象 | 当前可证事实 | 不能推断的事 |
| --- | --- | --- |
| Eidos [#160](https://github.com/jiangxng/eidos/pull/160) | merged；`main` 上的 `src/diagram` 包含 path geometry、obstacle-routing、snapping、selection、waypoint、layered-layout、Surface/Viewport 等 | 所有 v1.0 产品交互已完成，或 Windows/Mac/iOS/Android 实机通过 |
| Platform [#693](https://github.com/jiangxng/EVO-App-Platform/pull/693)、[#695](https://github.com/jiangxng/EVO-App-Platform/pull/695) | merged；独立 EOG Designer/Viewer 与投影/Host 适配归主线，修正 Eidos public API/vendored 差分 | 生产插件实例已激活、真实业务数据用户验收 |
| Platform [#699](https://github.com/jiangxng/EVO-App-Platform/pull/699)、[#705](https://github.com/jiangxng/EVO-App-Platform/pull/705)、[#706](https://github.com/jiangxng/EVO-App-Platform/pull/706) | merged；保留 B10/B11 42 个历史 Draft 与 B5–B9 54 个历史 Draft 的可追溯资料/测试，#706 是 guarded retirement 流程 | 所有历史 Draft 都直接合到产品 runtime，或删除动作已最终实际执行；应按分支/运行记录单独核实 |
| 历史研究 [#552](https://github.com/jiangxng/EVO-App-Platform/pull/552)、[#623](https://github.com/jiangxng/EVO-App-Platform/pull/623)、[B11p #689](https://github.com/jiangxng/EVO-App-Platform/pull/689) | 当前元数据为 closed/unmerged；相关内容已由专题档案保存/索引 | 旧 PR 合并状态自动变成 merged，或 39 项自动获得签字 |
| 历史 B9j [Chrome CI](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38069498639) | GitHub 研究存档记录合成合法图使用真实 Chrome 按钮 Save、App CAS、重开 Designer 与只读 Viewer 的机器端到端证据 | 本次重新运行，生产数据库/身份、真实企业 S2C/P2P，或实体设备 PASS |

## 3. 按 v1.0 产品要求逐项核对（不是 §14 PASS）

| v1.0 范围 | 当前源码/历史实证 | 状态与证据等级 | 缺口 / 下一步 |
| --- | --- | --- | --- |
| §4–6 四种路径、路径实际命中及箭头 | Eidos `edge-paths.ts`, `surface.ts`；Platform `edgePaths` 契约 | **代码已存在，历史自动浏览器覆盖部分路径** | 执行 V01–V06 真机可视/命中/语义/缩放组合 |
| §6 有界避障、并行边、自环 | Eidos routing / edge-lanes / Surface；B8v/w 真拥塞 21/900、27/1200 历史机器记录 | **实现基础能力，存在已知拥塞降级** | 密图路由可读性、真实业务图与端点/标签冲突；不可扩大预算掩盖碰撞 |
| §7 选择集、框选、群移和吸附 | Eidos selection/snapping/Surface、历史 B6/B8 相关 Chrome 测试 | **实现主要能力；实机未签收** | M01–M09 原生左右键、焦点、离画布/取消验证 |
| §6 路径点、正交段、手工锚点 | Eidos edge-waypoints、Surface 控制柄；B8c 原生 Chrome 重叠手柄/再抓取 | **实现主要路径编辑；有模拟浏览器证据** | E03–E07 标签移动、拥挤命中及真实触摸 |
| §11 保存、权限、并发、Viewer | Platform `apps/eog-2d-designer/definition-projection-editor.ts`、`contracts/template-projection-gallery.ts`；B7/B9 历史机器 CAS/Viewer 证据 | **主要路径已实现且部分自动化验证** | D03–D06 真实身份、DB、真实企业案例、模板预览和用户恢复体验 |
| §11.2 撤销/重做和已保存基线 | Eidos `surface.ts` `undoHistory`/`redoHistory` + 50 步截断；Save 成功的分支随后均 `length=0` | **确认偏离原要求（源码直接验证）** | P0：Save 后继续允许撤销已保存前展示改动；撤销后重新标记未保存；保存时异步新增编辑不被覆盖；补 D02 |
| §10 自动排版与锁定/相机 | Eidos `applyLocalAutoLayout` 只选当前可见节点；布局 API 只有尺寸/方向，遍历全部布局结果覆盖 x/y，随后 `followsFitToCanvas=true; fitViewToCanvas()` | **确认部分偏离（源码直接验证）** | P0：位置锁定契约、locked 节点不移动或明确拒绝；手工路径保留/重布线选项；不得无条件改变已保存视角；A01 |
| §7 Desktop 右键菜单、右拖语义 | Eidos Surface 当前可见左右中键指针逻辑，但主文件未找到原地右键自定义 contextmenu 的实现入口 | **疑似缺口，待交互复验** | P0：原地右键显示对象/群组选项，右拖只平移且不弹菜单；M05/M06；不可仅凭字符串缺失断定用户端表现 |
| §8–9 手机/平板交互、非拖动替代 | 已有移动工具栏折行、触摸取消/重抓取、部分控件/坐标按键；B9q emulated viewport | **部分代码和自动化，未完成实机商业体验** | P1：手机显式多选、抽屉/旋转/软键盘、双指变单指、触摸目标、VoiceOver/TalkBack；T01–T07/A02 |
| §4–5 搜索、关系阅读、视觉、可访问性 | 已有选择/属性/部分 ARIA 与路由拥塞摘要，完整图搜索及非拖动替代未获完整证明 | **部分实现，整体未验证** | P1：节点/关系列表搜索、定位、关联高亮、焦点恢复、异常多通道、缩放与图例 |
| §11.1 展示样式完整持久化 | Platform `TemplateProjectionView2dV010` 只列 `hiddenNodeIds`, `hiddenEdgeIds`, `edgePaths`(pathKind/waypoints/anchors), `placements`(x/y), `camera`；Eidos Save 请求同型 | **证实字段缺口（源码直接验证）** | P0/P1：若开放编辑，图/边纹理、线宽、颜色、标签位置、锁定状态、尺寸等须受控声明式保存并 Viewer 往返；不可改变业务箭头 |
| §12 性能、双实例、实体环境 | B8/B9 合成 Chrome、Firefox/WebKit 和部分双图测试已归档；非用户指定真实设备 | **存在机器证据，正式目标未签署** | P1：200/400、500/1000、手机 100/200 FPS/延迟 + 原生硬件/多实例长期验证；P01/P02 |

**已定位源码（固定 main）**：
- [Eidos Surface，保存与撤销以及自动排版](https://github.com/jiangxng/eidos/blob/3fde008f372bcbcaad45563f511c7b7cf1f8924e/src/diagram/surface.ts)（约 1334–1456、1550–1646、1732–1786 行）；
- [Eidos Layered Layout](https://github.com/jiangxng/eidos/blob/3fde008f372bcbcaad45563f511c7b7cf1f8924e/src/diagram/layered-layout.ts)（当前 layout input 无 pinned/locked 位置约束）；
- [Platform Gallery contract](https://github.com/jiangxng/EVO-App-Platform/blob/851ac9c92f3cf19ddc4e9e18e6f92355e4024a49/contracts/template-projection-gallery.ts)（`TemplateProjectionView2dV010` 字段）；
- [Platform Projection Editor](https://github.com/jiangxng/EVO-App-Platform/blob/851ac9c92f3cf19ddc4e9e18e6f92355e4024a49/apps/eog-2d-designer/definition-projection-editor.ts)（Plugin/Host 数据边界）。

## 4. 必须收敛的九个产品工作包（不是重新从零开发）

| 优先 | 工作包 | 交付验收点 | 模块归属 / 对应 §14 |
| --- | --- | --- | --- |
| P0 | W1 保存基线与撤销历史 | Save 后可撤销前序操作且 dirty 正确；异步/失败/跨投影不串 | Eidos Surface 状态 + Platform CAS；D02/D03/D06 |
| P0 | W2 位置锁定的自动排版与视角 | 锁定不动、隐藏不回、可撤销、相机不擅变；手工路径明确处理 | Eidos layered-layout/Surface + 展示契约；A01/D04 |
| P0 | W3 完整鼠标语义/右键菜单 | 原地右键菜单和右拖平移消歧，群组右键语义，焦点不劫持 | Eidos Surface / Host surface；M01–M09 |
| P0 | W4 展示字段与跨端持久化补全 | 受控样式/标签/锁定与默认值，旧图兼容，Save–reload–Viewer–预览一致 | Eidos 公共契约 + Platform gallery/store/viewer；V03/E07/D04 |
| P1 | W5 专业精细改线及拥塞收口 | 密图真实几何仍安全；标签/锚点/重叠手柄可定位、可取消 | Eidos geometry / hit testing；E01–E07 |
| P1 | W6 手机/平板产品化 | 显式多选、手势互斥、抽屉/软键盘/安全区/设备旋转完整体验 | Eidos mobile Surface + App 适配；T01–T07 |
| P1 | W7 阅读性、搜索和无障碍 | 可查找节点/关系、定位/高亮、键盘与非拖动替代、焦点返回 | Eidos Surface/Design Language；V05/V06/A02 |
| P1 | W8 全链路真实环境恢复与一致性 | 真实角色权限、双窗口与 Agent CAS 冲突、失败重试、模板与 Viewer 重开 | Platform projection/Host/Viewer；D01–D06 |
| P1 | W9 性能+设备+正式 39 场景证据 | Windows 鼠标、Mac 触控板、iOS Safari、Android Chrome，真实场景与设备/签字记录 | Eidos + App QA；P01/P02 + §14 全部 |

**排序规则**：先修已知 P0 功能偏移与数据契约，再补 P1 交互/实机；以“打开→编辑→Save→重开→Viewer”闭环组织真实验收，不再以 B10/B11 诊断增量总数衡量商业化完成。此表是工作包划分，不是用户批准的日程或代码已经提交声明。

## 5. 未恢复、未验证、不得替代的证据

- 本次当前聊天无附加“旧窗口完整对话导出”；Library 检索到完整 v1.0 Markdown 两份、历史 GitHub S1–S7 研究索引和 B9j 证据。未入档的其他句子/网页/当时 UI 截图无法无损推定。
- 本次没有重新打开七个外部官方网站、浏览器现场操作、跑最新 main CI、操作 Railway 环境或对真实客户 S2C/P2P 作实机复核。历史网页读原文记录沿用历史日期。
- 用户设备四平台实际物理操作、屏幕阅读、生产认证授权、生产数据库可靠性、真企业脱敏 payload、业务人员签收尚缺。正式 39 项统一 NOT TESTED。
- 性能中的 60fps/30fps 等是 §12 **目标值**，不是现有产品实测值；Chrome CI 的合成图耗时不能作为客户硬件 SLA。
- 工程完成不改变“投影裁剪是可见性层”的既有定义：手工位置/视角是展示数据，不是创建新的业务版本，也不得让 Agent 绕过人类当前本地草稿/CAS。

## 6. 进入实施前的最小验证顺序

1. 在本专项独立分支逐项建立 W1–W4 最短失败复现，特别是 Save→Undo、锁定布局、原地右键与展示样式保存往返；记录准确 commit 和用户可见结果。
2. 通用图形能力先在 **Eidos 独立 PR** 处理；Platform 使用窄范围适配和契约 PR，保留 `vendor/eidos/src/diagram/surface.ts` 的 Host context-navigation 差分；不覆盖主线/Agent/业务文件。
3. 运行明确版本的浏览器自动化后仍保持正式 0/39，按[实机规程](./DIAGRAM-B9R-39-ITEM-DEVICE-ACCEPTANCE-PROTOCOL-20261011.md) 逐项签收；实际环境/生产授权不通过就不能宣告商用完成。
4. 交付产品级差距和真实证据；历史 B10/B11 研究/诊断仍供定位使用，不再次为完成数量而扩增。
