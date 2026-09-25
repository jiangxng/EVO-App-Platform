import type { PackageCatalog } from "../catalog/catalog.js";
import type { LifecycleStore } from "./store.js";
import type { PluginIntegrityTrustStoreV010 } from "./package-integrity.js";
import type {
  ProcessPluginRuntimeHostV010,
  PluginRuntimeStatusV010
} from "./plugin-runtime-host.js";
import {
  createRemotePluginRuntimeHostV010,
  type RemoteRuntimeCredentialProviderV010
} from "./plugin-runtime-remote.js";
import type { PluginRuntimeEventV010 } from "./plugin-runtime-observability.js";

export interface PluginRuntimeInvocationV010 {
  packageId: string;
  method: string;
  input: unknown;
}

export interface PluginRuntimeDispatcherOptionsV010 {
  catalog: PackageCatalog;
  store: LifecycleStore;
  processHost: ProcessPluginRuntimeHostV010;
  integrityTrustStore: PluginIntegrityTrustStoreV010;
  resolveRemoteCredentialProvider?: (
    packageId: string
  ) => RemoteRuntimeCredentialProviderV010 | undefined;
  fetchImpl?: typeof fetch;
  allowInsecureRemoteLoopback?: boolean;
  onRuntimeEvent?: (
    event: Omit<PluginRuntimeEventV010, "contractVersion" | "sequence">
  ) => void;
}

export interface PluginRuntimeDispatcherV010 {
  invoke(request: PluginRuntimeInvocationV010): Promise<unknown>;
  status(packageId: string): PluginRuntimeStatusV010 | undefined;
  stop(packageId: string): Promise<void>;
}

function activeForPackage(store: LifecycleStore, packageId: string): boolean {
  return store.snapshot().activeFeatures.some(feature => feature.packageId === packageId);
}

export function createPluginRuntimeDispatcherV010(
  options: PluginRuntimeDispatcherOptionsV010
): PluginRuntimeDispatcherV010 {
  return {
    async invoke(request) {
      const packageId = request.packageId.trim();
      const method = request.method.trim();
      if (!packageId) throw new Error("PLUGIN_RUNTIME_PACKAGE_REQUIRED");
      if (!method) throw new Error("PLUGIN_RUNTIME_METHOD_REQUIRED");

      const pkg = options.catalog.get(packageId);
      if (!pkg) throw new Error(`PLUGIN_RUNTIME_PACKAGE_NOT_FOUND: ${packageId}`);

      const installed = options.store.getInstalledPackage(packageId);
      if (!installed) {
        throw new Error(`PLUGIN_RUNTIME_PACKAGE_NOT_INSTALLED: ${packageId}`);
      }
      if (!activeForPackage(options.store, packageId)) {
        throw new Error(`PLUGIN_RUNTIME_PACKAGE_NOT_ACTIVE: ${packageId}`);
      }

      const runtime = pkg.runtime ?? {
        kind: "DECLARATIVE" as const,
        isolation: "HOST" as const
      };

      if (runtime.kind === "PROCESS" && runtime.isolation === "PROCESS") {
        return await options.processHost.invoke(pkg, installed, {
          method,
          input: request.input
        });
      }

      if (runtime.kind === "REMOTE" && runtime.isolation === "REMOTE") {
        const credentialProvider = options.resolveRemoteCredentialProvider?.(packageId);
        if (!credentialProvider) {
          throw new Error(
            `PLUGIN_REMOTE_CREDENTIAL_PROVIDER_UNAVAILABLE: ${packageId}`
          );
        }
        const remoteHost = createRemotePluginRuntimeHostV010({
          integrityTrustStore: options.integrityTrustStore,
          credentialProvider,
          ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
          allowInsecureLoopback: options.allowInsecureRemoteLoopback === true,
          onRuntimeEvent: options.onRuntimeEvent
        });
        return await remoteHost.invoke(pkg, {
          method,
          input: request.input
        });
      }

      if (runtime.kind === "WORKER") {
        throw new Error(
          `PLUGIN_WORKER_RUNTIME_DISABLED: ${packageId}: worker threads are not a security boundary`
        );
      }

      throw new Error(
        `PLUGIN_RUNTIME_NOT_EXECUTABLE: ${packageId}: ${runtime.kind}/${runtime.isolation}`
      );
    },

    status(packageId) {
      return options.processHost.status(packageId);
    },

    async stop(packageId) {
      await options.processHost.stop(packageId);
    }
  };
}
