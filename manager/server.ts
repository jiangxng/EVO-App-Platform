import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { createPackageCatalog } from "../catalog/catalog.js";
import { createFileLifecycleStore, createMemoryLifecycleStore } from "./store.js";
import { createAppManagerService } from "./service.js";
import { createAppActionRouter } from "../actions/router.js";
import type { AppActionRequestV010 } from "../actions/contracts.js";
import { createTradingLiteEvoActionHandler } from "../apps/trading-lite/action-handler.js";
import { createEnterpriseAgentStatusActionHandler } from "../agents/enterprise-agent/status-action-handler.js";
import { createLedgerRuntimeConfiguratorService } from "../apps/ledger-runtime-configurator/service.js";
import { createLedgerRuntimeConfiguratorActionHandler } from "../apps/ledger-runtime-configurator/action-handler.js";
import { bookkeepingReferenceLegacyPostingRules } from "../apps/ledger-runtime-configurator/default-library.js";
import type { LedgerRuntimeSourceConfigurationV010, LedgerRuntimeTemplateV010 } from "../apps/ledger-runtime-configurator/contracts.js";
import { appHostShellHtml } from "./app-host-shell.js";
import {
  createPluginStorePage,
  pluginStoreExperienceManifest,
  pluginStorePageSource
} from "./plugin-store-page.js";
import {
  companyNotesPackage,
  enterpriseAgentPackage,
  evoFoundationPackage,
  evoLocalizationPackage,
  ledgerRuntimeConfiguratorPackage,
  referenceExperienceAssets,
  tradingLitePackage
} from "../catalog/seed.js";

const catalog = createPackageCatalog([
  companyNotesPackage,
  enterpriseAgentPackage,
  evoFoundationPackage,
  evoLocalizationPackage,
  ledgerRuntimeConfiguratorPackage,
  tradingLitePackage
]);
const lifecycleStateFile = process.env.APP_PLATFORM_STATE_FILE?.trim();
const store = lifecycleStateFile ? createFileLifecycleStore(lifecycleStateFile) : createMemoryLifecycleStore();
const manager = createAppManagerService(catalog, store, () => new Date(), referenceExperienceAssets);
const ledgerConfigurator = createLedgerRuntimeConfiguratorService();
const evoBaseUrl = process.env.EVO_BASE_URL?.trim() || "http://localhost:3000";
const evoEnterpriseCode = process.env.EVO_ENTERPRISE_CODE?.trim() || "EVO_DEMO";
const evoActorType = (process.env.EVO_ACTOR_TYPE?.trim() || "HUMAN") as "HUMAN" | "AI" | "AUTOMATION";
const evoActorId = process.env.EVO_ACTOR_ID?.trim() || "demo-user";
const ledgerConfiguratorFeatureId = "evo-ledger-runtime-configurator.default";

const actionRouter = createAppActionRouter(
  [
    createEnterpriseAgentStatusActionHandler({
      listLlmProviders: () => manager.listEffectiveServiceProviders("llm.inference")
    }),
    createLedgerRuntimeConfiguratorActionHandler(ledgerConfigurator),
    createTradingLiteEvoActionHandler({
      baseUrl: evoBaseUrl,
      enterpriseCode: evoEnterpriseCode,
      actor: { type: evoActorType, id: evoActorId }
    })
  ],
  featureId => manager.getSnapshot().activeFeatures.some(feature => feature.featureId === featureId)
);

const corsOrigin = process.env.CORS_ORIGIN ?? "*";

function ledgerConfiguratorActive(): boolean {
  return manager.getSnapshot().activeFeatures.some(feature => feature.featureId === ledgerConfiguratorFeatureId);
}

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
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function evoJson(path: string, init?: RequestInit): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${evoBaseUrl}${path}`, init);
  const text = await response.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // Keep raw text for transport diagnostics.
  }
  return { status: response.status, body };
}

function installPlanWithDigest(packageId: string) {
  const plan = manager.planInstall(packageId);
  const snapshot = manager.getSnapshot();
  const planDigest = createHash("sha256")
    .update(JSON.stringify({ plan, snapshot }))
    .digest("hex");
  return { ...plan, planDigest };
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://localhost");

    if (request.method === "OPTIONS") {
      response.statusCode = 204;
      applyCors(response);
      return response.end();
    }

    if (request.method === "GET" && url.pathname === "/") {
      response.statusCode = 200;
      applyCors(response);
      response.setHeader("content-type", "text/html; charset=utf-8");
      return response.end(appHostShellHtml);
    }

    if (request.method === "GET" && url.pathname.startsWith("/assets/")) {
      const assetPath = url.pathname.slice("/assets/".length);
      if (!assetPath.endsWith(".js") || assetPath.includes("..")) {
        return json(response, 404, { code: "ASSET_NOT_FOUND" });
      }
      const assetUrl = new URL(`../${assetPath}`, import.meta.url);
      const bytes = await readFile(fileURLToPath(assetUrl));
      response.statusCode = 200;
      response.setHeader("content-type", "text/javascript; charset=utf-8");
      response.setHeader("cache-control", "no-store");
      return response.end(bytes);
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json(response, 200, { ok: true, service: "evo-app-manager" });
    }
    if (request.method === "GET" && url.pathname === "/v1/catalog") {
      return json(response, 200, manager.listCatalog());
    }
    if (request.method === "GET" && url.pathname === "/v1/platform/snapshot") {
      return json(response, 200, manager.getSnapshot());
    }
    if (request.method === "GET" && url.pathname === "/v1/providers/effective") {
      const capability = url.searchParams.get("capability") ?? undefined;
      return json(response, 200, manager.listEffectiveServiceProviders(capability));
    }
    if (request.method === "GET" && url.pathname === "/v1/experiences/effective") {
      return json(response, 200, [
        pluginStoreExperienceManifest,
        ...manager.listEffectiveExperiences()
      ]);
    }

    if (request.method === "GET" && url.pathname === "/v1/experience-pages") {
      const source = url.searchParams.get("source");
      if (!source) return json(response, 400, { code: "SOURCE_REQUIRED" });
      if (source === pluginStorePageSource) {
        return json(response, 200, createPluginStorePage(
          manager.listCatalog(),
          manager.getSnapshot()
        ));
      }
      const page = manager.loadExperiencePage(source);
      if (page === undefined) {
        return json(response, 404, { code: "PAGE_NOT_EFFECTIVE_OR_NOT_FOUND" });
      }
      return json(response, 200, page);
    }

    if (url.pathname.startsWith("/v1/ledger-runtime-configurator/") && !ledgerConfiguratorActive()) {
      return json(response, 409, {
        code: "FEATURE_NOT_ACTIVE",
        featureId: ledgerConfiguratorFeatureId,
        message: "Install and activate the Ledger Runtime Configurator before using its API."
      });
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
        ruleSets: [{
          id: "bookkeeping-legacy-posting-rules",
          displayName: "Bookkeeping 记账规则.sql reference rule set",
          status: "REFERENCE",
          rules: bookkeepingReferenceLegacyPostingRules
        }]
      });
    }
    if (request.method === "POST" && url.pathname === "/v1/ledger-runtime-configurator/validate") {
      const body = await readJson(request);
      const input = (
        body !== null &&
        typeof body === "object" &&
        (body as { kind?: unknown }).kind === "evo.ledger-runtime.source-configuration"
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
    if (request.method === "GET" && url.pathname === "/v1/ledger-runtime-configurator/compile") {
      return json(response, 200, ledgerConfigurator.compileCurrent());
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
      const compiled = ledgerConfigurator.compileCurrent();
      const result = await evoJson("/api/v1/configurator/burn", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(compiled)
      });
      return json(response, result.status, result.body);
    }
    if (request.method === "POST" && url.pathname === "/v1/ledger-runtime-configurator/test-business-data") {
      const body = await readJson(request);
      const result = await evoJson("/api/v1/configurator/business-data", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      return json(response, result.status, result.body);
    }
    if (request.method === "GET" && url.pathname === "/v1/ledger-runtime-configurator/runtime-status") {
      const result = await evoJson("/api/v1/configurator/status");
      return json(response, result.status, result.body);
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
        return json(response, 400, {
          ok: false,
          error: { code: "ACTION_REQUEST_INVALID", message: "Invalid ActionRequest." }
        });
      }

      const action = body as AppActionRequestV010;
      const itemId = typeof action.values.itemId === "string" ? action.values.itemId : undefined;

      if (action.command.code === "app-platform.plan-install") {
        if (!itemId) {
          return json(response, 400, { ok: false, error: { code: "PACKAGE_ID_REQUIRED", message: "Catalog itemId is required." } });
        }
        const plan = installPlanWithDigest(itemId);
        return json(response, 200, {
          ok: plan.blockers.length === 0,
          correlationId: action.sourceInteractionId,
          result: JSON.parse(JSON.stringify({
            stage: "INSTALL_PLAN",
            packageId: itemId,
            message: plan.blockers.length === 0
              ? "安装计划检查完成。请确认依赖和将激活的功能，然后点击“确认安装”。"
              : "安装计划存在阻断项，解决阻断后才能安装。",
            nextAction: plan.blockers.length === 0 ? "确认安装" : "解决阻断并重新生成安装计划",
            plan
          }))
        });
      }

      if (action.command.code === "app-platform.enable-package") {
        if (!itemId) {
          return json(response, 400, { ok: false, error: { code: "PACKAGE_ID_REQUIRED", message: "Catalog itemId is required." } });
        }
        const snapshot = manager.enable(itemId);
        return json(response, 200, {
          ok: true,
          correlationId: action.sourceInteractionId,
          result: JSON.parse(JSON.stringify({
            stage: "ENABLED",
            packageId: itemId,
            snapshot,
            effectiveExperiences: [pluginStoreExperienceManifest, ...manager.listEffectiveExperiences()]
          }))
        });
      }

      if (action.command.code === "app-platform.disable-package") {
        if (!itemId) {
          return json(response, 400, { ok: false, error: { code: "PACKAGE_ID_REQUIRED", message: "Catalog itemId is required." } });
        }
        const plan = manager.planDisable(itemId);
        if (plan.blockers.length > 0) {
          return json(response, 409, {
            ok: false,
            error: { code: "DISABLE_BLOCKED", message: JSON.stringify(plan.blockers) }
          });
        }
        const snapshot = manager.disable(itemId);
        return json(response, 200, {
          ok: true,
          correlationId: action.sourceInteractionId,
          result: JSON.parse(JSON.stringify({
            stage: "DISABLED",
            packageId: itemId,
            plan,
            snapshot,
            effectiveExperiences: [pluginStoreExperienceManifest, ...manager.listEffectiveExperiences()]
          }))
        });
      }

      if (action.command.code === "app-platform.uninstall-package") {
        if (!itemId) {
          return json(response, 400, { ok: false, error: { code: "PACKAGE_ID_REQUIRED", message: "Catalog itemId is required." } });
        }
        const plan = manager.planUninstall(itemId);
        if (plan.blockers.length > 0) {
          return json(response, 409, {
            ok: false,
            error: { code: "UNINSTALL_BLOCKED", message: JSON.stringify(plan.blockers) }
          });
        }
        const snapshot = manager.uninstall(itemId);
        return json(response, 200, {
          ok: true,
          correlationId: action.sourceInteractionId,
          result: JSON.parse(JSON.stringify({
            stage: "UNINSTALLED",
            packageId: itemId,
            plan,
            snapshot,
            effectiveExperiences: [pluginStoreExperienceManifest, ...manager.listEffectiveExperiences()]
          }))
        });
      }

      if (action.command.code === "app-platform.install-package") {
        if (!itemId) {
          return json(response, 400, { ok: false, error: { code: "PACKAGE_ID_REQUIRED", message: "Catalog itemId is required." } });
        }
        const preflight = installPlanWithDigest(itemId);
        if (preflight.blockers.length > 0) {
          return json(response, 409, {
            ok: false,
            error: {
              code: "INSTALL_BLOCKED",
              message: "安装前检查发现阻断项，请查看详情后处理。",
              details: JSON.parse(JSON.stringify(preflight))
            }
          });
        }
        const snapshot = manager.install(itemId);
        return json(response, 200, {
          ok: true,
          correlationId: action.sourceInteractionId,
          result: JSON.parse(JSON.stringify({
            stage: "INSTALLED_AND_ACTIVATED",
            packageId: itemId,
            message: "插件安装并激活完成。相关 Eidos Experience 已进入 App Host。",
            nextAction: "打开插件或返回商店继续管理",
            snapshot,
            effectiveExperiences: [pluginStoreExperienceManifest, ...manager.listEffectiveExperiences()]
          }))
        });
      }

      if (action.command.code === "app-platform.enable-package") {
        if (!itemId) {
          return json(response, 400, { ok: false, error: { code: "PACKAGE_ID_REQUIRED", message: "Catalog itemId is required." } });
        }
        try {
          const snapshot = manager.enable(itemId);
          return json(response, 200, {
            ok: true,
            correlationId: action.sourceInteractionId,
            result: JSON.parse(JSON.stringify({
              stage: "ENABLED",
              packageId: itemId,
              snapshot,
              effectiveExperiences: [pluginStoreExperienceManifest, ...manager.listEffectiveExperiences()]
            }))
          });
        } catch (error) {
          return json(response, 409, {
            ok: false,
            error: { code: "ENABLE_BLOCKED", message: error instanceof Error ? error.message : String(error) }
          });
        }
      }

      if (action.command.code === "app-platform.disable-package") {
        if (!itemId) {
          return json(response, 400, { ok: false, error: { code: "PACKAGE_ID_REQUIRED", message: "Catalog itemId is required." } });
        }
        const plan = manager.planDisable(itemId);
        if (plan.blockers.length > 0) {
          return json(response, 409, { ok: false, error: { code: "DISABLE_BLOCKED", message: JSON.stringify(plan.blockers) } });
        }
        const snapshot = manager.disable(itemId);
        return json(response, 200, {
          ok: true,
          correlationId: action.sourceInteractionId,
          result: JSON.parse(JSON.stringify({
            stage: "DISABLED",
            packageId: itemId,
            plan,
            snapshot,
            effectiveExperiences: [pluginStoreExperienceManifest, ...manager.listEffectiveExperiences()]
          }))
        });
      }

      if (action.command.code === "app-platform.uninstall-package") {
        if (!itemId) {
          return json(response, 400, { ok: false, error: { code: "PACKAGE_ID_REQUIRED", message: "Catalog itemId is required." } });
        }
        const plan = manager.planUninstall(itemId);
        if (plan.blockers.length > 0) {
          return json(response, 409, { ok: false, error: { code: "UNINSTALL_BLOCKED", message: JSON.stringify(plan.blockers) } });
        }
        const snapshot = manager.uninstall(itemId);
        return json(response, 200, {
          ok: true,
          correlationId: action.sourceInteractionId,
          result: JSON.parse(JSON.stringify({
            stage: "UNINSTALLED",
            packageId: itemId,
            plan,
            snapshot,
            effectiveExperiences: [pluginStoreExperienceManifest, ...manager.listEffectiveExperiences()]
          }))
        });
      }

      return json(response, 200, await actionRouter.execute(action));
    }

    if (request.method === "POST" && url.pathname === "/v1/install/plan") {
      const body = await readJson(request) as { packageId?: string };
      if (!body.packageId) return json(response, 400, { code: "PACKAGE_ID_REQUIRED" });
      return json(response, 200, installPlanWithDigest(body.packageId));
    }

    if (request.method === "POST" && url.pathname === "/v1/install") {
      const body = await readJson(request) as { packageId?: string; planDigest?: string };
      if (!body.packageId) return json(response, 400, { code: "PACKAGE_ID_REQUIRED" });
      const current = installPlanWithDigest(body.packageId);
      if (current.blockers.length > 0) {
        return json(response, 409, {
          code: "INSTALL_BLOCKED",
          message: "Preflight found blockers. Review the plan details and resolve them before installation.",
          plan: current
        });
      }
      const snapshot = manager.install(body.packageId);
      return json(response, 200, {
        snapshot,
        effectiveExperiences: manager.listEffectiveExperiences()
      });
    }

    if (request.method === "POST" && url.pathname === "/v1/enable") {
      const body = await readJson(request) as { packageId?: string };
      if (!body.packageId) return json(response, 400, { code: "PACKAGE_ID_REQUIRED" });
      try {
        return json(response, 200, {
          snapshot: manager.enable(body.packageId),
          effectiveExperiences: manager.listEffectiveExperiences()
        });
      } catch (error) {
        return json(response, 409, { code: "ENABLE_BLOCKED", message: error instanceof Error ? error.message : String(error) });
      }
    }

    if (request.method === "POST" && url.pathname === "/v1/disable/plan") {
      const body = await readJson(request) as { packageId?: string };
      if (!body.packageId) return json(response, 400, { code: "PACKAGE_ID_REQUIRED" });
      return json(response, 200, manager.planDisable(body.packageId));
    }

    if (request.method === "POST" && url.pathname === "/v1/disable") {
      const body = await readJson(request) as { packageId?: string };
      if (!body.packageId) return json(response, 400, { code: "PACKAGE_ID_REQUIRED" });
      const plan = manager.planDisable(body.packageId);
      if (plan.blockers.length > 0) return json(response, 409, { code: "DISABLE_BLOCKED", plan });
      return json(response, 200, {
        plan,
        snapshot: manager.disable(body.packageId),
        effectiveExperiences: manager.listEffectiveExperiences()
      });
    }

    if (request.method === "POST" && url.pathname === "/v1/uninstall/plan") {
      const body = await readJson(request) as { packageId?: string };
      if (!body.packageId) return json(response, 400, { code: "PACKAGE_ID_REQUIRED" });
      return json(response, 200, manager.planUninstall(body.packageId));
    }

    if (request.method === "POST" && url.pathname === "/v1/uninstall") {
      const body = await readJson(request) as { packageId?: string };
      if (!body.packageId) return json(response, 400, { code: "PACKAGE_ID_REQUIRED" });
      const plan = manager.planUninstall(body.packageId);
      if (plan.blockers.length > 0) return json(response, 409, { code: "UNINSTALL_BLOCKED", plan });
      return json(response, 200, {
        plan,
        snapshot: manager.uninstall(body.packageId),
        effectiveExperiences: manager.listEffectiveExperiences()
      });
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
server.listen(port, () => console.log(`EVO App Manager listening on http://localhost:${port}`));
