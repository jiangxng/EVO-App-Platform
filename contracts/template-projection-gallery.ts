export const TEMPLATE_PROJECTION_GALLERY_MAX_ITEMS_V010 = 9 as const;

export interface TemplateProjectionThumbnailV010 {
  src: string;
  alt: string;
}

export interface TemplateProjectionPlacementV010 {
  nodeId: string;
  x: number;
  y: number;
}

export interface TemplateProjectionCameraV010 {
  scale: number;
  translateX: number;
  translateY: number;
}

export type TemplateProjectionEdgePathKindV010 = "straight" | "orthogonal" | "rounded-orthogonal" | "curve";
export interface TemplateProjectionEdgePathV010 {
  edgeId: string;
  pathKind: TemplateProjectionEdgePathKindV010;
}

export interface TemplateProjectionView2dV010 {
  contractVersion: "0.1.0";
  kind: "DIAGRAM_2D";
  hiddenNodeIds?: string[];
  hiddenEdgeIds?: string[];
  /** Presentation-only route overrides keyed by existing relationship id. */
  edgePaths?: TemplateProjectionEdgePathV010[];
  placements?: TemplateProjectionPlacementV010[];
  camera?: TemplateProjectionCameraV010;
}

export interface TemplateProjectionGalleryItemV010 {
  projectionId: string;
  title: string;
  description?: string;
  thumbnail: TemplateProjectionThumbnailV010;
  view: TemplateProjectionView2dV010;
}

export interface TemplateProjectionGalleryV010 {
  contractVersion: "0.1.0";
  primaryProjectionId: string;
  projections: TemplateProjectionGalleryItemV010[];
}

function required(value: unknown, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function uniqueStrings(
  values: unknown,
  code: string
): string[] | undefined {
  if (values === undefined) return undefined;
  if (!Array.isArray(values)) throw new Error(code);
  const normalized = values.map(value => required(value, code));
  if (new Set(normalized).size !== normalized.length) throw new Error(code);
  return normalized;
}

export function assertTemplateProjectionGalleryV010(
  value: TemplateProjectionGalleryV010
): TemplateProjectionGalleryV010 {
  if (
    value?.contractVersion !== "0.1.0"
    || !Array.isArray(value.projections)
    || value.projections.length < 1
    || value.projections.length > TEMPLATE_PROJECTION_GALLERY_MAX_ITEMS_V010
  ) {
    throw new Error("TEMPLATE_PROJECTION_GALLERY_INVALID");
  }

  const projectionIds = new Set<string>();
  const projections = value.projections.map(item => {
    const projectionId = required(
      item?.projectionId,
      "TEMPLATE_PROJECTION_ID_REQUIRED"
    );
    if (projectionIds.has(projectionId)) {
      throw new Error("TEMPLATE_PROJECTION_ID_DUPLICATE");
    }
    projectionIds.add(projectionId);

    if (item?.view?.contractVersion !== "0.1.0" || item.view.kind !== "DIAGRAM_2D") {
      throw new Error("TEMPLATE_PROJECTION_VIEW_INVALID");
    }

    const placements = item.view.placements?.map(placement => {
      const nodeId = required(
        placement?.nodeId,
        "TEMPLATE_PROJECTION_PLACEMENT_NODE_REQUIRED"
      );
      if (
        typeof placement.x !== "number"
        || !Number.isFinite(placement.x)
        || typeof placement.y !== "number"
        || !Number.isFinite(placement.y)
      ) {
        throw new Error("TEMPLATE_PROJECTION_PLACEMENT_INVALID");
      }
      return { nodeId, x: placement.x, y: placement.y };
    });
    if (
      placements
      && new Set(placements.map(item => item.nodeId)).size !== placements.length
    ) {
      throw new Error("TEMPLATE_PROJECTION_PLACEMENT_DUPLICATE");
    }

    const edgePaths = item.view.edgePaths?.map(edge => {
      const edgeId = required(edge?.edgeId, "TEMPLATE_PROJECTION_EDGE_PATH_INVALID");
      if (!["straight", "orthogonal", "rounded-orthogonal", "curve"].includes(edge.pathKind)) {
        throw new Error("TEMPLATE_PROJECTION_EDGE_PATH_INVALID");
      }
      return { edgeId, pathKind: edge.pathKind };
    });
    if ((edgePaths?.length ?? 0) > 10000
      || (edgePaths && new Set(edgePaths.map(item => item.edgeId)).size !== edgePaths.length)) {
      throw new Error("TEMPLATE_PROJECTION_EDGE_PATH_INVALID");
    }

    let camera: TemplateProjectionCameraV010 | undefined;
    if (item.view.camera !== undefined) {
      if (
        typeof item.view.camera.scale !== "number"
        || !Number.isFinite(item.view.camera.scale)
        || item.view.camera.scale <= 0
        || typeof item.view.camera.translateX !== "number"
        || !Number.isFinite(item.view.camera.translateX)
        || typeof item.view.camera.translateY !== "number"
        || !Number.isFinite(item.view.camera.translateY)
      ) {
        throw new Error("TEMPLATE_PROJECTION_CAMERA_INVALID");
      }
      camera = { ...item.view.camera };
    }

    return {
      projectionId,
      title: required(item.title, "TEMPLATE_PROJECTION_TITLE_REQUIRED"),
      ...(item.description?.trim()
        ? { description: item.description.trim() }
        : {}),
      thumbnail: {
        src: required(
          item.thumbnail?.src,
          "TEMPLATE_PROJECTION_THUMBNAIL_SRC_REQUIRED"
        ),
        alt: required(
          item.thumbnail?.alt,
          "TEMPLATE_PROJECTION_THUMBNAIL_ALT_REQUIRED"
        )
      },
      view: {
        contractVersion: "0.1.0" as const,
        kind: "DIAGRAM_2D" as const,
        ...(uniqueStrings(
          item.view.hiddenNodeIds,
          "TEMPLATE_PROJECTION_HIDDEN_NODE_IDS_INVALID"
        ) ? {
          hiddenNodeIds: uniqueStrings(
            item.view.hiddenNodeIds,
            "TEMPLATE_PROJECTION_HIDDEN_NODE_IDS_INVALID"
          )
        } : {}),
        ...(uniqueStrings(
          item.view.hiddenEdgeIds,
          "TEMPLATE_PROJECTION_HIDDEN_EDGE_IDS_INVALID"
        ) ? {
          hiddenEdgeIds: uniqueStrings(
            item.view.hiddenEdgeIds,
            "TEMPLATE_PROJECTION_HIDDEN_EDGE_IDS_INVALID"
          )
        } : {}),
        ...(placements ? { placements } : {}),
        ...(edgePaths ? { edgePaths } : {}),
        ...(camera ? { camera } : {})
      }
    };
  });

  const primaryProjectionId = required(
    value.primaryProjectionId,
    "TEMPLATE_PROJECTION_PRIMARY_REQUIRED"
  );
  if (!projectionIds.has(primaryProjectionId)) {
    throw new Error("TEMPLATE_PROJECTION_PRIMARY_NOT_FOUND");
  }

  return structuredClone({
    contractVersion: "0.1.0" as const,
    primaryProjectionId,
    projections
  });
}

export function primaryTemplateProjectionV010(
  gallery: TemplateProjectionGalleryV010
): TemplateProjectionGalleryItemV010 {
  const valid = assertTemplateProjectionGalleryV010(gallery);
  return valid.projections.find(
    item => item.projectionId === valid.primaryProjectionId
  )!;
}
