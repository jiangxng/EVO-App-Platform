import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createPackageCatalog } from "../catalog/catalog.js";
import { createFileLifecycleStore, createMemoryLifecycleStore } from "./store.js";
import { createFileSettingsStore, createMemorySettingsStore } from "./settings-store.js";
import {
  createEncryptedFileSecretStoreV010,
  createMemorySecretStoreV010
} from "./secret-store.js";
import { createAppManagerService } from "./service.js";
import {
  createPrincipalContextRegistryV010,
  createSessionContextRegistryV010
} from "./principal-context.js";
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
import { createEnterpriseAgentHostToolCatalogV010 } from "../agents/enterprise-agent/host-tool-catalog.js";
import {
  ENTERPRISE_AGENT_PACKAGE_ID,
  ENTERPRISE_AGENT_PAGE_SOURCE,
  ENTERPRISE_AGENT_SETUP_PAGE_SOURCE
} from "../agents/enterprise-agent/package.js";
import {
  createPersonalAgentChatPageV020,
  createPersonalAgentSetupPageV010,
  evaluatePersonalAgentReadinessV010,
  PERSONAL_AGENT_ROUTE,
  PERSONAL_AGENT_SETUP_ROUTE
} from "./personal-agent-experience.js";
import type { LlmInferenceProvider } from "../contracts/llm.js";
import type {
  AuthorizationProviderV010,
  EnterpriseContextGrantProviderV010,
  EnterpriseContextProviderV010,
  EnterpriseContextRelationshipProviderV010,
  IdentitySessionProviderV010,
  IdentitySessionV010,
  ManagedSecretsProviderV010,
  RequestIdentitySessionProviderV010,
  SecretReferenceV010
} from "../contracts/platform-services.js";
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
  HOST_ENCRYPTED_SECRETS_PACKAGE_ID,
  HOST_ENCRYPTED_SECRETS_PROVIDER_ID,
  SECRETS_RESOLVE_CAPABILITY,
  hostEncryptedSecretsProviderPackage
} from "../providers/secrets/package.js";
import {
  createHostEncryptedSecretsHealthProbeV010,
  createHostEncryptedSecretsProviderV010
} from "../providers/secrets/runtime.js";
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
import {
  ENTERPRISE_CONTEXT_CAPABILITY,
  HOST_ENTERPRISE_CONTEXT_PACKAGE_ID,
  HOST_ENTERPRISE_CONTEXT_PROVIDER_ID,
  hostEnterpriseContextProviderPackage
} from "../providers/enterprise-context/package.js";
import {
  createHostEnterpriseContextHealthProbeV010,
  createHostEnterpriseContextProviderV010,
  parseHostEnterpriseContextsV010
} from "../providers/enterprise-context/runtime.js";
import {
  HOST_STATIC_SESSION_PACKAGE_ID,
  HOST_STATIC_SESSION_PROVIDER_ID,
  IDENTITY_SESSION_CAPABILITY,
  hostStaticSessionProviderPackage
} from "../providers/session/package.js";
import {
  createHostStaticSessionHealthProbeV010,
  createHostStaticSessionProviderV010,
  parseHostStaticSessionV010
} from "../providers/session/runtime.js";
import {
  HOST_BEARER_SESSION_PACKAGE_ID,
  HOST_BEARER_SESSION_PROVIDER_ID,
  REQUEST_IDENTITY_SESSION_CAPABILITY,
  hostBearerSessionProviderPackage
} from "../providers/request-session/package.js";
import {
  createHostBearerSessionHealthProbeV010,
  createHostBearerSessionProviderV010,
  parseHostBearerSessionsV010
} from "../providers/request-session/runtime.js";
import {
  ENTERPRISE_MEMBERSHIP_CAPABILITY,
  HOST_ENTERPRISE_CONTEXT_GRANT_PACKAGE_ID,
  HOST_ENTERPRISE_CONTEXT_GRANT_PROVIDER_ID,
  hostEnterpriseContextGrantProviderPackage
} from "../providers/enterprise-context-grant/package.js";
import {
  createHostEnterpriseContextGrantHealthProbeV010,
  createHostEnterpriseContextGrantProviderV010,
  parseHostEnterpriseContextGrantsV010
} from "../providers/enterprise-context-grant/runtime.js";
import {
  ENTERPRISE_RELATIONSHIP_CAPABILITY,
  HOST_ENTERPRISE_RELATIONSHIP_PACKAGE_ID,
  HOST_ENTERPRISE_RELATIONSHIP_PROVIDER_ID,
  hostEnterpriseRelationshipProviderPackage
} from "../providers/enterprise-relationship/package.js";
import {
  createHostEnterpriseRelationshipHealthProbeV010,
  createHostEnterpriseRelationshipProviderV010
} from "../providers/enterprise-relationship/runtime.js";
import {
  createFileEnterpriseContextGovernanceStoreV010,
  createMemoryEnterpriseContextGovernanceStoreV010
} from "./enterprise-context-governance-store.js";
import {
  createEnterpriseContextCreationActionHandlerV010
} from "./enterprise-context-creation.js";
import {
  createPlatformRequestContextV010,
  identitySessionRequestFromHeadersV010
} from "./request-context.js";
import { authorizeMaterialWriteV010 } from "./material-write-authorization.js";
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
  secretReferenceForPackageV010,
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
  createJsonlSecretAuditStoreV010,
  createMemorySecretAuditStoreV010,
  SECRET_VALUE_MANAGE_ACTION,
  secretAuditEventV010
} from "./secret-governance.js";
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
  hostEncryptedSecretsProviderPackage,
  hostEnterpriseContextProviderPackage,
  hostStaticSessionProviderPackage,
  hostBearerSessionProviderPackage,
  hostEnterpriseContextGrantProviderPackage,
  hostEnterpriseRelationshipProviderPackage,
  tradingLitePackage
]);
const lifecycleStateFile = process.env.APP_PLATFORM_STATE_FILE?.trim();
const store = lifecycleStateFile ? createFileLifecycleStore(lifecycleStateFile) : createMemoryLifecycleStore();
const enterpriseGovernanceStateFile = process.env.APP_PLATFORM_ENTERPRISE_GOVERNANCE_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "enterprise-governance.json") : undefined);
const enterpriseGovernanceStore = enterpriseGovernanceStateFile
  ? createFileEnterpriseContextGovernanceStoreV010(enterpriseGovernanceStateFile)
  : createMemoryEnterpriseContextGovernanceStoreV010();
const settingsStateFile = process.env.APP_PLATFORM_SETTINGS_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "settings.json") : undefined);
const settingsStore = settingsStateFile
  ? createFileSettingsStore(settingsStateFile)
  : createMemorySettingsStore();
const secretsStateFile = process.env.APP_PLATFORM_SECRETS_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "secrets.enc.json") : undefined);
const secretsKeyFile = process.env.APP_PLATFORM_SECRETS_KEY_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "secrets.master.key") : undefined);
const secretStore = secretsStateFile && secretsKeyFile
  ? createEncryptedFileSecretStoreV010(secretsStateFile, secretsKeyFile)
  : createMemorySecretStoreV010();
const secretAuditFile = process.env.APP_PLATFORM_SECRET_AUDIT_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "secret-audit.jsonl") : undefined);
const secretAudit = secretAuditFile
  ? createJsonlSecretAuditStoreV010(secretAuditFile)
  : createMemorySecretAuditStoreV010();
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

const hostBearerSessions = parseHostBearerSessionsV010(
  process.env.APP_PLATFORM_BEARER_SESSIONS_JSON
);
if (hostBearerSessions) {
  const requestSessionProvider = createHostBearerSessionProviderV010(hostBearerSessions);
  providerRuntimeRegistry.replace<RequestIdentitySessionProviderV010>(
    HOST_BEARER_SESSION_PROVIDER_ID,
    requestSessionProvider
  );
  providerRuntimeRegistry.setHealthProbe(
    HOST_BEARER_SESSION_PROVIDER_ID,
    createHostBearerSessionHealthProbeV010(hostBearerSessions)
  );
  providerRuntimeRegistry.setHealth(HOST_BEARER_SESSION_PROVIDER_ID, {
    state: hostBearerSessions.length > 0 ? "HEALTHY" : "DEGRADED",
    message: `Request-bound bearer Session directory loaded with ${hostBearerSessions.length} session(s).`,
    checkedAt: new Date().toISOString()
  });
}

const hostStaticSession = parseHostStaticSessionV010(
  process.env.APP_PLATFORM_STATIC_SESSION_JSON
);
if (hostStaticSession) {
  const sessionProvider = createHostStaticSessionProviderV010(hostStaticSession);
  providerRuntimeRegistry.replace<IdentitySessionProviderV010>(
    HOST_STATIC_SESSION_PROVIDER_ID,
    sessionProvider
  );
  providerRuntimeRegistry.setHealthProbe(
    HOST_STATIC_SESSION_PROVIDER_ID,
    createHostStaticSessionHealthProbeV010(sessionProvider)
  );
  providerRuntimeRegistry.setHealth(HOST_STATIC_SESSION_PROVIDER_ID, {
    state: sessionProvider.current() ? "HEALTHY" : "UNAVAILABLE",
    message: sessionProvider.current()
      ? `Static session loaded for subject '${hostStaticSession.principal.subjectId}'.`
      : "Static session is expired or unavailable.",
    checkedAt: new Date().toISOString()
  });
}

const hostEnterpriseContextGrants = parseHostEnterpriseContextGrantsV010(
  process.env.APP_PLATFORM_ENTERPRISE_CONTEXT_GRANTS_JSON
) ?? [];
providerRuntimeRegistry.replace<EnterpriseContextGrantProviderV010>(
  HOST_ENTERPRISE_CONTEXT_GRANT_PROVIDER_ID,
  createHostEnterpriseContextGrantProviderV010(
    hostEnterpriseContextGrants,
    () => enterpriseGovernanceStore.snapshot().grants
  )
);
providerRuntimeRegistry.setHealthProbe(
  HOST_ENTERPRISE_CONTEXT_GRANT_PROVIDER_ID,
  createHostEnterpriseContextGrantHealthProbeV010(
    hostEnterpriseContextGrants,
    () => enterpriseGovernanceStore.snapshot().grants
  )
);
providerRuntimeRegistry.setHealth(HOST_ENTERPRISE_CONTEXT_GRANT_PROVIDER_ID, {
  state: "HEALTHY",
  message: "Host Enterprise Context Grant Provider is active.",
  checkedAt: new Date().toISOString()
});

providerRuntimeRegistry.replace<EnterpriseContextRelationshipProviderV010>(
  HOST_ENTERPRISE_RELATIONSHIP_PROVIDER_ID,
  createHostEnterpriseRelationshipProviderV010(
    () => enterpriseGovernanceStore.snapshot().relationships
  )
);
providerRuntimeRegistry.setHealthProbe(
  HOST_ENTERPRISE_RELATIONSHIP_PROVIDER_ID,
  createHostEnterpriseRelationshipHealthProbeV010(
    () => enterpriseGovernanceStore.snapshot().relationships
  )
);
providerRuntimeRegistry.setHealth(HOST_ENTERPRISE_RELATIONSHIP_PROVIDER_ID, {
  state: "HEALTHY",
  message: "Host Enterprise Relationship Provider is active.",
  checkedAt: new Date().toISOString()
});

const hostEnterpriseContexts = parseHostEnterpriseContextsV010(
  process.env.APP_PLATFORM_ENTERPRISE_CONTEXTS_JSON
) ?? [];
providerRuntimeRegistry.replace<EnterpriseContextProviderV010>(
  HOST_ENTERPRISE_CONTEXT_PROVIDER_ID,
  createHostEnterpriseContextProviderV010(
    hostEnterpriseContexts,
    () => enterpriseGovernanceStore.snapshot().contexts
  )
);
providerRuntimeRegistry.setHealthProbe(
  HOST_ENTERPRISE_CONTEXT_PROVIDER_ID,
  createHostEnterpriseContextHealthProbeV010(
    hostEnterpriseContexts,
    () => enterpriseGovernanceStore.snapshot().contexts
  )
);
providerRuntimeRegistry.setHealth(HOST_ENTERPRISE_CONTEXT_PROVIDER_ID, {
  state: "HEALTHY",
  message: "Host Enterprise Context Provider is active.",
  checkedAt: new Date().toISOString()
});
providerRuntimeRegistry.replace<ManagedSecretsProviderV010>(
  HOST_ENCRYPTED_SECRETS_PROVIDER_ID,
  createHostEncryptedSecretsProviderV010(secretStore)
);
providerRuntimeRegistry.setHealthProbe(
  HOST_ENCRYPTED_SECRETS_PROVIDER_ID,
  createHostEncryptedSecretsHealthProbeV010(secretStore)
);
providerRuntimeRegistry.setHealth(HOST_ENCRYPTED_SECRETS_PROVIDER_ID, {
  state: "HEALTHY",
  message: secretsStateFile
    ? "Encrypted Host secret store is configured."
    : "In-memory Host secret store is active for this process.",
  checkedAt: new Date().toISOString()
});
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
const installedAtStartup = manager.getSnapshot().installedPackages;
if (
  hostBearerSessions
  && !installedAtStartup.some(item => item.packageId === HOST_BEARER_SESSION_PACKAGE_ID)
) {
  try {
    manager.install(HOST_BEARER_SESSION_PACKAGE_ID);
    console.log("Activated request-bound Host Bearer Session Provider.");
  } catch (error) {
    console.error("Failed to activate Host Bearer Session Provider.", error);
  }
}
if (!installedAtStartup.some(item => item.packageId === HOST_ENTERPRISE_RELATIONSHIP_PACKAGE_ID)) {
  try {
    manager.install(HOST_ENTERPRISE_RELATIONSHIP_PACKAGE_ID);
    console.log("Activated Host Enterprise Relationship Provider.");
  } catch (error) {
    console.error("Failed to activate Host Enterprise Relationship Provider.", error);
  }
}
if (
  hostStaticSession
  && !installedAtStartup.some(item => item.packageId === HOST_STATIC_SESSION_PACKAGE_ID)
) {
  try {
    manager.install(HOST_STATIC_SESSION_PACKAGE_ID);
    console.log("Activated Host Static Session Provider.");
  } catch (error) {
    console.error("Failed to activate Host Static Session Provider.", error);
  }
}
if (
  hostEnterpriseContextGrants
  && !installedAtStartup.some(item => item.packageId === HOST_ENTERPRISE_CONTEXT_GRANT_PACKAGE_ID)
) {
  try {
    manager.install(HOST_ENTERPRISE_CONTEXT_GRANT_PACKAGE_ID);
    console.log("Activated Host Enterprise Context Grant Provider.");
  } catch (error) {
    console.error("Failed to activate Host Enterprise Context Grant Provider.", error);
  }
}
if (
  hostEnterpriseContexts
  && !installedAtStartup.some(item => item.packageId === HOST_ENTERPRISE_CONTEXT_PACKAGE_ID)
) {
  try {
    manager.install(HOST_ENTERPRISE_CONTEXT_PACKAGE_ID);
    console.log("Activated Host Enterprise Context Provider from Host-owned configuration.");
  } catch (error) {
    console.error("Failed to activate Host Enterprise Context Provider.", error);
  }
}
const hasInstalledSecretConsumer = installedAtStartup.some(installed => {
  const pkg = manager.listCatalog().find(item => item.packageId === installed.packageId);
  return (pkg?.secrets?.length ?? 0) > 0;
});
if (
  hasInstalledSecretConsumer
  && !installedAtStartup.some(item => item.packageId === HOST_ENCRYPTED_SECRETS_PACKAGE_ID)
) {
  try {
    manager.install(HOST_ENCRYPTED_SECRETS_PACKAGE_ID);
    console.log("Migrated installed Secret consumers onto Host encrypted secrets Provider.");
  } catch (error) {
    console.error("Failed to migrate installed Secret consumers onto Host encrypted secrets Provider.", error);
  }
}

function resolveManagedSecretsProvider(): ManagedSecretsProviderV010 | undefined {
  return resolveProviderRuntimeV010<ManagedSecretsProviderV010>(
    providerRuntimeRegistry,
    manager.listEffectiveServiceProviders(SECRETS_RESOLVE_CAPABILITY),
    providerBindings,
    SECRETS_RESOLVE_CAPABILITY,
    { installationId: "default" }
  )?.runtime;
}

function resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined {
  return resolveProviderRuntimeV010<AuthorizationProviderV010>(
    providerRuntimeRegistry,
    manager.listEffectiveServiceProviders(AUTHORIZATION_CHECK_CAPABILITY),
    providerBindings,
    AUTHORIZATION_CHECK_CAPABILITY,
    { installationId: "default" }
  )?.runtime;
}

function resolveEnterpriseContextProvider(): EnterpriseContextProviderV010 | undefined {
  return resolveProviderRuntimeV010<EnterpriseContextProviderV010>(
    providerRuntimeRegistry,
    manager.listEffectiveServiceProviders(ENTERPRISE_CONTEXT_CAPABILITY),
    providerBindings,
    ENTERPRISE_CONTEXT_CAPABILITY,
    { installationId: "default" }
  )?.runtime;
}

function resolveEnterpriseContextGrantProvider(): EnterpriseContextGrantProviderV010 | undefined {
  return resolveProviderRuntimeV010<EnterpriseContextGrantProviderV010>(
    providerRuntimeRegistry,
    manager.listEffectiveServiceProviders(ENTERPRISE_MEMBERSHIP_CAPABILITY),
    providerBindings,
    ENTERPRISE_MEMBERSHIP_CAPABILITY,
    { installationId: "default" }
  )?.runtime;
}

function resolveEnterpriseContextRelationshipProvider(): EnterpriseContextRelationshipProviderV010 | undefined {
  return resolveProviderRuntimeV010<EnterpriseContextRelationshipProviderV010>(
    providerRuntimeRegistry,
    manager.listEffectiveServiceProviders(ENTERPRISE_RELATIONSHIP_CAPABILITY),
    providerBindings,
    ENTERPRISE_RELATIONSHIP_CAPABILITY,
    { installationId: "default" }
  )?.runtime;
}

function resolveIdentitySession(): IdentitySessionV010 {
  const descriptors = manager.listEffectiveServiceProviders(IDENTITY_SESSION_CAPABILITY);
  if (descriptors.length === 0) {
    return {
      contractVersion: "0.1.0",
      sessionId: "compatibility-local-session",
      principal: {
        contractVersion: "0.1.0",
        subjectId: evoActorId,
        actorType: evoActorType,
        identityProviderId: "host.compatibility-local",
        displayName: evoActorId
      },
      issuedAt: new Date(0).toISOString(),
      assurance: ["COMPATIBILITY_LOCAL"]
    };
  }

  const resolved = resolveProviderRuntimeV010<IdentitySessionProviderV010>(
    providerRuntimeRegistry,
    descriptors,
    providerBindings,
    IDENTITY_SESSION_CAPABILITY,
    { installationId: "default" }
  );
  if (!resolved) throw new Error("IDENTITY_SESSION_PROVIDER_UNAVAILABLE");

  const session = resolved.runtime.current();
  if (!session) throw new Error("IDENTITY_SESSION_REQUIRED");
  return session;
}

function resolveRequestIdentitySession(request: IncomingMessage): IdentitySessionV010 {
  const descriptors = manager.listEffectiveServiceProviders(
    REQUEST_IDENTITY_SESSION_CAPABILITY
  );
  if (descriptors.length === 0) {
    return resolveIdentitySession();
  }

  const resolved = resolveProviderRuntimeV010<RequestIdentitySessionProviderV010>(
    providerRuntimeRegistry,
    descriptors,
    providerBindings,
    REQUEST_IDENTITY_SESSION_CAPABILITY,
    { installationId: "default" }
  );
  if (!resolved) throw new Error("REQUEST_IDENTITY_SESSION_PROVIDER_UNAVAILABLE");

  const session = resolved.runtime.resolve(
    identitySessionRequestFromHeadersV010(request.headers)
  );
  if (!session) throw new Error("REQUEST_IDENTITY_SESSION_REQUIRED");
  return session;
}

function principalContextSources() {
  return {
    enterpriseDirectory: resolveEnterpriseContextProvider(),
    enterpriseGrants: resolveEnterpriseContextGrantProvider()
  };
}

function createContextRegistryForSession(session: IdentitySessionV010) {
  return createSessionContextRegistryV010(session, principalContextSources());
}

async function authorizeHostAdministration(
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

function openAiApiKeyReference(): SecretReferenceV010 {
  return {
    contractVersion: "0.1.0",
    namespace: OPENAI_LLM_PACKAGE_ID,
    key: "apiKey",
    scope: "INSTALLATION",
    scopeId: "default"
  };
}

async function refreshOpenAiProviderRuntime(): Promise<void> {
  const reference = openAiApiKeyReference();
  const legacyApiKey = process.env.OPENAI_API_KEY?.trim();
  let apiKey: string | undefined;

  try {
    const secrets = resolveManagedSecretsProvider();
    if (secrets) {
      const status = await secrets.describe(reference);
      if (!status.configured && legacyApiKey) {
        await secrets.put(reference, legacyApiKey);
        console.log("Migrated legacy OpenAI credential into Host Secrets Provider.");
      }
      const refreshedStatus = await secrets.describe(reference);
      if (refreshedStatus.configured) {
        apiKey = (await secrets.resolve(reference)).trim();
      }
    }
  } catch (error) {
    console.error("OpenAI Secret resolution failed closed.", error);
  }

  // Compatibility fallback only. New configuration must use the Host Secrets Provider.
  if (!apiKey && legacyApiKey) apiKey = legacyApiKey;

  if (!apiKey) {
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
    apiKey,
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
    message: "Runtime credential is configured through the Host Secrets boundary; external service health has not been actively probed.",
    checkedAt: new Date().toISOString()
  });
}

await refreshOpenAiProviderRuntime();

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
      resolveLlmProvider,
      resolveIdentitySession,
      resolveContext(selection, session) {
        return createContextRegistryForSession(session).resolve(selection);
      },
      createToolCatalog(locale, context, principal) {
        const contextRegistry = createPrincipalContextRegistryV010(
          principal,
          principalContextSources()
        );
        return createEnterpriseAgentHostToolCatalogV010({
          manager,
          principal,
          context,
          listAvailableContexts() {
            return contextRegistry.list();
          },
          listProviderBindings(capability) {
            return providerBindings.list(capability);
          },
          getProviderHealth(providerId) {
            return providerRuntimeRegistry.getHealth(providerId);
          },
          searchHelp(query, helpContext) {
            return searchHelpV010(helpCorpus, query, locale, helpContext);
          }
        });
      }
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
  response.setHeader(
    "access-control-allow-headers",
    "content-type,accept,authorization,x-evo-session-id,x-evo-context-id"
  );
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
    if (request.method === "GET" && url.pathname === "/v1/contexts/effective") {
      const session = resolveRequestIdentitySession(request);
      const contextRegistry = createContextRegistryForSession(session);
      return json(response, 200, {
        contractVersion: "0.1.0",
        session: {
          sessionId: session.sessionId,
          principal: session.principal
        },
        personalContext: contextRegistry.personal(),
        availableContexts: contextRegistry.list(),
        defaultActiveContext: contextRegistry.resolve().activeContext
      });
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
      const decision = await authorizeHostAdministration(
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
      const decision = await authorizeHostAdministration(
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
      if (
        source === ENTERPRISE_AGENT_PAGE_SOURCE
        || source === ENTERPRISE_AGENT_SETUP_PAGE_SOURCE
      ) {
        const effective = manager.listEffectiveExperiences().some(value => {
          const manifest = value as { pages?: Array<{ source?: string }> };
          return manifest.pages?.some(page => page.source === source) === true;
        });
        if (!effective) {
          return json(response, 404, { code: "PAGE_NOT_EFFECTIVE_OR_NOT_FOUND" });
        }

        const readiness = evaluatePersonalAgentReadinessV010(
          manager,
          providerRuntimeRegistry,
          providerBindings
        );
        if (source === ENTERPRISE_AGENT_SETUP_PAGE_SOURCE) {
          return json(response, 200, createPersonalAgentSetupPageV010(readiness));
        }

        const session = resolveRequestIdentitySession(request);
        const contextRegistry = createContextRegistryForSession(session);
        const context = contextRegistry.resolve();
        const availableContexts = contextRegistry.list().map(ref => {
          const resolved = contextRegistry.resolve(ref);
          return {
            ref,
            label: ref.kind === "PERSONAL"
              ? resolved.personalContext.displayName ?? ref.contextId
              : resolved.enterpriseContext?.displayName ?? ref.contextId
          };
        });
        return json(
          response,
          200,
          createPersonalAgentChatPageV020(readiness, context, availableContexts)
        );
      }
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
            evaluateRuntime: evaluateRuntimeForHost,
            evaluateProductState(pkg, lifecycle) {
              if (
                pkg.packageId !== ENTERPRISE_AGENT_PACKAGE_ID
                || !lifecycle.isInstalled
                || !lifecycle.isEnabled
              ) {
                return undefined;
              }
              const readiness = evaluatePersonalAgentReadinessV010(
                manager,
                providerRuntimeRegistry,
                providerBindings
              );
              const readinessId = readiness.state === "unavailable"
                ? "error"
                : readiness.state;
              return {
                readiness: {
                  id: readinessId,
                  label: readiness.state === "ready"
                    ? "Ready"
                    : readiness.state === "setup-required"
                      ? "Needs setup"
                      : readiness.state === "degraded"
                        ? "Degraded"
                        : "Unavailable",
                  tone: readiness.state === "ready"
                    ? "positive"
                    : readiness.state === "setup-required"
                      ? "warning"
                      : readiness.state === "degraded"
                        ? "warning"
                        : "danger",
                  message: readiness.message
                },
                primaryAction: readiness.state === "ready" || readiness.state === "degraded"
                  ? {
                      id: "open",
                      label: "Open",
                      type: "navigate",
                      route: PERSONAL_AGENT_ROUTE
                    }
                  : {
                      id: "setup",
                      label: "Set up",
                      type: "navigate",
                      route: PERSONAL_AGENT_SETUP_ROUTE
                    }
              };
            }
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
        const settingsPage = await createSettingsPage(
          manager,
          settingsStore,
          settingsPackageId,
          async reference => {
            try {
              return await resolveManagedSecretsProvider()?.describe(reference);
            } catch {
              return undefined;
            }
          },
          { installationId: "default" },
          requestedLocale(url)
        );
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
          const decision = await authorizeHostAdministration(
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
          const values = rawSettings as Record<string, unknown>;
          const pkg = manager.listCatalog().find(item => item.packageId === namespace);
          if (!pkg || !manager.getSnapshot().installedPackages.some(item => item.packageId === namespace)) {
            throw new Error(`SETTINGS_NAMESPACE_NOT_INSTALLED: ${namespace}`);
          }

          const secretChanges: Array<{
            operation: "PUT" | "REMOVE";
            reference: SecretReferenceV010;
            value?: string;
            authorization?: {
              actorId: string;
              policyProviderId?: string;
              reason: string;
            };
          }> = [];

          for (const declaration of pkg.secrets ?? []) {
            const reference = secretReferenceForPackageV010(
              pkg.packageId,
              declaration,
              { installationId: "default" }
            );
            const rawValue = values[`secret:${declaration.key}`];
            const remove = values[`secret-remove:${declaration.key}`] === true;
            if (rawValue !== undefined && typeof rawValue !== "string") {
              throw new Error(`SECRET_INPUT_TYPE_INVALID: ${declaration.key}`);
            }
            const nextValue = typeof rawValue === "string" ? rawValue.trim() : "";
            if (remove && nextValue) {
              throw new Error(`SECRET_INPUT_CONFLICT: ${declaration.key}`);
            }
            if (!remove && !nextValue) continue;
            if (!reference) {
              throw new Error(`SECRET_SCOPE_CONTEXT_UNAVAILABLE: ${declaration.key}`);
            }
            secretChanges.push(remove
              ? { operation: "REMOVE", reference }
              : { operation: "PUT", reference, value: nextValue });
          }

          let secretsProvider: ManagedSecretsProviderV010 | undefined;
          if (secretChanges.length > 0) {
            secretsProvider = resolveManagedSecretsProvider();
            if (!secretsProvider) throw new Error("SECRETS_PROVIDER_UNAVAILABLE");

            const adminToken = typeof values.adminToken === "string"
              ? values.adminToken
              : undefined;

            for (const change of secretChanges) {
              const decision = await authorizeHostAdministration(
                adminToken,
                SECRET_VALUE_MANAGE_ACTION,
                {
                  type: "package-secret",
                  id: `${change.reference.namespace}:${change.reference.key}`,
                  attributes: {
                    namespace: change.reference.namespace,
                    key: change.reference.key,
                    scope: change.reference.scope,
                    ...(change.reference.scopeId
                      ? { scopeId: change.reference.scopeId }
                      : {})
                  }
                }
              );

              if (!decision.allowed) {
                secretAudit.append(secretAuditEventV010({
                  action: change.operation === "PUT" ? "PUT_SECRET" : "REMOVE_SECRET",
                  outcome: "DENIED",
                  actorId: decision.actorId,
                  ...(decision.policyProviderId
                    ? { policyProviderId: decision.policyProviderId }
                    : {}),
                  correlationId: action.sourceInteractionId,
                  reference: change.reference,
                  reason: decision.reason
                }));
                return json(response, 403, {
                  ok: false,
                  correlationId: action.sourceInteractionId,
                  error: {
                    code: decision.reason,
                    message: "Secret change requires authorization policy approval."
                  }
                });
              }
              change.authorization = {
                actorId: decision.actorId,
                ...(decision.policyProviderId
                  ? { policyProviderId: decision.policyProviderId }
                  : {}),
                reason: decision.reason
              };
            }
          }

          const saved = validateAndMergeSettings(
            manager,
            settingsStore,
            namespace,
            values
          );

          if (secretsProvider) {
            for (const change of secretChanges) {
              try {
                if (change.operation === "PUT") {
                  await secretsProvider.put(change.reference, change.value!);
                } else {
                  await secretsProvider.remove(change.reference);
                }
                secretAudit.append(secretAuditEventV010({
                  action: change.operation === "PUT" ? "PUT_SECRET" : "REMOVE_SECRET",
                  outcome: "ALLOWED",
                  actorId: change.authorization?.actorId ?? "unknown",
                  ...(change.authorization?.policyProviderId
                    ? { policyProviderId: change.authorization.policyProviderId }
                    : {}),
                  correlationId: action.sourceInteractionId,
                  reference: change.reference,
                  reason: change.authorization?.reason ?? "AUTHORIZED_SECRET_CHANGE"
                }));
              } catch (error) {
                secretAudit.append(secretAuditEventV010({
                  action: change.operation === "PUT" ? "PUT_SECRET" : "REMOVE_SECRET",
                  outcome: "FAILED",
                  actorId: change.authorization?.actorId ?? "unknown",
                  ...(change.authorization?.policyProviderId
                    ? { policyProviderId: change.authorization.policyProviderId }
                    : {}),
                  correlationId: action.sourceInteractionId,
                  reference: change.reference,
                  reason: error instanceof Error ? error.message : String(error)
                }));
                throw error;
              }
            }
          }

          if (namespace === OPENAI_LLM_PACKAGE_ID) {
            await refreshOpenAiProviderRuntime();
          }

          const secretStatus = await Promise.all(
            (pkg.secrets ?? []).map(async declaration => {
              const reference = secretReferenceForPackageV010(
                pkg.packageId,
                declaration,
                { installationId: "default" }
              );
              if (!reference) {
                return {
                  key: declaration.key,
                  configured: false,
                  scopeAvailable: false
                };
              }
              const descriptor = await resolveManagedSecretsProvider()?.describe(reference);
              return {
                key: declaration.key,
                configured: descriptor?.configured === true,
                scopeAvailable: true,
                ...(descriptor?.updatedAt ? { updatedAt: descriptor.updatedAt } : {})
              };
            })
          );

          return json(response, 200, {
            ok: true,
            correlationId: action.sourceInteractionId,
            result: {
              message: secretChanges.length > 0
                ? "Settings and Secrets saved."
                : "Settings saved.",
              namespace,
              settings: saved,
              secrets: secretStatus
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
