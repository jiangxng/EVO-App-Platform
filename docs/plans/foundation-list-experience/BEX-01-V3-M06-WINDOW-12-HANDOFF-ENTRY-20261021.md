# BEX-01 V3 M06｜Window 12 新窗口简短交接入口（2026-10-21）

> **顺序**：先按仓库 [AI-BOOTSTRAP.md](../../../../AI-BOOTSTRAP.md) 读取项目强制启动集，再看**本入口** → [本窗口详细研究资料与决策索引](BEX-01-V3-M06-WINDOW-12-RESEARCH-DECISION-REFERENCE-INDEX-20261021.md) → 相关源码/最新 Actions 与 PR。不要按聊天摘要推断最新 main、合并或生产状态。**本入口是 2026-10-21 核验快照，不自动滚动更新。**
>
> **owner 边界**：只在现有 BEX Draft [#1086](https://github.com/jiangxng/EVO-App-Platform/pull/1086) 的原分支追加这两份交接文档；不修改全局 `project.status.json`、生成的 `HANDOFF-LATEST.md`、共享核心/业务代码、PA05/EOG/治理的并行文件，不合并 Draft、不碰客户原数据/Railway。既有文档保留原样。

## 一、用户真正要求与本窗口目标

对供应商导入 **BEX-01 V3** 按 [#909 可交互高保真原型](https://github.com/jiangxng/EVO-App-Platform/pull/909) 验收**真实可用**的 Host 页面，不是只凑像素或 CI 绿灯；保留 M01–M06 的原任务定义、原始来源、真实银行同名字段、人审/Schema/预检/明确提交与权限边界。换窗口要**继承已访问资料和失败记录**，不重复做网络研究，不新起相同分支/PR，不走已证无效方案；同根因集中修改→真实 Host 测量/截图→精确 HEAD CI→独立 Human 签收。本次用户明确要求将研究与决策拆为**简短入口 + 详细参考索引**并保存 GitHub。

## 二、准确状态（文档写入前核证，后续须重查）

| 对象 | 2026-10-21 核证事实 | 结论 |
| --- | --- | --- |
| Platform `main` | `4e21fa8d0380168f9da0ae8a364020da1b9a3f90` | 较三层同步时 `192b1948…` 多 2 个身份目录/治理提交（10 文件），当时与 BEX 20 文件无交集；下次合并前再次检查 |
| 上游 [#1060](https://github.com/jiangxng/EVO-App-Platform/pull/1060) | `feat/bex01-v3-real-fidelity-clean-mainline-20261020` @ `ff38cbf6b7fe9264b18ef1a1e2730e8505978905`；base `main` | Draft OPEN；正常双父 merge 已融合旧 main；20 个本层改动文件；**10/10** exact-HEAD CI SUCCESS |
| 中层 [#1077](https://github.com/jiangxng/EVO-App-Platform/pull/1077) | `feat/bex01-v3-m06-file-footer-parity-20261020` @ `2c2b6bb8ed8f6c9f23e1e8f63a4b070dac7e17cf`；base #1060 分支 | Draft OPEN；18 个本层增量文件；**14/14** CI SUCCESS |
| 当前唯一实施/交接 [#1086](https://github.com/jiangxng/EVO-App-Platform/pull/1086) | `feat/bex01-v3-m06-evidence-density-20261021`；**写文档前基线 HEAD** `60f1e11a4913febda17e4a2cefc659be2ceda4d3`；base #1077 分支 | Draft OPEN，10 个本层增量文件；本次文档 commit 将产生**新的** HEAD，不能将旧 CI 冒充新 HEAD 的 CI |
| #1086 最近真实业务回归 | [run 39549354838](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39549354838) / [artifact 12322028969](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39549354838/artifacts/12322028969) | 写文档前 `60f1e11` **7/7** CI SUCCESS；isolated real Host Chromium 5/5 PASS；非真实生产 |
| 六项里程碑 | M01–M03 工程完成；M04/M05/M06 仍 OPEN | **3/6**；Human、客户原 Excel、真实导入未签收/未执行 |

**当前的推进焦点已从“继续调 CSS”转为“Human 审核同态全页 + 三处有理由的产品差异”**；不要以无效样式迭代替代真正签收。

## 三、已经决定、已证实，不要重复

- 业务口径：`SUPPLIER`（关系）不等于 `ORGANIZATION`（主体类型）；3 条缺失主体类型是**行级纠错**，不得批量猜；同名“开户银行”必须展示不同 fieldId 和可信用途，不能按名称/EC 猜一个字段；原 Excel 列保留，排除仅对本次导入生效。
- 工程实施：Eidos 提供通用 `workbench`/审核表/响应式、原生展开和触控，Platform 提供真实 Job、业务语义、字段与权限、Host 命令。默认用 opt-in，不以截图原型生成第二套 Host UI。
- 当前真实样本：同态 synthetic 22 列 172 行页面呈现 **16 已匹配／4 待新增／0 忽略／3 项问题**，其中当前“需要关注”筛选 **6/22**；与旧 retained-XLSX `4 matched / 17 proposed / 1 ignored / 0 issues` 夹具**不是同一视觉基准**。
- 可重复的真实截图证据（#1086 `60f1e11`）：`v3-visual-parity-desktop-contiguous-00..02.png`（**3 帧**），`v3-visual-parity-phone-contiguous-00..05.png`（**6 帧**）；各有 `*-scroll-manifest.json`。两组贯通文件卡、四统计、三问题、六待关注列、来源展开与真实操作区。旧 `v3-e4-map-phone-contiguous-00..09.png` 的 10 帧来自**另一夹具**，不可混为同态验收。
- 实测已关闭：桌面文件卡 86px、统计卡 98px、问题行 85/86/86px、普通映射行 58px；手机统计卡 86px，问题行密度与顺序已调；手机示例值/来源折叠同行，底部 3 个动作各 340×44px；同名银行两 ID 在小屏选中状态可区分，分别选择/重置/手机刷新后不自动保存均 PASS。**技术 PASS≠Human 视觉 PASS。**
- 迭代止损：只把来源折叠改为 inline **没把 73px 行缩短**；真正根因是 selector `label` 上下各 12px margin，局部修正后 58px。另有 CI 失败来自脚本/选择器/正则转义而非产品，详见索引 §4，**不要重演**。
- 三层 Draft 已按 #1060 → #1077 → #1086 依次用正常**双父** merge 与当时 main 同步；验证差异集合相互不重叠（20/18/10），各层精确 HEAD CI 全绿。**没有合并任何一个业务 Draft 进 main**。

## 四、Human 仍须回答的结论，勿自动代签

| 问题 | 本窗口建议（**尚未获用户批准**） |
| --- | --- |
| 原型筛选 **7/22** vs Host **6/22** | 推荐保留真实 **6/22**；三条主体类型缺失是另列的问题列表里的行级异常，已匹配的主体类型列不应为凑数重复算作待关注字段 |
| 独立原型壳 vs 真实 Host context/语言/应用导航 | 推荐接受真实 Host 导航及授权上下文，不为截图一致删除正常系统操作 |
| 原型“预检查并继续/更改将自动保存” vs Host“保存映射并预检查” | 推荐保留准确的显式保存/权限与预检语义；不能假称自动保存 |
| 整体视觉和真实操作 | 还需用户亲自比较 #909 与上述同态桌面/手机逐帧证据，明确接受/修改并**单独决定 M06 PASS** |

**M04/M05 独立阻塞**：当前没有客户原始 Excel `往来账户2026_10_08_10_15_23.xlsx` 与有效授权 Import Job 的新核证内容；客户真实两个开户银行的 fieldId/用途、三条客户主体身份尚未 Human 决定。Synthetic 银行 ID `ext_f12edb430f8c67dd`、`ext_7932cf289595ef82` **不是客户真实身份**。不执行真实客户 dry-run/入库、Schema 创建、正式导入或生产发布。

## 五、下一窗口最小执行路线

1. 启动顺序：`AI-BOOTSTRAP.md` → `project.status.json` → `docs/roadmap/HANDOFF-LATEST.md` → `LLM.md` → `llm.foundation-map.json`；再读本页和[详细索引](BEX-01-V3-M06-WINDOW-12-RESEARCH-DECISION-REFERENCE-INDEX-20261021.md)，以及交付工作流／止损规程。**先核查 #1086 最新 HEAD 与 base、#1060/#1077、main，切勿以本页旧 SHA 作为现时状态。**
2. 先用 GitHub 的原型源码/旧图和 [最新同态截图附件](https://github.com/jiangxng/EVO-App-Platform/actions/runs/39549354838/artifacts/12322028969) 做 Human 视觉对照；只就四项 Human 决定（前三处差异 + M06 整体）请求接受/拒绝。用户已经在上轮被问过，**无需反复长问卷**。
3. 如有明确拒绝或复现缺陷，集中修“已被指出的共因”，先最小真实 Host 校验，再最终 HEAD 相关 CI；如接受，则按项目 Human 签收证据流程处理 M06，但不自动推进 M04/M05。
4. 分支始终是 #1086 原分支；只在明确可合并和获得相应验收后按 #1060→#1077→#1086 顺序执行正式 PR 集成。并行主线随时前进，合并前重查 main，不覆盖 PA05/治理。不得因为切换聊天而新开重复 PR。
5. **待核的历史问题**：外站官方材料是否已有更新、2026-10-16 用户 S01–S04 四张原图的永久附件、真实客户 Excel/授权 Job、Human 真机/真实登录 UI 签收。未取得的标为 D，不用合成证据填空。

> 证据级别、原始网络 URL、研究历史、方案排除、失败与换路、完整 CI 清单、跨窗口截图位置与代码落点全部见 [配套详细索引](BEX-01-V3-M06-WINDOW-12-RESEARCH-DECISION-REFERENCE-INDEX-20261021.md)。
