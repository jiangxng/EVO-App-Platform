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

function attr(name: string, value: unknown): string {
  return " " + name + "=\"" + esc(value) + "\"";
}

function actionButton(itemId: string, action: ExtensionManagerActionV010, primary: boolean): string {
  const enabled = action.enabled !== false;
  return "<button type=\"button\""
    + attr("data-eidos-extension-action", action.id)
    + attr("data-eidos-action-type", action.type)
    + attr("data-eidos-item-id", itemId)
    + attr("data-eidos-confirm", action.requiresConfirmation === true ? "true" : "false")
    + attr("data-eidos-primary", primary ? "true" : "false")
    + (action.command ? attr("data-eidos-command", action.command) : "")
    + (action.inputVersion ? attr("data-eidos-input-version", action.inputVersion) : "")
    + (action.route ? attr("data-eidos-route", action.route) : "")
    + (action.disabledReason ? attr("title", action.disabledReason) + attr("data-eidos-disabled-reason", action.disabledReason) : "")
    + (enabled ? "" : " disabled")
    + ">" + esc(action.label) + "</button>";
}

function technicalDetails(item: ExtensionManagerItemV010): string {
  const provides = (item.capabilities?.provides ?? [])
    .map(value => "<span data-eidos-extension-capability data-direction=\"provides\">" + esc(value) + "</span>")
    .join("");
  const requires = (item.capabilities?.requires ?? [])
    .map(value => "<span data-eidos-extension-capability data-direction=\"requires\">" + esc(value) + "</span>")
    .join("");
  const contributions = (item.contributions ?? [])
    .map(value => "<span data-eidos-extension-contribution>" + esc(value.kind) + " <strong>" + esc(value.count) + "</strong></span>")
    .join("");
  const compatibility = item.compatibility
    ? "<div data-eidos-extension-compatibility" + attr("data-state", item.compatibility.state) + ">"
      + "<span>Protocol " + esc(item.compatibility.protocolVersion) + "</span>"
      + (item.compatibility.hostVersion ? "<span>Host " + esc(item.compatibility.hostVersion) + "</span>" : "")
      + (item.compatibility.eidosVersion ? "<span>Eidos " + esc(item.compatibility.eidosVersion) + "</span>" : "")
      + (item.compatibility.message ? "<span>" + esc(item.compatibility.message) + "</span>" : "")
      + "</div>"
    : "";
  const integrity = item.integrity
    ? "<div data-eidos-extension-integrity" + attr("data-state", item.integrity.state) + "><strong>" + esc(item.integrity.label) + "</strong>"
      + (item.integrity.algorithm ? "<span>" + esc(item.integrity.algorithm) + "</span>" : "")
      + (item.integrity.keyId ? "<span>Key " + esc(item.integrity.keyId) + "</span>" : "")
      + (item.integrity.digest ? "<span>" + esc(item.integrity.digest) + "</span>" : "")
      + (item.integrity.provenance ? "<span>" + esc(item.integrity.provenance) + "</span>" : "")
      + (item.integrity.message ? "<span>" + esc(item.integrity.message) + "</span>" : "")
      + "</div>"
    : "";
  const activation = item.activation
    ? "<span data-eidos-extension-runtime-tag>Activation: " + esc(item.activation.mode)
      + (item.activation.events?.length ? " · " + esc(item.activation.events.join(", ")) : "") + "</span>"
    : "";
  const runtime = item.runtime
    ? "<span data-eidos-extension-runtime-tag>Runtime: " + esc(item.runtime.kind) + " / " + esc(item.runtime.isolation)
      + (item.runtime.status ? " · " + esc(item.runtime.status) : "")
      + (item.runtime.health ? " · " + esc(item.runtime.health) : "") + "</span>"
    : "";
  const runtimeMetrics = item.runtime?.metrics
    ? "<span data-eidos-extension-runtime-tag>Runtime events: "
      + esc(item.runtime.metrics.invocations) + " inv · "
      + esc(item.runtime.metrics.failures) + " fail · "
      + esc(item.runtime.metrics.timeouts) + " timeout · "
      + esc(item.runtime.metrics.crashes) + " crash · "
      + esc(item.runtime.metrics.restarts) + " restart"
      + (item.runtime.metrics.lastError ? " · " + esc(item.runtime.metrics.lastError) : "")
      + "</span>"
    : "";
  const runtimeHistory = item.runtime?.history?.length
    ? "<details data-eidos-extension-runtime-history><summary>Recent runtime activity · " + esc(item.runtime.history.length) + "</summary><div>"
      + item.runtime.history.map(event =>
        "<div data-eidos-extension-runtime-event><span>" + esc(event.occurredAt) + "</span><strong>" + esc(event.type) + "</strong>"
        + (event.method ? "<span>" + esc(event.method) + "</span>" : "")
        + (event.durationMs !== undefined ? "<span>" + esc(event.durationMs) + "ms</span>" : "")
        + (event.message ? "<span>" + esc(event.message) + "</span>" : "")
        + "</div>"
      ).join("")
      + "</div></details>"
    : "";
  const storage = item.storage
    ? "<span data-eidos-extension-runtime-tag>Storage: " + esc(item.storage.state) + "</span>"
    : "";
  const eventSummary = item.events
    ? "<span data-eidos-extension-runtime-tag>Events: " + esc(item.events.publish.length) + " pub / " + esc(item.events.subscribe.length) + " sub</span>"
    : "";

  return compatibility
    + integrity
    + "<div data-eidos-extension-section><span data-eidos-extension-section-title>Activation & Runtime</span>"
    + "<div data-eidos-extension-tags>" + activation + runtime + runtimeMetrics + storage + eventSummary
    + (!activation && !runtime && !storage && !eventSummary ? "<span data-eidos-extension-muted>Declarative host defaults</span>" : "")
    + "</div>" + runtimeHistory + "</div>"
    + "<div data-eidos-extension-section><span data-eidos-extension-section-title>Contributions</span>"
    + "<div data-eidos-extension-tags>" + (contributions || "<span data-eidos-extension-muted>None</span>") + "</div></div>"
    + "<div data-eidos-extension-section><span data-eidos-extension-section-title>Capabilities</span>"
    + "<div data-eidos-extension-tags>" + provides + requires
    + (!provides && !requires ? "<span data-eidos-extension-muted>None</span>" : "")
    + "</div></div>";
}

function renderItem(item: ExtensionManagerItemV010, technicalDetailsLabel: string): string {
  const permissions = (item.permissions ?? [])
    .map(permission => "<span data-eidos-extension-permission"
      + attr("data-risk", permission.risk)
      + attr("data-granted", permission.granted === true ? "true" : "false")
      + ">" + esc(permission.label) + "</span>")
    .join("");

  const trust = item.trust && item.trust.level !== "trusted"
    ? "<div data-eidos-extension-trust" + attr("data-level", item.trust.level) + "><strong>" + esc(item.trust.label) + "</strong>"
      + (item.trust.publisher ? "<span>" + esc(item.trust.publisher) + "</span>" : "")
      + (item.trust.source ? "<span>" + esc(item.trust.source) + "</span>" : "")
      + (item.trust.message ? "<span>" + esc(item.trust.message) + "</span>" : "")
      + "</div>"
    : "";

  const readiness = item.readiness
    ? "<div data-eidos-extension-readiness" + attr("data-tone", item.readiness.tone ?? "neutral")
      + attr("data-readiness", item.readiness.id) + "><strong>" + esc(item.readiness.label) + "</strong>"
      + (item.readiness.message ? "<span>" + esc(item.readiness.message) + "</span>" : "")
      + "</div>"
    : "";

  const actions = [
    ...(item.primaryAction ? [actionButton(item.id, item.primaryAction, true)] : []),
    ...(item.secondaryActions ?? []).map(action => actionButton(item.id, action, false))
  ].join("");

  return "<article" + attr("data-eidos-extension-item", item.id) + ">"
    + "<header><div data-eidos-extension-identity><h2>" + esc(item.title) + "</h2><div>"
    + "<span data-eidos-extension-version>v" + esc(item.version) + "</span>"
    + (item.publisher ? "<span data-eidos-extension-publisher>" + esc(item.publisher) + "</span>" : "")
    + "</div></div>"
    + "<div data-eidos-extension-state-stack><span data-eidos-extension-status"
    + attr("data-tone", item.status.tone ?? "neutral") + ">" + esc(item.status.label) + "</span>"
    + (item.readiness ? "<span data-eidos-extension-readiness-badge"
      + attr("data-tone", item.readiness.tone ?? "neutral") + ">" + esc(item.readiness.label) + "</span>" : "")
    + "</div></header>"
    + (item.category ? "<div data-eidos-extension-category>" + esc(item.category) + "</div>" : "")
    + (item.description ? "<p data-eidos-extension-description>" + esc(item.description) + "</p>" : "")
    + readiness
    + trust
    + (permissions
      ? "<div data-eidos-extension-section data-eidos-extension-important><span data-eidos-extension-section-title>Permissions</span>"
        + "<div data-eidos-extension-tags>" + permissions + "</div></div>"
      : "")
    + "<details data-eidos-extension-technical><summary>" + esc(technicalDetailsLabel) + "</summary>"
    + "<div data-eidos-extension-technical-body>" + technicalDetails(item) + "</div></details>"
    + "<footer>" + actions + "</footer></article>";
}

export function renderExtensionManagerToHtml(input: ExtensionManagerV010): string {
  const ids = new Set<string>();
  for (const item of input.items) {
    if (ids.has(item.id)) throw new Error("EIDOS_EXTENSION_ITEM_DUPLICATE: " + item.id);
    ids.add(item.id);
  }

  const label = input.technicalDetailsLabel ?? "Technical details";
  const items = input.items.map(item => renderItem(item, label)).join("");
  return "<section data-eidos-capability=\"extension-manager\""
    + attr("data-eidos-extension-manager", input.id)
    + "><header data-eidos-extension-manager-header><div><h1>" + esc(input.title) + "</h1>"
    + (input.description ? "<p>" + esc(input.description) + "</p>" : "")
    + "</div><div data-eidos-extension-host-card><span data-eidos-extension-host-name>" + esc(input.host.name) + "</span>"
    + "<span data-eidos-extension-protocol>" + esc(input.protocol.name) + " " + esc(input.protocol.version) + "</span>"
    + "<span data-eidos-extension-protocol-status" + attr("data-status", input.protocol.status) + ">" + esc(input.protocol.status) + "</span>"
    + "</div></header><div data-eidos-extension-items>"
    + (items || "<p data-eidos-empty>" + esc(input.emptyMessage ?? "No extensions") + "</p>")
    + "</div></section>";
}
