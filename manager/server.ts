import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createPackageCatalog } from "../catalog/catalog.js";
import { createMemoryLifecycleStore } from "./store.js";
import { createAppManagerService } from "./service.js";
import { createAppActionRouter } from "../actions/router.js";
import type { AppActionRequestV010 } from "../actions/contracts.js";
import { createTradingLiteEvoActionHandler } from "../apps/trading-lite/action-handler.js";
import { createLedgerRuntimeConfiguratorService } from "../apps/ledger-runtime-configurator/service.js";
import { createLedgerRuntimeConfiguratorActionHandler } from "../apps/ledger-runtime-configurator/action-handler.js";
import { bookkeepingReferenceLegacyPostingRules } from "../apps/ledger-runtime-configurator/default-library.js";
import type { LedgerRuntimeSourceConfigurationV010, LedgerRuntimeTemplateV010 } from "../apps/ledger-runtime-configurator/contracts.js";
import {
  companyNotesPackage,
  evoFoundationPackage,
  ledgerRuntimeConfiguratorPackage,
  referenceExperienceAssets,
  tradingLitePackage
} from "../catalog/seed.js";

const catalog = createPackageCatalog([companyNotesPackage, evoFoundationPackage, ledgerRuntimeConfiguratorPackage, tradingLitePackage]);
const store = createMemoryLifecycleStore();
const manager = createAppManagerService(catalog, store, () => new Date(), referenceExperienceAssets);
const ledgerConfigurator = createLedgerRuntimeConfiguratorService();
const evoBaseUrl = process.env.EVO_BASE_URL?.trim() || "http://localhost:3000";
const evoEnterpriseCode = process.env.EVO_ENTERPRISE_CODE?.trim() || "EVO_DEMO";
const evoActorType = (process.env.EVO_ACTOR_TYPE?.trim() || "HUMAN") as "HUMAN" | "AI" | "AUTOMATION";
const evoActorId = process.env.EVO_ACTOR_ID?.trim() || "demo-user";
const actionRouter = createAppActionRouter(
  [
    createLedgerRuntimeConfiguratorActionHandler(ledgerConfigurator),
    createTradingLiteEvoActionHandler({
      baseUrl: evoBaseUrl,
      enterpriseCode: evoEnterpriseCode,
      actor: { type: evoActorType, id: evoActorId }
    })
  ],
  featureId => manager.getSnapshot().activeFeatures.some(
    feature => feature.featureId === featureId
  )
);

const corsOrigin = process.env.CORS_ORIGIN ?? "*";

function applyCors(response: ServerResponse): void {
  response.setHeader("access-control-allow-origin", corsOrigin);
  response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type,accept");
}

function json(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  applyCors(response);
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

    if (request.method === "OPTIONS") {
      response.statusCode = 204;
      applyCors(response);
      return response.end();
    }

    if (request.method === "GET" && url.pathname === "/health") return json(response, 200, { ok: true, service: "evo-app-manager" });
    if (request.method === "GET" && url.pathname === "/v1/catalog") return json(response, 200, manager.listCatalog());
    if (request.method === "GET" && url.pathname === "/v1/platform/snapshot") return json(response, 200, manager.getSnapshot());
    if (request.method === "GET" && url.pathname === "/v1/experiences/effective") return json(response, 200, manager.listEffectiveExperiences());

    if (request.method === "GET" && url.pathname === "/v1/experience-pages") {
      const source = url.searchParams.get("source");
      if (!source) return json(response, 400, { code: "SOURCE_REQUIRED" });
      const page = manager.loadExperiencePage(source);
      if (page === undefined) return json(response, 404, { code: "PAGE_NOT_EFFECTIVE_OR_NOT_FOUND" });
      return json(response, 200, page);
    }


    if (request.method === "GET" && url.pathname === "/v1/ledger-runtime-configurator/summary") {
      return json(response, 200, ledgerConfigurator.getSummary());
    }

    if (request.method === "GET" && url.pathname === "/v1/ledger-runtime-configurator/configuration") {
      return json(response, 200, ledgerConfigurator.getCurrent());
    }


    if (request.method === "GET" && url.pathname === "/v1/ledger-runtime-configurator/template") {
      return json(response, 200, ledgerConfigurator.exportTemplate());
    }

    if (request.method === "POST" && url.pathname === "/v1/ledger-runtime-configurator/template/import") {
      const body = await readJson(request) as LedgerRuntimeTemplateV010;
      const result = ledgerConfigurator.importTemplate(body);
      return json(response, result.ok ? 200 : 422, result);
    }

    if (request.method === "GET" && url.pathname === "/v1/ledger-runtime-configurator/reference-rule-sets") {
      return json(response, 200, {
        ruleSets: [
          {
            id: "bookkeeping-legacy-posting-rules",
            displayName: "Bookkeeping 记账规则.sql reference rule set",
            status: "REFERENCE",
            rules: bookkeepingReferenceLegacyPostingRules
          }
        ]
      });
    }

    if (request.method === "POST" && url.pathname === "/v1/ledger-runtime-configurator/validate") {
      const body = await readJson(request);
      const input = (
        body !== null
        && typeof body === "object"
        && (body as { kind?: unknown }).kind === "evo.ledger-runtime.source-configuration"
      )
        ? body as LedgerRuntimeSourceConfigurationV010
        : undefined;
      return json(response, 200, ledgerConfigurator.validate(input));
    }

    if (request.method === "POST" && url.pathname === "/v1/ledger-runtime-configurator/import") {
      const body = await readJson(request) as LedgerRuntimeSourceConfigurationV010;
      const result = ledgerConfigurator.importConfiguration(body);
      return json(response, result.ok ? 200 : 422, result);
    }

    if (request.method === "POST" && url.pathname === "/v1/ledger-runtime-configurator/reset-default") {
      return json(response, 200, ledgerConfigurator.resetToBookkeepingDefault());
    }

    if (request.method === "POST" && url.pathname === "/v1/ledger-runtime-configurator/burn") {
      const validation = ledgerConfigurator.validate();
      if (!validation.burn.ready) {
        return json(response, 409, {
          ok: false,
          code: "LEDGER_RUNTIME_BURN_BLOCKED",
          validation
        });
      }
      return json(response, 501, {
        ok: false,
        code: "LEDGER_RUNTIME_BURN_ADAPTER_NOT_CONNECTED",
        message: "The runtime burn transport is intentionally not connected until the executable template contract is implemented."
      });
    }

    if (request.method === "POST" && url.pathname === "/v1/actions") {
      const body = await readJson(request) as Partial<AppActionRequestV010>;
      if (
        body.contractVersion !== "0.1.0" ||
        body.type !== "command" ||
        typeof body.command?.code !== "string" ||
        typeof body.command?.inputVersion !== "string" ||
        body.values === null ||
        typeof body.values !== "object" ||
        Array.isArray(body.values) ||
        typeof body.sourceInteractionId !== "string" ||
        typeof body.actionId !== "string"
      ) {
        return json(response, 400, { ok: false, error: { code: "ACTION_REQUEST_INVALID", message: "Invalid ActionRequest." } });
      }
      return json(response, 200, await actionRouter.execute(body as AppActionRequestV010));
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
    return json(response, 500, { code: "APP_MANAGER_ERROR", message: error instanceof Error ? error.message : String(error) });
  }
});

const port = Number(process.env.PORT ?? 4100);
server.listen(port, () => console.log(`EVO App Manager listening on http://localhost:${port}`));
