# EVO休眠映射启动边界兼容检查

## 目标与完成条件
修改manager/server.ts的evoObservatoryApplicationMap入口，EVO观测未启用时不parse/激活/写入其map，原enabled=true正向合同保持。

## 流程与步骤
没有新增字段/页面步骤。以前只写map但未启用也可能播种；现在应用map须现有APP_PLATFORM_EVO_OBSERVATORY_ENABLED=true。关闭时保留配置/文件，重新显式启用仍走原校验和兼容播种。

## 导航与信息架构
不新增UI/路由/按钮/Agent接口，不改Trading Lite或其他共享binding消费者。通用binding包可由存量数据/其他用途独立存在，关闭观测不卸载共享服务。

## 视觉与颜色
无布局/色彩/字体/token改动，复用已完整读取的Eidos权威及清单，不重复研究。server.ts为本批实际改动源，纳入仓库交互门禁。

## 记忆与注意力
不要求用户删除map才能关闭观测；原绑定字节和停用状态保留。操作员使用原明确开关恢复，不要求记忆/手抄bindingId。启用后的重复修复/覆盖仍列待治理，不隐去限制。

## 无障碍与跨年龄
原界面标签/焦点/键盘保持；未执行设备/浏览器/屏幕阅读器或Human验收，不以自动HTTP/源码测试代替。

## 安全与数据修复
休眠坏JSON不执行，启用坏JSON仍拒绝；原绑定唯一性/不可变身份与当前Provider resolver保持。只限制本owner配置，不禁用通用安全/共享数据读取，不称Host零I/O。未实现true模式主动停用保护或原子整批配置迁移。

## 证据与剩余问题
本地原7项通过，新Host/fixture及擦除server语法通过；新增5项真实Host覆盖两种profile/off、坏配置、文件/inactive保持及重启恢复，正式结果见准确head CI。Help影响：本记录和Provider§14明确map须显式启用；局部本地/远程空搜索不证明全仓无旧文案。未部署/Human验收。true模式bootstrap/重复写入、R1/R2/R3其余/R4及A03/A05开放。

