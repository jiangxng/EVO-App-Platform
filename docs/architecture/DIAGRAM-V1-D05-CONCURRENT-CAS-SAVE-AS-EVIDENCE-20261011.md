# Diagram Commercial v1.0 / D05 — 双窗口冲突、原投影保护与另存
日期：2026-10-11。

## 固定权威
原商业化要求 §14 D05。复用已完成的 B7 正交 Projection Store CAS、双会话冲突、失效令牌拒绝和 Save As 不覆盖原投影。此 PR **不重新设计** CAS，不更改 Host 授权，不修改业务定义。

## 实际浏览器子场景
打开两套真实 Chromium 标签页，同一个独立企业投影、同一个初始 writeToken。先在 A 用原生鼠标拖动业务节点并明确 Save，检查版本从 5 到 6；再在持有过时 token 的 B 原生鼠标选择并隐藏业务关系，点击 Save，必须返回冲突、版本保持 6、B 原本未保存草稿不丢失、原投影继续保留 A 的节点位置和关系。最后 B 主动通过产品“Save as projection”新增独立投影，版本从 6 到 7，原投影不被覆盖，新增投影保有隐藏关系。两个投影通过实际产品 GET handler 分别回读验证。

CI 必须出现 `DIAGRAM_D05_BROWSER_SUBGATE`。日志与通过/失败只以最新 PR head 的 Actions 为准。合成有效 Enterprise Fixture、Chrome 原生鼠标、FileStore CAS 并不代表线上分布式数据库上的压力测试、跨真实企业身份、不同物理 Windows/macOS/iOS/Android、正式客户验收。

**正式人工签收 0/39；D05 原始人工验收 NOT TESTED。** 不改主线、Agent、账本运行时和全局权威矩阵。
