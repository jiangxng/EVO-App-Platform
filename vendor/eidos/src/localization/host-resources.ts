import type { LocalizationBundleV010 } from "./contracts.js";

export const eidosAppHostLocalizationBundles: LocalizationBundleV010[] = [
  {
    contractVersion: "0.1.0",
    namespace: "eidos.app-host",
    locale: "en",
    messages: {
      "shell.language": "Language",
      "shell.applications": "Applications",
      "shell.noActivePage": "No active application page.",
      "shell.noRoute": "No active route for '{path}'.",
      "shell.noActionHost": "No App Host ActionHost is configured.",
      "shell.executing": "Executing…",
      "shell.completed": "Completed.",
      "shell.next": "Next: {next}",
      "shell.actionFailed": "Action failed: {message}",
      "shell.status": "App Host: {status} · revision {revision}",
      "shell.statusDiagnostics": "App Host: {status} · {count} diagnostic(s)"
    }
  },
  {
    contractVersion: "0.1.0",
    namespace: "eidos.app-host",
    locale: "zh-CN",
    messages: {
      "shell.language": "语言",
      "shell.applications": "应用",
      "shell.noActivePage": "当前没有可用的应用页面。",
      "shell.noRoute": "当前路径“{path}”没有可用页面。",
      "shell.noActionHost": "App Host 尚未配置 ActionHost。",
      "shell.executing": "正在执行…",
      "shell.completed": "已完成。",
      "shell.next": "下一步：{next}",
      "shell.actionFailed": "操作失败：{message}",
      "shell.status": "App Host：{status} · 版本 {revision}",
      "shell.statusDiagnostics": "App Host：{status} · {count} 个诊断"
    }
  }
];
