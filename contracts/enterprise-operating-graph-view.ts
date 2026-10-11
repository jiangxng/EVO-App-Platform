export const EOG_VIEW_CONTRACT_VERSION_V010 = "0.1.0" as const;

export const PRIMARY_EOG_DIAGRAM_VIEW_ID_V010 =
  "eog-view:primary:diagram-2d" as const;

export const PRIMARY_EOG_SPATIAL_VIEW_ID_V010 =
  "eog-view:primary:spatial-3d" as const;

export type EnterpriseOperatingGraphViewKindV010 =
  | "DIAGRAM_2D"
  | "SPATIAL_3D";

export interface EogViewNodePlacementV010 {
  nodeId: string;
  x: number;
  y: number;
  z?: number;
}

export interface EogViewVector3V010 {
  x: number;
  y: number;
  z: number;
}

export interface EogViewCameraV010 {
  position: EogViewVector3V010;
  target: EogViewVector3V010;
}

export interface EnterpriseOperatingGraphViewStateV010 {
  contractVersion: typeof EOG_VIEW_CONTRACT_VERSION_V010;
  viewId: string;
  graphId: string;
  enterpriseId: string;
  kind: EnterpriseOperatingGraphViewKindV010;
  revision: number;
  placements: EogViewNodePlacementV010[];
  hiddenNodeIds?: string[];
  hiddenEdgeIds?: string[];
  camera?: EogViewCameraV010;
  createdAt: string;
  updatedAt: string;
}

export type EnterpriseOperatingGraphViewMutationV010 =
  | {
      type: "NODE_POSITION_SET";
      placement: EogViewNodePlacementV010;
    }
  | {
      type: "PROJECTION_ITEM_VISIBILITY_SET";
      target: {
        kind: "NODE" | "EDGE";
        id: string;
      };
      visible: boolean;
    }
  | {
      type: "PROJECTION_VISIBILITY_RESET";
    }
  | {
      type: "PROJECTION_VISIBILITY_REPLACE";
      hiddenNodeIds: string[];
      hiddenEdgeIds: string[];
    }
  | {
      type: "CAMERA_SET";
      camera: EogViewCameraV010;
    };
