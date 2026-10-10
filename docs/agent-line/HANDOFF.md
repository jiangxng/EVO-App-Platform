# 独立 Agent 线交接入口

Document class: LIVING_RUNBOOK

更新时间：2026-10-10。用户已授权启动 Agent 线，要求持续留存进度；不影响业务主线和2D线。

## 状态

PA-00 ACTIVE：正在做代码/契约/存储绑定盘点，未开发运行功能、未部署。设计与进度 PR：#570；工作分支 `docs/personal-agent-blueprint-20261010`。

盘点基线：`301cf0a45e59591adcb6a33e6d30fb68a94db443`（#571）。主线继续推进，#572 为状态交接候选；不修改它的任务与gate。

## 已确认

- Conversation 已有 PostgreSQL authority，不重做 AF-01/02。
- manager/server.ts 当前将 Agent Run 和 ActionReceipt 绑定 JSONL 或内存；不能用 Conversation 的数据库能力代称 Run 已迁移。
- Run/receipt 公开接口有同步方法，PostgreSQL 迁移需要兼容/异步端口规划，不能只替换文件构造器。
- 2D #563/#566/#568 涉及 Agent crop CAS 与 vendor；本线避开图形写入与整体vendor替换。

## 固定边界

独立分支/PR/进度；不改 project.status.json 或 docs/roadmap/HANDOFF-LATEST.md，不推 main，不启动生产迁移、purge或部署。共享文件先核查并行PR。

## 下一步

完成 PA-00 差距与文件级范围表、AssistanceRequest/Result到现有interactionContext的映射、PA-01/02验收计划。未测项保持未测，不把静态检查写成运行PASS。

## 新窗口读取顺序

先读仓库 AI-BOOTSTRAP 与当前主线状态（只读），再读本文件、[建设总纲](../roadmap/PERSONAL-AGENT-CONSTRUCTION-BLUEPRINT-v1.0-20261010.md)，最后读取此处链接的当前工作包记录。以仓库与PR实际内容为准，不根据旧聊天恢复状态。
