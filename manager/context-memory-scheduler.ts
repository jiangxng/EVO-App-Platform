import {
  closeSync,
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
  acquisitionId?: string;
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
  // TTL is diagnostic only: elapsed time cannot fence an in-flight writer.
  let acquisitionId: string | undefined;
  return {
    acquire(now) {
      if (acquisitionId) return false;
      const record: FileLeaseRecordV010 = {
        contractVersion: "0.1.0",
        holderId,
        acquisitionId: randomUUID(),
        acquiredAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + ttlMs).toISOString()
      };
      mkdirSync(dirname(path), { recursive: true });
      let fd: number;
      try {
        fd = openSync(path, "wx");
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        // Never unlink a competing claim, including a partial or legacy record.
        let current: FileLeaseRecordV010;
        try {
          current = JSON.parse(readFileSync(path, "utf8")) as FileLeaseRecordV010;
          if (current?.contractVersion !== "0.1.0" || !current.holderId
            || !Number.isFinite(Date.parse(current.expiresAt))) throw new Error("invalid record");
        } catch {
          throw new Error("CONTEXT_MEMORY_SCHEDULER_LEASE_UNREADABLE");
        }
        if (Date.parse(current.expiresAt) <= now.getTime()) {
          throw new Error("CONTEXT_MEMORY_SCHEDULER_LEASE_OVERDUE");
        }
        return false;
      }
      try {
        writeFileSync(fd, JSON.stringify(record, null, 2) + "\n", "utf8");
        acquisitionId = record.acquisitionId;
        return true;
      } finally {
        // A failed write keeps the claim for quiescent recovery, never auto-steals it.
        closeSync(fd);
      }
    },
    release() {
      if (!acquisitionId) return;
      try {
        const current = JSON.parse(readFileSync(path, "utf8")) as FileLeaseRecordV010;
        if (current.holderId === holderId && current.acquisitionId === acquisitionId) unlinkSync(path);
      } catch {
        // Fail closed. Abandoned/corrupt claims require quiescent recovery.
      } finally {
        acquisitionId = undefined;
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
  canRunSourceIntake?: () => boolean;
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
  let stopped = false;
  let pending: Promise<{ acquired: boolean; governanceRuns: number; intakeRuns: number }> | undefined;

  async function tick(): Promise<{
      acquired: boolean;
      governanceRuns: number;
      intakeRuns: number;
    }> {
      if (running || stopped) {
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
          if (stopped) break;
          dependencies.operations.runRetention(context);
          await dependencies.operations.runDlp(context);
          governanceRuns++;
        }

        if (!stopped && dependencies.runSourceIntake) {
          for (const context of uniqueContexts(dependencies.listIntakeContexts?.() ?? [])) {
            if (stopped || dependencies.canRunSourceIntake?.() === false) break;
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
  return {
    tick() {
      if (stopped || pending) {
        return Promise.resolve({ acquired: false, governanceRuns: 0, intakeRuns: 0 });
      }
      pending = tick().finally(() => { pending = undefined; });
      return pending;
    },
    /** Stop admission, drain the current operation, and keep its lease until it settles. */
    async stop(timeoutMs = 5000): Promise<void> {
      if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
        throw new Error("CONTEXT_MEMORY_SCHEDULER_STOP_TIMEOUT_INVALID");
      }
      stopped = true;
      const active = pending;
      if (!active) return;
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          active,
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error("CONTEXT_MEMORY_SCHEDULER_STOP_TIMEOUT")), timeoutMs);
          })
        ]);
      } finally {
        if (timer) clearTimeout(timer);
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

/** Event-driven timer admission; no idle polling timer is used to discover work. */
export function createContextMemoryScheduleDriverV010(options: {
  intervalMs: number;
  hasWork(): boolean;
  tick(): Promise<unknown>;
  onError(error: unknown): void;
}) {
  if (!Number.isFinite(options.intervalMs) || options.intervalMs < 0
    || (options.intervalMs > 0 && options.intervalMs < 60_000)) {
    throw new Error("CONTEXT_MEMORY_SCHEDULE_INTERVAL_INVALID");
  }
  let timer: ReturnType<typeof setInterval> | undefined;
  let disposed = false;
  const clear = () => {
    if (timer) clearInterval(timer);
    timer = undefined;
  };
  const refresh = () => {
    try {
      if (disposed || options.intervalMs === 0 || !options.hasWork()) {
        clear();
        return;
      }
      if (!timer) {
        timer = setInterval(() => {
          refresh();
          if (!timer) return;
          void options.tick().catch(options.onError);
        }, options.intervalMs);
        timer.unref();
      }
    } catch (error) {
      clear();
      options.onError(error);
    }
  };
  return {
    refresh,
    dispose() { disposed = true; clear(); },
    isScheduled() { return timer !== undefined; }
  };
}
