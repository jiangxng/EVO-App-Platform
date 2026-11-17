/**
 * Capture only the control that requested a governed Catalog re-query.
 * Never persist a free-form selector, row value, Principal, or business data.
 */
export type CatalogRouteFocusIntentV010 =
  | { kind: "quick-filter"; actionId: string }
  | { kind: "server-search" };

export function captureCatalogRouteFocusV010(slot: HTMLElement): CatalogRouteFocusIntentV010 | undefined {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !slot.contains(active)) return undefined;
  if (active.matches('[data-eidos-catalog-server-search] input[name="search"]')) {
    return {kind:"server-search"};
  }
  if (active instanceof HTMLButtonElement
    && active.closest("[data-eidos-catalog-quick-filters]")) {
    const actionId = active.dataset.eidosCatalogAction;
    if (actionId?.startsWith("quick-filter-")) {
      return {kind:"quick-filter",actionId};
    }
  }
  return undefined;
}

export function restoreCatalogRouteFocusV010(
  slot: HTMLElement,
  intent: CatalogRouteFocusIntentV010 | undefined
): void {
  if (!intent) return;
  const target = intent.kind === "server-search"
    ? slot.querySelector<HTMLInputElement>('[data-eidos-catalog-server-search] input[name="search"]')
    : Array.from(slot.querySelectorAll<HTMLButtonElement>(
      '[data-eidos-catalog-quick-filters] button[data-eidos-catalog-action]'
    )).find(button => button.dataset.eidosCatalogAction === intent.actionId);
  target?.focus({preventScroll:true});
}

