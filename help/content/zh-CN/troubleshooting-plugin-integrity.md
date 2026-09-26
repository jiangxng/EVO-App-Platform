---
{
  "helpVersion": "0.1.0",
  "id": "evo.troubleshooting.plugin-integrity",
  "ownerPackageId": "evo-app-platform",
  "locale": "zh-CN",
  "kind": "troubleshooting",
  "title": "插件完整性或签名失败",
  "summary": "理解可执行插件为什么会因无效或不可信的完整性证据而被拒绝准入。",
  "audiences": ["admin", "operator", "support", "developer", "agent"],
  "tags": ["故障排查", "插件", "签名", "完整性", "sigstore", "slsa"],
  "contexts": {
    "errorCodes": ["PACKAGE_INTEGRITY_REJECTED", "PROCESS_PACKAGE_SIGNATURE_REQUIRED"]
  },
  "related": ["evo.extension-manager.overview", "evo.plugin.lifecycle"],
  "lastReviewedAt": "2026-09-26"
}
---
可执行插件 Package 必须满足 Host 所有的完整性与信任策略。

## 常见原因

- 签名密钥未知或已撤销；
- 签名无效；
- entrypoint digest 不匹配；
- 可执行 Runtime 缺少要求的签名；
- 声明的 Sigstore 证据验证失败；
- Provenance 与 Host 所有的 builder policy 不匹配。

Package 不能自行建立自己的 root of trust。
