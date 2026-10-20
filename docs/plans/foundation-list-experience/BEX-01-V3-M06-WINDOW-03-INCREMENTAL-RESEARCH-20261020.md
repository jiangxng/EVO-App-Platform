# BEX-01 V3 M06｜Window 03 增量研究与决策（2026-10-20）

> 叠加于 [Window 02 #1075](https://github.com/jiangxng/EVO-App-Platform/pull/1075)、[M06 #1058](https://github.com/jiangxng/EVO-App-Platform/pull/1058)，不替换历史外站资料。用户固定进度 M01-M03 COMPLETE、M04-M06 OPEN，3/6。

## 本轮新实证（R）
1. 2026-10-20 直接读取 #909 精确 HTML 及原型 Chromium artifact 11957646429。文件卡为 XLSX icon → 文件名 → 工作表、行列 → 已读取 pill；stage 2 步，底部三个可操作按钮。参照 [#909 原型源码](https://github.com/jiangxng/EVO-App-Platform/blob/af58e0abad880439d54230485305bf2b4e05decc/docs/plans/foundation-list-experience/BEX-01-IMPORT-V3-IN-CONTEXT-HIGH-FIDELITY-20261015.html)。
2. 直接下载并打开 [Host artifact 12250007262](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39391932514) 中最新 desktop/phone 异常截图。对应 synthetic 172×22、三类问题、四列关系、2 阶段已有结构；文件类型图标和 footer 尚欠，真实源无证据工作表名称不得填造。
3. GitHub main 于复核早段为 `eaa5e813…`，随后另窗合并 #1076，变为 `102319de812ce65682f0c6ccb1a930e10b4e22d4`。Railway production 成功部署该 main (deployment `dffc4413-07e5-4302-95ac-adcf737fbdfb`)。主 PR #1060 未合并；当前叠加 #1077 Draft。不可继续使用 ahead 44/behind 0 的过时数字；首次 compare main vs #1060 为 ahead44/behind2。
4. 相关活跃：Platform #1054/#1060/#1066/#1070 Draft；Eidos #202 Open、#203/#204 Draft。不可将并行 Draft 当作已删分支清理。GitHub branch search `delete` 两仓库均没有同名标记结果；连接器未提供删除 Git refs 操作，**未删除任何远端分支**。
5. 第一轮精确 HEAD `6e21ed8d…` 的 Actions：UI/continuity 缺同 PR 设计复核文件而失败；in-context resume 因 footer route validator 误写转义而失败。后续修复需新 HEAD 重跑，不能冒充通过。

## 采用／排除
- 采用 Eidos 通用 iconLabel + Platform 真实 source.kind：拒绝在 Eidos 写供应商语义、按文件名随意猜 XLSX。
- 采用现有内站 route 的真实返回 + 仅浏览器局部重置到 Host loaded snapshot；拒绝静态按钮、静默清除持久化 mapping、伪称自动保存；必要时若用户希望重置服务器草稿，必须另立授权动作和审计设计。
- 继续保持 Platform #1077 **叠加 #1060**、Draft，不盲目 rebase main，不动 Eidos owner PR、Railway、PA05 等。
- 不能将合成 Chromium PASS、CI Human UI Gate 名称、生产 main 部署或静态原型截图解释为客户验收或用户 Human 签收。

## 接续
见 [#1077](https://github.com/jiangxng/EVO-App-Platform/pull/1077) 和本次 [UI 设计复核](../../ui-design-reviews/bex01-v3-m06-file-footer-parity-20261020.md)。优先跑新精确 HEAD，实际验证 1280/390 格式图标、返回目录路由、排他映射更改后重置恢复及所有 V3 Chromium steps。其后补足仍缺视觉与信息层级，等待用户签收。M04/M05 禁止提前启动。
