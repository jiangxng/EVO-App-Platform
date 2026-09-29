import { createHash, randomUUID } from "node:crypto";
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
import { createHostRealtimeEventBusV010 } from "./realtime-event-bus.js";
import { createEvoRuntimeRevisionBridgeV010 } from "./evo-runtime-revision-bridge.js";
import type { HostRealtimeEventV010 } from "../contracts/realtime-events.js";
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
import { createPersonalAgentRunActionHandlersV010 } from "../agents/enterprise-agent/run-action-handlers.js";
import { createResumableAgentRunExecutorV010 } from "../agents/enterprise-agent/run-runtime.js";
import { createJsonlPersonalAgentQualityEvidenceStoreV010, createMemoryPersonalAgentQualityEvidenceStoreV010 } from "../agents/enterprise-agent/quality-evidence-store.js";
import { createFilePersonalAgentFollowUpStoreV010, createMemoryPersonalAgentFollowUpStoreV010 } from "./personal-agent-follow-up-store.js";
import {
  createAgentActionReceiptServiceV010,
  createJsonlAgentActionReceiptEventStoreV010,
  createMemoryAgentActionReceiptEventStoreV010
} from "./agent-action-receipt-store.js";
import {
  createAgentRunStoreV010,
  createJsonlAgentRunEventStoreV010,
  createMemoryAgentRunEventStoreV010
} from "./agent-run-store.js";
import {
  createConversationThreadStoreV010,
  createJsonlConversationThreadEventStoreV010,
  createMemoryConversationThreadEventStoreV010
} from "./conversation-thread-store.js";
import {
  createFileEnterpriseOperatingGraphStoreV010,
  createMemoryEnterpriseOperatingGraphStoreV010
} from "./enterprise-operating-graph-store.js";
import {
  createEnterpriseOperatingGraphHostServiceV010
} from "./enterprise-operating-graph-service.js";
import {
  createFileEnterpriseOperatingGraphViewStoreV010,
  createMemoryEnterpriseOperatingGraphViewStoreV010
} from "./enterprise-operating-graph-view-store.js";
import {
  createEnterpriseOperatingGraphViewHostServiceV010
} from "./enterprise-operating-graph-view-service.js";
import {
  createFileEogApplicationRuntimeBindingStoreV010,
  createMemoryEogApplicationRuntimeBindingStoreV010
} from "./enterprise-operating-graph-application-runtime-store.js";
import {
  createEogApplicationRuntimeBindingServiceV010
} from "./enterprise-operating-graph-application-runtime-service.js";
import {
  createFileEogExpectedSopStoreV010,
  createMemoryEogExpectedSopStoreV010
} from "./enterprise-operating-graph-sop-store.js";
import {
  createEogExpectedSopServiceV010
} from "./enterprise-operating-graph-sop-service.js";
import {
  createEogExpectedSopActionHandlersV010
} from "./enterprise-operating-graph-sop-actions.js";
import {
  createEogExpectedSopAgentToolRegistrationsV010
} from "./enterprise-operating-graph-sop-agent-tools.js";
import {
  createEnterpriseOperatingGraphActionHandlersV010
} from "./enterprise-operating-graph-actions.js";
import {
  createEnterpriseOperatingGraphAgentToolRegistrationsV010
} from "./enterprise-operating-graph-agent-tools.js";
import {
  createEnterpriseOperatingGraphEditorPageV010,
  createEnterpriseOperatingGraphExperienceManifestV010,
  createEnterpriseOperatingGraphViewActionHandlersV010,
  EOG_EDITOR_PAGE_SOURCE
} from "./enterprise-operating-graph-page.js";
import {
  createEnterpriseOperatingGraphObservatoryProviderResolverV020
} from "./enterprise-operating-graph-observatory-provider.js";
import {
  createEnterpriseOperatingGraphObservatoryActionHandlersV020
} from "./enterprise-operating-graph-observatory-actions.js";
import {
  createEnterpriseOperatingGraphObservatoryAgentToolRegistrationsV020
} from "./enterprise-operating-graph-observatory-agent-tools.js";
import {
  createEnterpriseOperatingGraphObservatoryExperienceManifestV020,
  createEnterpriseOperatingGraphObservatoryPageV020,
  createEnterpriseOperatingGraphObservatoryViewActionHandlerV020,
  EOG_OBSERVATORY_PAGE_SOURCE
} from "./enterprise-operating-graph-observatory-page.js";
import {
  createEnterpriseOperatingGraphSpatialObservatoryActionHandlerV020,
  createEnterpriseOperatingGraphSpatialObservatoryExperienceManifestV020,
  createEnterpriseOperatingGraphSpatialObservatoryPageV020,
  EOG_SPATIAL_OBSERVATORY_PAGE_SOURCE
} from "./enterprise-operating-graph-spatial-observatory-page.js";
import { createPersonalAgentThreadActionHandlersV010 } from "../agents/enterprise-agent/thread-action-handlers.js";
import { createThreadBackedAgentTurnActionHandlersV010 } from "../agents/enterprise-agent/thread-turn-action-handlers.js";
import {
  createConversationRetentionPolicyGetActionHandlerV010,
  createConversationRetentionPreviewActionHandlerV010
} from "../agents/enterprise-agent/thread-retention-action-handler.js";
import { createPersonalAgentFollowUpActionHandlersV010 } from "./personal-agent-follow-up-actions.js";
import { createPersonalAgentFollowUpPageV010 } from "./personal-agent-follow-up-page.js";
import { createPersonalAgentQualityEvaluationActionHandlerV010 } from "../agents/enterprise-agent/quality-evaluation-actions.js";
import { createEnterpriseAgentHostToolCatalogV010 } from "../agents/enterprise-agent/host-tool-catalog.js";
import { createPersonalAgentQualityPageV010, createPersonalAgentQualityReviewPageV010 } from "./personal-agent-quality-page.js";
import { createFileContextMemoryQualityStoreV010, createMemoryContextMemoryQualityStoreV010 } from "./context-memory-quality-store.js";
import { createFileContextMemoryFreshnessPolicyStoreV010, createMemoryContextMemoryFreshnessPolicyStoreV010 } from "./context-memory-freshness-policy-store.js";
import { createContextMemoryFreshnessPolicyActionHandlersV010 } from "./context-memory-freshness-policy-actions.js";
import { createContextMemoryQualityActionHandlerV010 } from "./context-memory-quality-actions.js";
import {
  ENTERPRISE_AGENT_PACKAGE_ID,
  ENTERPRISE_AGENT_FEATURE_ID,
  ENTERPRISE_AGENT_PAGE_SOURCE,
  ENTERPRISE_AGENT_SETUP_PAGE_SOURCE,
  ENTERPRISE_AGENT_MEMORY_REVIEW_PAGE_SOURCE,
  ENTERPRISE_AGENT_QUALITY_PAGE_SOURCE,
  ENTERPRISE_AGENT_QUALITY_REVIEW_PAGE_SOURCE,
  ENTERPRISE_AGENT_FOLLOW_UP_PAGE_SOURCE
} from "../agents/enterprise-agent/package.js";
import {
  createPersonalAgentChatPageV020,
  createPersonalAgentSetupPageV010,
  createPersonalAgentMemoryReviewPageV010,
  createPersonalAgentPluginStoreProductStateV010,
  evaluatePersonalAgentReadinessV010,
  PERSONAL_AGENT_ROUTE,
  PERSONAL_AGENT_SETUP_ROUTE,
  PERSONAL_AGENT_MEMORY_REVIEW_ROUTE
} from "./personal-agent-experience.js";
import type { LlmInferenceProvider } from "../contracts/llm.js";
import type {
  ActiveContextRefV010,
  AuthorizationProviderV010,
  ContextMemoryDlpClassifierV010,
  ContextMemoryEvidenceSourceProviderV010,
  ContextMemoryGovernanceProviderV010,
  ContextMemoryIntakeSourceAdapterV010,
  ContextMemoryInventoryReaderV010,
  ContextMemoryReaderV010,
  ContextMemorySemanticRetrieverV010,
  ContextMemoryWriterV010,
  EnterpriseContextGrantProviderV010,
  EnterpriseContextProviderV010,
  EnterpriseContextRelationshipProviderV010,
  IdentitySessionProviderV010,
  IdentitySessionV010,
  ManagedSecretsProviderV010,
  PlatformPrincipalV010,
  PlatformRequestContextV010,
  ResolvedContextSetV010,
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
import { createDeepSeekResponsesHealthProbe, createDeepSeekResponsesLlmProvider } from "../providers/deepseek/runtime.js";
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
  DEEPSEEK_LLM_PACKAGE_ID,
  DEEPSEEK_LLM_PROVIDER_ID,
  deepSeekLlmProviderPackage
} from "../providers/deepseek/package.js";
import {
  AUTHORIZATION_CHECK_CAPABILITY,
  HOST_STATIC_AUTHORIZATION_PACKAGE_ID,
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
  CONTEXT_MEMORY_GOVERNANCE_CAPABILITY,
  CONTEXT_MEMORY_INVENTORY_CAPABILITY,
  CONTEXT_MEMORY_READ_CAPABILITY,
  CONTEXT_MEMORY_WRITE_CAPABILITY,
  HOST_CONTEXT_MEMORY_GOVERNANCE_PROVIDER_ID,
  HOST_CONTEXT_MEMORY_INVENTORY_PROVIDER_ID,
  HOST_CONTEXT_MEMORY_PACKAGE_ID,
  HOST_CONTEXT_MEMORY_READER_PROVIDER_ID,
  HOST_CONTEXT_MEMORY_WRITER_PROVIDER_ID,
  hostContextMemoryProviderPackage
} from "../providers/context-memory/package.js";
import {
  createHostContextMemoryHealthProbeV010,
  createHostContextMemoryInventoryReaderV010,
  createHostContextMemoryReaderV010,
  createHostContextMemoryWriterV010
} from "../providers/context-memory/runtime.js";
import {
  createHostContextMemoryGovernanceProviderV010
} from "../providers/context-memory/governance.js";
import {
  CONTEXT_MEMORY_SEMANTIC_RETRIEVAL_CAPABILITY,
  REMOTE_CONTEXT_MEMORY_SEMANTIC_PACKAGE_ID,
  REMOTE_CONTEXT_MEMORY_SEMANTIC_PROVIDER_ID,
  remoteContextMemorySemanticProviderPackage
} from "../providers/context-memory-semantic/package.js";
import {
  createRemoteContextMemorySemanticHealthProbeV010,
  createRemoteContextMemorySemanticRetrieverV010
} from "../providers/context-memory-semantic/runtime.js";
import {
  CONTEXT_MEMORY_DLP_CLASSIFICATION_CAPABILITY,
  REMOTE_CONTEXT_MEMORY_DLP_PACKAGE_ID,
  REMOTE_CONTEXT_MEMORY_DLP_PROVIDER_ID,
  remoteContextMemoryDlpProviderPackage
} from "../providers/context-memory-dlp/package.js";
import {
  createRemoteContextMemoryDlpClassifierV010,
  createRemoteContextMemoryDlpHealthProbeV010
} from "../providers/context-memory-dlp/runtime.js";
import {
  EXPERIENCE_COMPILER_EVIDENCE_PROVIDER_ID,
  EXPERIENCE_COMPILER_MEMORY_INTAKE_PACKAGE_ID,
  EXPERIENCE_COMPILER_MEMORY_INTAKE_PROVIDER_ID,
  experienceCompilerMemoryIntakeProviderPackage
} from "../providers/experience-compiler-memory/package.js";
import {
  createExperienceCompilerEvidenceSourceProviderV010,
  createExperienceCompilerMemoryIntakeHealthProbeV010,
  createExperienceCompilerMemoryIntakeSourceAdapterV010,
  parseExperienceCompilerMemoryIntakeConfigV010
} from "../providers/experience-compiler-memory/runtime.js";
import {
  EVO_RUNTIME_OBSERVATORY_PACKAGE_ID,
  EVO_RUNTIME_OBSERVATORY_PROVIDER_ID,
  evoRuntimeObservatoryProviderPackage
} from "../providers/evo-runtime-observatory/package.js";
import {
  EOG_BOTTLENECK_ANALYSIS_PACKAGE_ID,
  EOG_BOTTLENECK_ANALYSIS_PROVIDER_ID,
  eogBottleneckAnalysisProviderPackage
} from "../providers/eog-bottleneck-analysis/package.js";
import {
  createEogBottleneckAnalysisProviderV020
} from "../providers/eog-bottleneck-analysis/runtime.js";
import {
  createEvoRuntimeObservatoryHealthProbeV010,
  createEvoRuntimeObservatoryProviderV020
} from "../providers/evo-runtime-observatory/runtime.js";
import {
  CONTEXT_MEMORY_EVIDENCE_SOURCE_CAPABILITY,
  CONTEXT_MEMORY_INTAKE_SOURCE_CAPABILITY,
  HOST_MEMORY_EVIDENCE_SOURCE_PROVIDER_ID,
  HOST_MEMORY_INTAKE_PACKAGE_ID,
  HOST_MEMORY_INTAKE_SOURCE_PROVIDER_ID,
  hostMemoryIntakeProviderPackage
} from "../providers/memory-intake/package.js";
import {
  createHostMemoryEvidenceSourceProviderV010,
  createHostMemoryIntakeHealthProbeV010,
  createHostMemoryIntakeSourceAdapterV010,
  parseHostMemoryIntakeConfigV010
} from "../providers/memory-intake/runtime.js";
import {
  createFileContextMemoryStoreV010,
  createMemoryContextMemoryStoreV010
} from "./context-memory-store.js";
import {
  createFileContextMemoryGovernanceStoreV010,
  createMemoryContextMemoryGovernanceStoreV010
} from "./context-memory-governance-store.js";
import { createContextMemoryGovernanceActionHandlerV010 } from "./context-memory-governance-actions.js";
import { createFileContextMemoryRetentionDraftStoreV010, createMemoryContextMemoryRetentionDraftStoreV010 } from "./context-memory-retention-draft-store.js";
import { createFileContextMemoryRetentionPolicyStoreV010, createMemoryContextMemoryRetentionPolicyStoreV010 } from "./context-memory-retention-policy-store.js";
import { createFileContextMemoryLegalHoldStoreV010, createMemoryContextMemoryLegalHoldStoreV010 } from "./context-memory-legal-hold-store.js";
import { createContextMemoryPolicyActionHandlersV010 } from "./context-memory-policy-actions.js";
import {
  createContextMemoryScheduledOperationsV010,
  createJsonlContextMemoryOperationLogV010,
  createMemoryContextMemoryOperationLogV010
} from "./context-memory-operations.js";
import {
  createContextMemorySchedulerV010,
  createFileContextMemorySchedulerLeaseV010,
  createMemoryContextMemorySchedulerLeaseV010,
  parseContextMemoryScheduleContextsV010
} from "./context-memory-scheduler.js";
import {
  createFileContextMemoryScheduleStateStoreV010,
  createMemoryContextMemoryScheduleStateStoreV010
} from "./context-memory-schedule-state-store.js";
import { createContextMemoryActionHandlersV010 } from "./context-memory-actions.js";
import {
  createFileContextMemoryProposalStoreV010,
  createMemoryContextMemoryProposalStoreV010
} from "./context-memory-proposal-store.js";
import { createContextMemoryProposalServiceV010 } from "./context-memory-proposal-service.js";
import { createContextMemoryProposalActionHandlersV010 } from "./context-memory-proposal-actions.js";
import {
  createFileContextMemoryCanonicalizationStoreV010,
  createMemoryContextMemoryCanonicalizationStoreV010
} from "./context-memory-canonicalization-store.js";
import {
  createContextMemoryCanonicalizationServiceV010
} from "./context-memory-canonicalization-service.js";
import {
  createContextMemoryCanonicalizationActionHandlersV010
} from "./context-memory-canonicalization-actions.js";
import { requireContextMemoryWriteAuthorityV010 } from "./context-memory-authority.js";
import {
  createFileContextMemoryIntakeStoreV010,
  createMemoryContextMemoryIntakeStoreV010
} from "./context-memory-intake-store.js";
import { createContextMemoryIntakeServiceV010 } from "./context-memory-intake-service.js";
import { createContextMemoryIntakeActionHandlerV010 } from "./context-memory-intake-actions.js";
import {
  createFileEnterpriseContextGovernanceStoreV010,
  createMemoryEnterpriseContextGovernanceStoreV010
} from "./enterprise-context-governance-store.js";
import {
  createEnterpriseContextCreationActionHandlerV010
} from "./enterprise-context-creation.js";
import {
  createEnterpriseRelationshipActionHandlersV010
} from "./enterprise-relationship-actions.js";
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
  createMemoryGovernanceExperienceManifestV010,
  createMemoryGovernancePageV010,
  createMemorySearchPageV010,
  createMemorySourceHealthPageV010,
  createMemoryRetentionSimulationPageV010,
  createMemoryRetentionDraftFormV010,
  createMemoryRetentionDraftsPageV010,
  createMemoryQualityPageV010,
  createMemoryContradictionReviewPageV010,
  createMemoryFreshnessPolicyFormV010,
  createMemoryFreshnessPoliciesPageV010,
  memoryGovernancePageSource,
  memorySearchPageSource,
  memorySourceHealthPageSource,
  memoryRetentionSimulationPageSource,
  memoryRetentionDraftNewPageSource,
  memoryRetentionDraftsPageSource,
  memoryQualityPageSource,
  memoryContradictionReviewPageSource,
  memoryFreshnessPolicyNewPageSource,
  memoryFreshnessPoliciesPageSource
} from "./memory-governance-page.js";
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
  deepSeekLlmProviderPackage,
  hostRemoteCredentialProviderPackage,
  hostStaticAuthorizationProviderPackage,
  hostEncryptedSecretsProviderPackage,
  hostEnterpriseContextProviderPackage,
  hostStaticSessionProviderPackage,
  hostBearerSessionProviderPackage,
  hostEnterpriseContextGrantProviderPackage,
  hostEnterpriseRelationshipProviderPackage,
  hostContextMemoryProviderPackage,
  hostMemoryIntakeProviderPackage,
  remoteContextMemorySemanticProviderPackage,
  remoteContextMemoryDlpProviderPackage,
  experienceCompilerMemoryIntakeProviderPackage,
  evoRuntimeObservatoryProviderPackage,
  eogBottleneckAnalysisProviderPackage,
  tradingLitePackage
]);
const lifecycleStateFile = process.env.APP_PLATFORM_STATE_FILE?.trim();
const store = lifecycleStateFile ? createFileLifecycleStore(lifecycleStateFile) : createMemoryLifecycleStore();
const enterpriseGovernanceStateFile = process.env.APP_PLATFORM_ENTERPRISE_GOVERNANCE_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "enterprise-governance.json") : undefined);
const enterpriseGovernanceStore = enterpriseGovernanceStateFile
  ? createFileEnterpriseContextGovernanceStoreV010(enterpriseGovernanceStateFile)
  : createMemoryEnterpriseContextGovernanceStoreV010();
const contextMemoryStateFile = process.env.APP_PLATFORM_CONTEXT_MEMORY_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "context-memory.json") : undefined);
const contextMemoryStore = contextMemoryStateFile
  ? createFileContextMemoryStoreV010(contextMemoryStateFile)
  : createMemoryContextMemoryStoreV010();
const enterpriseOperatingGraphStateFile =
  process.env.APP_PLATFORM_ENTERPRISE_OPERATING_GRAPH_FILE?.trim()
  || (lifecycleStateFile
    ? join(dirname(lifecycleStateFile), "enterprise-operating-graphs.json")
    : undefined);
const enterpriseOperatingGraphStore = enterpriseOperatingGraphStateFile
  ? createFileEnterpriseOperatingGraphStoreV010(
      enterpriseOperatingGraphStateFile
    )
  : createMemoryEnterpriseOperatingGraphStoreV010();
const enterpriseOperatingGraphService =
  createEnterpriseOperatingGraphHostServiceV010({
    store: enterpriseOperatingGraphStore,
    id: randomUUID
  });
const enterpriseOperatingGraphViewStateFile =
  process.env.APP_PLATFORM_ENTERPRISE_OPERATING_GRAPH_VIEW_FILE?.trim()
  || (lifecycleStateFile
    ? join(dirname(lifecycleStateFile), "enterprise-operating-graph-views.json")
    : undefined);
const enterpriseOperatingGraphViewStore = enterpriseOperatingGraphViewStateFile
  ? createFileEnterpriseOperatingGraphViewStoreV010(
      enterpriseOperatingGraphViewStateFile
    )
  : createMemoryEnterpriseOperatingGraphViewStoreV010();
const enterpriseOperatingGraphViewService =
  createEnterpriseOperatingGraphViewHostServiceV010({
    store: enterpriseOperatingGraphViewStore
  });
const eogApplicationRuntimeBindingStateFile =
  process.env.APP_PLATFORM_EOG_APPLICATION_RUNTIME_BINDING_FILE?.trim()
  || (lifecycleStateFile
    ? join(dirname(lifecycleStateFile), "eog-application-runtime-bindings.json")
    : undefined);
const eogApplicationRuntimeBindingStore = eogApplicationRuntimeBindingStateFile
  ? createFileEogApplicationRuntimeBindingStoreV010(
      eogApplicationRuntimeBindingStateFile
    )
  : createMemoryEogApplicationRuntimeBindingStoreV010();
const eogApplicationRuntimeBindingService =
  createEogApplicationRuntimeBindingServiceV010({
    store: eogApplicationRuntimeBindingStore
  });
const eogExpectedSopStateFile =
  process.env.APP_PLATFORM_EOG_EXPECTED_SOP_FILE?.trim()
  || (lifecycleStateFile
    ? join(dirname(lifecycleStateFile), "eog-expected-sops.json")
    : undefined);
const eogExpectedSopStore = eogExpectedSopStateFile
  ? createFileEogExpectedSopStoreV010(eogExpectedSopStateFile)
  : createMemoryEogExpectedSopStoreV010();
const eogExpectedSopService =
  createEogExpectedSopServiceV010({
    store: eogExpectedSopStore,
    graphService: enterpriseOperatingGraphService
  });
const contextMemoryGovernanceStateFile =
  process.env.APP_PLATFORM_CONTEXT_MEMORY_GOVERNANCE_FILE?.trim()
  || (lifecycleStateFile
    ? join(dirname(lifecycleStateFile), "context-memory-governance.json")
    : undefined);
const contextMemoryGovernanceStore = contextMemoryGovernanceStateFile
  ? createFileContextMemoryGovernanceStoreV010(contextMemoryGovernanceStateFile)
  : createMemoryContextMemoryGovernanceStoreV010();
const contextMemoryRetentionPolicyStateFile =
  process.env.APP_PLATFORM_CONTEXT_MEMORY_RETENTION_POLICY_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "context-memory-retention-policy.json") : undefined);
const contextMemoryRetentionPolicyStore = contextMemoryRetentionPolicyStateFile
  ? createFileContextMemoryRetentionPolicyStoreV010(contextMemoryRetentionPolicyStateFile)
  : createMemoryContextMemoryRetentionPolicyStoreV010();
const contextMemoryRetentionDraftStateFile =
  process.env.APP_PLATFORM_CONTEXT_MEMORY_RETENTION_DRAFT_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "context-memory-retention-drafts.json") : undefined);
const contextMemoryRetentionDraftStore = contextMemoryRetentionDraftStateFile
  ? createFileContextMemoryRetentionDraftStoreV010(contextMemoryRetentionDraftStateFile)
  : createMemoryContextMemoryRetentionDraftStoreV010();
const contextMemoryLegalHoldStateFile =
  process.env.APP_PLATFORM_CONTEXT_MEMORY_LEGAL_HOLD_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "context-memory-legal-hold.json") : undefined);
const contextMemoryLegalHoldStore = contextMemoryLegalHoldStateFile
  ? createFileContextMemoryLegalHoldStoreV010(contextMemoryLegalHoldStateFile)
  : createMemoryContextMemoryLegalHoldStoreV010();
const contextMemoryOperationLogFile =
  process.env.APP_PLATFORM_CONTEXT_MEMORY_OPERATIONS_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "context-memory-operations.jsonl") : undefined);
const contextMemoryOperationLog = contextMemoryOperationLogFile
  ? createJsonlContextMemoryOperationLogV010(contextMemoryOperationLogFile)
  : createMemoryContextMemoryOperationLogV010();
const personalAgentQualityEvidenceFile =
  process.env.APP_PLATFORM_PERSONAL_AGENT_QUALITY_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "personal-agent-quality.jsonl") : undefined);
const personalAgentQualityEvidenceStore = personalAgentQualityEvidenceFile
  ? createJsonlPersonalAgentQualityEvidenceStoreV010(personalAgentQualityEvidenceFile)
  : createMemoryPersonalAgentQualityEvidenceStoreV010();
const agentActionReceiptFile =
  process.env.APP_PLATFORM_AGENT_ACTION_RECEIPT_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "agent-action-receipts.jsonl") : undefined);
const agentActionReceiptEventStore = agentActionReceiptFile
  ? createJsonlAgentActionReceiptEventStoreV010(agentActionReceiptFile)
  : createMemoryAgentActionReceiptEventStoreV010();
const agentActionReceiptService = createAgentActionReceiptServiceV010({
  store: agentActionReceiptEventStore,
  eventId: randomUUID
});
const agentRunFile =
  process.env.APP_PLATFORM_AGENT_RUN_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "agent-runs.jsonl") : undefined);
const agentRunEventStore = agentRunFile
  ? createJsonlAgentRunEventStoreV010(agentRunFile)
  : createMemoryAgentRunEventStoreV010();
const agentRunStore = createAgentRunStoreV010({
  eventStore: agentRunEventStore,
  eventId: randomUUID
});
const conversationThreadFile =
  process.env.APP_PLATFORM_CONVERSATION_THREAD_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "conversation-threads.jsonl") : undefined);
const conversationThreadEventStore = conversationThreadFile
  ? createJsonlConversationThreadEventStoreV010(conversationThreadFile)
  : createMemoryConversationThreadEventStoreV010();
const conversationThreadStore = createConversationThreadStoreV010({
  eventStore: conversationThreadEventStore,
  eventId: randomUUID
});
const configuredConversationRetentionDays =
  process.env.APP_PLATFORM_CONVERSATION_RETENTION_DAYS?.trim();
const conversationRetentionDays = Number(
  configuredConversationRetentionDays || "90"
);
if (
  !Number.isInteger(conversationRetentionDays)
  || conversationRetentionDays < 1
  || conversationRetentionDays > 36500
) {
  throw new Error("CONVERSATION_RETENTION_POLICY_INVALID");
}
const conversationRetentionPolicySource = configuredConversationRetentionDays
  ? "PLATFORM_CONFIG" as const
  : "HUMAN_PLATFORM_DEFAULT" as const;
const contextMemoryQualityStateFile =
  process.env.APP_PLATFORM_CONTEXT_MEMORY_QUALITY_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "context-memory-quality.json") : undefined);
const contextMemoryQualityStore = contextMemoryQualityStateFile
  ? createFileContextMemoryQualityStoreV010(contextMemoryQualityStateFile)
  : createMemoryContextMemoryQualityStoreV010();
const contextMemoryFreshnessPolicyStateFile =
  process.env.APP_PLATFORM_CONTEXT_MEMORY_FRESHNESS_POLICY_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "context-memory-freshness-policy.json") : undefined);
const contextMemoryFreshnessPolicyStore = contextMemoryFreshnessPolicyStateFile
  ? createFileContextMemoryFreshnessPolicyStoreV010(contextMemoryFreshnessPolicyStateFile)
  : createMemoryContextMemoryFreshnessPolicyStoreV010();
const personalAgentFollowUpStateFile =
  process.env.APP_PLATFORM_PERSONAL_AGENT_FOLLOW_UP_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "personal-agent-follow-ups.json") : undefined);
const personalAgentFollowUpStore = personalAgentFollowUpStateFile
  ? createFilePersonalAgentFollowUpStoreV010(personalAgentFollowUpStateFile)
  : createMemoryPersonalAgentFollowUpStoreV010();
const contextMemoryScheduleMs = Number(
  process.env.APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS?.trim() || "0"
);
if (!Number.isFinite(contextMemoryScheduleMs) || contextMemoryScheduleMs < 0) {
  throw new Error("CONTEXT_MEMORY_SCHEDULE_INTERVAL_INVALID");
}
if (contextMemoryScheduleMs > 0 && contextMemoryScheduleMs < 60_000) {
  throw new Error("CONTEXT_MEMORY_SCHEDULE_INTERVAL_TOO_SMALL");
}
const contextMemoryScheduleContexts = parseContextMemoryScheduleContextsV010(
  process.env.APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_CONTEXTS_JSON
);
const contextMemorySchedulerLeaseFile =
  process.env.APP_PLATFORM_CONTEXT_MEMORY_SCHEDULER_LEASE_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "context-memory-scheduler.lease.json") : undefined);
const contextMemoryScheduleStateFile =
  process.env.APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_STATE_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "context-memory-schedule-state.json") : undefined);
const contextMemoryScheduleStateStore = contextMemoryScheduleStateFile
  ? createFileContextMemoryScheduleStateStoreV010(contextMemoryScheduleStateFile)
  : createMemoryContextMemoryScheduleStateStoreV010();
const contextMemoryProposalStateFile = process.env.APP_PLATFORM_CONTEXT_MEMORY_PROPOSALS_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "context-memory-proposals.json") : undefined);
const contextMemoryProposalStore = contextMemoryProposalStateFile
  ? createFileContextMemoryProposalStoreV010(contextMemoryProposalStateFile)
  : createMemoryContextMemoryProposalStoreV010();
const contextMemoryCanonicalizationStateFile =
  process.env.APP_PLATFORM_CONTEXT_MEMORY_CANONICALIZATION_FILE?.trim()
  || (lifecycleStateFile
    ? join(dirname(lifecycleStateFile), "context-memory-canonicalization.json")
    : undefined);
const contextMemoryCanonicalizationStore = contextMemoryCanonicalizationStateFile
  ? createFileContextMemoryCanonicalizationStoreV010(contextMemoryCanonicalizationStateFile)
  : createMemoryContextMemoryCanonicalizationStoreV010();
const contextMemoryIntakeStateFile = process.env.APP_PLATFORM_CONTEXT_MEMORY_INTAKE_FILE?.trim()
  || (lifecycleStateFile ? join(dirname(lifecycleStateFile), "context-memory-intake.json") : undefined);
const contextMemoryIntakeStore = contextMemoryIntakeStateFile
  ? createFileContextMemoryIntakeStoreV010(contextMemoryIntakeStateFile)
  : createMemoryContextMemoryIntakeStoreV010();
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
const realtimeEvents = createHostRealtimeEventBusV010({
  capacity: 4096
});
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
const contextMemoryGovernanceProvider =
  createHostContextMemoryGovernanceProviderV010(
    contextMemoryGovernanceStore,
    () => new Date(),
    contextMemoryLegalHoldStore
  );
providerRuntimeRegistry.replace<ContextMemoryGovernanceProviderV010>(
  HOST_CONTEXT_MEMORY_GOVERNANCE_PROVIDER_ID,
  contextMemoryGovernanceProvider
);
providerRuntimeRegistry.replace<ContextMemoryInventoryReaderV010>(
  HOST_CONTEXT_MEMORY_INVENTORY_PROVIDER_ID,
  createHostContextMemoryInventoryReaderV010(contextMemoryStore, {
    governance: contextMemoryGovernanceProvider,
    canonicalization: {
      listActiveForContext(context) {
        return contextMemoryCanonicalizationStore.listForContext(context)
          .filter(item => item.state === "ACTIVE");
      }
    }
  })
);
providerRuntimeRegistry.replace<ContextMemoryReaderV010>(
  HOST_CONTEXT_MEMORY_READER_PROVIDER_ID,
  createHostContextMemoryReaderV010(contextMemoryStore, {
    governance: contextMemoryGovernanceProvider,
    canonicalization: {
      listActiveForContext(context) {
        return contextMemoryCanonicalizationStore.listForContext(context)
          .filter(item => item.state === "ACTIVE");
      }
    }
  })
);
providerRuntimeRegistry.replace<ContextMemoryWriterV010>(
  HOST_CONTEXT_MEMORY_WRITER_PROVIDER_ID,
  createHostContextMemoryWriterV010(contextMemoryStore)
);
providerRuntimeRegistry.setHealthProbe(
  HOST_CONTEXT_MEMORY_INVENTORY_PROVIDER_ID,
  createHostContextMemoryHealthProbeV010(contextMemoryStore)
);
providerRuntimeRegistry.setHealthProbe(
  HOST_CONTEXT_MEMORY_READER_PROVIDER_ID,
  createHostContextMemoryHealthProbeV010(contextMemoryStore)
);
providerRuntimeRegistry.setHealthProbe(
  HOST_CONTEXT_MEMORY_WRITER_PROVIDER_ID,
  createHostContextMemoryHealthProbeV010(contextMemoryStore)
);
providerRuntimeRegistry.setHealth(HOST_CONTEXT_MEMORY_INVENTORY_PROVIDER_ID, {
  state: "HEALTHY",
  message: "Host Context Memory Inventory is active.",
  checkedAt: new Date().toISOString()
});
providerRuntimeRegistry.setHealth(HOST_CONTEXT_MEMORY_READER_PROVIDER_ID, {
  state: "HEALTHY",
  message: "Host Context Memory Reader is active.",
  checkedAt: new Date().toISOString()
});
providerRuntimeRegistry.setHealth(HOST_CONTEXT_MEMORY_WRITER_PROVIDER_ID, {
  state: "HEALTHY",
  message: "Host Context Memory Writer is active.",
  checkedAt: new Date().toISOString()
});
providerRuntimeRegistry.setHealth(
  HOST_CONTEXT_MEMORY_GOVERNANCE_PROVIDER_ID,
  {
    state: "HEALTHY",
    message: "Host Context Memory retention/privacy governance is active.",
    checkedAt: new Date().toISOString()
  }
);

const remoteSemanticEndpoint = process.env.APP_PLATFORM_MEMORY_SEMANTIC_URL?.trim();
const remoteSemanticTimeoutMs = Number(
  process.env.APP_PLATFORM_MEMORY_SEMANTIC_TIMEOUT_MS?.trim() || "8000"
);
const remoteDlpEndpoint = process.env.APP_PLATFORM_MEMORY_DLP_URL?.trim();
const remoteDlpTimeoutMs = Number(
  process.env.APP_PLATFORM_MEMORY_DLP_TIMEOUT_MS?.trim() || "8000"
);
const experienceCompilerMemoryIntakeConfig =
  parseExperienceCompilerMemoryIntakeConfigV010(
    process.env.APP_PLATFORM_EC_MEMORY_INTAKE_JSON
  );

const hostMemoryIntakeConfig = parseHostMemoryIntakeConfigV010(
  process.env.APP_PLATFORM_MEMORY_INTAKE_JSON
);
if (hostMemoryIntakeConfig) {
  providerRuntimeRegistry.replace<ContextMemoryEvidenceSourceProviderV010>(
    HOST_MEMORY_EVIDENCE_SOURCE_PROVIDER_ID,
    createHostMemoryEvidenceSourceProviderV010(hostMemoryIntakeConfig.source)
  );
  providerRuntimeRegistry.replace<ContextMemoryIntakeSourceAdapterV010>(
    HOST_MEMORY_INTAKE_SOURCE_PROVIDER_ID,
    createHostMemoryIntakeSourceAdapterV010(hostMemoryIntakeConfig)
  );
  providerRuntimeRegistry.setHealthProbe(
    HOST_MEMORY_EVIDENCE_SOURCE_PROVIDER_ID,
    createHostMemoryIntakeHealthProbeV010(hostMemoryIntakeConfig)
  );
  providerRuntimeRegistry.setHealthProbe(
    HOST_MEMORY_INTAKE_SOURCE_PROVIDER_ID,
    createHostMemoryIntakeHealthProbeV010(hostMemoryIntakeConfig)
  );
  providerRuntimeRegistry.setHealth(HOST_MEMORY_EVIDENCE_SOURCE_PROVIDER_ID, {
    state: "HEALTHY",
    message: `Evidence source '${hostMemoryIntakeConfig.source.sourceId}' is configured with trust=${hostMemoryIntakeConfig.source.trustLevel}.`,
    checkedAt: new Date().toISOString()
  });
  providerRuntimeRegistry.setHealth(HOST_MEMORY_INTAKE_SOURCE_PROVIDER_ID, {
    state: "HEALTHY",
    message: `Memory intake source '${hostMemoryIntakeConfig.source.sourceId}' is configured.`,
    checkedAt: new Date().toISOString()
  });
}
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

    realtimeEvents.publish({
      topic: "host.topology",
      type: "HOST_TOPOLOGY_CHANGED",
      resource: {
        kind: "host-topology",
        resourceId: "host:topology"
      },
      payload: {
        lifecycleType: event.type,
        packageId: event.packageId,
        ...(event.featureId ? { featureId: event.featureId } : {})
      }
    });

    if (event.type === "FEATURE_DEACTIVATED" || event.type === "PACKAGE_UNINSTALLED") {
      void processRuntimeHost.stop(event.packageId);
    }
  },
  pkg => verifyPackageIntegrityV010(pkg, pluginIntegrityTrustStore),
  evaluateRuntimeForHost
);
const enterpriseOperatingGraphObservatoryProviders =
  createEnterpriseOperatingGraphObservatoryProviderResolverV020({
    manager,
    registry: providerRuntimeRegistry,
    bindings: providerBindings,
    installationId: "default"
  });

const installedAtStartup = manager.getSnapshot().installedPackages;
if (!installedAtStartup.some(
  item => item.packageId === EOG_BOTTLENECK_ANALYSIS_PACKAGE_ID
)) {
  try {
    manager.install(EOG_BOTTLENECK_ANALYSIS_PACKAGE_ID);
    console.log("Activated EOG Bottleneck Analysis Provider.");
  } catch (error) {
    console.error("Failed to activate EOG Bottleneck Analysis Provider.", error);
  }
}
const evoObservatoryEnabled =
  process.env.APP_PLATFORM_EVO_OBSERVATORY_ENABLED?.trim().toLowerCase()
  === "true";
if (
  evoObservatoryEnabled
  && !installedAtStartup.some(
    item => item.packageId === EVO_RUNTIME_OBSERVATORY_PACKAGE_ID
  )
) {
  try {
    manager.install(EVO_RUNTIME_OBSERVATORY_PACKAGE_ID);
    console.log("Activated EVO Runtime Observatory Provider.");
  } catch (error) {
    console.error("Failed to activate EVO Runtime Observatory Provider.", error);
  }
}
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
if (!installedAtStartup.some(item => item.packageId === HOST_CONTEXT_MEMORY_PACKAGE_ID)) {
  try {
    manager.install(HOST_CONTEXT_MEMORY_PACKAGE_ID);
    console.log("Activated Host Context Memory Provider.");
  } catch (error) {
    console.error("Failed to activate Host Context Memory Provider.", error);
  }
}
if (
  hostMemoryIntakeConfig
  && !installedAtStartup.some(item => item.packageId === HOST_MEMORY_INTAKE_PACKAGE_ID)
) {
  try {
    manager.install(HOST_MEMORY_INTAKE_PACKAGE_ID);
    console.log("Activated Host Memory Intake Provider.");
  } catch (error) {
    console.error("Failed to activate Host Memory Intake Provider.", error);
  }
}
if (
  remoteSemanticEndpoint
  && !installedAtStartup.some(
    item => item.packageId === REMOTE_CONTEXT_MEMORY_SEMANTIC_PACKAGE_ID
  )
) {
  try {
    manager.install(REMOTE_CONTEXT_MEMORY_SEMANTIC_PACKAGE_ID);
    console.log("Activated Remote Context Memory Semantic Provider.");
  } catch (error) {
    console.error("Failed to activate Remote Context Memory Semantic Provider.", error);
  }
}
if (
  remoteDlpEndpoint
  && !installedAtStartup.some(
    item => item.packageId === REMOTE_CONTEXT_MEMORY_DLP_PACKAGE_ID
  )
) {
  try {
    manager.install(REMOTE_CONTEXT_MEMORY_DLP_PACKAGE_ID);
    console.log("Activated Remote Context Memory DLP Provider.");
  } catch (error) {
    console.error("Failed to activate Remote Context Memory DLP Provider.", error);
  }
}
if (
  experienceCompilerMemoryIntakeConfig
  && !installedAtStartup.some(
    item => item.packageId === EXPERIENCE_COMPILER_MEMORY_INTAKE_PACKAGE_ID
  )
) {
  try {
    manager.install(EXPERIENCE_COMPILER_MEMORY_INTAKE_PACKAGE_ID);
    console.log("Activated Experience Compiler Memory Intake Provider.");
  } catch (error) {
    console.error("Failed to activate Experience Compiler Memory Intake Provider.", error);
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
  authorizationPolicy
  && !manager.getSnapshot().installedPackages.some(
    item => item.packageId === HOST_STATIC_AUTHORIZATION_PACKAGE_ID
  )
) {
  try {
    manager.install(HOST_STATIC_AUTHORIZATION_PACKAGE_ID);
    console.log("Activated Host Static Authorization Provider from Host-owned policy.");
  } catch (error) {
    console.error("Failed to activate Host Static Authorization Provider.", error);
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
const hasInstalledSecretConsumer = manager.getSnapshot().installedPackages.some(installed => {
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

function resolveContextMemoryInventoryReader(): ContextMemoryInventoryReaderV010 | undefined {
  return resolveProviderRuntimeV010<ContextMemoryInventoryReaderV010>(
    providerRuntimeRegistry,
    manager.listEffectiveServiceProviders(CONTEXT_MEMORY_INVENTORY_CAPABILITY),
    providerBindings,
    CONTEXT_MEMORY_INVENTORY_CAPABILITY,
    { installationId: "default" }
  )?.runtime;
}

function resolveContextMemoryReader(): ContextMemoryReaderV010 | undefined {
  return resolveProviderRuntimeV010<ContextMemoryReaderV010>(
    providerRuntimeRegistry,
    manager.listEffectiveServiceProviders(CONTEXT_MEMORY_READ_CAPABILITY),
    providerBindings,
    CONTEXT_MEMORY_READ_CAPABILITY,
    { installationId: "default" }
  )?.runtime;
}

function resolveContextMemoryWriter(): ContextMemoryWriterV010 | undefined {
  return resolveProviderRuntimeV010<ContextMemoryWriterV010>(
    providerRuntimeRegistry,
    manager.listEffectiveServiceProviders(CONTEXT_MEMORY_WRITE_CAPABILITY),
    providerBindings,
    CONTEXT_MEMORY_WRITE_CAPABILITY,
    { installationId: "default" }
  )?.runtime;
}

function resolveContextMemoryGovernanceProvider(): ContextMemoryGovernanceProviderV010 | undefined {
  return resolveProviderRuntimeV010<ContextMemoryGovernanceProviderV010>(
    providerRuntimeRegistry,
    manager.listEffectiveServiceProviders(CONTEXT_MEMORY_GOVERNANCE_CAPABILITY),
    providerBindings,
    CONTEXT_MEMORY_GOVERNANCE_CAPABILITY,
    { installationId: "default" }
  )?.runtime;
}

function resolveContextMemorySemanticRetriever(): ContextMemorySemanticRetrieverV010 | undefined {
  return resolveProviderRuntimeV010<ContextMemorySemanticRetrieverV010>(
    providerRuntimeRegistry,
    manager.listEffectiveServiceProviders(CONTEXT_MEMORY_SEMANTIC_RETRIEVAL_CAPABILITY),
    providerBindings,
    CONTEXT_MEMORY_SEMANTIC_RETRIEVAL_CAPABILITY,
    { installationId: "default" }
  )?.runtime;
}

function resolveContextMemoryDlpClassifier(): ContextMemoryDlpClassifierV010 | undefined {
  return resolveProviderRuntimeV010<ContextMemoryDlpClassifierV010>(
    providerRuntimeRegistry,
    manager.listEffectiveServiceProviders(CONTEXT_MEMORY_DLP_CLASSIFICATION_CAPABILITY),
    providerBindings,
    CONTEXT_MEMORY_DLP_CLASSIFICATION_CAPABILITY,
    { installationId: "default" }
  )?.runtime;
}

function resolveContextMemoryIntakeSource(): ContextMemoryIntakeSourceAdapterV010 | undefined {
  return resolveProviderRuntimeV010<ContextMemoryIntakeSourceAdapterV010>(
    providerRuntimeRegistry,
    manager.listEffectiveServiceProviders(CONTEXT_MEMORY_INTAKE_SOURCE_CAPABILITY),
    providerBindings,
    CONTEXT_MEMORY_INTAKE_SOURCE_CAPABILITY,
    { installationId: "default" }
  )?.runtime;
}

function resolveContextMemoryEvidenceSourceProvider(): ContextMemoryEvidenceSourceProviderV010 | undefined {
  return resolveProviderRuntimeV010<ContextMemoryEvidenceSourceProviderV010>(
    providerRuntimeRegistry,
    manager.listEffectiveServiceProviders(CONTEXT_MEMORY_EVIDENCE_SOURCE_CAPABILITY),
    providerBindings,
    CONTEXT_MEMORY_EVIDENCE_SOURCE_CAPABILITY,
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
const evoObservatoryEnterpriseMap = (() => {
  const raw = process.env.APP_PLATFORM_EVO_OBSERVATORY_ENTERPRISE_MAP_JSON?.trim();
  if (!raw) return new Map<string, string>();
  const parsed = JSON.parse(raw) as unknown;
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("EVO_OBSERVATORY_ENTERPRISE_MAP_INVALID");
  }
  const result = new Map<string, string>();
  for (const [hostEnterpriseId, value] of Object.entries(parsed)) {
    if (
      !hostEnterpriseId.trim()
      || typeof value !== "string"
      || !value.trim()
    ) {
      throw new Error("EVO_OBSERVATORY_ENTERPRISE_MAP_INVALID");
    }
    result.set(hostEnterpriseId.trim(), value.trim());
  }
  return result;
})();
const evoObservatoryDefaultEnterpriseCode =
  process.env.APP_PLATFORM_EVO_OBSERVATORY_DEFAULT_ENTERPRISE_CODE?.trim();
const evoObservatoryApplicationMap = (() => {
  const raw = process.env.APP_PLATFORM_EVO_OBSERVATORY_APPLICATION_MAP_JSON?.trim();
  if (!raw) return [] as Array<{
    enterpriseId: string;
    hostApplicationRefId: string;
    runtimeApplicationId: string;
  }>;
  const parsed = JSON.parse(raw) as unknown;
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("EVO_OBSERVATORY_APPLICATION_MAP_INVALID");
  }
  const result: Array<{
    enterpriseId: string;
    hostApplicationRefId: string;
    runtimeApplicationId: string;
  }> = [];
  for (const [enterpriseId, applications] of Object.entries(parsed)) {
    if (
      !enterpriseId.trim()
      || applications === null
      || typeof applications !== "object"
      || Array.isArray(applications)
    ) {
      throw new Error("EVO_OBSERVATORY_APPLICATION_MAP_INVALID");
    }
    for (const [hostApplicationRefId, runtimeApplicationId] of Object.entries(
      applications
    )) {
      if (
        !hostApplicationRefId.trim()
        || typeof runtimeApplicationId !== "string"
        || !runtimeApplicationId.trim()
      ) {
        throw new Error("EVO_OBSERVATORY_APPLICATION_MAP_INVALID");
      }
      result.push({
        enterpriseId: enterpriseId.trim(),
        hostApplicationRefId: hostApplicationRefId.trim(),
        runtimeApplicationId: runtimeApplicationId.trim()
      });
    }
  }
  return result;
})();
for (const mapping of evoObservatoryApplicationMap) {
  eogApplicationRuntimeBindingService.bind({
    enterpriseId: mapping.enterpriseId,
    hostApplicationRefId: mapping.hostApplicationRefId,
    runtimeProviderId: EVO_RUNTIME_OBSERVATORY_PROVIDER_ID,
    runtimeApplicationId: mapping.runtimeApplicationId
  });
}
const evoRuntimeRevisionIntervalMs = Number(
  process.env.APP_PLATFORM_EVO_RUNTIME_REVISION_INTERVAL_MS?.trim() || "15000"
);
if (
  !Number.isFinite(evoRuntimeRevisionIntervalMs)
  || evoRuntimeRevisionIntervalMs < 1000
) {
  throw new Error("EVO_RUNTIME_REVISION_INTERVAL_INVALID");
}
const evoRuntimeRevisionBridge = evoObservatoryEnabled
  ? createEvoRuntimeRevisionBridgeV010({
      baseUrl: evoBaseUrl,
      intervalMs: evoRuntimeRevisionIntervalMs,
      onChanged(event) {
        realtimeEvents.publish({
          topic: "resource.evo-runtime-observatory",
          type: "RESOURCE_INVALIDATED",
          scope: {
            contextId: event.contextId,
            enterpriseId: event.enterpriseId
          },
          resource: {
            kind: "enterprise-operating-graph",
            resourceId: event.resourceId,
            version: event.etag
          },
          payload: {
            source: "EVO_RUNTIME_REVISION",
            evoEnterpriseCode: event.evoEnterpriseCode
          }
        });
      },
      onError({ evoEnterpriseCode, error }) {
        console.error(
          "EVO Runtime revision bridge check failed for "
            + evoEnterpriseCode
            + ".",
          error
        );
      }
    })
  : undefined;

const evoActorType = (process.env.EVO_ACTOR_TYPE?.trim() || "HUMAN") as "HUMAN" | "AI" | "AUTOMATION";
const evoActorId = process.env.EVO_ACTOR_ID?.trim() || "demo-user";
const ledgerConfiguratorFeatureId = "evo-ledger-runtime-configurator.default";

function installationSecretReference(
  namespace: string,
  key: string
): SecretReferenceV010 {
  return {
    contractVersion: "0.1.0",
    namespace,
    key,
    scope: "INSTALLATION",
    scopeId: "default"
  };
}

async function optionalInstallationSecret(
  namespace: string,
  key: string
): Promise<string | undefined> {
  const secrets = resolveManagedSecretsProvider();
  if (!secrets) throw new Error("SECRETS_PROVIDER_REQUIRED");
  const reference = installationSecretReference(namespace, key);
  const status = await secrets.describe(reference);
  if (!status.configured) return undefined;
  const value = (await secrets.resolve(reference)).trim();
  if (!value) throw new Error(`SECRET_VALUE_EMPTY: ${namespace}/${key}`);
  return value;
}

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

function deepSeekApiKeyReference(): SecretReferenceV010 {
  return {
    contractVersion: "0.1.0",
    namespace: DEEPSEEK_LLM_PACKAGE_ID,
    key: "apiKey",
    scope: "INSTALLATION",
    scopeId: "default"
  };
}

async function refreshDeepSeekProviderRuntime(): Promise<void> {
  const reference = deepSeekApiKeyReference();
  const legacyApiKey = process.env.DEEPSEEK_API_KEY?.trim();
  let apiKey: string | undefined;

  try {
    const secrets = resolveManagedSecretsProvider();
    if (secrets) {
      const status = await secrets.describe(reference);
      if (!status.configured && legacyApiKey) {
        await secrets.put(reference, legacyApiKey);
        console.log("Migrated legacy DeepSeek credential into Host Secrets Provider.");
      }
      const refreshedStatus = await secrets.describe(reference);
      if (refreshedStatus.configured) {
        apiKey = (await secrets.resolve(reference)).trim();
      }
    }
  } catch (error) {
    console.error("DeepSeek Secret resolution failed closed.", error);
  }

  // Compatibility fallback only. New configuration must use the Host Secrets Provider.
  if (!apiKey && legacyApiKey) apiKey = legacyApiKey;

  if (!apiKey) {
    providerRuntimeRegistry.remove(DEEPSEEK_LLM_PROVIDER_ID);
    return;
  }

  const values = settingsStore.getNamespace(DEEPSEEK_LLM_PACKAGE_ID);
  const model = typeof values.model === "string" && values.model.trim()
    ? values.model.trim()
    : process.env.DEEPSEEK_MODEL?.trim() || "deepseek-flash";
  const baseUrl = typeof values.baseUrl === "string" && values.baseUrl.trim()
    ? values.baseUrl.trim()
    : process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com";

  const options = {
    apiKey,
    model,
    baseUrl
  };
  providerRuntimeRegistry.replace<LlmInferenceProvider>(
    DEEPSEEK_LLM_PROVIDER_ID,
    createDeepSeekResponsesLlmProvider(options)
  );
  providerRuntimeRegistry.setHealthProbe(
    DEEPSEEK_LLM_PROVIDER_ID,
    createDeepSeekResponsesHealthProbe(options)
  );
  providerRuntimeRegistry.setHealth(DEEPSEEK_LLM_PROVIDER_ID, {
    state: "UNKNOWN",
    message: "Runtime credential is configured through the Host Secrets boundary; external DeepSeek service health has not been actively probed.",
    checkedAt: new Date().toISOString()
  });
}

await refreshDeepSeekProviderRuntime();

async function refreshP12MemoryProviderRuntimes(): Promise<void> {
  let semanticRetriever: ContextMemorySemanticRetrieverV010 | undefined;

  if (remoteSemanticEndpoint) {
    try {
      const bearerToken = await optionalInstallationSecret(
        REMOTE_CONTEXT_MEMORY_SEMANTIC_PACKAGE_ID,
        "apiToken"
      );
      const options = {
        endpoint: remoteSemanticEndpoint,
        ...(Number.isFinite(remoteSemanticTimeoutMs)
          ? { timeoutMs: remoteSemanticTimeoutMs }
          : {}),
        ...(bearerToken ? { bearerToken } : {})
      };
      providerRuntimeRegistry.replace<ContextMemorySemanticRetrieverV010>(
        REMOTE_CONTEXT_MEMORY_SEMANTIC_PROVIDER_ID,
        createRemoteContextMemorySemanticRetrieverV010(options)
      );
      providerRuntimeRegistry.setHealthProbe(
        REMOTE_CONTEXT_MEMORY_SEMANTIC_PROVIDER_ID,
        createRemoteContextMemorySemanticHealthProbeV010(options)
      );
      providerRuntimeRegistry.setHealth(
        REMOTE_CONTEXT_MEMORY_SEMANTIC_PROVIDER_ID,
        {
          state: "UNKNOWN",
          message: "Remote semantic retrieval Provider is configured; no query has been executed yet.",
          checkedAt: new Date().toISOString()
        }
      );
      semanticRetriever = resolveContextMemorySemanticRetriever();
    } catch (error) {
      providerRuntimeRegistry.remove(REMOTE_CONTEXT_MEMORY_SEMANTIC_PROVIDER_ID);
      console.error("Remote Context Memory Semantic Provider failed closed.", error);
    }
  } else {
    providerRuntimeRegistry.remove(REMOTE_CONTEXT_MEMORY_SEMANTIC_PROVIDER_ID);
  }

  providerRuntimeRegistry.replace<ContextMemoryReaderV010>(
    HOST_CONTEXT_MEMORY_READER_PROVIDER_ID,
    createHostContextMemoryReaderV010(contextMemoryStore, {
      governance: contextMemoryGovernanceProvider,
      canonicalization: {
        listActiveForContext(context) {
          return contextMemoryCanonicalizationStore.listForContext(context)
            .filter(item => item.state === "ACTIVE");
        }
      },
      ...(semanticRetriever ? { semanticRetriever } : {})
    })
  );

  if (remoteDlpEndpoint) {
    try {
      const bearerToken = await optionalInstallationSecret(
        REMOTE_CONTEXT_MEMORY_DLP_PACKAGE_ID,
        "apiToken"
      );
      const options = {
        endpoint: remoteDlpEndpoint,
        ...(Number.isFinite(remoteDlpTimeoutMs)
          ? { timeoutMs: remoteDlpTimeoutMs }
          : {}),
        ...(bearerToken ? { bearerToken } : {})
      };
      providerRuntimeRegistry.replace<ContextMemoryDlpClassifierV010>(
        REMOTE_CONTEXT_MEMORY_DLP_PROVIDER_ID,
        createRemoteContextMemoryDlpClassifierV010(options)
      );
      providerRuntimeRegistry.setHealthProbe(
        REMOTE_CONTEXT_MEMORY_DLP_PROVIDER_ID,
        createRemoteContextMemoryDlpHealthProbeV010(options)
      );
      providerRuntimeRegistry.setHealth(
        REMOTE_CONTEXT_MEMORY_DLP_PROVIDER_ID,
        {
          state: "UNKNOWN",
          message: "Remote Memory DLP Provider is configured; no classification has been executed yet.",
          checkedAt: new Date().toISOString()
        }
      );
    } catch (error) {
      providerRuntimeRegistry.remove(REMOTE_CONTEXT_MEMORY_DLP_PROVIDER_ID);
      console.error("Remote Context Memory DLP Provider failed closed.", error);
    }
  } else {
    providerRuntimeRegistry.remove(REMOTE_CONTEXT_MEMORY_DLP_PROVIDER_ID);
  }

  if (experienceCompilerMemoryIntakeConfig) {
    try {
      const bearerToken = await optionalInstallationSecret(
        EXPERIENCE_COMPILER_MEMORY_INTAKE_PACKAGE_ID,
        "apiToken"
      );
      const options = {
        config: experienceCompilerMemoryIntakeConfig,
        ...(bearerToken ? { bearerToken } : {})
      };
      providerRuntimeRegistry.replace<ContextMemoryEvidenceSourceProviderV010>(
        EXPERIENCE_COMPILER_EVIDENCE_PROVIDER_ID,
        createExperienceCompilerEvidenceSourceProviderV010(
          experienceCompilerMemoryIntakeConfig
        )
      );
      providerRuntimeRegistry.replace<ContextMemoryIntakeSourceAdapterV010>(
        EXPERIENCE_COMPILER_MEMORY_INTAKE_PROVIDER_ID,
        createExperienceCompilerMemoryIntakeSourceAdapterV010(options)
      );
      providerRuntimeRegistry.setHealthProbe(
        EXPERIENCE_COMPILER_EVIDENCE_PROVIDER_ID,
        createExperienceCompilerMemoryIntakeHealthProbeV010(
          experienceCompilerMemoryIntakeConfig
        )
      );
      providerRuntimeRegistry.setHealthProbe(
        EXPERIENCE_COMPILER_MEMORY_INTAKE_PROVIDER_ID,
        createExperienceCompilerMemoryIntakeHealthProbeV010(
          experienceCompilerMemoryIntakeConfig
        )
      );
      providerRuntimeRegistry.setHealth(
        EXPERIENCE_COMPILER_EVIDENCE_PROVIDER_ID,
        {
          state: "HEALTHY",
          message: `Experience Compiler evidence source '${experienceCompilerMemoryIntakeConfig.source.sourceId}' is configured.`,
          checkedAt: new Date().toISOString()
        }
      );
      providerRuntimeRegistry.setHealth(
        EXPERIENCE_COMPILER_MEMORY_INTAKE_PROVIDER_ID,
        {
          state: "UNKNOWN",
          message: "Experience Compiler intake endpoint is configured; no pull has been executed yet.",
          checkedAt: new Date().toISOString()
        }
      );
    } catch (error) {
      providerRuntimeRegistry.remove(EXPERIENCE_COMPILER_EVIDENCE_PROVIDER_ID);
      providerRuntimeRegistry.remove(EXPERIENCE_COMPILER_MEMORY_INTAKE_PROVIDER_ID);
      console.error("Experience Compiler Memory Intake Provider failed closed.", error);
    }
  } else {
    providerRuntimeRegistry.remove(EXPERIENCE_COMPILER_EVIDENCE_PROVIDER_ID);
    providerRuntimeRegistry.remove(EXPERIENCE_COMPILER_MEMORY_INTAKE_PROVIDER_ID);
  }
}

await refreshP12MemoryProviderRuntimes();

providerRuntimeRegistry.replace(
  EOG_BOTTLENECK_ANALYSIS_PROVIDER_ID,
  createEogBottleneckAnalysisProviderV020({
    expectedSopService: eogExpectedSopService
  })
);
providerRuntimeRegistry.setHealth(
  EOG_BOTTLENECK_ANALYSIS_PROVIDER_ID,
  {
    state: "HEALTHY",
    message: "Evidence-backed bottleneck analysis is available.",
    checkedAt: new Date().toISOString()
  }
);

if (evoObservatoryEnabled) {
  const options = {
    baseUrl: evoBaseUrl,
    resolveEnterpriseCode(hostEnterpriseId: string) {
      return evoObservatoryEnterpriseMap.get(hostEnterpriseId)
        ?? evoObservatoryDefaultEnterpriseCode;
    }
    ,
    resolveApplicationId(
      hostEnterpriseId: string,
      hostApplicationRefId: string
    ) {
      return eogApplicationRuntimeBindingService.resolve({
        enterpriseId: hostEnterpriseId,
        hostApplicationRefId,
        runtimeProviderId: EVO_RUNTIME_OBSERVATORY_PROVIDER_ID
      })?.runtimeApplicationId;
    }
  };
  providerRuntimeRegistry.replace(
    EVO_RUNTIME_OBSERVATORY_PROVIDER_ID,
    createEvoRuntimeObservatoryProviderV020(options)
  );
  providerRuntimeRegistry.setHealthProbe(
    EVO_RUNTIME_OBSERVATORY_PROVIDER_ID,
    createEvoRuntimeObservatoryHealthProbeV010(options)
  );
  providerRuntimeRegistry.setHealth(
    EVO_RUNTIME_OBSERVATORY_PROVIDER_ID,
    {
      state: "UNKNOWN",
      message: "EVO Runtime Observatory Provider is configured; runtime health has not been actively probed.",
      checkedAt: new Date().toISOString()
    }
  );
}

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

const contextMemoryProposalService = createContextMemoryProposalServiceV010({
  store: contextMemoryProposalStore,
  resolveReader: resolveContextMemoryReader,
  resolveWriter: resolveContextMemoryWriter
});
const contextMemoryCanonicalizationService =
  createContextMemoryCanonicalizationServiceV010({
    store: contextMemoryCanonicalizationStore,
    memoryStore: contextMemoryStore
  });

const contextMemoryIntakeService = createContextMemoryIntakeServiceV010({
  store: contextMemoryIntakeStore,
  proposalService: contextMemoryProposalService,
  resolveSourceAdapter: resolveContextMemoryIntakeSource,
  resolveEvidenceSourceProvider: resolveContextMemoryEvidenceSourceProvider
});

const contextMemoryScheduledOperations = createContextMemoryScheduledOperationsV010({
  memoryStore: contextMemoryStore,
  governanceStore: contextMemoryGovernanceStore,
  retentionPolicies: contextMemoryRetentionPolicyStore,
  legalHolds: contextMemoryLegalHoldStore,
  operationLog: contextMemoryOperationLog,
  resolveDlpClassifier: resolveContextMemoryDlpClassifier
});
const contextMemorySchedulerLease = contextMemorySchedulerLeaseFile
  ? createFileContextMemorySchedulerLeaseV010(
      contextMemorySchedulerLeaseFile,
      `context-memory-scheduler:${process.pid}:${randomUUID()}`,
      Math.max(contextMemoryScheduleMs > 0 ? contextMemoryScheduleMs * 2 : 120_000, 120_000)
    )
  : createMemoryContextMemorySchedulerLeaseV010();
const contextMemoryScheduler = createContextMemorySchedulerV010({
  operations: contextMemoryScheduledOperations,
  operationLog: contextMemoryOperationLog,
  lease: contextMemorySchedulerLease,
  listGovernanceContexts() {
    return contextMemoryStore.snapshot().items.map(item => item.context);
  },
  listIntakeContexts() {
    return contextMemoryScheduleContexts;
  },
  async runSourceIntake(context) {
    const adapter = resolveContextMemoryIntakeSource();
    if (!adapter) throw new Error("CONTEXT_MEMORY_INTAKE_SOURCE_REQUIRED");
    const cursorState = contextMemoryScheduleStateStore.get(adapter.sourceId, context);
    const result = await contextMemoryIntakeService.run({
      principal: {
        contractVersion: "0.1.0",
        subjectId: "system:context-memory-scheduler",
        actorType: "SERVICE",
        identityProviderId: "host.scheduler",
        displayName: "Context Memory Scheduler"
      },
      context,
      ...(cursorState?.cursor ? { cursor: cursorState.cursor } : {}),
      limit: 100
    });
    contextMemoryScheduleStateStore.set({
      contractVersion: "0.1.0",
      sourceId: adapter.sourceId,
      context: structuredClone(context),
      ...(result.nextCursor ? { cursor: result.nextCursor } : {}),
      updatedAt: new Date().toISOString()
    });
    const proposed = result.receipts.filter(receipt => receipt.outcome === "PROPOSED").length;
    const duplicateFingerprints = result.receipts.length - proposed;
    return {
      examined: result.receipts.length + result.reusedSourceRecordReceiptIds.length,
      changed: proposed,
      skipped: duplicateFingerprints + result.reusedSourceRecordReceiptIds.length
    };
  }
});
let contextMemoryScheduleTimer: NodeJS.Timeout | undefined;
if (contextMemoryScheduleMs > 0) {
  contextMemoryScheduleTimer = setInterval(() => {
    void contextMemoryScheduler.tick().catch(error => {
      console.error("Scheduled Context Memory operation failed.", error);
    });
  }, contextMemoryScheduleMs);
  contextMemoryScheduleTimer.unref();
}

function resolveContextForPrincipal(
  principal: PlatformPrincipalV010,
  ref: ActiveContextRefV010
) {
  return createPrincipalContextRegistryV010(
    principal,
    principalContextSources()
  ).resolve(ref);
}

function createPersonalAgentToolCatalogV010(
  locale: string,
  context: ResolvedContextSetV010,
  principal: PlatformPrincipalV010,
  requestContext: PlatformRequestContextV010 | undefined,
  interaction: {
    sourceInteractionId: string;
    sourceActionId: string;
  }
) {
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
    actionReceipt: {
      sourceInteractionId: interaction.sourceInteractionId,
      sourceActionId: interaction.sourceActionId,
      service: agentActionReceiptService
    },
    inventoryContextMemory(input) {
      const provider = resolveContextMemoryInventoryReader();
      if (!provider) throw new Error("CONTEXT_MEMORY_INVENTORY_READER_REQUIRED");
      return provider.list({
        contractVersion: "0.1.0",
        context: structuredClone(context.activeContext),
        ...input
      });
    },
    readContextMemory(input) {
      const provider = resolveContextMemoryReader();
      if (!provider) throw new Error("CONTEXT_MEMORY_READER_REQUIRED");
      return provider.read({
        contractVersion: "0.1.0",
        context: structuredClone(context.activeContext),
        ...input
      });
    },
    getContextMemoryProposal(proposalId) {
      const proposal = contextMemoryProposalService.get(proposalId);
      if (!proposal) {
        throw new Error("CONTEXT_MEMORY_PROPOSAL_NOT_FOUND");
      }
      const sameActiveContext =
        proposal.context.kind === context.activeContext.kind
        && proposal.context.contextId === context.activeContext.contextId
        && (
          proposal.context.kind !== "ENTERPRISE"
          || (
            context.activeContext.kind === "ENTERPRISE"
            && proposal.context.enterpriseId === context.activeContext.enterpriseId
          )
        );
      if (!sameActiveContext) {
        throw new Error("CONTEXT_MEMORY_PROPOSAL_NOT_FOUND");
      }
      return proposal;
    },
    proposeContextMemoryCanonicalization(input) {
      return {
        proposal: contextMemoryCanonicalizationService.create({
          principal,
          context: context.activeContext,
          duplicateMemoryId: input.duplicateMemoryId,
          canonicalMemoryId: input.canonicalMemoryId,
          ...(input.reason ? { reason: input.reason } : {}),
          authoredBy: "PERSONAL_AGENT"
        }),
        reviewRoute: PERSONAL_AGENT_MEMORY_REVIEW_ROUTE
      };
    },
    getContextMemoryCanonicalizationProposal(proposalId) {
      const proposal = contextMemoryCanonicalizationService.get(proposalId);
      if (!proposal) {
        throw new Error("CONTEXT_MEMORY_CANONICALIZATION_PROPOSAL_NOT_FOUND");
      }
      const sameActiveContext =
        proposal.context.kind === context.activeContext.kind
        && proposal.context.contextId === context.activeContext.contextId
        && (
          proposal.context.kind !== "ENTERPRISE"
          || (
            context.activeContext.kind === "ENTERPRISE"
            && proposal.context.enterpriseId === context.activeContext.enterpriseId
          )
        );
      if (!sameActiveContext) {
        throw new Error("CONTEXT_MEMORY_CANONICALIZATION_PROPOSAL_NOT_FOUND");
      }
      return proposal;
    },
    listPersonalFollowUps() {
      return personalAgentFollowUpStore.listOpen(
        principal.subjectId,
        context.activeContext
      );
    },
    async proposeContextMemory(input) {
      if (!requestContext) {
        throw new Error("REQUEST_CONTEXT_REQUIRED");
      }
      requireContextMemoryWriteAuthorityV010({
        principal,
        personalContext: context.personalContext,
        targetContext: context.activeContext,
        relationshipProvider: resolveEnterpriseContextRelationshipProvider()
      });
      const proposal = await contextMemoryProposalService.create({
        principal,
        context: context.activeContext,
        draft: input
      });
      return {
        proposal,
        reviewRoute: PERSONAL_AGENT_MEMORY_REVIEW_ROUTE
      };
    },
    searchHelp(query, helpContext) {
      return searchHelpV010(helpCorpus, query, locale, helpContext);
    },
    async authorizeWrite(descriptor) {
      if (!requestContext) {
        return {
          allowed: false,
          code: "REQUEST_CONTEXT_REQUIRED",
          message: "Material WRITE requires a Host-resolved request context."
        };
      }
      const decision = await authorizeMaterialWriteV010(
        resolveAuthorizationProvider(),
        requestContext,
        {
          action: descriptor.id === "context.memory.canonicalization.proposal.create"
            ? "context.memory.proposal.create"
            : descriptor.id,
          resource: (
            descriptor.id === "context.memory.proposal.create"
            || descriptor.id === "context.memory.canonicalization.proposal.create"
          )
            ? {
                type: "context.memory.proposal",
                attributes: {
                  contextId: context.activeContext.contextId,
                  contextKind: context.activeContext.kind,
                  ownerPackageId: descriptor.ownerPackageId,
                  effect: descriptor.effect,
                  proposalType: descriptor.id === "context.memory.canonicalization.proposal.create"
                    ? "CANONICALIZATION"
                    : "CONTENT"
                }
              }
            : {
                type: "agent.tool",
                id: descriptor.id,
                attributes: {
                  ownerPackageId: descriptor.ownerPackageId,
                  effect: descriptor.effect,
                  ...(descriptor.capability ? { capability: descriptor.capability } : {})
                }
              }
        }
      );
      return decision.allowed
        ? { allowed: true }
        : {
            allowed: false,
            code: decision.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED",
            message: "Material WRITE denied by '" + decision.policyProviderId + "': " + decision.reasonCodes.join(", ")
          };
    }
  }, [
    ...createEnterpriseOperatingGraphAgentToolRegistrationsV010({
      service: enterpriseOperatingGraphService,
      viewService: enterpriseOperatingGraphViewService,
      principal,
      context
    }),
    ...createEogExpectedSopAgentToolRegistrationsV010({
      service: eogExpectedSopService,
      principal,
      context
    }),
    ...createEnterpriseOperatingGraphObservatoryAgentToolRegistrationsV020({
      graphService: enterpriseOperatingGraphService,
      providers: enterpriseOperatingGraphObservatoryProviders,
      principal,
      context
    })
  ]);
}

const agentRunExecutor = createResumableAgentRunExecutorV010({
  store: agentRunStore,
  resolveProvider() {
    return resolveLlmProvider().provider;
  },
  createToolCatalog(run, principal, context, requestContext, interaction) {
    return createPersonalAgentToolCatalogV010(
      run.input.locale,
      context,
      principal,
      requestContext,
      interaction
    );
  },
  eventId: randomUUID,
  sliceId: randomUUID
});

const actionRouter = createAppActionRouter(
  [
    ...createEnterpriseOperatingGraphActionHandlersV010({
      service: enterpriseOperatingGraphService,
      resolveAuthorizationProvider
    }),
    ...createEogExpectedSopActionHandlersV010({
      service: eogExpectedSopService,
      resolveAuthorizationProvider
    }),
    ...createEnterpriseOperatingGraphViewActionHandlersV010({
      service: enterpriseOperatingGraphService,
      viewService: enterpriseOperatingGraphViewService,
      resolveAuthorizationProvider,
      locale(context) {
        return context.locale;
      }
    }),
    ...createEnterpriseOperatingGraphObservatoryActionHandlersV020({
      graphService: enterpriseOperatingGraphService,
      providers: enterpriseOperatingGraphObservatoryProviders
    }),
    createEnterpriseOperatingGraphObservatoryViewActionHandlerV020({
      graphService: enterpriseOperatingGraphService,
      viewService: enterpriseOperatingGraphViewService,
      providers: enterpriseOperatingGraphObservatoryProviders,
      locale(context) {
        return context.locale;
      }
    }),
    createEnterpriseOperatingGraphSpatialObservatoryActionHandlerV020({
      graphService: enterpriseOperatingGraphService,
      viewService: enterpriseOperatingGraphViewService,
      providers: enterpriseOperatingGraphObservatoryProviders
    }),
    createEnterpriseContextCreationActionHandlerV010({
      store: enterpriseGovernanceStore,
      resolveAuthorizationProvider
    }),
    ...createEnterpriseRelationshipActionHandlersV010({
      store: enterpriseGovernanceStore,
      resolveAuthorizationProvider
    }),
    ...createContextMemoryActionHandlersV010({
      resolveAuthorizationProvider,
      resolveReader: resolveContextMemoryReader,
      resolveWriter: resolveContextMemoryWriter,
      resolveRelationshipProvider: resolveEnterpriseContextRelationshipProvider,
      listAvailableContexts(principal) {
        return createPrincipalContextRegistryV010(
          principal,
          principalContextSources()
        ).list();
      }
    }),
    createContextMemoryGovernanceActionHandlerV010({
      memoryStore: contextMemoryStore,
      governanceStore: contextMemoryGovernanceStore,
      resolveAuthorizationProvider,
      resolveRelationshipProvider: resolveEnterpriseContextRelationshipProvider
    }),
    createContextMemoryQualityActionHandlerV010({
      memoryStore: contextMemoryStore,
      qualityStore: contextMemoryQualityStore,
      followUpStore: personalAgentFollowUpStore,
      resolveAuthorizationProvider,
      resolveRelationshipProvider: resolveEnterpriseContextRelationshipProvider
    }),
    ...createContextMemoryFreshnessPolicyActionHandlersV010({
      store: contextMemoryFreshnessPolicyStore,
      resolveAuthorizationProvider,
      resolveRelationshipProvider: resolveEnterpriseContextRelationshipProvider
    }),
    ...createPersonalAgentFollowUpActionHandlersV010({
      store: personalAgentFollowUpStore
    }),
    ...createContextMemoryPolicyActionHandlersV010({
      memoryStore: contextMemoryStore,
      governanceStore: contextMemoryGovernanceStore,
      retentionPolicies: contextMemoryRetentionPolicyStore,
      legalHolds: contextMemoryLegalHoldStore,
      retentionDrafts: contextMemoryRetentionDraftStore,
      resolveAuthorizationProvider,
      resolveRelationshipProvider: resolveEnterpriseContextRelationshipProvider
    }),
    ...createContextMemoryProposalActionHandlersV010({
      service: contextMemoryProposalService,
      qualityStore: contextMemoryQualityStore,
      resolveAuthorizationProvider,
      resolveRelationshipProvider: resolveEnterpriseContextRelationshipProvider,
      listAvailableContexts(principal) {
        return createPrincipalContextRegistryV010(
          principal,
          principalContextSources()
        ).list();
      },
      resolveContext(principal, ref) {
        return resolveContextForPrincipal(principal, ref);
      }
    }),
    ...createContextMemoryCanonicalizationActionHandlersV010({
      service: contextMemoryCanonicalizationService,
      resolveAuthorizationProvider,
      resolveRelationshipProvider: resolveEnterpriseContextRelationshipProvider,
      listAvailableContexts(principal) {
        return createPrincipalContextRegistryV010(
          principal,
          principalContextSources()
        ).list();
      },
      resolveContext(principal, ref) {
        return resolveContextForPrincipal(principal, ref);
      }
    }),
    createPersonalAgentQualityEvaluationActionHandlerV010({
      store: personalAgentQualityEvidenceStore,
      resolveAuthorizationProvider
    }),
    createContextMemoryIntakeActionHandlerV010({
      service: contextMemoryIntakeService,
      resolveAuthorizationProvider,
      resolveRelationshipProvider: resolveEnterpriseContextRelationshipProvider,
      resolveSourceAdapter: resolveContextMemoryIntakeSource
    }),
    ...createPersonalAgentThreadActionHandlersV010({
      threadStore: conversationThreadStore,
      resolveIdentitySession,
      resolveContext(selection, session) {
        return createContextRegistryForSession(session).resolve(selection);
      },
      threadId: randomUUID
    }),
    ...createThreadBackedAgentTurnActionHandlersV010({
      threadStore: conversationThreadStore,
      runStore: agentRunStore,
      runExecutor: agentRunExecutor,
      resolveLlmProvider,
      resolveIdentitySession,
      resolveContext(selection, session) {
        return createContextRegistryForSession(session).resolve(selection);
      },
      createToolCatalog: createPersonalAgentToolCatalogV010,
      runId: randomUUID
    }),
    createConversationRetentionPreviewActionHandlerV010({
      threadStore: conversationThreadStore,
      resolveIdentitySession,
      resolveContext(selection, session) {
        return createContextRegistryForSession(session).resolve(selection);
      },
      retainArchivedForDays: conversationRetentionDays,
      policySource: conversationRetentionPolicySource
    }),
    createConversationRetentionPolicyGetActionHandlerV010({
      threadStore: conversationThreadStore,
      resolveIdentitySession,
      resolveContext(selection, session) {
        return createContextRegistryForSession(session).resolve(selection);
      },
      retainArchivedForDays: conversationRetentionDays,
      policySource: conversationRetentionPolicySource
    }),
    ...createPersonalAgentRunActionHandlersV010({
      runStore: agentRunStore,
      runExecutor: agentRunExecutor,
      resolveLlmProvider,
      resolveIdentitySession,
      resolveContext(selection, session) {
        return createContextRegistryForSession(session).resolve(selection);
      },
      createToolCatalog: createPersonalAgentToolCatalogV010,
      runId: randomUUID
    }),
    createEnterpriseAgentChatActionHandler({
      resolveLlmProvider,
      qualityEvidenceStore: personalAgentQualityEvidenceStore,
      qualityEventId: randomUUID,
      resolveIdentitySession,
      resolveContext(selection, session) {
        return createContextRegistryForSession(session).resolve(selection);
      },
      createToolCatalog: createPersonalAgentToolCatalogV010
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
    "content-type,accept,authorization,x-evo-session-id,x-evo-context-id,if-none-match,last-event-id"
  );
  response.setHeader("access-control-expose-headers", "etag");
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

function representationEtag(serialized: string): string {
  return "\"" + createHash("sha256").update(serialized).digest("base64url") + "\"";
}

function weakEntityTagValue(value: string): string {
  const trimmed = value.trim();
  return trimmed.startsWith("W/") ? trimmed.slice(2).trim() : trimmed;
}

function ifNoneMatchSatisfied(
  header: string | string[] | undefined,
  etag: string
): boolean {
  if (header === undefined) return false;
  const values = Array.isArray(header) ? header : [header];
  return values
    .flatMap(value => value.split(","))
    .map(value => value.trim())
    .some(value =>
      value === "*"
      || weakEntityTagValue(value) === weakEntityTagValue(etag)
    );
}

function jsonVersioned(
  request: IncomingMessage,
  response: ServerResponse,
  status: number,
  body: unknown
): void {
  const serialized = JSON.stringify(body);
  const etag = representationEtag(serialized);
  applyCors(response);
  response.setHeader("etag", etag);
  response.setHeader("cache-control", "private, max-age=0, must-revalidate");
  if (ifNoneMatchSatisfied(request.headers["if-none-match"], etag)) {
    response.statusCode = 304;
    response.end();
    return;
  }
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(serialized);
}

function writeSseEvent(
  response: ServerResponse,
  event: HostRealtimeEventV010
): void {
  response.write("id: " + event.eventId + "\n");
  response.write("event: " + event.type.toLowerCase() + "\n");
  response.write("data: " + JSON.stringify(event) + "\n\n");
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

const EOG_REALTIME_WRITE_COMMANDS = new Set([
  "enterprise-operating-graph.create",
  "enterprise-operating-graph.operation.apply",
  "enterprise-operating-graph.view.operation",
  "enterprise-operating-graph.sop.create",
  "enterprise-operating-graph.sop.revise",
  "enterprise-operating-graph.sop.publish"
]);

const AGENT_RUN_REALTIME_WRITE_SUFFIXES = [
  ".start",
  ".resume",
  ".cancel"
];

function publishActionRealtimeEvents(
  action: AppActionRequestV010,
  result: unknown,
  requestContext: ReturnType<typeof createPlatformRequestContextV010>
): void {
  if (
    result === null
    || typeof result !== "object"
    || Array.isArray(result)
    || (result as { ok?: unknown }).ok !== true
  ) {
    return;
  }

  const activeContext = requestContext.context?.activeContext;
  const scope = {
    principalSubjectId: requestContext.principal.subjectId,
    ...(activeContext?.contextId
      ? { contextId: activeContext.contextId }
      : {}),
    ...(activeContext?.kind === "ENTERPRISE"
      ? { enterpriseId: activeContext.enterpriseId }
      : {})
  };
  const resultValue = (result as { result?: unknown }).result;

  if (EOG_REALTIME_WRITE_COMMANDS.has(action.command.code)) {
    const resourceId = typeof action.values.resourceId === "string"
      ? action.values.resourceId.trim()
      : typeof action.values.graphId === "string"
        ? action.values.graphId.trim()
        : "";
    if (resourceId) {
      const revision = (
        resultValue !== null
        && typeof resultValue === "object"
        && !Array.isArray(resultValue)
        && typeof (resultValue as { revision?: unknown }).revision === "number"
      )
        ? (resultValue as { revision: number }).revision
        : undefined;
      realtimeEvents.publish({
        topic: "resource.enterprise-operating-graph",
        type: "RESOURCE_INVALIDATED",
        scope: activeContext?.kind === "ENTERPRISE"
          ? {
              contextId: activeContext.contextId,
              enterpriseId: activeContext.enterpriseId
            }
          : scope,
        resource: {
          kind: "enterprise-operating-graph",
          resourceId,
          ...(revision === undefined ? {} : { version: revision })
        },
        correlationId: action.sourceInteractionId,
        payload: {
          commandCode: action.command.code
        }
      });
    }
  }

  const run = (
    resultValue !== null
    && typeof resultValue === "object"
    && !Array.isArray(resultValue)
    && (resultValue as { run?: unknown }).run !== null
    && typeof (resultValue as { run?: unknown }).run === "object"
    && !Array.isArray((resultValue as { run?: unknown }).run)
  )
    ? (resultValue as {
        run: {
          runId?: unknown;
          state?: unknown;
          lastEventId?: unknown;
          sliceCount?: unknown;
        };
      }).run
    : undefined;
  const advancesRun = AGENT_RUN_REALTIME_WRITE_SUFFIXES.some(suffix =>
    action.command.code.endsWith(suffix)
  );
  if (
    advancesRun
    && run
    && typeof run.runId === "string"
    && run.runId.trim()
    && typeof run.state === "string"
  ) {
    realtimeEvents.publish({
      topic: "agent.run",
      type: "RUN_STATE_CHANGED",
      scope,
      resource: {
        kind: "agent-run",
        resourceId: run.runId.trim(),
        ...(typeof run.lastEventId === "string"
          ? { version: run.lastEventId }
          : {})
      },
      correlationId: action.sourceInteractionId,
      payload: {
        state: run.state,
        ...(typeof run.sliceCount === "number"
          ? { sliceCount: run.sliceCount }
          : {})
      }
    });
  }
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

    if (request.method === "GET" && url.pathname === "/v1/events") {
      const session = resolveRequestIdentitySession(request);
      const contextRegistry = createContextRegistryForSession(session);
      const filter = {
        principalSubjectId: session.principal.subjectId,
        accessibleContextIds: new Set(
          contextRegistry.list().map(item => item.contextId)
        )
      };
      const rawLastEventId = request.headers["last-event-id"];
      const lastEventId = Array.isArray(rawLastEventId)
        ? rawLastEventId[0]
        : rawLastEventId;
      const replay = realtimeEvents.replayAfter(lastEventId, filter);
      const connectionId = "sse:" + randomUUID();
      const unregisterEvoRuntimeRevision = evoRuntimeRevisionBridge?.register(
        contextRegistry.list().flatMap(item => {
          if (item.kind !== "ENTERPRISE") return [];
          const evoEnterpriseCode =
            evoObservatoryEnterpriseMap.get(item.enterpriseId)
            ?? evoObservatoryDefaultEnterpriseCode;
          if (!evoEnterpriseCode) return [];
          return [{
            connectionId,
            contextId: item.contextId,
            enterpriseId: item.enterpriseId,
            evoEnterpriseCode,
            resourceId: "eog:primary"
          }];
        })
      );

      response.statusCode = 200;
      applyCors(response);
      response.setHeader("content-type", "text/event-stream; charset=utf-8");
      response.setHeader("cache-control", "no-cache, no-transform");
      response.setHeader("connection", "keep-alive");
      response.setHeader("x-accel-buffering", "no");
      response.flushHeaders?.();
      response.write(": connected\n\n");

      if (
        replay.resetRequired
        && replay.cursorEventId
        && replay.cursorSequence !== undefined
      ) {
        writeSseEvent(response, {
          contractVersion: "0.1.0",
          eventId: replay.cursorEventId,
          sequence: replay.cursorSequence,
          topic: "host.realtime",
          type: "RESET_REQUIRED",
          occurredAt: new Date().toISOString(),
          payload: {
            reason: "EVENT_REPLAY_WINDOW_EXPIRED"
          }
        });
      } else {
        for (const event of replay.events) writeSseEvent(response, event);
      }

      const unsubscribe = realtimeEvents.subscribe(filter, event => {
        if (!response.destroyed && !response.writableEnded) {
          writeSseEvent(response, event);
        }
      });
      const heartbeat = setInterval(() => {
        if (!response.destroyed && !response.writableEnded) {
          response.write(": heartbeat\n\n");
        }
      }, 25000);
      heartbeat.unref?.();

      const close = () => {
        clearInterval(heartbeat);
        unsubscribe();
        unregisterEvoRuntimeRevision?.();
      };
      request.once("close", close);
      response.once("close", close);
      return;
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
        relationships: resolveEnterpriseContextRelationshipProvider()
          ?.listForPrincipal(session.principal) ?? [],
        pendingInvitations: enterpriseGovernanceStore.snapshot().invitations
          .filter(item =>
            item.targetSubjectId === session.principal.subjectId
            && item.state === "PENDING"
            && (item.expiresAt === undefined || Date.parse(item.expiresAt) > Date.now())
          ),
        pendingOwnershipTransfers: enterpriseGovernanceStore.snapshot().ownershipTransfers
          .filter(item =>
            item.toSubjectId === session.principal.subjectId
            && item.state === "PENDING"
            && (item.expiresAt === undefined || Date.parse(item.expiresAt) > Date.now())
          ),
        defaultActiveContext: contextRegistry.resolve().activeContext
      });
    }
    if (request.method === "GET" && url.pathname === "/v1/catalog") {
      return json(response, 200, manager.listCatalog());
    }
    if (request.method === "GET" && url.pathname === "/v1/platform/snapshot") {
      return jsonVersioned(request, response, 200, manager.getSnapshot());
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
      return jsonVersioned(request, response, 200, [
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
      return jsonVersioned(
        request,
        response,
        200,
        manager.listEffectiveWorkbenchActivities()
      );
    }
    if (request.method === "GET" && url.pathname === "/v1/settings/effective") {
      return json(response, 200, {
        contributions: manager.listInstalledSettings(),
        values: settingsStore.snapshot()
      });
    }
    if (request.method === "GET" && url.pathname === "/v1/experiences/effective") {
      return jsonVersioned(request, response, 200, [
        pluginStoreExperienceManifest,
        createSettingsExperienceManifest(manager),
        createProviderManagerExperienceManifest(manager),
        createMemoryGovernanceExperienceManifestV010(),
        createHelpExperienceManifestV010(helpCorpus, requestedLocale(url)),
        ...manager.listEffectiveExperiences(),
        ...(manager.getSnapshot().activeFeatures.some(
          feature => feature.featureId === ENTERPRISE_AGENT_FEATURE_ID
        )
          ? [
              createEnterpriseOperatingGraphExperienceManifestV010(),
              createEnterpriseOperatingGraphObservatoryExperienceManifestV020(),
              createEnterpriseOperatingGraphSpatialObservatoryExperienceManifestV020()
            ]
          : [])
      ]);
    }

    if (request.method === "GET" && url.pathname === "/v1/experience-pages") {
      const source = url.searchParams.get("source");
      if (!source) return json(response, 400, { code: "SOURCE_REQUIRED" });
      if (source === EOG_EDITOR_PAGE_SOURCE) {
        const effective = manager.getSnapshot().activeFeatures.some(
          feature => feature.featureId === ENTERPRISE_AGENT_FEATURE_ID
        );
        if (!effective) {
          return json(response, 404, { code: "PAGE_NOT_EFFECTIVE_OR_NOT_FOUND" });
        }
        const session = resolveRequestIdentitySession(request);
        const contextRegistry = createContextRegistryForSession(session);
        const resolved = contextRegistry.resolve();
        const enterpriseContexts = contextRegistry.list().filter(
          item => item.kind === "ENTERPRISE"
        );
        const activeContext = resolved.activeContext.kind === "ENTERPRISE"
          ? resolved.activeContext
          : enterpriseContexts.length === 1
            ? enterpriseContexts[0]
            : resolved.activeContext;
        return json(
          response,
          200,
          createEnterpriseOperatingGraphEditorPageV010({
            activeContext,
            locale: requestedLocale(url)
          })
        );
      }
      if (source === EOG_OBSERVATORY_PAGE_SOURCE) {
        const effective = manager.getSnapshot().activeFeatures.some(
          feature => feature.featureId === ENTERPRISE_AGENT_FEATURE_ID
        );
        if (!effective) {
          return json(response, 404, { code: "PAGE_NOT_EFFECTIVE_OR_NOT_FOUND" });
        }
        const session = resolveRequestIdentitySession(request);
        const contextRegistry = createContextRegistryForSession(session);
        const resolved = contextRegistry.resolve();
        const enterpriseContexts = contextRegistry.list().filter(
          item => item.kind === "ENTERPRISE"
        );
        const activeContext = resolved.activeContext.kind === "ENTERPRISE"
          ? resolved.activeContext
          : enterpriseContexts.length === 1
            ? enterpriseContexts[0]
            : resolved.activeContext;
        return json(
          response,
          200,
          createEnterpriseOperatingGraphObservatoryPageV020({
            activeContext,
            locale: requestedLocale(url)
          })
        );
      }
      if (source === EOG_SPATIAL_OBSERVATORY_PAGE_SOURCE) {
        const effective = manager.getSnapshot().activeFeatures.some(
          feature => feature.featureId === ENTERPRISE_AGENT_FEATURE_ID
        );
        if (!effective) {
          return json(response, 404, { code: "PAGE_NOT_EFFECTIVE_OR_NOT_FOUND" });
        }
        const session = resolveRequestIdentitySession(request);
        const contextRegistry = createContextRegistryForSession(session);
        const resolved = contextRegistry.resolve();
        const enterpriseContexts = contextRegistry.list().filter(
          item => item.kind === "ENTERPRISE"
        );
        const activeContext = resolved.activeContext.kind === "ENTERPRISE"
          ? resolved.activeContext
          : enterpriseContexts.length === 1
            ? enterpriseContexts[0]
            : resolved.activeContext;
        return json(
          response,
          200,
          createEnterpriseOperatingGraphSpatialObservatoryPageV020({
            activeContext,
            locale: requestedLocale(url)
          })
        );
      }
      if (
        source === ENTERPRISE_AGENT_PAGE_SOURCE
        || source === ENTERPRISE_AGENT_SETUP_PAGE_SOURCE
        || source === ENTERPRISE_AGENT_MEMORY_REVIEW_PAGE_SOURCE
        || source === ENTERPRISE_AGENT_QUALITY_PAGE_SOURCE
        || source === ENTERPRISE_AGENT_QUALITY_REVIEW_PAGE_SOURCE
        || source === ENTERPRISE_AGENT_FOLLOW_UP_PAGE_SOURCE
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
        if (source === ENTERPRISE_AGENT_MEMORY_REVIEW_PAGE_SOURCE) {
          const writableContextIds = new Set(
            availableContexts
              .filter(item => {
                try {
                  requireContextMemoryWriteAuthorityV010({
                    principal: session.principal,
                    personalContext: context.personalContext,
                    targetContext: item.ref,
                    relationshipProvider: resolveEnterpriseContextRelationshipProvider()
                  });
                  return true;
                } catch {
                  return false;
                }
              })
              .map(item => item.ref.contextId)
          );
          const labels = new Map(
            availableContexts.map(item => [item.ref.contextId, item.label])
          );
          return json(
            response,
            200,
            createPersonalAgentMemoryReviewPageV010(
              contextMemoryProposalService.list([...writableContextIds]),
              labels,
              contextMemoryCanonicalizationService.list([...writableContextIds]),
              new Map(
                contextMemoryStore.snapshot().items.map(item => [item.memoryId, item.summary])
              )
            )
          );
        }
        if (source === ENTERPRISE_AGENT_QUALITY_PAGE_SOURCE) {
          return json(response, 200, createPersonalAgentQualityPageV010({
            principal: session.principal,
            context: context.activeContext,
            store: personalAgentQualityEvidenceStore
          }));
        }
        if (source === ENTERPRISE_AGENT_QUALITY_REVIEW_PAGE_SOURCE) {
          return json(response, 200, createPersonalAgentQualityReviewPageV010({
            principal: session.principal,
            context: context.activeContext,
            store: personalAgentQualityEvidenceStore
          }));
        }
        if (source === ENTERPRISE_AGENT_FOLLOW_UP_PAGE_SOURCE) {
          return json(response, 200, createPersonalAgentFollowUpPageV010({
            principal: session.principal,
            context: context.activeContext,
            store: personalAgentFollowUpStore
          }));
        }
        return json(
          response,
          200,
          createPersonalAgentChatPageV020(
            readiness,
            context,
            availableContexts,
            personalAgentFollowUpStore.listOpen(
              session.principal.subjectId,
              context.activeContext
            )
          )
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
              return createPersonalAgentPluginStoreProductStateV010(readiness);
            }
          }
        ));
      }
      if (
        source === memoryGovernancePageSource
        || source === memorySearchPageSource
        || source === memorySourceHealthPageSource
        || source === memoryRetentionSimulationPageSource
        || source === memoryRetentionDraftNewPageSource
        || source === memoryRetentionDraftsPageSource
        || source === memoryQualityPageSource
        || source === memoryContradictionReviewPageSource
        || source === memoryFreshnessPolicyNewPageSource
        || source === memoryFreshnessPoliciesPageSource
      ) {
        const session = resolveRequestIdentitySession(request);
        const contextRegistry = createContextRegistryForSession(session);
        const resolved = contextRegistry.resolve();
        if (source === memorySourceHealthPageSource) {
          return json(response, 200, createMemorySourceHealthPageV010({
            manager,
            registry: providerRuntimeRegistry
          }));
        }
        if (source === memoryQualityPageSource) {
          return json(response, 200, createMemoryQualityPageV010({
            principal: session.principal,
            personalContext: resolved.personalContext,
            context: resolved.activeContext,
            memoryStore: contextMemoryStore,
            qualityStore: contextMemoryQualityStore,
            freshnessPolicies: contextMemoryFreshnessPolicyStore,
            relationships: resolveEnterpriseContextRelationshipProvider()
          }));
        }
        if (source === memoryFreshnessPolicyNewPageSource) {
          return json(response, 200, createMemoryFreshnessPolicyFormV010());
        }
        if (source === memoryFreshnessPoliciesPageSource) {
          return json(response, 200, createMemoryFreshnessPoliciesPageV010({
            principal: session.principal,
            personalContext: resolved.personalContext,
            context: resolved.activeContext,
            policies: contextMemoryFreshnessPolicyStore,
            relationships: resolveEnterpriseContextRelationshipProvider()
          }));
        }
        if (source === memoryContradictionReviewPageSource) {
          return json(response, 200, createMemoryContradictionReviewPageV010({
            principal: session.principal,
            personalContext: resolved.personalContext,
            context: resolved.activeContext,
            memoryStore: contextMemoryStore,
            qualityStore: contextMemoryQualityStore,
            relationships: resolveEnterpriseContextRelationshipProvider()
          }));
        }
        if (source === memoryRetentionDraftNewPageSource) {
          return json(response, 200, createMemoryRetentionDraftFormV010());
        }
        if (source === memoryRetentionDraftsPageSource) {
          return json(response, 200, createMemoryRetentionDraftsPageV010({
            principal: session.principal,
            personalContext: resolved.personalContext,
            context: resolved.activeContext,
            drafts: contextMemoryRetentionDraftStore,
            relationships: resolveEnterpriseContextRelationshipProvider()
          }));
        }
        if (source === memoryRetentionSimulationPageSource) {
          return json(response, 200, createMemoryRetentionSimulationPageV010({
            principal: session.principal,
            personalContext: resolved.personalContext,
            context: resolved.activeContext,
            memoryStore: contextMemoryStore,
            governanceStore: contextMemoryGovernanceStore,
            retentionPolicies: contextMemoryRetentionPolicyStore,
            legalHolds: contextMemoryLegalHoldStore,
            relationships: resolveEnterpriseContextRelationshipProvider()
          }));
        }
        if (source === memorySearchPageSource) {
          const reader = resolveContextMemoryReader();
          if (!reader) {
            return json(response, 503, {
              code: "CONTEXT_MEMORY_READER_REQUIRED"
            });
          }
          return json(response, 200, await createMemorySearchPageV010({
            context: resolved.activeContext,
            reader
          }));
        }
        const governance = resolveContextMemoryGovernanceProvider();
        if (!governance) {
          return json(response, 503, {
            code: "CONTEXT_MEMORY_GOVERNANCE_PROVIDER_REQUIRED"
          });
        }
        return json(response, 200, createMemoryGovernancePageV010({
          principal: session.principal,
          personalContext: resolved.personalContext,
          context: resolved.activeContext,
          memoryStore: contextMemoryStore,
          governance,
          retentionPolicies: contextMemoryRetentionPolicyStore,
          legalHolds: contextMemoryLegalHoldStore,
          operationLog: contextMemoryOperationLog,
          relationships: resolveEnterpriseContextRelationshipProvider()
        }));
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
          if (namespace === DEEPSEEK_LLM_PACKAGE_ID) {
            await refreshDeepSeekProviderRuntime();
          }
          if (
            namespace === REMOTE_CONTEXT_MEMORY_SEMANTIC_PACKAGE_ID
            || namespace === REMOTE_CONTEXT_MEMORY_DLP_PACKAGE_ID
            || namespace === EXPERIENCE_COMPILER_MEMORY_INTAKE_PACKAGE_ID
          ) {
            await refreshP12MemoryProviderRuntimes();
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

      try {
        const session = resolveRequestIdentitySession(request);
        const contextRegistry = createContextRegistryForSession(session);
        const requestContext = createPlatformRequestContextV010(
          session,
          contextRegistry,
          action,
          request.headers,
          requestedLocale(url)
        );
        const result = await actionRouter.execute(action, requestContext);
        publishActionRealtimeEvents(action, result, requestContext);
        return json(
          response,
          200,
          result
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const code = message.split(":")[0]?.trim() || "REQUEST_CONTEXT_RESOLUTION_FAILED";
        const status = code.startsWith("REQUEST_IDENTITY_SESSION")
          || code.startsWith("IDENTITY_SESSION")
          ? 401
          : 403;
        return json(response, status, {
          ok: false,
          correlationId: action.sourceInteractionId,
          error: {
            code,
            message
          }
        });
      }
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
  evoRuntimeRevisionBridge?.dispose();
  if (contextMemoryScheduleTimer) clearInterval(contextMemoryScheduleTimer);
  contextMemorySchedulerLease.release();
  await processRuntimeHost.shutdown();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
