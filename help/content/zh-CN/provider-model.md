---
{
  "helpVersion": "0.1.0",
  "id": "evo.provider.model",
  "ownerPackageId": "evo-app-platform",
  "locale": "zh-CN",
  "kind": "concept",
  "title": "Provider 模型",
  "summary": "理解可替换平台服务与确定性的 Provider 解析。",
  "audiences": ["admin", "developer", "agent"],
  "tags": ["provider", "capability", "解析"],
  "contexts": {
    "routes": ["/providers"],
    "capabilities": ["llm.inference", "authorization.check", "plugin.remote-credential"]
  },
  "related": ["evo.provider.binding", "evo.provider.health", "evo.authorization.authentication-vs-authorization"],
  "lastReviewedAt": "2026-09-26"
}
---
Provider 是某个可替换平台 Capability 的可安装实现。

## 为什么需要 Provider

平台可以为 LLM 推理、授权、远程凭据等能力支持多个实现，而不把某个供应商硬编码进 Core。

## 解析规则

Provider 选择必须确定且支持作用域。若存在多个可执行 Provider 而没有适用的显式绑定，解析会 fail closed。

> [!WARNING] 健康状态不是策略
> Provider health 可以用于判断就绪状态和运维可见性，但不能静默改变显式绑定。
