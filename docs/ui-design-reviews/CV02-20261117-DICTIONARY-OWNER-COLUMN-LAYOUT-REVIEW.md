# CV-02 Window13 · 受限列布局与业务字典真实接入 UI Review

> 2026-11-17。原 Eidos Owner [#213](https://github.com/jiangxng/eidos/pull/213) 已合并 `e8732149637d5901614f3ee108e16d508ea9c114`，Platform 本 PR 为第一业务 Owner 纵切。此设计材料只代表开发/复核，并非 Human 签名。准确改动源：`apps/business-dictionary/page.ts`、`apps/business-dictionary/directory-query.ts`、`vendor/eidos/src/catalog-browser/contracts.ts`、`vendor/eidos/src/catalog-browser/render.ts` 与已有真实浏览器脚本 `tests/cv04/real_host_csv_download_chromium.py`。

## 目标与完成条件

现有 Catalog 的 Sorted Table、Scoped Views 与 Saved View 列配置已实现，但缺少**页面内不保存的临时列管理入口**。用 Eidos 原生 `details/summary` 默认折叠提供列显示/隐藏、上下调整与恢复；真实 Dictionary Owner 接受受限 `columns` URL hint 并重新授权查询。当前页面 Table、CSV 和 Detail Return 同步按有权显示列工作。不得创建新 List Framework、保存个人偏好或开启生产 WRITE。

## 流程与步骤

进入字典列表 → 展开“列设置” → 对非身份/非当前排序列执行隐藏/显示，或对可见的非身份列上移下移 → 调用现有 Eidos navigate 行为 → Host 用现行 Context/Feature 重新获取 Owner READ → Owner 构造精确列集合、行 cell、CSV fieldIds、详情 returnTo → 页面重渲染。恢复默认列回到原系统/已授权个人视图设置。支持在有效筛选、排序、分页下临时调整，不修改共享资源。

## 导航与信息架构

导航仍为原字典目录 `/business-dictionaries` 下的 URL 参数；`columns` 仅作 presentation hint。原 view/search/sort/direction/page/pageSize/personalViewId 的 allowlist 解析保留。非法列名、重复列、超出数量、缺失首个身份字段必须拒绝。服务端查询与 Agent 的 Collection Operation 不因 UI 参数发生越权；其他插件只需以后复用这一 Eidos 控件，不添加第二套页面路由。

## 视觉与颜色

使用原生折叠 `<details>` 和已有动作按钮；没有覆盖 App Shell 的颜色、间距或状态 Token。小屏默认收起，不新增悬浮按钮；文本“列设置、显示/隐藏、上移/下移、恢复默认列”使用现有中英 locale。新增状态明确显示每列可见性，无新图标字体或 CSS 包。真实 1280/390px 图像由原 CV04 浏览器证据归档，并检查水平溢出。

## 记忆与注意力

“列设置”位置固定，避免用户在复杂菜单中查找。只有一层控件；显示状态和顺序与实际可见表头一致，不依赖本地缓存。操作保留搜索与当前页，详情返回也保留临时列选择；重新打开未经保存的系统视图只使用合法当前路由。恢复默认提供清晰退出。

## 无障碍与跨年龄

`details/summary` 支持键盘展开；内部复用原生 button、Tab/Enter/Space 和已有 focus-visible。显示/隐藏以及上移/下移用明确文字，不依赖颜色。Eidos 校验选项顺序和 Table 真正显示列一致，避免读屏器接收到伪状态。真实屏幕阅读器/物理手机与不同年龄 Human 的签收仍缺失，不冒充完成。

## 安全与数据修复

原目录解析只接受 displayName/dictionaryId/state/version/optionCount；第一主标识列不可隐藏、不可移位；当前排序列不能隐藏；Owner 对列名再与当前 readableFieldIds 做权限交集和拒绝。Eidos 拒绝非本地域名、重复 options、不合法操作及与渲染列不一致的控件。每次路由导航都由 Host/Domain 重新验证，不允许页面本地隐藏冒充字段撤权。原 current-page CSV 的 fieldIds 必须来自同一 Table 的可见列。CV03 Human SAVE OFF、CV04 正式后台 EXPORT OFF、N1 NOT_CERTIFIED、#1212/#1092 继续 OPEN。

## 证据与剩余问题

- 上游 Eidos PR #213：Owner release-check 和 Human UI Gate 全成功并合并，仅完成通用表现契约和反例测试。
- Platform 原 `tests/protocol/cv02-business-collection-views.test.mjs` 新增列路由合法/非法、顺序、CSV/详情返回和默认恢复测试；`tests/cv04/real_host_csv_download_chromium.py` 在隔离的实际安装 Host 上操作按钮、下载真实 CSV、比较列标题、1280/390px 截图与溢出。真实运行结论须以本 PR 准确 HEAD Actions 记录为准。
- 尚未完成：Counterparty 同控件接入、多条件筛选、正式生产 Saved Views WRITE、真人账户/真实移动设备/读屏器签收；这些不得因本 PR 标记完成。

## 页面模式与导航归属

Eidos `CatalogBrowserV010` 保持单一 Table 表现 Owner，Dictionary Domain 决定可读列和呈现路由，Host 保持权限与企业隔离；Data Import、CSV 与 Personal Agent 分别守原有 Operation/Read owner 边界。

## 功能、布局、颜色对照

功能：临时显示/隐藏、上移/下移、恢复列配置；无持久 Saved Views 写操作。
布局：原列表顶部折叠菜单，桌面和移动均使用同一受管行数据。
颜色：保持原设计 Token，不加品牌色、不修改其余插件私有样式。

## 入口、退出与恢复矩阵

入口：原字典列表，展开列设置。
退出：收起详情、点击恢复默认列，或离开原列表路由。
异常恢复：非法/重复/越权列拒绝，企业切换和 Feature 停用继续 Host fail-closed；返回上级及正常搜索/排序不需特殊恢复脚本。

## 浏览器与 Human 证据

桌面：在隔离真实 Host 的 Chromium 1280px 点击“隐藏状态列”，下载 CSV 并比对字段；原有三业务插件校验保留。
移动：同一 Chromium 390px 触摸尺寸下执行列调整、CSV、溢出检查；不能代替真实手机。
Human：**未签收**。这份文档不是用户手动验收回执，也不能代替生产 Owner/Operator 签署。
