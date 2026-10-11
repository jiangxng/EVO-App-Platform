# Diagram v1.0 D04 — Designer/Viewer/模板预览/缩略图读取证据

日期：2026-10-11。原始商业要求：`EOG-2D-DESIGNER-COMMERCIAL-REQUIREMENTS-v1.0.md` §14 D04，复用 B8b 的完整回路，本小 PR 只拓展原生浏览器子场景，不新建版本或模板传播逻辑。

## 已核查的数据边界
**源代码事实（2026-10-11 main）**：
1. Enterprise Projection 的 `DefinitionProjectionStore` 保存企业定义上的视图（CAS 版本），可通过 Enterprise Designer/Viewer 相同的 Artifact Source 读取。保存时产生存储 Gallery 及缩略图 SVG。
2. Template Store 的 `createTemplateStorePreviewArtifactSourceV010` 读取 **另一个独立版本化 TemplateTransferBundle**，其 `projectionGallery` 属于模板自身。企业投影 Save **不会**自动修改 Template Store 已发布快照。除非通过已有显式发布/拷贝工作流建立对应模板，不能把其预览与企业投影保存后的新坐标无条件比较，更不可为了测试伪造关联。

## 本 PR 的实际浏览器证明目标
- 从真实企业 Designer D03 显式保存后，重新独立加载 Designer 及 readonly Enterprise Viewer，检查所有关系 SVG 曲线和业务节点位置相同，且只读 Viewer 没有保存按钮。
- 读取真实 Gallery item 中的 `view.placements`、`view.edgePaths`，与实际浏览器呈现的坐标、曲线和手工点一致；SVG thumbnail 包含可读取路径/节点，并用真实 Chromium `Image` 解码尺寸 640×240–480，而非只检查 URL 非空。
- 在独立浏览器页面加载**真实已发布 v3 Template Store fixture**，通过产品 `createTemplateStorePreviewArtifactSourceV010`、`createTemplate2dPreviewReadActionV010`、Eidos Workspace 渲染，与其不可变模板源核对节点位置及数量。不得声称模板自动追随企业新保存。
- 无任何读回造成 CAS 变动、业务定义版本增加。

## 未完成的门槛
`DIAGRAM_D04_BROWSER_SUBGATE` 是合成演示+原生 Chrome 自动化，不是物理平台测试、线上实际企业用户的多角色权限测试、模板重新发布传播测试或业务人员签收。D04 原始商业人工验收保持 NOT TESTED；总计正式人工签收仍 0/39。最新代码与 CI 成功/失败需要精确 PR head 和 GitHub Actions 日志支撑，不可仅凭本测试设计写 PASS。
