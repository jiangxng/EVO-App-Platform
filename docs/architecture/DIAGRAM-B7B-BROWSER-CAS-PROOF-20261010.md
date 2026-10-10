# B7b — Browser DOM 冲突与保存失败证据协议（2026-10-10）

**分支/PR：** [#563](https://github.com/jiangxng/EVO-App-Platform/pull/563)（Draft，基于 #561）。**权威基线：** 原始要求 §14、[研究索引 PR #552](https://github.com/jiangxng/EVO-App-Platform/pull/552)、`DIAGRAM-B7-PROJECTION-CAS-20261010.md`、`DIAGRAM-B7B-AGENT-CAS-WRITE-TOKEN-20261010.md`。

## 执行入口

- 脚本：`tools/diagram-projection-browser-conflict-proof.mjs`
- 工作流：`.github/workflows/diagram-designer-browser-cas.yml`，名为 **Diagram Designer Browser Conflict CI**。
- 环境：Linux GitHub-hosted runner、Node 22、Chrome/Chromium headless；没有下载另一个图形框架，也不依赖生产部署。
- 本地复现：`npm ci && npm run build && CHROME=/path/to/chrome node tools/diagram-projection-browser-conflict-proof.mjs`。缺少 Chrome 时应明确失败，不得静默跳过。

## 测试真实覆盖

测试启动独立的 Chrome 进程和本地 HTTP 服务，浏览器动态 import 仓库真实的 `dist/vendor/eidos/src/diagram/surface.js`、挂载 Eidos 页面、向真实的 App Platform `createEnterpriseDefinitionProjectionEditorActionHandlersV010` 发送 GET / SAVE 命令。测试不依赖伪造的画布状态函数：

1. **标签页 A / B**：两张真实浏览器标签页同时读取同一投影的写 token；两个页面各自通过 DOM 选择并隐藏不同节点。
2. A 点击页面按钮 **Save projection**，原投影版本递增为 1。B 点击 Save，显示冲突文案，并保持本地未保存节点隐藏；数据库版本不变。
3. B 再点击 overflow 里的 **Save as projection**，生成单独的投影副本；原投影保留 A 的内容，副本保留 B 的内容，没有新增业务定义版本。
4. **标签页 C**：新的浏览器标签页编辑后首次保存，服务端定向注入 HTTP 503；编辑器必须显示保存失败、保留本地草稿。第二次按真实 UI 按钮重试应成功，投影版本递增且不改变业务定义历史。
5. 脚本打印机器可读的 `DIAGRAM_BROWSER_CAS_PROOF`；工作流必须检测该项并在脚本/清理报错时失败。实际浏览器版本以 GitHub 日志打印为准。

## 已知边界和保留证据

- 这是 **GitHub runner 上真实 Chromium 的自动 DOM + ActionHost** 测试，不是模拟浏览器源码断言，也不是 Windows/macOS/iOS/Android 真机验收。
- 不包含两台物理机网络条件、手机触摸手势、真实 LLM 对话裁剪、浏览器刷新后的离线草稿恢复，亦不替代分布式多实例存储 CAS 压测。
- §14 的 D03 / D05 自动 Chromium 子场景可以记录为浏览器自动验证通过，**完整跨设备验收仍应在证据矩阵维持 NOT TESTED**。
- 首轮仅两个浏览器窗口的版本 `8d0d2b...` 完成业务断言并打印证明，但 CI 因 Chrome Profile 临时目录清理竞态报错；`1fd6584...` 修复等待退出与删除重试，浏览器工作流 [38010239304](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38010239304) PASS。后续第三标签页 HTTP 503/重试扩展对应最新提交须重新核对完整 CI，不可复用前次结论。
