import type { PackageCatalog } from "../catalog/catalog.js";
import type { PackageManifestV010 } from "../contracts/package.js";
import { validatePluginManifestV010 } from "../contracts/plugin-protocol.js";
import type { AppActionHandler } from "../actions/contracts.js";
import type { AppActionRouter } from "../actions/router.js";

/**
 * Trusted Host composition boundary, deliberately not a public HTTP API.
 *
 * A caller MUST first authorize the operator with its real Host policy.
 * No plugin module loader runs until admission succeeds; after loading,
 * authorization is rechecked before any registration is visible.
 *
 * This is catalog/handler AVAILABILITY only. Installation/activation still
 * belongs to AppManager; dispatch still belongs to the original Router.
 * This cannot sign a real provider, browser, or production work identity.
 */
export function createOnDemandHostReadAdmissionV010(input: {
  catalog: PackageCatalog;
  router: AppActionRouter;
  expectedPackageId: string;
  expectedOperationId: string;
  expectedCommandCode: string;
  authorizeHostAdmission(): Promise<boolean> | boolean;
  load(): Promise<{
    manifest: PackageManifestV010;
    handler: AppActionHandler;
  }>;
}) {
  let pending: Promise<void> | undefined;
  async function admit(): Promise<void> {
    // The trusted Host must bind this to authenticated admin/Owner authority.
    // Calling it is NOT installation and does not imply production approval.
    if (await input.authorizeHostAdmission() !== true) {
      throw new Error("ON_DEMAND_HOST_ADMISSION_DENIED");
    }
    if (input.catalog.get(input.expectedPackageId)
        || input.router.hasHandler(input.expectedCommandCode)) {
      throw new Error("ON_DEMAND_HOST_ALREADY_REGISTERED");
    }
    // No import, manifest loading, or business code until authorization.
    const {manifest, handler} = await input.load();
    if (await input.authorizeHostAdmission() !== true) {
      throw new Error("ON_DEMAND_HOST_ADMISSION_REVOKED");
    }
    const validated = validatePluginManifestV010(manifest);
    if (!validated.ok || manifest.packageId !== input.expectedPackageId
        || manifest.runtime?.kind && manifest.runtime.kind !== "DECLARATIVE") {
      throw new Error("ON_DEMAND_HOST_MANIFEST_REJECTED");
    }
    const operations = manifest.features.flatMap(feature =>
      (feature.contributions ?? []).flatMap(contribution =>
        contribution.kind === "platform.capability-operation"
          ? [{featureId:feature.featureId, operation:contribution.operation}]
          : []
      )
    );
    const accepted = operations.filter(x =>
      x.operation.operationId === input.expectedOperationId
      && x.operation.effect === "READ"
      && x.operation.binding.type === "ACTION_HOST"
      && x.operation.binding.commandCode === input.expectedCommandCode
      && x.operation.binding.inputVersion === "0.1.0"
      && x.operation.exposure.includes("HUMAN")
      && x.operation.exposure.includes("PERSONAL_AGENT")
    );
    if (operations.length !== 1 || accepted.length !== 1
        || handler.packageId !== manifest.packageId
        || handler.featureId !== accepted[0].featureId
        || handler.commandCode !== input.expectedCommandCode
        || typeof handler.execute !== "function") {
      throw new Error("ON_DEMAND_HOST_OPERATION_HANDLER_REJECTED");
    }
    // After the final await, these checks and mutations are synchronous.
    // Reject rather than replace an existing package/command.
    if (input.catalog.get(manifest.packageId)
        || input.router.hasHandler(handler.commandCode)) {
      throw new Error("ON_DEMAND_HOST_REGISTRATION_CONFLICT");
    }
    input.catalog.register(manifest);
    input.router.registerHandler(handler);
  }
  return {
    async admit() {
      // Concurrent authorized requests share a single registration attempt.
      // Each caller still must be trusted: the Host never exposes this method
      // to arbitrary Agents or unverified plugin modules.
      if (!pending) {
        pending = admit().finally(() => {pending=undefined;});
      }
      return pending;
    }
  };
}
