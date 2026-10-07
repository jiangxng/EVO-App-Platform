export interface EidosContextNavigationItemV010 {
  id: string;
  label: string;
  route?: string;
}

export interface EidosContextNavigationV010 {
  items: EidosContextNavigationItemV010[];
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function assertContextNavigationV010(
  value: EidosContextNavigationV010 | undefined
): EidosContextNavigationV010 | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value.items) || value.items.length < 2) {
    throw new Error("EIDOS_CONTEXT_NAVIGATION_ITEMS_INVALID");
  }
  const ids = new Set<string>();
  for (const item of value.items) {
    if (!item?.id?.trim() || !item.label?.trim()) {
      throw new Error("EIDOS_CONTEXT_NAVIGATION_ITEM_INVALID");
    }
    if (ids.has(item.id)) {
      throw new Error("EIDOS_CONTEXT_NAVIGATION_ITEM_DUPLICATE");
    }
    ids.add(item.id);
    if (
      item.route !== undefined
      && (!item.route.trim() || !item.route.startsWith("/"))
    ) {
      throw new Error("EIDOS_CONTEXT_NAVIGATION_ROUTE_INVALID");
    }
  }
  return {
    items: value.items.map(item => ({
      id: item.id.trim(),
      label: item.label.trim(),
      ...(item.route ? { route: item.route.trim() } : {})
    }))
  };
}

export function renderContextNavigationV010(
  navigation: EidosContextNavigationV010 | undefined
): string {
  if (!navigation || navigation.items.length < 2) return "";
  const items = navigation.items;

  const desktop = items.map((item, index) => {
    const current = index === items.length - 1;
    const content = item.route
      ? `<button type="button" data-eidos-context-route="${esc(item.route)}">${esc(item.label)}</button>`
      : `<span${current ? ' aria-current="page"' : ""}>${esc(item.label)}</span>`;
    return `${index > 0 ? '<span data-eidos-context-separator aria-hidden="true">›</span>' : ""}${content}`;
  }).join("");

  const parent = [...items.slice(0, -1)].reverse().find(item => item.route);
  const mobile = parent?.route
    ? `<button type="button" data-eidos-context-route="${esc(parent.route)}" data-eidos-mobile-context-parent>‹ ${esc(parent.label)}</button>`
    : "";

  return `<nav data-eidos-context-navigation aria-label="Context navigation">
<div data-eidos-context-navigation-desktop>${desktop}</div>
<div data-eidos-context-navigation-mobile>${mobile}</div>
</nav>`;
}
