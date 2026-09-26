import type { LocalizationRuntime } from "../localization/contracts.js";
import {
  assertHelpDocumentV010,
  type HelpDocumentBlockV010,
  type HelpDocumentV010
} from "./contracts.js";

function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function hostText(
  localization: LocalizationRuntime | undefined,
  key: string,
  fallback: string,
  params?: Record<string, string | number | boolean | null>
): string {
  return localization?.resolve("eidos.app-host", key, fallback, params) ?? fallback.replace(
    /\{([A-Za-z0-9_.-]+)\}/g,
    (match, name: string) => Object.prototype.hasOwnProperty.call(params ?? {}, name)
      ? String(params?.[name] ?? "")
      : match
  );
}

function renderBlock(block: HelpDocumentBlockV010): string {
  if (block.type === "paragraph") {
    return `<p data-eidos-help-paragraph>${esc(block.text)}</p>`;
  }
  if (block.type === "heading") {
    const tag = block.level === 2 ? "h2" : "h3";
    const id = block.id ? ` id="${esc(block.id)}"` : "";
    return `<${tag}${id} data-eidos-help-heading>${esc(block.text)}</${tag}>`;
  }
  if (block.type === "list") {
    const tag = block.ordered ? "ol" : "ul";
    return `<${tag} data-eidos-help-list>${block.items.map(item => `<li>${esc(item)}</li>`).join("")}</${tag}>`;
  }
  if (block.type === "code") {
    const language = block.language ? ` data-language="${esc(block.language)}"` : "";
    return `<pre data-eidos-help-code${language}><code>${esc(block.text)}</code></pre>`;
  }
  if (block.type === "callout") {
    return `<aside data-eidos-help-callout data-tone="${esc(block.tone)}">${block.title ? `<strong>${esc(block.title)}</strong>` : ""}<p>${esc(block.text)}</p></aside>`;
  }
  const items = block.items.map((item, index) =>
    `<li><span data-eidos-help-step-number>${index + 1}</span><div><strong>${esc(item.title)}</strong>${item.text ? `<p>${esc(item.text)}</p>` : ""}</div></li>`
  ).join("");
  return `<ol data-eidos-help-steps>${items}</ol>`;
}

function renderBreadcrumbs(
  document: HelpDocumentV010,
  localization?: LocalizationRuntime
): string {
  if (!document.breadcrumbs?.length) return "";
  const items = document.breadcrumbs.map(item => item.route
    ? `<a href="#${esc(item.route)}" data-eidos-help-route="${esc(item.route)}">${esc(item.label)}</a>`
    : `<span>${esc(item.label)}</span>`
  ).join("<span data-eidos-help-breadcrumb-separator>›</span>");
  return `<nav data-eidos-help-breadcrumbs aria-label="${esc(hostText(localization, "help.breadcrumb", "Breadcrumb"))}">${items}</nav>`;
}

function renderMeta(
  document: HelpDocumentV010,
  localization?: LocalizationRuntime
): string {
  const applies = document.appliesTo
    ? Object.entries(document.appliesTo)
        .filter(([, value]) => value)
        .map(([key, value]) => {
          const label = hostText(localization, `help.applies.${key}`, key);
          return `<span data-eidos-help-applies data-key="${esc(key)}">${esc(label)}: ${esc(value)}</span>`;
        })
        .join("")
    : "";
  const audiences = document.audiences
    .map(value => `<span data-eidos-help-audience>${esc(hostText(localization, `help.audience.${value}`, value))}</span>`)
    .join("");
  const tags = (document.tags ?? [])
    .map(value => `<span data-eidos-help-tag>${esc(value)}</span>`)
    .join("");
  const reviewed = document.lastReviewedAt
    ? `<span data-eidos-help-reviewed>${esc(hostText(localization, "help.reviewed", "reviewed: {date}", { date: document.lastReviewedAt }))}</span>`
    : "";
  const owner = hostText(localization, "help.owner", "owner: {owner}", { owner: document.owner.packageId });
  const kind = hostText(localization, `help.kind.${document.helpKind}`, document.helpKind);
  const locale = hostText(localization, "help.locale", "locale: {locale}", { locale: document.locale });
  return `<div data-eidos-help-meta><span data-eidos-help-owner>${esc(owner)}</span><span data-eidos-help-kind>${esc(kind)}</span><span data-eidos-help-locale>${esc(locale)}</span>${reviewed}${audiences}${applies}${tags}</div>`;
}

export function renderHelpDocumentToHtml(
  input: HelpDocumentV010,
  localization?: LocalizationRuntime
): string {
  const document = assertHelpDocumentV010(input);
  const related = document.related?.length
    ? `<aside data-eidos-help-related><h2>${esc(hostText(localization, "help.related", "Related"))}</h2><ul>${document.related.map(item =>
        `<li>${item.route
          ? `<a href="#${esc(item.route)}" data-eidos-help-route="${esc(item.route)}">${esc(item.title)}</a>`
          : `<span>${esc(item.title)}</span>`
        }</li>`
      ).join("")}</ul></aside>`
    : "";

  return `<article lang="${esc(document.locale)}" data-eidos-help-document="${esc(document.id)}" data-help-kind="${esc(document.helpKind)}">
    ${renderBreadcrumbs(document, localization)}
    <header data-eidos-help-header>
      <h1>${esc(document.title)}</h1>
      ${document.summary ? `<p data-eidos-help-summary>${esc(document.summary)}</p>` : ""}
      ${renderMeta(document, localization)}
    </header>
    <div data-eidos-help-body>${document.blocks.map(renderBlock).join("")}</div>
    ${related}
  </article>`;
}
