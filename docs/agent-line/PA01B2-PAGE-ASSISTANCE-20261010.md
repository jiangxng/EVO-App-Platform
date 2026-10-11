# PA-01B2 页面协助接入与草稿保护

## 独立开发线

本分支叠加 PA-01B1 #577（其依赖 PA-01A #575）。仅 Draft，不合并、不部署，不修改业务主线、2D 线或 manager/server.ts。

通用 helper 来源于 Eidos Agent 分支 PR https://github.com/jiangxng/eidos/pull/142 ，首轮源提交 f35034b045c2f084216e157bef3dc8b32c5d7113。平台既有 vendor Host 包含上游目前没有的 contextual transport，本次只同步新增 helper、导出和两条文案，并在既有页面控制器、thread transport 与 workbench shell 最小接线；不做整体 vendor 替换。后续 helper 修订需两端同步。

## 行为约定

1. 页面 AI 动作生成独立 UUID requestId，经现有侧栏发送版本化 assistanceRequest；与线程发送客户端编号一致。普通聊天保持原入口。
2. 页面协助存在时不同时发送旧 interactionContext；禁止静默降级丢失任务上下文。服务端继续验证请求及权限；前端不声明身份。
3. 保留并返回最终 ActionExecutionResult，刷新判断关联 requestId、taskKind、pageId/route/actionId、runId、协议版本与两处 Run 成功状态。
4. 只刷新同一来源页面挂载实例；离开后回到相同路径、失败、暂停、取消、无结构化结果都不刷新。
5. 自页面挂载开始跟踪 input/textarea/select 变化，事件与值快照双重判断。Agent 返回期间或之前的未保存修改均保留，中英文状态提示结果已就绪。改回原值仍保守视为脏。
6. Run 成功只允许重新读取干净页面，不等于业务写入成功；真实写入仍需业务 Action、授权、校验和凭证。
7. 页面按钮请求期间禁用；异常显示已有状态栏，finally 恢复按钮。

## 兼容与限制

须与 PA-01B1 后端契约共同发布，不能只更新 UI。旧结果不自动刷新。此阶段不处理跨页面自动跳转、不实现正式 Run cancel、不迁移 Run 存储。自定义富文本/画布编辑器尚需显式 dirty 接口；当前保护范围是原生 UIDL 表单。等待期间人工保存后若未重新挂载，仍可能保守不刷新。

## 验证与下步

本地对实际 transport/helper 转译后运行 Node 测试，23/23 通过：原有 8 项、helper 14 项、版本化 thread transport 1 项。测试包括关联不匹配、各非成功终态、页面实例切换、草稿事件/值快照和监听器释放。它们不是完整 TypeScript 编译或真实浏览器验收。

CI 执行完整构建与 P1.7C 回归，最终精确提交与结果写入 docs/agent-line/HANDOFF.md。真实浏览器待验：干净来源页成功刷新；已有/等待中修改保留；离开后重开相同路径不刷新；失败不刷新；普通聊天和导入字段匹配回归。上述门禁完成前不标记产品闭环验收完成。
