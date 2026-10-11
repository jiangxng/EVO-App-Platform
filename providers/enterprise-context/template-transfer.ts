import type {
  BusinessDefinitionRepositoryV010
} from "../../contracts/enterprise-business-definition.js";
import {
  assertTemplateTransferBundleV010,
  templateTransferDigestV010,
  type EnterpriseTemplateTransferProviderV010,
  type TemplateTransferBundleV010
} from "../../contracts/template-transfer.js";
import {
  HOST_ENTERPRISE_TEMPLATE_TRANSFER_PROVIDER_ID
} from "./package.js";

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function at(value: string | undefined, code: string): string {
  const normalized = value ?? new Date().toISOString();
  if (!Number.isFinite(Date.parse(normalized))) throw new Error(code);
  return normalized;
}

export function createEnterpriseTemplateTransferProviderV010(
  repository: BusinessDefinitionRepositoryV010
): EnterpriseTemplateTransferProviderV010 {
  return {
    providerId: HOST_ENTERPRISE_TEMPLATE_TRANSFER_PROVIDER_ID,

    prepareShare(input) {
      const enterpriseId = required(
        input.enterpriseId,
        "TEMPLATE_SHARE_ENTERPRISE_REQUIRED"
      );
      const definitionId = required(
        input.definitionId,
        "TEMPLATE_SHARE_DEFINITION_REQUIRED"
      );
      if (
        !Number.isInteger(input.definitionRevision)
        || input.definitionRevision < 0
      ) {
        throw new Error("TEMPLATE_SHARE_REVISION_INVALID");
      }

      const revision = repository.listHistory({
        enterpriseId,
        definitionId
      }).find(item => item.revision === input.definitionRevision);
      if (!revision) throw new Error("TEMPLATE_SHARE_REVISION_NOT_FOUND");

      const unsigned = {
        contractVersion: "0.1.0" as const,
        transferId: required(
          input.transferId,
          "TEMPLATE_TRANSFER_ID_REQUIRED"
        ),
        source: {
          enterpriseId,
          definitionId,
          definitionRevision: revision.revision,
          definitionKind: revision.kind,
          definitionState: revision.state
        },
        listing: structuredClone(input.listing),
        definition: {
          kind: revision.kind,
          title: revision.title,
          payload: structuredClone(revision.payload),
          ...(revision.projectionGallery
            ? {
                projectionGallery: structuredClone(
                  revision.projectionGallery
                )
              }
            : {})
        },
        sharedAt: at(input.sharedAt, "TEMPLATE_SHARE_AT_INVALID"),
        sharedBy: structuredClone(input.actor)
      };
      const bundle: TemplateTransferBundleV010 = {
        ...unsigned,
        contentDigest: templateTransferDigestV010(unsigned)
      };
      return assertTemplateTransferBundleV010(bundle);
    },

    copyIntoEnterprise(input) {
      const bundle = assertTemplateTransferBundleV010(input.bundle);
      return repository.createDraft({
        enterpriseId: required(
          input.targetEnterpriseId,
          "TEMPLATE_COPY_TARGET_ENTERPRISE_REQUIRED"
        ),
        definitionId: required(
          input.targetDefinitionId,
          "TEMPLATE_COPY_TARGET_DEFINITION_REQUIRED"
        ),
        kind: bundle.definition.kind,
        title: bundle.definition.title,
        payload: structuredClone(bundle.definition.payload),
        ...(bundle.definition.projectionGallery
          ? {
              projectionGallery: structuredClone(
                bundle.definition.projectionGallery
              )
            }
          : {}),
        actor: structuredClone(input.actor),
        recordedAt: input.recordedAt,
        origin: {
          type: "TEMPLATE_COPY",
          sourceRef: required(
            input.sourceRef,
            "TEMPLATE_COPY_SOURCE_REF_REQUIRED"
          )
        }
      });
    }
  };
}
