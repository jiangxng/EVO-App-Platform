# CV-05 Window11 / 自动续跑 #04/08 — Real Host Chromium 交接

**基础提交：** \`main@1d8c1ebd0ec7e3daeb0c1e901e07263cb2e01fcd\`，对应此前 #1317 已合并的脚本化模型 → 真实 Action Host → Eidos 路由重新授权回归。#1314/1315/1316 的预览、聊天导航与 Tokyo \`agents/\` 发布门禁均已合入。本切片只补浏览器可见操作的机器证据，不变动业务授权/列表实现。

## 采用的复用路径

1. 既有 CV04 隔离 Host fixture 已经创建两企业、合成客户/供应商/字典、真实 API、可访问 Eidos 体验，并且拥有现成 Playwright 的 1280/390 测试；**不复制这份 fixture**。
2. 新增薄的测试准备器只调用 Host 原 \`/v1/actions\` 有权 READ，接既有 CV05 Preview Adapter 与 Eidos Chat Renderer 构建浏览器待点击消息；没有新的 Model/Repository/ActionRouter，也不触碰供应商受限字段和 CSV 全量导出。
3. 新隔离 Workflow 启动已存在的 Host fixture，使用 Playwright 自动触发真实 Eidos 浏览器导航，采集 Chat/List/B 企业三种视图截图并写 JSON 检查。验证返回筛选与企业切换后真正重读 Owner，不通过自行在页面塞入列表数据来伪造成功。
4. 这是**浏览器自动化且模型消息注入**的分层证明：既不等于真实在线模型对话，也不等于人工签收。此前 #1317 已独立验收模型工具执行协议，本次只验证最后一跳浏览器交互。

## 门禁与后续交接

独立分支 + Draft PR，精确 SHA 的 Platform/Lightweight/Continuity + CV05 Chromium 工作流全部通过后才能 Ready→受保护 main。所有原始运行日志/截图作为证据，失败须先定位并在同 PR 修正；测试/文档/Workflow-only 合并按东京 preflight 正确 SKIPPED，不制造部署。

已核实的生产边界保持：#1092 Operator OPEN；#1212 Owner OPEN，N1=NOT_CERTIFIED；#1184 其他窗口管理。CV03 Human SAVE OFF，CV04 正式后台 EXPORT OFF。不得将测试身份或 CI GREEN 抬升为真实生产认证。

原研究/决策继续参见 [Window10 研究入口](CV04-WINDOW10-20261113-RESEARCH-HANDOFF-ENTRY.md)、[来源决策索引](CV04-WINDOW10-20261113-RESEARCH-SOURCES-DECISIONS-INDEX.md)、[CV05 #03/08 证据](CV05-WINDOW11-20261113-0308-MODEL-HOST-EIDOS-REAUTH-ACCEPTANCE.md)；UI 设计记录位于 [CV05 Chromium Review](../../ui-design-reviews/CV05-WINDOW11-20261113-0408-CHROMIUM-AGENT-LIST-REVIEW.md)。

本文件创建时只记录待 CI 证明的工程事实，不先宣布结果成功；合并及最终 Main/Tokyo/Branch Hygiene 原始核验追加同一 PR 评论，避免生成重复文档 PR。
