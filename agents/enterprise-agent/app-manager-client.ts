import type {
  InstallPlanV010,
  PackageManifestV010,
  PlatformSnapshotV010
} from "../../contracts/package.js";

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
