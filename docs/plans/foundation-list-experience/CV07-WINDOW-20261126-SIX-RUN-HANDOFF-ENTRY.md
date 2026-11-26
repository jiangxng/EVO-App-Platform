# CV07 / Foundation List Experience — 2026-11-26 六轮续跑交接入口

**START_HERE / ENGINEERING_NOT_CLOSED / HUMAN_NOT_SIGNED**。先读[本轮详细研究决策索引](CV07-WINDOW-20261126-SIX-RUN-RESEARCH-DECISION-INDEX.md)，再读[旧窗口恢复索引](CV07-WINDOW-20261126-RECOVERED-RESEARCH-DECISION-INDEX.md)、[11-19 原研究入口](CV07-WINDOW-20261119-RESEARCH-HANDOFF-ENTRY.md)及[11-25 Eidos/导入交付](CV07-WINDOW-20261125-EIDOS-DICTIONARY-IMPORT-DELIVERY.md)。本轮不覆盖任何历史记录。

## 当前准确基线（2026-11-26，交接写入前实查）
- 仓库 https://github.com/jiangxng/EVO-App-Platform；唯一集成主线 protected main @ 6af9024fee8edcf454d5e6d08de50c0a6c101267。
- #1385 恢复旧窗口资料、#1386 通用模板别名一致性、#1387 字典批次名称冲突与193行合成测试均已普通合并，三个过程分支均有精确删除原日志。main 协议 1523 tests/1522 pass/0 fail/1 skipped；1096、1280、390 Chromium 几何通过；四项 main 工程工作流 success。
- **唯一未合并功能 PR [#1388](https://github.com/jiangxng/EVO-App-Platform/pull/1388)**：Draft；branch `fix/cv07-dictionary-editor-return-context-20261126`；head `59c90c2b3838a0fa4a73812153d41dea5a45868f`。修复编辑、新建、发布后保留原字典目录 returnTo，Owner allowlist 先于写入。旧 HEAD 仅确认一条协议失败（CV02 原断言禁止所有 editor returnTo），已更新兼容安全测试、补创建及伪造发布拒绝；新 HEAD 检查尚未出现，不声称通过。不要重新实现。
- [Tokyo release #45749244689](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45749244689) preflight success，UTC03:31:37 `EVO_TOKYO_MAIN_CI_VERIFIED sha=6af9024fee8edcf454d5e6d08de50c0a6c101267`；deploy job 139673537091 in_progress。最后**已证实**实际容器仍为 #1384 SHA 44da0a35ccf3191d90b9817fc21ffa667628a3b7（03:19:35Z inventory）；不可据新 main 或 preflight 推断上线。
- 本交接仅新增两份 docs，通过独立 docs Draft PR；不改变 #1388 的 HEAD 或其他工作线。此文件不预填自身提交/PR/合并证据；用 GitHub 实况定位。

## 用户要求与已定边界
PC 优先，不因手机降低桌面设计，沿用 Eidos；List Foundation 复用通用导入；明确上传→映射/预检→独立确认→DRAFT→Human 发布；字典定义、父子项编辑、真实字段核对。七源列中来源别名/状态用 Owner header aliases，选项主键语义不明，不能擅自映射或忽略。父级仅同字典稳定编码。自动化通过不能冒充真实193行、Human签收。

## 下一窗口先做（严格收敛）
1. 重新获取 main、#1388 精确 HEAD、所有 check-runs（分页）、PR/Actions 及东京 release 最新状态；若失败读原日志，修复后重新验证。准确 HEAD 所有应通过检查成功/有明确合规跳过才 Ready→普通 merge；若 main 前移先核对 diff 安全同步，不强推、不降低保护。避免先合并 docs 导致 #1388 重跑；docs-only 交接PR随后按同样规则合并。
2. 逐次核验 main CI、Tokyo 最终运行镜像 SHA/healthy/HTTPS/Basic Auth；只读 inventory 核验插件及企业，精确删除已合并分支。部署门禁若因非 main 同 SHA 分支检查 cancelled 失败，保留证据、正常重跑或由更新 main 正常发布；不绕过。
3. 把最终合并、部署、清理证据补到本工作线交付记录/PR，通知人验。真实 CSV/主键语义、完整草稿/发布、父子编辑、原筛选恢复、PC 1096/1280/1440 与390真实视觉及权限验收待合法 Human；无真实原始 CSV 或原截图。完整 CV07 另有 Item 样本及独立开发者接入，不能标全部完成。
4. 不开启正式 CV03 WRITE/CV04 后台 EXPORT/OIDC/PA05/Agent WRITE；不触碰 #1184 或其他窗口，不新增收费模型请求，不重复外站研究。若用户继续，优先实际推进可独立工作；仅全任务完成写【续跑状态：完成】，仅当前确需人工且无独立工作时写【续跑状态：人工验证】。
