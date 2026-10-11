# B7b — 强制投影写入令牌及 Agent 写入边界（2026-10-10）

> 状态：独立 Draft PR [#563](https://github.com/jiangxng/EVO-App-Platform/pull/563)，基于 B7 [#561](https://github.com/jiangxng/EVO-App-Platform/pull/561)。无主线合并、无部署、无真实设备验收。继承 [研究索引 #552](https://github.com/jiangxng/EVO-App-Platform/pull/552) 和 `DIAGRAM-B7-PROJECTION-CAS-20261010.md`。本轮**没有重新浏览官方外部资料**；以下新判断全部来自已读源码与 GitHub CI。

## 发现与证据

1. B7 业务编辑器原本对**未带 `expectedWriteToken` 的旧请求**使用实时最新版本代替。旧客户端因而可能覆盖同时编辑的投影。
2. 两个 Agent 工具 `apps/eog-2d-designer/definition-projection-agent-tools.ts`（direct）和 `apps/eog-2d-designer/current-2d-editor-agent-tools.ts`（unified Personal Agent）原本调用 `projectionStore.put()`。这个无条件存储入口绕开了 B7 在人工 SAVE 操作中建立的版本校验。
3. 统一 Current 2D 工具会作用于两类宿主：Definition Projection 和 Enterprise Operating Graph。后者已有独立 `graphViewService.apply(...expectedRevision)`，需要传回正确的视图版本以防 Agent 读取和修改之间发生变化。

## B7b 工程决定

- 人工编辑器的 **SAVE / RENAME / SET_PRIMARY / SAVE_AS_NEW 全部强制要求合法 `expectedWriteToken`**。缺失返回 `DEFINITION_PROJECTION_WRITE_TOKEN_REQUIRED`，不会自动用当前版本伪造 token。B7 显式的陈旧草稿 Save As 依然允许以原先读到的 token 发起非破坏性复制；其目标是基于**当前 gallery + 版本快照**追加新投影并 CAS。
- 两类 Agent 的 GET 均返回 **writeToken**；工具的 crop schema 强制传递 `expectedWriteToken`。Agent 可以读取任意详细投影素材，但不能凭旧观察静默覆盖新的用户或 Agent 编辑。
- Definition Projection 的两类 Agent crop 均调用 `putIfVersion` 而不是 `put`；单次读取使用 `getVersioned` 获取 gallery 与版本，先校验模型提供的读 token，再由存储原子 CAS 拒绝读后发生的竞争修改。
- Enterprise Operating Graph 在统一 Agent 模型读/写过程中使用其自身的 `view.revision` 令牌，并继续依赖 `graphViewService.apply` 的 revision 检查，**不把它错误绑定为 Definition Projection 版本**。
- **边界：** 不变更 Eidos 通用画布，也不改图中连线的业务语义；Eidos 通用可选写令牌契约继续服务其他 Host。App Platform 投影专用 Host 强制令牌。

## 已运行的自动验证

- `tests/integration/definition-projection-edit-save.test.mjs`：旧请求缺失 token 的拒绝和未写入；旧 fixtures 迁移到显式写版本。
- `tests/integration/personal-agent-current-projection.test.mjs`：真实 Agent Tool Registration 路径的 Get → Crop；同一投影上由人工先写入，旧 Agent 观察不能覆盖；换新 token 后才能写；Direct Agent 与 Unified Personal Agent 均覆盖。
- `.github/workflows/diagram-designer-integration.yml` 已将 Personal Agent 测试纳入真实 CI 命令与路径触发，不把测试文件存在等同于已执行。
- PR #563 最新 commit 的 CI 需实时核对；首个有效 CI 结果 `6269f91e...` 显示 Diagram Integration **42/42 PASS**、Platform PASS、Continuity PASS。

## 没有通过、也未宣称完成的验收

- **浏览器双窗口 D05**：Node 模拟多个 Session 及并发已通过，但尚未运行浏览器真实 DOM、ActionHost、冲突提示、另存新投影串联测试。
- **旧客户端兼容迁移**：B7b 对旧版写请求采取明确拒绝；需要升级实际前端与 Agent 模型工具缓存，必要时给出有针对性的提示，不能将旧客户端仍可保存视为已通过。
- **生产存储环境**：文件提供者使用锁目录+原子重命名，不足以证明跨主机、网络 FS、进程崩溃恢复；仍需要按部署形态选择真正原子 CAS。
- **§14** 的 D03 / D05 / T04 / T05、性能与真实设备没有因单测自动改为 PASS。
