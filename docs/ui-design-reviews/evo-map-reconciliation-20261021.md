# EVO映射初始化与绑定权威兼容检查

## 目标与完成条件
修改manager/server.ts的安装helper结果与map初始化/播种，保留生命周期选择、避免未变配置重写；明确部署配置对列出观测键的原权威，保持共享绑定其他消费者。

## 流程与步骤
首次显式true/map仍初始化；停用/卸载后不再被配置复活，需原enable/install并重启应用待处理map。无新字段/页面操作；显式配置变更仍按原bind合同更新列出目标，保持bindingId/createdAt。

## 导航与信息架构
无新路由/按钮/Agent接口。复用原生命周期、Provider resolver及Host startup journal；不扩展第二Provider试点或新EVO业务。

## 视觉与颜色
无布局/字体/颜色/token改动，复用已读Eidos权威和清单。manager/server.ts为本次实际改动源，提供该兼容记录以满足仓库交互门禁。

## 记忆与注意力
停用/卸载选择由持久状态和journal保留，无需删除配置才停止使用；备份/恢复仍须两份状态一起。未变映射不刷时间戳，恢复可复用原数据，启用回调不偷偷写map。

## 无障碍与跨年龄
原页面标签/键盘/焦点和导航保持，无新记忆步骤。未执行浏览器/设备/屏幕阅读器或Human验收，不以协议/HTTP回归代替。

## 安全与数据修复
active但错误Provider选择仍拒绝，无store兜底。写失败保留目标、之后可重试；原唯一性、不可变身份和配置校验保持。显式map仍覆盖声明观测键的离线修改（原合同）；不改未列出键或Trading Lite的evo-ledger-runtime键。未来正式同键编辑须重定权威；不承诺跨条目/跨Host事务回滚。

## 证据与剩余问题
本地原7项通过，新/改Host、协议及server擦除语法通过；Host共9项与5项manager生命周期文件由最终head CI执行。覆盖启停/卸载/重装/重启、无变零写、配置权威隔离、写失败重试和错误选择拒绝。Help影响：原enable/install后重启，显式配置仍更新；无新UI字段。未部署/Human验收；其余配置资格、R1/R2/R3资源/R4及A03/A05仍开放。

首轮PA05调用清单按旧19处失败；同步为17处并补充map经原journal helper和fail-closed adapter路径断言，不放宽写入保护。完整PA05及新Host用例以最终head CI为准。
