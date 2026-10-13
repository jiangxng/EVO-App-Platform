import type { createLazyProviderRuntimeV010 } from "./lazy-provider-runtime.js";
import { providerAuditEventV010, type ProviderBindingAuditStoreV010,
  type ProviderGovernanceDecisionV010 } from "./provider-governance.js";

export const PROVIDER_LIFECYCLE_READ_ACTION = "provider.lifecycle.read";
export const PROVIDER_LIFECYCLE_RETRY_ACTION = "provider.lifecycle.retry-stop";
type Runtime = Pick<ReturnType<typeof createLazyProviderRuntimeV010<unknown>>, "diagnostics" | "stop">;

/** One Host registry for lifecycle-capable runtimes; not a plugin activation API. */
export function createProviderLifecycleAdministrationV010(options: {
  entries: ReadonlyMap<string, Runtime>;
  authorize(token: string | undefined, action: string, resource: { type: string; id?: string }): Promise<ProviderGovernanceDecisionV010>;
  audit: ProviderBindingAuditStoreV010;
}) {
  return {
    async handle(input: { operation: "read" | "retry-stop"; packageId?: string; token?: string }) {
      const retry = input.operation === "retry-stop";
      const decision = await options.authorize(input.token,
        retry ? PROVIDER_LIFECYCLE_RETRY_ACTION : PROVIDER_LIFECYCLE_READ_ACTION,
        { type: "provider-lifecycle", ...(input.packageId ? { id: input.packageId } : {}) });
      const record = (action: "READ_PROVIDER_LIFECYCLE" | "RETRY_PROVIDER_STOP" | "PROVIDER_STOP_RESULT", reason: string) => {
        options.audit.append(providerAuditEventV010({ action,
          outcome: decision.allowed ? "ALLOWED" : "DENIED", actorId: decision.actorId,
          ...(decision.policyProviderId ? { policyProviderId: decision.policyProviderId } : {}),
          ...(input.packageId ? { packageId: input.packageId } : {}), reason }));
      };
      // Authorize before revealing whether a package exists; audit failure blocks mutation.
      record(retry ? "RETRY_PROVIDER_STOP" : "READ_PROVIDER_LIFECYCLE", decision.reason);
      if (!decision.allowed) return { status: 403, body: { ok: false, error: { code: decision.reason } } };
      const runtime = input.packageId ? options.entries.get(input.packageId) : undefined;
      if (input.packageId && !runtime) return { status: 404, body: { ok: false, error: { code: "PROVIDER_LIFECYCLE_NOT_REGISTERED" } } };
      if (!retry) return { status: 200, body: { contractVersion: "0.1.0", runtimes:
        [...options.entries].filter(([id]) => !input.packageId || id === input.packageId)
          .map(([packageId, slot]) => ({ packageId, ...slot.diagnostics() })) } };
      if (!runtime) return { status: 400, body: { ok: false, error: { code: "PACKAGE_ID_REQUIRED" } } };
      if (!runtime.diagnostics().blocked) return { status: 409, body: { ok: false, error: { code: "PROVIDER_STOP_NOT_PENDING" } } };
      let code: string;
      let status: number;
      try {
        await runtime.stop();
        code = "PROVIDER_STOPPED"; status = 200;
      } catch (error) {
        code = error instanceof Error && error.message === "PROVIDER_STOP_TIMEOUT"
          ? "PROVIDER_STOP_TIMEOUT" : "PROVIDER_STOP_FAILED";
        status = code === "PROVIDER_STOP_TIMEOUT" ? 504 : 500;
      }
      record("PROVIDER_STOP_RESULT", code);
      return { status, body: { ok: status === 200, code, packageId: input.packageId, ...runtime.diagnostics() } };
    }
  };
}
