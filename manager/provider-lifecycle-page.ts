import type { SettingsEditorV020 } from "../vendor/eidos/src/settings/contracts.js";
import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";

export const providerLifecyclePageSource = "app://evo-app-platform/pages/provider-lifecycle";
export function createProviderLifecyclePage(locale = "en"): SettingsEditorV020 {
  const zh = locale.startsWith("zh");
  return { contractVersion: "0.2.0", kind: "settings-editor", id: "evo-provider-lifecycle",
    namespace: "provider-lifecycle", title: zh ? "运行与清理" : "Runtime and cleanup",
    description: zh ? "查询已接入的运行实例，或重试未完成的清理。不会安装、启用或停用插件。" : "Inspect registered runtimes or retry unfinished cleanup. This does not install, enable or disable plugins.",
    command: { code: "app-platform.inspect-provider-lifecycle", inputVersion: "0.1.0" },
    groups: [{ id: "administration", title: zh ? "管理员验证" : "Administrator verification", settings: [{
      key: "adminToken", label: zh ? "管理员凭据" : "Administrator credential", type: "secret", value: "",
      description: zh ? "凭据只用于当前页面请求，不保存到浏览器或审计记录。" : "Used only for requests on this page; never stored in browser storage or audit records."
    }] }], saveLabel: zh ? "查询 / 刷新状态" : "Inspect / refresh status" };
}
export interface ProviderLifecycleRowV010 {
  packageId: string; phase: string; activeCalls: number; blocked: boolean; cleanupPending: boolean;
}
export function createProviderLifecycleResults(rows: ProviderLifecycleRowV010[], locale = "en"): CatalogBrowserV010 {
  const zh = locale.startsWith("zh");
  const labels: Record<string, string> = zh
    ? { IDLE: "尚未加载", LOADING: "加载中", READY: "运行就绪", STOPPING: "清理中", STOP_TIMEOUT: "等待超时，清理未完成", STOP_FAILED: "清理失败", STOPPED: "已停止" }
    : { IDLE: "Not loaded", LOADING: "Loading", READY: "Ready", STOPPING: "Stopping", STOP_TIMEOUT: "Wait timed out; cleanup incomplete", STOP_FAILED: "Cleanup failed", STOPPED: "Stopped" };
  return { contractVersion: "0.1.0", kind: "catalog-browser", layout: "list", density: "comfortable",
    id: "evo-provider-lifecycle-results", title: zh ? "运行实例" : "Runtime instances",
    description: zh ? "状态为上次查询时的快照。尚未加载不代表已安装；本页只显示已接入治理的实例。" : "Snapshot from the last inspection. Not loaded does not mean installed; only registered runtimes are shown.",
    emptyMessage: zh ? "暂无已接入的实例。" : "No registered runtimes.",
    items: rows.map(row => {
      const retry = row.blocked && ["STOPPING", "STOP_TIMEOUT", "STOP_FAILED"].includes(row.phase);
      return { id: row.packageId, title: row.packageId,
        status: { label: labels[row.phase] ?? row.phase, tone: retry ? "warning" : "neutral" },
        summary: zh ? `进行中的调用：${row.activeCalls}；${row.cleanupPending ? "清理任务尚未完成" : "无进行中的清理任务"}`
          : `Active calls: ${row.activeCalls}; ${row.cleanupPending ? "cleanup pending" : "no cleanup task running"}`,
        primaryAction: { id: "retry-stop", label: row.phase === "STOP_FAILED" ? (zh ? "重试清理" : "Retry cleanup") : (zh ? "等待清理完成" : "Wait for cleanup"),
          type: "command", enabled: retry, disabledReason: retry ? undefined : (zh ? "当前没有待重试的清理" : "No unfinished cleanup to retry") } };
    }) };
}
