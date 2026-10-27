# EVO Tokyo：空插件平台与左侧导航治理（2026-10-27）

状态：**实施候选，尚未发布和 Human 签收。** 对应截图：公网验证环境在未人为安装任何业务插件时显示“客户/供应商/我的客户/我的供应商/往来对象/数据导入”，活动栏存在“应用”和“工作区”两个入口。

## 架构与已核实根因（实际读取仓库原文）

- [Plugin Platform Mainline](../architecture/PLUGIN-PLATFORM-MAINLINE-v0.1.md)：Host 管理 Package/Feature 生命周期，只有 installed + active 才能产生有效 Contribution；Eidos 负责通用 Shell 的呈现，不直接控制业务安装。
- [Workbench architecture](../architecture/EVO-WORKBENCH-v0.1.md)：应用 Activity 是导航容器；选中已激活的“应用”再次点击即可收起/展开侧栏，主工作区持续存在。额外的独立“工作区 focus”按钮对于当前预览是冗余入口。
- [Host 原实现](../../manager/server.ts)：默认 startup profile 为 compatible，startupDefaults 对 Counterparty、Object Extension、Data Import 等调用 installBusinessDefaultOnce，在满足依赖时首次自动 INSTALL。即使用户没有人工安装，这些插件也会被标记为真正 installed/active；菜单不是无依据的前端硬编码假数据。
- [Service 原实现](../../manager/service.ts)：listEffectiveExperiences 和 listEffectiveWorkbenchActivities 均按 activeFeatures 收集 Contribution；[Eidos Workbench](../../vendor/eidos/src/workbench/shell.ts) 根据真正有效导航渲染“应用”目录。**不应该额外用 UI 过滤偷偷隐藏已激活业务插件，这会破坏生命周期事实与界面一致性。**

## 本专项改动

1. 新增 profile `clean`：仅抑制不经明确配置的一次性默认业务插件安装，保留 historical `compatible` 默认行为不变；不要求开启 managed session。已有人工安装/启用能力及依赖审查不变。
2. 东京 Compose 明确选择 `APP_PLATFORM_STARTUP_PROFILE: clean`：后续全新东京 Host 卷启动时不自动安装 Counterparty/Object Extension/Data Import 等默认业务插件，只有已实际安装且 Feature 激活才有对应应用。
3. 删除 EVO 平台自己发布的重复“工作区”Activity；保留“应用”展开/收起、Eidos 已有的侧栏焦点控制、工作区主页面、键盘切换以及插件贡献活动。
4. 测试 profile 行为：`clean` 不自动安装非显式业务插件，`compatible` 保持旧自动兼容行为；“应用”存在但额外 Workspace Activity 不存在。

## 必须区分的真实环境事实与后续验收

- **当前东京旧卷不会因为新 profile 自动卸载/停用历史安装的应用**。这是安全保护，不是修复完成证明。绝不删除 Docker volume、覆盖 startup-defaults.json 或编辑 platform-state.json 伪造安装状态。
- 当前旧卷需要先核实真实 package/feature snapshot 和一次性 default journal，确认截图中这些项目属于平台自动安装、没有用户后来新增的安装/数据后，经 plugin lifecycle 正式 **Disable（保留数据，可逆）**；不做 Uninstall。验证操作的幂等性、审计与复启不被重新安装，才使 UI 消失。
- **新卷**：预期“应用”导航列表为空或明确空状态，但插件商店/设置/帮助仍可访问；安装启用 Counterparty 后，其声明菜单应出现，Disable 立刻消失，Enable 后重新出现；不可因未安装就使其独立业务路由有效。
- 左栏仅保留有价值的 Activity，点击“应用”收起/展开。页面重载恢复当前 Activity 后不会由于历史 `workspace` ID 被删除而白屏，应回退 Apps。
- 不声称已实际部署、在线验收、BEX V3 Human 签收或 PA05 生产能力通过。原 Railway 与数据保持不变。按照 exact-HEAD CI、代码 Review、独立发布与 Human 验收流程前进；不覆盖其他 owner PR。

## 最小后续步骤

- 当前 Draft PR 通过针对性测试及适用 CI；
- 经独立部署批准和现有备份验证后，部署东京 clean profile + 图标变化；
- 使用现有安全身份核验历史默认安装，执行经验证的可逆 disable，再核对导航与插件生命周期；不要求用户安装 Docker、重新配置 SSH 或重置密码。
- 专项参考索引保留本次新增文档/PR/确切 SHA，与 UI/数据状态分别记录。
