import { renderCatalogBrowserToHtml } from "../vendor/eidos/src/catalog-browser/render.js";
import { createProviderLifecycleResults, type ProviderLifecycleRowV010 } from "./provider-lifecycle-page.js";

const busy = new WeakSet<HTMLFormElement>();
export async function inspectProviderLifecycle(form: HTMLFormElement, fetchImpl: typeof fetch, locale: string) {
  if (busy.has(form)) return;
  const zh = locale.startsWith("zh");
  const section = form.closest<HTMLElement>('[data-namespace="provider-lifecycle"]');
  const credential = form.elements.namedItem("adminToken") as HTMLInputElement | null;
  if (!section || !credential) return;
  let result = section.querySelector<HTMLElement>('[data-provider-lifecycle-result]');
  if (!result) {
    result = document.createElement("div"); result.setAttribute("data-provider-lifecycle-result", "");
    result.setAttribute("aria-live", "polite"); section.append(result);
  }
  const output = result;
  async function request(packageId?: string) {
    if (busy.has(form) || !form.isConnected) return;
    const token = credential!.value.trim();
    if (!token) { output.textContent = zh ? "请先输入管理员凭据。" : "Enter an administrator credential."; return; }
    busy.add(form);
    form.querySelectorAll<HTMLButtonElement>('button').forEach(button => { button.disabled = true; });
    output.textContent = zh ? "正在查询或等待清理，请稍候…" : "Inspecting or waiting for cleanup…";
    try {
      const headers = { authorization: `Bearer ${token}` };
      let notice = "";
      if (packageId) {
        const response = await fetchImpl('/v1/providers/lifecycle/retry-stop?packageId=' + encodeURIComponent(packageId), { method: 'POST', headers, signal: AbortSignal.timeout(35_000) });
        if (response.status === 403) throw Error("denied");
        notice = response.ok ? (zh ? "清理已完成。" : "Cleanup completed.")
          : response.status === 504 ? (zh ? "等待超时，清理仍未完成。可稍后刷新。" : "Wait timed out; cleanup is still pending. Refresh later.")
          : (zh ? "清理未完成，请查看最新状态。" : "Cleanup did not complete; inspect the latest state.");
      }
      const response = await fetchImpl('/v1/providers/lifecycle', { headers, signal: AbortSignal.timeout(35_000) });
      if (!response.ok) throw Error("denied");
      const value = await response.json() as { runtimes: ProviderLifecycleRowV010[] };
      if (!form.isConnected) return;
      output.innerHTML = renderCatalogBrowserToHtml(createProviderLifecycleResults(value.runtimes, locale));
      if (notice) { const status = document.createElement('p'); status.textContent = notice; output.prepend(status); }
      output.querySelectorAll<HTMLButtonElement>('[data-eidos-catalog-action="retry-stop"]').forEach(button => {
        button.addEventListener('click', () => { if (!button.disabled) void request(button.dataset.eidosItemId); });
      });
    } catch {
      if (form.isConnected) output.textContent = zh ? "无法查询或重试。请检查管理员凭据、权限和网络，然后重新查询。" : "Unable to inspect or retry. Check credentials, permission and connectivity, then inspect again.";
    } finally {
      busy.delete(form);
      form.querySelectorAll<HTMLButtonElement>('button').forEach(button => { button.disabled = false; });
    }
  }
  await request();
}
