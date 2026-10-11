# B9d｜真实 App 投影 CAS 与文件型 Store 重开、Viewer 读取、过期写入拦截

日期：2026-10-11。独立 [Draft #615](https://github.com/jiangxng/EVO-App-Platform/pull/615) 叠加 [B9c #614](https://github.com/jiangxng/EVO-App-Platform/pull/614)。本轮只新增 Node 集成测试和其单独 CI、专项文档，**没有改变 Eidos/Platform 运行时、Host/Agent 授权、投影 CAS 契约、关系业务端点、22/2600 路由预算、TR-01 主线**，不合并、不部署。

## 研究与已测范围的差异

- B9a：受控内存 ActionHost + 真 Firefox/WebKit 证明未保存草稿不会跨刷新和重开。
- B9b：真 Chrome App 授权 Handler + **内存 Projection Store** CAS Save → 新 Designer → 只读 Viewer，验证无拥塞无误报（0→0→0）。
- B9c：真 Chrome App Source 受控五自环非零拥塞 → 只读 Viewer，验证正数 1 与可访问提示一致；明确**没有 CAS 保存该正例**。
- **B9d：升级持久性等级**——App 正式 Handler 授权与 CAS Save，通过正式 **FileDefinitionProjectionStore** 写磁盘文件；然后创建**全新文件 Store 和 App Handler**，从文件重新读取编辑状态与正式只读 Viewer 的关系端点、隐藏状态、正交路径和控制点。不使用之前 handler 引用的内存 Store。

## 验收用的真实实现边界

在 CI 独立临时文件目录构建一个有真实 EOG 账本基础图的业务定义，使用正式 App 层 API，不改业务定义 payload。读取实际已校验投影编辑状态，在可见非关联业务节点上应用投影隐藏，在另一条关系上保存路径类型 rounded-orthogonal、sourceAnchor right、targetAnchor left 及显式两个 world waypoint。通过平台授权接口和投影 CAS 从 writeToken 0 保存到 1，随后：

1. 完全新建 FileProjectionStore，断言 CAS token 仍为 1。
2. 经过正式 Editor GET handler 重新读取 hiddenNodeIds、路径、端点；验证 Eidos editor 状态契约。
3. 经过正式 Enterprise Definition **只读 Viewer GET handler**，验证实际保存的显示层、隐藏节点、路径、端点，不产生任何持久写。
4. 用旧 writeToken 0 再尝试 Save，必须失败，不能覆盖新存储；第三次创建 Store 仍为 1。
5. 企业业务定义历史始终只有原来的一个 revision，不能因为投影保存增加版本。
6. 测试结束清理临时文件，无任何生产环境或真实用户数据库更改。

**重要：** FileProjectionStore 是生产代码中的持久层实现，但这次仍是本地 CI 文件路径及临时业务 Definition **内存 Repository**，并非客户数据库、真实多进程部署或云数据库 restart。既有 B9c 非零拥塞正例也不是 CAS Store 保存结果。本轮不会冒充完整商用验收。

## 实际证据与后续

- 新测试：tests/integration/definition-projection-b9d-file-restart.test.mjs。
- 工作流：.github/workflows/diagram-designer-integration.yml，在原集成测试中**增加**新文件。
- 严格以 [PR #615 checks](https://github.com/jiangxng/EVO-App-Platform/pull/615) 最新 head CI 为准；任何失败需保留修复原因并重跑。
- 原 §14 **39 项正式商业化验收仍 NOT TESTED**，真实企业数据/跨进程与实体设备待后续。
