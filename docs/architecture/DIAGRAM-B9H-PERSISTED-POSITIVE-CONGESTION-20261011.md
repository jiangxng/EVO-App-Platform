# B9h｜合法业务定义的非零拥塞真实 CAS 保存 → 文件重开 → Editor / 只读 Viewer

日期：2026-10-11。独立 [Draft #620](https://github.com/jiangxng/EVO-App-Platform/pull/620)，堆叠 B9g #619。**这是专门关闭 B9b/B9c 留下的“正数拥塞并未真实保存”机器证据缺口。** 本轮只增加合法业务 fixture 的 App 集成测试、CI、文档，不修改 Eidos 寻路预算、平台业务端点、Host/Agent 授权、投影 CAS 契约、TR-01、main，不合并不部署。

## 与历史证据的关键区别

- B9b：真 Chrome App Handler CAS Save → 新 Designer → Viewer，测试图的拥塞 **0/0/0**。
- B9c：真 Chrome App Source 自环合成正例 Viewer **1/1**，但由 test-only Source 包装层在 GET 时注入，**没有保存**该正例。
- B9d–B9g：正式 FileProjectionStore、跨进程独立 Handler 的并发/授权拒绝保护，数据视图尚未包含持久化正数拥塞样本。
- **B9h**：使用平台**已支持**的业务定义 payload.preview2d 契约（不是 GET Source 包装层），正式 App Editor SAVE_PROJECTION_VIEW Handler 授权 CAS 保存一条 orthogonal 真实业务关系。业务图包含两个端点与 **23 个实际相关障碍**，路由器的原安全预算为 22，必须报告 genuine congested。通过 FileDefinitionProjectionStore 将路径演进写入**实际测试文件**，独立重建 Store、Editor GET 与 Viewer GET 后都仍能用正式 Eidos geometry 算出拥塞。
- 第二次真实 CAS 保存隐藏第 23 个相关障碍，重新打开 Store 和 readonly Viewer，确认可见障碍减少到 **22**、自动路由能够成功、拥塞消失。文件 CAS token **0→1→2**，原业务基础定义历史仍 1，关系 source/target 未变。

## 新增的自动化检查

1. 原始业务图来自 CreateDraft 声明式 preview2d：合法 25 节点、1 关系；未显式设置 pathKind 时仍遵循旧 straight。
2. 通过正式 Editor GET/SAVE、允许授权钩子，CAS 保存 orthogonal 展示方式；**没有给业务关系增加新版本**。
3. 全新 App Handler / 文件 Store 读取，Eidos 真实 `diagramEdgeGeometryV010` + 23 个障碍返回 `congested=true`，状态通过 Editor schema。
4. 独立 Enterprise Definition Viewer GET 再算相同 `congested=true`；Viewer 读取不写文件。
5. 下一 CAS 提交显式隐藏第 23 个相关障碍，文件 Store 第三次重建后 Viewer 几何恢复安全路线（22 障碍、无 `congested`）。
6. Node 自动测试执行所有规则和实际文件读写，在临时目录完成并清理，没有生产 DB 写入。

**首次证据**：[Diagram Designer Integration #38068777299](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38068777299) **PASS，133/133**，B9h 新样例通过；最新 PR 文档提交后还需要重新验证同 HEAD Checks。

## 证据等级与诚实限制

- B9h 解决了“**正数拥塞确实通过 CAS 保存在正式 File Store，并可由新的 Editor/Viewer 读取**”的机器子场景，但本轮验证在 Node 进程里调用正式 App GET/Viewer Handler 和 Eidos 几何函数，**还没有把这个特定保存的正数图用真实 Chrome 浏览器 DOM 挂载**。
- 文件是 CI 临时文件，企业基础定义仓与授权钩子是受控 fixture；仍不是生产数据库、真实用户登录、实际企业客户 S2C/P2P 图、物理设备或商业人工验收。
- 下一小步必须补**相同真实 CAS 正数保存图的 Chrome Designer/Viewer SVG/拥塞摘要**，不能把 B9c GET overlay 的浏览器结果嫁接到 B9h 持久化图。原 §14 **39 项正式商业验收仍 NOT TESTED**。
