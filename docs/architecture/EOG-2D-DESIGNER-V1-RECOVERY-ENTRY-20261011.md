# EVO 2D Designer 商业化升级｜2026-10-11 恢复接续入口

**窗口归属**：[2D 专项]，不接管业务主线、Agent、TR-01 或部署治理；本次**仅研究恢复和差距核查**，无功能代码、生产服务或全局状态修改。

## 优先阅读（三件新增资料）

1. [原始 v1.0 完整要求](./EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md)（2026-10-09）：**范围权威**，§13 A+B 必交、C 可延期；§14 39 项正式验收。
2. [恢复的 S1–S7 研究来源/决策、历史证据等级及保留/排除方案](./EOG-2D-DESIGNER-RECOVERED-RESEARCH-DECISIONS-20261011.md)：历史已读官网，不冒充本次重新访问；沿用既有 2026-10-10/11 研究索引和 SHA 证据。
3. [v1.0 对照当前两仓 main 的逐项差距、九个收口工作包](./EOG-2D-DESIGNER-V1-MAIN-GAP-REVIEW-20261011.md)：**区分聊天意图 / 原始要求 / 代码 / 历史自动测试 / 人工正式签收**，本次未运行新测试。

## 本次确定的仓库状态

| 仓库 | 本次核对的 main | 合并事实 |
| --- | --- | --- |
| [eidos](https://github.com/jiangxng/eidos) | `3fde008f372bcbcaad45563f511c7b7cf1f8924e` | 商业核心 [PR #160](https://github.com/jiangxng/eidos/pull/160) 已合并 |
| [EVO-App-Platform](https://github.com/jiangxng/EVO-App-Platform) | `851ac9c92f3cf19ddc4e9e18e6f92355e4024a49` | 专项集成 [#693](https://github.com/jiangxng/EVO-App-Platform/pull/693)、公开 API 修复 [#695](https://github.com/jiangxng/EVO-App-Platform/pull/695) 已合并；B10/B11 证据 [#699](https://github.com/jiangxng/EVO-App-Platform/pull/699)、B5–B9 证据 [#705](https://github.com/jiangxng/EVO-App-Platform/pull/705)、guarded 清理 [#706](https://github.com/jiangxng/EVO-App-Platform/pull/706) 已合并 |

以上是读取到的固定快照，新窗口开始前应刷新当前 head。历史 [#552](https://github.com/jiangxng/EVO-App-Platform/pull/552)、[#623](https://github.com/jiangxng/EVO-App-Platform/pull/623)、[#689](https://github.com/jiangxng/EVO-App-Platform/pull/689) closed/unmerged，但源资料通过 main 的归档索引保留；**勿因历史 PR 已关闭而丢失研究遗产**。

## 当前真实判断

- **代码层面**：四路径、避障/并行/自环、框选群移、路径手柄、CAS 投影保存/Viewer 已有重要成果。历史合成浏览器/Node/Chrome 测试是有效的**对应子场景机器证据**。
- **明确偏移**：Eidos Surface 保存成功仍清空 undo/redo；自动布局无固定节点契约并强制 Fit；Platform Gallery 无完整纹理/线宽/颜色/标签位置/锁定等展示持久化字段。右键上下文菜单有明显未闭环线索，需真实鼠标确认。
- **商业验收**：原 §14 **0/39 正式签收**，不要误读成 0% 代码完成率。没有本次 CI 复跑、设备录屏、正式生产身份/DB、合法真实企业 S2C/P2P 验收。
- **资料遗失边界**：Library 找到 v1.0 原稿两份，但本聊天未见旧聊天全文导出；原 S1–S7 的旧阅读档案和 GitHub 证据链已恢复，未记录的聊天原句与官网截图/录屏不能伪造。

## 下一步严格顺序

**W1 保存后撤销基线 → W2 锁定节点自动排版/视角 → W3 右键操作模型 → W4 展示样式往返**，再推进 W5 密图改线、W6 移动设备、W7 搜索/无障碍、W8 生产/业务数据闭环、W9 设备/性能/39 项正式签收。每次记录“提出/实现/提交/合并/部署/自动测试/实机正式签收”独立状态。

Eidos 通用交互在它自己的独立 2D PR；Platform 只做插件/Host/Projection/Viewer 契约和精确 vendor 差分，不改业务主线/Agent，不直接推送两仓 main，不修改 `project.status.json` 或全局 HANDOFF。此次文档 PR **Draft，仅供 2D 专项接续/评审，不构成合并部署授权**。
