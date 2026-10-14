# 插件平台整体治理入口

日期：2026-10-14。本专项当前收敛为插件合理性与架构审查；生命周期试点停止扩展。

**本轮先读：[审查成果与接续入口](REVIEW-ENTRY-20261014.md)**。38个在范围包已逐项给出判断；不是全平台迁移完成。

用户目标：轻量宿主、按需安装卸载；安装能力少时降低装载与后台资源开销；个人Agent千人千面，企业具有跨部门整体分析与改进能力。

- [账本编译边界整改及兼容清单](LEDGER-COMPILER-BOUNDARY.md)
- [整体规划与执行路线](PLAN.md)
- [GOV-00 首轮代码对账](BASELINE-20261013.md)
- [生命周期管理页面](ADMIN-LIFECYCLE-UI.md)
- [统一生命周期管理API](ADMIN-LIFECYCLE-API.md)
- [过程分支清理交接](BRANCH-CLEANUP.md)
- [异步停用状态与重试](PROVIDER-STOP-LIFECYCLE.md)
- [真实订阅资源释放与超时](REVISION-RESOURCE-LIFECYCLE.md)
- [按需Provider试点](LAZY-PROVIDER.md)
- [启动恢复首批治理](STARTUP-RESTORE.md)
- [首批运行资源基准](RUNTIME-BASELINE.md)
- [CI校验范围与执行证据](CI-GATES.md)
- [项目待办](../../roadmap/BACKLOG.md)

当前：已加入轻量宿主CI静态门禁与懒加载行为测试；GOV-00首轮静态对账完成，首批隔离环境运行基准已测，最小宿主与业务负载对比仍未完成。已加入显式minimal安装模式及一次性默认安装/产品迁移机制；未操作线上插件、数据或部署。
当前GOV-02：瓶颈分析Provider已改为按需创建，静态依赖299→297。已补充运行时修订订阅桥的真实HTTP取消、正文超时、重复订阅释放与恢复测试；已补充Provider内部停止状态、有限等待与安全重试；已接入授权与审计保护的统一管理API；已接入统一管理页面；按用户要求停止扩大Provider试点，下一步以合理性审查结论为准；尚未完成全平台按需运行。不先动登录、凭据或生产账本。

本专项不接管BEX、Agent、2D Designer、EVO业务专项；BEX-00已由原窗口完成，BEX-01继续由原窗口推进。交易示例及未完成插件展示按用户要求暂不处理。
