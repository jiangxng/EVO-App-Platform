import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  JsonValue
} from "../../actions/contracts.js";
import type {
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import {
  createTemplateDownloadPackageV010
} from "../../contracts/template-package.js";
import {
  TEMPLATE_STORE_DOWNLOAD_COMMAND,
  TEMPLATE_STORE_FEATURE_ID,
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
        : "TEMPLATE_STORE_DOWNLOAD_FAILED",
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
    throw new Error(`TEMPLATE_STORE_DOWNLOAD_FIELD_INVALID: ${key}`);
  }
  return value;
}

function templateId(values: Record<string, JsonValue>): string {
  const value = values.itemId ?? values.templateId;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("TEMPLATE_STORE_DOWNLOAD_TEMPLATE_REQUIRED");
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

function fileStem(templateId: string): string {
  const normalized = templateId
    .replace(/[^a-zA-Z0-9._-]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
  return normalized || "template";
}

export function createTemplateStoreDownloadActionHandlerV010(input: {
  store: TemplateStoreRepositoryV010;
}): AppActionHandler {
  return {
    packageId: TEMPLATE_STORE_PACKAGE_ID,
    featureId: TEMPLATE_STORE_FEATURE_ID,
    commandCode: TEMPLATE_STORE_DOWNLOAD_COMMAND,

    async execute(request, suppliedContext) {
      try {
        const context = requireContext(suppliedContext);
        const record = resolveRecord(input.store, request.values);
        const downloadable = createTemplateDownloadPackageV010({
          templateId: record.templateId,
          storeVersion: record.version,
          bundle: record.bundle
        });
        const content = JSON.stringify(downloadable, null, 2) + "\n";
        return {
          ok: true,
          correlationId: context.correlationId,
          result: {
            message:
              `Downloaded “${record.bundle.listing.name}” v${record.version}.`,
            download: {
              fileName:
                `${fileStem(record.templateId)}.v${record.version}.evo-template.json`,
              mediaType: "application/vnd.evo.template+json",
              content
            }
          }
        };
      } catch (error) {
        return failure(error);
      }
    }
  };
}
