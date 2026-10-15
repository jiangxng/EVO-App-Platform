# BEX-01 / CP-03 V3｜22列×172行真实 XLSX 通路隔离认证（2026-10-15）

**分类**：真实 Host/Chromium 开发回归；企业源文件完全合成。绝不可称为客户原件、真实授权 Import Job、实际业务身份、已部署或 Human 真正签收。

## 研究/实现继承与边界

- 基线：EVO `main@b4e3a8679722273228e801732221aaf34cc9ea15`，沿用本套 V3 交接、[研究索引（阅读等级）](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-UI-V3-SESSION-RESEARCH-INDEX-20261015.md) 和 Eidos 正式 Human 设计原则 #186。**本次没有新增互联网资料或声称阅读索引原文**。
- 原功能已合并：#921 未完成任务继续、#925 全来源列核对、#929 受控修正/撤销、#933 同名候选用途/批量样本、#860 原列字段创建与持久映射（最新合并 `c0b56de`）。不重做业务能力、不改 Service 权限/数据提交算法、Eidos 公共 UI、Host 生产配置。
- #878 仍是跨 Host 与治理文件的旧混合 PR，不与本隔离认证线合并；#909 Draft 属于研究及高保真原型，不视为已正式部署。

## 为什么增加这一门槛

原有真实 Host/Chromium 浏览器回归主要输入生成的 CSV；XLSX 解析有定向协议测试，22列来源核对/3行身份缺失/同名银行用途比较多为**合成 Job 协议模型**。需要一个**真正由 `data-import.stage-file` 经 Host 接收 XLSX 二进制**的高宽度、多行、源值不丢失测试，以验证从导入到实际业务效果的闭环。不借此伪造用户 Excel 或 schema 的证据。

## 有界验收规则

1. `tools/bex01/synthetic-v3-xlsx.mjs` 本地内存生成**唯一、明确标识为 synthetic** 的 XLSX：22 个唯一来源列（包括一个“开户银行”来源表头）、172 条 `SYN-0001…0172` 供应商测试记录、原始 `subjectType` 第165/169/172行显式空值。其余行合法 `ORGANIZATION`，这是合成样本设定，**不代表客户那三行实际身份**。不会生成第二个同名源表头——此前两“开户银行”是两个真实目标字段的身份待核对问题，不能混为一谈。
2. 通过**安装后的实际 Host** 上传该 XLSX，断言 `source.kind=XLSX`，22列、172行及三空值原样保留；只将3个明确核心字段一对一映射，其他19个来源列在测试中**显式**选择可撤销的忽略，不能自动丢弃，重新预检查必须得到169有效/3失败，且**不能提交**。
3. Chromium 390px touch：在真实导入核对页看到22个来源记录和末尾3个失败优先记录，无横向溢出；从失败行直接进入 Host 原值表单，人工选择合法枚举并保存第一行。不同桌面浏览器会话再打开**同一持久化 Job**，继续修正其余两行并再次预检查；两行未处理前不许出现正式提交。
4. 三行均实际更正并预检查通过后，必须独立点击“提交导入”；随后在供应商列表按 `Synthetic Supplier 0172` 搜索，得到真实创建的业务对象。断言源列仍22个，“原系统备注”仍是显式忽略，只有测试实例写入（临时资源在运行末清理）。
5. CI 应先对生成的二进制运行 parser round-trip 合同：源值全等、22列均在、172行、三空身份、确定性重建，且不含真实客户数据。现有 CSV 5/5、来源核对与修正 desktop/phone 回归继续执行，不能用新用例代替原旅程。

## 验收项目｜当前状态｜下一步

| 验收项目 | 当前状态 | 下一步 |
|---|---|---|
| XLSX 二进制解析/来源22列 × 172行 | 隔离 XLSX/真实 Host CI PASS | 真正 Host CI PASS 后签开发结果 |
| 三行空 `subjectType` 与无法提前提交 | 实际隔离 Host/Chromium PASS | 独立 Host dry-run 实际断言 |
| 手机更正＋桌面持久继续处理 | 浏览器实际隔离 Host/Chromium PASS | 实际 Chromium 141 验证 |
| 三行重新预检查 + 独立提交 + 供应商业务列表 | 实际隔离 Host/Chromium PASS | 检查真正提交及搜索 |
| 已确认 Recipe 与一对一映射、忽略可撤销 | 已有正式服务契约/专项测试 | 不扩大权限，不重做；客户 Job 原记录核验 |
| 两个客户同名银行实际 field ID/用途 | 未取得 | 由真实 schema、用户核验 |
| 用户原始 Excel、授权 Job、三条实际主体身份 | 未取得，**绝不宣称通过** | 原客户业务负责人确认后才可完成 Human |
| Railway | 本轮禁止部署 | 依独立授权 |

## 代码、证据和反馈

- 二进制生成器：`tools/bex01/synthetic-v3-xlsx.mjs`；协议：`tests/protocol/bex01-v3-synthetic-xlsx.test.mjs`。
- 真实隔离 Host 工厂：`tools/bex01/isolated-host-fixture.mjs`；Chromium 全链：`tests/bex01/v3_synthetic_xlsx_172_chromium.py`；CI：`.github/workflows/bex01-real-browser.yml`。
- 本次不改应用运行时任何 TypeScript 业务文件，仅扩充隔离 fixture 与 CI 检查。若测试发现真实缺陷，在**同一个 PR** 修改最小相关 owner 模块并回归，不绕过安全/轻量 Host。
- 结论更新规则：只有 GitHub 最后 HEAD 的工作流确实成功后，才将相关条目标成 PASS；CI 不等于真实客户 Human 签收/部署。用户 XLSX/授权 Job 仍未取得之前仅能签 **`ISOLATED_XLSX_HOST_DEV_CERTIFIED`**。

## 合并后权威证据（2026-10-15；覆盖上文“等待 CI”的历史状态）

- [PR #939](https://github.com/jiangxng/EVO-App-Platform/pull/939) **MERGED**，`main@a0efaad38a36f5b95fa76ac71ebecd2e3156bdb9`。先将并行 PA05 最新 `main@47314a1e9152ad28beef13bb6925077f160fb3b7` 无重叠并入原实现分支，再在最终 HEAD `1ecffc8effd202422ec036e3a91b1b9585ccb8e8` 进行完整复跑；GitHub merge gate `clean`，按保护规则正常合并。
- 最终 **5/5 项 CI PASS**：真实 XLSX/Host/Chromium [#38717275906](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38717275906)、[Platform #38717275905](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38717275905)、[Lightweight Host #38717275914](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38717275914)、[Human UI #38717275926](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38717275926)、[Continuity #38717275988](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38717275988)。
- 真实隔离 Host `stage-file` 接收内存生成的 XLSX 二进制，**22 列、172 行、169 有效、3 个缺失身份失败**；原始 22 列均保留，其余 19 列必须明确忽略，未推断供应商主体身份。Chromium 141 路径 `BEX01_V3_SYNTHETIC_XLSX_22_SOURCE_REVIEW_PASS:PHONE`，`BEX01_V3_SYNTHETIC_XLSX_PHONE_CORRECTION_PASS:165`，`BEX01_V3_SYNTHETIC_XLSX_172_IMPORT_PASS:ISOLATED_HOST` **均 PASS**；后两条缺失身份在桌面另一浏览器会话继续更正，再经独立预检查+明确提交，从企业供应商目录搜到合成第172条对象。
- 原隔离供应商旅程仍 **5/5 PASS**（`BEX01_BROWSER_SUMMARY`），全来源列核对与行级更正的 DESKTOP/PHONE Chromium 回归仍 PASS，未更改应用业务运行时或 Eidos。
- **当前签收等级：`ISOLATED_XLSX_HOST_DEV_CERTIFIED`**。该 XLSX 由 `tools/bex01/synthetic-v3-xlsx.mjs` 构造，只有**结构**有意使用 22/172/3：其列标题、供应商、银行、行号、身份值均为虚构测试数据；三个 `ORGANIZATION` 更正系测试者在合成数据中显式选择，不是对用户三条原始记录的业务认定。真实客户文件仍未取得；两个“开户银行”的实际 target field ID、用途与引用仍未核；用户 Human/真机、真实授权 Job、生产提交均未验收。
- 非生产，未发布 Railway；#878 旧混合 PR 与 #909 Draft 不因本结果自动合并。后续必须在受权原文件与真实 Schema 上重复业务核对和签收，不得复用合成 enum 结果。
