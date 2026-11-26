# CV07 · 字典编辑与发布保留列表上下文（2026-11-26）

## 发现
目录到详情已通过 Owner allowlist 保存 returnTo，但详情到编辑、编辑提交、发布后的 navigateTo 均丢失它；创建入口亦未保留目录状态。会造成用户回到列表时丢失搜索、筛选、分页与显示模式。

## 决策
复用既有 businessDictionaryDirectoryQueryRouteV010 / parseBusinessDictionaryDirectoryRouteV010；扩展 Option/Definition 路由和表单的隐藏 returnTo、Host 参数传递、Save/Publish 导航结果和操作 schema。先验证 returnTo 再执行写入，禁止外部/非字典路径、未知或重复参数。它只是展示意图，不构成授权；每次目录访问仍按当前企业与 Host 授权重新解析个人视图。不修改 Eidos 组件、数据结构或权限。

## 验证
新增协议回归覆盖详情的编辑/新增子项/新增项/名称编辑路由、表单返回链接与隐藏字段、提交及发布后的 navigateTo、非法路径写入前拒绝。保留既有无 returnTo 兼容行为。真实浏览器及生产 Human 仍须单独核验；本 PR 初始 HEAD CI 尚未验证。
基于 protected main@75a4443690c42881a174d230bd9e79047efb6b8e；#1387 变更文件无重叠。已确认原用户真实 CSV 未取得、Human NOT SIGNED。
