# B9i｜真实 Chrome 中已 CAS 保存的非零拥塞 Designer / 只读 Viewer 一致性

日期：2026-10-11。独立 [Draft #621](https://github.com/jiangxng/EVO-App-Platform/pull/621) 堆叠 [B9h #620](https://github.com/jiangxng/EVO-App-Platform/pull/620)，代码仅限测试浏览器工具、隔离 CI 和专项文档；不改业务关系、Host/Agent 权限、投影 CAS 约束、Eidos 路由 22/2600 安全预算、TR-01 或 main，不合并不部署。

## 核心差异与事实

- B9b 是 Chrome 真 Save 后**0/0/0** 拥塞；B9c 是 Chrome Viewer 非零正例，但来源为测试读取包装层，**未通过 CAS 保存此正例**。
- B9h 首次构造平台合法的业务定义 **payload.preview2d**（25 节点：2 端点+23 相关障碍、1 真业务关系），通过正式 App Handler CAS Save 保存 orthogonal 视图到正式 FileDefinitionProjectionStore，随后**独立 Node Editor / readonly Viewer GET**读取并以 Eidos 几何证明拥塞；第二次保存隐藏一个障碍，几何清除。但 B9h 未用 Chrome 挂载保存过的正例。
- B9i 首次使**相同这一真实 App CAS 保存的正数图**，经真实 HTTP App ActionHost + Chrome/Eidos DOM 在全新 Designer 和真实 Enterprise Definition 只读 Viewer 两个浏览器页面独立挂载，确认可见 SVG 的真实拥塞 Path 数、摘要、可访问性及每个 Viewer 不可写。**不是**在 DOM 标上伪造 congested，也不是临时 GET 注入关系。

## 已验证动作

1. 受控合法业务定义 preview2d，正式 App 授权与 CAS 从 `0→1` 保存 orthogonal pathKind；完全新建文件型 Store/正式 App Handler 读取。两套 Chrome 页面独立通过 ActionHost HTTP GET，且均 Ready。
2. **已保存正数**：Designer 和只读 Viewer 各自真实 DOM 的 `data-eidos-diagram-route-congested` 数量为 **1**、SVG 汇总计数 **1**、唯一非阻挡摘要也是 **1**，`role=note`，`pointer-events:none`；拥塞边无 aria 缺失；Viewer 不存在 Save，两个页面均无 JS 错误。
3. **本轮第二次 CAS 仍是测试通过正式 App Handler 调用**：保存隐藏第 23 个障碍，投影文件 CAS `1→2`，新开 Chrome Designer 和 Viewer 两处实际 DOM 均显示 **0** 条拥塞、无旧摘要；企业基础定义历史始终 **1**。浏览器里的用户原生 Save 按钮是否触发完整写入由下一步 B9j 单独验证，不能提前嫁接。
4. 首轮 CI 发现缺少 Playwright 依赖 `ERR_MODULE_NOT_FOUND`（[首次红色 run #38069020504](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38069020504)），没有改产品源代码，而在**专用 workflow**增量安装与原 Firefox/WebKit 项目相同的隔离锁定版 Playwright 1.56.1，仅使用 runner 原生 Chrome 154，不安装不必要 Chromium 程序。保留失败与修正历史。
5. [B9i 真 Chrome 修复后 run #38069072194](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38069072194) **PASS**，`B9I_SAVED_POSITIVE_CHROME_RESULT` 标记：
   - Chrome 154.0.8037.97；第一次 CAS token=1、第二次=2。
   - 保存正数 Designer 1、Viewer 1；各 `actualPaths=1,missingAria=0,note=1,noteRole=note,pointerEvents=none`。
   - 清除后重新打开 Designer 0、Viewer 0；各 `actualPaths=0,note=null`。
   - Viewer 在正/零状态 `saveButtons=0`；全部 JS errors=[]；业务定义历史=1。

## 证据边界

这个小步**真实通过 Chrome DOM、官方 App Editor/Viewer Handler、实际 FileProjectionStore CAS 以及合法业务定义**，是比 B9h 更高层次的机器验收，已验证非零拥塞通过真实保存流程后能在独立浏览器中正确展示。**不是生产企业数据库、真实用户业务数据、跨网络主机、客户最终发布环境、实体手机/桌面触控板或 39 项商用人工签收。** 系统没有部署上线，均 Draft；§14 正式 39 项仍 NOT TESTED。

下一小步是浏览器内真实鼠标点击节点→隐藏→点击 Save projection，从 UI 触发第二次 CAS 写入，随后全新 Viewer GET，明确不同于本轮第二次直接 Handler 调用。详细起点与旧研究仍见商业验收矩阵及 B9b–B9h 专项文件。
