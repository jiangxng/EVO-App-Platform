# B9g｜被拒绝的 App 投影 Save 不得改变磁盘或只读 Viewer 数据

日期：2026-10-11。独立 [Draft #619](https://github.com/jiangxng/EVO-App-Platform/pull/619)，堆叠 [B9f 两 App Handler 跨进程 Save #618](https://github.com/jiangxng/EVO-App-Platform/pull/618)。依然 B 类 2D Designer 增量，测试/CI/文档限定：没有修改运行时、Host/Agent 授权策略、CAS 契约、投影版本模型、业务关系端点、Eidos 路由预算、TR-01；未合并、未部署。

## 用真实平台代码验证的拒绝路径

之前 B9d 验证了 **允许保存**时文件 Store 保存→独立 Editor/Viewer GET 与旧 token 拦截，B9e 直接对 Store 跨进程 CAS，B9f 进一步通过两个独立 App Handler 进程竞争 CAS。但不能由允许保存/并发拒绝推导出**授权失败**时不会修改 Store 或让只读 Viewer 看见未授权数据。

本轮同一个受控企业投影业务定义，使用正式 Editor GET/SAVE Handler + 正式 FileDefinitionProjectionStore：
1. 授权钩子明确拒绝首次 SAVE_PROJECTION_VIEW（预期 token 0）。要证明权限检查确实被调用一次，Save 返回失败，token 仍为 0，**投影磁盘文件根本不存在**。
2. 另一个受控**明确允许**的 Handler 对同一投影保存「隐藏某节点」，token **0→1**。
3. 再由原拒绝 Handler 使用**当前** token 1 尝试覆盖为不隐藏；必须仍失败、授权拒绝计数增加、版本仍为 **1**，不能把失败归因于只是旧 token。
4. 新创建文件 Store 读回隐藏节点；正式只读 Enterprise Definition Viewer GET 必须继续**看见唯一允许提交的隐藏效果**，且 Viewer 不写 Store。
5. 企业定义历史仍为 1；只在 CI 临时文件写入，清理测试现场。

**证据限定**：授权钩子在测试中明确人为设置允许/拒绝，证明 App Handler 的拒绝路径及文件数据隔离，不代表已审计某企业的真实身份服务/Policy Provider；没有登录实际用户、云数据库、物理设备/生产部署。原 §14 **39 项正式商业验收仍 NOT TESTED**。

新增：tests/integration/definition-projection-b9g-denied-file-save.test.mjs；集成 CI 定向纳入。最终 [PR #619 Checks](https://github.com/jiangxng/EVO-App-Platform/pull/619) 的相同 HEAD 必须绿色；若首测有失败要留证、修复和再验证。
