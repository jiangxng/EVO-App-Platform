export const LEDGER_MANAGER_PACKAGE_ID = "evo-ledger-manager" as const;
export const LEDGER_MANAGER_FEATURE_ID = "evo-ledger-manager.default" as const;
export const LEDGER_MANAGER_DEFINITION_KIND = "LEDGER_RUNTIME_TEMPLATE" as const;

export const LEDGER_MANAGER_PAGE_ID = "evo-ledger-manager.home" as const;
export const LEDGER_MANAGER_PAGE_SOURCE = "app://evo-ledger-manager/pages/home" as const;
export const LEDGER_MANAGER_ROUTE = "/ledger" as const;

export const LEDGER_MANAGER_DETAIL_PAGE_ID = "evo-ledger-manager.detail" as const;
export const LEDGER_MANAGER_DETAIL_PAGE_SOURCE = "app://evo-ledger-manager/pages/detail" as const;
export const LEDGER_MANAGER_DETAIL_ROUTE = "/ledger/detail" as const;

export function ledgerManagerDetailRouteV010(
  definitionId: string,
  definitionRevision: number
): string {
  if (!definitionId.trim()) throw new Error("LEDGER_MANAGER_DEFINITION_ID_REQUIRED");
  if (!Number.isInteger(definitionRevision) || definitionRevision < 0) {
    throw new Error("LEDGER_MANAGER_REVISION_INVALID");
  }
  const query = new URLSearchParams({
    definitionId: definitionId.trim(),
    definitionRevision: String(definitionRevision)
  });
  return `${LEDGER_MANAGER_DETAIL_ROUTE}?${query.toString()}`;
}

export function parseLedgerManagerDetailRouteV010(
  route: string | undefined
): { definitionId: string; definitionRevision: number } | undefined {
  if (!route?.trim() || !route.trim().startsWith("/")) return undefined;
  const url = new URL(route.trim(), "http://evo.local");
  if (url.pathname !== LEDGER_MANAGER_DETAIL_ROUTE) return undefined;
  const definitionId = url.searchParams.get("definitionId")?.trim();
  const revisionText = url.searchParams.get("definitionRevision")?.trim();
  if (!definitionId || !revisionText || !/^\d+$/u.test(revisionText)) {
    return undefined;
  }
  const definitionRevision = Number.parseInt(revisionText, 10);
  if (!Number.isSafeInteger(definitionRevision) || definitionRevision < 0) {
    return undefined;
  }
  return { definitionId, definitionRevision };
}

export const LEDGER_MANAGER_OPEN_DETAIL_COMMAND = "ledger.manager.open-detail" as const;
export const LEDGER_MANAGER_PREVIEW_PROJECTION_COMMAND = "ledger.manager.preview-projection" as const;
export const LEDGER_MANAGER_PUBLISH_COMMAND = "ledger.manager.publish" as const;
export const LEDGER_MANAGER_PUBLISH_AUTHORIZATION_ACTION = "ledger.manager.publish" as const;
