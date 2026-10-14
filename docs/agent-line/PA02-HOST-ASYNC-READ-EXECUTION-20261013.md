# PA-02 正式 Host 按需异步 READ Worker 执行链（2026-10-13）

Status: DEV_OPT_IN_ASYNC_READ_EXECUTION / TEST_GATE_PENDING / PA02_OVERALL_IN_PROGRESS

## 实际 Host 入口与插件边界

用户已确认：平台尚在持续开发阶段，符合独立插件演进方向的 PA-02 改动可以修改共享 `manager/server.ts`。本批仍默认保持轻量 Host，不把PA-02实验接口强塞进全部实例，也没有线上部署动作。

- `APP_PLATFORM_AGENT_RUN_ASYNC_WORKER_MODE=OFF` （默认）：没有异步执行器或数据库连接；原V010执行链原样运行。
- `APP_PLATFORM_AGENT_RUN_ASYNC_WORKER_MODE=READ_ONLY`：只有显式选择才动态装载PA-02运行库，通过Host的真实 `enterprise-agent.run.start`、`run.resume`、`run.get`、`run.cancel` 动作入口使用PostgreSQL持久Run/Worker/Cancel；旧V010 Run依然优先按旧状态机处理，不迁移旧数据。
- 必须同时设置 `APP_PLATFORM_AGENT_RUN_ASYNC_DATABASE_URL` 和 `APP_PLATFORM_AGENT_RUN_ASYNC_SCHEMA`，并保持 `APP_PLATFORM_AGENT_RUN_ASYNC_READ_MODE=OFF`，以避免两个并行只读authority竞争。这个**显式开发执行模式**会调用PA-02数据库schema的初始化DDL；不是只读bootstrap。生产或实际企业数据库不得不经既定审批就配置该模式。
- Run.start以Host已认证Principal+Context及Action请求来源构造完整任务身份，PostgreSQL原子claim避免同请求重放；READ Worker持有fencing lease，完成每个片段后安全归还租约，允许新Worker继续。不允许Material WRITE自动执行；遇到WRITE仅阻断并暴露 `BLOCKED` 状态，而非尝试事务重发。
- run.resume可恢复已存储异步Run；legacy Run始终优先使用旧V010执行器，错误企业身份不能通过切换数据库绕过。
- run.cancel保存持久REQUESTED并执行同事务安全检查，只有Worker已让出租约、没有未知WRITE和待回执时才追加V010`RUN_CANCELLED`真实事件；并发推理中不可谎称已取消，用户可在Worker结束后再次调用取消来完成终态。
- 本批加入 PostgreSQL18 隔离测试验证：实际Run Action Handler READ完成、source幂等与不同任务冲突、不中断V010、在途推理取消等待和真实终态落库，以及之前fencing release回归。必须以最终head CI为准。

## 尚未完成的功能门禁

1. `enterprise-agent.thread.send`／个人工作台实际聊天主路径目前仍是V010线程+Run执行器；本批仅把正式 `enterprise-agent.run.*` 动作接进V020，尚非所有入口同源。
2. Material WRITE需要真实业务Owner接入受治理幂等、意图记录、未知结果核验和ActionReceipt终态；PA-02B的隔离Owner协议已具备，但未到业务应用工具实际执行中。
3. 多Node Worker自动复活、长事务/数据库异常时的监控、READ副作用声明校验、实际浏览器取消UI、Run列表的双Authority视图合并，仍需补。
4. 未执行真实企业WRITE或线上部署；PA-02A/B/C并未凭本批直接宣告整体DONE。

当前实现属于可运行的**开发模式**，并非只给甲乙方截图验收的材料；应继续以可用性和可靠性改进为目的。