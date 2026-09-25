import { randomUUID } from "node:crypto";
import type { PackageManifestV010 } from "../contracts/package.js";
import {
  verifyPackageIntegrityV010,
  type PluginIntegrityTrustStoreV010
} from "./package-integrity.js";
import type { PluginRuntimeEventV010 } from "./plugin-runtime-observability.js";

export interface RemoteRuntimeCredentialProviderV010 {
  getBearerToken(input: {
    packageId: string;
    audience: string;
    endpoint: string;
  }): Promise<string>;
}

export interface RemotePluginRuntimeHostOptionsV010 {
  integrityTrustStore: PluginIntegrityTrustStoreV010;
  credentialProvider: RemoteRuntimeCredentialProviderV010;
  fetchImpl?: typeof fetch;
  defaultInvocationTimeoutMs?: number;
  allowInsecureLoopback?: boolean;
  now?: () => Date;
  onRuntimeEvent?: (
    event: Omit<PluginRuntimeEventV010, "contractVersion" | "sequence">
  ) => void;
}

export interface RemotePluginRuntimeInvocationV010 {
  method: string;
  input: unknown;
}

export interface RemotePluginRuntimeHostV010 {
  invoke(pkg: PackageManifestV010, request: RemotePluginRuntimeInvocationV010): Promise<unknown>;
}

interface RemoteInvocationResponseV010 {
  contractVersion: "0.1.0";
  protocol: "EVO-REMOTE-RUNTIME-v0.1";
  invocationId: string;
  packageId: string;
  ok: boolean;
  result?: unknown;
  error?: {
    code?: string;
    message: string;
  };
}

function endpointAllowed(url: URL, allowInsecureLoopback: boolean): boolean {
  if (url.protocol === "https:") return true;
  if (!allowInsecureLoopback || url.protocol !== "http:") return false;
  return url.hostname === "127.0.0.1" || url.hostname === "localhost" || url.hostname === "::1";
}

function validateRemotePackage(
  pkg: PackageManifestV010,
  trustStore: PluginIntegrityTrustStoreV010,
  allowInsecureLoopback: boolean
): URL {
  const runtime = pkg.runtime;
  if (runtime?.kind !== "REMOTE" || runtime.isolation !== "REMOTE" || !runtime.remote) {
    throw new Error(`PLUGIN_REMOTE_RUNTIME_NOT_DECLARED: ${pkg.packageId}`);
  }
  if (runtime.remote.protocol !== "EVO-REMOTE-RUNTIME-v0.1") {
    throw new Error(`PLUGIN_REMOTE_PROTOCOL_UNSUPPORTED: ${pkg.packageId}`);
  }
  if (runtime.remote.hostAccess !== "NONE") {
    throw new Error(`PLUGIN_REMOTE_HOST_ACCESS_UNSUPPORTED: ${pkg.packageId}`);
  }
  if (runtime.remote.auth.scheme !== "HOST_BEARER" || !runtime.remote.auth.audience.trim()) {
    throw new Error(`PLUGIN_REMOTE_AUTH_INVALID: ${pkg.packageId}`);
  }
  if (pkg.publisher?.trust !== "FIRST_PARTY" && pkg.publisher?.trust !== "VERIFIED") {
    throw new Error(`PLUGIN_REMOTE_PUBLISHER_NOT_ADMITTED: ${pkg.packageId}`);
  }
  if (pkg.storage || (pkg.events?.publish?.length ?? 0) > 0 || (pkg.events?.subscribe?.length ?? 0) > 0) {
    throw new Error(`PLUGIN_REMOTE_HOST_CAPABILITY_UNSUPPORTED: ${pkg.packageId}`);
  }

  const integrity = verifyPackageIntegrityV010(pkg, trustStore);
  if (integrity.state !== "VERIFIED") {
    throw new Error(
      `PLUGIN_REMOTE_INTEGRITY_REQUIRED: ${pkg.packageId}: ${integrity.state}: ${integrity.message}`
    );
  }

  let endpoint: URL;
  try {
    endpoint = new URL(runtime.remote.endpoint);
  } catch {
    throw new Error(`PLUGIN_REMOTE_ENDPOINT_INVALID: ${pkg.packageId}`);
  }
  if (!endpointAllowed(endpoint, allowInsecureLoopback)) {
    throw new Error(`PLUGIN_REMOTE_HTTPS_REQUIRED: ${pkg.packageId}`);
  }
  if (endpoint.username || endpoint.password || endpoint.hash) {
    throw new Error(`PLUGIN_REMOTE_ENDPOINT_INVALID: ${pkg.packageId}`);
  }
  return endpoint;
}

export function createRemotePluginRuntimeHostV010(
  options: RemotePluginRuntimeHostOptionsV010
): RemotePluginRuntimeHostV010 {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? (() => new Date());
  const emit = (
    event: Omit<PluginRuntimeEventV010, "contractVersion" | "sequence" | "occurredAt">
  ): void => {
    options.onRuntimeEvent?.({
      ...event,
      occurredAt: now().toISOString()
    });
  };

  return {
    async invoke(pkg, request) {
      if (!request.method.trim()) throw new Error("PLUGIN_REMOTE_METHOD_REQUIRED");
      const endpoint = validateRemotePackage(
        pkg,
        options.integrityTrustStore,
        options.allowInsecureLoopback === true
      );
      const remote = pkg.runtime!.remote!;
      const invocationId = randomUUID();
      const timeoutMs = pkg.runtime?.limits?.invocationTimeoutMs
        ?? options.defaultInvocationTimeoutMs
        ?? 5000;
      const startedAt = Date.now();

      emit({
        packageId: pkg.packageId,
        type: "INVOCATION_STARTED",
        invocationId,
        method: request.method
      });

      const token = (await options.credentialProvider.getBearerToken({
        packageId: pkg.packageId,
        audience: remote.auth.audience,
        endpoint: endpoint.toString()
      })).trim();
      if (!token) {
        const message = `PLUGIN_REMOTE_CREDENTIAL_EMPTY: ${pkg.packageId}`;
        emit({
          packageId: pkg.packageId,
          type: "INVOCATION_FAILED",
          invocationId,
          method: request.method,
          message
        });
        throw new Error(message);
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetchImpl(endpoint, {
          method: "POST",
          redirect: "error",
          signal: controller.signal,
          headers: {
            "content-type": "application/json",
            "accept": "application/json",
            "authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            contractVersion: "0.1.0",
            protocol: "EVO-REMOTE-RUNTIME-v0.1",
            invocationId,
            packageId: pkg.packageId,
            packageVersion: pkg.version,
            method: request.method,
            input: structuredClone(request.input)
          })
        });

        if (!response.ok) {
          const message = `PLUGIN_REMOTE_HTTP_ERROR: ${pkg.packageId}: ${response.status}`;
          emit({
            packageId: pkg.packageId,
            type: "INVOCATION_FAILED",
            invocationId,
            method: request.method,
            durationMs: Date.now() - startedAt,
            message
          });
          throw new Error(message);
        }

        const body = await response.json() as Partial<RemoteInvocationResponseV010>;
        if (
          body.contractVersion !== "0.1.0"
          || body.protocol !== "EVO-REMOTE-RUNTIME-v0.1"
          || body.invocationId !== invocationId
          || body.packageId !== pkg.packageId
          || typeof body.ok !== "boolean"
        ) {
          const message = `PLUGIN_REMOTE_RESPONSE_INVALID: ${pkg.packageId}`;
          emit({
            packageId: pkg.packageId,
            type: "INVOCATION_FAILED",
            invocationId,
            method: request.method,
            durationMs: Date.now() - startedAt,
            message
          });
          throw new Error(message);
        }

        if (!body.ok) {
          const message = `PLUGIN_REMOTE_INVOCATION_FAILED: ${pkg.packageId}: ${body.error?.message ?? "unknown error"}`;
          emit({
            packageId: pkg.packageId,
            type: "INVOCATION_FAILED",
            invocationId,
            method: request.method,
            durationMs: Date.now() - startedAt,
            message
          });
          throw new Error(message);
        }

        emit({
          packageId: pkg.packageId,
          type: "INVOCATION_SUCCEEDED",
          invocationId,
          method: request.method,
          durationMs: Date.now() - startedAt
        });
        return body.result;
      } catch (error) {
        if (controller.signal.aborted) {
          const message = `PLUGIN_REMOTE_TIMEOUT: ${pkg.packageId}: ${request.method}: ${timeoutMs}ms`;
          emit({
            packageId: pkg.packageId,
            type: "INVOCATION_TIMEOUT",
            invocationId,
            method: request.method,
            durationMs: Date.now() - startedAt,
            message
          });
          throw new Error(message);
        }
        throw error;
      } finally {
        clearTimeout(timer);
      }
    }
  };
}
