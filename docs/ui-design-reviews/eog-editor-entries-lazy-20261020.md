# 原运行图页面与命令按需装配兼容检查

## 目标与完成条件
Human继续打开原运行图并在已有企业上下文中查看、检查和编辑。修改源为 `apps/eog-2d-designer/enterprise-operating-graph-page.ts`（仅命令常量来源/兼容导出）、`enterprise-operating-graph-actions.ts`与package元数据；Host装配在`manager/server.ts`。完成条件为页面/命令未用时不加载、有效首次调用保持原输出和安全合同。不是2D改版或新增Agent功能。

## 流程与步骤
原打开页面→GET→选择检查/直接编辑路径不变。Host沿原Feature准入和请求授权执行，原handler中的企业/Human/确认与版本控制不移动到浏览器。新增await后重查有效Feature，停用时返回原Feature不可用/页面404，不把旧请求自动重放。

## 导航与信息架构
复用package原页面source、route、Feature和Experience。Personal/单企业fallback、当前编辑目标session/subject记录继续保持；不新增导航层、工具或用户需记忆的选择步骤。旧manager兼容出口保持同名公共合同。

## 视觉与颜色
仅移动装配位置，页面对象、Eidos渲染器、文案、字体、图标和tokens不变。Host回归将页面对象与原factory深比较；不据此声明Human视觉验收。上批原生浏览器手势修正完整保留，不重复改Eidos或proof脚本。

## 记忆与注意力
共享graph/View State及原选择回调不绑定某UI启停删除。布局、原semantic事实、stale revision拒绝、企业隔离、卸载重装/重启恢复进入回归；用户既有决定不用重新录入。

## 无障碍与跨年龄
不修改可点击区域、焦点、键盘、触控或跨年龄流程，无新交互学习负担。本地未执行浏览器/屏幕阅读器/真实设备；正式现有CI自动子门禁不等于Human签署。

## 安全与数据修复
保持原请求准入、角色、授权、确认和CAS，新增await后拒绝迟到动作。原生loader测试在真实Host并发CREATE/GET/page期间停用，验证拒绝且无新图；交付失败显式失败，恢复模块后重启验证数据未产生。没有新后台资源或自动WRITE重试，不承诺跨Host冻结。

## 证据与剩余问题
本地20项组件/加载探针与语法检查通过，正式构建/三项新增真实Host/四组合冷链由本PR CI执行；结果记录到治理第14节、原JSON与PR。固定7项4闭环3部分完成，R1整体与R2/R3/R4保持OPEN，未部署。复用前批完整读取的Eidos总纲/八项清单及导航采用规范；总纲blob本轮核对仍为`eebd25cafb52d1f7ae032e83b5448f1f46b78646`，无新增外网研究或视觉标准。
