import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import type { ActiveContextRefV010 } from "../contracts/platform-services.js";

export interface ContextMemoryScheduleCursorV010 {
  contractVersion: "0.1.0";
  sourceId: string;
  context: ActiveContextRefV010;
  cursor?: string;
  updatedAt: string;
}

export interface ContextMemoryScheduleStateSnapshotV010 {
  contractVersion: "0.1.0";
  cursors: ContextMemoryScheduleCursorV010[];
}

export interface ContextMemoryScheduleStateStoreV010 {
  snapshot(): ContextMemoryScheduleStateSnapshotV010;
  get(sourceId: string, context: ActiveContextRefV010): ContextMemoryScheduleCursorV010 | undefined;
  set(value: ContextMemoryScheduleCursorV010): void;
}

function sameContext(a: ActiveContextRefV010, b: ActiveContextRefV010): boolean {
  return a.kind === b.kind
    && a.contextId === b.contextId
    && (a.kind !== "ENTERPRISE" || b.kind !== "ENTERPRISE" || a.enterpriseId === b.enterpriseId);
}

function validate(
  snapshot: ContextMemoryScheduleStateSnapshotV010
): ContextMemoryScheduleStateSnapshotV010 {
  if (snapshot.contractVersion !== "0.1.0" || !Array.isArray(snapshot.cursors)) {
    throw new Error("CONTEXT_MEMORY_SCHEDULE_STATE_INVALID");
  }
  const keys = new Set<string>();
  for (const value of snapshot.cursors) {
    if (
      value.contractVersion !== "0.1.0"
      || !value.sourceId?.trim()
      || !value.context?.contextId?.trim()
      || !Number.isFinite(Date.parse(value.updatedAt))
      || (value.cursor !== undefined && !value.cursor.trim())
    ) {
      throw new Error("CONTEXT_MEMORY_SCHEDULE_CURSOR_INVALID");
    }
    const key = value.context.kind === "ENTERPRISE"
      ? `${value.sourceId}:ENTERPRISE:${value.context.enterpriseId}:${value.context.contextId}`
      : `${value.sourceId}:PERSONAL:${value.context.contextId}`;
    if (keys.has(key)) throw new Error("CONTEXT_MEMORY_SCHEDULE_CURSOR_DUPLICATE");
    keys.add(key);
  }
  return structuredClone(snapshot);
}

function createStore(
  load: () => ContextMemoryScheduleStateSnapshotV010,
  persist: (snapshot: ContextMemoryScheduleStateSnapshotV010) => void
): ContextMemoryScheduleStateStoreV010 {
  return {
    snapshot() {
      return structuredClone(load());
    },
    get(sourceId, context) {
      const found = load().cursors.find(value =>
        value.sourceId === sourceId && sameContext(value.context, context)
      );
      return found ? structuredClone(found) : undefined;
    },
    set(value) {
      const current = load();
      const next = current.cursors.filter(item =>
        !(item.sourceId === value.sourceId && sameContext(item.context, value.context))
      );
      next.push(structuredClone(value));
      persist(validate({
        contractVersion: "0.1.0",
        cursors: next
      }));
    }
  };
}

export function createMemoryContextMemoryScheduleStateStoreV010(
  seed: ContextMemoryScheduleStateSnapshotV010 = {
    contractVersion: "0.1.0",
    cursors: []
  }
): ContextMemoryScheduleStateStoreV010 {
  let current = validate(seed);
  return createStore(
    () => current,
    next => { current = structuredClone(next); }
  );
}

export function createFileContextMemoryScheduleStateStoreV010(
  path: string
): ContextMemoryScheduleStateStoreV010 {
  const load = () => {
    if (!existsSync(path)) {
      return { contractVersion: "0.1.0", cursors: [] } as ContextMemoryScheduleStateSnapshotV010;
    }
    return validate(
      JSON.parse(readFileSync(path, "utf8")) as ContextMemoryScheduleStateSnapshotV010
    );
  };
  return createStore(load, next => {
    mkdirSync(dirname(path), { recursive: true });
    const temporary = path + ".tmp";
    writeFileSync(temporary, JSON.stringify(next, null, 2) + "\n", "utf8");
    renameSync(temporary, path);
  });
}
