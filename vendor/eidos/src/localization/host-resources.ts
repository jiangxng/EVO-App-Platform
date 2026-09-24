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
      "shell.statusDiagnostics": "App Host: {status} · {count} diagnostic(s)",
      "shell.actionUnavailable": "This action is not available yet.",
      "shell.actionIncomplete": "Catalog command action is incomplete.",
      "shell.confirm": "Confirm action?",
      "shell.assistantUnavailable": "Assistant is not installed or active.",
      "shell.browserAddress": "Workspace address",
      "shell.browserGo": "Open",
      "shell.browserOpenExternal": "Open externally",
      "shell.browserExternalContent": "External web content",
      "shell.browserInvalidTarget": "Enter an App Host route beginning with '/' or an http(s) URL.",
      "shell.mobileMenu": "Menu",
      "shell.mobileChat": "Chat",
      "shell.mobileWorkspace": "Workspace"
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
      "shell.statusDiagnostics": "App Host：{status} · {count} 个诊断",
      "shell.actionUnavailable": "此操作当前不可用。",
      "shell.actionIncomplete": "Catalog 命令操作信息不完整。",
      "shell.confirm": "确认执行？",
      "shell.assistantUnavailable": "智能助手尚未安装或启用。",
      "shell.browserAddress": "工作区地址",
      "shell.browserGo": "打开",
      "shell.browserOpenExternal": "外部打开",
      "shell.browserExternalContent": "外部网页内容",
      "shell.browserInvalidTarget": "请输入以“/”开头的 App Host 路径，或 http(s) URL。",
      "shell.mobileMenu": "菜单",
      "shell.mobileChat": "对话",
      "shell.mobileWorkspace": "工作区"
    }
  }
];
