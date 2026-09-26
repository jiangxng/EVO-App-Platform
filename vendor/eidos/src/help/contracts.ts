export type HelpDocumentKindV010 =
  | "start"
  | "how-to"
  | "concept"
  | "reference"
  | "troubleshooting"
  | "administration"
  | "development"
  | "migration";

export type HelpAudienceV010 =
  | "user"
  | "admin"
  | "operator"
  | "support"
  | "developer"
  | "agent";

export type HelpCalloutToneV010 = "info" | "success" | "warning" | "danger";

export interface HelpDocumentOwnerV010 {
  packageId: string;
  featureId?: string;
}

export interface HelpDocumentAppliesToV010 {
  packageVersion?: string;
  eidosVersion?: string;
  appPlatformVersion?: string;
}

export interface HelpBreadcrumbV010 {
  label: string;
  route?: string;
}

export interface HelpRelatedDocumentV010 {
  id: string;
  title: string;
  route?: string;
}

export type HelpDocumentBlockV010 =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "heading";
      level: 2 | 3;
      text: string;
      id?: string;
    }
  | {
      type: "list";
      ordered?: boolean;
      items: string[];
    }
  | {
      type: "code";
      text: string;
      language?: string;
    }
  | {
      type: "callout";
      tone: HelpCalloutToneV010;
      title?: string;
      text: string;
    }
  | {
      type: "steps";
      items: Array<{
        title: string;
        text?: string;
      }>;
    };

export interface HelpDocumentV010 {
  contractVersion: "0.1.0";
  kind: "help-document";
  id: string;
  title: string;
  summary?: string;
  owner: HelpDocumentOwnerV010;
  locale: string;
  helpKind: HelpDocumentKindV010;
  audiences: HelpAudienceV010[];
  tags?: string[];
  appliesTo?: HelpDocumentAppliesToV010;
  sourceRevision?: string;
  lastReviewedAt?: string;
  breadcrumbs?: HelpBreadcrumbV010[];
  blocks: HelpDocumentBlockV010[];
  related?: HelpRelatedDocumentV010[];
}

const kinds = new Set<HelpDocumentKindV010>([
  "start",
  "how-to",
  "concept",
  "reference",
  "troubleshooting",
  "administration",
  "development",
  "migration"
]);

const audiences = new Set<HelpAudienceV010>([
  "user",
  "admin",
  "operator",
  "support",
  "developer",
  "agent"
]);

const calloutTones = new Set<HelpCalloutToneV010>([
  "info",
  "success",
  "warning",
  "danger"
]);

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function assertNonEmpty(value: unknown, code: string): asserts value is string {
  if (!nonEmpty(value)) throw new Error(code);
}

function assertStringArray(value: unknown, code: string): asserts value is string[] {
  if (!Array.isArray(value) || value.some(item => !nonEmpty(item))) {
    throw new Error(code);
  }
}

export function assertHelpDocumentV010(value: unknown): HelpDocumentV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("EIDOS_HELP_DOCUMENT_INVALID");
  }

  const document = value as Partial<HelpDocumentV010>;
  if (document.contractVersion !== "0.1.0" || document.kind !== "help-document") {
    throw new Error("EIDOS_HELP_DOCUMENT_VERSION_UNSUPPORTED");
  }

  assertNonEmpty(document.id, "EIDOS_HELP_DOCUMENT_ID_REQUIRED");
  assertNonEmpty(document.title, "EIDOS_HELP_DOCUMENT_TITLE_REQUIRED");
  assertNonEmpty(document.locale, "EIDOS_HELP_DOCUMENT_LOCALE_REQUIRED");

  if (!document.owner || typeof document.owner !== "object") {
    throw new Error("EIDOS_HELP_DOCUMENT_OWNER_REQUIRED");
  }
  assertNonEmpty(document.owner.packageId, "EIDOS_HELP_DOCUMENT_OWNER_PACKAGE_REQUIRED");
  if (document.owner.featureId !== undefined) {
    assertNonEmpty(document.owner.featureId, "EIDOS_HELP_DOCUMENT_OWNER_FEATURE_INVALID");
  }

  if (!document.helpKind || !kinds.has(document.helpKind)) {
    throw new Error("EIDOS_HELP_DOCUMENT_KIND_INVALID");
  }

  if (
    !Array.isArray(document.audiences)
    || document.audiences.length === 0
    || document.audiences.some(item => !audiences.has(item))
  ) {
    throw new Error("EIDOS_HELP_DOCUMENT_AUDIENCE_INVALID");
  }

  if (document.summary !== undefined) {
    assertNonEmpty(document.summary, "EIDOS_HELP_DOCUMENT_SUMMARY_INVALID");
  }
  if (document.sourceRevision !== undefined) {
    assertNonEmpty(document.sourceRevision, "EIDOS_HELP_DOCUMENT_SOURCE_REVISION_INVALID");
  }
  if (document.lastReviewedAt !== undefined) {
    assertNonEmpty(document.lastReviewedAt, "EIDOS_HELP_DOCUMENT_LAST_REVIEWED_INVALID");
  }
  if (document.tags !== undefined) {
    assertStringArray(document.tags, "EIDOS_HELP_DOCUMENT_TAGS_INVALID");
  }

  if (!Array.isArray(document.blocks) || document.blocks.length === 0) {
    throw new Error("EIDOS_HELP_DOCUMENT_BLOCKS_REQUIRED");
  }

  for (const [index, block] of document.blocks.entries()) {
    if (block === null || typeof block !== "object" || Array.isArray(block)) {
      throw new Error(`EIDOS_HELP_DOCUMENT_BLOCK_INVALID: ${index}`);
    }
    if (block.type === "paragraph") {
      assertNonEmpty(block.text, `EIDOS_HELP_DOCUMENT_PARAGRAPH_INVALID: ${index}`);
      continue;
    }
    if (block.type === "heading") {
      if (block.level !== 2 && block.level !== 3) {
        throw new Error(`EIDOS_HELP_DOCUMENT_HEADING_LEVEL_INVALID: ${index}`);
      }
      assertNonEmpty(block.text, `EIDOS_HELP_DOCUMENT_HEADING_INVALID: ${index}`);
      if (block.id !== undefined) {
        assertNonEmpty(block.id, `EIDOS_HELP_DOCUMENT_HEADING_ID_INVALID: ${index}`);
      }
      continue;
    }
    if (block.type === "list") {
      assertStringArray(block.items, `EIDOS_HELP_DOCUMENT_LIST_INVALID: ${index}`);
      if (block.items.length === 0) {
        throw new Error(`EIDOS_HELP_DOCUMENT_LIST_EMPTY: ${index}`);
      }
      continue;
    }
    if (block.type === "code") {
      assertNonEmpty(block.text, `EIDOS_HELP_DOCUMENT_CODE_INVALID: ${index}`);
      if (block.language !== undefined) {
        assertNonEmpty(block.language, `EIDOS_HELP_DOCUMENT_CODE_LANGUAGE_INVALID: ${index}`);
      }
      continue;
    }
    if (block.type === "callout") {
      if (!calloutTones.has(block.tone)) {
        throw new Error(`EIDOS_HELP_DOCUMENT_CALLOUT_TONE_INVALID: ${index}`);
      }
      assertNonEmpty(block.text, `EIDOS_HELP_DOCUMENT_CALLOUT_INVALID: ${index}`);
      if (block.title !== undefined) {
        assertNonEmpty(block.title, `EIDOS_HELP_DOCUMENT_CALLOUT_TITLE_INVALID: ${index}`);
      }
      continue;
    }
    if (block.type === "steps") {
      if (
        !Array.isArray(block.items)
        || block.items.length === 0
        || block.items.some(item =>
          item === null
          || typeof item !== "object"
          || Array.isArray(item)
          || !nonEmpty(item.title)
          || (item.text !== undefined && !nonEmpty(item.text))
        )
      ) {
        throw new Error(`EIDOS_HELP_DOCUMENT_STEPS_INVALID: ${index}`);
      }
      continue;
    }
    throw new Error(`EIDOS_HELP_DOCUMENT_BLOCK_TYPE_INVALID: ${index}`);
  }

  if (document.breadcrumbs !== undefined) {
    if (!Array.isArray(document.breadcrumbs)) {
      throw new Error("EIDOS_HELP_DOCUMENT_BREADCRUMBS_INVALID");
    }
    for (const crumb of document.breadcrumbs) {
      if (!crumb || typeof crumb !== "object" || !nonEmpty(crumb.label)) {
        throw new Error("EIDOS_HELP_DOCUMENT_BREADCRUMB_INVALID");
      }
      if (crumb.route !== undefined && (!nonEmpty(crumb.route) || !crumb.route.startsWith("/"))) {
        throw new Error("EIDOS_HELP_DOCUMENT_BREADCRUMB_ROUTE_INVALID");
      }
    }
  }

  if (document.related !== undefined) {
    if (!Array.isArray(document.related)) {
      throw new Error("EIDOS_HELP_DOCUMENT_RELATED_INVALID");
    }
    const ids = new Set<string>();
    for (const item of document.related) {
      if (!item || typeof item !== "object" || !nonEmpty(item.id) || !nonEmpty(item.title)) {
        throw new Error("EIDOS_HELP_DOCUMENT_RELATED_ITEM_INVALID");
      }
      if (ids.has(item.id)) {
        throw new Error(`EIDOS_HELP_DOCUMENT_RELATED_DUPLICATE: ${item.id}`);
      }
      ids.add(item.id);
      if (item.route !== undefined && (!nonEmpty(item.route) || !item.route.startsWith("/"))) {
        throw new Error("EIDOS_HELP_DOCUMENT_RELATED_ROUTE_INVALID");
      }
    }
  }

  return document as HelpDocumentV010;
}

export function isHelpDocumentV010(value: unknown): value is HelpDocumentV010 {
  try {
    assertHelpDocumentV010(value);
    return true;
  } catch {
    return false;
  }
}
