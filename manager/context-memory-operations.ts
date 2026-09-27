import { existsSync, mkdirSync, readFileSync, appendFileSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import type {
  ActiveContextRefV010,
  ContextMemoryDlpClassifierV010,
  ContextMemoryOperationEventV010,
  ContextMemoryPrivacyClassV010
} from "../contracts/platform-services.js";
import type { ContextMemoryStoreV010 } from "./context-memory-store.js";
import type { ContextMemoryGovernanceStoreV010 } from "./context-memory-governance-store.js";
import type { ContextMemoryRetentionPolicyStoreV010 } from "./context-memory-retention-policy-store.js";
import type { ContextMemoryLegalHoldStoreV010 } from "./context-memory-legal-hold-store.js";

export interface ContextMemoryOperationLogV010 {
  list(): ContextMemoryOperationEventV010[];
  append(event: ContextMemoryOperationEventV010): void;
}

export function createMemoryContextMemoryOperationLogV010(): ContextMemoryOperationLogV010 {
  const events: ContextMemoryOperationEventV010[] = [];
  return {
    list() { return structuredClone(events); },
    append(event) {
      if (events.some(value => value.operationId === event.operationId)) {
        throw new Error("CONTEXT_MEMORY_OPERATION_DUPLICATE");
      }
      events.push(structuredClone(event));
    }
  };
}

export function createJsonlContextMemoryOperationLogV010(
  path: string
): ContextMemoryOperationLogV010 {
  function list(): ContextMemoryOperationEventV010[] {
    if (!existsSync(path)) return [];
    return readFileSync(path, "utf8")
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => JSON.parse(line) as ContextMemoryOperationEventV010);
  }
  return {
    list() {
      return structuredClone(list());
    },
    append(event) {
      if (list().some(value => value.operationId === event.operationId)) {
        throw new Error("CONTEXT_MEMORY_OPERATION_DUPLICATE");
      }
      mkdirSync(dirname(path), { recursive: true });
      appendFileSync(path, JSON.stringify(event) + "\n", "utf8");
    }
  };
}

function sameContext(a: ActiveContextRefV010, b: ActiveContextRefV010): boolean {
  return a.kind === b.kind
    && a.contextId === b.contextId
    && (a.kind !== "ENTERPRISE" || b.kind !== "ENTERPRISE" || a.enterpriseId === b.enterpriseId);
}

export interface ContextMemoryScheduledOperationsDependenciesV010 {
  memoryStore: ContextMemoryStoreV010;
  governanceStore: ContextMemoryGovernanceStoreV010;
  retentionPolicies: ContextMemoryRetentionPolicyStoreV010;
  legalHolds: ContextMemoryLegalHoldStoreV010;
  operationLog: ContextMemoryOperationLogV010;
  dlpClassifier?: ContextMemoryDlpClassifierV010;
  resolveDlpClassifier?: () => ContextMemoryDlpClassifierV010 | undefined;
  now?: () => Date;
  id?: () => string;
}

export function createContextMemoryScheduledOperationsV010(
  dependencies: ContextMemoryScheduledOperationsDependenciesV010
) {
  const now = dependencies.now ?? (() => new Date());
  const id = dependencies.id ?? randomUUID;

  return {
    runRetention(context: ActiveContextRefV010): ContextMemoryOperationEventV010 {
      const started = now();
      let examined = 0, changed = 0, skipped = 0;
      const runId = `memory-operation:retention:${id()}`;
      try {
        for (const item of dependencies.memoryStore.snapshot().items.filter(value => sameContext(value.context, context))) {
          examined++;
          const hold = dependencies.legalHolds.decision(item.memoryId);
          if (hold?.held) { skipped++; continue; }
          const current = dependencies.governanceStore.decision(item.memoryId, started);
          const privacyClass: ContextMemoryPrivacyClassV010 = current?.privacyClass ?? "STANDARD";
          const policyDeadline = dependencies.retentionPolicies.retentionDeadline(item, privacyClass);
          const explicitDeadline = current?.retainUntil;
          const candidates = [policyDeadline, explicitDeadline].filter((value): value is string => Boolean(value));
          if (!candidates.length) { skipped++; continue; }
          const deadline = candidates.sort()[0]!;
          if (Date.parse(deadline) > started.getTime()) { skipped++; continue; }
          if (current?.state === "EXPIRED" && current.effectiveEventId?.startsWith("memory-governance:scheduled-retention:")) {
            skipped++; continue;
          }
          dependencies.governanceStore.append({
            contractVersion: "0.1.0",
            eventId: `memory-governance:scheduled-retention:${id()}`,
            memoryId: item.memoryId,
            context: structuredClone(item.context),
            state: "EXPIRED",
            privacyClass,
            reason: `Scheduled retention evaluation reached ${deadline}`,
            occurredAt: started.toISOString(),
            actorSubjectId: "system:context-memory-scheduler"
          });
          changed++;
        }
        const completed = now();
        const event: ContextMemoryOperationEventV010 = {
          contractVersion: "0.1.0",
          operationId: runId,
          kind: "RETENTION_EVALUATION",
          context: structuredClone(context),
          state: "SUCCEEDED",
          startedAt: started.toISOString(),
          completedAt: completed.toISOString(),
          examined, changed, skipped
        };
        dependencies.operationLog.append(event);
        return event;
      } catch (error) {
        const completed = now();
        const message = error instanceof Error ? error.message : String(error);
        const event: ContextMemoryOperationEventV010 = {
          contractVersion: "0.1.0",
          operationId: runId,
          kind: "RETENTION_EVALUATION",
          context: structuredClone(context),
          state: "FAILED",
          startedAt: started.toISOString(),
          completedAt: completed.toISOString(),
          examined, changed, skipped,
          failureCode: message.split(":")[0] || "CONTEXT_MEMORY_RETENTION_OPERATION_FAILED",
          message
        };
        dependencies.operationLog.append(event);
        return event;
      }
    },

    async runDlp(context: ActiveContextRefV010): Promise<ContextMemoryOperationEventV010> {
      const started = now();
      let examined = 0, changed = 0, skipped = 0;
      const runId = `memory-operation:dlp:${id()}`;
      const classifier = dependencies.resolveDlpClassifier?.() ?? dependencies.dlpClassifier;
      if (!classifier) {
        const event: ContextMemoryOperationEventV010 = {
          contractVersion: "0.1.0",
          operationId: runId,
          kind: "DLP_RECLASSIFICATION",
          context: structuredClone(context),
          state: "FAILED",
          startedAt: started.toISOString(),
          completedAt: now().toISOString(),
          examined, changed, skipped,
          failureCode: "CONTEXT_MEMORY_DLP_PROVIDER_REQUIRED",
          message: "DLP classification is fail-closed when no Provider is bound."
        };
        dependencies.operationLog.append(event);
        return event;
      }
      try {
        for (const item of dependencies.memoryStore.snapshot().items.filter(value => sameContext(value.context, context))) {
          examined++;
          const result = await classifier.classify({
            contractVersion: "0.1.0",
            context: structuredClone(context),
            memoryId: item.memoryId,
            kind: item.kind,
            summary: item.summary
          });
          if (!["STANDARD", "SENSITIVE", "RESTRICTED"].includes(result.privacyClass)) {
            throw new Error("CONTEXT_MEMORY_DLP_RESULT_INVALID");
          }
          const current = dependencies.governanceStore.decision(item.memoryId, started);
          if ((current?.privacyClass ?? "STANDARD") === result.privacyClass) {
            skipped++; continue;
          }
          dependencies.governanceStore.append({
            contractVersion: "0.1.0",
            eventId: `memory-governance:dlp:${id()}`,
            memoryId: item.memoryId,
            context: structuredClone(item.context),
            state: current?.state ?? "ACTIVE",
            privacyClass: result.privacyClass,
            ...(current?.retainUntil ? { retainUntil: current.retainUntil } : {}),
            reason: `DLP classification: ${result.reasonCodes.join(",") || "classified"}`,
            occurredAt: started.toISOString(),
            actorSubjectId: `provider:${classifier.providerId}`
          });
          changed++;
        }
        const event: ContextMemoryOperationEventV010 = {
          contractVersion: "0.1.0",
          operationId: runId,
          kind: "DLP_RECLASSIFICATION",
          context: structuredClone(context),
          state: "SUCCEEDED",
          startedAt: started.toISOString(),
          completedAt: now().toISOString(),
          examined, changed, skipped
        };
        dependencies.operationLog.append(event);
        return event;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const event: ContextMemoryOperationEventV010 = {
          contractVersion: "0.1.0",
          operationId: runId,
          kind: "DLP_RECLASSIFICATION",
          context: structuredClone(context),
          state: "FAILED",
          startedAt: started.toISOString(),
          completedAt: now().toISOString(),
          examined, changed, skipped,
          failureCode: message.split(":")[0] || "CONTEXT_MEMORY_DLP_OPERATION_FAILED",
          message
        };
        dependencies.operationLog.append(event);
        return event;
      }
    }
  };
}
