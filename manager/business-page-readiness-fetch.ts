import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";

/**
 * A platform-owned presentation adapter, not a lifecycle or authorization bypass.
 * The API continues to return 409 when a business route has no Enterprise Context.
 * Only the browser's Eidos page renderer receives an actionable read-only state.
 */
export function createBusinessPageReadinessFetchV010(
  fetchImpl: typeof fetch,
  locale: () => string | undefined
): typeof fetch {
  return async (input, init) => {
    const response = await fetchImpl(input, init);
    if (response.status !== 409) return response;

    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL ? input.toString() : input.url,
      "http://localhost"
    );
    // Never alter other APIs, command authorization, plugin lifecycle, or auth.
    if (url.pathname !== "/v1/experience-pages") return response;

    let code: unknown;
    try {
      const payload = await response.clone().json() as { code?: unknown };
      code = payload?.code;
    } catch {
      return response;
    }
    // Error semantics are owned by the Host/domain. Only *known context
    // preconditions* produce a visible missing-enterprise page.
    if (
      typeof code !== "string"
      || !/^(?:[A-Z0-9_]+_)?ENTERPRISE_CONTEXT_REQUIRED$/u.test(code)
    ) {
      return response;
    }

    const language = locale()?.toLowerCase() ?? "";
    const zh = language.startsWith("zh");
    const ja = language.startsWith("ja");
    const page: CatalogBrowserV010 = {
      contractVersion: "0.1.0",
      kind: "catalog-browser",
      layout: "list",
      id: "evo.platform.enterprise-context-required",
      title: zh ? "当前应用尚未关联企业"
        : ja ? "このアプリに利用可能な企業がありません"
          : "No enterprise available for this app",
      description: zh
        ? "应用入口已加载，但当前没有可用的企业业务环境，因此无法打开业务内容。"
        : ja
          ? "アプリの入口はありますが、利用できる企業コンテキストがないため業務内容を表示できません。"
          : "This app is listed, but no enterprise context is available to load its business content.",
      items: [],
      emptyMessage: zh
        ? "请先创建或关联企业，并确认相应应用已配置可用的业务服务。"
        : ja
          ? "企業を作成または関連付け、必要なアプリの業務サービスが設定されていることを確認してください。"
          : "Create or connect an enterprise, then confirm its app services are configured."
    };
    // Intentionally no ETag: after the enterprise context changes, the
    // original page must be requested again rather than serving a stale notice.
    return new Response(JSON.stringify(page), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  };
}
