import { createHash } from "node:crypto";
import {
  assertTemplateProjectionGalleryV010,
  type TemplateProjectionGalleryV010
} from "./template-projection-gallery.js";
import type {
  BusinessDefinitionAttributionV010,
  BusinessDefinitionRevisionV010,
  BusinessDefinitionStateV010
} from "./enterprise-business-definition.js";

export const ENTERPRISE_TEMPLATE_TRANSFER_CAPABILITY_V010 =
  "enterprise.template-transfer" as const;

export const ENTERPRISE_TEMPLATE_TRANSFER_CONTRACT_V010 =
  "evo.enterprise.template-transfer" as const;

export interface TemplateTransferThumbnailV010 {
  src: string;
  alt: string;
}

export interface TemplateTransferListingV010 {
  name: string;
  description: string;
  thumbnail: TemplateTransferThumbnailV010;
}

export interface TemplateTransferSourceV010 {
  enterpriseId: string;
  definitionId: string;
  definitionRevision: number;
  definitionKind: string;
  definitionState: BusinessDefinitionStateV010;
}

export interface TemplateTransferDefinitionV010 {
  kind: string;
  title: string;
  payload: Record<string, unknown>;
  projectionGallery?: TemplateProjectionGalleryV010;
}

export interface TemplateTransferBundleV010 {
  contractVersion: "0.1.0";
  transferId: string;
  source: TemplateTransferSourceV010;
  listing: TemplateTransferListingV010;
  definition: TemplateTransferDefinitionV010;
  sharedAt: string;
  sharedBy: BusinessDefinitionAttributionV010;
  contentDigest: string;
}

export interface EnterpriseTemplateTransferProviderV010 {
  providerId: string;

  prepareShare(input: {
    enterpriseId: string;
    definitionId: string;
    definitionRevision: number;
    transferId: string;
    listing: TemplateTransferListingV010;
    actor: BusinessDefinitionAttributionV010;
    sharedAt?: string;
  }): TemplateTransferBundleV010;

  copyIntoEnterprise(input: {
    bundle: TemplateTransferBundleV010;
    targetEnterpriseId: string;
    targetDefinitionId: string;
    sourceRef: string;
    actor: BusinessDefinitionAttributionV010;
    recordedAt?: string;
  }): BusinessDefinitionRevisionV010;
}

function canonical(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(canonical).join(",") + "]";
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return "{"
      + Object.keys(record)
        .sort()
        .map(key => JSON.stringify(key) + ":" + canonical(record[key]))
        .join(",")
      + "}";
  }
  throw new Error("TEMPLATE_TRANSFER_CANONICAL_VALUE_INVALID");
}

function required(value: unknown, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

export function templateTransferDigestV010(
  bundle: Omit<TemplateTransferBundleV010, "contentDigest">
    | TemplateTransferBundleV010
): string {
  const clone = structuredClone(bundle) as Record<string, unknown>;
  delete clone.contentDigest;
  return "sha256:" + createHash("sha256")
    .update(canonical(clone), "utf8")
    .digest("hex");
}

export function assertTemplateTransferBundleV010(
  value: TemplateTransferBundleV010
): TemplateTransferBundleV010 {
  if (
    value?.contractVersion !== "0.1.0"
    || !Number.isInteger(value.source?.definitionRevision)
    || value.source.definitionRevision < 0
    || (value.source.definitionState !== "DRAFT"
      && value.source.definitionState !== "PUBLISHED")
    || value.definition?.payload === null
    || Array.isArray(value.definition?.payload)
    || typeof value.definition?.payload !== "object"
    || !Number.isFinite(Date.parse(value.sharedAt))
  ) {
    throw new Error("TEMPLATE_TRANSFER_BUNDLE_INVALID");
  }

  const normalized: TemplateTransferBundleV010 = {
    contractVersion: "0.1.0",
    transferId: required(value.transferId, "TEMPLATE_TRANSFER_ID_REQUIRED"),
    source: {
      enterpriseId: required(
        value.source.enterpriseId,
        "TEMPLATE_TRANSFER_SOURCE_ENTERPRISE_REQUIRED"
      ),
      definitionId: required(
        value.source.definitionId,
        "TEMPLATE_TRANSFER_SOURCE_DEFINITION_REQUIRED"
      ),
      definitionRevision: value.source.definitionRevision,
      definitionKind: required(
        value.source.definitionKind,
        "TEMPLATE_TRANSFER_SOURCE_KIND_REQUIRED"
      ),
      definitionState: value.source.definitionState
    },
    listing: {
      name: required(value.listing?.name, "TEMPLATE_TRANSFER_NAME_REQUIRED"),
      description: required(
        value.listing?.description,
        "TEMPLATE_TRANSFER_DESCRIPTION_REQUIRED"
      ),
      thumbnail: {
        src: required(
          value.listing?.thumbnail?.src,
          "TEMPLATE_TRANSFER_THUMBNAIL_SRC_REQUIRED"
        ),
        alt: required(
          value.listing?.thumbnail?.alt,
          "TEMPLATE_TRANSFER_THUMBNAIL_ALT_REQUIRED"
        )
      }
    },
    definition: {
      kind: required(
        value.definition.kind,
        "TEMPLATE_TRANSFER_DEFINITION_KIND_REQUIRED"
      ),
      title: required(
        value.definition.title,
        "TEMPLATE_TRANSFER_DEFINITION_TITLE_REQUIRED"
      ),
      payload: structuredClone(value.definition.payload),
      ...(value.definition.projectionGallery
        ? {
            projectionGallery: assertTemplateProjectionGalleryV010(
              value.definition.projectionGallery
            )
          }
        : {})
    },
    sharedAt: value.sharedAt,
    sharedBy: {
      actorType: value.sharedBy?.actorType,
      subjectId: required(
        value.sharedBy?.subjectId,
        "TEMPLATE_TRANSFER_ACTOR_SUBJECT_REQUIRED"
      )
    } as BusinessDefinitionAttributionV010,
    contentDigest: required(
      value.contentDigest,
      "TEMPLATE_TRANSFER_DIGEST_REQUIRED"
    )
  };

  if (
    !["HUMAN", "AI", "AUTOMATION", "SERVICE"].includes(
      normalized.sharedBy.actorType
    )
  ) {
    throw new Error("TEMPLATE_TRANSFER_ACTOR_TYPE_INVALID");
  }
  if (
    normalized.source.definitionKind !== normalized.definition.kind
  ) {
    throw new Error("TEMPLATE_TRANSFER_KIND_MISMATCH");
  }

  const expected = templateTransferDigestV010(normalized);
  if (normalized.contentDigest !== expected) {
    throw new Error("TEMPLATE_TRANSFER_DIGEST_MISMATCH");
  }
  return structuredClone(normalized);
}
