# CV07 / Foundation List Experience — 2026-11-26 旧窗口恢复：研究、决定及证据索引

## 0. 证据与范围
恢复基线：受保护 main @ 44da0a35ccf3191d90b9817fc21ffa667628a3b7（2026-11-26 GitHub branch GET）；仅 CV07 列表/业务字典与共享 Data Import/Eidos 切片。本文不是原窗口逐字备份。
- P：用户消息/旧聊天可恢复摘录或旧文档记载截图；截图原像素未重新取得。G：本轮直接读取 GitHub PR、patch、文档或 Actions 原日志（逐项指明）。H：仓库历史研究记录，保留原阅读级别（H→O 原文记录、H→S 摘要记录），未重新打开外站。U：未恢复/待验。
- 用户本轮贴出旧窗口末尾结论；已另检索历史聊天与会话/Library 文件，未找到完整独立聊天导出或193行原始 CSV/四张原图。没有重读未获取的内容，也没有以其他窗口的资料冒充本窗口来源。没有向外站发起重复研究；没有用户数据、登录凭据、生产写入或收费模型请求。
- 证据等级独立：提出 → 实现 → 自动测试/CI → 物理部署 → 授权 Human 签收。后者不得由前者推断。

## 1. 明确要求与决定
| 要求/来源 | 确认决定及范围 |
|---|---|
| 用户11-25：复核 Eidos 界面元素；List Foundation 应有导入功能 | 复用现有 Catalog Browser、Data Import、Domain Owner target，不造第二套导入/列表框架 |
| 用户11-25：不要为了手机端降低 PC 设计；按之前设计语言优化 | 桌面优先功能分组，手机独立重排；状态视图、展示模式、搜索/列设置同一工作面；视觉 token 不变。见 #1383 |
| 用户11-26：第二步没有导入；确认默认字段是否缺失；补齐字典编辑；字典有父子关系 | 三阶段明确确认，精确表头别名与可选 parentCode；字典定义与字典项分开编辑；DRAFT 和 PUBLISHED 独立。见 #1384 |
| 已继承 CV07 11-19 工作线约束 | 原 Eidos + Platform + Owner + Agent；有权 READ、轻量 Host，正式 CV03 Saved View WRITE、CV04 后台 EXPORT、PA05/Agent WRITE、OIDC 不因 DEV 通过打开；不触碰并行 #1184。私有模型方向/收费 QA 不作为此切片阻塞。 |
| 仓库治理 | 受保护 main 为唯一集成主线；按既有 CV07 交接流程，独立最短交付分支、Draft→准确 HEAD 门禁→Ready→普通 merge、main CI、docs-only 合法跳过部署、精确合并分支清理；不直接 push、强推或批量删其他分支。此恢复只增加 docs。 |

## 2. 研究资料索引：保留已取得来源而不重复查阅
| 原始 URL / 资料 | 既有查阅日期与等级；本轮复核 | 结论及用途 |
|---|---|---|
| [CV07 11-19 研究参考索引](CV07-WINDOW-20261119-RESEARCH-REFERENCE-INDEX.md) 与 [原始竞品索引](COLLECTION-VIEW-AI-NATIVE-REFERENCE-INDEX-20261106.md) | 11-06/11-19历史；本轮11-26 G 读前者正文（重点§0–5及来源表） | 保留外部来源的原始日期、URL、原阅读级别及限制；不覆盖旧文件 |
| [SharePoint list views](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-change-or-delete-a-view-of-a-list-or-library)、[Server 2019 limits](https://learn.microsoft.com/en-us/sharepoint/install/software-boundaries-limits-2019) | 11-06 H，11-19索引转引；本轮未重开 | 过滤/排序/视图配置分离；查询阈值非总体容量；不照搬365特性或5000硬限 |
| [Odoo View architectures](https://www.odoo.com/documentation/19.0/developer/reference/user_interface/view_architectures.html)、[Power Apps grid](https://learn.microsoft.com/power-apps/maker/model-driven-apps/the-power-apps-grid-control) | 11-06 H，未重开 | 同一模型多种展示、声明列配置；不复制 XML/Python 或 Excel 式复杂 Grid |
| [SAP Fiori List Report/Object Page](https://help.sap.com/docs/SAPUI5/d625376e710e40cb9d40e43e1b02933b/c0eec49db81a441e878f528c8f3d28de.html) | 11-06 H，未重开 | 列表→详情→返回为配套流程；复用 returnTo |
| [明道云视图](https://help.mingdao.com/view/introduction/)、[应用介绍](https://help.mingdao.com/application/introduction/) | 11-06 H，未重开 | 表、视图、权限、流程职责不同；不造万能事实表 |
| [WAI-ARIA Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) | 11-06 H，未重开 | Grid 焦点复杂度；保持原生语义，真实键盘/读屏另验 |
| GitHub environments/secrets/manual workflows/triggering workflows，OpenAI/DeepSeek Responses、DeepSeek 价格原网址 | 11-19 历史，分别 H→O / S / 局部 O；详见 11-19 索引 GHD01–04、API01–05 | 保留局部原文与摘要区别；模型 ID/价格冲突未解决，非本工作线阻塞，不重新做收费研究 |
| [Eidos Human Experience Design Authority](https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-HUMAN-EXPERIENCE-DESIGN-AUTHORITY-v1.0.md) | 11-25 旧评审记载已读正文 H→O；11-26 G 复读评审，不冒充上游原文重读 | Human Directness / Functional Proximity / Ownership；复用既有页面 |
| [Eidos Productive Design Language](https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-PRODUCTIVE-DESIGN-LANGUAGE-v0.1.md) | 同上 | 4px rhythm、约三组工具栏、单 primary，视觉密度桌面32–36px/触控44px |
| [Eidos Business Office Visual Language](https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-BUSINESS-OFFICE-VISUAL-LANGUAGE-v0.2.md) | 同上 | 中性/白色工作面、克制蓝色、桌面快速扫描；不造插件私有皮肤 |
| [Eidos Enterprise Navigation & IA](https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-ENTERPRISE-NAVIGATION-INFORMATION-ARCHITECTURE-v0.1.md) | 同上 | 状态/模式属于工作面，不加全局导航 |
| [Eidos Human UI Checklist](https://github.com/jiangxng/eidos/blob/main/docs/product/EIDOS-HUMAN-UI-DESIGN-REVIEW-CHECKLIST-v1.0.md) | 同上 | 分级证据；不能以自动测试签 Human |
| [11-25 桌面优化评审](https://github.com/jiangxng/EVO-App-Platform/blob/44da0a35ccf3191d90b9817fc21ffa667628a3b7/docs/ui-design-reviews/CV07-EIDOS-DESKTOP-COLLECTION-20261125.md) | 11-26 G 正文；§权威/布局/无障碍/证据 | 1096×528问题截图历史记载；PC 同排分组，窄屏重排，空态；保留 ≥44px 实际命中面积（高于32–36视觉建议的既有 Chromium 产品门禁）。上游 Eidos 与 vendored 漂移需审查，不能覆盖 |
| [11-25 导入交付及回执](CV07-WINDOW-20261125-EIDOS-DICTIONARY-IMPORT-DELIVERY.md) | 11-26 G 正文 | 注册 target、权限、事务、发布隔离；旧协议1503 PASS与旧镜像仅为历史 |
| [11-26 字典层级/导入评审](https://github.com/jiangxng/EVO-App-Platform/blob/44da0a35ccf3191d90b9817fc21ffa667628a3b7/docs/ui-design-reviews/CV07-DICTIONARY-HIERARCHY-IMPORT-20261126.md) | 11-26 G 正文 | 七列、三阶段、父子层级、无障碍、保护范围及未签收。原文件中的“待CI”是合并前记录，以§4最新原证更新，不改历史文档 |

## 3. 方案取舍、冲突与限制
| 事实（来自用户/文档/代码） | 采用/排除（工程决定） |
|---|---|
| #1379 原生列按钮无共享样式；#1383 1096px 工具条三排占用工作面 | 共享 Eidos DOM/CSS 分组、搜索限宽360px、区分空企业/筛选无结果、手机独立重排。排除插件独立CSS、移动布局主导桌面、浏览器自行过滤。原生 nav/form/details/table 保留。 |
| #1381 列表预设 returnTo 与可选角色冲突 | 复用 Owner completionNavigation 筛选可选项；独立 Import Center 不限同样角色；保留服务器最终拒绝，不新造路由或放宽权。 |
| #1382 有效 Owner IMPORT schema 动态含扩展字段 | 生成 UTF-8 BOM 仅表头 CSV、可写可读字段、歧义/公式风险退回稳定ID；有权 READ ActionHost 下载；排除静态Excel样例和公共文件接口。当前无独立上下文模板按钮的完成声明。 |
| 截图七源列：选项主键、字典编码、字典名称、选项编码、选项名称、来源别名、状态；旧7目标字段 | 4列已匹配；来源别名/状态增加精准 aliases（optionAliases/optionStatus）；可选第8目标 parentCode。选项主键貌似组合键但无法证明，必须显式决定，原 Source 保留；禁止静默拼拆或映射到其他 code。若确需独立外部ID，由Owner另定审计字段。 |
| 原顶部“核对并导入”，实际按钮仅保存并预检 | 文件→字段映射/预检查→独立确认导入 Host COMMIT→草稿→单独Human发布；排除自动业务写入、预检即导入或自动发布。 |
| 原选项无父级字段 | 同字典稳定 option.code/parentCode，允许同批父在子前后；Owner validateBatch预检+最终仓库原子树校验；拒绝不存在、自指、环；旧根项兼容。排除按名称/缩进猜父级、跨字典继承、级联删除、拖拽排序（本次范围外，非永久否决）。 |

## 4. 直接核验的提交、代码和运行证据（2026-11-26）
| PR / merge SHA | 状态、证据边界 |
|---|---|
| [#1379](https://github.com/jiangxng/EVO-App-Platform/pull/1379) fb2abcbe21a534eecf944a51c40dad12c3494606 | G 已合并：共享列工具栏、字典 CSV/XLSX target、授权/草稿。11-25交付原件载53/53及1503测试历史结果。 |
| [#1380](https://github.com/jiangxng/EVO-App-Platform/pull/1380) 162cc8509485aaeef6bf81f0489902c4884f48ee | G 已合并：11-25物理部署证据补录，历史文档 main 与当时实际镜像不同 |
| [#1381](https://github.com/jiangxng/EVO-App-Platform/pull/1381) c9352d8722040719bdb93be6d58837b2f7f09d63 | G 已合并：Customer/Supplier 列表范围导入选择修复 |
| [#1382](https://github.com/jiangxng/EVO-App-Platform/pull/1382) 0cab9833c0df5fd692b5a4cd9b174c0a46c13c37 | G 已合并：动态空白CSV模板 |
| [#1383](https://github.com/jiangxng/EVO-App-Platform/pull/1383) 7adad4ca3b35b7d0c5f6fa8e3af07636ef7bbcb0 | G 已合并：桌面优先工具条、空态；评审/PR读取，未单独重跑各历史 PR CI |
| [#1384](https://github.com/jiangxng/EVO-App-Platform/pull/1384) 44da0a35ccf3191d90b9817fc21ffa667628a3b7 | G 已合并普通 merge；PR head f32f81475837e758a49dbfa6e4bf6eb1408d059d；60 checks:55 success/5 skipped，0失败（不是60/60成功）；main check-runs 返回30条全部 success。 |
| [Platform CI #45745884080](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45745884080/job/139661711233) | G 原日志 UTC02:59；1521 tests, 1520 pass, 0 fail（差1不计PASS）。新增 hierarchy/published history、orphan/self/cycle、contextual add child、别名/组合主键、批次预检等明确 ok。未自行运行测试。 |
| [Tokyo deploy #45745953221](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45745953221/job/139662488461) | G 原日志 UTC03:02:43：docker compose 实际镜像 ghcr.io/jiangxng/evo-app-platform:44da0a35ccf3191d90b9817fc21ffa667628a3b7、healthy，LOCAL_HEALTH/HTTPS/BASIC_AUTH PASS。构建 manifest digest sha256:8eb22e37655ef28f0fa141c473dc12460759d5b9e7d54611b14a5d5a8ee448b6 非独立容器digest。 |
| [Tokyo inventory #45746378713](https://github.com/jiangxng/EVO-App-Platform/actions/runs/45746378713/job/139663345526) | G 原日志 UTC03:03:08：同SHA/healthy；BUSINESS_DICTIONARY、DATA_IMPORT 均 PACKAGE_INSTALLED=YES / FEATURE_ACTIVE_IN_PERSISTED_STATE=YES；ACTIVE_ENTERPRISE_WITH_OWNER_PRESENT=YES；ITEM_RESOURCE_IN_ACTIVE_ENTERPRISE_PRESENT=NO / ITEM_RESOURCE_PRESENT_IN_PERSISTED_STORE=NO。AUTHORIZED_BUSINESS_SESSION=UNVERIFIED、HUMAN_ACCEPTANCE=NOT_SIGNED；HTTPS/Basic Auth 边界 PASS。只读巡检不是企业实际业务操作。 |

### 源码（#1384 本轮直接读逐文件 patch；固定版本链接）
- [dictionary contract](https://github.com/jiangxng/EVO-App-Platform/blob/44da0a35ccf3191d90b9817fc21ffa667628a3b7/contracts/reference-data/dictionary.ts) parentCode；[schema](https://github.com/jiangxng/EVO-App-Platform/blob/44da0a35ccf3191d90b9817fc21ffa667628a3b7/contracts/foundation-object/schema.ts) importHeaderAliases；[import contract](https://github.com/jiangxng/EVO-App-Platform/blob/44da0a35ccf3191d90b9817fc21ffa667628a3b7/contracts/foundation-object/import.ts) validateBatch。
- [Owner repository](https://github.com/jiangxng/EVO-App-Platform/blob/44da0a35ccf3191d90b9817fc21ffa667628a3b7/apps/business-dictionary/repository.ts) 完整图校验；[actions](https://github.com/jiangxng/EVO-App-Platform/blob/44da0a35ccf3191d90b9817fc21ffa667628a3b7/apps/business-dictionary/actions.ts) definitionOnly/parent；[import-target](https://github.com/jiangxng/EVO-App-Platform/blob/44da0a35ccf3191d90b9817fc21ffa667628a3b7/apps/business-dictionary/import-target.ts) 精确 aliases、可选父编码及批次校验；[page](https://github.com/jiangxng/EVO-App-Platform/blob/44da0a35ccf3191d90b9817fc21ffa667628a3b7/apps/business-dictionary/page.ts) 父级导航/编辑。
- [shared service](https://github.com/jiangxng/EVO-App-Platform/blob/44da0a35ccf3191d90b9817fc21ffa667628a3b7/apps/data-import/service.ts) 通用唯一映射与批次校验；[shared page](https://github.com/jiangxng/EVO-App-Platform/blob/44da0a35ccf3191d90b9817fc21ffa667628a3b7/apps/data-import/page.ts) 三阶段；[seed](https://github.com/jiangxng/EVO-App-Platform/blob/44da0a35ccf3191d90b9817fc21ffa667628a3b7/catalog/seed.ts) 与 [Host](https://github.com/jiangxng/EVO-App-Platform/blob/44da0a35ccf3191d90b9817fc21ffa667628a3b7/manager/server.ts) Operation schema 和路由。
- [hierarchy regression](https://github.com/jiangxng/EVO-App-Platform/blob/44da0a35ccf3191d90b9817fc21ffa667628a3b7/tests/protocol/cv07-dictionary-hierarchy-edit.test.mjs)、[import regression](https://github.com/jiangxng/EVO-App-Platform/blob/44da0a35ccf3191d90b9817fc21ffa667628a3b7/tests/protocol/cv07-business-dictionary-import-eidos.test.mjs)、[human experience protocol](https://github.com/jiangxng/EVO-App-Platform/blob/44da0a35ccf3191d90b9817fc21ffa667628a3b7/tests/protocol/data-import-human-experience.test.mjs)、[synthetic XLSX Chromium](https://github.com/jiangxng/EVO-App-Platform/blob/44da0a35ccf3191d90b9817fc21ffa667628a3b7/tests/bex01/v3_synthetic_xlsx_retained_fields_chromium.py)。代码测试与真实人验必须区分。
- #1383 评审/PR 指向 vendor/eidos/src/catalog-browser/render.ts、vendor/eidos/src/design-language/productive-workbench-css.ts、tests/protocol/cv07-eidos-desktop-collection-workspace.test.mjs；#1382 PR 指向 apps/data-import/template.ts；#1381 PR 指向 tests/protocol/cv07-scoped-data-import-options.test.mjs；前序代码未逐行重审。

## 5. 缺口、证据保全、下一步
1. P0：原193行CSV未恢复、未导入、未签收。合法企业 OWNER/ADMIN 会话核对两精准别名；明确选项主键业务含义/是否冗余，若未确认不要忽略；核对全部源列，预检后明确确认；记录实际有效/拒绝行数、草稿定义/项数（不能用193直接推断字典数）、已发布版本隔离，按授权另行发布并查有效版本。不得取凭据或提交未经批准数据。
2. P0：复测父子项新增、修改父级、根项、字典改名、非法/循环/跨字典拒绝、批次父在后、返回原详情/筛选状态；只读成员入口与停用功能拒绝。
3. P1：PC 1096/1280/1440 与390px 人工真实视觉/触摸/缩放/键盘/读屏、导入模板及错误恢复。原图仅历史聊天/评审位置；未找到附件URL或原像素；不伪造。自动测试日志按上表Run/Job定位；历史1k/10k artifact位置见11-19索引§3，未下载，可能过期。
4. P1：核对 vendored Eidos 与独立上游实际差异；只在确需同步时读双方精确版本并另开合规交付，不覆盖下游。当前44px实际命中与32–36px视觉建议按既有门禁优先，需真实视觉复核。
5. CV07 总退出：Item 安装/active 但巡检无样本；独立开发者第四集合接入、原八步正式门禁仍未签，不宣称完整 List Foundation 完成。保留既有验收提醒，不重复创建；本轮未核查提醒当前注册状态。#1184 等其他窗口保持独立。
6. 本轮仅恢复：未重新跑测试、未重新部署、未登录、未读原CSV、未改业务实现。外站新检索没有必要，历史来源已覆盖决策；缺少的完整聊天/图片/原文件不能用互联网替代。将来只有关键行为或外部接口冲突时定向复查。

## 6. 文档导航
[新窗口入口](CV07-WINDOW-20261126-CONTEXT-RECOVERY-HANDOFF-ENTRY.md)；[11-19详细索引](CV07-WINDOW-20261119-RESEARCH-REFERENCE-INDEX.md)；[11-25导入交付](CV07-WINDOW-20261125-EIDOS-DICTIONARY-IMPORT-DELIVERY.md)；[11-19工程验收](CV07-WINDOW-20261119-1K10K-POSTMERGE-ACCEPTANCE-ENTRY.md)；[第三插件作者清单](CV07-COLLECTION-THIRD-PLUGIN-ONBOARDING-20261119.md)。本交接PR自己的最终SHA、CI及是否合并由GitHub实况决定，不提前写成功。
