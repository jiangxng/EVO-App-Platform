---
{
  "helpVersion": "0.1.0",
  "id": "evo.personal-agent.world-model",
  "ownerPackageId": "enterprise-agent",
  "ownerFeatureId": "enterprise-agent.default",
  "locale": "zh-CN",
  "kind": "concept",
  "title": "个人 Agent 与 Context Memory",
  "summary": "理解 EVO 的 Person-first 模型：一个个人 Agent、个人上下文和受治理的企业上下文。",
  "audiences": ["user", "admin", "operator", "developer", "agent"],
  "tags": ["personal-agent", "个人上下文", "企业上下文", "context-memory", "人类决策"],
  "contexts": {
    "packageIds": ["enterprise-agent"],
    "featureIds": ["enterprise-agent.default"],
    "capabilities": ["agent.personal", "agent.personal.tool-discovery"],
    "commands": ["enterprise-agent.chat"]
  },
  "related": ["evo.enterprise-agent.tools", "evo.authorization.authentication-vs-authorization", "evo.workbench.overview"],
  "lastReviewedAt": "2026-09-26"
}
---
EVO 的第一视角是人。MVP 只有一种 Agent：个人 Agent。

## 个人上下文

个人上下文属于人的长期工作身份，可包含经过允许保存的偏好、可复用经验以及 Personal Context Memory。

## 企业上下文

企业上下文是受治理的企业工作与学习资料，可提供业务数据、历史、文档、工具以及 Enterprise Context Memory。

企业上下文不是第二个 Agent，也不拥有人的身份。

## Context Memory

Personal Context Memory 与 Enterprise Context Memory 是两个独立的长期资产。能够读取企业上下文，并不自动代表允许把企业机密事实复制到个人 Context Memory。

## 人类决策权

个人 Agent 可以观察、分析、解释和提出意见或方案。

重要决策仍由人类完成，除非未来存在明确的授权委托契约。

> [!INFO] 兼容命名
> 当前 Package、route 与 command 为兼容仍保留 enterprise-agent 机器标识；产品面对用户的名称已经是个人 Agent。
