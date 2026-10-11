# B8t + B8u｜大规模自动正交与复杂文字跨浏览器证据（2026-10-10）

## 接续入口与职责

- Eidos [Draft #157](https://github.com/jiangxng/eidos/pull/157) 基于 #155；EVO-App-Platform [Draft #604](https://github.com/jiangxng/EVO-App-Platform/pull/604) 基于 #602。两个独立研发分支，不进 main、不部署、不改 TR-01 主线、业务 source/target、Agent/Host 授权、投影 CAS、手工路径和全局状态文件。
- 优先复用已恢复的 [原始商业化要求 v1.0](https://github.com/jiangxng/EVO-App-Platform/blob/docs/diagram-commercial-research-handoff-20261010/docs/architecture/EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md)、[官方来源 S1–S7 原索引](https://github.com/jiangxng/EVO-App-Platform/blob/docs/diagram-commercial-research-handoff-20261010/docs/architecture/EOG-2D-DESIGNER-RESEARCH-REFERENCE-INDEX-20261010.md)与 [B8r+s 文档](./DIAGRAM-B8RS-AUTO-ROUTING-CROSS-BROWSER-INTEGRATION-20261010.md)。本轮没有重新访问那些官网；新增事实来自源码、GitHub Actions CI 和浏览器日志。
- 对应 Eidos 原生专项文档：[B8t+B8u 上游设计与测试边界](https://github.com/jiangxng/eidos/blob/feat/diagram-commercial-budget-text-acceptance-b8tu-20261010/docs/architecture/DIAGRAM-B8TU-BOUNDED-ROUTING-UNICODE-20261010.md)。

## 验收层次（必须按证据分级）

| 事项 | 类型 | 实际已核验 |
| --- | --- | --- |
| 路由原有 22 相关障碍、2600 格点上限、不可达返回 undefined；旧手工路径保持 | 代码不变量 | Eidos B8r+s 源码未改、B8t 上游纯函数测试 PASS |
| 22/23 上限、远障碍过滤、确定性和 64 组合法绕行、ZWJ/字素换行 | 新增自动单测 | [Eidos #38058814582](https://github.com/jiangxng/eidos/actions/runs/38058814582) release-check **321/321 PASS**；[App #38059114823](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38059114823) 对应镜像测试 **5/5 PASS** |
| 真正全部自动正交 SVG、Chrome 浏览器 DOM、原生 CDP 输入 | 自动化真实浏览器引擎 | [App B8t #38059114823](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38059114823) PASS，详细数值见下 |
| 阿拉伯/希伯来复杂音标、英中日混排与 ZWJ、字体墨迹/避让框 | 自动化真实 Firefox/WebKit 引擎 | [App B8u #38059114817](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38059114817) **14/14** 受控样例 PASS |
| 258 条标签可见与 256 次测量预算诊断 | 自动化真实 Firefox/WebKit 引擎 | 两引擎分别报告 `count=258,capped=true`，不是隐藏标签被误算 |
| 实体 iOS Safari / Android Chrome / Windows / macOS 触控板与字体 | 物理硬件验收 | **NOT TESTED** |
| 客户生产企业图、跨数据库重启和全 39 项正式验收 | 商业验收 | **NOT TESTED** |

### B8t：Chrome 全自动正交扩大规模

新建独立 `.github/workflows/diagram-b8tu-acceptance.yml`，由 `EVO_AUTO_B8T=1` 调用现有性能浏览器工具。新模式：`300 节点/900 关系`、`400/1200`；全部 `orthogonal` 或 `rounded-orthogonal`，不使用 manual waypoints；先经真正 Eidos `validateDiagramEditorStateV010` 检查合法，再真实 Chrome 154 挂载完整 DOM，校验边数、SVG、ink quality 和警示，鼠标 CDP 输入做选中与拖动。每档 1 次预热 + 2 次正式，汇总选择中位样本。

**上一代码 head `f785d95a24f13de703dd8a807c07fef8375ee732` 真实 CI 记录**：[run #38059114823](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38059114823) 成功。

| 合法合成图 | mount | select | CDP drag p95 | SVG 数 | JS heap |
| --- | ---: | ---: | ---: | ---: | ---: |
| 300/900 | 160.4 ms | 67.9 ms | 19.14 ms | 1804 | 4.89 MB |
| 400/1200 | 163.4 ms | 80.6 ms | 22.12 ms | 2404 | 7.62 MB |

前一成功 run [#38058967105](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38058967105) 的统计数字因 CI 主机波动不同，**不可将前后两个 run 解释为算法 A/B 加速**。新的 B8t 工作流与原有 B8r、小型 P01、B8o 12,001 straight-heavy 实测口径各自独立；尤其不能用单个 12,001 关系的 `node-only` 降级样本声称 12k 真全自动正交生产保证。

### B8u：文字与 256 上限的可视性陷阱

原有 4 组样例扩成 **7 组 × 两种真实 Playwright 浏览器内核 = 14** 次。新添 Arabic diacritics、Hebrew niqqud、英文/Indic/CJK/职业+家庭 ZWJ Emoji；沿用实际 `getBBox()` 字形宽度/水平位置与原世界坐标 `data-eidos-diagram-caption-world-x` 预留框的严格校验。允许 Firefox/WebKit 的字形宽高不同，禁止强制像素一致。单行标题可以直接留在 SVG `textContent`；多行及截断标题通过 `title` 或 aria 保留原文，**不能因单行缺 `title` 就宣称文字丢失**。

**保留红色证据而非删掉失败历史**：[首次 run #38058967083](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38058967083) 的 258 条边场景 `visible RTL labels=0`。定位实际代码：`surface.ts` 对 >18 条关系的未选中密图只显示选中/关联关系标题，避免文本挤爆，不是校准上限失效。校正**测试夹具**为先选中所有 258 边的共同 source 节点，再通过真实 DOM 断言 258 条 RTL 标签绘出、SVG `data-eidos-diagram-bidi-measure-limit=true`，使每帧最多 256 次昂贵 RTL `getBBox` 的边界可证。没有破坏密图默认隐藏标签策略，也没有扩大测量预算。

[最终 B8u 真实 Firefox/WebKit CI #38059114817](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38059114817)：`B8U_COMPLEX_TEXT_RESULT` 为 14/14，`B8U_MEASURE_LIMIT` 两引擎均 `count=258,capped=true`，且 script errors 为空。WebKit/Linux **不等于**真实 Safari/macOS/iOS，25% RTL 余量亦非所有字体无碰撞保证；超过校准预算的其余标签只标诊断，不承诺皆已精确二次定位。

### 当前完整回归

- App 前一受测代码 SHA `f785d95a24f13de703dd8a807c07fef8375ee732` 的 **8/8 工作流成功**：Platform、Continuity、P01 Performance、B8o Dense、B8q Complex、B8r Auto Full DOM、B8t Budget 和 B8s+B8u RTL。
- Eidos 受测代码 SHA `efb8cc0da8560ade59a858c13ace06286ae4fba4` Eidos CI 321/321 PASS。后续文档变更属于附加记录，CI 是否重跑须按最终 HEAD 区分。
- 两仓堆叠 Draft，保留既有 34-tab Chrome 历史证明但**本 App #604 head 的 8 个 workflow 并不含单独的 Browser Conflict CI**：历史 [34-tab #38057260254](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38057260254) 仍可信但不可直接说最新 App #604 也在同 head 复跑了 34-tab。可在发布前重新触发。
- 本轮 **没有**实体设备、企业真实数据、生产服务部署、正式 §14 **39 项逐项人工签收**。所有这些维持 `NOT TESTED`，不允许新证据矩阵把部分 CI 自动子场景写成商用完整 PASS。

下一阶段：固定合法、多路由与长期压力采样；不同平台字体/Safari/iOS/Android 物理操作；真实企业投影保存→刷新→Viewer→重启后的数据验收，再按 §14 逐项验收。涉及权限/实体资源应交给对应 App 主线统一审查，不能由此 B 类私改。


## B8t 追加严格降级可访问性验证（2026-10-10）

在上述 Chrome 测试基础上，又在真正 full DOM 的每档场景查询 `[data-eidos-diagram-route-congested]`，**并严格断言没有任何缺失 `aria-label` 的拥塞关系**。浏览器确实表明有的自动路线因原有局部安全预算或布局条件不足而拥堵，不能把 `inkQuality=full`（墨迹索引精度）误当“全部连线没有拥堵”。

[追加 Chrome B8t run #38059395563](https://github.com/jiangxng/EVO-App-Platform/actions/runs/38059395563)（受测代码 `a4e14415be54df7b90d3b8106c969aa52a40c40f`）PASS，独立两正式样本/档：

| 合法全自动图 | mount | select | CDP p95 | 拥塞（已带 aria） | JS heap |
| --- | ---: | ---: | ---: | ---: | ---: |
| 300/900 | 101.5 ms | 44.0 ms | 19.49 ms | **21/900 (2.33%)** | 5.23 MB |
| 400/1200 | 100.1 ms | 52.5 ms | 21.68 ms | **27/1200 (2.25%)** | 4.90 MB |

这是新增的一轮 CI-host 采样，不能与上轮不同 runner 的速度简单比较。**结论应分开写**：全部关系确实采用自动正交模式；全图 DOM/真实浏览器性能测试通过；其中 21/27 条触发**可见可访问的拥塞降级**，没有证明全图“零碰撞”或“100%自动绕行成功”。这些样本仍是合成合法状态，不是生产企业图。安全设计保持不越过预算，因此拥堵时允许诚实提示并由人工调整。

**版本追踪**：后续新增仅文档类型提交不改变此次受测浏览器代码；但必须按 PR 最新 head 的 Actions 重新判断总体绿色结论。
