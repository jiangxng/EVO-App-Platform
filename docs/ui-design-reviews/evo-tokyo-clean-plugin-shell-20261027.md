# EVO 东京：应用关联企业引导与导航去重 — UI Review

## 目标与完成条件
现场没有企业可选、点击客户或数据导入变成空白。已注册应用的入口可以存在，但没有 Enterprise Context 时主工作区必须显示清楚的未就绪提示，不能假装后台服务已连接。此记录只代表设计评审，不代表 Human 已签收。

## 流程与步骤
用户点击“客户”等应用 → Host 检查真正 Enterprise Context → 若页面 API 返回特定 409 错误 → 工作区用 Eidos 只读状态显示未关联企业、下一步配置建议。成功时直接显示正常业务页；建立企业后再访问必须更新。无企业时不创建测试数据或替用户安装其它插件。

## 导航与信息架构
应用前端来自有效插件 Contribution，企业可用性是运行前置条件，不应被展示菜单时误判。Apps 图标控制侧栏展开/隐藏，删除重复全局 Workspace Activity；不修改插件贡献的其它入口和路由。

## 视觉与颜色
不写新 CSS、不加第二套 UI 库；缺失上下文用已有 Eidos catalog-browser 标题、说明和空状态。留白和层级复用标准 Eidos tokens，不能用一片空白或原始英文 HTTP 错误取代用户指导。

## 记忆与注意力
提示“当前应用尚未关联企业”，给出下一步配置方向，不强迫用户记住错误代码。无缓存 ETag 的临时提示重新读取，企业准备后返回正常应用页面。不给出未经证实的“后端不存在”断言。

## 无障碍与跨年龄
Eidos 既有语义标题、文本与键盘可读的 catalog-browser 组件，保留侧栏快捷键与移动端容器。没有完成实际读屏器、触屏设备和 Human 验收。

## 安全与数据修复
改动的 UI 入口为 manager/app-host-client.ts 和 manager/desktop-workbench-runtime.ts；新增平台适配器 manager/business-page-readiness-fetch.ts。只对页面 409 + 明确 ENTERPRISE_CONTEXT_REQUIRED 返回标准只读提示；服务端继续拒绝业务读写。401/403/其他 409、成功页及应用外 API 不转换，不改变企业授权、插件安装状态、Railway 或数据卷。

## 证据与剩余问题
证据来自本轮截图，Host/Eidos 源码与 tests/app-host/business-page-readiness.test.mjs。准确 HEAD CI 与实际东京浏览器测试尚需分开核实；没有企业可选只能证明 UI 上没有可用 Enterprise Context，不能推断所有应用 backend runtime binding 状态。未修改 Eidos owner 通用框架。
