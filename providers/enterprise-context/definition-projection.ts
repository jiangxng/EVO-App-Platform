import type {
  DefinitionProjectionArtifactSourceV010,
  DefinitionProjectionArtifactV010
} from "../../contracts/definition-projection.js";
import type {
  BusinessDefinitionRepositoryV010,
  BusinessDefinitionRevisionV010
} from "../../contracts/enterprise-business-definition.js";
import type {
  DefinitionProjectionStoreV010
} from "./definition-projection-store.js";
import {
  applyDefinitionProjectionV010,
  buildDefinition2dBaseV010
} from "../../eog/definition-projection.js";

function resolveRevision(
  repository: BusinessDefinitionRepositoryV010,
  input: {
    enterpriseId: string;
    definitionId: string;
    definitionRevision?: number;
  }
): BusinessDefinitionRevisionV010 | undefined {
  if (input.definitionRevision === undefined) {
    return repository.getLatest({
      enterpriseId: input.enterpriseId,
      definitionId: input.definitionId
    });
  }
  return repository.listHistory({
    enterpriseId: input.enterpriseId,
    definitionId: input.definitionId
  }).find(item => item.revision === input.definitionRevision);
}

export function createEnterpriseDefinitionProjectionArtifactSourceV010(
  repository: BusinessDefinitionRepositoryV010,
  projectionStore?: DefinitionProjectionStoreV010
): DefinitionProjectionArtifactSourceV010 {
  return {
    get(input) {
      const revision = resolveRevision(repository, input);
      if (!revision) return undefined;
      const projectionGallery = projectionStore?.get({
        enterpriseId: revision.enterpriseId,
        definitionId: revision.definitionId,
        definitionRevision: revision.revision
      }) ?? revision.projectionGallery;
      const projected = applyDefinitionProjectionV010({
        diagram: buildDefinition2dBaseV010(revision.payload),
        ...(projectionGallery
          ? { gallery: projectionGallery }
          : {}),
        ...(input.projectionId ? { projectionId: input.projectionId } : {}),
        ...(input.includeHidden === true ? { includeHidden: true } : {})
      });
      const artifact: DefinitionProjectionArtifactV010 = {
        contractVersion: "0.1.0",
        enterpriseId: revision.enterpriseId,
        definitionId: revision.definitionId,
        definitionRevision: revision.revision,
        ...(projected.projectionId
          ? { projectionId: projected.projectionId }
          : {}),
        title: projected.title ?? revision.title,
        ...(projected.description
          ? { description: projected.description }
          : {}),
        definitionKind: revision.kind,
        ...(projected.diagram2d
          ? { diagram2d: projected.diagram2d }
          : {}),
        ...(projected.hiddenNodeIds?.length
          ? { hiddenNodeIds: [...projected.hiddenNodeIds] }
          : {}),
        ...(projected.hiddenEdgeIds?.length
          ? { hiddenEdgeIds: [...projected.hiddenEdgeIds] }
          : {}),
        ...(projected.camera
          ? { camera: projected.camera }
          : {})
      };
      return artifact;
    }
  };
}
