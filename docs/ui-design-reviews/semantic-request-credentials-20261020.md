# semantic凭据与共享reader兼容检查

## 目标与完成条件
修改`manager/server.ts`、`providers/context-memory/runtime.ts`与原`manager/memory-credential-fetch.ts`，semantic仅实际请求解析token；共享reader使用当前Provider选择，缺失/异常不回退旧对象。保留原词法入口与直接注入合同，不扩展Agent或新建产品能力。

## 流程与步骤
原显式Secret保存/删除、启停、授权、审计和词法Memory Search路径保持，不增加步骤。未配置token仍匿名，读取失败明确拒绝；有效性恢复后同一reader可重选。设置保存不重建无变更的端点runtime。

## 导航与信息架构
没有新增按钮、导航、页面、HTTP方法执行接口或Agent strategy参数。已核对的Host页面/工具当前走词法；semantic正向验收来自原服务合同，不把测试接线冒充已发布Human语义检索功能。

## 视觉与颜色
无布局、色彩、字体、Eidos tokens或控件修改。复用先前完整读取的Eidos Human Experience Authority和八项清单，不重复外网研究。server.ts属于仓库UI源门禁，随改动保留此兼容记录。

## 记忆与注意力
密文与共享reader不随单UI停用销毁，恢复无需用户记住token或历史绑定。原候选过滤/排序/分页保持；显式semantic选择失败不会悄悄变为词法或继续用旧Provider。配置HEALTHY仍不证明凭据/远端健康。

## 无障碍与跨年龄
原词法页面、标签、焦点和操作路径保持；没有新增记忆负担。未执行浏览器、屏幕阅读器、物理设备或Human验收，不用自动测试代替体验签署。

## 安全与数据修复
复用现有可选token合同、epoch/写计数/Abort保护和管理员Secret路径；source/context/governance候选过滤仍在原位置。getter缺失/异常权威拒绝，旧注入仅在未提供getter时兼容。未承诺响应后跨Host撤销、已发请求取消、原store事务回滚或JS明文擦除。

## 证据与剩余问题
本地新4项及原19项共23项通过；Host/fixture和server擦除语法通过。新增真实Host验证已有token启动/保存/启停重启与原词法页面零实际解密，正向semantic由reader/resolver/原remote runtime/真实加密store合同集成验证；正式build/Node22/Host结果见准确head CI。Help原操作说明仍有效，无新用户字段。未部署或Human验收，配置安装、R3其余类别及R1/R2/R4继续开放。
