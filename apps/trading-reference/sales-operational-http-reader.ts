import type { CompletePurchaseOperationalPageV010 } from "./operational-projection.js";
import type {
  SalesOperationalEvoReadPortV010
} from "./sales-operational-projection.js";

const PAGE_LIMIT = 100;

/** Only EVO's governed public GET endpoints; no private SQL, cache or write. */
export function createSalesOperationalEvoHttpReaderV010(options: {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}): SalesOperationalEvoReadPortV010 {
  const base = options.baseUrl.trim().replace(/\/$/u, "");
  if (!/^https?:\/\//u.test(base)) {
    throw new Error("TR01B2_EVO_BASE_URL_INVALID");
  }
  const http = options.fetchImpl ?? globalThis.fetch;
  async function page<T>(path: string): Promise<CompletePurchaseOperationalPageV010<T>> {
    const response = await http(base + path, {
      headers: { accept: "application/json" }
    });
    if (!response.ok) throw new Error("TR01B2_EVO_READ_FAILED:" + response.status);
    const data = await response.json() as unknown;
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("TR01B2_EVO_RESPONSE_INVALID");
    }
    const result = data as Record<string, unknown>;
    if (!Array.isArray(result.items) || result.truncated === true) {
      // Truncation is a fail-closed condition even if fewer than PAGE_LIMIT items.
      if (result.truncated === true && Array.isArray(result.items)) {
        return { items: result.items as T[], complete: false };
      }
      throw new Error("TR01B2_EVO_RESPONSE_INVALID");
    }
    return {
      items: result.items as T[],
      complete: result.items.length < PAGE_LIMIT
        && !result.nextCursor && !result.next_cursor
    };
  }
  return {
    listOpenWorkItems(enterpriseId) {
      const qs = new URLSearchParams({
        enterprise_id: enterpriseId, limit: String(PAGE_LIMIT)
      });
      return page("/api/v1/work-items?" + qs);
    },
    readLedgerBalances(enterpriseId, ledger, dimensions) {
      const qs = new URLSearchParams({
        enterprise_id: enterpriseId, limit: String(PAGE_LIMIT)
      });
      for (const [key, value] of Object.entries(dimensions)) {
        qs.set("dimension." + key, value);
      }
      return page(
        "/api/v1/ledgers/" + encodeURIComponent(ledger)
        + "/balances?" + qs
      );
    }
  };
}
