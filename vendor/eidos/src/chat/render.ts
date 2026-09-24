import type { ChatExperienceV010, ChatMessageV010 } from "./contracts.js";

function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderChatExperienceToHtml(document: ChatExperienceV010): string {
  const empty = document.emptyState
    ? `<div data-eidos-chat-empty>${esc(document.emptyState)}</div>`
    : "";
  return `<section data-eidos-chat="${esc(document.id)}" data-command="${esc(document.command.code)}" data-input-version="${esc(document.command.inputVersion)}">
    <header data-eidos-chat-header><h1>${esc(document.title)}</h1></header>
    <div data-eidos-chat-transcript role="log" aria-live="polite">${empty}</div>
    <form data-eidos-chat-composer>
      <textarea name="${esc(document.composer.key)}" rows="3" placeholder="${esc(document.composer.placeholder)}" aria-label="${esc(document.composer.placeholder)}"></textarea>
      <button type="submit">${esc(document.composer.sendLabel)}</button>
    </form>
  </section>`;
}

export function renderChatMessageToHtml(message: ChatMessageV010): string {
  return `<article data-eidos-chat-message data-role="${esc(message.role)}">
    <div data-eidos-chat-message-role>${esc(message.role)}</div>
    <div data-eidos-chat-message-text>${esc(message.text)}</div>
  </article>`;
}
