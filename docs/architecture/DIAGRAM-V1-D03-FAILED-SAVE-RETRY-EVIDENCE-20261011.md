# Diagram Commercial v1.0 / D03 — 保存失败、完整草稿与重试

日期：2026-10-11。**只覆盖原始商业化 §14 D03**。该文件为工程子门禁记录，不是正式人工签收。

## 直接复用的能力
- B7 CAS / file-backed projection Store 与 HTTP 503 测试；
- B8 Designer→Save→新 Designer 与 Viewer 回读；
- D01/D02 的真实 Chromium 企业投影动作处理器夹具，不新建保存协议，不修改 Eidos 源码或 Agent。
- 精确 Platform main 出发创建独立小分支；CI 使用 `DIAGRAM_D03_BROWSER_SUBGATE` 防空运行。

## 本 PR 的产品级验证方法
1. 使用真实浏览器鼠标选中上一项保存的业务关系，更改 Curve 展示样式，新增并原生拖动手工 Waypoint，再拖动节点，获取节点坐标与实际 SVG 曲线路径。
2. 在浏览器的 HTTP /action 单次注入 503，真实点击 Save 并检查产品“Save failed; local edits are preserved”提示。
3. 确认 CAS 不前进、局部路径与位置完全不丢失，后端仍保存旧 Orthogonal 路径。
4. 去除故障后从同一 UI 再点 Save，CAS 仅前进一次；真正刷新 Designer，确认位置、曲线和手工路径点仍在；业务定义历史不增加。

## 结论与严格限制
本文件仅记录可核实的测试设计；成功与否须由最新 PR head 的实际 GitHub Actions 日志和 PR 评论确认。属于合成合法企业图与临时 FileStore 上的原生 Chromium 自动化，不构成真实 S2C/P2P 租户、分布式 Store、实体设备、用户或业务人员签收。正式人工 **0/39**、D03 商业人工 **NOT TESTED**。
