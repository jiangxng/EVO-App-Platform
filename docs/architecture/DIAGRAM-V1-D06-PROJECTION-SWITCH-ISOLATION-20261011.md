# Diagram Commercial v1.0 / D06 — 多投影切换后状态独立性

日期：2026-10-11。原始要求：`EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md` §14 D06。

## 已有事实与复用
- 复用 B7 CAS + B8 按 projectionId 读取不同 Gallery item，D05 用户显式另存的新投影，不新增版本策略与持久模型。
- 原企业主投影保存：关系可见、节点可见；D05 另存的新投影保存：节点可见、关系隐藏。两者在同一 Gallery 独立存在。
- 当前 Eidos Designer 的 Undo/Redo、相机、临时隐藏集合属于 mount-local 状态；本项通过产品 HTML route **实际卸载重新挂载**，而非只模拟请求字段。

## 实际 Chromium 子门禁
同一浏览器标签打开原投影 URL（指定 projectionId），作 **未保存** Zoom 和 Hide Node，再切到 D05 保存的另一个投影 URL。验证 B 的独立节点/关系状态、相机复位、Undo 无历史。B 再作未保存 Hide Node，切回 A，A 应恢复其存储中的可见性、位置、初始相机和空 Undo；再回到 B，B 的未保存编辑不可留存。所有跳转 CAS 版本仍为 7，业务定义历史 1。验证原投影和复制投影各自的 Gallery view 隐藏 ID 不被污染。

由 `DIAGRAM_D06_BROWSER_SUBGATE` 强制检查真实产品浏览器门禁运行完毕。上述属于本地临时合成企业图 + 实际 Chromium route mount 的自动化测试，**并非 SPA 所有 Host 导航路径、不同设备原生输入、实际多人线上会话、客户业务人员正式验收**。原人工签收状态仍 0/39。相关实现设计和版本限制沿用正式交接文档和原始 §13/§14/§16，不新增 v1.0 目标。
