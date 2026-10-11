# EVO 2D v1.0 V04｜10%、100%、300% 缩放实测记录（2026-10-11）

**范围**：[原始 v1.0 §14 V04](./EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md)，原文“在 10%、100%、300% 查看边——线宽、箭头、命中体验合理，无巨大箭头或点不到的线”。**正式人工验收 NOT TESTED**，本文件仅记录真实 Chromium 自动化子场景。

## 原始 main 中定位的偏移

- 固定基准 Eidos `3fde008f372bcbcaad45563f511c7b7cf1f8924e`：可见连线使用 `vector-effect="non-scaling-stroke"`，但透明交互 hit stroke 仅设置世界坐标宽度 18，没有同等 non-scaling 保护。推算 10% 约 1.8 CSS px、300% 约 54 CSS px，**这是由源码与 SVG 变换模型推得的待验证风险，不冒充原生浏览器旧代码的已执行 FAIL**。
- [Eidos 独立 Draft PR #161](https://github.com/jiangxng/eidos/pull/161)：只为 transparent hit path 增加 `vector-effect="non-scaling-stroke"`，保留原有可见边样式/路径和 source-target 语义；源级回归不等于 V04 正式签收。
- Platform 本次**精确 forward-port** 同一修改到 `vendor/eidos/src/diagram/surface.ts`，保留 App-Host context navigation；更新 scoped manifest 中 `surface.ts` 的 vendored blob SHA，依然真实记载 upstream pinned main 是 `3fde...`，并明确该 overlay 暂含 Draft #161 的前移补丁，**没有虚报上游已合并**。

## 独立浏览器执行（待 Actions 结论）

- 复用 [V01–V03 真正 App Handler/Chrome UI 脚本](../../tools/diagram-commercial-v01-v03-browser-proof.mjs)：追加 `DIAGRAM_V04_BROWSER_SUBGATE`，在实际 Chrome 点击 Zoom Out/Reset/Zoom In 控件分别达到 10%、100%、300%。
- 对每个比例：检查 SVG 真正可见边的非缩放线宽、业务方向的 marker-end、透明 hit path 的 18px 和 non-scaling stroke，并在路径中心偏离 **6 CSS px 的法线位置** 用真实 Chromium `document.elementFromPoint` 验证命中的是目标关系，而非字符串存在性。
- 约束：同一图、相同关系标识、完整 real DOM；缩放不引发隐式 App CAS；历史 V01–V03 Save 与独立 Viewer 证据不退步。
- CI 实际 run ID / exact SHA / Chrome 版本 / 是否通过：**待本 Draft PR CI**；不能因测试脚本已提交就标记通过。
- Chrome 仅证明所测合成图的机器行为。箭头的感知大小、不同硬件/系统字体缩放、触控板双指体验、用户主观视觉和物理设备签字仍需真实设备及人工证据。最终正式 **0/39** 不变。

## 后续人工 V04 方案

选择有密集/交叉/平行关系的业务图，在 Windows 鼠标与 macOS 触控板上实际切到 10%、100%、300%；录屏记录点击临近边、箭头是否过大及不同行为是否误选。iPhone/iPad、Android 的真实操作随 T01–T07 一并实测。只有附 OS/浏览器/屏幕缩放、设备、日期、审核者、实际通过/失败和安全保存的证据 URL，才可更新 §14 正式矩阵 V04。
