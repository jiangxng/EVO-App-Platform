import type {
  ChatActionV020,
  ChatExperienceV010,
  ChatExperienceV020,
  ChatMessagePartV020,
  ChatMessageV010,
  ChatMessageV020
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

function renderAction(action: ChatActionV020): string {
  return "<button type=\"button\""
    + attr("data-eidos-chat-action", action.id)
    + attr("data-eidos-action-type", action.type)
    + attr("data-eidos-primary", action.primary === true ? "true" : "false")
    + attr("data-eidos-confirm", action.requiresConfirmation === true ? "true" : "false")
    + (action.command ? attr("data-eidos-command", action.command) : "")
    + (action.inputVersion ? attr("data-eidos-input-version", action.inputVersion) : "")
    + (action.route ? attr("data-eidos-route", action.route) : "")
    + (action.prompt ? attr("data-eidos-chat-prompt", action.prompt) : "")
    + ">" + esc(action.label) + "</button>";
}

export function renderChatExperienceToHtml(document: ChatExperienceV010 | ChatExperienceV020): string {
  if (document.contractVersion === "0.1.0") {
    const empty = document.emptyState
      ? "<div data-eidos-chat-empty>" + esc(document.emptyState) + "</div>"
      : "";
    return "<section"
      + attr("data-eidos-chat", document.id)
      + attr("data-chat-version", "0.1.0")
      + attr("data-command", document.command.code)
      + attr("data-input-version", document.command.inputVersion)
      + "><header data-eidos-chat-header><h1>" + esc(document.title) + "</h1></header>"
      + "<div data-eidos-chat-transcript role=\"log\" aria-live=\"polite\">" + empty + "</div>"
      + "<form data-eidos-chat-composer>"
      + "<textarea" + attr("name", document.composer.key) + " rows=\"3\""
      + attr("placeholder", document.composer.placeholder)
      + attr("aria-label", document.composer.placeholder) + "></textarea>"
      + "<button type=\"submit\">" + esc(document.composer.sendLabel) + "</button>"
      + "</form></section>";
  }

  const contextSelector = document.context?.selector
    ? "<select data-eidos-chat-context-selector"
      + attr("aria-label", document.context.selector.ariaLabel)
      + ">" + document.context.selector.options.map(option =>
        "<option"
          + attr("value", option.id)
          + attr("data-eidos-chat-context-value", JSON.stringify(option.value))
          + (option.id === document.context?.selector?.selectedId ? " selected" : "")
          + ">" + esc(option.label) + "</option>"
      ).join("") + "</select>"
    : "";

  const context = document.context
    ? "<div data-eidos-chat-context" + attr("data-tone", document.context.tone ?? "neutral")
      + "><span>" + esc(document.context.label) + "</span>"
      + (contextSelector || "<strong>" + esc(document.context.value) + "</strong>")
      + "</div>"
    : "";

  const readiness = document.readiness && document.readiness.state !== "ready"
    ? "<section data-eidos-chat-readiness"
      + attr("data-state", document.readiness.state)
      + attr("role", document.readiness.state === "unavailable" ? "alert" : "status")
      + "><strong>" + esc(document.readiness.label) + "</strong>"
      + (document.readiness.message ? "<p>" + esc(document.readiness.message) + "</p>" : "")
      + (document.readiness.action
        ? "<div data-eidos-chat-readiness-actions>"
          + renderAction({ ...document.readiness.action, primary: true })
          + "</div>"
        : "")
      + "</section>"
    : "";

  const suggestions = (document.emptyState?.suggestions ?? []).map(item =>
    "<button type=\"button\""
      + attr("data-eidos-chat-suggestion", item.id)
      + attr("data-eidos-chat-prompt", item.prompt)
      + ">" + esc(item.label) + "</button>"
  ).join("");

  const empty = document.emptyState
    ? "<div data-eidos-chat-empty>"
      + (document.emptyState.title ? "<strong>" + esc(document.emptyState.title) + "</strong>" : "")
      + "<p>" + esc(document.emptyState.description) + "</p>"
      + (suggestions ? "<div data-eidos-chat-suggestions>" + suggestions + "</div>" : "")
      + "</div>"
    : "";

  const disabled = document.composer.disabled === true
    || (document.readiness !== undefined && document.readiness.state !== "ready");

  return "<section"
    + attr("data-eidos-chat", document.id)
    + attr("data-chat-version", "0.2.0")
    + attr("data-command", document.command.code)
    + attr("data-input-version", document.command.inputVersion)
    + "><header data-eidos-chat-header><h1>" + esc(document.title) + "</h1>" + context + "</header>"
    + readiness
    + "<div data-eidos-chat-transcript role=\"log\" aria-live=\"polite\" aria-relevant=\"additions text\">" + empty + "</div>"
    + "<form data-eidos-chat-composer>"
    + "<textarea" + attr("name", document.composer.key) + " rows=\"3\""
    + attr("placeholder", document.composer.placeholder)
    + attr("aria-label", document.composer.placeholder)
    + (disabled ? " disabled" : "") + "></textarea>"
    + "<button type=\"submit\"" + (disabled ? " disabled" : "") + ">" + esc(document.composer.sendLabel) + "</button>"
    + "</form></section>";
}

function renderPart(part: ChatMessagePartV020): string {
  if (part.type === "text") {
    return "<div data-eidos-chat-part=\"text\">" + esc(part.text) + "</div>";
  }
  if (part.type === "notice") {
    return "<section data-eidos-chat-part=\"notice\""
      + attr("data-tone", part.tone)
      + ">" + (part.title ? "<strong>" + esc(part.title) + "</strong>" : "")
      + "<p>" + esc(part.text) + "</p></section>";
  }
  if (part.type === "activity") {
    return "<div data-eidos-chat-part=\"activity\""
      + attr("data-state", part.state)
      + "><span data-eidos-chat-activity-indicator aria-hidden=\"true\"></span>"
      + "<span>" + esc(part.label) + "</span>"
      + (part.detail ? "<small>" + esc(part.detail) + "</small>" : "")
      + (part.route ? "<a href=\"" + esc(part.route) + "\"" + attr("data-eidos-route", part.route) + ">Open</a>" : "")
      + "</div>";
  }
  if (part.type === "evidence") {
    return "<article data-eidos-chat-part=\"evidence\"><strong>" + esc(part.title) + "</strong>"
      + (part.source ? "<span>" + esc(part.source) + "</span>" : "")
      + (part.context ? "<span>" + esc(part.context) + "</span>" : "")
      + (part.freshness ? "<time>" + esc(part.freshness) + "</time>" : "")
      + (part.route ? "<a href=\"" + esc(part.route) + "\"" + attr("data-eidos-route", part.route) + ">Open</a>" : "")
      + "</article>";
  }
  const reasons = (part.reasons ?? []).map(reason => "<li>" + esc(reason) + "</li>").join("");
  const actions = (part.actions ?? []).map(renderAction).join("");
  return "<section data-eidos-chat-part=\"proposal\"><strong>" + esc(part.title) + "</strong>"
    + (part.summary ? "<p>" + esc(part.summary) + "</p>" : "")
    + (reasons ? "<ul>" + reasons + "</ul>" : "")
    + (part.risk ? "<div data-eidos-chat-proposal-risk>" + esc(part.risk) + "</div>" : "")
    + (actions ? "<div data-eidos-chat-proposal-actions>" + actions + "</div>" : "")
    + "</section>";
}

export function renderChatMessageToHtml(message: ChatMessageV010 | ChatMessageV020): string {
  if ("text" in message) {
    return "<article data-eidos-chat-message"
      + attr("data-role", message.role)
      + attr("data-message-version", "0.1.0")
      + "><div data-eidos-chat-message-role>" + esc(message.role) + "</div>"
      + "<div data-eidos-chat-message-text>" + esc(message.text) + "</div></article>";
  }
  return "<article data-eidos-chat-message"
    + attr("data-role", message.role)
    + attr("data-message-version", "0.2.0")
    + "><div data-eidos-chat-message-role>" + esc(message.role) + "</div>"
    + "<div data-eidos-chat-message-parts>" + message.parts.map(renderPart).join("") + "</div></article>";
}
