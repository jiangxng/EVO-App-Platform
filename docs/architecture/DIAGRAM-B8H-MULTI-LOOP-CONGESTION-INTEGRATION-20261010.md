# B8h — EVO 2D Designer 多自环和拥堵提示集成（2026-10-10）

## 项目定位
- 上游 [Eidos Draft #149](https://github.com/jiangxng/eidos/pull/149) 独立堆叠 [B8g Eidos #148](https://github.com/jiangxng/eidos/pull/148)，本仓 [App Draft #596](https://github.com/jiangxng/EVO-App-Platform/pull/596) 独立堆叠 [B8g App #595](https://github.com/jiangxng/EVO-App-Platform/pull/595)。只在 Draft 内开发，不改 main、业务关系/definition revision、Agent 授权、Host CAS 或全局状态文件。
- 产品要求和研究继承 [#552 研究/决策资料](https://github.com/jiangxng/EVO-App-Platform/pull/552) 与 `docs/architecture/DIAGRAM-COMMERCIAL-ACCEPTANCE-EVIDENCE-MATRIX-20261010.md`，不虚构本轮重新访问的网络原文。

## 方案与取舍
- 每个节点的显式自环按关系 ID 固定顺序决策，最先到达的保留方向被后续关系计入软惩罚。四面无遮挡时按右、下、左、上分配；一侧有真实可见节点障碍时仍按相交面积计费。手工 waypoint 的方向不被新策略覆盖。
- 五条及更多：重复使用同一侧时增加外侧延伸 32 世界单位，保持 SVG 差异和 handle 可抓；`congested` 明确标识局部仍有占用可能。单条历史右侧路线字节几何不变，曲线 C 和圆角 Q 不退化。
- Canvas hit path 带拥堵诊断及 aria，绘制不接指针的 `!` 警示，保留 44 CSS px 操作区。全侧均被其它节点占用时仍可呈现并编辑，但不谎称获得无障碍路线。
- 大图 B8g 既有空间索引仍使用，未新建全局常驻储存字段；本轮不处理全图其它连线、标签、视口外侧的全局最优避障。

## 测试与证据边界
- Eidos source/Unit 和 App integration：自环四侧保留、第五/六侧错层、多节点拥堵、手工持久方向稳定和异常参数等。
- App Browser Conflict CI 保留 B8g **20-tab** 浏览器回归，并新增 3 页隔离合成场景：第 21 页五个自环的真实 Designer，验证第五条警示/可抓柄并 CDP 鼠标拖动；第 22 页只读 Viewer 仍显示未保存的原测试源；第 23 页四侧被节点阻挡时拥堵证据。浏览器是否全部通过，以 CI run 最终状态为准。
- 合成关系和四侧 blocker 只存在测试 source，不修改生产关系。Chrome CDP 不是物理 iOS/Android/Windows/macOS；测试 Store 不是持久 DB 重启。图边-边、标签、外侧视口裁切的真实冲突处理尚不完整，§14 **39条仍 NOT TESTED**。PR 未合并、未部署。
