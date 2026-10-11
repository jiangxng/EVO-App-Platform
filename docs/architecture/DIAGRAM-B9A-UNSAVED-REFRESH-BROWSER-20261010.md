# B9a｜未保存本地投影修改的刷新/重新打开边界（2026-10-10）

## 链路与决策

继承 [B8z 原生鼠标拖动→Undo](./DIAGRAM-B8Z-NATIVE-DRAG-UNDO-20261010.md) 与 [B8y 本地隐藏→Undo](./DIAGRAM-B8Y-CONGESTION-HIDE-UNDO-BROWSER-20261010.md)、[B8x 双实例](./DIAGRAM-B8X-TWO-INSTANCE-ISOLATION-20261010.md)。该 [Draft #611](https://github.com/jiangxng/EVO-App-Platform/pull/611) 基于 [Draft #610](https://github.com/jiangxng/EVO-App-Platform/pull/610)，**只改真实浏览器工具、其独立 CI、证据文档**。不改业务模型、Eidos runtime、App vendor、Host/Agent 授权、CAS、自动路由 22/2600 安全上限或项目主线 TR-01；不合并、不部署。

用户在 Designer 中暂时隐藏的节点/边是本地操作，未经显式 Save 时不应冒充已写入服务器的投影。从前轮 B8y/B8z 的 Undo PASS 不可推断刷新边界正确，因此本轮用真实 Firefox/WebKit 引擎扩展一条独立可审计的只读刷新场景。

## B9a 受控浏览器测试

在 B8x 的两个真实 Surface 同页面 fixture 中：

1. 第一幅图含 23 个局部相关障碍，与自动正交连线共同使真 Eidos 路由预算拒绝，初始有 **1 条拥塞**；第二幅曲线图有 **0**。真实 ActionHost 每次读取都返回**未修改的原始合法合成业务图**。
2. 第一图实际鼠标选中 `block-22`，点击既有 `Remove from view`；不保存，变为 22 相关障碍、拥塞数从 **1 降到 0**。
3. 真实浏览器页面内调用已经存在的公开 `mountDiagramEditorPageV010(...).refresh()`（不是直接篡改 CSS / DOM/状态），使 Eidos 通过正常 `readCommand` 重新读取 ActionHost。期待恢复 23 障碍、拥塞数 **0→1**、`1 routes need review`；第二图仍为 0，无异常或模型丢失。
4. 再执行真实浏览器的 `page.reload` 完整重建两个 Designer 实例，要求源图仍拥塞 **1**、兄弟图仍 0；未保存的本地隐藏不能跨刷新长期残留。
5. Firefox/Linux 和 WebKit/Linux 均必须出现 `B9A_UNSAVED_REFRESH_RESULT`，CI 强制 grep；同时保留 B8u 的 258 标签/256 校准预算、B8w 14 次复杂文字原生点击、B8x 双实例、B8y 隐藏/Undo、B8z 210 像素真实鼠标拖动/Undo。

**限定解释**：本场景测试的是应用读取 API、浏览器重新打开与本地未保存草稿的边界，ActionHost 使用受控内存数据。不是连接实际客户数据库、CAS 两人冲突、生产投影 Save/Viewer，或浏览器系统物理触摸板、iOS/Android。不能据此宣称 §14 **D04 或全部 39 项正式商用验收 PASS**，仍保持 `NOT TESTED`。

## 证据与后续

- [本轮 PR Checks](https://github.com/jiangxng/EVO-App-Platform/pull/611) 的同一 HEAD CI 是最终依据；首次失败须保留日志与修正。
- 后续真正 **Designer 保存→刷新→独立 Viewer→后台存储→再打开**应调用 App 项目正式读取/保存链路验证，并在对 Host 授权和企业上下文仓接口做变更前征得主线边界配合；不能以本次合成 ActionHost 假造客户数据证据。


## B9a 真实浏览器核验记录（首次受测代码）

[GitHub Actions #38061894121](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38061894121) **PASS**。两套真实 Firefox/Linux、WebKit/Linux 图层加载/本地编辑/公共 API 刷新和整页刷新均无脚本错误。

| 浏览器引擎 | 隐藏后的未保存草稿 | Eidos `refresh()` 后 | 整页 reload 后 | 兄弟实例 |
| --- | ---: | ---: | ---: | --- |
| Firefox | 0 | 1 | 1 | 0 |
| WebKit | 0 | 1 | 1 | 0 |

各引擎均输出 `B9A_UNSAVED_REFRESH_RESULT`，`readSourceImmutable=true`，保持 B8z 拖动 Undo、B8y 隐藏 Undo、B8x 双实例和复杂文字测试。这说明**本地草稿不会假装已经存在于读取的源状态**，不是验证真数据库持久化或 CAS；最新版文档 head 需另核 CI，不能将旧 run 冒充最终 SHA。
