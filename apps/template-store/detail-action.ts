import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  JsonValue
} from "../../actions/contracts.js";
import type {
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type {
  TemplatePreviewSessionStoreV010
} from "../../contracts/template-preview.js";
import {
  TEMPLATE_STORE_DETAIL_ROUTE,
  TEMPLATE_STORE_FEATURE_ID,
  TEMPLATE_STORE_OPEN_DETAIL_COMMAND,
  TEMPLATE_STORE_PACKAGE_ID
} from "./package.js";
import type {
  TemplateStoreRecordV010,
  TemplateStoreRepositoryV010
} from "./repository.js";

function failure(error: unknown): AppActionExecutionResultV010 {
  const message = error instanceof Error ? error.message : String(error);
  const [candidate] = message.split(":");
  return {
    ok: false,
    error: {
      code: candidate && /^[A-Z0-9_]+$/u.test(candidate)
        ? candidate
        : "TEMPLATE_STORE_DETAIL_FAILED",
      message
    }
  };
}

function requireContext(
  context: PlatformRequestContextV010 | undefined
): PlatformRequestContextV010 {
  if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
  return context;
}

function sessionKeys(context: PlatformRequestContextV010): string[] {
  return [
    context.principal.sessionId?.trim(),
    context.principal.subjectId.trim()
  ].filter((value, index, values): value is string =>
    Boolean(value) && values.indexOf(value) === index
  );
}

function optionalPositiveInteger(
  values: Record<string, JsonValue>,
  key: string
): number | undefined {
  const value = values[key];
  if (value === undefined) return undefined;
  if (
    typeof value !== "number"
    || !Number.isInteger(value)
    || value < 1
  ) {
    throw new Error(`TEMPLATE_STORE_DETAIL_FIELD_INVALID: ${key}`);
  }
  return value;
}

function templateId(values: Record<string, JsonValue>): string {
  const value = values.itemId ?? values.templateId;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("TEMPLATE_STORE_DETAIL_TEMPLATE_REQUIRED");
  }
  return value.trim();
}

function resolveRecord(
  store: TemplateStoreRepositoryV010,
  values: Record<string, JsonValue>
): TemplateStoreRecordV010 {
  const id = templateId(values);
  const version = optionalPositiveInteger(values, "templateVersion");
  const record = version === undefined
    ? store.getLatest(id)
    : store.getVersion(id, version);
  if (!record) throw new Error("TEMPLATE_STORE_VERSION_NOT_FOUND");
  return record;
}

export function createTemplateStoreOpenDetailActionHandlerV010(input: {
  store: TemplateStoreRepositoryV010;
  sessions: TemplatePreviewSessionStoreV010;
  now?: () => Date;
}): AppActionHandler {
  return {
    packageId: TEMPLATE_STORE_PACKAGE_ID,
    featureId: TEMPLATE_STORE_FEATURE_ID,
    commandCode: TEMPLATE_STORE_OPEN_DETAIL_COMMAND,

    async execute(request, suppliedContext) {
      try {
        const context = requireContext(suppliedContext);
        const record = resolveRecord(input.store, request.values);
        const selection = {
          contractVersion: "0.1.0" as const,
          templateId: record.templateId,
          templateVersion: record.version,
          selectedAt: (input.now ?? (() => new Date()))().toISOString()
        };
        for (const key of sessionKeys(context)) {
          input.sessions.set(key, selection);
        }
        return {
          ok: true,
          correlationId: context.correlationId,
          result: {
            message: `Opening details for “${record.bundle.listing.name}”.`,
            navigateTo: TEMPLATE_STORE_DETAIL_ROUTE
          }
        };
      } catch (error) {
        return failure(error);
      }
    }
  };
}
