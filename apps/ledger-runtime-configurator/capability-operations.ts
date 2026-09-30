import type {
  LedgerConfiguratorSummaryV010,
  LedgerRuntimeSourceConfigurationV010
} from "./contracts.js";
import type { LedgerRuntimeConfiguratorService } from "./service.js";

export type LedgerRuntimeConfigurationSectionV010 =
  | "accounts"
  | "applications"
  | "dictionaries"
  | "postingRules";

export interface LedgerRuntimeConfigurationDescriptionV010 {
  contractVersion: "0.1.0";
  kind: "evo.ledger-runtime.configuration-description";
  template: {
    templateId: string;
    displayName: string;
    semanticDigest: string;
    expressionLanguage: "bookkeeping-aviator-v1";
  };
  counts: LedgerConfiguratorSummaryV010["counts"];
  sourceLibraries: LedgerConfiguratorSummaryV010["sourceLibraries"];
  compatibility: {
    burnReady: boolean;
    requiredRuntimeCapabilities: string[];
    blockers: Array<{ code: string; message: string; count?: number }>;
  };
  sections: Array<{
    section: LedgerRuntimeConfigurationSectionV010;
    count: number;
    readOperationId: "ledger.runtime.configuration.section.read";
    defaultPageSize: number;
    maxPageSize: number;
  }>;
}

export interface LedgerRuntimeConfigurationSectionPageV010 {
  contractVersion: "0.1.0";
  kind: "evo.ledger-runtime.configuration-section-page";
  templateId: string;
  semanticDigest: string;
  section: LedgerRuntimeConfigurationSectionV010;
  offset: number;
  pageSize: number;
  total: number;
  items: unknown[];
  nextCursor: string | null;
}

interface SectionCursorV010 {
  contractVersion: "0.1.0";
  kind: "evo.ledger-runtime.configuration-section-cursor";
  semanticDigest: string;
  section: LedgerRuntimeConfigurationSectionV010;
  offset: number;
}

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

function encodeCursor(cursor: SectionCursorV010): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeCursor(value: string): SectionCursorV010 {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as Partial<SectionCursorV010>;
    if (
      parsed.contractVersion !== "0.1.0"
      || parsed.kind !== "evo.ledger-runtime.configuration-section-cursor"
      || typeof parsed.semanticDigest !== "string"
      || !isSection(parsed.section)
      || !Number.isInteger(parsed.offset)
      || (parsed.offset ?? -1) < 0
    ) {
      throw new Error("LEDGER_CONFIGURATION_CURSOR_INVALID");
    }
    return parsed as SectionCursorV010;
  } catch (error) {
    if (
      error instanceof Error
      && error.message === "LEDGER_CONFIGURATION_CURSOR_INVALID"
    ) {
      throw error;
    }
    throw new Error("LEDGER_CONFIGURATION_CURSOR_INVALID");
  }
}

function isSection(
  value: unknown
): value is LedgerRuntimeConfigurationSectionV010 {
  return value === "accounts"
    || value === "applications"
    || value === "dictionaries"
    || value === "postingRules";
}

function itemsForSection(
  configuration: LedgerRuntimeSourceConfigurationV010,
  section: LedgerRuntimeConfigurationSectionV010
): unknown[] {
  switch (section) {
    case "accounts":
      return configuration.accounts;
    case "applications":
      return configuration.applications;
    case "dictionaries":
      return configuration.dictionaries;
    case "postingRules":
      return configuration.postingRules;
  }
}

function countForSection(
  summary: LedgerConfiguratorSummaryV010,
  section: LedgerRuntimeConfigurationSectionV010
): number {
  switch (section) {
    case "accounts":
      return summary.counts.accounts;
    case "applications":
      return summary.counts.applications;
    case "dictionaries":
      return summary.counts.dictionaries;
    case "postingRules":
      return summary.counts.postingRules;
  }
}

export function describeLedgerRuntimeConfigurationV010(
  service: LedgerRuntimeConfiguratorService
): LedgerRuntimeConfigurationDescriptionV010 {
  const template = service.exportTemplate();
  const summary = service.getSummary();
  const sections: LedgerRuntimeConfigurationSectionV010[] = [
    "accounts",
    "applications",
    "dictionaries",
    "postingRules"
  ];

  return {
    contractVersion: "0.1.0",
    kind: "evo.ledger-runtime.configuration-description",
    template: {
      templateId: template.templateId,
      displayName: template.displayName,
      semanticDigest: template.semanticDigest,
      expressionLanguage: template.configuration.expressionLanguage
    },
    counts: structuredClone(summary.counts),
    sourceLibraries: structuredClone(summary.sourceLibraries),
    compatibility: structuredClone(template.compatibility),
    sections: sections.map(section => ({
      section,
      count: countForSection(summary, section),
      readOperationId: "ledger.runtime.configuration.section.read",
      defaultPageSize: DEFAULT_PAGE_SIZE,
      maxPageSize: MAX_PAGE_SIZE
    }))
  };
}

export function readLedgerRuntimeConfigurationSectionV010(
  service: LedgerRuntimeConfiguratorService,
  input: {
    section: LedgerRuntimeConfigurationSectionV010;
    pageSize?: number;
    cursor?: string;
  }
): LedgerRuntimeConfigurationSectionPageV010 {
  if (!isSection(input.section)) {
    throw new Error("LEDGER_CONFIGURATION_SECTION_INVALID");
  }

  const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
  if (
    !Number.isInteger(pageSize)
    || pageSize <= 0
    || pageSize > MAX_PAGE_SIZE
  ) {
    throw new Error("LEDGER_CONFIGURATION_PAGE_SIZE_INVALID");
  }

  const template = service.exportTemplate();
  let offset = 0;

  if (input.cursor !== undefined) {
    if (!input.cursor.trim()) {
      throw new Error("LEDGER_CONFIGURATION_CURSOR_INVALID");
    }
    const cursor = decodeCursor(input.cursor);
    if (cursor.section !== input.section) {
      throw new Error("LEDGER_CONFIGURATION_CURSOR_SECTION_MISMATCH");
    }
    if (cursor.semanticDigest !== template.semanticDigest) {
      throw new Error("LEDGER_CONFIGURATION_CURSOR_STALE");
    }
    offset = cursor.offset;
  }

  const source = itemsForSection(template.configuration, input.section);
  if (offset > source.length) {
    throw new Error("LEDGER_CONFIGURATION_CURSOR_OFFSET_INVALID");
  }

  const items = structuredClone(source.slice(offset, offset + pageSize));
  const nextOffset = offset + items.length;
  const nextCursor = nextOffset < source.length
    ? encodeCursor({
        contractVersion: "0.1.0",
        kind: "evo.ledger-runtime.configuration-section-cursor",
        semanticDigest: template.semanticDigest,
        section: input.section,
        offset: nextOffset
      })
    : null;

  return {
    contractVersion: "0.1.0",
    kind: "evo.ledger-runtime.configuration-section-page",
    templateId: template.templateId,
    semanticDigest: template.semanticDigest,
    section: input.section,
    offset,
    pageSize,
    total: source.length,
    items,
    nextCursor
  };
}
