# LLM metadata资格与首次启用恢复检查

## 目标与完成条件
manager/server.ts仅对当前有效OpenAI/DeepSeek读取Secret metadata；首次安装/启用仍可直接取得原同步runtime，缺Key继续明确拒绝。

## 流程与步骤
复用原插件安装/启用、Provider探测、Settings显式保存及审计；生命周期变化后准备原runtime，停用/卸载失效。不增加登录、确认步骤或Agent功能。

## 导航与信息架构
原管理页、路由、能力选择和Provider身份保持，没有新导航、第二Provider试点或UI改版。

## 视觉与颜色
无布局/颜色/token改动，复用已读Eidos权威；实际修改manager/server.ts的生命周期回调和两处refresh前置资格检查，提供本记录满足Host源门禁。

## 记忆与注意力
用户已保存Key无需重复保存才能在首次安装/启用使用；保留停用和卸载意图及共享凭据。缺/坏配置由原入口拒绝并用原管理操作修复。

## 无障碍与跨年龄
不增加控件、焦点路径或需记忆的新步骤，原标签/键盘/响应式保持。未做浏览器/设备/屏幕阅读器或Human验收。

## 安全与数据修复
未授权Secret变更仍先拒绝，不得借refresh保存环境Key；metadata不解密。有效激活可按原合同初始化空master key，受保护Secret值持久化仍必须显式授权/审计。原配置/请求epoch与Abort拒绝保持。

## 证据与剩余问题
本地原函数前后16场景、8项隔离refresh/生命周期与9项原请求helper通过；新增4项真实Host和既有凭据/Secrets回归由准确head CI验证。R1/R2/R3其余/R4及A03/A05仍OPEN，未部署/Human验收。
