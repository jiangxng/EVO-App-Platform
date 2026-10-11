# B9f｜两个真实 App 保存 Handler 进程的文件投影 CAS 竞争

日期：2026-10-11。独立 [Draft #618](https://github.com/jiangxng/EVO-App-Platform/pull/618) 堆叠 [B9e #617](https://github.com/jiangxng/EVO-App-Platform/pull/617)。不合并不部署；只修改集成测试/专用测试子进程/CI/证据文档，TR-01、main、业务源图、Host/Agent 授权、投影 CAS 契约以及 Eidos 22/2600 寻路预算均不变。

## 与 B9d/B9e 的严格区别

- B9d：正式 App 授权 Save → 文件型 Store → 新实例 Editor/Viewer GET，内存业务仓相同但独立文件 Store 重新创建。
- B9e：两个 OS Node 进程真实同时调用 **Store.putIfVersion**，只允许一个获胜；冲突和残留锁目录必须 fail-closed。这一轮没有穿过 App Handler 授权层。
- **B9f：两个真正独立的 OS Node 进程**分别构造相同企业初始账本定义、独立 App Editor Handler/授权钩子/SessionStore、正式文件型 ProjectionStore，共享唯一测试文件；两个完整 App Handler 均发起 expectedWriteToken=0 的 SAVE_PROJECTION_VIEW 请求，保存不同的 camera.translateX（A=101，B=202），但只有一个可成功。

## 机器断言

1. 两个子进程分别通过正式 App Editor GET 获取可用于保存的节点及位置，以合法 viewState 和独立身份/交互 ID 调用正式 Editor SAVE Handler。
2. **仅一份写入成功**，另一份必须明确拒绝（WRITE_CONFLICT 或 STORE_LOCKED），不能误报成功或默默覆盖别人的投影。
3. 子进程终止后，新建 FileDefinitionProjectionStore 重新读取：token **1**、只有一份投影行、camera.translateX 必须等于唯一获胜进程提交的 101 或 202。
4. 两进程各自企业业务定义历史仍仅 1，投影保存不得创建新的业务定义版本。
5. 真正 Linux CI child_process.spawn（独立 Node PID），仅在临时磁盘文件写入，不依赖生产服务，也不触碰 TR-01。

新增测试文件 tests/integration/definition-projection-b9f-handler-race.test.mjs，子进程独立入口 tools/diagram-projection-handler-racer-b9f.mjs，且纳入现有 Diagram Designer Integration CI。

## 不可越界的结论

这是比 B9e 更接近业务保存流程的并发机器子场景，但仍**不是**两个实际登录的企业客户浏览器，也不覆盖真实用户权限系统、分布式多实例云数据库或物理 iOS/Android 设备。没有改变任何 Host 权限默认策略，测试中的授权钩子是明确设置的受控允许。原 §14 **39 项正式商业化验收仍 NOT TESTED**。

验收依据只能使用 [#618 当前 HEAD Checks](https://github.com/jiangxng/EVO-App-Platform/pull/618) 对应同一提交的完整工作流；失败必须保留/修复，不能援引历史绿色冒充。
