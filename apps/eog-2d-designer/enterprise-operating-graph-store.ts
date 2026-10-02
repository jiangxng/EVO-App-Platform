import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import type {
  EnterpriseOperatingGraphV010
} from "../../contracts/enterprise-operating-graph.js";
import {
  validateEnterpriseOperatingGraphV010
} from "./enterprise-operating-graph-model.js";

export interface EnterpriseOperatingGraphStoreSnapshotV010 {
  contractVersion: "0.1.0";
  graphs: EnterpriseOperatingGraphV010[];
}

export interface EnterpriseOperatingGraphStoreV010 {
  create(graph: EnterpriseOperatingGraphV010): EnterpriseOperatingGraphV010;
  replace(graph: EnterpriseOperatingGraphV010): EnterpriseOperatingGraphV010;
  get(graphId: string): EnterpriseOperatingGraphV010 | undefined;
  listByEnterprise(enterpriseId: string): EnterpriseOperatingGraphV010[];
  snapshot(): EnterpriseOperatingGraphStoreSnapshotV010;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function validateSnapshot(
  snapshot: EnterpriseOperatingGraphStoreSnapshotV010
): EnterpriseOperatingGraphStoreSnapshotV010 {
  if (
    snapshot.contractVersion !== "0.1.0"
    || !Array.isArray(snapshot.graphs)
  ) {
    throw new Error("EOG_STORE_SNAPSHOT_INVALID");
  }

  const graphIds = new Set<string>();
  for (const graph of snapshot.graphs) {
    if (graphIds.has(graph.graphId)) {
      throw new Error("EOG_STORE_GRAPH_ID_DUPLICATE");
    }
    graphIds.add(graph.graphId);
    const validation = validateEnterpriseOperatingGraphV010(graph);
    if (validation.issues.length > 0) {
      throw new Error(
        "EOG_STORE_GRAPH_INVALID:"
        + validation.issues.map(issue => issue.code).join(",")
      );
    }
  }
  return snapshot;
}

function createStore(
  read: () => EnterpriseOperatingGraphStoreSnapshotV010,
  write: (snapshot: EnterpriseOperatingGraphStoreSnapshotV010) => void
): EnterpriseOperatingGraphStoreV010 {
  return {
    create(graph) {
      const current = read();
      if (current.graphs.some(item => item.graphId === graph.graphId)) {
        throw new Error("EOG_GRAPH_ALREADY_EXISTS");
      }
      if (validateEnterpriseOperatingGraphV010(graph).issues.length > 0) {
        throw new Error("EOG_GRAPH_INVALID");
      }
      const next = {
        contractVersion: "0.1.0" as const,
        graphs: [...current.graphs, clone(graph)]
      };
      write(validateSnapshot(next));
      return clone(graph);
    },

    replace(graph) {
      const current = read();
      const previous = current.graphs.find(item => item.graphId === graph.graphId);
      if (!previous) throw new Error("EOG_GRAPH_NOT_FOUND");
      if (previous.enterpriseId !== graph.enterpriseId) {
        throw new Error("EOG_ENTERPRISE_ID_IMMUTABLE");
      }
      if (graph.revision <= previous.revision) {
        throw new Error("EOG_STORE_REVISION_NOT_ADVANCED");
      }
      if (validateEnterpriseOperatingGraphV010(graph).issues.length > 0) {
        throw new Error("EOG_GRAPH_INVALID");
      }
      const next = {
        contractVersion: "0.1.0" as const,
        graphs: current.graphs.map(item =>
          item.graphId === graph.graphId ? clone(graph) : item
        )
      };
      write(validateSnapshot(next));
      return clone(graph);
    },

    get(graphId) {
      const graph = read().graphs.find(item => item.graphId === graphId);
      return graph ? clone(graph) : undefined;
    },

    listByEnterprise(enterpriseId) {
      return read().graphs
        .filter(graph => graph.enterpriseId === enterpriseId)
        .sort((a, b) =>
          b.updatedAt.localeCompare(a.updatedAt)
          || a.graphId.localeCompare(b.graphId)
        )
        .map(clone);
    },

    snapshot() {
      return clone(read());
    }
  };
}

export function createMemoryEnterpriseOperatingGraphStoreV010(
  seed: EnterpriseOperatingGraphStoreSnapshotV010 = {
    contractVersion: "0.1.0",
    graphs: []
  }
): EnterpriseOperatingGraphStoreV010 {
  let snapshot = clone(validateSnapshot(seed));
  return createStore(
    () => clone(snapshot),
    value => {
      snapshot = clone(validateSnapshot(value));
    }
  );
}

export function createFileEnterpriseOperatingGraphStoreV010(
  path: string
): EnterpriseOperatingGraphStoreV010 {
  const read = (): EnterpriseOperatingGraphStoreSnapshotV010 => {
    if (!existsSync(path)) {
      return { contractVersion: "0.1.0", graphs: [] };
    }
    const raw = JSON.parse(
      readFileSync(path, "utf8")
    ) as EnterpriseOperatingGraphStoreSnapshotV010;
    return clone(validateSnapshot(raw));
  };

  const write = (
    snapshot: EnterpriseOperatingGraphStoreSnapshotV010
  ): void => {
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
