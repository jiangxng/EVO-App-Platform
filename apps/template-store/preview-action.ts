import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  JsonValue
} from "../../actions/contracts.js";
import {
  TEMPLATE_2D_PREVIEW_ROUTE_V010,
  type TemplatePreviewSessionStoreV010
} from "../../contracts/template-preview.js";
import type {
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import {
  assertTemplateProjectionGalleryV010
} from "../../contracts/template-projection-gallery.js";
import {
  TEMPLATE_STORE_FEATURE_ID,
  TEMPLATE_STORE_PACKAGE_ID,
  TEMPLATE_STORE_PREVIEW_2D_COMMAND
} from "./package.js";
import type {
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
        : "TEMPLATE_STORE_PREVIEW_FAILED",
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
    throw new Error(`TEMPLATE_STORE_PREVIEW_FIELD_INVALID: ${key}`);
  }
  return value;
}

function optionalString(
  values: Record<string, JsonValue>,
  key: string
): string | undefined {
  const value = values[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`TEMPLATE_STORE_PREVIEW_FIELD_INVALID: ${key}`);
  }
  return value.trim();
}

function itemId(values: Record<string, JsonValue>): string {
  const value = values.itemId ?? values.templateId;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("TEMPLATE_STORE_PREVIEW_TEMPLATE_REQUIRED");
  }
  return value.trim();
}

export function createTemplateStorePreview2dActionHandlerV010(input: {
  store: TemplateStoreRepositoryV010;
  sessions: TemplatePreviewSessionStoreV010;
  viewerAvailable(): boolean;
  now?: () => Date;
}): AppActionHandler {
  return {
    packageId: TEMPLATE_STORE_PACKAGE_ID,
    featureId: TEMPLATE_STORE_FEATURE_ID,
    commandCode: TEMPLATE_STORE_PREVIEW_2D_COMMAND,

    async execute(request, suppliedContext) {
      try {
        const context = requireContext(suppliedContext);
        if (!input.viewerAvailable()) {
          throw new Error(
            "TEMPLATE_2D_VIEWER_NOT_INSTALLED: "
            + "2D Viewer extension is not installed, so this template cannot be previewed."
          );
        }

        const templateId = itemId(request.values);
        const templateVersion = optionalPositiveInteger(
          request.values,
          "templateVersion"
        );
        const record = templateVersion === undefined
          ? input.store.getLatest(templateId)
          : input.store.getVersion(templateId, templateVersion);
        if (!record) throw new Error("TEMPLATE_STORE_VERSION_NOT_FOUND");

        const requestedProjectionId = optionalString(
          request.values,
          "projectionId"
        );
        const gallery = record.bundle.definition.projectionGallery
          ? assertTemplateProjectionGalleryV010(
              record.bundle.definition.projectionGallery
            )
          : undefined;
        const projectionId = gallery
          ? requestedProjectionId ?? gallery.primaryProjectionId
          : requestedProjectionId;
        if (
          projectionId
          && (!gallery || !gallery.projections.some(
            item => item.projectionId === projectionId
          ))
        ) {
          throw new Error("TEMPLATE_PROJECTION_NOT_FOUND");
        }

        const selection = {
          contractVersion: "0.1.0" as const,
          templateId: record.templateId,
          templateVersion: record.version,
          ...(projectionId ? { projectionId } : {}),
          selectedAt: (input.now ?? (() => new Date()))().toISOString()
        };
        for (const key of sessionKeys(context)) {
          input.sessions.set(key, selection);
        }

        return {
          ok: true,
          correlationId: context.correlationId,
          result: {
            message: `Opening 2D preview for “${record.bundle.listing.name}”.`,
            navigateTo: TEMPLATE_2D_PREVIEW_ROUTE_V010
          }
        };
      } catch (error) {
        return failure(error);
      }
    }
  };
}
