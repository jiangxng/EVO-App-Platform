# CV-00 现场对账：Eidos / Platform 既有集合能力与 CV-01 最小实现（2026-11-06）

> **文档性质：IMPLEMENTATION_EVIDENCE / 代码定位与本 PR 的具体决策。** 本文基于 Platform main `d4bebbba88213333b18a516ca21453dd6aa81107`（2026-11-06）、Eidos main `a6dc71a3390b5c22c4b4c91581866f8aa540b038`；未在浏览器/生产环境对新集合视图进行签收。新的 [八步计划](COLLECTION-VIEW-AI-NATIVE-NEAR-TERM-PLAN-20261106.md) 保持唯一近期执行入口；[架构决策](../../architecture/COLLECTION-VIEW-EIDOS-PLATFORM-ADOPTION-20261106.md)仍是分层约束。

## 1. 重复开发核查：现有事实

| 资产 | 读取原文与已知行为 | 结论 |
| --- | --- | --- |
| [Eidos Catalog Browser](https://github.com/jiangxng/eidos/blob/a6dc71a3390b5c22c4b4c91581866f8aa540b038/src/catalog-browser/contracts.ts) / [renderer](https://github.com/jiangxng/eidos/blob/a6dc71a3390b5c22c4b4c91581866f8aa540b038/src/catalog-browser/render.ts) | 已有 table 的 columns/rows、server search/sortRoute/pageInfo、list/card 呈现；不是远程查询 owner | **不新建 List UI 组件。** CV-02 将基于 Eidos owner 仓库演进过滤器/多视图体验 |
| [Eidos Data Grid](https://github.com/jiangxng/eidos/blob/a6dc71a3390b5c22c4b4c91581866f8aa540b038/src/data-grid/model.ts) | 本地 array filter/sort/page/selection；没有权限边界和生产远程数据源 | 只能作有界 UI/本地状态帮助，不能直接当真实全集查询 |
| [Counterparty 查询](../../../apps/counterparty/projection-query.ts) / [READ 贡献](../../../apps/counterparty/capability-manifest.ts) | 现成允许的 search/sort/page/pageSize；我的客户/供应商由领域 Projection Service 与授权决定；PERSONAL_AGENT 已在公开 READ exposure | **不重建 Counterparty 读取/权限/Agent 操作。** CV-01 后续仅把现有 READ 结果以公共 Collection Result 适配 |
| [Dictionary 列表](../../../apps/business-dictionary/actions.ts) / [清单](../../../catalog/seed.ts) | `dictionary.list` READ 和 `dictionary.resolve.batch`、受控 draft/publish 已存在且经过 Enterprise context/membership 判定；`dictionary.list` 既有输出是原始 snapshot/list | **不能改旧 list 响应**，避免旧 Agent/调用者中断。新增独立、窄化数据暴露的 `dictionary.collection.query` READ |
| [Dictionary owner](../../../apps/business-dictionary/repository.ts) | 企业资源 `current/history`、Human publish、稳定 dictionaryId/displayName/version/state/options | Collection 返回 directory 只读行和 optionCount，不暴露 options/aliases 或重建字典存储 |
| [现有 Data Import](../../../apps/data-import/) | 任务、文件映射、Recipe、preflight、commit/receipt；独立 Feature | 本轮不修改导入；后续仅由已有 ImportTarget 提供合法入口 |
| [Agent Capability Fabric](../../architecture/AGENT-CAPABILITY-FABRIC-v0.1.md) / [Personal Agent WRITE 规则](../../architecture/AGENT-ACTION-RECEIPT-P1.5B-v0.1.md) | 公共 READ/PLAN 可从已授权 Operation 搜索、描述和调用；独立的治理 WRITE/receipt 已存在 | 新的字典 READ 通过原 `platform.capability-operation` 暴露；**不创建第二 Agent/SQL 网关** |

## 2. 本 PR 的技术范围（CV-00 review + CV-01 第一业务纵切）

1. `contracts/data-collection/query.ts`：声明最小受控 query、rows、schemaRef、page/countKind；**没有数据库、通用 CRUD/SQL、权限绕过或者 Eidos renderer**。
2. `foundation/collection-query/index.ts`：纯无副作用小集合 query parser + 已授权行筛选/稳定排序/分页；所有过滤/排序字段必须是 owner 白名单。大集合或远程读取仍由领域索引/服务端执行，**禁止把全量企业记录读入 Host Core 再分页**。
3. `apps/business-dictionary/collection-query.ts`：Dictionary owner 的小集合 READ adapter，仅当前企业成员可调用；输出 `dictionaryId/displayName/state/version/optionCount`，不输出 options/aliases/私有 contextId。
4. `catalog/seed.ts` 的 metadata-only `dictionary.collection.query` Operation：READ/ENTERPRISE、`dictionary.read` 授权、HUMAN/PERSONAL_AGENT 暴露，通过既有 ACTION_HOST；`manager/server.ts` 仅注册原 lazy handler 机制，不静态加载业务运行时。
5. `tests/protocol/data-collection-query.test.mjs` 与 Dictionary 集成测试：不合法字段/排序/分页拒绝、稳定分页、旧列表兼容、权限拒绝、停用失败、Agent-visible Operation 元数据。测试通过与否以本 PR **最终提交的 CI** 为准。

## 3. 必须承认的缺口 / CV-01 后续门槛

- **只完成 Dictionary 第一真实 owner 的标准结果 READ；Counterparty 的已有 READ 查询还返回旧 `counterparties/pageInfo` 形状。** 下一最小步骤要做兼容投影适配并用同一 Collection 契约跑**两个不同 owner**的有权端到端读；此前不得标 CV-01 完成。
- Dictionary 目前只适合内存式小目录过滤；大结果集/多条件/索引/游标/精确权限字段策略未通过 10k 级真实数据证明。不能把示意 query 伪装成无限扩展后端。
- Agent 能在有效授权下**发现**新 READ operation 是声明层可证；完整 Personal Agent 的实际搜索→invoke→结果与真实 User/UI 对账仍需专门执行录屏与回执证据。READ 没有写回执也不表示已执行保存视图。
- Eidos 的通用过滤 UI/多视图/保存个人视图/看板/图表均尚未开发；Eidos owner PR 尚未创建。此批 Platform 不动 `vendor/eidos`，避免并行框架。
- `schemaRef` / `collectionId` 的跨领域稳定性、非 Foundation Object schema 兼容规则、个人/共享视图的资源权限与存储 owner，还需要 CV-00 owner/跨仓库评审。**本 PR 只给实验性的第一条合法读协议，不宣称 Plugin Protocol 新版本稳定。**

## 4. 兼容、回滚和验收判定

- 旧 `dictionary.list`、发布/解析/导入、Eidos 页面与原路由完全保持；删除新 `dictionary.collection.query` Operation + lazy handler +纯新增代码即可回滚。
- 现有 Package 生命周期、Enterprise Context 和 ActionHost 继续拥有权限；无 Agent/模型或关闭字典插件时，既有业务仍按原逻辑运行。
- 机器验收：`npm run build`、`node --test tests/protocol/data-collection-query.test.mjs tests/integration/business-dictionary-plugin.test.mjs`、Platform CI 和 Lightweight Host 全绿；Human/实际 Agent/真实部署分开标记，不自动判 PASS。
- **阶段口径**：CV-00 为“已形成代码级重复开发对账、部分 owner 决策仍待独立复核”；CV-01 为“第一插件可测试纵切，第二插件与真实 Agent/浏览器尚待”，而非 CV-00/CV-01 已全部签收。

## 5. 下一窗口最小接续

从当前 PR 的准确 head 及最新 main、Eidos main 重新核对：先修 CI -> 确认 Dictionary READ 与 Legacy 并存 -> 再增加 Counterparty **兼容投影**作为第二 owner -> 复查 Agent 授权调用路径和权限负例 -> 才关闭 CV-01 的机器门禁；随后由 Eidos owner 开 CV-02 公用表格/过滤器 PR。研发应在实际测试与真实 Host 里按账号/企业权限执行，不从代码存在推断 Human 签收。
