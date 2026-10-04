import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import type {
  EnterpriseOperatingGraphViewStateV010
} from "../../contracts/enterprise-operating-graph-view.js";

export interface EnterpriseOperatingGraphViewStoreSnapshotV010 {
  contractVersion: "0.1.0";
  views: EnterpriseOperatingGraphViewStateV010[];
}

export interface EnterpriseOperatingGraphViewStoreV010 {
  create(view: EnterpriseOperatingGraphViewStateV010): EnterpriseOperatingGraphViewStateV010;
  replace(view: EnterpriseOperatingGraphViewStateV010): EnterpriseOperatingGraphViewStateV010;
  get(viewId: string): EnterpriseOperatingGraphViewStateV010 | undefined;
  listByGraph(input: {
    enterpriseId: string;
    graphId: string;
  }): EnterpriseOperatingGraphViewStateV010[];
  snapshot(): EnterpriseOperatingGraphViewStoreSnapshotV010;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function nonEmpty(value: string): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function finite(value: number): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

function validVector(value: { x: number; y: number; z: number }): boolean {
  return finite(value.x) && finite(value.y) && finite(value.z);
}

export function validateEnterpriseOperatingGraphViewStateV010(
  view: EnterpriseOperatingGraphViewStateV010
): void {
  if (
    view.contractVersion !== "0.1.0"
    || !nonEmpty(view.viewId)
    || !nonEmpty(view.graphId)
    || !nonEmpty(view.enterpriseId)
    || !["DIAGRAM_2D", "SPATIAL_3D"].includes(view.kind)
    || !Number.isInteger(view.revision)
    || view.revision < 0
    || !Number.isFinite(Date.parse(view.createdAt))
    || !Number.isFinite(Date.parse(view.updatedAt))
    || !Array.isArray(view.placements)
  ) {
    throw new Error("EOG_VIEW_STATE_INVALID");
  }

  const nodeIds = new Set<string>();
  for (const placement of view.placements) {
    if (
      !nonEmpty(placement.nodeId)
      || !finite(placement.x)
      || !finite(placement.y)
      || (view.kind === "DIAGRAM_2D" && placement.z !== undefined)
      || (view.kind === "SPATIAL_3D"
        && (placement.z === undefined || !finite(placement.z)))
      || nodeIds.has(placement.nodeId)
    ) {
      throw new Error("EOG_VIEW_PLACEMENT_INVALID");
    }
    nodeIds.add(placement.nodeId);
  }

  for (const [field, ids] of [
    ["hiddenNodeIds", view.hiddenNodeIds],
    ["hiddenEdgeIds", view.hiddenEdgeIds]
  ] as const) {
    if (ids === undefined) continue;
    if (
      view.kind !== "DIAGRAM_2D"
      || !Array.isArray(ids)
      || ids.some(id => !nonEmpty(id))
      || new Set(ids).size !== ids.length
    ) {
      throw new Error(
        field === "hiddenNodeIds"
          ? "EOG_VIEW_HIDDEN_NODES_INVALID"
          : "EOG_VIEW_HIDDEN_EDGES_INVALID"
      );
    }
  }

  if (view.camera !== undefined) {
    if (
      view.kind !== "SPATIAL_3D"
      || !validVector(view.camera.position)
      || !validVector(view.camera.target)
    ) {
      throw new Error("EOG_VIEW_CAMERA_INVALID");
    }
  }
}

function validateSnapshot(
  snapshot: EnterpriseOperatingGraphViewStoreSnapshotV010
): EnterpriseOperatingGraphViewStoreSnapshotV010 {
  if (
    snapshot.contractVersion !== "0.1.0"
    || !Array.isArray(snapshot.views)
  ) {
    throw new Error("EOG_VIEW_STORE_SNAPSHOT_INVALID");
  }
  const ids = new Set<string>();
  for (const view of snapshot.views) {
    if (ids.has(view.viewId)) {
      throw new Error("EOG_VIEW_ID_DUPLICATE");
    }
    ids.add(view.viewId);
    validateEnterpriseOperatingGraphViewStateV010(view);
  }
  return snapshot;
}

function createStore(
  read: () => EnterpriseOperatingGraphViewStoreSnapshotV010,
  write: (snapshot: EnterpriseOperatingGraphViewStoreSnapshotV010) => void
): EnterpriseOperatingGraphViewStoreV010 {
  return {
    create(view) {
      const current = read();
      if (current.views.some(item => item.viewId === view.viewId)) {
        throw new Error("EOG_VIEW_ALREADY_EXISTS");
      }
      validateEnterpriseOperatingGraphViewStateV010(view);
      const next = {
        contractVersion: "0.1.0" as const,
        views: [...current.views, clone(view)]
      };
      write(validateSnapshot(next));
      return clone(view);
    },

    replace(view) {
      const current = read();
      const previous = current.views.find(item => item.viewId === view.viewId);
      if (!previous) throw new Error("EOG_VIEW_NOT_FOUND");
      if (
        previous.graphId !== view.graphId
        || previous.enterpriseId !== view.enterpriseId
        || previous.kind !== view.kind
      ) {
        throw new Error("EOG_VIEW_IDENTITY_IMMUTABLE");
      }
      if (view.revision <= previous.revision) {
        throw new Error("EOG_VIEW_REVISION_NOT_ADVANCED");
      }
      validateEnterpriseOperatingGraphViewStateV010(view);
      const next = {
        contractVersion: "0.1.0" as const,
        views: current.views.map(item =>
          item.viewId === view.viewId ? clone(view) : item
        )
      };
      write(validateSnapshot(next));
      return clone(view);
    },

    get(viewId) {
      const view = read().views.find(item => item.viewId === viewId);
      return view ? clone(view) : undefined;
    },

    listByGraph(input) {
      return read().views
        .filter(view =>
          view.enterpriseId === input.enterpriseId
          && view.graphId === input.graphId
        )
        .sort((a, b) => a.viewId.localeCompare(b.viewId))
        .map(clone);
    },

    snapshot() {
      return clone(read());
    }
  };
}

export function createMemoryEnterpriseOperatingGraphViewStoreV010(
  seed: EnterpriseOperatingGraphViewStoreSnapshotV010 = {
    contractVersion: "0.1.0",
    views: []
  }
): EnterpriseOperatingGraphViewStoreV010 {
  let snapshot = clone(validateSnapshot(seed));
  return createStore(
    () => clone(snapshot),
    value => {
      snapshot = clone(validateSnapshot(value));
    }
  );
}

export function createFileEnterpriseOperatingGraphViewStoreV010(
  path: string
): EnterpriseOperatingGraphViewStoreV010 {
  const read = (): EnterpriseOperatingGraphViewStoreSnapshotV010 => {
    if (!existsSync(path)) {
      return { contractVersion: "0.1.0", views: [] };
    }
    return clone(validateSnapshot(JSON.parse(
      readFileSync(path, "utf8")
    ) as EnterpriseOperatingGraphViewStoreSnapshotV010));
  };

  const write = (snapshot: EnterpriseOperatingGraphViewStoreSnapshotV010): void => {
    const validated = validateSnapshot(snapshot);
    mkdirSync(dirname(path), { recursive: true });
    const temporaryPath = path + ".tmp";
    writeFileSync(
      temporaryPath,
      JSON.stringify(validated, null, 2) + "\n",
      "utf8"
    );
    renameSync(temporaryPath, path);
  };

  return createStore(read, write);
}


export const createMemoryEogViewStateStoreV010 =
  createMemoryEnterpriseOperatingGraphViewStoreV010;
export const createFileEogViewStateStoreV010 =
  createFileEnterpriseOperatingGraphViewStoreV010;
