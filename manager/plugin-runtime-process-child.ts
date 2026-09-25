import { pathToFileURL } from "node:url";

interface HostCallMessage {
  type: "host-call";
  callId: string;
  service: "permissions" | "storage" | "events";
  operation: string;
  args: unknown[];
}

type ParentMessage =
  | { type: "init"; entrypoint: string; packageId: string }
  | { type: "invoke"; invocationId: string; method: string; input: unknown }
  | { type: "host-result"; callId: string; ok: boolean; result?: unknown; error?: string }
  | { type: "host-event"; topic: string; event: unknown }
  | { type: "shutdown" };

interface RuntimeModuleV010 {
  activate?: (host: ProcessPluginHostV010) => unknown | Promise<unknown>;
  invoke: (
    request: { method: string; input: unknown },
    host: ProcessPluginHostV010
  ) => unknown | Promise<unknown>;
  deactivate?: (host: ProcessPluginHostV010) => unknown | Promise<unknown>;
}

interface ProcessPluginHostV010 {
  contractVersion: "0.1.0";
  packageId: string;
  permissions: {
    has(permissionId: string): Promise<boolean>;
    granted(): Promise<string[]>;
  };
  storage: {
    get(key: string): Promise<unknown>;
    set(key: string, value: unknown): Promise<void>;
    delete(key: string): Promise<void>;
    list(): Promise<Record<string, unknown>>;
  };
  events: {
    publish(topic: string, payload: unknown): Promise<unknown>;
    subscribe(topic: string, handler: (event: unknown) => void): Promise<() => Promise<void>>;
  };
}

let runtimeModule: RuntimeModuleV010 | undefined;
let packageId = "";
let nextCallId = 1;
const pendingHostCalls = new Map<
  string,
  { resolve: (value: unknown) => void; reject: (error: Error) => void }
>();
const eventHandlers = new Map<string, Set<(event: unknown) => void>>();

function send(message: unknown): void {
  if (typeof process.send !== "function") {
    throw new Error("PLUGIN_RUNTIME_IPC_UNAVAILABLE");
  }
  process.send(message);
}

function hostCall(
  service: HostCallMessage["service"],
  operation: string,
  args: unknown[]
): Promise<unknown> {
  const callId = `host-${nextCallId++}`;
  return new Promise((resolve, reject) => {
    pendingHostCalls.set(callId, { resolve, reject });
    send({ type: "host-call", callId, service, operation, args } satisfies HostCallMessage);
  });
}

function createHost(): ProcessPluginHostV010 {
  return {
    contractVersion: "0.1.0",
    packageId,
    permissions: {
      async has(permissionId) {
        return Boolean(await hostCall("permissions", "has", [permissionId]));
      },
      async granted() {
        return await hostCall("permissions", "granted", []) as string[];
      }
    },
    storage: {
      async get(key) {
        return await hostCall("storage", "get", [key]);
      },
      async set(key, value) {
        await hostCall("storage", "set", [key, value]);
      },
      async delete(key) {
        await hostCall("storage", "delete", [key]);
      },
      async list() {
        return await hostCall("storage", "list", []) as Record<string, unknown>;
      }
    },
    events: {
      async publish(topic, payload) {
        return await hostCall("events", "publish", [topic, payload]);
      },
      async subscribe(topic, handler) {
        let handlers = eventHandlers.get(topic);
        const needsHostSubscription = handlers === undefined;
        if (!handlers) {
          handlers = new Set();
          eventHandlers.set(topic, handlers);
        }
        handlers.add(handler);
        if (needsHostSubscription) {
          await hostCall("events", "subscribe", [topic]);
        }
        return async () => {
          const current = eventHandlers.get(topic);
          current?.delete(handler);
          if (current && current.size === 0) {
            eventHandlers.delete(topic);
            await hostCall("events", "unsubscribe", [topic]);
          }
        };
      }
    }
  };
}

const host = createHost();

process.on("message", message => {
  void (async () => {
    const input = message as ParentMessage;

    if (input.type === "host-result") {
      const pending = pendingHostCalls.get(input.callId);
      if (!pending) return;
      pendingHostCalls.delete(input.callId);
      if (input.ok) pending.resolve(input.result);
      else pending.reject(new Error(input.error ?? "PLUGIN_HOST_CALL_FAILED"));
      return;
    }

    if (input.type === "host-event") {
      for (const handler of eventHandlers.get(input.topic) ?? []) {
        try {
          handler(input.event);
        } catch {
          // A plugin event handler cannot crash the transport loop.
        }
      }
      return;
    }

    if (input.type === "init") {
      packageId = input.packageId;
      try {
        const imported = await import(pathToFileURL(input.entrypoint).href);
        if (typeof imported.invoke !== "function") {
          throw new Error("PLUGIN_RUNTIME_EXPORT_INVOKE_REQUIRED");
        }
        runtimeModule = imported as RuntimeModuleV010;
        await runtimeModule.activate?.(host);
        send({ type: "ready", packageId });
      } catch (error) {
        send({
          type: "fatal",
          error: error instanceof Error ? error.message : String(error)
        });
      }
      return;
    }

    if (input.type === "invoke") {
      if (!runtimeModule) {
        send({
          type: "result",
          invocationId: input.invocationId,
          ok: false,
          error: "PLUGIN_RUNTIME_NOT_READY"
        });
        return;
      }
      try {
        const result = await runtimeModule.invoke(
          { method: input.method, input: input.input },
          host
        );
        send({ type: "result", invocationId: input.invocationId, ok: true, result });
      } catch (error) {
        send({
          type: "result",
          invocationId: input.invocationId,
          ok: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      return;
    }

    if (input.type === "shutdown") {
      try {
        await runtimeModule?.deactivate?.(host);
      } finally {
        process.exit(0);
      }
    }
  })().catch(error => {
    send({
      type: "fatal",
      error: error instanceof Error ? error.message : String(error)
    });
  });
});
