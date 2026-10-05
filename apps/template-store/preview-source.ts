import type {
  TemplatePreviewArtifactSourceV010,
  TemplatePreviewArtifactV010
} from "../../contracts/template-preview.js";
import {
  applyDefinitionProjectionV010,
  buildDefinition2dBaseV010
} from "../../eog/definition-projection.js";
import type {
  TemplateStoreRecordV010,
  TemplateStoreRepositoryV010
} from "./repository.js";

function toArtifact(
  record: TemplateStoreRecordV010,
  projectionId?: string
): TemplatePreviewArtifactV010 {
  const projected = applyDefinitionProjectionV010({
    diagram: buildDefinition2dBaseV010(
      record.bundle.definition.payload
    ),
    ...(record.bundle.definition.projectionGallery
      ? { gallery: record.bundle.definition.projectionGallery }
      : {}),
    ...(projectionId ? { projectionId } : {})
  });

  return {
    contractVersion: "0.1.0",
    templateId: record.templateId,
    templateVersion: record.version,
    ...(projected.projectionId
      ? { projectionId: projected.projectionId }
      : {}),
    title: projected.title ?? record.bundle.listing.name,
    ...(projected.description ?? record.bundle.listing.description
      ? {
          description:
            projected.description ?? record.bundle.listing.description
        }
      : {}),
    definitionKind: record.bundle.definition.kind,
    ...(projected.diagram2d ? { diagram2d: projected.diagram2d } : {})
  };
}

export function createTemplateStorePreviewArtifactSourceV010(
  repository: TemplateStoreRepositoryV010
): TemplatePreviewArtifactSourceV010 {
  return {
    get(input) {
      const record = input.templateVersion === undefined
        ? repository.getLatest(input.templateId)
        : repository.getVersion(
            input.templateId,
            input.templateVersion
          );
      return record ? toArtifact(record, input.projectionId) : undefined;
    }
  };
}
