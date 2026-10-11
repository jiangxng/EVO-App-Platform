# 商业 v1.0 §14 V06｜状态叠加与可辨识性

**唯一需求**：选中、悬停、键盘焦点、错误/警告同时出现仍可区分；不能只靠颜色。原始 §5.3 与 §14 V06。不得增加业务对象状态或改关系语义。

- Eidos 通用组件独立实现：节点已有选中边框与背景继续保留；独立悬停实线外框、键盘 focus-visible 虚线轮廓；选中暴露 aria-pressed。
- 新的可选只读展示 issue 契约包含 level=warning/error 与 message，用户可见 ⚠ Warning 或 ✕ Error 文字，完整说明可由原生 title/aria-label 读取。不根据业务名称或颜色猜测错误，不允许图形层凭空修改后端状态。
- Platform 仅对已有 Host overlay 受控前移；保持 context-navigation、编辑数据和 CAS 不变；精确更新 source.manifest.json vendoredBlob。
- 浏览器 Chrome V06 测试：合成合法 Eidos state，两个节点同时分别带错误/警告，通过真实 pointer hover、click、focus，检查 computed CSS 样式、ARIA、工具提示、两个状态同时保留及零持久化写；V01–V05 继续回归。运行结论以本 PR CI 为准。
- **剩余人工/实体设备验证**：真实投影异常状态的数据供给、Mac/Windows 键盘系统大字与辅助技术、产品视觉验收；这不是客户签字，也不是“第 40 项”。
