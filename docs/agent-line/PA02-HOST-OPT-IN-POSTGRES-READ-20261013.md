# PA-02 Host 真实接线第一批：按需启用 PostgreSQL Run 读取（2026-10-13）

Status: HOST_READ_THROUGH_OPT_IN / FULL_PA02_IN_PROGRESS / NO_DEFAULT_BEHAVIOR_CHANGE

本批开发遵循“轻量宿主、插件按需装载”架构约束，用户已授权修改共享Host核心文件，但平台目前仍处于开发完善阶段，不将本次代码变更称为生产切换。

## 已接线

- `manager/server.ts` 当前真正使用的 `enterprise-agent.run.get` action增加了条件注入的只读异步Run端口；并在Host关停时关闭可选连接。
- 只有 `APP_PLATFORM_AGENT_RUN_ASYNC_READ_MODE=POSTGRES_READ_ONLY` 才加载PostgreSQL实现；缺省 `OFF`，不加载DB模块、不创建数据库连接、不影响现有Sync V010 Run创建、执行、列表、恢复或Receipt。
- 打开后**还必须同时配置** `APP_PLATFORM_AGENT_RUN_ASYNC_DATABASE_URL` 和 `APP_PLATFORM_AGENT_RUN_ASYNC_SCHEMA`（安全的、已预备的schema名）。未准备好数据库结构则在开发Host启动时明确失败，**不自动CREATE/ALTER schema**。
- 只读取已存入V020 Run表的行，使用Host session已经授权解析的Principal和ActiveContext生成持久scope key；用V010 reducer完整恢复Run并对作用域做双重验证。旧V010库存在不同scope的Run时，拒绝而不切换到另一个authority猜测。
- 隔离PostgreSQL18专项检查OFF无连接、无效模式/参数失败、错误schema无DDL、读取授权Run、跨企业/伪造主体不可见以及Run事件表未被改动；实际ActionHandler＋PG测试继续保留。

## 不能夸大的范围

- `POSTGRES_READ_ONLY` 是可选开发运行模式，并不向V020写入新Run，也不启用PA-02B Worker WRITE或PA-02C取消按钮的正式链路。
- 现有V010 Run主权威保持不变，异步PostgreSQL是该请求的只读补充，不推断会自动镜像V010/JSONL进V020。
- 正式PA-02A/B/C仍需一致的异步Run/Receipt创建与分发、Worker多节点恢复、Owner真实WRITE核验、同源Run取消以及真实Host跨进程全流程。此PR不改TR/2D或业务Owner插件。
- 不采用截图甩包袱验收，后续以功能持续可用、故障恢复和真实端到端测试逐项收敛。

## 环境模式

```sh
APP_PLATFORM_AGENT_RUN_ASYNC_READ_MODE=OFF # 默认值，无数据库连接
# 必须在已有隔离PostgreSQL schema准备完毕、决定测试只读链路后才显式启用
APP_PLATFORM_AGENT_RUN_ASYNC_READ_MODE=POSTGRES_READ_ONLY
APP_PLATFORM_AGENT_RUN_ASYNC_DATABASE_URL=postgres://.../...
APP_PLATFORM_AGENT_RUN_ASYNC_SCHEMA=agent_pa02_dev
```

验收应以本PR最终head的GitHub Actions日志为准。禁止只凭代码或文档将PA-02标注为DONE。
