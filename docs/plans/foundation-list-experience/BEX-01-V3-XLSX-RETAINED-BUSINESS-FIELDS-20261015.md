# BEX-01 / CP-03 V3｜172行 XLSX 业务扩展字段真实入库隔离验收（2026-10-15）

**来源级别：** 全部是代码构造的 SYN/RET 合成 XLSX，不是客户 `往来账户2026_10_08_10_15_23.xlsx`，也没有用户真实 Job/Schema。只能签开发级隔离 Host 结果。

## 为什么增加这一项

先前已合并 #939、#940 证明 XLSX 22列/172行、三缺失主体身份在真正安装的 Host 中能够处理、独立预检和提交，但它**显式忽略了余下 19 列**，所以无法证明 Excel 中具有业务意义的其他值也能建成基础对象扩展字段并完整留存。这一局限曾在交接中如实标注；本轮只补证据，不重新实现已有批量流程。

## 本次追加的独立真实通路

- 继续复用 `tools/bex01/synthetic-v3-xlsx.mjs`，另造隔离且命名标识明确的 `RET-0001..0172` XLSX，独立于前一组 `SYN-0001..0172` 供应商，防止主键重复。
- **22列的明确处理口径**：3个核心来源字段映射 `code`/`displayName`/`subjectType`；“开户银行”复用之前已由真实 Host 创建的企业扩展字段的**实际 field ID**；17个 `企业属性1..17` 经已经实现的**集中批量审核**创建企业扩展定义且精确一对一映射；**仅1列“原系统备注”由 Human 明确忽略**。不猜两个真实银行目标的实际含义——本场景只有独立合成环境中已知的一项银行扩展。
- 真实 Host `data-import.stage-file` 上传第二个生成的 XLSX；`data-import.review` 明确选择核心映射、银行复用、17项新建提案、1项忽略；Chromium 进入 Eidos 原生集中审核表单，实测17个来源样本/17个候选的批量确认。
- 核查新建的17个企业字段在同一个真实 Job 的映射中逐项以**确定性 field ID**保存、银行的既有 field ID 复用、唯一元数据忽略仍可见。重新预检须拦住第165/169/172行空主体身份；由隔离环境中可控的 Human 模拟对3个合成空值逐项选择合法枚举；旧检验作废后再次预检，直到独立确认提交。
- 最后经 Host 供应商业务目录搜索 `Retained Supplier 0172`，打开**真实业务对象的企业扩展详情**，核对17项字段标签、首尾真实合成原值 `synthetic-4-0172`、`synthetic-20-0172`，以及被复用的银行来源 `测试银行-2`；这才能判断是**值真的进了业务对象**，而非单纯收到批量操作成功消息。
- **不改应用运行时**，继续保留 5/5 原供应商、#925 原列审计、#929 行修正撤销、#939 XLSX 172行修正/提交；仅加独立 Fixture + Chromium + CI。CI 失败必须在同一 PR 修正，不放宽权限或直接修改 Host 数据来伪造结果。

## 验收项目｜当前状态｜下一步

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| 22列/172行第二个独立 XLSX 真正 Host 暂存 | 最新 main 隔离 Host/Chromium PASS | 完整解析与原值比对 |
| 已有“开户银行”按 field ID 复用且不重复创建 | 最新 main 隔离 Host/Chromium PASS | 真实已存企业字段核对 |
| 17列集中创建并与原列精确映射 | 最新 main 隔离 Host/Chromium PASS | Eidos 原生批量表单与 Host 存储验证 |
| 只有历史备注被主动忽略 | 最新 main 隔离 Host/Chromium PASS | Job 中确认为唯一忽略项 |
| 3行必须人工更正才可提交 | 继承 #939 的通过证据，本次再覆盖 | Host 原校验器 |
| 172个对象/业务详情扩展值 | 最新 main 隔离 Host/Chromium PASS | 真实目录搜索、详情值验证 |
| 两个同名目标银行真实身份、客户 22列/172行 | **尚未取得** | 原客户 Schema + XLSX + 授权 Job + Human 决定 |
| Railway | **未部署** | 不擅自操作 |

## 已验证资产与未决条件

此前 #921/#925/#929/#933/#860/#939 已合并，本次不重复其实现；#878 历史混合文档 PR 和 #909 Draft 研究继续独立。原 Eidos 设计语言 #186 与 BEX V3 2026-10-15 阅读等级索引保持，不伪造新网络查阅。新证据入口：
- `tools/bex01/synthetic-v3-xlsx.mjs`：确定性第二份测试 XLSX
- `tools/bex01/isolated-host-fixture.mjs`：仅隔离设备准备第二份二进制
- `tests/protocol/bex01-v3-synthetic-xlsx.test.mjs`：两份 XLSX 344唯一主键/原值回归
- `tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py`：真正 Host 批量17项 + 既有银行复用 + 172行 + 业务详情
- `.github/workflows/bex01-real-browser.yml`：在旧验收成功后再运行新场景

**验收结论必须等最终 HEAD CI 实际 PASS 再填写。** 真正的客户 Excel 和两个实际业务上同名的“开户银行”都不能从合成 Fixture 反推，客户 Human 签收与生产授权持续 OPEN。

## 合并后正式证据（2026-10-15，覆盖上文“待 CI”原始计划）

- [PR #942](https://github.com/jiangxng/EVO-App-Platform/pull/942) **MERGED**，最新正式合并 `main@fad923897760e3c7f503a9e346951b38c523c50f`。原实现分支吸收并行 PA05 的 `main@8c59624ec3bf54df6ecb54094cc43014a0d60e52`，先核对 **6 文件无重叠**，再用最终分支 HEAD `2f1b3d7e5cfc419849bdf389814d15c4a23441ab` 做一轮完整认证。GitHub `mergeable_state=clean`，按主仓保护规则正常合并。
- **5/5 项 CI 全部 PASS**：[真实 Host/Chromium #38719027641](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38719027641)、[Platform #38719027649](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38719027649)、[Human UI #38719027577](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38719027577)、[Continuity #38719027561](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38719027561)、[Lightweight Host #38719027726](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38719027726)。
- **实际 Host 业务证据**：`BEX01_V3_XLSX_RETAINED_22_SOURCE_AND_BANK_REUSE_PASS`、`BEX01_V3_XLSX_RETAINED_17_FIELDS_CREATED_AND_MAPPED_PASS`、`BEX01_V3_XLSX_RETAINED_172_18_BUSINESS_FIELDS_PASS:ISOLATED_HOST`，均为真正安装 Host 与 Chromium 141 验收输出；原 `BEX01_BROWSER_SUMMARY` 5/5 及前次 172行 XLSX 修正/导入依旧 PASS。17项企业扩展字段、1个复用银行字段被实际映射保存；只有1个历史元数据字段显式忽略；创建业务对象后，抽查第172条供应商详情中的17项标签、两端样本值和银行数据均可见。
- **结论是 `ISOLATED_XLSX_BUSINESS_VALUES_DEV_CERTIFIED`，不是 `V3_COMPLETE` 或 `HUMAN_SIGNED_OFF`**。所谓两个同名银行仅在用户需求层仍属未决：本测试唯一银行字段是前一项隔离案例由测试人员创建的合成字段，不能替代客户两实际 target field ID 的用途/权限/引用调查。
- **下一步唯一不可替代业务门槛**：从客户受权的原始 XLSX + 实际企业 Schema + 原 Import Job（或受权重启上传）中核对真正22列、逐列判定应该复用/新建/忽略、确认两个同名银行字段用途及三条主体类型身份；用户 Human 真实点击验收以后才能独立决定生产执行。测试中的合成值、假设业务标签和身份选择不得迁移为真实企业决策。本轮未部署 Railway，未修改 Host/Agent/Eidos Runtime 和生产业务数据。
