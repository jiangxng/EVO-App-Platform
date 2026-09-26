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
import {
  createProcessPluginRuntimeHostV010,
  inspectPluginRuntimeV010
} from "./plugin-runtime-host.js";
import { createPluginRuntimeDispatcherV010 } from "./plugin-runtime-dispatcher.js";
import { verifySigstoreBundleEvidenceV010 } from "./sigstore-verifier.js";
import type { RemoteRuntimeCredentialProviderV010 } from "./plugin-runtime-remote.js";
import {
  createFilePluginIntegrityTrustStoreV010,
  createMemoryPluginIntegrityTrustStoreV010,
  verifyPackageIntegrityV010
} from "./package-integrity.js";
import {
  createJsonlPluginRuntimeObservabilitySinkV010,
  createPluginRuntimeObservabilityV010
} from "./plugin-runtime-observability.js";
import { retireExperimentalPackageV010 } from "./lifecycle-migrations.js";
import { createAppActionRouter } from "../actions/router.js";
import type { AppActionRequestV010 } from "../actions/contracts.js";
import { createTradingLiteEvoActionHandler } from "../apps/trading-lite/action-handler.js";
import { createEnterpriseAgentChatActionHandler } from "../agents/enterprise-agent/chat-action-handler.js";
import type { LlmInferenceProvider } from "../contracts/llm.js";
import type { AuthorizationProviderV010 } from "../contracts/platform-services.js";
import { createProviderRuntimeRegistry } from "../providers/runtime-registry.js";
import {
  createFileProviderBindingStoreV010,
  createMemoryProviderBindingStoreV010,
  resolveProviderRuntimeV010
} from "./provider-resolution.js";
import {
  HOST_REMOTE_CREDENTIAL_PROVIDER_ID,
  REMOTE_CREDENTIAL_CAPABILITY,
  hostRemoteCredentialProviderPackage
} from "../providers/remote-credential/package.js";
import {
  createHostRemoteBearerCredentialProviderV010,
  parseHostRemoteBearerTokenMapV010
} from "../providers/remote-credential/runtime.js";
import { createOpenAiResponsesHealthProbe, createOpenAiResponsesLlmProvider } from "../providers/openai/runtime.js";
import {
  OPENAI_LLM_PACKAGE_ID,
  OPENAI_LLM_PROVIDER_ID,
  openAiLlmProviderPackage
} from "../providers/openai/package.js";
import {
  AUTHORIZATION_CHECK_CAPABILITY,
  HOST_STATIC_AUTHORIZATION_PROVIDER_ID,
  hostStaticAuthorizationProviderPackage
} from "../providers/authorization/package.js";
import {
  createHostStaticAuthorizationHealthProbeV010,
  createHostStaticAuthorizationProviderV010,
  parseHostStaticAuthorizationPolicyV010
} from "../providers/authorization/runtime.js";
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
  capabilityFromProviderManagerSource,
  createProviderBindingPage,
  createProviderManagerExperienceManifest,
  createProviderManagerIndexPage,
  providerManagerIndexPageSource
} from "./provider-manager-page.js";
import {
  createHelpExperienceManifestV010,
  createHelpIndexPageV010,
  helpIdFromPageSourceV010,
  helpIndexPageSourceV010,
  loadHelpCorpusV010,
  materializeHelpDocumentV010,
  searchHelpV010,
  type HelpContextSelectorsV010
} from "./help-system.js";
import {
  authenticateBootstrapAdministratorV010,
  authorizeProviderAdministrationV010,
  createJsonlProviderBindingAuditStoreV010,
  createMemoryProviderBindingAuditStoreV010,
  PROVIDER_BINDING_UPDATE_ACTION,
  PROVIDER_GOVERNANCE_AUDIT_READ_ACTION,
  PROVIDER_HEALTH_PROBE_ACTION,
  providerAuditEventV010
} from "./provider-governance.js";
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
  hostRemoteCredentialProviderPackage,
  hostStaticAuthorizationProviderPackage,
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
const pluginTrustStoreFile = process.env.APP_PLATFORM_PLUGIN_TRUST_STORE_FILE?.trim();
const pluginIntegrityTrustStore = pluginTrustStoreFile
  ? createFilePluginIntegrityTrustStoreV010(pluginTrustStoreFile)
  : createMemoryPluginIntegrityTrustStoreV010();
const runtimeEventsFile = process.env.APP_PLATFORM_RUNTIME_EVENTS_FILE?.trim();
const runtimeObservability = createPluginRuntimeObservabilityV010(
  500,
  runtimeEventsFile
    ? createJsonlPluginRuntimeObservabilitySinkV010(runtimeEventsFile)
    : undefined
);
const processRuntimeHost = createProcessPluginRuntimeHostV010({
  storageService: pluginStorage,
  eventBus: pluginEvents,
  integrityTrustStore: pluginIntegrityTrustStore,
  onRuntimeEvent: event => runtimeObservability.record(event),
  verifyExternalEvidence: (pkg, artifactBytes) =>
    verifySigstoreBundleEvidenceV010(
      pkg,
      pluginIntegrityTrustStore,
      artifactBytes
    )
});
const lifecycleEventLog: PluginEventV010[] = [];
let helpCorpusLoadError: string | undefined;
const helpCorpus = (() => {
  try {
    return loadHelpCorpusV010();
  } catch (error) {
    helpCorpusLoadError = error instanceof Error ? error.message : String(error);
    console.error("Platform Help corpus failed to load; Help is degraded.", error);
    return [];
  }
})();
const providerRuntimeRegistry = createProviderRuntimeRegistry();
const providerBindingsFile = process.env.APP_PLATFORM_PROVIDER_BINDINGS_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "provider-bindings.json") : undefined);
const providerBindings = providerBindingsFile
  ? createFileProviderBindingStoreV010(providerBindingsFile)
  : createMemoryProviderBindingStoreV010();
const bootstrapAdminToken = process.env.APP_PLATFORM_BOOTSTRAP_ADMIN_TOKEN?.trim()
  || process.env.APP_PLATFORM_PROVIDER_ADMIN_TOKEN?.trim();
const providerAuditFile = process.env.APP_PLATFORM_PROVIDER_AUDIT_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "provider-governance-audit.jsonl") : undefined);
const providerAudit = providerAuditFile
  ? createJsonlProviderBindingAuditStoreV010(providerAuditFile)
  : createMemoryProviderBindingAuditStoreV010();
const authorizationPolicy = parseHostStaticAuthorizationPolicyV010(
  process.env.APP_PLATFORM_AUTHORIZATION_POLICY_JSON
);
if (authorizationPolicy) {
  providerRuntimeRegistry.replace<AuthorizationProviderV010>(
    HOST_STATIC_AUTHORIZATION_PROVIDER_ID,
    createHostStaticAuthorizationProviderV010(authorizationPolicy)
  );
  providerRuntimeRegistry.setHealthProbe(
    HOST_STATIC_AUTHORIZATION_PROVIDER_ID,
    createHostStaticAuthorizationHealthProbeV010(authorizationPolicy)
  );
  providerRuntimeRegistry.setHealth(HOST_STATIC_AUTHORIZATION_PROVIDER_ID, {
    state: "HEALTHY",
    message: `Static authorization policy loaded with ${authorizationPolicy.rules.length} rule(s).`,
    checkedAt: new Date().toISOString()
  });
}
const remoteBearerTokenMap = parseHostRemoteBearerTokenMapV010(
  process.env.APP_PLATFORM_REMOTE_BEARER_TOKENS_JSON
);
if (remoteBearerTokenMap) {
  providerRuntimeRegistry.replace<RemoteRuntimeCredentialProviderV010>(
    HOST_REMOTE_CREDENTIAL_PROVIDER_ID,
    createHostRemoteBearerCredentialProviderV010(remoteBearerTokenMap)
  );
  providerRuntimeRegistry.setHealth(HOST_REMOTE_CREDENTIAL_PROVIDER_ID, {
    state: "HEALTHY",
    message: "Host bearer credential map is configured.",
    checkedAt: new Date().toISOString()
  });
  providerRuntimeRegistry.setHealthProbe(HOST_REMOTE_CREDENTIAL_PROVIDER_ID, () => ({
    state: "HEALTHY",
    message: "Host bearer credential map remains configured."
  }));
}

function activeServiceProviderDescriptors(capability: string) {
  const active = store.snapshot().activeFeatures;
  const result: Array<{ providerId: string; capability: string }> = [];
  for (const item of active) {
    const pkg = catalog.get(item.packageId);
    const feature = pkg?.features.find(value => value.featureId === item.featureId);
    for (const contribution of feature?.contributions ?? []) {
      if (contribution.kind !== "platform.service-provider") continue;
      if (contribution.provider.capability !== capability) continue;
      result.push({
        providerId: contribution.provider.providerId,
        capability: contribution.provider.capability
      });
    }
  }
  return result;
}

function resolveRemoteCredentialProvider(
  _packageId: string
): RemoteRuntimeCredentialProviderV010 | undefined {
  return resolveProviderRuntimeV010<RemoteRuntimeCredentialProviderV010>(
    providerRuntimeRegistry,
    activeServiceProviderDescriptors(REMOTE_CREDENTIAL_CAPABILITY),
    providerBindings,
    REMOTE_CREDENTIAL_CAPABILITY,
    { installationId: "default" }
  )?.runtime;
}

function evaluateRuntimeForHost(pkg: Parameters<typeof inspectPluginRuntimeV010>[0]) {
  const status = inspectPluginRuntimeV010(pkg);
  if (
    pkg.runtime?.kind === "REMOTE"
    && status.status === "INACTIVE"
    && resolveRemoteCredentialProvider(pkg.packageId)
  ) {
    return {
      ...status,
      status: "READY" as const,
      message: "REMOTE runtime adapter and credential Provider runtime are available."
    };
  }
  return status;
}

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
  },
  pkg => verifyPackageIntegrityV010(pkg, pluginIntegrityTrustStore),
  evaluateRuntimeForHost
);
function resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined {
  return resolveProviderRuntimeV010<AuthorizationProviderV010>(
    providerRuntimeRegistry,
    manager.listEffectiveServiceProviders(AUTHORIZATION_CHECK_CAPABILITY),
    providerBindings,
    AUTHORIZATION_CHECK_CAPABILITY,
    { installationId: "default" }
  )?.runtime;
}

async function authorizeProviderGovernance(
  token: string | undefined,
  action: string,
  resource: {
    type: string;
    id?: string;
    attributes?: Record<string, string | number | boolean | null>;
  }
) {
  const authentication = authenticateBootstrapAdministratorV010(token, bootstrapAdminToken);
  if (!authentication.authenticated) {
    return authorizeProviderAdministrationV010(
      authentication,
      undefined,
      { action, resource }
    );
  }

  let authorizationProvider: AuthorizationProviderV010 | undefined;
  try {
    authorizationProvider = resolveAuthorizationProvider();
  } catch {
    return {
      allowed: false,
      actorId: authentication.principal?.subjectId ?? "anonymous",
      reason: "AUTHORIZATION_PROVIDER_RESOLUTION_FAILED"
    };
  }

  return authorizeProviderAdministrationV010(
    authentication,
    authorizationProvider,
    {
      action,
      resource
    }
  );
}

const runtimeDispatcher = createPluginRuntimeDispatcherV010({
  catalog,
  store,
  processHost: processRuntimeHost,
  integrityTrustStore: pluginIntegrityTrustStore,
  resolveRemoteCredentialProvider,
  onRuntimeEvent: event => runtimeObservability.record(event)
});
const ledgerConfigurator = createLedgerRuntimeConfiguratorService();
const evoBaseUrl = process.env.EVO_BASE_URL?.trim() || "http://localhost:3000";
const evoEnterpriseCode = process.env.EVO_ENTERPRISE_CODE?.trim() || "EVO_DEMO";
const evoActorType = (process.env.EVO_ACTOR_TYPE?.trim() || "HUMAN") as "HUMAN" | "AI" | "AUTOMATION";
const evoActorId = process.env.EVO_ACTOR_ID?.trim() || "demo-user";
const ledgerConfiguratorFeatureId = "evo-ledger-runtime-configurator.default";

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

  const options = {
    apiKey: openaiApiKey,
    model,
    baseUrl
  };
  providerRuntimeRegistry.replace<LlmInferenceProvider>(
    OPENAI_LLM_PROVIDER_ID,
    createOpenAiResponsesLlmProvider(options)
  );
  providerRuntimeRegistry.setHealthProbe(
    OPENAI_LLM_PROVIDER_ID,
    createOpenAiResponsesHealthProbe(options)
  );
  providerRuntimeRegistry.setHealth(OPENAI_LLM_PROVIDER_ID, {
    state: "UNKNOWN",
    message: "Runtime is configured; external service health has not been actively probed.",
    checkedAt: new Date().toISOString()
  });
}

refreshOpenAiProviderRuntime();

function resolveLlmProvider(): {
  installedProviderIds: string[];
  provider?: LlmInferenceProvider;
} {
  const descriptors = manager.listEffectiveServiceProviders("llm.inference");
  const installedProviderIds = descriptors.map(provider => provider.providerId);
  const resolved = resolveProviderRuntimeV010<LlmInferenceProvider>(
    providerRuntimeRegistry,
    descriptors,
    providerBindings,
    "llm.inference",
    { installationId: "default" }
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
  response.setHeader("access-control-allow-headers", "content-type,accept,authorization");
}

function requestedLocale(url: URL): string {
  return url.searchParams.get("locale")?.trim() || "en";
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
    if (request.method === "GET" && url.pathname === "/v1/runtime/diagnostics") {
      const packageId = url.searchParams.get("packageId")?.trim();
      return json(
        response,
        200,
        packageId
          ? runtimeObservability.diagnostics(packageId)
          : runtimeObservability.listDiagnostics()
      );
    }
    if (request.method === "GET" && url.pathname === "/v1/runtime/events") {
      const packageId = url.searchParams.get("packageId")?.trim();
      return json(response, 200, runtimeObservability.listEvents(packageId || undefined));
    }
    if (request.method === "GET" && url.pathname === "/v1/platform/lifecycle-events") {
      return json(response, 200, lifecycleEventLog);
    }
    if (request.method === "GET" && url.pathname === "/v1/providers/effective") {
      const capability = url.searchParams.get("capability") ?? undefined;
      return json(response, 200, manager.listEffectiveServiceProviders(capability));
    }
    if (request.method === "GET" && url.pathname === "/v1/providers/bindings") {
      const capability = url.searchParams.get("capability") ?? undefined;
      return json(response, 200, providerBindings.list(capability));
    }
    if (request.method === "GET" && url.pathname === "/v1/providers/audit") {
      const authorization = request.headers.authorization;
      const bearerToken = typeof authorization === "string" && authorization.startsWith("Bearer ")
        ? authorization.slice("Bearer ".length)
        : undefined;
      const decision = await authorizeProviderGovernance(
        bearerToken,
        PROVIDER_GOVERNANCE_AUDIT_READ_ACTION,
        { type: "provider-governance-audit" }
      );
      providerAudit.append(providerAuditEventV010({
        action: "READ_PROVIDER_GOVERNANCE_AUDIT",
        outcome: decision.allowed ? "ALLOWED" : "DENIED",
        actorId: decision.actorId,
        ...(decision.policyProviderId ? { policyProviderId: decision.policyProviderId } : {}),
        reason: decision.reason
      }));
      if (!decision.allowed) {
        return json(response, 403, {
          ok: false,
          error: { code: decision.reason, message: "Provider governance audit requires authorization policy approval." }
        });
      }
      const rawLimit = Number(url.searchParams.get("limit") ?? "100");
      const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(Math.trunc(rawLimit), 500)) : 100;
      return json(response, 200, providerAudit.list(limit));
    }
    if (request.method === "POST" && url.pathname === "/v1/providers/health/probe") {
      const body = await readJson(request) as {
        providerId?: unknown;
        capability?: unknown;
        adminToken?: unknown;
        correlationId?: unknown;
      };
      const providerId = typeof body.providerId === "string" ? body.providerId.trim() : "";
      const capability = typeof body.capability === "string" ? body.capability.trim() : undefined;
      const authorization = request.headers.authorization;
      const bearerToken = typeof authorization === "string" && authorization.startsWith("Bearer ")
        ? authorization.slice("Bearer ".length)
        : undefined;
      const adminToken = typeof body.adminToken === "string" ? body.adminToken : bearerToken;
      const correlationId = typeof body.correlationId === "string" ? body.correlationId : undefined;
      if (!providerId) {
        return json(response, 400, { ok: false, error: { code: "PROVIDER_ID_REQUIRED" } });
      }
      const decision = await authorizeProviderGovernance(
        adminToken,
        PROVIDER_HEALTH_PROBE_ACTION,
        {
          type: "provider-runtime",
          id: providerId,
          attributes: {
            ...(capability ? { capability } : {})
          }
        }
      );
      providerAudit.append(providerAuditEventV010({
        action: "PROBE_PROVIDER_HEALTH",
        outcome: decision.allowed ? "ALLOWED" : "DENIED",
        actorId: decision.actorId,
        ...(decision.policyProviderId ? { policyProviderId: decision.policyProviderId } : {}),
        ...(correlationId ? { correlationId } : {}),
        ...(capability ? { capability } : {}),
        providerId,
        reason: decision.reason
      }));
      if (!decision.allowed) {
        return json(response, 403, {
          ok: false,
          error: { code: decision.reason, message: "Provider administration authorization policy denied this operation." }
        });
      }
      const descriptors = capability
        ? manager.listEffectiveServiceProviders(capability)
        : manager.listEffectiveServiceProviders();
      if (!descriptors.some(provider => provider.providerId === providerId)) {
        return json(response, 404, {
          ok: false,
          error: { code: "PROVIDER_NOT_ACTIVE", message: providerId }
        });
      }
      const health = await providerRuntimeRegistry.runHealthProbe(providerId);
      return json(response, 200, { ok: true, providerId, health });
    }
    if (request.method === "GET" && url.pathname === "/v1/localization/bundles") {
      return json(response, 200, [
        ...appPlatformLocalizationBundles,
        ...manager.listEffectiveLocalizationBundles()
      ]);
    }
    if (request.method === "GET" && url.pathname === "/v1/help/health") {
      return json(response, helpCorpusLoadError ? 503 : 200, {
        status: helpCorpusLoadError ? "DEGRADED" : "HEALTHY",
        documents: helpCorpus.length,
        ...(helpCorpusLoadError ? { error: helpCorpusLoadError } : {})
      });
    }
    if (
      request.method === "GET"
      && (url.pathname === "/v1/help/search" || url.pathname === "/v1/help/context")
    ) {
      const list = (name: string): string[] => url.searchParams.getAll(name)
        .flatMap(value => value.split(","))
        .map(value => value.trim())
        .filter(Boolean);
      const context: HelpContextSelectorsV010 = {
        ...(list("packageId").length ? { packageIds: list("packageId") } : {}),
        ...(list("featureId").length ? { featureIds: list("featureId") } : {}),
        ...(list("capability").length ? { capabilities: list("capability") } : {}),
        ...(list("route").length ? { routes: list("route") } : {}),
        ...(list("action").length ? { actions: list("action") } : {}),
        ...(list("command").length ? { commands: list("command") } : {}),
        ...(list("providerId").length ? { providerIds: list("providerId") } : {}),
        ...(list("errorCode").length ? { errorCodes: list("errorCode") } : {})
      };
      const query = url.pathname === "/v1/help/search"
        ? url.searchParams.get("q") ?? ""
        : "";
      const locale = requestedLocale(url);
      return json(response, 200, searchHelpV010(helpCorpus, query, locale, context));
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
        createProviderManagerExperienceManifest(manager),
        createHelpExperienceManifestV010(helpCorpus, requestedLocale(url)),
        ...manager.listEffectiveExperiences()
      ]);
    }

    if (request.method === "GET" && url.pathname === "/v1/experience-pages") {
      const source = url.searchParams.get("source");
      if (!source) return json(response, 400, { code: "SOURCE_REQUIRED" });
      if (source === helpIndexPageSourceV010) {
        return json(response, 200, createHelpIndexPageV010(helpCorpus, requestedLocale(url)));
      }
      const helpDocumentId = helpIdFromPageSourceV010(source);
      if (helpDocumentId) {
        const document = materializeHelpDocumentV010(helpCorpus, helpDocumentId, requestedLocale(url));
        if (!document) {
          return json(response, 404, { code: "HELP_DOCUMENT_NOT_FOUND", id: helpDocumentId });
        }
        return json(response, 200, document);
      }
      if (source === pluginStorePageSource) {
        return json(response, 200, createPluginStorePage(
          manager.listCatalog(),
          manager.getSnapshot(),
          {
            integrityTrustStore: pluginIntegrityTrustStore,
            runtimeDiagnostics: runtimeObservability.listDiagnostics(),
            runtimeEvents: runtimeObservability.listEvents(),
            evaluateRuntime: evaluateRuntimeForHost
          }
        ));
      }
      if (source === settingsIndexPageSource) {
        return json(response, 200, createSettingsIndexPage(manager));
      }
      if (source === providerManagerIndexPageSource) {
        return json(response, 200, createProviderManagerIndexPage(
          manager,
          providerRuntimeRegistry,
          providerBindings,
          { installationId: "default" }
        ));
      }
      const providerCapability = capabilityFromProviderManagerSource(source);
      if (providerCapability) {
        const providerPage = createProviderBindingPage(
          manager,
          providerRuntimeRegistry,
          providerBindings,
          providerCapability,
          { installationId: "default" }
        );
        if (!providerPage) {
          return json(response, 404, {
            code: "PROVIDER_CAPABILITY_NOT_AVAILABLE",
            capability: providerCapability
          });
        }
        return json(response, 200, providerPage);
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

      if (action.command.code === "app-platform.update-provider-binding") {
        const namespace = typeof action.values.namespace === "string"
          ? action.values.namespace
          : undefined;
        const rawSettings = action.values.settings;
        if (
          !namespace?.startsWith("provider-binding:")
          || rawSettings === null
          || typeof rawSettings !== "object"
          || Array.isArray(rawSettings)
        ) {
          return json(response, 400, {
            ok: false,
            error: {
              code: "PROVIDER_BINDING_INPUT_INVALID",
              message: "Provider binding capability and values are required."
            }
          });
        }

        try {
          const capability = namespace.slice("provider-binding:".length);
          const values = rawSettings as Record<string, unknown>;
          const providerId = typeof values.providerId === "string" ? values.providerId.trim() : "";
          const scope = typeof values.scope === "string" ? values.scope : "";
          const scopeId = typeof values.scopeId === "string" ? values.scopeId.trim() : "";
          const priority = typeof values.priority === "number" ? values.priority : 0;

          const allowedScopes = new Set([
            "SYSTEM",
            "INSTALLATION",
            "ENTERPRISE",
            "COMPANY",
            "WORKSPACE",
            "USER"
          ]);
          if (!capability || !providerId || !allowedScopes.has(scope)) {
            throw new Error("PROVIDER_BINDING_FIELDS_INVALID");
          }

          const descriptors = manager.listEffectiveServiceProviders(capability);
          if (!descriptors.some(provider => provider.providerId === providerId)) {
            throw new Error(
              `PROVIDER_BINDING_PROVIDER_NOT_ACTIVE: ${capability}: ${providerId}`
            );
          }

          const adminToken = typeof values.adminToken === "string" ? values.adminToken : undefined;
          const decision = await authorizeProviderGovernance(
            adminToken,
            PROVIDER_BINDING_UPDATE_ACTION,
            {
              type: "provider-binding",
              id: capability,
              attributes: {
                providerId,
                scope,
                ...(scope === "SYSTEM" ? {} : { scopeId }),
                priority
              }
            }
          );
          providerAudit.append(providerAuditEventV010({
            action: "UPDATE_PROVIDER_BINDING",
            outcome: decision.allowed ? "ALLOWED" : "DENIED",
            actorId: decision.actorId,
            ...(decision.policyProviderId ? { policyProviderId: decision.policyProviderId } : {}),
            correlationId: action.sourceInteractionId,
            capability,
            providerId,
            scope,
            ...(scope === "SYSTEM" ? {} : { scopeId }),
            reason: decision.reason
          }));
          if (!decision.allowed) {
            return json(response, 403, {
              ok: false,
              correlationId: action.sourceInteractionId,
              error: {
                code: decision.reason,
                message: "Provider binding change requires authorization policy approval."
              }
            });
          }

          providerBindings.save({
            contractVersion: "0.1.0",
            capability,
            providerId,
            scope: scope as import("../contracts/package.js").ActivationScope,
            ...(scope === "SYSTEM" ? {} : { scopeId }),
            ...(priority !== 0 ? { priority } : {})
          });

          return json(response, 200, {
            ok: true,
            correlationId: action.sourceInteractionId,
            result: {
              message: "Provider binding saved.",
              capability,
              providerId,
              scope,
              scopeId: scope === "SYSTEM" ? undefined : scopeId,
              priority
            }
          });
        } catch (error) {
          return json(response, 422, {
            ok: false,
            error: {
              code: "PROVIDER_BINDING_UPDATE_REJECTED",
              message: error instanceof Error ? error.message : String(error)
            }
          });
        }
      }

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
