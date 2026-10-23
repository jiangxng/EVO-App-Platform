# OIDC按请求凭据与登录恢复兼容检查

## 目标与完成条件
修改manager/server.ts、manager/authentication-flow.ts和providers/oidc/runtime.ts、host-runtime.ts，仅实际token交换读取clientSecret；旧登录不能跨配置/绑定/启停变化签发Session。server.ts属仓库交互门禁，随改动保存本记录。

## 流程与步骤
原登录→IdP→callback→Session保持。失败回调单次消费，重新登录恢复；不自动重发token。明确未配置Secret才public client，缺失服务/读取失败/空值不降级；普通设置或Secret保存仍重建实例，旧登录重来。

## 导航与信息架构
不新增页面、按钮、字段、Agent入口或路由。复用Secret显式保存/删除与管理员授权/审计；身份目录与Host会话职责保持。

## 视觉与颜色
无布局/字体/色彩/token修改，复用已完整读取的Eidos权威和清单，无新增外网研究，不改其他窗口设计。

## 记忆与注意力
无需用户复制或记忆Secret，原密文保留。未用、保存、discovery/probe和begin不解密；上下文变化明确拒绝，原新登录流程恢复，不重放旧callback。

## 无障碍与跨年龄
原标签/键盘/焦点/导航保持，无新记忆负担。未执行浏览器/设备/屏幕阅读器或Human体验签署，协议与HTTP测试不代替这些验收。

## 安全与数据修复
保留PKCE、state/nonce、issuer/audience/RS256/期限及Basic/client_id。token 8秒期限包括Secret等待；迟到解析不能发送。单owner epoch/写计数及当前选择/Secrets实例复核，Session签发前再检查。已发token可能在IdP消费，不自动重放；不承诺外部Promise强制终止、目录写入回滚、跨Host撤销或JS明文擦除。

## 证据与剩余问题
本地新增7组件+原31共38/38，Host/fixture及server擦除语法通过。新增真实Host用例覆盖实际crypto计数、密文启动/保存/停用重启、合成RS256登录/轮换/删除、重放拒绝及在途绑定往返无cookie；执行结果以准确head CI为准。Help无新字段/步骤，原显式新登录与Secret管理适用；未部署/Human验收，R1/R2、R3其余资格和R4保持开放。

