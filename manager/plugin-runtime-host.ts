import { fork, type ChildProcess } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type {
  InstalledPackageV010,
  PackageManifestV010
} from "../contracts/package.js";
import {
  createScopedPluginHostContextV010,
  type PluginEventBusV010,
  type PluginHostContextV010,
  type PluginStorageServiceV010
} from "./plugin-host-services.js";
import {
  verifyPackageIntegrityV010,
  type PluginIntegrityTrustStoreV010
} from "./package-integrity.js";
import type { PluginRuntimeEventV010 } from "./plugin-runtime-observability.js";

export interface PluginRuntimeStatusV010 {
  packageId: string;
  kind: "DECLARATIVE" | "WORKER" | "PROCESS" | "REMOTE";
  isolation: "HOST" | "WORKER" | "PROCESS" | "REMOTE";
  status: "READY" | "INACTIVE" | "UNSUPPORTED" | "ERROR";
  message: string;
}

export function inspectPluginRuntimeV010(pkg: PackageManifestV010): PluginRuntimeStatusV010 {
  const runtime = pkg.runtime ?? { kind: "DECLARATIVE" as const, isolation: "HOST" as const };

  if (runtime.kind === "DECLARATIVE" && runtime.isolation === "HOST") {
    return {
      packageId: pkg.packageId,
      kind: runtime.kind,
      isolation: runtime.isolation,
      status: "READY",
      message: "Declarative package executes only through admitted host contracts."
    };
  }

  if (runtime.kind === "PROCESS" && runtime.isolation === "PROCESS") {
    if (!pkg.integrity || pkg.integrity.artifact?.scope !== "PROCESS_ENTRYPOINT") {
      return {
        packageId: pkg.packageId,
        kind: runtime.kind,
        isolation: runtime.isolation,
        status: "ERROR",
        message: "Process runtime requires a signed PROCESS_ENTRYPOINT artifact digest."
      };
    }
    if (!runtime.entrypoint?.trim()) {
      return {
        packageId: pkg.packageId,
        kind: runtime.kind,
        isolation: runtime.isolation,
        status: "ERROR",
        message: "Process runtime requires a resolvable entrypoint."
      };
    }
    if (pkg.publisher?.trust !== "FIRST_PARTY" && pkg.publisher?.trust !== "VERIFIED") {
      return {
        packageId: pkg.packageId,
        kind: runtime.kind,
        isolation: runtime.isolation,
        status: "UNSUPPORTED",
        message: "Local process execution is admitted only for FIRST_PARTY or VERIFIED publishers."
      };
    }
    return {
      packageId: pkg.packageId,
      kind: runtime.kind,
      isolation: runtime.isolation,
      status: "READY",
      message: "Verified executable package is admitted to the supervised process runtime."
    };
  }

  if (runtime.kind === "WORKER") {
    return {
      packageId: pkg.packageId,
      kind: runtime.kind,
      isolation: runtime.isolation,
      status: "UNSUPPORTED",
      message: "Worker threads are not treated as a security sandbox; WORKER execution remains disabled."
    };
  }

  return {
    packageId: pkg.packageId,
    kind: runtime.kind,
    isolation: runtime.isolation,
    status: "UNSUPPORTED",
    message: "Remote executable runtime is fail-closed until a governed remote runtime adapter is implemented."
  };
}

export function assertPluginRuntimeAdmittedV010(pkg: PackageManifestV010): void {
  const status = inspectPluginRuntimeV010(pkg);
  if (status.status !== "READY") {
    throw new Error(`PLUGIN_RUNTIME_NOT_ADMITTED: ${pkg.packageId}: ${status.kind}/${status.isolation}: ${status.message}`);
  }
}

export interface ProcessPluginRuntimeInvocationV010 {
  method: string;
  input: unknown;
}

export interface ProcessPluginRuntimeHostOptionsV010 {
  storageService: PluginStorageServiceV010;
  eventBus: PluginEventBusV010;
  integrityTrustStore: PluginIntegrityTrustStoreV010;
  resolveEntrypoint?: (pkg: PackageManifestV010) => string;
  defaultInvocationTimeoutMs?: number;
  defaultMemoryMb?: number;
  now?: () => Date;
  onRuntimeEvent?: (
    event: Omit<PluginRuntimeEventV010, "contractVersion" | "sequence">
  ) => void;
}

export interface ProcessPluginRuntimeHostV010 {
  start(pkg: PackageManifestV010, installed: InstalledPackageV010): Promise<PluginRuntimeStatusV010>;
  invoke(
    pkg: PackageManifestV010,
    installed: InstalledPackageV010,
    request: ProcessPluginRuntimeInvocationV010
  ): Promise<unknown>;
  stop(packageId: string): Promise<void>;
  status(packageId: string): PluginRuntimeStatusV010 | undefined;
  shutdown(): Promise<void>;
}

interface RuntimeRecord {
  pkg: PackageManifestV010;
  child: ChildProcess;
  context: PluginHostContextV010;
  status: PluginRuntimeStatusV010;
  ready: Promise<void>;
  resolveReady: () => void;
  rejectReady: (error: Error) => void;
  readySettled: boolean;
  pending: Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >;
  eventSubscriptions: Map<string, () => void>;
}

function defaultEntrypointResolver(pkg: PackageManifestV010): string {
  const entrypoint = pkg.runtime?.entrypoint?.trim();
  if (!entrypoint) throw new Error(`PLUGIN_RUNTIME_ENTRYPOINT_REQUIRED: ${pkg.packageId}`);
  const raw = entrypoint.startsWith("file://")
    ? fileURLToPath(entrypoint)
    : isAbsolute(entrypoint)
      ? entrypoint
      : resolve(process.cwd(), entrypoint);
  return realpathSync(raw);
}

function minimalChildEnv(): NodeJS.ProcessEnv {
  const allowed = ["PATH", "SystemRoot", "WINDIR", "TMPDIR", "TEMP", "TMP"] as const;
  const env: NodeJS.ProcessEnv = {};
  for (const key of allowed) {
    const value = process.env[key];
    if (value !== undefined) env[key] = value;
  }
  return env;
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function createProcessPluginRuntimeHostV010(
  options: ProcessPluginRuntimeHostOptionsV010
): ProcessPluginRuntimeHostV010 {
  const runtimes = new Map<string, RuntimeRecord>();
  const childEntrypoint = fileURLToPath(
    new URL("./plugin-runtime-process-child.js", import.meta.url)
  );
  const resolveEntrypoint = options.resolveEntrypoint ?? defaultEntrypointResolver;
  const now = options.now ?? (() => new Date());
  const emit = (
    event: Omit<PluginRuntimeEventV010, "contractVersion" | "sequence" | "occurredAt">
  ): void => {
    options.onRuntimeEvent?.({
      ...event,
      occurredAt: now().toISOString()
    });
  };

  async function handleHostCall(
    record: RuntimeRecord,
    message: {
      callId: string;
      service: "permissions" | "storage" | "events";
      operation: string;
      args: unknown[];
    }
  ): Promise<void> {
    try {
      let result: unknown;
      const [first, second] = message.args;

      if (message.service === "permissions") {
        if (message.operation === "has") {
          result = record.context.permissions.has(String(first ?? ""));
        } else if (message.operation === "granted") {
          result = record.context.permissions.granted();
        } else {
          throw new Error(`PLUGIN_HOST_OPERATION_UNSUPPORTED: permissions.${message.operation}`);
        }
      } else if (message.service === "storage") {
        const storage = record.context.storage;
        if (!storage) throw new Error("PLUGIN_STORAGE_NOT_DECLARED");
        if (message.operation === "get") result = storage.get(String(first ?? ""));
        else if (message.operation === "set") {
          storage.set(String(first ?? ""), second);
          result = null;
        } else if (message.operation === "delete") {
          storage.delete(String(first ?? ""));
          result = null;
        } else if (message.operation === "list") result = storage.list();
        else throw new Error(`PLUGIN_HOST_OPERATION_UNSUPPORTED: storage.${message.operation}`);
      } else if (message.service === "events") {
        const topic = String(first ?? "");
        if (message.operation === "publish") {
          result = record.context.events.publish(topic, second);
        } else if (message.operation === "subscribe") {
          if (!record.eventSubscriptions.has(topic)) {
            const unsubscribe = record.context.events.subscribe(topic, event => {
              if (record.child.connected) {
                record.child.send({ type: "host-event", topic, event });
              }
            });
            record.eventSubscriptions.set(topic, unsubscribe);
          }
          result = null;
        } else if (message.operation === "unsubscribe") {
          record.eventSubscriptions.get(topic)?.();
          record.eventSubscriptions.delete(topic);
          result = null;
        } else {
          throw new Error(`PLUGIN_HOST_OPERATION_UNSUPPORTED: events.${message.operation}`);
        }
      } else {
        throw new Error("PLUGIN_HOST_SERVICE_UNSUPPORTED");
      }

      if (record.child.connected) {
        record.child.send({
          type: "host-result",
          callId: message.callId,
          ok: true,
          result
        });
      }
    } catch (error) {
      if (record.child.connected) {
        record.child.send({
          type: "host-result",
          callId: message.callId,
          ok: false,
          error: asError(error).message
        });
      }
    }
  }

  function cleanupRecord(record: RuntimeRecord, error: Error): void {
    for (const pending of record.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    record.pending.clear();
    for (const unsubscribe of record.eventSubscriptions.values()) unsubscribe();
    record.eventSubscriptions.clear();
    runtimes.delete(record.pkg.packageId);
  }

  async function start(
    pkg: PackageManifestV010,
    installed: InstalledPackageV010
  ): Promise<PluginRuntimeStatusV010> {
    const existing = runtimes.get(pkg.packageId);
    if (existing) {
      await existing.ready;
      return structuredClone(existing.status);
    }

    const admission = inspectPluginRuntimeV010(pkg);
    if (
      admission.kind !== "PROCESS"
      || admission.isolation !== "PROCESS"
      || admission.status !== "READY"
    ) {
      throw new Error(
        `PLUGIN_PROCESS_RUNTIME_NOT_ADMITTED: ${pkg.packageId}: ${admission.message}`
      );
    }

    const entrypoint = resolveEntrypoint(pkg);
    const integrity = verifyPackageIntegrityV010(
      pkg,
      options.integrityTrustStore,
      readFileSync(entrypoint)
    );
    if (integrity.state !== "VERIFIED") {
      throw new Error(
        `PLUGIN_PROCESS_INTEGRITY_REQUIRED: ${pkg.packageId}: ${integrity.state}: ${integrity.message}`
      );
    }

    emit({
      packageId: pkg.packageId,
      type: "PROCESS_STARTING",
      message: "Starting verified plugin process."
    });

    const pluginDir = dirname(entrypoint);
    const bootstrapDir = dirname(childEntrypoint);
    const memoryMb = pkg.runtime?.limits?.memoryMb ?? options.defaultMemoryMb ?? 64;

    const context = createScopedPluginHostContextV010(
      pkg,
      installed,
      options.storageService,
      options.eventBus
    );

    let resolveReady!: () => void;
    let rejectReady!: (error: Error) => void;
    const ready = new Promise<void>((resolvePromise, rejectPromise) => {
      resolveReady = resolvePromise;
      rejectReady = rejectPromise;
    });

    const child = fork(childEntrypoint, [], {
      cwd: pluginDir,
      env: minimalChildEnv(),
      execArgv: [
        "--permission",
        `--allow-fs-read=${bootstrapDir}`,
        `--allow-fs-read=${pluginDir}`,
        `--max-old-space-size=${memoryMb}`
      ],
      stdio: ["ignore", "ignore", "ignore", "ipc"],
      serialization: "advanced"
    });

    const record: RuntimeRecord = {
      pkg: structuredClone(pkg),
      child,
      context,
      status: {
        packageId: pkg.packageId,
        kind: "PROCESS",
        isolation: "PROCESS",
        status: "INACTIVE",
        message: "Process runtime is starting."
      },
      ready,
      resolveReady,
      rejectReady,
      readySettled: false,
      pending: new Map(),
      eventSubscriptions: new Map()
    };
    runtimes.set(pkg.packageId, record);

    child.on("message", raw => {
      const message = raw as {
        type?: string;
        invocationId?: string;
        callId?: string;
        service?: "permissions" | "storage" | "events";
        operation?: string;
        args?: unknown[];
        ok?: boolean;
        result?: unknown;
        error?: string;
      };

      if (message.type === "ready") {
        record.status = {
          packageId: pkg.packageId,
          kind: "PROCESS",
          isolation: "PROCESS",
          status: "READY",
          message: "Supervised plugin process is ready."
        };
        emit({
          packageId: pkg.packageId,
          type: "PROCESS_READY",
          message: "Supervised plugin process is ready."
        });
        if (!record.readySettled) {
          record.readySettled = true;
          record.resolveReady();
        }
        return;
      }

      if (message.type === "fatal") {
        const error = new Error(
          `PLUGIN_PROCESS_FATAL: ${pkg.packageId}: ${message.error ?? "unknown error"}`
        );
        record.status = {
          packageId: pkg.packageId,
          kind: "PROCESS",
          isolation: "PROCESS",
          status: "ERROR",
          message: error.message
        };
        emit({
          packageId: pkg.packageId,
          type: "PROCESS_FATAL",
          message: error.message
        });
        if (!record.readySettled) {
          record.readySettled = true;
          record.rejectReady(error);
        }
        void stop(pkg.packageId);
        return;
      }

      if (message.type === "result" && message.invocationId) {
        const pending = record.pending.get(message.invocationId);
        if (!pending) return;
        record.pending.delete(message.invocationId);
        clearTimeout(pending.timer);
        if (message.ok) {
          emit({
            packageId: pkg.packageId,
            type: "INVOCATION_SUCCEEDED",
            invocationId: message.invocationId
          });
          pending.resolve(message.result);
        } else {
          const failure = `PLUGIN_PROCESS_INVOCATION_FAILED: ${pkg.packageId}: ${message.error ?? "unknown error"}`;
          emit({
            packageId: pkg.packageId,
            type: "INVOCATION_FAILED",
            invocationId: message.invocationId,
            message: failure
          });
          pending.reject(new Error(failure));
        }
        return;
      }

      if (
        message.type === "host-call"
        && message.callId
        && message.service
        && message.operation
        && Array.isArray(message.args)
      ) {
        void handleHostCall(record, {
          callId: message.callId,
          service: message.service,
          operation: message.operation,
          args: message.args
        });
      }
    });

    child.once("error", error => {
      const wrapped = new Error(
        `PLUGIN_PROCESS_ERROR: ${pkg.packageId}: ${error.message}`
      );
      record.status = {
        packageId: pkg.packageId,
        kind: "PROCESS",
        isolation: "PROCESS",
        status: "ERROR",
        message: wrapped.message
      };
      emit({
        packageId: pkg.packageId,
        type: "PROCESS_ERROR",
        message: wrapped.message
      });
      if (!record.readySettled) {
        record.readySettled = true;
        record.rejectReady(wrapped);
      }
      cleanupRecord(record, wrapped);
    });

    child.once("exit", (code, signal) => {
      const error = new Error(
        `PLUGIN_PROCESS_EXITED: ${pkg.packageId}: code=${code ?? "null"} signal=${signal ?? "null"}`
      );
      if (runtimes.get(pkg.packageId) === record) {
        emit({
          packageId: pkg.packageId,
          type: "PROCESS_EXITED",
          message: error.message
        });
      }
      if (!record.readySettled) {
        record.readySettled = true;
        record.rejectReady(error);
      }
      if (runtimes.get(pkg.packageId) === record) cleanupRecord(record, error);
    });

    child.send({
      type: "init",
      packageId: pkg.packageId,
      entrypoint
    });

    await ready;
    return structuredClone(record.status);
  }

  async function invoke(
    pkg: PackageManifestV010,
    installed: InstalledPackageV010,
    request: ProcessPluginRuntimeInvocationV010
  ): Promise<unknown> {
    if (!request.method.trim()) throw new Error("PLUGIN_PROCESS_METHOD_REQUIRED");
    await start(pkg, installed);
    const record = runtimes.get(pkg.packageId);
    if (!record || record.status.status !== "READY") {
      throw new Error(`PLUGIN_PROCESS_NOT_READY: ${pkg.packageId}`);
    }

    const invocationId = randomUUID();
    const startedAt = Date.now();
    emit({
      packageId: pkg.packageId,
      type: "INVOCATION_STARTED",
      invocationId,
      method: request.method
    });
    const timeoutMs = pkg.runtime?.limits?.invocationTimeoutMs
      ?? options.defaultInvocationTimeoutMs
      ?? 5000;

    return await new Promise((resolvePromise, rejectPromise) => {
      const timer = setTimeout(() => {
        record.pending.delete(invocationId);
        if (runtimes.get(pkg.packageId) === record) {
          runtimes.delete(pkg.packageId);
        }
        const timeoutMessage = `PLUGIN_PROCESS_TIMEOUT: ${pkg.packageId}: ${request.method}: ${timeoutMs}ms`;
        emit({
          packageId: pkg.packageId,
          type: "INVOCATION_TIMEOUT",
          invocationId,
          method: request.method,
          durationMs: Date.now() - startedAt,
          message: timeoutMessage
        });
        rejectPromise(new Error(timeoutMessage));
        record.child.kill("SIGKILL");
      }, timeoutMs);

      record.pending.set(invocationId, {
        resolve: resolvePromise,
        reject: rejectPromise,
        timer
      });

      record.child.send({
        type: "invoke",
        invocationId,
        method: request.method,
        input: structuredClone(request.input)
      });
    });
  }

  async function stop(packageId: string): Promise<void> {
    const record = runtimes.get(packageId);
    if (!record) return;
    runtimes.delete(packageId);

    const stopped = new Promise<void>(resolvePromise => {
      if (record.child.exitCode !== null || record.child.signalCode !== null) {
        resolvePromise();
        return;
      }
      record.child.once("exit", () => resolvePromise());
    });

    if (record.child.connected) {
      record.child.send({ type: "shutdown" });
    }

    const killTimer = setTimeout(() => {
      if (record.child.exitCode === null && record.child.signalCode === null) {
        record.child.kill("SIGKILL");
      }
    }, 750);

    await stopped;
    clearTimeout(killTimer);
    emit({
      packageId,
      type: "PROCESS_STOPPED",
      message: "Plugin process stopped by Host lifecycle."
    });
    cleanupRecord(
      record,
      new Error(`PLUGIN_PROCESS_STOPPED: ${packageId}`)
    );
  }

  return {
    start,
    invoke,
    stop,
    status(packageId) {
      const value = runtimes.get(packageId)?.status;
      return value ? structuredClone(value) : undefined;
    },
    async shutdown() {
      await Promise.all([...runtimes.keys()].map(packageId => stop(packageId)));
    }
  };
}
