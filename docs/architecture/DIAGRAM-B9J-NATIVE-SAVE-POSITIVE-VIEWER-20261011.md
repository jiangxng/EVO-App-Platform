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
