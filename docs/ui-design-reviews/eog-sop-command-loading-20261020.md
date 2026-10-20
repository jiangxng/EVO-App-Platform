# 旧SOP命令按需装配兼容检查

## 目标与完成条件
本批仅修改`manager/server.ts`中旧四条SOP Human命令的装配位置；旧actions公共常量移至原contract并保持兼容导出。有效调用保持原确认、权限、版本与数据；未用不加载实现，停用后拒绝迟到调用。不新增或激活冻结的SOP Designer，不修改Agent功能/页面。

## 流程与步骤
保留原list/create/revise/publish入口、参数与错误。原Feature准入后加载原handler，await后复查原Feature；原Human/Enterprise、物质写授权和确认由原handler执行。没有新增用户步骤或自动重试WRITE。

## 导航与信息架构
不增加导航、路由、SOP产品入口、安装默认或工具。未来同级SOP Designer的scaffold仍冻结且未注册Host，旧Human owner保持enterprise-agent，旧Agent工具描述不迁移。

## 视觉与颜色
Host装配与轻量常量变更，不修改页面/Eidos渲染、文案、字体、颜色或tokens。本批不提供或声称视觉验收，复用已读设计权威，无新设计研究。

## 记忆与注意力
定义仍来自同一Enterprise Context仓库；共享服务不按单UI停用删除。启停、卸载重装和重启继续读原发布结果，stale revision拒绝不覆盖既有决定。

## 无障碍与跨年龄
没有控件、焦点、触控/键盘或设备流程变化，无新学习要求。本地未执行浏览器/屏幕阅读器/物理设备或Human验收；自动子门禁不能代替用户签署。

## 安全与数据修复
保留四命令原owner/资格、授权、确认及CAS；原生import等待后重新核对Feature。test hook期间停用拒绝读写，定义字节不变；交付失败明确HTTP403/错误码，重启恢复。旧SOP工具Host身份/Enterprise-only available的兼容债务单列保留，不能据本批宣告其所有资格合同已整改。

## 证据与剩余问题
本地原组件10项通过（5 on-use、3登记、2 preserved手动），语法通过。正式构建、三项新增真实Host治理回归与四组合在本PR CI，最终结果见PR；记录于治理第15节及eog-sop-command-loading-20261020.json。Preserved corpus不并入EOG Core产品门禁；R1/R2/R3/R4保持OPEN，固定7项4闭环3部分完成，未部署。
