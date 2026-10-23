# PA-04 C01–C06 整体收敛与签收前证据台账

**基线**：2026-10-15，PA-04 第八个 PR [#900](https://github.com/jiangxng/EVO-App-Platform/pull/900) 合并后的 `main@3c36766a1cabca9b40b468b60dff2f7a9233ca8e`；合并前须重验最新 `main`。  
**当前结论**：六项有针对性的隔离工程保护与测试，但 **六项均非完整产品/上线验收**。保持 `PA-04 IN_PROGRESS / NOT_SIGNED`，不将 PR 数量当作验收百分比。
**机器台账**：[PA04-C01-C06-READINESS-LEDGER.json](./PA04-C01-C06-READINESS-LEDGER.json)，测试校验 `tests/protocol/pa04-convergence-readiness.test.mjs`。  
**统一证据**：`.github/workflows/agent-pa04-c01-c06-consolidated.yml` 同时执行 C01–C06 九组原有测试与一组签收防误报测试，在隔离 PostgreSQL18 运行，主动检查 PG 真实证据标记，不能靠自动 skip 假通过。

## C01–C06 核对结果

| 原验收 | 已在 main 的工程证据 | 尚不能签收的具体条件 | 责任 / 环境 |
| --- | --- | --- | --- |
| **C01** 总预算和保留约束 | #891 完整请求/输出 Token 上界拒绝，#892 非关键旧历史受控缩减与源保留 | 精确本地/云模型 tokenizer、聊天模板和 context window 认证；历史中关键未结构化决定的 Working State 提升和真实长会话验收 | Agent + Provider；本地模型/受控演示 |
| **C02** 来源失效传播 | #889 摘要源指纹，#893 内存/PG 来源撤销 tombstone 与派生摘要/检查点跨版本清理 | 来源原文合法删改入口；Run、Memory、EC 搜索/缓存、附件、备份恢复的传播与留存政策 | Platform Data/Retention + EC；跨系统 |
| **C03** 旧 READ 恢复 | #895 Host 当前目录、版本核验、重新 READ、事件留存与拒绝旧结果 | 实际业务插件的来源资源版本/授权证明与真实恢复试点 | Business Tool Owner + Platform；受控真实插件 |
| **C04** 记忆纠正 | #898 复用 Memory Proposal，Human-only 审核下沉服务、supersession 与审计 | 真实用户工作台纠错完整交互、企业事实 Owner 真相验证、持续授权 | Agent UX + EC Owner；受控 Human |
| **C05** 注入/外发 | #900 不可信 READ 文档标签、Host 二次工具目标审查、外发拒绝/重启不重放 | 正式 Host 工具/网络出口 allowlist、SSRF/重定向/插件各通道覆盖与恶意文件端到端对抗 | Security + Tool/Network；预生产安全 |
| **C06** 失权引用 | #897 Memory 搜索/回忆/清单/审计源引用披露门禁 | 真实资源授权 Port、历史 Run/回答/检索索引及真实附件下载瞬时二次鉴权 | Platform Authorization + Artifact Owner；预生产 |

### 统一判定方法

1. **工程证明**：准确 PR 最终提交上的 CI 全绿，九组测试在相同隔离 PostgreSQL18 条件下回归通过，保留可核实日志。此级别只验证代码边界，不构成生产已启用声明。
2. **功能接入**：实际 Host/Owner 注入有效的 Provider Token 凭证、来源失效、READ 版本、Memory/文档授权、工具调用及 egress 约束；测试不可再以 mock 代替真实授权或网络控制。这六类是不同的责任，不能用“可选 Port 存在”来替代。
3. **用户与环境验收**：用真实长会话、企业上下文切换、过期和失权对象、真实文档、真实附件打开/复制下载、真实 Human 纠错和故障恢复取证。每个 C gate 须有授权验收人、环境、源版本和可复核证据，才可单独 SIGNED。
4. **独立发布门禁**：PA-02 R10 真实货币验收 [#879](https://github.com/jiangxng/EVO-App-Platform/issues/879) 继续 OPEN，**不能**因 PA-04 工程测试通过而关闭；第一次上线拟采用的本地开源模型尚未确认和认证。PA-04 的签收、PA-02 费用门禁、生产发布许可三者独立判断。

### 本轮补齐

- 以前的八个 PR 各自有专项测试，但**缺少一次贯穿 C01–C06、同环境回归、检查 PG 确实运行的统一测试**。新增组合 CI 汇总现有能力，沿用原测试、不造第二套实现。
- 新增机器可读的每门禁已验证文件、原 PR、缺失来源、责任归属、环境范围与是否正式签收；协议测试拒绝凭空删减 C 项、以隔离测试冒充业务签收、没有 Human/证据的假签名。
- 该 CI **不会模拟生产 Provider、开启业务 WRITE 或访问生产数据库**。CI 无条件全绿也仍意味着 `ISOLATED_PROVEN`，不是 `SIGNED`。

### 后续最小闭环排序

**PA-04 工程线当前可独立执行的内容**已经集中为重复回归和可交接门禁；继续实现受阻于外部接口/上线环境时，不应凭空制造模拟签收。跨团队依赖按上述 Gate Owner 交付，真实接入后逐项重签。

Owner 已决定推进顺序仍为 **PA-04 → PA-05 → PA-06 → 最后与 BEX/CP-03 合流核对 PA-03**。统一工程证据落库且 CI 成功后，可开始 **PA-05 插件标准认证的研究/准备**，但不声称 PA-04 已完整签收，且不得用 PA-05 规避 PA-04 的外部待验项。不修改对象导入 PR，`manager/server.ts`、`project.status.json` 或线上部署。
