# 东京验证环境企业创建授权缺口（2026-10-28）

## 本轮证据与根因

- 用户一手截图（U，当前会话）：创建企业时页面报 `Enterprise Context creation denied by 'host.static-authorization': STATIC_POLICY_NO_MATCH`。**表明静态授权 Provider 确实存在并返回“无匹配规则”**，不是企业名称或企业代码校验失败。
- **P1 已读源码**：[manager/enterprise-context-creation.ts](../../manager/enterprise-context-creation.ts) 创建时要求 HUMAN Principal、Personal Context、用户明确确认，然后调用 `authorizeMaterialWriteV010`；拒绝后不写任何 Enterprise Context 数据。
- **P1 已读**：[providers/authorization/runtime.ts](../../providers/authorization/runtime.ts) 无匹配规则时明确返回 `STATIC_POLICY_NO_MATCH`，显式 DENY 高于 ALLOW。
- **P1 已读**：[manager/enterprise-context-authorization.ts](../../manager/enterprise-context-authorization.ts) 内建治理策略只允许 HUMAN archive，**没有授予 create**，这是符合默认拒绝的产品边界；不宜在通用产品代码里加“全部 HUMAN 默认可以建企业”。
- **P1 已读**：[manager/server.ts](../../manager/server.ts) 将内部策略和 `APP_PLATFORM_AUTHORIZATION_POLICY_OVERLAY_JSON` 合并，在 `APP_PLATFORM_MANAGED_SESSION_ENABLED=false` 且没有其它身份绑定的情况下，当前兼容身份 `demo-user` / `host.compatibility-local` 生效；[东京 Compose](../../deploy/tencent-tokyo/compose.yaml) 原先没有提供任何企业创建授权 overlay。现场截图出现 demo-user 与该源码吻合，**但未直接读取 VPS 运行时 env，需部署时验证**。
- **P1 已读**：[actions/material-write-authorization.ts](../../actions/material-write-authorization.ts)：每次授权使用实际 Principal 与其 User Scope，不能靠页面隐藏/绕过权限。
- 无新增外部网络研究；仅核对仓库原文（2026-10-28），不将历史参考 URL 冒充重读。

## 决定（仅东京预览）

- 在东京 Compose 中添加精确、环境专有的静态策略覆盖：`enterprise.context.create`，`subjectIds=[demo-user]`，`actorTypes=[HUMAN]`，`resourceTypes=[enterprise.context]`，`scope.userId=demo-user`；**没有通配符**。规则只存在东京部署文件，不修改全局治理策略和 Railway。
- 此处 Caddy Basic Auth 只是共享的预览入口保护，不等于真正的按人身份登录。**所有知道预览密码的人都会共享 demo-user 身份与新建企业的能力；验证环境不得存放真实客户数据。** 上线正式身份认证前必须移除此规则并为真实用户设置授权，绝不可复制到生产。
- 不补造已创建的企业数据，不动 PostgreSQL、`evo-data`、现有企业上下文、插件安装状态或 SSH。
- 用户不应再看到原始 `STATIC_POLICY_NO_MATCH`；本 PR 首先修复已确认的预览权限配置缺口。更一般的“权限就绪预检/友好错误”应作为单独平台体验门禁，不能靠本次 1 条规则声明所有插件权限齐全。

## 自动化验收

- [tests/protocol/enterprise-context-creation.test.mjs](../../tests/protocol/enterprise-context-creation.test.mjs) 从真实东京 Compose 中读取策略，验证仅正确 Preview Principal 的 Enterprise Context 创建授权放行，其它 Principal、AI actor、Archive 和管理员操作被拒绝，明确 DENY 依然覆盖 ALLOW。
- 同一测试以 Personal Context、人类确认和真实创建 Handler 验证新建企业、OWNER 关系与 Grant 写入成功，避免只用静态字符串检查宣称修复。
- CI 通过后仍需独立受控发布（**仅 main，不直接 push main**），校验真实当前 Principal/策略、创建企业、重新加载后顶部企业选择器、持久化和数据隔离；Human 验收独立。
- **PR 阶段不可宣称线上已修好**。本次不主动触发未经独立批准的生产数据迁移、Railway 更新或通用角色规则放开。
