import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import type { LedgerRuntimeConfiguratorService } from "./service.js";

const PACKAGE_ID = "evo-ledger-runtime-configurator";
const FEATURE_ID = "evo-ledger-runtime-configurator.default";

type LedgerSection = "accounts" | "applications" | "dictionaries" | "postingRules";

interface LedgerSectionCursorV010 {
  contractVersion: "0.1.0";
  section: LedgerSection;
  offset: number;
  semanticDigest: string;
}

function jsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

function correlationId(request: AppActionRequestV010): string {
  return request.runtimeInstanceId ?? request.sourceInteractionId;
}

function decodeCursor(value: string): LedgerSectionCursorV010 {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as Partial<LedgerSectionCursorV010>;
    if (
      parsed.contractVersion !== "0.1.0"
      || !["accounts", "applications", "dictionaries", "postingRules"].includes(
        parsed.section ?? ""
      )
      || !Number.isInteger(parsed.offset)
      || (parsed.offset ?? -1) < 0
      || typeof parsed.semanticDigest !== "string"
      || !parsed.semanticDigest
    ) {
      throw new Error("invalid");
    }
    return parsed as LedgerSectionCursorV010;
  } catch {
    throw new Error("LEDGER_CONFIGURATION_CURSOR_INVALID");
  }
}

function encodeCursor(cursor: LedgerSectionCursorV010): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function sectionFromRequest(request: AppActionRequestV010): LedgerSection | undefined {
  const section = request.values.section;
  return typeof section === "string"
    && ["accounts", "applications", "dictionaries", "postingRules"].includes(section)
    ? section as LedgerSection
    : undefined;
}

function limitFromRequest(request: AppActionRequestV010): number | undefined {
  const limit = request.values.limit;
  if (limit === undefined) return 50;
  return typeof limit === "number"
    && Number.isInteger(limit)
    && limit >= 1
    && limit <= 100
    ? limit
    : undefined;
}

export function createLedgerRuntimeConfiguratorActionHandler(
  service: LedgerRuntimeConfiguratorService
): AppActionHandler {
  return {
    packageId: PACKAGE_ID,
    featureId: FEATURE_ID,
    commandCode: "evo-ledger-runtime-configurator.validate-default",
    async execute(request: AppActionRequestV010): Promise<AppActionExecutionResultV010> {
      const validation = service.validate();
      const result = jsonValue({
        ...service.getSummary(),
        validation
      });

      return {
        ok: validation.ok,
        correlationId: correlationId(request),
        result
      };
    }
  };
}

export function createLedgerRuntimeConfiguratorCapabilityActionHandlers(
  service: LedgerRuntimeConfiguratorService
): AppActionHandler[] {
  return [
    {
      packageId: PACKAGE_ID,
      featureId: FEATURE_ID,
      commandCode: "evo-ledger-runtime-configurator.describe",
      async execute(request): Promise<AppActionExecutionResultV010> {
        const template = service.exportTemplate();
        const summary = service.getSummary();
        return {
          ok: true,
          correlationId: correlationId(request),
          result: jsonValue({
            contractVersion: "0.1.0",
            templateId: template.templateId,
            displayName: template.displayName,
            semanticDigest: template.semanticDigest,
            expressionLanguage: template.configuration.expressionLanguage,
            counts: summary.counts,
            burnReady: template.compatibility.burnReady,
            requiredRuntimeCapabilities:
              template.compatibility.requiredRuntimeCapabilities,
            blockers: template.compatibility.blockers,
            sourceLibraries: summary.sourceLibraries,
            sections: [
              { id: "accounts", count: summary.counts.accounts },
              { id: "applications", count: summary.counts.applications },
              { id: "dictionaries", count: summary.counts.dictionaries },
              { id: "postingRules", count: summary.counts.postingRules }
            ]
          })
        };
      }
    },
    {
      packageId: PACKAGE_ID,
      featureId: FEATURE_ID,
      commandCode: "evo-ledger-runtime-configurator.section.read",
      async execute(request): Promise<AppActionExecutionResultV010> {
        const section = sectionFromRequest(request);
        const limit = limitFromRequest(request);
        if (!section || limit === undefined) {
          return {
            ok: false,
            correlationId: correlationId(request),
            error: {
              code: "LEDGER_CONFIGURATION_SECTION_INPUT_INVALID",
              message:
                "section must be accounts, applications, dictionaries or postingRules; limit must be an integer from 1 to 100."
            }
          };
        }

        const template = service.exportTemplate();
        let offset = 0;
        const cursorValue = request.values.cursor;
        if (cursorValue !== undefined) {
          if (typeof cursorValue !== "string") {
            return {
              ok: false,
              correlationId: correlationId(request),
              error: {
                code: "LEDGER_CONFIGURATION_CURSOR_INVALID",
                message: "cursor must be an opaque string returned by this operation."
              }
            };
          }
          try {
            const cursor = decodeCursor(cursorValue);
            if (cursor.section !== section) {
              throw new Error("LEDGER_CONFIGURATION_CURSOR_SECTION_MISMATCH");
            }
            if (cursor.semanticDigest !== template.semanticDigest) {
              throw new Error("LEDGER_CONFIGURATION_CURSOR_STALE");
            }
            offset = cursor.offset;
          } catch (error) {
            const code = error instanceof Error ? error.message : "LEDGER_CONFIGURATION_CURSOR_INVALID";
            return {
              ok: false,
              correlationId: correlationId(request),
              error: {
                code,
                message:
                  code === "LEDGER_CONFIGURATION_CURSOR_STALE"
                    ? "The Ledger Runtime configuration changed; restart section reading from the first page."
                    : "The supplied section cursor is invalid for this request."
              }
            };
          }
        }

        const items = template.configuration[section];
        if (offset > items.length) {
          return {
            ok: false,
            correlationId: correlationId(request),
            error: {
              code: "LEDGER_CONFIGURATION_CURSOR_INVALID",
              message: "The supplied section cursor points beyond the current section."
            }
          };
        }

        const pageItems = items.slice(offset, offset + limit);
        const nextOffset = offset + pageItems.length;
        const nextCursor = nextOffset < items.length
          ? encodeCursor({
              contractVersion: "0.1.0",
              section,
              offset: nextOffset,
              semanticDigest: template.semanticDigest
            })
          : null;

        return {
          ok: true,
          correlationId: correlationId(request),
          result: jsonValue({
            contractVersion: "0.1.0",
            section,
            semanticDigest: template.semanticDigest,
            items: pageItems,
            page: {
              offset,
              limit,
              returned: pageItems.length,
              total: items.length,
              nextCursor
            }
          })
        };
      }
    }
  ];
}
