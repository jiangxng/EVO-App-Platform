import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createPackageCatalog } from "../catalog/catalog.js";
import { createMemoryLifecycleStore } from "./store.js";
import { createAppManagerService } from "./service.js";
import { companyNotesExperienceAssets, companyNotesPackage } from "../catalog/seed.js";

const catalog = createPackageCatalog([companyNotesPackage]);
const store = createMemoryLifecycleStore();
const manager = createAppManagerService(catalog, store, () => new Date(), companyNotesExperienceAssets);

function json(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://localhost");

    if (request.method === "GET" && url.pathname === "/health") {
      return json(response, 200, { ok: true, service: "evo-app-manager" });
    }

    if (request.method === "GET" && url.pathname === "/v1/catalog") {
      return json(response, 200, manager.listCatalog());
    }

    if (request.method === "GET" && url.pathname === "/v1/platform/snapshot") {
      return json(response, 200, manager.getSnapshot());
    }

    if (request.method === "GET" && url.pathname === "/v1/experiences/effective") {
      return json(response, 200, manager.listEffectiveExperiences());
    }

    if (request.method === "GET" && url.pathname === "/v1/experience-pages") {
      const source = url.searchParams.get("source");
      if (!source) return json(response, 400, { code: "SOURCE_REQUIRED" });
      const page = manager.loadExperiencePage(source);
      if (page === undefined) return json(response, 404, { code: "PAGE_NOT_EFFECTIVE_OR_NOT_FOUND" });
      return json(response, 200, page);
    }

    if (request.method === "POST" && url.pathname === "/v1/install/plan") {
      const body = await readJson(request) as { packageId?: string };
      if (!body.packageId) return json(response, 400, { code: "PACKAGE_ID_REQUIRED" });
      return json(response, 200, manager.planInstall(body.packageId));
    }

    if (request.method === "POST" && url.pathname === "/v1/install") {
      const body = await readJson(request) as { packageId?: string };
      if (!body.packageId) return json(response, 400, { code: "PACKAGE_ID_REQUIRED" });
      return json(response, 200, manager.install(body.packageId));
    }

    return json(response, 404, { code: "NOT_FOUND" });
  } catch (error) {
    return json(response, 500, {
      code: "APP_MANAGER_ERROR",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

const port = Number(process.env.PORT ?? 4100);
server.listen(port, () => {
  console.log(`EVO App Manager listening on http://localhost:${port}`);
});
