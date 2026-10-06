import {
  PRIMARY_EOG_DIAGRAM_VIEW_ID_V010,
  PRIMARY_EOG_SPATIAL_VIEW_ID_V010,
  type EnterpriseOperatingGraphViewKindV010,
  type EnterpriseOperatingGraphViewStateV010
} from "../../contracts/enterprise-operating-graph-view.js";
import type {
  EnterpriseOperatingGraphViewStoreV010
} from "./store.js";
import type {
  EnterpriseOperatingGraphViewStateProviderV010
} from "../../contracts/enterprise-operating-graph-view-state.js";

function required(value: string, code: string): string {
  if (!value?.trim()) throw new Error(code);
  return value.trim();
}

function finite(value: number, code: string): number {
  if (!Number.isFinite(value)) throw new Error(code);
  return value;
}

function defaultViewId(
  graphId: string,
  kind: EnterpriseOperatingGraphViewKindV010
): string {
  if (graphId === "eog:primary") {
    return kind === "DIAGRAM_2D"
      ? PRIMARY_EOG_DIAGRAM_VIEW_ID_V010
      : PRIMARY_EOG_SPATIAL_VIEW_ID_V010;
  }
  return graphId + (kind === "DIAGRAM_2D" ? ":view:diagram-2d" : ":view:spatial-3d");
}

export function createEogViewStateProviderV010(input: {
  store: EnterpriseOperatingGraphViewStoreV010;
  now?: () => Date;
}): EnterpriseOperatingGraphViewStateProviderV010 {
  const now = input.now ?? (() => new Date());

  const scoped = (
    enterpriseId: string,
    graphId: string,
    viewId: string
  ): EnterpriseOperatingGraphViewStateV010 => {
    const view = input.store.get(required(viewId, "EOG_VIEW_ID_REQUIRED"));
    if (
      !view
      || view.enterpriseId !== required(enterpriseId, "EOG_ENTERPRISE_ID_REQUIRED")
      || view.graphId !== required(graphId, "EOG_GRAPH_ID_REQUIRED")
    ) {
      throw new Error("EOG_VIEW_NOT_FOUND");
    }
    return view;
  };

  return {
    ensure(request) {
      const enterpriseId = required(request.enterpriseId, "EOG_ENTERPRISE_ID_REQUIRED");
      const graphId = required(request.graphId, "EOG_GRAPH_ID_REQUIRED");
      const viewId = request.viewId?.trim() || defaultViewId(graphId, request.kind);
      const existing = input.store.get(viewId);
      if (existing) {
        if (
          existing.enterpriseId !== enterpriseId
          || existing.graphId !== graphId
          || existing.kind !== request.kind
        ) {
          throw new Error("EOG_VIEW_IDENTITY_CONFLICT");
        }
        return existing;
      }
      const occurredAt = request.occurredAt ?? now().toISOString();
      return input.store.create({
        contractVersion: "0.1.0",
        viewId,
        graphId,
        enterpriseId,
        kind: request.kind,
        revision: 0,
        placements: [],
        ...(request.kind === "DIAGRAM_2D"
          ? {
              hiddenNodeIds: [],
              hiddenEdgeIds: []
            }
          : {}),
        createdAt: occurredAt,
        updatedAt: occurredAt
      });
    },

    get(request) {
      return scoped(request.enterpriseId, request.graphId, request.viewId);
    },

    list(request) {
      return input.store.listByGraph({
        enterpriseId: required(request.enterpriseId, "EOG_ENTERPRISE_ID_REQUIRED"),
        graphId: required(request.graphId, "EOG_GRAPH_ID_REQUIRED")
      });
    },

    apply(request) {
      const current = scoped(
        request.enterpriseId,
        request.graphId,
        request.viewId
      );
      if (
        !Number.isInteger(request.expectedRevision)
        || request.expectedRevision !== current.revision
      ) {
        throw new Error("EOG_VIEW_REVISION_CONFLICT");
      }
      const next = structuredClone(current);
      const occurredAt = request.occurredAt ?? now().toISOString();

      if (request.mutation.type === "NODE_POSITION_SET") {
        const placement = structuredClone(request.mutation.placement);
        required(placement.nodeId, "EOG_VIEW_NODE_ID_REQUIRED");
        finite(placement.x, "EOG_VIEW_POSITION_INVALID");
        finite(placement.y, "EOG_VIEW_POSITION_INVALID");
        if (next.kind === "DIAGRAM_2D") {
          if (placement.z !== undefined) throw new Error("EOG_VIEW_POSITION_INVALID");
        } else {
          if (placement.z === undefined) throw new Error("EOG_VIEW_POSITION_INVALID");
          finite(placement.z, "EOG_VIEW_POSITION_INVALID");
        }
        next.placements = next.placements.filter(
          item => item.nodeId !== placement.nodeId
        );
        next.placements.push(placement);
      } else if (request.mutation.type === "PROJECTION_ITEM_VISIBILITY_SET") {
        if (next.kind !== "DIAGRAM_2D") {
          throw new Error("EOG_VIEW_PROJECTION_2D_REQUIRED");
        }
        const id = required(
          request.mutation.target.id,
          "EOG_VIEW_PROJECTION_ITEM_ID_REQUIRED"
        );
        const hidden = request.mutation.target.kind === "NODE"
          ? new Set(next.hiddenNodeIds ?? [])
          : new Set(next.hiddenEdgeIds ?? []);
        if (request.mutation.visible) hidden.delete(id);
        else hidden.add(id);
        if (request.mutation.target.kind === "NODE") {
          next.hiddenNodeIds = [...hidden];
        } else {
          next.hiddenEdgeIds = [...hidden];
        }
      } else if (request.mutation.type === "PROJECTION_VISIBILITY_RESET") {
        if (next.kind !== "DIAGRAM_2D") {
          throw new Error("EOG_VIEW_PROJECTION_2D_REQUIRED");
        }
        next.hiddenNodeIds = [];
        next.hiddenEdgeIds = [];
      } else if (request.mutation.type === "PROJECTION_VISIBILITY_REPLACE") {
        if (next.kind !== "DIAGRAM_2D") {
          throw new Error("EOG_VIEW_PROJECTION_2D_REQUIRED");
        }
        const hiddenNodeIds = request.mutation.hiddenNodeIds.map(id =>
          required(id, "EOG_VIEW_PROJECTION_ITEM_ID_REQUIRED")
        );
        const hiddenEdgeIds = request.mutation.hiddenEdgeIds.map(id =>
          required(id, "EOG_VIEW_PROJECTION_ITEM_ID_REQUIRED")
        );
        if (
          new Set(hiddenNodeIds).size !== hiddenNodeIds.length
          || new Set(hiddenEdgeIds).size !== hiddenEdgeIds.length
        ) {
          throw new Error("EOG_VIEW_PROJECTION_ITEMS_DUPLICATE");
        }
        next.hiddenNodeIds = [...hiddenNodeIds];
        next.hiddenEdgeIds = [...hiddenEdgeIds];
      } else if (request.mutation.type === "CAMERA_SET") {
        if (next.kind !== "SPATIAL_3D") {
          throw new Error("EOG_VIEW_CAMERA_3D_REQUIRED");
        }
        for (const vector of [
          request.mutation.camera.position,
          request.mutation.camera.target
        ]) {
          finite(vector.x, "EOG_VIEW_CAMERA_INVALID");
          finite(vector.y, "EOG_VIEW_CAMERA_INVALID");
          finite(vector.z, "EOG_VIEW_CAMERA_INVALID");
        }
        next.camera = structuredClone(request.mutation.camera);
      }

      next.revision += 1;
      next.updatedAt = occurredAt;
      return input.store.replace(next);
    }
  };
}


export const createEnterpriseOperatingGraphViewHostServiceV010 =
  createEogViewStateProviderV010;
