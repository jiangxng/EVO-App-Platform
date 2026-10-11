# EOG package convergence

Canonical package family:

- `evo-eog-2d`
  - `evo-eog-2d.viewer` — interactive read/inspect/navigate Workspace.
  - `evo-eog-2d.designer` — Viewer baseline plus governed semantic editing.
- `evo-eog-3d`
  - `evo-eog-3d.viewer` — neutral spatial Viewer Workspace.
- `evo-enterprise-observatory`
  - `evo-enterprise-observatory.2d` — 2D runtime-fact / analysis overlays.
  - `evo-enterprise-observatory.3d` — 3D runtime-fact / analysis overlays.

The earlier separate `evo-eog-2d-viewer`,
`evo-eog-2d-designer` and `evo-eog-3d-viewer` package identities were
migration steps. Their legacy source paths remain compatibility aliases or
re-exports where required.

The 2D Viewer is **interactive**, not static. Viewer and Designer share graph
projection, node/edge selection, Inspector, pan/zoom/focus, navigation,
overlays and View State. Designer adds semantic mutation capabilities; Viewer
does not receive them.

The 3D Viewer likewise owns the neutral spatial graph experience. Enterprise
Observatory may overlay Runtime Facts and analysis in either 2D or 3D, but it
does not define the Viewer products.

Enterprise Context remains the single Enterprise Graph Definition authority.
Eidos owns reusable 2D/3D interaction cores.

SOP remains a separate deferred capability.

## 导航与调用边界

EOG Viewer / Designer / Observatory 是可安装、可激活、可路由、可被 Agent
发现的专业能力，但不是普通办公用户的一级应用导航。

因此当前约束是：

- Package / Feature 生命周期保留；
- Capability provider 保留；
- Experience Page / Route / Surface 保留；
- Agent Tools 与公共 Action 保留；
- 不贡献持久 Workbench `navigation`；
- 由 Ledger Manager、规则详情、模板预览、分析/诊断流程或显式 deep link
  在有业务上下文时调用。

**安装或激活一个 Feature 不等于必须在主导航显示它。**
Navigation 是独立的 Experience discoverability 决策，不是 Capability
存在性的证明。未来若某个 EOG 能力重新成为普通用户的高频独立任务，应先
重新评估产品导航层级，而不是因为 Package 已安装就自动暴露。

## 需求澄清入口

EOG 后续产品需求按中文清单逐项收敛：

`docs/roadmap/EOG-待明确需求清单-v0.1.md`

该文档只记录已确认边界与待明确问题；每项确认后再回写对应架构/契约。
