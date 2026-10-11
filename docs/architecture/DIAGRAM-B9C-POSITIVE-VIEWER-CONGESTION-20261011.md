# B9c｜只读 Viewer 对真实非零拥塞的展示一致性

日期：2026-10-11。独立 Draft PR #614 (https://github.com/jiangxng/EVO-App-Platform/pull/614)，叠加 B9b #612。均不合并、不部署，不修改 Eidos/Platform 运行时代码、投影契约、Agent/Host 授权、CAS、路由安全预算、TR-01 主线。

## 为什么单独做

B9b 已用真实 App 授权 + CAS Save → 全新 Designer → Enterprise Definition Viewer 验证了保存后**零拥塞图**的摘要不误报。但三处均为 0，不能证明实际拥堵时 Viewer 显示为正数。已有 B8h Chrome 34 Tab 测试通过真实 App 的 Viewer Handler 读取受控五自环图，第五条确有实际拥塞；本轮复用真正浏览器内核绘图而非伪造 SVG 的标记。

## 增量验证

1. 实际 Chrome 浏览器 Designer 五条自环图，其中**一条真实拥塞**，从实际 SVG 检查拥塞计数为 1、命中 path 数为 1，摘要为 1，角色 note、指针事件 none，每条拥塞边仍含 aria-label。
2. 先做设计器原有实际鼠标改线，**不进行 CAS Save**。打开正式只读 Enterprise Definition Viewer，通过同一个 App artifact Source 再算实际 SVG，必须仍是 **1 条拥塞**，摘要正确且没有 Save 控件。
3. App 内存投影 Store 版本仍为 **7**，旧 B8b 保存数据与 34 标签页历史回归均继续执行；CI 强制需要 B9C_POSITIVE_VIEWER_CONGESTION_RESULT 证据事件。

## 强制保留的界限

- 本案例的正例来自测试专用 App Source 包装层，在 GET 时插入五个合成自环。**没有通过 CAS Save 把这五条正例保存进 Store**。不可以将此例混称为“正数拥塞的 App 保存→Viewer 往返”。
- B9b 证明了**真实 CAS Save 之后的零拥塞**；B9c 验证 **App Source→Viewer 非零拥塞**。二者仍不能替代“真实业务障碍图经 CAS Save 后→Viewer 非零拥塞”的完整商业验收。
- 目前不是生产数据库、真实用户企业图、实体设备或服务重启；原 §14 **39 项正式商业验收仍 NOT TESTED**。
- 每次改动应查对应 PR #614 最新 head 的 CI；失败记录不得掩盖。
