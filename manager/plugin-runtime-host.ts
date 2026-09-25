import type { PackageManifestV010 } from "../contracts/package.js";

export interface PluginRuntimeStatusV010 {
  packageId: string;
  kind: "DECLARATIVE" | "WORKER" | "REMOTE";
  isolation: "HOST" | "WORKER" | "REMOTE";
  status: "READY" | "INACTIVE" | "UNSUPPORTED";
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

  return {
    packageId: pkg.packageId,
    kind: runtime.kind,
    isolation: runtime.isolation,
    status: "UNSUPPORTED",
    message: "Executable plugin runtimes are fail-closed until the isolated Plugin Runtime Host is implemented."
  };
}

export function assertPluginRuntimeAdmittedV010(pkg: PackageManifestV010): void {
  const status = inspectPluginRuntimeV010(pkg);
  if (status.status !== "READY") {
    throw new Error(`PLUGIN_RUNTIME_NOT_ADMITTED: ${pkg.packageId}: ${status.kind}/${status.isolation}`);
  }
}
