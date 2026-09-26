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


## 安装与设置

个人 Agent 将“已安装”和“已就绪”明确区分。

安装完成后，Host 会检查是否存在可用的 `llm.inference` Provider。如果仍需配置，插件页面会显示**需要设置**，并打开 Eidos Setup Flow，而不是让用户进入一个无法工作的聊天界面。

Provider 选择和凭据配置不属于个人 Agent：

1. 安装个人 Agent。
2. 如有需要，选择或安装 LLM Provider。
3. 在 Provider 自己的 Settings 页面配置模型、Endpoint 与 API 凭据。
4. Host 重新评估 Provider 就绪状态。
5. 就绪后打开个人 Agent。

当存在多个 LLM Provider 时，EVO 不会按照 Package 名称顺序偷偷替用户选择。

## Eidos 原生体验

个人 Agent 使用 Eidos Chat v0.2。Side Panel 可以展示当前 Context、就绪状态、建议问题以及可观察的工具活动。

工具活动只表示 Host 实际执行过的动作，例如读取 Context 或搜索帮助，不是模型的私有推理过程。

Provider/设置问题会显示为 readiness/setup 状态，而不是伪装成 Agent 的聊天回复。

个人 Agent 新界面同时以英文、简体中文、日文和繁体中文交付。
