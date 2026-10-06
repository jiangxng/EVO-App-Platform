import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  HelpAudienceV010,
  HelpDocumentBlockV010,
  HelpDocumentKindV010,
  HelpDocumentV010
} from "../vendor/eidos/src/help/contracts.js";
import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";

export interface HelpContextSelectorsV010 {
  packageIds?: string[];
  featureIds?: string[];
  capabilities?: string[];
  routes?: string[];
  actions?: string[];
  commands?: string[];
  providerIds?: string[];
  errorCodes?: string[];
}

export interface HelpSourceMetadataV010 {
  helpVersion: "0.1.0";
  id: string;
  ownerPackageId: string;
  ownerFeatureId?: string;
  locale: string;
  kind: HelpDocumentKindV010;
  title: string;
  summary?: string;
  audiences: HelpAudienceV010[];
  tags?: string[];
  appliesTo?: {
    packageVersion?: string;
    eidosVersion?: string;
    appPlatformVersion?: string;
  };
  contexts?: HelpContextSelectorsV010;
  related?: string[];
  lastReviewedAt?: string;
}

export interface CompiledHelpSourceV010 {
  metadata: HelpSourceMetadataV010;
  blocks: HelpDocumentBlockV010[];
  searchableText: string;
  sourcePath: string;
}

export interface HelpSearchResultV010 {
  id: string;
  title: string;
  summary?: string;
  kind: HelpDocumentKindV010;
  ownerPackageId: string;
  locale: string;
  route: string;
  score: number;
  matchedBy: string[];
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function canonicalLocale(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  try {
    return Intl.getCanonicalLocales(trimmed)[0] ?? trimmed;
  } catch {
    return trimmed;
  }
}

function languageOf(locale: string): string {
  return canonicalLocale(locale).split("-")[0] ?? locale;
}

function stringArray(value: unknown, field: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some(item => !nonEmpty(item))) {
    throw new Error(`HELP_SOURCE_${field}_INVALID`);
  }
  return [...new Set(value.map(item => item.trim()))].sort();
}

function validateMetadata(value: unknown, sourcePath: string): HelpSourceMetadataV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`HELP_SOURCE_METADATA_INVALID: ${sourcePath}`);
  }
  const item = value as Record<string, unknown>;
  if (item.helpVersion !== "0.1.0") {
    throw new Error(`HELP_SOURCE_VERSION_UNSUPPORTED: ${sourcePath}`);
  }
  for (const field of ["id", "ownerPackageId", "locale", "kind", "title"] as const) {
    if (!nonEmpty(item[field])) throw new Error(`HELP_SOURCE_${field.toUpperCase()}_REQUIRED: ${sourcePath}`);
  }
  const kinds = new Set([
    "start", "how-to", "concept", "reference", "troubleshooting",
    "administration", "development", "migration"
  ]);
  if (!kinds.has(item.kind as string)) {
    throw new Error(`HELP_SOURCE_KIND_INVALID: ${sourcePath}`);
  }
  const audienceValues = stringArray(item.audiences, "AUDIENCES");
  if (!audienceValues?.length) {
    throw new Error(`HELP_SOURCE_AUDIENCES_REQUIRED: ${sourcePath}`);
  }
  const allowedAudiences = new Set(["user", "admin", "operator", "support", "developer", "agent"]);
  if (audienceValues.some(value => !allowedAudiences.has(value))) {
    throw new Error(`HELP_SOURCE_AUDIENCES_INVALID: ${sourcePath}`);
  }

  let contexts: HelpContextSelectorsV010 | undefined;
  if (item.contexts !== undefined) {
    if (item.contexts === null || typeof item.contexts !== "object" || Array.isArray(item.contexts)) {
      throw new Error(`HELP_SOURCE_CONTEXTS_INVALID: ${sourcePath}`);
    }
    const raw = item.contexts as Record<string, unknown>;
    contexts = {
      ...(stringArray(raw.packageIds, "CONTEXT_PACKAGE_IDS") ? { packageIds: stringArray(raw.packageIds, "CONTEXT_PACKAGE_IDS") } : {}),
      ...(stringArray(raw.featureIds, "CONTEXT_FEATURE_IDS") ? { featureIds: stringArray(raw.featureIds, "CONTEXT_FEATURE_IDS") } : {}),
      ...(stringArray(raw.capabilities, "CONTEXT_CAPABILITIES") ? { capabilities: stringArray(raw.capabilities, "CONTEXT_CAPABILITIES") } : {}),
      ...(stringArray(raw.routes, "CONTEXT_ROUTES") ? { routes: stringArray(raw.routes, "CONTEXT_ROUTES") } : {}),
      ...(stringArray(raw.actions, "CONTEXT_ACTIONS") ? { actions: stringArray(raw.actions, "CONTEXT_ACTIONS") } : {}),
      ...(stringArray(raw.commands, "CONTEXT_COMMANDS") ? { commands: stringArray(raw.commands, "CONTEXT_COMMANDS") } : {}),
      ...(stringArray(raw.providerIds, "CONTEXT_PROVIDER_IDS") ? { providerIds: stringArray(raw.providerIds, "CONTEXT_PROVIDER_IDS") } : {}),
      ...(stringArray(raw.errorCodes, "CONTEXT_ERROR_CODES") ? { errorCodes: stringArray(raw.errorCodes, "CONTEXT_ERROR_CODES") } : {})
    };
  }

  let appliesTo: HelpSourceMetadataV010["appliesTo"];
  if (item.appliesTo !== undefined) {
    if (item.appliesTo === null || typeof item.appliesTo !== "object" || Array.isArray(item.appliesTo)) {
      throw new Error(`HELP_SOURCE_APPLIES_TO_INVALID: ${sourcePath}`);
    }
    const raw = item.appliesTo as Record<string, unknown>;
    for (const key of ["packageVersion", "eidosVersion", "appPlatformVersion"] as const) {
      if (raw[key] !== undefined && !nonEmpty(raw[key])) {
        throw new Error(`HELP_SOURCE_APPLIES_TO_INVALID: ${sourcePath}`);
      }
    }
    appliesTo = {
      ...(nonEmpty(raw.packageVersion) ? { packageVersion: raw.packageVersion.trim() } : {}),
      ...(nonEmpty(raw.eidosVersion) ? { eidosVersion: raw.eidosVersion.trim() } : {}),
      ...(nonEmpty(raw.appPlatformVersion) ? { appPlatformVersion: raw.appPlatformVersion.trim() } : {})
    };
  }

  return {
    helpVersion: "0.1.0",
    id: (item.id as string).trim(),
    ownerPackageId: (item.ownerPackageId as string).trim(),
    ...(nonEmpty(item.ownerFeatureId) ? { ownerFeatureId: item.ownerFeatureId.trim() } : {}),
    locale: canonicalLocale(item.locale as string),
    kind: item.kind as HelpDocumentKindV010,
    title: (item.title as string).trim(),
    ...(nonEmpty(item.summary) ? { summary: item.summary.trim() } : {}),
    audiences: audienceValues as HelpAudienceV010[],
    ...(stringArray(item.tags, "TAGS") ? { tags: stringArray(item.tags, "TAGS") } : {}),
    ...(appliesTo ? { appliesTo } : {}),
    ...(contexts ? { contexts } : {}),
    ...(stringArray(item.related, "RELATED") ? { related: stringArray(item.related, "RELATED") } : {}),
    ...(nonEmpty(item.lastReviewedAt) ? { lastReviewedAt: item.lastReviewedAt.trim() } : {})
  };
}

function parseFrontmatter(text: string, sourcePath: string): { metadata: HelpSourceMetadataV010; body: string } {
  const normalized = text.replaceAll("\r\n", "\n");
  if (!normalized.startsWith("---\n")) {
    throw new Error(`HELP_SOURCE_FRONTMATTER_REQUIRED: ${sourcePath}`);
  }
  const end = normalized.indexOf("\n---\n", 4);
  if (end < 0) throw new Error(`HELP_SOURCE_FRONTMATTER_UNTERMINATED: ${sourcePath}`);
  const raw = normalized.slice(4, end).trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`HELP_SOURCE_FRONTMATTER_JSON_INVALID: ${sourcePath}`);
  }
  return {
    metadata: validateMetadata(parsed, sourcePath),
    body: normalized.slice(end + 5).trim()
  };
}

function markdownBlocks(markdown: string): HelpDocumentBlockV010[] {
  const lines = markdown.split("\n");
  const blocks: HelpDocumentBlockV010[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !(lines[index] ?? "").startsWith("```")) {
        body.push(lines[index] ?? "");
        index += 1;
      }
      if (index >= lines.length) throw new Error("HELP_SOURCE_CODE_FENCE_UNTERMINATED");
      index += 1;
      blocks.push({
        type: "code",
        text: body.join("\n"),
        ...(language ? { language } : {})
      });
      continue;
    }

    const heading = /^(##|###)\s+(.+)$/.exec(line);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1] === "##" ? 2 : 3,
        text: heading[2]!.trim()
      });
      index += 1;
      continue;
    }

    if (/^-\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^-\s+/.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^-\s+/, "").trim());
        index += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: Array<{ title: string }> = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index] ?? "")) {
        items.push({ title: (lines[index] ?? "").replace(/^\d+\.\s+/, "").trim() });
        index += 1;
      }
      blocks.push({ type: "steps", items });
      continue;
    }

    const callout = /^>\s*\[!(INFO|SUCCESS|WARNING|DANGER)\]\s*(.*)$/.exec(line);
    if (callout) {
      const tone = callout[1]!.toLowerCase() as "info" | "success" | "warning" | "danger";
      const title = callout[2]!.trim();
      index += 1;
      const body: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index] ?? "")) {
        body.push((lines[index] ?? "").replace(/^>\s?/, "").trim());
        index += 1;
      }
      blocks.push({
        type: "callout",
        tone,
        ...(title ? { title } : {}),
        text: body.join(" ").trim() || title
      });
      continue;
    }

    const paragraph: string[] = [line.trim()];
    index += 1;
    while (
      index < lines.length
      && (lines[index] ?? "").trim()
      && !/^(##|###)\s+/.test(lines[index] ?? "")
      && !/^-\s+/.test(lines[index] ?? "")
      && !/^\d+\.\s+/.test(lines[index] ?? "")
      && !(lines[index] ?? "").startsWith("```")
      && !/^>\s*\[!/.test(lines[index] ?? "")
    ) {
      paragraph.push((lines[index] ?? "").trim());
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  if (blocks.length === 0) throw new Error("HELP_SOURCE_BODY_REQUIRED");
  return blocks;
}

export function compileHelpSourceV010(text: string, sourcePath = "<memory>"): CompiledHelpSourceV010 {
  const { metadata, body } = parseFrontmatter(text, sourcePath);
  const blocks = markdownBlocks(body);
  return {
    metadata,
    blocks,
    searchableText: [
      metadata.title,
      metadata.summary ?? "",
      ...(metadata.tags ?? []),
      ...Object.values(metadata.contexts ?? {}).flatMap(value => value ?? []),
      body
    ].join(" ").toLocaleLowerCase(),
    sourcePath
  };
}

function listMarkdownFiles(root: string): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) result.push(...listMarkdownFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".md")) result.push(path);
  }
  return result.sort();
}

export function loadHelpCorpusV010(
  root = join(process.cwd(), "help", "content")
): CompiledHelpSourceV010[] {
  const compiled = listMarkdownFiles(root).map(path =>
    compileHelpSourceV010(readFileSync(path, "utf8"), path)
  );
  const identities = new Set<string>();
  for (const item of compiled) {
    const key = `${item.metadata.id}\u0000${item.metadata.locale}`;
    if (identities.has(key)) {
      throw new Error(`HELP_SOURCE_DUPLICATE: ${item.metadata.id}: ${item.metadata.locale}`);
    }
    identities.add(key);
  }
  return compiled;
}

export const helpIndexPageSourceV010 = "app://evo-app-platform/pages/help";

export function helpDocumentRouteV010(id: string): string {
  return `/help/${encodeURIComponent(id)}`;
}

export function helpDocumentPageSourceV010(id: string): string {
  return `app://evo-app-platform/pages/help/${encodeURIComponent(id)}`;
}

export function helpIdFromPageSourceV010(source: string): string | undefined {
  const prefix = "app://evo-app-platform/pages/help/";
  if (!source.startsWith(prefix)) return undefined;
  const encoded = source.slice(prefix.length);
  if (!encoded) return undefined;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return undefined;
  }
}

function localeCandidates(
  locale: string,
  fallbackLocales: readonly string[] = ["en"]
): string[] {
  const result: string[] = [];
  const add = (value: string | undefined) => {
    if (!value) return;
    const normalized = canonicalLocale(value);
    if (normalized && !result.includes(normalized)) result.push(normalized);
  };

  const requested = canonicalLocale(locale || "en");
  add(requested);
  const requestedLanguage = languageOf(requested);
  if (requestedLanguage !== requested) add(requestedLanguage);

  for (const fallback of fallbackLocales) {
    const normalized = canonicalLocale(fallback);
    add(normalized);
    const language = languageOf(normalized);
    if (language !== normalized) add(language);
  }
  add("en");
  return result;
}

export function resolveHelpVariantV010(
  corpus: CompiledHelpSourceV010[],
  id: string,
  locale = "en",
  fallbackLocales: readonly string[] = ["en"]
): CompiledHelpSourceV010 | undefined {
  const variants = corpus.filter(item => item.metadata.id === id);
  if (variants.length === 0) return undefined;
  for (const candidate of localeCandidates(locale, fallbackLocales)) {
    const match = variants.find(item => canonicalLocale(item.metadata.locale) === candidate);
    if (match) return match;
  }
  return undefined;
}

export function resolveHelpDocumentsV010(
  corpus: CompiledHelpSourceV010[],
  locale = "en",
  fallbackLocales: readonly string[] = ["en"]
): CompiledHelpSourceV010[] {
  const ids = [...new Set(corpus.map(item => item.metadata.id))].sort();
  return ids
    .map(id => resolveHelpVariantV010(corpus, id, locale, fallbackLocales))
    .filter((item): item is CompiledHelpSourceV010 => item !== undefined);
}

function helpUiLocale(locale: string): "en" | "zh-CN" {
  return canonicalLocale(locale) === "zh-CN" ? "zh-CN" : "en";
}

function helpRootLabel(locale: string): string {
  return helpUiLocale(locale) === "zh-CN" ? "帮助" : "Help";
}

function helpIndexUi(locale: string) {
  const zh = helpUiLocale(locale) === "zh-CN";
  return {
    title: zh ? "帮助" : "Help",
    description: zh
      ? "查找产品使用方法、概念说明和常见问题。"
      : "Find product guidance, concepts and common troubleshooting.",
    placeholder: zh ? "搜索帮助…" : "Search help…",
    ariaLabel: zh ? "搜索帮助" : "Search Help",
    noResults: zh ? "没有匹配的帮助内容。" : "No matching Help documents.",
    empty: zh ? "暂无帮助内容。" : "No Help documents are available.",
    open: zh ? "打开" : "Open"
  };
}

function helpKindLabel(kind: HelpDocumentKindV010, locale: string): string {
  const zh: Record<HelpDocumentKindV010, string> = {
    start: "快速开始",
    "how-to": "操作指南",
    concept: "概念",
    reference: "参考",
    troubleshooting: "故障排查",
    administration: "管理",
    development: "开发",
    migration: "迁移"
  };
  const en: Record<HelpDocumentKindV010, string> = {
    start: "Getting started",
    "how-to": "How-to",
    concept: "Concept",
    reference: "Reference",
    troubleshooting: "Troubleshooting",
    administration: "Administration",
    development: "Development",
    migration: "Migration"
  };
  return (helpUiLocale(locale) === "zh-CN" ? zh : en)[kind];
}

function helpAudienceLabel(audience: HelpAudienceV010, locale: string): string {
  const zh: Record<HelpAudienceV010, string> = {
    user: "用户",
    admin: "管理员",
    operator: "运维",
    support: "支持",
    developer: "开发者",
    agent: "Agent"
  };
  const en: Record<HelpAudienceV010, string> = {
    user: "User",
    admin: "Admin",
    operator: "Operator",
    support: "Support",
    developer: "Developer",
    agent: "Agent"
  };
  return (helpUiLocale(locale) === "zh-CN" ? zh : en)[audience];
}

export function materializeHelpDocumentV010(
  corpus: CompiledHelpSourceV010[],
  id: string,
  locale = "en"
): HelpDocumentV010 | undefined {
  const source = resolveHelpVariantV010(corpus, id, locale);
  if (!source) return undefined;
  return {
    contractVersion: "0.1.0",
    kind: "help-document",
    id: source.metadata.id,
    title: source.metadata.title,
    ...(source.metadata.summary ? { summary: source.metadata.summary } : {}),
    owner: {
      packageId: source.metadata.ownerPackageId,
      ...(source.metadata.ownerFeatureId ? { featureId: source.metadata.ownerFeatureId } : {})
    },
    locale: source.metadata.locale,
    helpKind: source.metadata.kind,
    audiences: source.metadata.audiences,
    ...(source.metadata.tags ? { tags: source.metadata.tags } : {}),
    ...(source.metadata.appliesTo ? { appliesTo: source.metadata.appliesTo } : {}),
    ...(source.metadata.lastReviewedAt ? { lastReviewedAt: source.metadata.lastReviewedAt } : {}),
    breadcrumbs: [
      { label: helpRootLabel(locale), route: "/help" },
      { label: helpKindLabel(source.metadata.kind, locale) }
    ],
    blocks: source.blocks,
    related: (source.metadata.related ?? []).map(relatedId => {
      const related = resolveHelpVariantV010(corpus, relatedId, locale);
      return {
        id: relatedId,
        title: related?.metadata.title ?? relatedId,
        route: helpDocumentRouteV010(relatedId)
      };
    })
  };
}

function contextMatches(
  selectors: HelpContextSelectorsV010 | undefined,
  context: HelpContextSelectorsV010
): string[] {
  if (!selectors) return [];
  const matched: string[] = [];
  for (const key of [
    "packageIds", "featureIds", "capabilities", "routes",
    "actions", "commands", "providerIds", "errorCodes"
  ] as const) {
    const expected = selectors[key] ?? [];
    const actual = context[key] ?? [];
    if (expected.some(value => actual.includes(value))) matched.push(key);
  }
  return matched;
}

export function searchHelpV010(
  corpus: CompiledHelpSourceV010[],
  query: string,
  locale = "en",
  context: HelpContextSelectorsV010 = {}
): HelpSearchResultV010[] {
  const normalized = query.trim().toLocaleLowerCase();
  return resolveHelpDocumentsV010(corpus, locale)
    .map(item => {
      let score = 0;
      const matchedBy: string[] = [];
      const title = item.metadata.title.toLocaleLowerCase();
      if (normalized) {
        if (title === normalized) {
          score += 100;
          matchedBy.push("title-exact");
        } else if (title.includes(normalized)) {
          score += 60;
          matchedBy.push("title");
        }
        if ((item.metadata.tags ?? []).some(tag => tag.toLocaleLowerCase().includes(normalized))) {
          score += 35;
          matchedBy.push("tag");
        }
        if ((item.metadata.summary ?? "").toLocaleLowerCase().includes(normalized)) {
          score += 25;
          matchedBy.push("summary");
        }
        if (item.searchableText.includes(normalized)) {
          score += 10;
          matchedBy.push("content");
        }
      }
      const contextFields = contextMatches(item.metadata.contexts, context);
      if (contextFields.length) {
        for (const field of contextFields) {
          score += field === "errorCodes" ? 80 : 40;
          matchedBy.push(`context:${field}`);
        }
        if (
          contextFields.includes("errorCodes")
          && item.metadata.kind === "troubleshooting"
        ) {
          score += 30;
          matchedBy.push("context:troubleshooting");
        }
      }
      return {
        id: item.metadata.id,
        title: item.metadata.title,
        ...(item.metadata.summary ? { summary: item.metadata.summary } : {}),
        kind: item.metadata.kind,
        ownerPackageId: item.metadata.ownerPackageId,
        locale: item.metadata.locale,
        route: helpDocumentRouteV010(item.metadata.id),
        score,
        matchedBy
      };
    })
    .filter(item => !normalized && Object.keys(context).length === 0 ? true : item.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

export function createHelpIndexPageV010(
  corpus: CompiledHelpSourceV010[],
  locale = "en"
): CatalogBrowserV010 {
  const ui = helpIndexUi(locale);
  const documents = resolveHelpDocumentsV010(corpus, locale)
    .slice()
    .sort((a, b) => a.metadata.kind.localeCompare(b.metadata.kind) || a.metadata.title.localeCompare(b.metadata.title));
  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo.help",
    title: ui.title,
    description: ui.description,
    search: {
      placeholder: ui.placeholder,
      ariaLabel: ui.ariaLabel,
      noResultsMessage: ui.noResults
    },
    emptyMessage: ui.empty,
    items: documents.map(item => ({
      id: item.metadata.id,
      title: item.metadata.title,
      summary: item.metadata.summary,
      category: helpKindLabel(item.metadata.kind, locale),
      badges: item.metadata.audiences.map(audience => helpAudienceLabel(audience, locale)),
      primaryAction: {
        id: "open",
        label: ui.open,
        type: "navigate",
        route: helpDocumentRouteV010(item.metadata.id)
      }
    }))
  };
}

export function createHelpExperienceManifestV010(
  corpus: CompiledHelpSourceV010[],
  locale = "en"
) {
  const documents = resolveHelpDocumentsV010(corpus, locale);
  return {
    contractVersion: "0.1.0",
    experienceId: "evo-help",
    packageId: "evo-app-platform",
    featureId: "evo-help.system",
    defaultRoute: "/help",
    pages: [
      {
        id: "evo-help.home",
        title: helpRootLabel(locale),
        source: "app://evo-app-platform/pages/help"
      },
      ...documents.map(item => ({
        id: `evo-help.${item.metadata.id}`,
        title: item.metadata.title,
        source: helpDocumentPageSourceV010(item.metadata.id)
      }))
    ],
    routes: [
      {
        id: "evo-help.home",
        path: "/help",
        pageId: "evo-help.home"
      },
      ...documents.map(item => ({
        id: `evo-help.${item.metadata.id}`,
        path: helpDocumentRouteV010(item.metadata.id),
        pageId: `evo-help.${item.metadata.id}`
      }))
    ]
  } as const;
}
