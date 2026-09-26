import type {
  InstallPlanV010,
  PackageManifestV010,
  PlatformSnapshotV010
} from "../../contracts/package.js";
import type {
  AgentToolCatalogV010,
  AgentToolObservation
} from "./contracts.js";

export interface LegacyAppManagerHttpToolsV010 {
  listCatalog(): Promise<PackageManifestV010[]>;
  planInstall(packageId: string): Promise<InstallPlanV010>;
  install(packageId: string): Promise<PlatformSnapshotV010>;
}

export interface AppManagerHttpClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

function base(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

async function json<T>(response: Response): Promise<T> {
  const body = await response.json() as T;
  if (!response.ok) throw new Error(JSON.stringify(body));
  return body;
}

export function createAppManagerHttpTools(
  options: AppManagerHttpClientOptions
): LegacyAppManagerHttpToolsV010 {
  const baseUrl = base(options.baseUrl);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("ENTERPRISE_AGENT_FETCH_UNAVAILABLE");

  async function post<T>(path: string, body: unknown): Promise<T> {
    return json<T>(await fetchImpl(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify(body)
    }));
  }

  return {
    async listCatalog(): Promise<PackageManifestV010[]> {
      return json<PackageManifestV010[]>(await fetchImpl(`${baseUrl}/v1/catalog`, {
        headers: { accept: "application/json" }
      }));
    },

    planInstall(packageId): Promise<InstallPlanV010> {
      return post("/v1/install/plan", { packageId });
    },

    install(packageId): Promise<PlatformSnapshotV010> {
      return post("/v1/install", { packageId });
    }
  };
}


/**
 * Legacy standalone Agent-server Host adapter.
 *
 * Production uses App Platform's full Host tool catalog. This adapter exposes
 * only the three App Manager HTTP lifecycle tools available from the historical
 * standalone HTTP boundary.
 */
export function createAppManagerHttpToolCatalogV010(
  options: AppManagerHttpClientOptions
): AgentToolCatalogV010 {
  const client = createAppManagerHttpTools(options);
  const descriptors = [{
    contractVersion: "0.1.0" as const,
    id: "app.catalog.list",
    modelName: "app_catalog_list",
    title: "Package catalog",
    description: "List Packages available from App Manager.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    },
    effect: "READ" as const,
    ownerPackageId: "evo-app-platform"
  }, {
    contractVersion: "0.1.0" as const,
    id: "app.install.plan",
    modelName: "app_install_plan",
    title: "Plan Package installation",
    description: "Run a side-effect-free App Manager installation preflight.",
    inputSchema: {
      type: "object",
      properties: {
        packageId: { type: "string" }
      },
      required: ["packageId"],
      additionalProperties: false
    },
    effect: "PLAN" as const,
    ownerPackageId: "evo-app-platform"
  }, {
    contractVersion: "0.1.0" as const,
    id: "app.install.execute",
    modelName: "app_install_execute",
    title: "Install Package",
    description: "Install a Package after a successful plan in the same Agent run.",
    inputSchema: {
      type: "object",
      properties: {
        packageId: { type: "string" }
      },
      required: ["packageId"],
      additionalProperties: false
    },
    effect: "WRITE" as const,
    ownerPackageId: "evo-app-platform"
  }];

  const packageId = (args: Record<string, unknown>): string => {
    const value = args.packageId;
    if (typeof value !== "string" || !value.trim()) {
      throw new Error("PACKAGE_ID_REQUIRED");
    }
    return value.trim();
  };

  const planned = (
    observations: readonly AgentToolObservation[],
    target: string
  ): boolean => [...observations].reverse().some(observation => {
    if (observation.tool !== "app.install.plan" || !observation.ok) return false;
    const plan = observation.result as {
      packageId?: unknown;
      blockers?: unknown;
      sideEffectFree?: unknown;
    } | undefined;
    return plan?.packageId === target
      && plan.sideEffectFree === true
      && Array.isArray(plan.blockers)
      && plan.blockers.length === 0;
  });

  return {
    list() {
      return structuredClone(descriptors);
    },
    async invoke(call, observations) {
      try {
        if (call.tool === "app.catalog.list") {
          return { tool: call.tool, ok: true, result: await client.listCatalog() };
        }
        if (call.tool === "app.install.plan") {
          return {
            tool: call.tool,
            ok: true,
            result: await client.planInstall(packageId(call.arguments))
          };
        }
        if (call.tool === "app.install.execute") {
          const target = packageId(call.arguments);
          if (!planned(observations, target)) {
            return {
              tool: call.tool,
              ok: false,
              error: {
                code: "INSTALL_PLAN_REQUIRED",
                message: "A successful install plan is required before installation."
              }
            };
          }
          return {
            tool: call.tool,
            ok: true,
            result: await client.install(target)
          };
        }
        return {
          tool: call.tool,
          ok: false,
          error: {
            code: "AGENT_TOOL_UNAVAILABLE",
            message: `Tool '${call.tool}' is not available from the standalone App Manager adapter.`
          }
        };
      } catch (error) {
        return {
          tool: call.tool,
          ok: false,
          error: {
            code: "TOOL_EXECUTION_FAILED",
            message: error instanceof Error ? error.message : String(error)
          }
        };
      }
    }
  };
}
