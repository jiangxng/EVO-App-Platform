import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import type {
  ActiveContextRefV010,
  ContextMemoryOperationEventV010
} from "../contracts/platform-services.js";
import type { ContextMemoryOperationLogV010 } from "./context-memory-operations.js";

export interface ContextMemorySchedulerLeaseV010 {
  acquire(now: Date): boolean;
  release(): void;
}

export function createMemoryContextMemorySchedulerLeaseV010(): ContextMemorySchedulerLeaseV010 {
  let held = false;
  return {
    acquire() {
      if (held) return false;
      held = true;
      return true;
    },
    release() {
      held = false;
    }
  };
}

interface FileLeaseRecordV010 {
  contractVersion: "0.1.0";
  holderId: string;
  acquiredAt: string;
  expiresAt: string;
}

export function createFileContextMemorySchedulerLeaseV010(
  path: string,
  holderId: string,
  ttlMs: number
): ContextMemorySchedulerLeaseV010 {
  if (!holderId.trim()) throw new Error("CONTEXT_MEMORY_SCHEDULER_HOLDER_REQUIRED");
  if (!Number.isFinite(ttlMs) || ttlMs < 1_000) {
    throw new Error("CONTEXT_MEMORY_SCHEDULER_LEASE_TTL_INVALID");
  }
  let owned = false;

  function expired(now: Date): boolean {
    if (!existsSync(path)) return true;
    try {
      const value = JSON.parse(readFileSync(path, "utf8")) as FileLeaseRecordV010;
      return value.contractVersion !== "0.1.0"
        || !Number.isFinite(Date.parse(value.expiresAt))
        || Date.parse(value.expiresAt) <= now.getTime();
    } catch {
      return true;
    }
  }

  return {
    acquire(now) {
      mkdirSync(dirname(path), { recursive: true });
      if (existsSync(path) && expired(now)) {
        try { unlinkSync(path); } catch { /* another process may own cleanup */ }
      }
      try {
        const fd = openSync(path, "wx");
        const record: FileLeaseRecordV010 = {
          contractVersion: "0.1.0",
          holderId,
          acquiredAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + ttlMs).toISOString()
        };
        writeFileSync(fd, JSON.stringify(record, null, 2) + "\n", "utf8");
        closeSync(fd);
        owned = true;
        return true;
      } catch {
        owned = false;
        return false;
      }
    },
    release() {
      if (!owned) return;
      try {
        const current = JSON.parse(readFileSync(path, "utf8")) as FileLeaseRecordV010;
        if (current.holderId === holderId) unlinkSync(path);
      } catch {
        // Lease release is best-effort; TTL prevents permanent lockout.
      } finally {
        owned = false;
      }
    }
  };
}

export interface ContextMemoryScheduledOperationRunnerV010 {
  runRetention(context: ActiveContextRefV010): ContextMemoryOperationEventV010;
  runDlp(context: ActiveContextRefV010): Promise<ContextMemoryOperationEventV010>;
}

export interface ContextMemorySchedulerDependenciesV010 {
  operations: ContextMemoryScheduledOperationRunnerV010;
  operationLog: ContextMemoryOperationLogV010;
  listGovernanceContexts(): ActiveContextRefV010[];
  listIntakeContexts?(): ActiveContextRefV010[];
  runSourceIntake?: (context: ActiveContextRefV010) => Promise<{
    examined: number;
    changed: number;
    skipped: number;
  }>;
  lease: ContextMemorySchedulerLeaseV010;
  now?: () => Date;
  id?: () => string;
}

function contextKey(value: ActiveContextRefV010): string {
  return value.kind === "ENTERPRISE"
    ? `ENTERPRISE:${value.enterpriseId}:${value.contextId}`
    : `PERSONAL:${value.contextId}`;
}

function uniqueContexts(values: ActiveContextRefV010[]): ActiveContextRefV010[] {
  const seen = new Set<string>();
  const result: ActiveContextRefV010[] = [];
  for (const value of values) {
    const key = contextKey(value);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(structuredClone(value));
  }
  return result.sort((a, b) => contextKey(a).localeCompare(contextKey(b)));
}

export function createContextMemorySchedulerV010(
  dependencies: ContextMemorySchedulerDependenciesV010
) {
  const now = dependencies.now ?? (() => new Date());
  const id = dependencies.id ?? randomUUID;
  let running = false;

  return {
    async tick(): Promise<{
      acquired: boolean;
      governanceRuns: number;
      intakeRuns: number;
    }> {
      if (running) {
        return { acquired: false, governanceRuns: 0, intakeRuns: 0 };
      }
      const acquiredAt = now();
      if (!dependencies.lease.acquire(acquiredAt)) {
        return { acquired: false, governanceRuns: 0, intakeRuns: 0 };
      }
      running = true;
      let governanceRuns = 0;
      let intakeRuns = 0;
      try {
        for (const context of uniqueContexts(dependencies.listGovernanceContexts())) {
          dependencies.operations.runRetention(context);
          await dependencies.operations.runDlp(context);
          governanceRuns++;
        }

        if (dependencies.runSourceIntake) {
          for (const context of uniqueContexts(dependencies.listIntakeContexts?.() ?? [])) {
            const started = now();
            const operationId = `memory-operation:intake:${id()}`;
            try {
              const result = await dependencies.runSourceIntake(context);
              dependencies.operationLog.append({
                contractVersion: "0.1.0",
                operationId,
                kind: "SOURCE_INTAKE",
                context: structuredClone(context),
                state: "SUCCEEDED",
                startedAt: started.toISOString(),
                completedAt: now().toISOString(),
                examined: result.examined,
                changed: result.changed,
                skipped: result.skipped
              });
              intakeRuns++;
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              dependencies.operationLog.append({
                contractVersion: "0.1.0",
                operationId,
                kind: "SOURCE_INTAKE",
                context: structuredClone(context),
                state: "FAILED",
                startedAt: started.toISOString(),
                completedAt: now().toISOString(),
                examined: 0,
                changed: 0,
                skipped: 0,
                failureCode: message.split(":")[0] || "CONTEXT_MEMORY_INTAKE_OPERATION_FAILED",
                message
              });
            }
          }
        }
        return { acquired: true, governanceRuns, intakeRuns };
      } finally {
        running = false;
        dependencies.lease.release();
      }
    }
  };
}

export function parseContextMemoryScheduleContextsV010(
  raw: string | undefined
): ActiveContextRefV010[] {
  if (!raw?.trim()) return [];
  const value = JSON.parse(raw) as unknown;
  if (!Array.isArray(value)) {
    throw new Error("CONTEXT_MEMORY_SCHEDULE_CONTEXTS_INVALID");
  }
  return value.map((candidate, index) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      throw new Error(`CONTEXT_MEMORY_SCHEDULE_CONTEXT_INVALID: ${index}`);
    }
    const item = candidate as Record<string, unknown>;
    if (
      item.contractVersion !== "0.1.0"
      || !["PERSONAL", "ENTERPRISE"].includes(String(item.kind))
      || typeof item.contextId !== "string"
      || !item.contextId.trim()
    ) {
      throw new Error(`CONTEXT_MEMORY_SCHEDULE_CONTEXT_INVALID: ${index}`);
    }
    if (item.kind === "ENTERPRISE") {
      if (typeof item.enterpriseId !== "string" || !item.enterpriseId.trim()) {
        throw new Error(`CONTEXT_MEMORY_SCHEDULE_CONTEXT_INVALID: ${index}`);
      }
      return {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: item.contextId.trim(),
        enterpriseId: item.enterpriseId.trim()
      };
    }
    return {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: item.contextId.trim()
    };
  });
}
