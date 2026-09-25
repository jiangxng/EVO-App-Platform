import type {
  ExtensionManagerActionV010,
  ExtensionManagerItemV010,
  ExtensionManagerV010
} from "./contracts.js";

function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function actionButton(itemId: string, action: ExtensionManagerActionV010, primary: boolean): string {
  const command = action.command ? ` data-eidos-command="${esc(action.command)}"` : "";
  const inputVersion = action.inputVersion ? ` data-eidos-input-version="${esc(action.inputVersion)}"` : "";
  const route = action.route ? ` data-eidos-route="${esc(action.route)}"` : "";
  const enabled = action.enabled !== false;
  const disabled = enabled ? "" : " disabled";
  const reason = action.disabledReason
    ? ` title="${esc(action.disabledReason)}" data-eidos-disabled-reason="${esc(action.disabledReason)}"`
    : "";
  return `<button type="button" data-eidos-extension-action="${esc(action.id)}" data-eidos-action-type="${esc(action.type)}" data-eidos-item-id="${esc(itemId)}" data-eidos-confirm="${action.requiresConfirmation === true ? "true" : "false"}" data-eidos-primary="${primary ? "true" : "false"}"${command}${inputVersion}${route}${reason}${disabled}>${esc(action.label)}</button>`;
}

function renderItem(item: ExtensionManagerItemV010): string {
  const provides = (item.capabilities?.provides ?? [])
    .map(value => `<span data-eidos-extension-capability data-direction="provides">${esc(value)}</span>`)
    .join("");
  const requires = (item.capabilities?.requires ?? [])
    .map(value => `<span data-eidos-extension-capability data-direction="requires">${esc(value)}</span>`)
    .join("");
  const contributions = (item.contributions ?? [])
    .map(value => `<span data-eidos-extension-contribution>${esc(value.kind)} <strong>${esc(value.count)}</strong></span>`)
    .join("");
  const compatibility = item.compatibility
    ? `<div data-eidos-extension-compatibility data-state="${esc(item.compatibility.state)}"><span>Protocol ${esc(item.compatibility.protocolVersion)}</span>${item.compatibility.hostVersion ? `<span>Host ${esc(item.compatibility.hostVersion)}</span>` : ""}${item.compatibility.eidosVersion ? `<span>Eidos ${esc(item.compatibility.eidosVersion)}</span>` : ""}${item.compatibility.message ? `<span>${esc(item.compatibility.message)}</span>` : ""}</div>`
    : "";
  const trust = item.trust
    ? `<div data-eidos-extension-trust data-level="${esc(item.trust.level)}"><strong>${esc(item.trust.label)}</strong>${item.trust.publisher ? `<span>${esc(item.trust.publisher)}</span>` : ""}${item.trust.source ? `<span>${esc(item.trust.source)}</span>` : ""}${item.trust.message ? `<span>${esc(item.trust.message)}</span>` : ""}</div>`
    : "";
  const permissions = (item.permissions ?? [])
    .map(permission => `<span data-eidos-extension-permission data-risk="${esc(permission.risk)}" data-granted="${permission.granted === true ? "true" : "false"}">${esc(permission.label)}</span>`)
    .join("");
  const activation = item.activation
    ? `<span data-eidos-extension-runtime-tag>Activation: ${esc(item.activation.mode)}${item.activation.events?.length ? ` · ${esc(item.activation.events.join(", "))}` : ""}</span>`
    : "";
  const runtime = item.runtime
    ? `<span data-eidos-extension-runtime-tag>Runtime: ${esc(item.runtime.kind)} / ${esc(item.runtime.isolation)}${item.runtime.status ? ` · ${esc(item.runtime.status)}` : ""}</span>`
    : "";
  const storage = item.storage
    ? `<span data-eidos-extension-runtime-tag>Storage: ${esc(item.storage.state)}</span>`
    : "";
  const eventSummary = item.events
    ? `<span data-eidos-extension-runtime-tag>Events: ${esc(item.events.publish.length)} pub / ${esc(item.events.subscribe.length)} sub</span>`
    : "";
  const actions = [
    ...(item.primaryAction ? [actionButton(item.id, item.primaryAction, true)] : []),
    ...(item.secondaryActions ?? []).map(action => actionButton(item.id, action, false))
  ].join("");

  return `<article data-eidos-extension-item="${esc(item.id)}">
    <header>
      <div data-eidos-extension-identity>
        <h2>${esc(item.title)}</h2>
        <div><span data-eidos-extension-version>v${esc(item.version)}</span>${item.publisher ? `<span data-eidos-extension-publisher>${esc(item.publisher)}</span>` : ""}</div>
      </div>
      <span data-eidos-extension-status data-tone="${esc(item.status.tone ?? "neutral")}">${esc(item.status.label)}</span>
    </header>
    ${item.category ? `<div data-eidos-extension-category>${esc(item.category)}</div>` : ""}
    ${item.description ? `<p data-eidos-extension-description>${esc(item.description)}</p>` : ""}
    ${compatibility}
    ${trust}
    <div data-eidos-extension-section>
      <span data-eidos-extension-section-title>Permissions</span>
      <div data-eidos-extension-tags>${permissions || "<span data-eidos-extension-muted>None requested</span>"}</div>
    </div>
    <div data-eidos-extension-section>
      <span data-eidos-extension-section-title>Activation & Runtime</span>
      <div data-eidos-extension-tags>${activation}${runtime}${storage}${eventSummary}${!activation && !runtime && !storage && !eventSummary ? "<span data-eidos-extension-muted>Declarative host defaults</span>" : ""}</div>
    </div>
    <div data-eidos-extension-section>
      <span data-eidos-extension-section-title>Contributions</span>
      <div data-eidos-extension-tags>${contributions || "<span data-eidos-extension-muted>None</span>"}</div>
    </div>
    <div data-eidos-extension-section>
      <span data-eidos-extension-section-title>Capabilities</span>
      <div data-eidos-extension-tags>${provides}${requires}${!provides && !requires ? "<span data-eidos-extension-muted>None</span>" : ""}</div>
    </div>
    <footer>${actions}</footer>
  </article>`;
}

export function renderExtensionManagerToHtml(input: ExtensionManagerV010): string {
  const ids = new Set<string>();
  for (const item of input.items) {
    if (ids.has(item.id)) throw new Error(`EIDOS_EXTENSION_ITEM_DUPLICATE: ${item.id}`);
    ids.add(item.id);
  }

  const items = input.items.map(renderItem).join("");
  return `<section data-eidos-capability="extension-manager" data-eidos-extension-manager="${esc(input.id)}">
    <header data-eidos-extension-manager-header>
      <div>
        <h1>${esc(input.title)}</h1>
        ${input.description ? `<p>${esc(input.description)}</p>` : ""}
      </div>
      <div data-eidos-extension-host-card>
        <span data-eidos-extension-host-name>${esc(input.host.name)}</span>
        <span data-eidos-extension-protocol>${esc(input.protocol.name)} ${esc(input.protocol.version)}</span>
        <span data-eidos-extension-protocol-status data-status="${esc(input.protocol.status)}">${esc(input.protocol.status)}</span>
      </div>
    </header>
    <div data-eidos-extension-items>${items || `<p data-eidos-empty>${esc(input.emptyMessage ?? "No extensions")}</p>`}</div>
  </section>`;
}
