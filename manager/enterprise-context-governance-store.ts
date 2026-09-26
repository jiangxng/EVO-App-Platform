import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import type {
  EnterpriseContextGrantV010,
  EnterpriseContextRelationshipV010,
  EnterpriseContextV010
} from "../contracts/platform-services.js";

export interface EnterpriseContextLifecycleEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  contextId: string;
  from?: "CREATING" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  to: "CREATING" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  occurredAt: string;
  actorSubjectId: string;
}

export interface EnterpriseContextGovernanceSnapshotV010 {
  contractVersion: "0.1.0";
  contexts: EnterpriseContextV010[];
  relationships: EnterpriseContextRelationshipV010[];
  grants: EnterpriseContextGrantV010[];
  lifecycleEvents: EnterpriseContextLifecycleEventV010[];
}

export interface EnterpriseContextGovernanceStoreV010 {
  snapshot(): EnterpriseContextGovernanceSnapshotV010;
  save(snapshot: EnterpriseContextGovernanceSnapshotV010): void;
}

function empty(): EnterpriseContextGovernanceSnapshotV010 {
  return {
    contractVersion: "0.1.0",
    contexts: [],
    relationships: [],
    grants: [],
    lifecycleEvents: []
  };
}

function clone(
  value: EnterpriseContextGovernanceSnapshotV010
): EnterpriseContextGovernanceSnapshotV010 {
  return structuredClone(value);
}

function validate(
  value: EnterpriseContextGovernanceSnapshotV010
): EnterpriseContextGovernanceSnapshotV010 {
  if (
    value.contractVersion !== "0.1.0"
    || !Array.isArray(value.contexts)
    || !Array.isArray(value.relationships)
    || !Array.isArray(value.grants)
    || !Array.isArray(value.lifecycleEvents)
  ) {
    throw new Error("ENTERPRISE_GOVERNANCE_STATE_INVALID");
  }
  return clone(value);
}

export function createMemoryEnterpriseContextGovernanceStoreV010(
  seed: EnterpriseContextGovernanceSnapshotV010 = empty()
): EnterpriseContextGovernanceStoreV010 {
  let current = validate(seed);
  return {
    snapshot() {
      return clone(current);
    },
    save(next) {
      current = validate(next);
    }
  };
}

export function createFileEnterpriseContextGovernanceStoreV010(
  path: string
): EnterpriseContextGovernanceStoreV010 {
  const load = (): EnterpriseContextGovernanceSnapshotV010 => {
    if (!existsSync(path)) return empty();
    return validate(
      JSON.parse(readFileSync(path, "utf8")) as EnterpriseContextGovernanceSnapshotV010
    );
  };

  return {
    snapshot: load,
    save(next) {
      const valid = validate(next);
      mkdirSync(dirname(path), { recursive: true });
      const temporary = `${path}.tmp`;
      writeFileSync(temporary, JSON.stringify(valid, null, 2) + "\n", "utf8");
      renameSync(temporary, path);
    }
  };
}
