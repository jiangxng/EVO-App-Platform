import type {
  PurchaseOperationalEvoReadPortV010,
  CompletePurchaseOperationalPageV010
} from "./operational-projection.js";

const PAGE_LIMIT = 100;

export function createPurchaseOperationalEvoHttpReaderV010(options: {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}): PurchaseOperationalEvoReadPortV010 {
  const url = options.baseUrl.trim().replace(/\/$/u, "");
  if (!/^https?:\/\//u.test(url)) {
    throw new Error("TR01_OPERATIONAL_EVO_BASE_URL_INVALID");
  }
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  async function getPage<T>(path: string): Promise<CompletePurchaseOperationalPageV010<T>> {
    const result = await fetchImpl(url + path, {
      headers: { accept: "application/json" }
    });
    if (!result.ok) {
      throw new Error("TR01_OPERATIONAL_EVO_READ_FAILED:" + result.status);
    }
    const body = await result.json() as unknown;
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("TR01_OPERATIONAL_EVO_RESPONSE_INVALID");
    }
    const data = body as Record<string, unknown>;
    if (!Array.isArray(data.items)) {
      throw new Error("TR01_OPERATIONAL_EVO_RESPONSE_INVALID");
    }
    return {
      items: data.items as T[],
      complete: data.items.length < PAGE_LIMIT
        && !data.nextCursor
        && !data.next_cursor
    };
  }
  return {
    listOpenWorkItems(enterpriseId) {
      const qs = new URLSearchParams({
        enterprise_id: enterpriseId,
        limit: String(PAGE_LIMIT)
      });
      return getPage("/api/v1/work-items?" + qs.toString());
    },
    readLedgerBalances(enterpriseId, ledgerCode, dimensions) {
      const qs = new URLSearchParams({
        enterprise_id: enterpriseId,
        limit: String(PAGE_LIMIT)
      });
      for (const [key, value] of Object.entries(dimensions)) {
        qs.set("dimension." + key, value);
      }
      return getPage("/api/v1/ledgers/"
        + encodeURIComponent(ledgerCode)
        + "/balances?" + qs.toString());
    }
  };
}
