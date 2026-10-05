import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import {
  authorizeMaterialWriteV010
} from "../../actions/material-write-authorization.js";
import type {
  BusinessDefinitionRepositoryV010,
  BusinessDefinitionRevisionV010
} from "../../contracts/enterprise-business-definition.js";
import {
  DEFINITION_2D_PREVIEW_ROUTE_V010,
  type DefinitionProjectionSessionStoreV010
} from "../../contracts/definition-projection.js";
import type {
  AuthorizationProviderV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type {
  TemplatePublicationProviderV010
} from "../../contracts/template-publication.js";
import type {
  EnterpriseTemplateTransferProviderV010
} from "../../contracts/template-transfer.js";
import {
  ENTERPRISE_CONTEXT_GOVERNANCE_APP_FEATURE_ID,
  ENTERPRISE_CONTEXT_GOVERNANCE_APP_PACKAGE_ID,
  ENTERPRISE_SOFTWARE_BEGIN_DRAFT_COMMAND,
  ENTERPRISE_SOFTWARE_CREATE_VERSION_COMMAND,
  ENTERPRISE_SOFTWARE_DETAIL_ROUTE,
  ENTERPRISE_SOFTWARE_OPEN_DETAIL_COMMAND,
  ENTERPRISE_SOFTWARE_PREVIEW_PROJECTION_COMMAND,
  ENTERPRISE_SOFTWARE_SHARE_COMMAND
} from "./constants.js";

function errorResult(
  request: AppActionRequestV010,
  error: unknown
): AppActionExecutionResultV010 {
  const message = error instanceof Error ? error.message : String(error);
  const [candidate] = message.split(":");
  return {
    ok: false,
    correlationId: request.sourceInteractionId,
    error: {
      code: candidate && /^[A-Z0-9_]+$/u.test(candidate)
        ? candidate
        : "ENTERPRISE_SOFTWARE_ACTION_FAILED",
      message
    }
  };
}

function success(
  request: AppActionRequestV010,
  value: unknown
): AppActionExecutionResultV010 {
  return {
    ok: true,
    correlationId: request.sourceInteractionId,
    result: JSON.parse(JSON.stringify(value))
  };
}

function enterpriseScope(
  context: PlatformRequestContextV010
): { enterpriseId: string; subjectId: string } {
  const active = context.context?.activeContext;
  if (active?.kind !== "ENTERPRISE" || !active.enterpriseId?.trim()) {
    throw new Error("ENTERPRISE_SOFTWARE_CONTEXT_REQUIRED");
  }
  if (context.principal.actorType !== "HUMAN") {
    throw new Error("ENTERPRISE_SOFTWARE_HUMAN_REQUIRED");
  }
  return {
    enterpriseId: active.enterpriseId.trim(),
    subjectId: context.principal.subjectId
  };
}

function stringValue(
  values: Record<string, JsonValue>,
  key: string
): string {
  const value = values[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("ENTERPRISE_SOFTWARE_FIELD_INVALID:" + key);
  }
  return value.trim();
}

function revisionValue(
  values: Record<string, JsonValue>,
  key = "expectedRevision"
): number {
  const value = values[key];
  if (
    typeof value !== "number"
    || !Number.isInteger(value)
    || value < 0
  ) {
    throw new Error("ENTERPRISE_SOFTWARE_REVISION_INVALID");
  }
  return value;
}

async function authorize(
  provider: AuthorizationProviderV010 | undefined,
  context: PlatformRequestContextV010,
  action: string,
  definitionId: string,
  revision: number
): Promise<void> {
  const decision = await authorizeMaterialWriteV010(
    provider,
    context,
    {
      action,
      resource: {
        type: "enterprise.software",
        id: definitionId,
        attributes: { revision }
      }
    }
  );
  if (!decision.allowed) {
    throw new Error(
      (decision.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED")
      + ": denied by '" + decision.policyProviderId + "'"
    );
  }
}

function handler(
  commandCode: string,
  execute: (
    request: AppActionRequestV010,
    context: PlatformRequestContextV010
  ) => Promise<AppActionExecutionResultV010>
): AppActionHandler {
  return {
    packageId: ENTERPRISE_CONTEXT_GOVERNANCE_APP_PACKAGE_ID,
    featureId: ENTERPRISE_CONTEXT_GOVERNANCE_APP_FEATURE_ID,
    commandCode,
    async execute(request, context) {
      if (!context) {
        return errorResult(request, new Error("REQUEST_CONTEXT_REQUIRED"));
      }
      try {
        return await execute(request, context);
      } catch (error) {
        return errorResult(request, error);
      }
    }
  };
}

function sessionKeys(context: PlatformRequestContextV010): string[] {
  return [
    context.principal.sessionId?.trim(),
    context.principal.subjectId.trim()
  ].filter((value, index, values): value is string =>
    Boolean(value) && values.indexOf(value) === index
  );
}

function current(
  repository: BusinessDefinitionRepositoryV010,
  enterpriseId: string,
  definitionId: string,
  expectedRevision: number
): BusinessDefinitionRevisionV010 {
  const item = repository.getLatest({ enterpriseId, definitionId });
  if (!item) throw new Error("BUSINESS_DEFINITION_NOT_FOUND");
  if (item.revision !== expectedRevision) {
    throw new Error("BUSINESS_DEFINITION_REVISION_CONFLICT");
  }
  return item;
}

function safeSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    || "software";
}

function sharedTemplateId(
  enterpriseId: string,
  definitionId: string
): string {
  return [
    "enterprise",
    safeSegment(enterpriseId),
    safeSegment(definitionId)
  ].join(".");
}

function fallbackThumbnail(title: string): {
  src: string;
  alt: string;
} {
  const escaped = encodeURIComponent(title.slice(0, 80));
  return {
    src:
      "data:image/svg+xml,"
      + "%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360'%3E"
      + "%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E"
      + "%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='28' fill='%23374151'%3E"
      + escaped
      + "%3C/text%3E%3C/svg%3E",
    alt: title
  };
}

function mainThumbnail(
  revision: BusinessDefinitionRevisionV010
): { src: string; alt: string } {
  const gallery = revision.projectionGallery;
  const primary = gallery?.projections.find(
    item => item.projectionId === gallery.primaryProjectionId
  );
  return primary
    ? structuredClone(primary.thumbnail)
    : fallbackThumbnail(revision.title);
}

export function createEnterpriseSoftwareActionHandlersV010(input: {
  repository: BusinessDefinitionRepositoryV010;
  transfer: EnterpriseTemplateTransferProviderV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
  resolvePublicationProvider():
    Promise<TemplatePublicationProviderV010 | undefined>;
  projectionSessions: DefinitionProjectionSessionStoreV010;
  viewerAvailable(): boolean;
  now?: () => Date;
  id?: () => string;
}): AppActionHandler[] {
  const now = input.now ?? (() => new Date());
  const id = input.id ?? (() => crypto.randomUUID());

  return [
    handler(
      ENTERPRISE_SOFTWARE_OPEN_DETAIL_COMMAND,
      async (request, context) => {
        const scope = enterpriseScope(context);
        const definitionId = stringValue(request.values, "itemId");
        const definitionRevision = revisionValue(
          request.values,
          "definitionRevision"
        );
        const revision = input.repository.listHistory({
          enterpriseId: scope.enterpriseId,
          definitionId
        }).find(item => item.revision === definitionRevision);
        if (!revision) {
          throw new Error("BUSINESS_DEFINITION_REVISION_NOT_FOUND");
        }
        const selection = {
          contractVersion: "0.1.0" as const,
          enterpriseId: scope.enterpriseId,
          definitionId,
          definitionRevision,
          selectedAt: now().toISOString()
        };
        for (const key of sessionKeys(context)) {
          input.projectionSessions.set(key, selection);
        }
        return success(request, {
          message: `Opening details for “${revision.title}”.`,
          navigateTo: ENTERPRISE_SOFTWARE_DETAIL_ROUTE
        });
      }
    ),

    handler(
      ENTERPRISE_SOFTWARE_PREVIEW_PROJECTION_COMMAND,
      async (request, context) => {
        const scope = enterpriseScope(context);
        if (!input.viewerAvailable()) {
          throw new Error(
            "DEFINITION_2D_VIEWER_NOT_INSTALLED: "
            + "2D Viewer extension is not installed."
          );
        }
        const definitionId = stringValue(request.values, "itemId");
        const definitionRevision = revisionValue(
          request.values,
          "definitionRevision"
        );
        const projectionId = stringValue(request.values, "projectionId");
        const revision = input.repository.listHistory({
          enterpriseId: scope.enterpriseId,
          definitionId
        }).find(item => item.revision === definitionRevision);
        if (!revision) {
          throw new Error("BUSINESS_DEFINITION_REVISION_NOT_FOUND");
        }
        if (
          !revision.projectionGallery?.projections.some(
            item => item.projectionId === projectionId
          )
        ) {
          throw new Error("DEFINITION_PROJECTION_NOT_FOUND");
        }
        const selection = {
          contractVersion: "0.1.0" as const,
          enterpriseId: scope.enterpriseId,
          definitionId,
          definitionRevision,
          projectionId,
          selectedAt: now().toISOString()
        };
        for (const key of sessionKeys(context)) {
          input.projectionSessions.set(key, selection);
        }
        return success(request, {
          message: `Opening 2D projection “${projectionId}”.`,
          navigateTo: DEFINITION_2D_PREVIEW_ROUTE_V010
        });
      }
    ),

    handler(
      ENTERPRISE_SOFTWARE_CREATE_VERSION_COMMAND,
      async (request, context) => {
        const scope = enterpriseScope(context);
        const definitionId = stringValue(request.values, "itemId");
        const expectedRevision = revisionValue(request.values);
        if (request.requiresConfirmation !== true) {
          throw new Error("ENTERPRISE_SOFTWARE_CONFIRMATION_REQUIRED");
        }
        const latest = current(
          input.repository,
          scope.enterpriseId,
          definitionId,
          expectedRevision
        );
        if (latest.state !== "DRAFT") {
          throw new Error("ENTERPRISE_SOFTWARE_DRAFT_REQUIRED");
        }
        await authorize(
          input.resolveAuthorizationProvider(),
          context,
          "enterprise.software.create-version",
          definitionId,
          expectedRevision
        );
        const published = input.repository.publish({
          enterpriseId: scope.enterpriseId,
          definitionId,
          expectedRevision,
          actor: {
            actorType: "HUMAN",
            subjectId: scope.subjectId
          },
          recordedAt: now().toISOString()
        });
        const version = input.repository.listHistory({
          enterpriseId: scope.enterpriseId,
          definitionId
        }).filter(item => item.state === "PUBLISHED").length;
        return success(request, {
          message: `Created Version ${version} for “${published.title}”.`,
          definitionId,
          definitionRevision: published.revision,
          version
        });
      }
    ),

    handler(
      ENTERPRISE_SOFTWARE_BEGIN_DRAFT_COMMAND,
      async (request, context) => {
        const scope = enterpriseScope(context);
        const definitionId = stringValue(request.values, "itemId");
        const expectedRevision = revisionValue(request.values);
        if (request.requiresConfirmation !== true) {
          throw new Error("ENTERPRISE_SOFTWARE_CONFIRMATION_REQUIRED");
        }
        const latest = current(
          input.repository,
          scope.enterpriseId,
          definitionId,
          expectedRevision
        );
        if (latest.state !== "PUBLISHED") {
          throw new Error("ENTERPRISE_SOFTWARE_VERSION_REQUIRED");
        }
        await authorize(
          input.resolveAuthorizationProvider(),
          context,
          "enterprise.software.begin-draft",
          definitionId,
          expectedRevision
        );
        const draft = input.repository.beginDraft({
          enterpriseId: scope.enterpriseId,
          definitionId,
          expectedRevision,
          title: latest.title,
          payload: structuredClone(latest.payload),
          ...(latest.projectionGallery
            ? { projectionGallery: structuredClone(latest.projectionGallery) }
            : {}),
          actor: {
            actorType: "HUMAN",
            subjectId: scope.subjectId
          },
          recordedAt: now().toISOString()
        });
        return success(request, {
          message: `Started a new Working Draft for “${draft.title}”.`,
          definitionId,
          definitionRevision: draft.revision
        });
      }
    ),

    handler(
      ENTERPRISE_SOFTWARE_SHARE_COMMAND,
      async (request, context) => {
        const scope = enterpriseScope(context);
        const definitionId = stringValue(request.values, "itemId");
        const definitionRevision = revisionValue(
          request.values,
          "definitionRevision"
        );
        if (request.requiresConfirmation !== true) {
          throw new Error("ENTERPRISE_SOFTWARE_CONFIRMATION_REQUIRED");
        }
        const history = input.repository.listHistory({
          enterpriseId: scope.enterpriseId,
          definitionId
        });
        const revision = history.find(
          item => item.revision === definitionRevision
        );
        if (!revision) {
          throw new Error("BUSINESS_DEFINITION_REVISION_NOT_FOUND");
        }
        if (revision.state !== "PUBLISHED") {
          throw new Error("ENTERPRISE_SOFTWARE_SHARE_VERSION_REQUIRED");
        }
        await authorize(
          input.resolveAuthorizationProvider(),
          context,
          "enterprise.software.share",
          definitionId,
          definitionRevision
        );
        const publication = await input.resolvePublicationProvider();
        if (!publication) {
          throw new Error("TEMPLATE_STORE_PUBLICATION_UNAVAILABLE");
        }
        const sharedAt = now().toISOString();
        const bundle = input.transfer.prepareShare({
          enterpriseId: scope.enterpriseId,
          definitionId,
          definitionRevision,
          transferId: "share:" + id(),
          listing: {
            name: revision.title,
            description:
              `Shared enterprise software version from ${scope.enterpriseId}.`,
            thumbnail: mainThumbnail(revision)
          },
          actor: {
            actorType: "HUMAN",
            subjectId: scope.subjectId
          },
          sharedAt
        });
        const published = publication.publish({
          templateId: sharedTemplateId(scope.enterpriseId, definitionId),
          bundle,
          publishedAt: sharedAt
        });
        return success(request, {
          message:
            `Shared “${revision.title}” to Template Store as v${published.version}.`,
          templateId: published.templateId,
          templateVersion: published.version,
          definitionId,
          definitionRevision
        });
      }
    )
  ];
}
