# B9j｜真实 Chrome 鼠标隐藏与工具栏 Save 保存拥塞清除，独立 Viewer 读取

日期：2026-10-11。独立 [Draft #622](https://github.com/jiangxng/EVO-App-Platform/pull/622)，基于 [B9i #621](https://github.com/jiangxng/EVO-App-Platform/pull/621)。仅更新真实浏览器集成脚本、原 B9i 专项 CI 和文档；业务源定义、Host/Agent 授权、CAS 契约、Eidos A* 安全预算、TR-01、main 均未修改，不合并不部署。

## 已知的差距

- B9i 已经用真实 App Handler、合法 payload.preview2d、文件型 Store CAS Save 将 23 个相关障碍的自动正交关系**实际持久保存**，再由两个真正 Chrome 页面（新 Designer/readonly Viewer）独立确认各有 1 条拥塞、汇总 1，随后由测试 Node 代码**直接调用 Handler** 再次保存隐藏第 23 个障碍，恢复为 Viewer 0。
- **B9j 只改变第二次保存的操作入口**：在真实 Chrome Designer 页面中由 Playwright **物理鼠标事件**点击第 23 个障碍的未被相邻节点遮挡区域、点击既有 Remove from view，再点击真实 Save projection 工具栏按钮。不得直接使用测试代码调用第二次 Handler 来获得看似通过的浏览器 UI 证据。

## 测试步骤和合同

1. 真 App Editor Handler 先以 CAS token 0→1 保存全部 23 个障碍及关系 orthogonal。
2. 独立真 Chrome Designer / Enterprise Definition readonly Viewer 从 App FileStore 读取，必须均有 1 条真实拥塞、汇总角色 note、指针透明、边上 aria label、Viewer 无 Save。
3. 另开真 Chrome Designer，真实浏览器鼠标点击第 23 个障碍节点的非重叠部分，实际点击 Remove from view；画布应从拥塞 1→0，但正式 Store CAS 必须**仍为 1（局部草稿不自动提交）**。
4. **真实浏览器点击 Save projection 按钮**、等待 Eidos 显示 Saved.，检查受控 App 授权与文件 Store CAS token 1→2；不能容许仅前端修改数据却声称已保存。
5. 新开的 Chrome Designer / readonly Viewer 都重新走 GET，拥塞数实际为 0、没有陈旧汇总，readonly Viewer 没有 Save、窗口错误数组为空；业务基础定义历史始终为 1。
6. CI 工作流必须同时检到 `B9I_SAVED_POSITIVE_CHROME_RESULT` 和新增 `B9J_NATIVE_SAVE_RESULT`，证据链接必须指向实际通过的最新 HEAD 运行。

## 验收级别与限制

这验证了真实浏览器鼠标、实际产品按钮、App Handler、CAS、文件 Store、真 Chrome readonly Viewer 的**一条完整受控机器验收链路**。但业务图合法却是合成示例、Store 在 CI 临时文件、授权策略是受控测试钩子；并非生产企业数据库、真实客户 S2C/P2P 数据、多用户策略或实体 iOS/Android/Windows/macOS 设备。历史 §14 **39 项正式商用签收仍 NOT TESTED**。所有 PR 保持 Draft，未合并、未部署，TR-01 不变。

初期脚本采用 Pin Playwright 1.56.1 控制 CI runner 原生 Chrome 154，不改变 product 依赖或部署包。任何失败必须保留首个失败 run，记录修改原因后以同 HEAD 成功证据判定。


## 实际首次失败、修正与正式 Chrome 结果

- [首轮 B9j 失败 #38069271828](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38069271828)：点击真实业务节点后，Eidos 按正常契约执行 **selection-read Command**。上一轮 B9i 只为不带交互的 Viewer GET 设置了 GET/SAVE/VIEW 测试服务器路由，导致新场景 HTTP 400 和被浏览器捕获的 unhandled rejection。这不是业务保存失败，而是**测试服务器缺少真实选择读取处理器**，不能跳过错误断言来伪造 PASS。
- 精确修正：同一测试 ActionHost 映射 App `createEnterpriseDefinitionProjectionEditorActionHandlersV010` 返回的**所有正式 Handler**（包含 selection-read），保持实际授权、CAS 和底层文件 Store 不变；记录修复提交 `e97b1348b5dcf4f67a3f046e6fed87cb09a488b3`。
- [真 Chrome 修复后 #38069350412 PASS](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38069350412)，浏览器 **154.0.8037.97**：
  - `B9J_NATIVE_SAVE_RESULT`：正数原始拥塞 1、实际点击隐藏后 0、原 CAS 仍为 1；真正按钮点击后 CAS **1→2**，真实浏览器鼠标选择和工具栏按钮均触发，脚本错误数组为空。
  - `B9I_SAVED_POSITIVE_CHROME_RESULT`：已保存正数在全新 Designer=1 / Viewer=1；第二次通过真实 Chrome 按钮保存后全新 Designer=0 / Viewer=0，均有实际 SVG hit、汇总与 aria 校验，Viewer saveButtons 始终 0，业务定义历史 1。
  - 与原有 B9i 的工具直接调用 Handler 保存方式相比，B9j **完成原生 UI 入口到真实 App CAS 保存的闭环**；首轮失败保留为可追踪证据。
- 文档提交后的最新 PR HEAD Actions 仍应单独核验，不能把上述前一绿色 run 冒充同一最终 SHA。

## 限定与下一轮方向

本阶段实现了**合法合成业务图**的浏览器按钮→App Host→真实临时文件型投影 Store→全新 Chrome readonly Viewer 的完整机器子场景，但没有引入真实顾客/真实云数据库/多租户实机或生产部署。正式 §14 39 项商业人工验收**仍 NOT TESTED**。下一阶段应优先聚焦真实 S2C/P2P 投影数据、终端系统字体/触控板与生产环境安全授权验收；不能再把现有自动化当成真实客户签收。
