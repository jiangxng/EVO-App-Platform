# OIDC失败缓存与认证恢复兼容记录

## 目标与完成条件
修改providers/oidc/runtime.ts的失败Promise缓存，瞬时discovery/JWKS失败后允许新的显式登录恢复；已有认证校验继续拒绝无效token或旧callback。不改UI源、导航或产品合同。

## 流程与步骤
用户仍走原登录流程；失败后重新发起登录生成新state/nonce/PKCE。失败callback已消费，不自动重试token交换。成功缓存与并发discovery保持，不新增确认步骤。

## 导航与信息架构
没有页面、路由、按钮、Agent入口或设置字段。OIDC认证身份与Host管理Session原职责保持分离，不为测试创造远端登录产品入口。

## 视觉与颜色
无布局/颜色/字体/token改动，复用已读Eidos权威与清单。本文是认证恢复兼容记录，不将非UI生产文件假称改动UI文件。

## 记忆与注意力
成功配置和共享Session索引不依赖用户记忆或单UI启停；临时失败不再永久卡死runtime。旧callback不能被重放，错误仍由原路径传播。

## 无障碍与跨年龄
原登录页面、焦点/键盘、提示和导航保持；未运行浏览器、屏幕阅读器、物理设备或Human验收，不用协议回归代替体验签署。

## 安全与数据修复
issuer/audience/nonce/期限/RS256、PKCE和state单次消费保持。只释放失败Promise，不自动重发token请求或持久化Secret。OIDC refresh提前解密、事务容量/过期清理等边界仍在治理清单，不推断整Host零I/O。

## 证据与剩余问题
本地新增7项及原13项20/20通过；其中2项缓存回归已在旧实现失败复现。正式Node22/build和真实Host旧矩阵以准确head CI为准。未部署/Human验收。Help无新步骤或字段，原显式新登录恢复适用；R1/R2、R3其余资格和R4仍开放。

