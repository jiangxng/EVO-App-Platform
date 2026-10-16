# BEX-01 E4-01｜V3 原型与真实 Host /map 截图：第一轮证据对照（2026-10-16）

> **结论范围：** 本页复核**两份真实 GitHub Actions 浏览器截图资产**与相应测试结果：一份是 V3 **离线合成原型**，另一份来自 Platform #966 HEAD 的 **隔离真实 Host/Eidos Chromium**。它**不是**当前 Railway 登录后的用户作业截图，也**不是**用户的 V3 Human 视觉签收。本轮仅恢复/比较证据，不动 Platform/Eidos 代码及 Railway。
>
> 上游正式 [E4 恢复交接](BEX-01-E4-V3-RECOVERY-AND-EVIDENCE-20261016.md)；原型仍在未合并 [Draft #909](https://github.com/jiangxng/EVO-App-Platform/pull/909) 中，绝不能把模拟的 172/22 作为实际客户数据。

## 1. 两份证据（直接取回原始 Actions ZIP 并查看 PNG、report.json）

| 证据 | GitHub 稳定索引 | 内容与可以证明的界线 |
| --- | --- | --- |
| V3 高保真原型，2026-10-15 | [run #38684546184](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38684546184) / [artifact #11948839518](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38684546184/artifacts/11948839518)；原型 [HTML 源](https://github.com/jiangxng/EVO-App-Platform/blob/docs/bex01-v2-human-design-review-20261015/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html) | ZIP 内 `artifacts/bex-v3-import-browser/01-desktop-overview.png` (1280×1668)、`10-mobile-overview.png`、`report.json`；15/15 原型检查 PASS。数据为合成场景，不是 Host/企业导入 |
| E3 真正接入的隔离 Host 浏览器，2026-10-16 | Platform [#966](https://github.com/jiangxng/EVO-App-Platform/pull/966) HEAD [run #38842754856](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38842754856) / [artifact #12022135417](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38842754856/artifacts/12022135417) | ZIP 内 `v3-e2-actual-map-22-rows-desktop.png` (1280×900)、`v3-e2-actual-map-22-rows-phone.png`、`v3-correction-desktop.png`、`v3-correction-phone.png`、`report.json`。报告自述 5/5 场景通过、`actualHost:true`，但使用**一次性隔离数据**；真实表格截图**定位在表格中段、不是从页顶到页底的全页截图** |

### 直接可见的页面差异和当前限制

| 项目 | V3 原型截图可见 | 隔离 Host 截图可见 | E4 判断（不是用户签收） |
| --- | --- | --- | --- |
| 容器/导航 | 作为独立设计页展示，约 1120px 内容宽度，顶部导航和面包屑 | Eidos 应用左侧导航约占 400px，1280px 下工作区约 810px | **结构不同但不能直接认定错误**：实际应用须保留合法共享导航；需要核真实用户任务空间、宽度、滚动成本 |
| 来源文件和步骤 | 标题“核对导入数据”、文件摘要（合成 172 条/22 列）、双阶段短步骤 | 受限截图停在四列表格；E3 #966 的**代码/审查**表明有文件上下文、三步进度 | **代码存在，视觉未证实**；需重新取得真实 /map 顶部完整画面，不得说“没有卡片” |
| 四类统计 | 明确 16/4/0/3 四张简约摘要卡 | 截图不包含当前页面顶部；#966 说明按 Host Job 四状态生成 | **逻辑接入已证明，视觉比例待对照**。不同数据来源不能按合成数字逐位比大小 |
| 异常列表与同页定位 | 三项可见且紧贴操作：银行歧义、3 行类型缺失、系统编码 | #966 代码/测试证明能直达最多 12 个真实不确定映射；单独 `v3-correction-desktop.png` 显示行修正**另开完整表单** | **部分语义一致、视觉及任务连续性有待改进/现场检验**。E3 焦点定位是映射列，不等于三条实际记录的“当前页行内编辑” |
| 四列映射表 | Excel 列名、样例、对应系统字段、状态；截图中示例行较紧凑、默认 7/22 需关注项 | 相同四列结构和选择器确已显示；单行高度明显较大，示例列会展示非空计数及多个源样本；目标下拉含 `· code`、`· subjectType` 或 `ext_...` 等技术身份 | **E2 已接入真实表单，密度/文案仍可优化**。保留身份标识用于严格唯一映射，但普通业务语言优先，不可简单删除 field ID 的底层约束 |
| 操作/保存/确认 | 可见底部“返回文件／恢复初始选择／预检查并继续”和“更改将自动保存”（离线 localStorage 模拟） | 现有截图停在表格中段，无法核实真实页的底部布局；#966 保留原 Host 预检/提交命令 | **不能根据本次截图签收底部 CTA 或草稿自动保存**；真正持久化和独立 Schema/Import 确认仍由现有 Host 约束 |
| 窄屏 | 有 390px 原型任务截图 | 有 390px 隔离 Chromium 行卡片和单独修正页面的回归截图 | **响应式代码/场景存在**；真实手机、文字缩放、屏幕阅读器及完整点击路径尚未 Human 验收 |

**图像直接观察 vs 推断：** “左侧导航占空间、真实表格行高较大、目标字段包含技术 ID、行纠错为另一表单”直接从 CI PNG 可见；“页面顶部 E3 文件卡/统计/问题存在”则来自 #966 源码/审查及 PR 记录，**未在此次被提取的映射表 PNG 中直接拍到**。不能在正式审查中互相替代。

## 2. 本轮已明确的 E4 行动顺序（先体验证据，后改代码）

1. **E4-01a 完整真实 /map 视觉采样**：使用用户指定的授权作业，在部署到哪一准确 SHA 都已可核的 Railway 页面捕获 1280 桌面全页、390px 窄屏及最终操作区；保持 Eidos shell，不用设计稿壳替换。原始截图由有权访问的用户或现有受权浏览器执行者获取；没有登录凭据时明确受限。
2. **E4-01b 七项并排评价**：文件/标题与步骤、四统计卡、问题区和可定位操作、字段表密度与源证据可读性、操作区、中文业务文案、移动卡片。逐项标“已符合/需修复/缺图无法判断”，附精确截图和 SHA；用户决定是否视觉认可。
3. **E4-02 只修已证实的差异**：纯通用表格/宽度/控件语义归 Eidos，Host 的事实投影、业务说明、就地纠错路径归 Platform。不要把全部 V3 静态 CSS 搬入 Platform；不要损害 Host 身份/权限/历史 Recipe 保护。
4. **E4-03 受权数据闭环**：原客户 Excel/Job、两个“开户银行”稳定 ID、真实三行 subjectType、批量 Schema 权限、dry-run 失效、正式提交/幂等与恢复需真实证据。**隔离 5/5 不等于真实客户验收。**

## 3. 暂不下结论的事项

- 缺少实际部署页面的顶部和完整底部截图；不能评价 E3 四统计卡的真实视觉比例，不能宣称当前线上达到 V3 或完全失败。
- 两份截图的容器不同：V3 独立 HTML 原型 vs 带共享导航的 Eidos Host，不适合简单像素差分或要求 1:1 外壳宽度。
- 本次未运行外部登录、没有取得任何用户企业文件或受权 Job JSON，没有任何业务写入。
- Actions artifact 有到期日，原型 HTML 和本页链接可在仓库中继续定位；若需长期永久 PNG，须另有仓库归档/附件决策。
