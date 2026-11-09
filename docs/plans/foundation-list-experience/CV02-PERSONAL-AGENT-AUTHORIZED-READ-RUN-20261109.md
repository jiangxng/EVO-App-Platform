# CV-02 个人代理与 Human 共用集合 READ：真实 Host 工具链回归（2026-11-09）

**当前状态：工程测试提交；CI 尚需准确 HEAD 核验。** 这是**无外部 LLM 的确定性真实 Host/领域插件集成测试**，不能冒充“真实 AI 对话/真实企业 Human 签收”。实施基线 `EVO-App-Platform main@04879502106226599f6e8ce0eb158632315e70c5`，受管 Query/真实 Eidos 页和 Return 均已在 Platform #1169 / #1170 进入 main。

## 真实使用了什么（和什么没用）

- **真正的内部 Personal Agent Gateway：** `createPersonalAgentCapabilityToolRegistrationsV010` 提供的 `evo.capabilities.search`、`describe`、`invoke.read-plan`，而不是直接单测 owner 函数当作 Agent 成功。
- **真正的 Host 治理：** `createAppManagerService`、真实 `businessDictionaryPackage` / `counterpartyPackage` Capability metadata、`createCapabilityOperationActionPreExecuteV010`、`createAppActionRouter`，真实 Authorization Provider 策略，每次发现/调用均复核授权与 Feature 激活。
- **真正的领域数据：** 内存 Enterprise Resource Repository 上真实 BusinessDictionary Repository / draft / publish 与 Counterparty / Role / Responsibility Repository、`createCounterpartyProjectionServiceV010`。测试还放置另一企业的字典及非本人负责的供应商，验证数据不会泄漏。
- **唯一模拟部分：** 最小依赖能力 Package metadata 用于在隔离测试中满足安装依赖；企业 Principal 与策略为固定测试夹具；没有对接东京站、真实登录 Session、外部模型、网络或截图。这些未测项仍然 OPEN。

## 本轮可验收任务

1. 真实 Personal Agent 搜索并描述当前有权 `dictionary.collection.query`，确认 `view=all|draft|published` 的 Schema 与 READ 权限；使用相同 `view=published` 调用现有真实 Business Dictionary handler，并与 Human ActionRouter 结果逐行比对。
2. 真正 Personal Agent `invoke.read-plan` 调用 `counterparty.collection.my-suppliers.query`，由真实角色/责任投影过滤，只返回当前人负责的供应商、可读字段、受限页码；和 Human ActionRouter 返回完全一致。
3. 另一企业 Context 无字典 READ 授权时，Agent 无法发现/调用；停用字典 Feature 后，相同 Agent 注册上下文也立即无法再发现/执行；未知 view 拒绝，不能从当前模型请求任意 SQL。

**测试路径：** `tests/integration/cv02-personal-agent-authorized-collection.test.mjs`。建议 `npm run build && node --test tests/integration/cv02-personal-agent-authorized-collection.test.mjs`，最终以 GitHub Actions 精确 HEAD 的结果为准。

## 仍待真正用户验收

- 登录的真实 Personal Agent LLM 能从自然语言“列出我负责的香港供应商”“只看已发布的字典”自行选择正确业务 Operation、生成 JSON、解释 countKind，出现歧义时先确认；实际 Run/工具结果不经模型伪造。
- 两个企业/三种角色跨权与安全、换模型/停用后实际恢复、desktop/390px/键盘/焦点、真实 Browser 前后端相同数据。
- Saved Views 的真正 WRITE/幂等/回执是 CV-03，不要把 read-only 查询或 Eidos 视图导航称为“Agent 已保存我的视图”。

**验收等级：** 只有最终 CI 成功后才标 `HOST_AGENT_READ_TEST_PASS`；真实用户与自然语言流程仍记 `NOT_TESTED`，CV-02 不晋升 `HUMAN_PASS`。
