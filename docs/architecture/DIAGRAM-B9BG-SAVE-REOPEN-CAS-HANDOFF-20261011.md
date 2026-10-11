# EVO 2D Designer B9b–B9g｜投影保存、只读 Viewer、文件持久化与授权并发交接

归档日：2026-10-11；**专项 B 类独立 Draft 链路，不改主线 TR-01，不合并、不部署**。上游基线 B8v/B8w、B8x、B8y、B8z、B9a 均有各自独立 Draft PR 和原始验收矩阵，当前沿该历史继续小步验证，保持原始研究索引与用户确认的 mouse/touch/auto-layout/语义不可变原则。新会话先读取本文件，再按具体子场景读取对应原文和 GitHub Checks。

## 当前独立 stacked PR（禁止当成已经合并）

| 阶段 | PR | 变更边界 | 实际能证明 |
| --- | --- | --- | --- |
| B9b | [#612](https://github.com/jiangxng/EVO-App-Platform/pull/612) | 浏览器脚本、CI、文档 | App 授权 CAS Save 后的新 Designer / Viewer 0/0/0 无假拥塞摘要，Chrome 34 tabs |
| B9c | [#614](https://github.com/jiangxng/EVO-App-Platform/pull/614) | 浏览器脚本、CI、文档 | App Source 受控注入 5 自环→真只读 Viewer 的非零 1/1 拥塞摘要，**未 CAS Save 这个正例** |
| B9d | [#615](https://github.com/jiangxng/EVO-App-Platform/pull/615) | 1 个新 App 集成测试、CI、文档 | 正式 Handler 授权 CAS→正式 FileProjectionStore→重建 Store/Handler→Viewer GET，token 0→1，旧 token 不可覆盖、业务历史不变 |
| B9e | [#617](https://github.com/jiangxng/EVO-App-Platform/pull/617) | 1 个多进程 Store 测试、CI、文档 | **两个 Node OS 进程**竞争底层文件 Store expectedVersion 1，1 个获胜、另一明确冲突/锁拒绝，进程重开版本 2，孤儿锁 fail-closed |
| B9f | [#618](https://github.com/jiangxng/EVO-App-Platform/pull/618) | 两个进程用脚本、1 个 App 测试、CI、文档 | **两个独立 App Handler OS 进程**带模拟允许授权向同一文件投影 expectedToken 0 保存不同 camera X，恰一个成功，另一拒绝，新 Store 完整保存唯一获胜结果 |
| B9g | [#619](https://github.com/jiangxng/EVO-App-Platform/pull/619) | 1 个 App 测试、CI、文档 | **明确拒绝授权**时不会创建磁盘 Store；允许 Save 之后再次拒绝**当前 token** 的覆盖，真实 Viewer GET 只能显示许可提交 |

依赖关系严格沿分支依次堆叠：#612 → #614 → #615 → #617 → #618 → #619；各 PR 应只反映相对**直接父分支**的小差分，不可对 main 直接 merge。Eidos 通用引擎的 B8v/B8w 为 [eidos #158](https://github.com/jiangxng/eidos/pull/158)；本 B9b–B9g **没有新的 Eidos runtime 修改**，App vendor Eidos 的 Host 导航和既有授权规则不动。

## 真实测试与不得混淆的证据

- [B9b Chrome CAS/34-tabs #38067528086](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38067528086) PASS，真实 Chrome 154 Saved/New Editor/Viewer 全为零拥塞，Store 版本 4，业务历史 1。
- [B9c Chrome 正数 #38067825029](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38067825029) PASS，真实 Eidos SVG 正数 1 与只读 Viewer 1，笔记 role-note/pointer none，内存 Store 版本 7，正例来自 test-only Source 叠加而非授权 CAS 写入。
- [B9d App File Store #38067979006](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38067979006) PASS，129/129；前后 Viewer 业务关系仍正确、隐藏和手工路径沿文件保留、旧 token 0 被拒。
- [B9e 跨进程 Store #38068173599](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38068173599) PASS，130/130；跨进程写入 CAS 和锁失败明确。
- [B9f 两真实 App Handler #38068348194](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38068348194) PASS，131/131，两个 OS 进程模拟授权成功、不同 camera 候选，最终只有一次真实 Handler 提交。
- [B9g 授权拒绝 #38068500982](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38068500982) PASS，132/132，deny/allow/deny 三态真实 App Handler 文件检查，重开 Viewer GET 正确。最新各 PR head 的 CI 要在文档提交后**另行核对**，旧 runs 不代替新提交的 Checks。

## 当前尚未攻克的真实差距（仍然 NOT TESTED）

1. **真实非零拥塞完整 CAS Save→数据库→浏览器全新 Viewer**：B9b 是保存后 0，B9c 是正数未保存；两者不能拼接成不存在的端到端生产正例。
2. 当前持久层验证使用正式文件 Store 和临时文件，并非生产企业数据库/跨主机网络盘；业务定义仓与授权策略仍是受控测试上下文。B9f 的多进程不是实际两个登录的企业用户，也不替代鉴权审计。
3. 未将实体 iOS/Android/macOS/Windows 的触控板/触摸/字体以及客户真企业 S2C/P2P 图做完整人工签收。
4. 原始商业化要求 §14 **39 项正式验收全部 NOT TESTED**，机器子场景 PASS 只作证据，不自动把完整项改成 PASS。
5. 任何业务 Host 真实授权接口/主线存储 API 变更，需要在原主线对齐设计；不得在这个 B 类 PR 悄悄覆盖。

## 下一条优先小步

- 优先构造**合法且可由平台实际投影 CAS 保存**的非零拥塞业务图：从已确认的真实 ProjectionStore、Viewer 语义和 Eidos 的 `data-eidos-diagram-route-congested` 入手，保留拥塞安全预算，不在 Eidos 中魔改路由或把测试用的 Source 注入伪装成已持久化数据。
- 进一步用真实有访问权限的企业数据和真实浏览器独立 Viewer 重启验证，再执行原 §14 逐项人工商用验收。
- 所有 PR 继续 Draft、不合并、不部署，每次提交附 CI / 失败历史 / 新旧实际证据差异，不能用概述代替子测证据。

详见同目录 DIAGRAM-B9B、B9C、B9D、B9E、B9F、B9G 各专项文档与 DIAGRAM-COMMERCIAL-ACCEPTANCE-EVIDENCE-MATRIX-20261010.md。
