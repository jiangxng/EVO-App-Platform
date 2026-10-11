# 2D Designer B9h–B9j｜已保存非零拥塞到 Chrome 用户操作与只读 Viewer 的完整机器证据交接

日期：2026-10-11。当前交接顺序：[B9b–B9g 中间证据档案](./DIAGRAM-B9BG-SAVE-REOPEN-CAS-HANDOFF-20261011.md) → [B9h](./DIAGRAM-B9H-PERSISTED-POSITIVE-CONGESTION-20261011.md) → [B9i](./DIAGRAM-B9I-SAVED-POSITIVE-CHROME-VIEWER-20261011.md) → [B9j](./DIAGRAM-B9J-NATIVE-SAVE-POSITIVE-VIEWER-20261011.md)。读 B9h–B9j 的新增数据时不要将 B9b 的零拥塞 CAS、B9c 的非保存 Viewer 正数或 B9d–B9g 的文件 CAS 并发分别误判为已经完成整条浏览器闭环。

## 三个新增独立 PR

| 阶段 | Draft PR | 真正新覆盖的缺口 | 最新证据 |
| --- | --- | --- | --- |
| B9h | [EVO #620](https://github.com/jiangxng/EVO-App-Platform/pull/620) | 真实合法业务定义 payload.preview2d＋23 相关障碍，正式 App CAS 保存正数拥塞到 File Store，新 App Editor/readonly Viewer GET 均由 Eidos 几何确证 23 障碍拥塞；再次 CAS 隐藏一块后 22 障碍清除 | [Node 133/133 #38068777299](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38068777299) |
| B9i | [EVO #621](https://github.com/jiangxng/EVO-App-Platform/pull/621) | 上述**真正 CAS 持久化正数**的全新 Chrome Designer 与正式 readonly Viewer，两者 SVG count=1、实际路径命中=1、一个 aria 友好且不挡鼠标的提示；第二次 Handler CAS 后重新打开两者 count=0 | [真实 Chrome #38069072194](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38069072194) |
| B9j | [EVO #622](https://github.com/jiangxng/EVO-App-Platform/pull/622) | **真 Chrome 原生鼠标点击障碍＋Remove from view＋Save projection 按钮**，不调用测试 Node 直存，确认局部草稿仍 token=1、真实工具栏 Save 使文件 token=2；全新 Viewer 0/无残留，原业务定义历史不增加 | [真实 Chrome #38069350412](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38069350412) |

**重要结构**：三者各自 Draft；依赖 #619（B9g）→ #620 → #621 → #622。没有 Eidos runtime、新业务 Host 权限、CAS Schema、持久图版本或路由预算代码改动。全部 GitHub 分支与 CI 是 B 类专项，不合并、不部署，不修改 TR-01 或项目主线权威状态文件。

## 首测红色历史也要保留

- B9i 最初 [#38069020504 FAIL](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38069020504)：新专用工作流未像旧 B8u Firefox/WebKit 那样隔离安装 Playwright，报 ERR_MODULE_NOT_FOUND。只在 CI 安装 pinned Playwright 1.56.1，不修改运行时或 lockfile，随后真实 Chrome PASS。
- B9j 最初 [#38069271828 FAIL](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38069271828)：真实点击节点触发正式 App 的 **selection-read Command**，B9i 的只读脚本 HTTP ActionHost 未纳入选择读取 Handler，因此 HTTP400。修复测试服务器为完整使用平台正式 App Editor Handler 集合；不隐藏错误、不伪造选中、不改变被测业务行为，随后真实 Chrome PASS。

## 最关键的事实边界

- **已完成机器级验证**：合法合成企业定义 → 正式 App 允许授权与 File Store CAS Save → Chrome 真 Designer 与 readonly Viewer DOM **1 条拥塞** → UI 真点击隐藏节点**本地变 0 但不写入** → UI 真点击 Save 触发文件 CAS 1→2 → 全新 Chrome Viewer 真实 DOM **0 条拥塞**；浏览器无 JS 错误、Viewer 无 Save、业务定义历史不变。
- **仍未完成商业签收**：客户真实 S2C/P2P 企业业务定义与真实数据量、生产权限服务/多用户审计、云生产数据库和跨服务重启、不同操作系统与物理手机、长时稳定性、基于原规范 §14 的 **39 项正式人工商用验收**。所有正式条目保持 NOT TESTED，不能因为这一机器子场景 PASS 自动提档。
- 之前性能 B8t 的全自动 900/1200 边在合成图中仍有 **21/27 条可见拥塞**；此路线允许明确报警、不会为 100% 通过而偷偷提高 22/2600 路由安全预算。

## 下一步原则

如仍有可用开发预算，可以优先引入**合规且去标识化的企业 S2C/P2P 投影数据 fixture**，同样重跑平台正式 Save→真实 Viewer；不能从现有合成数据推断生产图完全通过。另安排实际 Windows/macOS/iOS/Android 浏览器/触控板及辅助技术验收，逐项填原规范 §14 39 项，而不是用源码 PR 数量衡量产品商用完成度。

当前最新 PR #622 的最终文档 HEAD 需要从 GitHub Actions 再复核绿色；历史 runs 只为原代码版本证据，不冒充后续 commit。只向用户报告已确认的真实子场景以及未测事项，避免卷入主线分支。
