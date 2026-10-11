# Diagram v1.0 D01 — 隐藏节点/关系，业务语义不变（2026-10-11）

## 原始验收要求
- 来源：`EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md` §14 D01。
- 仅通过 Designer 的真实用户操作隐藏业务节点和关系，再点击显式 Save；只更改 Projection view，不删除业务对象/关系，不改变箭头/source/target/Business Definition revision。

## 复用与实施
- 复用 B7 projection CAS、B8b Designer→Viewer 回路、B9r 自动化与人工证据分级。
- 本 PR 只增加 D01 原生 Chromium 鼠标的产品浏览器回归，不修改 Eidos 或 Host 业务语义。
- 在现有 E07 回归之后独立新建 Designer 页面，以真实鼠标选中关系并点击 Remove from view，再选中节点并隐藏。
- 验证保存前 CAS token 不变；点击 Save 后仅 CAS +1；新建/刷新 Designer 与独立 readonly Viewer 均不可见隐藏项。
- 同时用原产品 GET Handler 校验完整业务节点 2、关系 1、原 source/target/arrow、业务定义历史 1；不把隐藏的展示状态误判为业务数据删除。
- CI 工作流必须找到 `DIAGRAM_D01_BROWSER_SUBGATE`，否则失败。

## 证据层级与未完成
- 代码、浏览器自动化和 CI 必须分别按准确 PR head 及 Actions run 记录；此处的测试设计不是 PASS 声明。
- 本次合成销售→收款示例、Chromium CI、临时 FileStore CAS 不是生产真实租户，也不是 Windows/macOS/iOS/Android 物理设备或业务人员签收。
- D01 正式商用验收保持 NOT TESTED；39 项人工签收仍 0/39。
- 原始 39 项验收矩阵、Agent、Ledger Runtime、全局 authority/status 及独立交接 PR #762 / #715 均不修改。
