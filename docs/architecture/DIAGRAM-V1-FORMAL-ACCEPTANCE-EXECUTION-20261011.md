# EVO 2D Designer｜v1.0 正式验收执行台账（2026-10-11 起）

> **阶段定位**：本文件是 2D 专项独立的执行证据册，不替换[原完整 v1.0](./EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md) §14，也不覆盖已有[39 项主矩阵](./DIAGRAM-COMMERCIAL-ACCEPTANCE-EVIDENCE-MATRIX-20261010.md)。当前正式客户/业务人员签收仍 **0/39**。状态“自动化完成”与“正式商用 PASS”是两个不同的字段。

## 固定输入与范围

- 基准：EVO-App-Platform main `851ac9c92f3cf19ddc4e9e18e6f92355e4024a49`，eidos main `3fde008f372bcbcaad45563f511c7b7cf1f8924e`。如后续 main 更新，必须重算 head 和证据有效范围。
- 本独立 Draft PR 只在 Platform 增加 **V01–V03 合成真实 Chrome 浏览器子门禁**，不修改 2D runtime，也不合并/部署或碰 Agent/TR-01。
- 首轮脚本：[`tools/diagram-commercial-v01-v03-browser-proof.mjs`](../../tools/diagram-commercial-v01-v03-browser-proof.mjs)；[专用 CI](../../.github/workflows/diagram-commercial-v01-v03-browser.yml)（新 PR 触发；需以实际 Actions 最终 SHA/结论为准）。脚本执行真实 Eidos Canvas → 用户级原生鼠标选边 → HTML Select 切换四种路径 → 真正 UI Save projection → App Handler / 临时 FileStore CAS → 独立只读 Viewer。
- 合成关系仅含 `sale`、`receipt` 以及源/目标绑定的一条边；没使用客户数据、生产身份、生产数据库、用户物理设备。即使 Chrome 自动化成功也不得提升 §14 的签署状态。

## V01–V03 验收记录（五层独立）

| ID | 原始 §14 要求 | 源码/方案事实 | 本 PR 自动化动作 | 本次运行结果 | 商业人工签收 |
| --- | --- | --- | --- | --- | --- |
| V01 | 同一关系切换直线、直角、圆角、曲线，图形确实不同，含义不变 | Eidos edge-paths 已有四种几何 + 编辑器下拉 | 原生 Chrome 指针选中同一边，实际下拉轮流选 `orthogonal`、`rounded-orthogonal`、`curve`、`straight`；比较真实 SVG `d` 路径唯一性和 Q/C 语义，保存后独立 Viewer SVG 路径一致 | **机器子门禁 PASS**（Chromium 154；Actions #38113320706；准确提交 c3ac389；非人工） | NOT TESTED |
| V02 | 老投影没有新增字段时，保持旧直线，不被动迁移保存 | Gallery schema 的 `edgePaths` 可选；旧边没有 pathKind | 实际旧数据 GET + Chrome 初次打开，确认默认只含直线 L，文件 CAS 仍 0；明确 Save 前不发生内容写入 | **机器子门禁 PASS**（Chromium 154；Actions #38113320706；准确提交 c3ac389；非人工） | NOT TESTED |
| V03 | 线型/箭头业务方向不可伪造 | 业务关系 `source`/`target`/`arrow` 在业务图，展示路径独立 | Chrome 切换路径、检查 `marker-end` 没有新 `marker-start`；真实 Save 后 GET 与 Viewer 仍为原 source/target/arrow；业务定义历史数量仍 1 | **机器子门禁 PASS**（Chromium 154；Actions #38113320706；准确提交 c3ac389；非人工） | NOT TESTED |

### 实际 CI 执行证据（不要凭代码存在填写）

- 工作流 URL：`https://github.com/jiangxng/EVO-App-Platform/actions/workflows/diagram-commercial-v01-v03-browser.yml`
- 已验证浏览器运行：[Actions #38113320706](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38113320706)，准确 head `c3ac389ac2c3e6138164d2054f132ab33977ed50`；`native-chrome-v01-v03` **SUCCESS**；实际 Chromium `154.0.8037.97`。日志 `DIAGRAM_V01_V03_BROWSER_SUBGATE` 标记四种路径 SVG 均不同、旧图直线无迁移、原生鼠标选边、原生表单切换、真实 App CAS/UI Save 到 version 1、新 Viewer SVG 一致、业务箭头/关系/定义版本未变。该证据不是实机/客户或正式签署。截图未产生，留存的是合成自动化文本日志 Artifacts。更新本文之后产生的新 head 仍需单独查其 Actions 结果。
- 一旦 CI 失败，不降低断言质量、也不修改正式主矩阵为 PASS；先定位真实产品缺陷还是 fixture 设定错误，再用精确 SHA 补齐结果。

## V01–V03 真正人工/实机签收仍需执行

选择真实 2D Designer 产品入口，以已授权业务图在 Windows Chrome/Edge 鼠标、macOS 实机（必要时触控板）、iOS/Android 实体设备上按原 §14 逐项复现。V01 比较四种真实路径和操作反馈；V02 取历史投影（无任何新增样式字段）重开确认不迁移；V03 使用真正锁定业务关系方向的图，试图通过外观控制伪造方向/状态必须被拒绝。附设备版本、操作录像/私密安全位置、测试日期、结果、执行者和签收人。**任何一项缺失，仍为 NOT TESTED。**

## 后续按顺序执行

1. **V04–V06**：10%、100%、300% 的边命中与箭头，长中英文本、选择/焦点/错误叠加，先独立 Chrome 测试，再真实设备的视觉与键盘验收。
2. **M01–M09**：左键与右键的严格消歧、失焦取消、Space/中键、输入框焦点保护。原地右键菜单尚存缺口，不能假装 PASS。
3. **T01–T07**：iPhone/iPad Safari、Android Chrome、macOS 触控板实体操作；合成触摸事件只能作为回归佐证。
4. **E01–E07、D01–D06、A01–A02、P01–P02**：精细路径、保存撤销/冲突、位置锁定自动排版、真实大图与多实例。**D02 和 A01 有已确认的源码功能偏移，需功能修复与复测后签署**。
5. 每项提交五层证据：原要求、功能代码、自动化结果、真实终端/企业数据、正式人工签收。与原矩阵逐行对应，不用新编号取代原有 39 个 ID。

[研究恢复入口](./EOG-2D-DESIGNER-V1-RECOVERY-ENTRY-20261011.md)与[九工作包差距审查](./EOG-2D-DESIGNER-V1-MAIN-GAP-REVIEW-20261011.md)在独立 docs-only Draft PR #715 中；此分支先独立做测试与证据，不复写研究遗产，不抢并行分支。

## 逐项验收与合并规则（2026-10-11 用户确认）

- 每个最小范围的浏览器/源码验收通过后，核对当前 main 合并基准上的必需 CI，再合并对应 PR；**不积压大量 Draft 分支等待最后合并**。
- V01–V03 当前为 Chromium 合成图机器子门禁，不构成正式人工签收；正式 39 项仍 0/39。
- Eidos 通用能力先独立合入 Eidos main，Platform 在独立 PR 做受控 vendor 适配并通过真实浏览器+CI；不改 Agent/业务主线。
- 本次更新同时要求 GitHub 为最新平台 main 合并基准重新执行 continuity 检查，禁止绕过仓库保护。
