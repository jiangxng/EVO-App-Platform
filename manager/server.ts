import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createPackageCatalog } from "../catalog/catalog.js";
import { createFileLifecycleStore, createMemoryLifecycleStore } from "./store.js";
import { createFileSettingsStore, createMemorySettingsStore } from "./settings-store.js";
import { createAppManagerService } from "./service.js";
import {
  createFilePluginStorageService,
  createMemoryPluginStorageService,
  createPluginEventBus,
  type PluginEventV010
} from "./plugin-host-services.js";
import { createProcessPluginRuntimeHostV010 } from "./plugin-runtime-host.js";
import { retireExperimentalPackageV010 } from "./lifecycle-migrations.js";
import { createAppActionRouter } from "../actions/router.js";
import type { AppActionRequestV010 } from "../actions/contracts.js";
import { createTradingLiteEvoActionHandler } from "../apps/trading-lite/action-handler.js";
import { createEnterpriseAgentChatActionHandler } from "../agents/enterprise-agent/chat-action-handler.js";
import type { LlmInferenceProvider } from "../contracts/llm.js";
import { createProviderRuntimeRegistry } from "../providers/runtime-registry.js";
import { createOpenAiResponsesLlmProvider } from "../providers/openai/runtime.js";
import {
  OPENAI_LLM_PACKAGE_ID,
  OPENAI_LLM_PROVIDER_ID,
  openAiLlmProviderPackage
} from "../providers/openai/package.js";
import { createLedgerRuntimeConfiguratorService } from "../apps/ledger-runtime-configurator/service.js";
import { createLedgerRuntimeConfiguratorActionHandler } from "../apps/ledger-runtime-configurator/action-handler.js";
import { bookkeepingReferenceLegacyPostingRules } from "../apps/ledger-runtime-configurator/default-library.js";
import type { LedgerRuntimeSourceConfigurationV010, LedgerRuntimeTemplateV010 } from "../apps/ledger-runtime-configurator/contracts.js";
import { appHostShellHtml } from "./app-host-shell.js";
import { appPlatformLocalizationBundles } from "./localization.js";
import {
  createSettingsExperienceManifest,
  createSettingsIndexPage,
  createSettingsPage,
  packageIdFromSettingsPageSource,
  settingsIndexPageSource,
  validateAndMergeSettings
} from "./settings-page.js";
import {
  createPluginStorePage,
  pluginStoreExperienceManifest,
  pluginStorePageSource
} from "./plugin-store-page.js";
import {
  companyNotesPackage,
  enterpriseAgentPackage,
  evoFoundationPackage,
  ledgerRuntimeConfiguratorPackage,
  referenceExperienceAssets,
  tradingLitePackage
} from "../catalog/seed.js";

const catalog = createPackageCatalog([
  companyNotesPackage,
  enterpriseAgentPackage,
  evoFoundationPackage,
  ledgerRuntimeConfiguratorPackage,
  openAiLlmProviderPackage,
  tradingLitePackage
]);
const lifecycleStateFile = process.env.APP_PLATFORM_STATE_FILE?.trim();
const store = lifecycleStateFile ? createFileLifecycleStore(lifecycleStateFile) : createMemoryLifecycleStore();
const settingsStateFile = process.env.APP_PLATFORM_SETTINGS_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "settings.json") : undefined);
const settingsStore = settingsStateFile
  ? createFileSettingsStore(settingsStateFile)
  : createMemorySettingsStore();
const pluginStorageStateFile = process.env.APP_PLATFORM_PLUGIN_STORAGE_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "plugin-storage.json") : undefined);
const pluginStorage = pluginStorageStateFile
  ? createFilePluginStorageService(pluginStorageStateFile)
  : createMemoryPluginStorageService();
const pluginEvents = createPluginEventBus();
const processRuntimeHost = createProcessPluginRuntimeHostV010({
  storageService: pluginStorage,
  eventBus: pluginEvents
});
const lifecycleEventLog: PluginEventV010[] = [];

const retiredLocalization = retireExperimentalPackageV010(
  store,
  "evo-localization",
  ["evo-localization.default"]
);
if (retiredLocalization.changed) {
  console.log("Retired obsolete experimental package", JSON.stringify(retiredLocalization));
}
const manager = createAppManagerService(
  catalog,
  store,
  () => new Date(),
  referenceExperienceAssets,
  event => {
    const emitted = pluginEvents.publish("evo.app-platform", "evo.app-platform.lifecycle", event);
    lifecycleEventLog.push(emitted);
    if (lifecycleEventLog.length > 100) lifecycleEventLog.shift();

    if (event.type === "FEATURE_DEACTIVATED" || event.type === "PACKAGE_UNINSTALLED") {
      void processRuntimeHost.stop(event.packageId);
    }
  }
);
const ledgerConfigurator = createLedgerRuntimeConfiguratorService();
const evoBaseUrl = process.env.EVO_BASE_URL?.trim() || "http://localhost:3000";
const evoEnterpriseCode = process.env.EVO_ENTERPRISE_CODE?.trim() || "EVO_DEMO";
const evoActorType = (process.env.EVO_ACTOR_TYPE?.trim() || "HUMAN") as "HUMAN" | "AI" | "AUTOMATION";
const evoActorId = process.env.EVO_ACTOR_ID?.trim() || "demo-user";
const ledgerConfiguratorFeatureId = "evo-ledger-runtime-configurator.default";

const providerRuntimeRegistry = createProviderRuntimeRegistry();
const openaiApiKey = process.env.OPENAI_API_KEY?.trim();

function refreshOpenAiProviderRuntime(): void {
  if (!openaiApiKey) {
    providerRuntimeRegistry.remove(OPENAI_LLM_PROVIDER_ID);
    return;
  }
  const values = settingsStore.getNamespace(OPENAI_LLM_PACKAGE_ID);
  const model = typeof values.model === "string" && values.model.trim()
    ? values.model.trim()
    : process.env.OPENAI_MODEL?.trim() || "gpt-5.6-luna";
  const baseUrl = typeof values.baseUrl === "string" && values.baseUrl.trim()
    ? values.baseUrl.trim()
    : process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1";

  providerRuntimeRegistry.replace<LlmInferenceProvider>(
    OPENAI_LLM_PROVIDER_ID,
    createOpenAiResponsesLlmProvider({
      apiKey: openaiApiKey,
      model,
      baseUrl
    })
  );
}

refreshOpenAiProviderRuntime();

function resolveLlmProvider(): {
  installedProviderIds: string[];
  provider?: LlmInferenceProvider;
} {
  const descriptors = manager.listEffectiveServiceProviders("llm.inference");
  const installedProviderIds = descriptors.map(provider => provider.providerId);
  const resolved = providerRuntimeRegistry.resolve<LlmInferenceProvider>(
    descriptors,
    "llm.inference"
  );
  return {
    installedProviderIds,
    ...(resolved ? { provider: resolved.runtime } : {})
  };
}

const actionRouter = createAppActionRouter(
  [
    createEnterpriseAgentChatActionHandler({
      manager,
      resolveLlmProvider
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
    if (request.method === "GET" && url.pathname === "/v1/platform/lifecycle-events") {
      return json(response, 200, lifecycleEventLog);
    }
    if (request.method === "GET" && url.pathname === "/v1/providers/effective") {
      const capability = url.searchParams.get("capability") ?? undefined;
      return json(response, 200, manager.listEffectiveServiceProviders(capability));
    }
    if (request.method === "GET" && url.pathname === "/v1/localization/bundles") {
      return json(response, 200, [
        ...appPlatformLocalizationBundles,
        ...manager.listEffectiveLocalizationBundles()
      ]);
    }
    if (request.method === "GET" && url.pathname === "/v1/workbench/activities") {
      return json(response, 200, manager.listEffectiveWorkbenchActivities());
    }
    if (request.method === "GET" && url.pathname === "/v1/settings/effective") {
      return json(response, 200, {
        contributions: manager.listInstalledSettings(),
        values: settingsStore.snapshot()
      });
    }
    if (request.method === "GET" && url.pathname === "/v1/experiences/effective") {
      return json(response, 200, [
        pluginStoreExperienceManifest,
        createSettingsExperienceManifest(manager),
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
      if (source === settingsIndexPageSource) {
        return json(response, 200, createSettingsIndexPage(manager));
      }
      const settingsPackageId = packageIdFromSettingsPageSource(source);
      if (settingsPackageId) {
        const settingsPage = createSettingsPage(manager, settingsStore, settingsPackageId);
        if (!settingsPage) {
          return json(response, 404, { code: "SETTINGS_NOT_AVAILABLE", packageId: settingsPackageId });
        }
        return json(response, 200, settingsPage);
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

      if (action.command.code === "app-platform.update-settings") {
        const namespace = typeof action.values.namespace === "string"
          ? action.values.namespace
          : undefined;
        const rawSettings = action.values.settings;
        if (
          !namespace
          || rawSettings === null
          || typeof rawSettings !== "object"
          || Array.isArray(rawSettings)
        ) {
          return json(response, 400, {
            ok: false,
            error: { code: "SETTINGS_INPUT_INVALID", message: "Settings namespace and values are required." }
          });
        }

        try {
          const saved = validateAndMergeSettings(
            manager,
            settingsStore,
            namespace,
            rawSettings as Record<string, unknown>
          );
          if (namespace === OPENAI_LLM_PACKAGE_ID) refreshOpenAiProviderRuntime();
          return json(response, 200, {
            ok: true,
            correlationId: action.sourceInteractionId,
            result: {
              message: "Settings saved.",
              namespace,
              settings: saved
            }
          });
        } catch (error) {
          return json(response, 422, {
            ok: false,
            error: {
              code: "SETTINGS_UPDATE_REJECTED",
              message: error instanceof Error ? error.message : String(error)
            }
          });
        }
      }

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
              ? "安装前检查完成，当前没有阻断项。"
              : "安装前检查发现阻断项，需要处理后才能安装。",
            nextAction: plan.blockers.length === 0 ? "可直接安装" : "解决阻断后重新安装",
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
        const confirmed = action.values.confirmed === true;
        const target = manager.listCatalog().find(pkg => pkg.packageId === itemId);
        const snapshot = manager.install(itemId, {
          trustApproved: confirmed,
          approvedPermissions: confirmed
            ? target?.permissions?.map(permission => permission.id) ?? []
            : []
        });
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
      const body = await readJson(request) as {
        packageId?: string;
        planDigest?: string;
        trustApproved?: boolean;
        approvedPermissions?: string[];
      };
      if (!body.packageId) return json(response, 400, { code: "PACKAGE_ID_REQUIRED" });
      const current = installPlanWithDigest(body.packageId);
      if (current.blockers.length > 0) {
        return json(response, 409, {
          code: "INSTALL_BLOCKED",
          message: "Preflight found blockers. Review the plan details and resolve them before installation.",
          plan: current
        });
      }
      const snapshot = manager.install(body.packageId, {
        trustApproved: body.trustApproved === true,
        approvedPermissions: body.approvedPermissions ?? []
      });
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

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`EVO App Manager shutting down (${signal})`);
  await processRuntimeHost.shutdown();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
