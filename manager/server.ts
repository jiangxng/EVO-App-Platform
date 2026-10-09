import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createPackageCatalog } from "../catalog/catalog.js";
import { createFileLifecycleStore, createMemoryLifecycleStore } from "./store.js";
import { createFileSettingsStore, createMemorySettingsStore } from "./settings-store.js";
import { createMemoryTemplatePreviewSessionStoreV010 } from "./template-preview-session.js";
import {
  createMemoryDefinitionProjectionSessionStoreV010,
  DEFINITION_2D_EDITOR_ROUTE_V010,
  DEFINITION_2D_PREVIEW_ROUTE_V010,
  definition2dPreviewRouteV010,
  parseDefinitionProjectionRouteV010
} from "../contracts/definition-projection.js";
import {
  createMemoryCurrent2dEditorSessionStoreV010
} from "../contracts/current-2d-editor.js";
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
import { createTransportTrafficDiagnosticsV010 } from "./transport-traffic-diagnostics.js";
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
import { createLazyAppActionHandlerV010 } from "../actions/lazy-handler.js";
import type { AppActionRequestV010 } from "../actions/contracts.js";
import {
  createTradingLiteEvoActionHandler,
  TRADING_LITE_HOST_APPLICATION_REF_ID_V010
} from "../apps/trading-lite/action-handler.js";
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
  createPostgresConversationAuthorityV010,
  type PostgresConversationAuthorityV010
} from "./conversation-postgres-store.js";
import {
  createMirroredConversationThreadStoreV010
} from "./conversation-mirror-store.js";
import {
  createPostgresConversationContextArtifactStoreV010
} from "./conversation-context-postgres-store.js";
import {
  createConversationContextAssemblerV010
} from "./conversation-context-assembly.js";
import {
  createEnterpriseOperatingGraphDefinitionPersistenceV010
} from "../apps/eog-2d-designer/definition-persistence.js";
import {
  createCurrent2dEditorAgentToolRegistrationsV010
} from "../apps/eog-2d-designer/current-2d-editor-agent-tools.js";
import {
  createEnterpriseDefinitionProjectionArtifactSourceV010
} from "../providers/enterprise-context/definition-projection.js";
import {
  migrateLegacyEnterpriseOperatingGraphsV010
} from "../apps/eog-2d-designer/legacy-definition-migration.js";
import {
  createEnterpriseOperatingGraphHostServiceV010
} from "./enterprise-operating-graph-service.js";
import {
  applyEogPreviewSeedV010,
  parseEogPreviewSeedV010
} from "./eog-preview-seed.js";
import {
  createFileEogViewStateStoreV010,
  createMemoryEogViewStateStoreV010
} from "../providers/eog-view-state/store.js";
import {
  createEogViewStateProviderV010
} from "../providers/eog-view-state/runtime.js";
import {
  createFileEnterpriseApplicationRuntimeBindingStoreV010,
  createMemoryEnterpriseApplicationRuntimeBindingStoreV010
} from "../providers/application-runtime-binding/store.js";
import {
  createEnterpriseApplicationRuntimeBindingProviderV010
} from "../providers/application-runtime-binding/runtime.js";
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
  createEnterpriseOperatingGraphViewActionHandlersV010,
  EOG_EDITOR_PAGE_SOURCE
} from "./enterprise-operating-graph-page.js";
import {
  createEnterpriseOperatingGraphObservatoryProviderResolverV020
} from "./enterprise-operating-graph-observatory-provider.js";
import {
  createEnterpriseOperatingGraphInspectorPropertyResolverV010
} from "./enterprise-operating-graph-inspector-provider.js";
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
  createEnterpriseOperatingGraphObservatoryViewOperationActionHandlerV020,
  EOG_OBSERVATORY_PAGE_SOURCE
} from "./enterprise-operating-graph-observatory-page.js";
import {
  createEnterpriseOperatingGraphMobileReadActionHandlerV010,
  createEnterpriseOperatingGraphMobileReadPageV010,
  EOG_MOBILE_READ_PAGE_SOURCE
} from "./enterprise-operating-graph-mobile-read-page.js";
import {
  createEnterpriseOperatingGraphSpatialObservatoryActionHandlerV020,
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
import {
  createPersonalAgentFollowUpPageV010,
  createPersonalAgentFollowUpTaskInboxV010
} from "./personal-agent-follow-up-page.js";
import { createPersonalAgentQualityEvaluationActionHandlerV010 } from "../agents/enterprise-agent/quality-evaluation-actions.js";
import { createEnterpriseAgentHostToolCatalogV010 } from "../agents/enterprise-agent/host-tool-catalog.js";
import {
  createPersonalAgentCapabilityToolRegistrationsV010,
  PERSONAL_AGENT_CAPABILITY_INVOKE_WRITE_TOOL_ID,
  personalAgentCapabilityRequestContextV010
} from "../agents/enterprise-agent/capability-fabric-tools.js";
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
  ENTERPRISE_AGENT_FOLLOW_UP_PAGE_SOURCE,
  ENTERPRISE_AGENT_MOBILE_FOLLOW_UP_PAGE_SOURCE
} from "../agents/enterprise-agent/package.js";
import {
  createPersonalAgentChatPageV020,
  createPersonalAgentSetupPageV010,
  createPersonalAgentMemoryReviewPageV010,
  createPersonalAgentPluginStoreProductStateV010,
  evaluatePersonalAgentReadinessV010,
  resolvePersonalAgentActiveContextV010,
  PERSONAL_AGENT_ROUTE,
  PERSONAL_AGENT_SETUP_ROUTE,
  PERSONAL_AGENT_MEMORY_REVIEW_ROUTE
} from "./personal-agent-experience.js";
import type { LlmInferenceProvider } from "../contracts/llm.js";
import type {
  BusinessDefinitionRepositoryV010
} from "../contracts/enterprise-business-definition.js";
import {
  ENTERPRISE_RESOURCE_CAPABILITY_V010,
  type EnterpriseResourceRepositoryV010
} from "../contracts/enterprise-resource.js";
import type {
  EnterpriseTemplateTransferProviderV010
} from "../contracts/template-transfer.js";
import {
  EVO_LEDGER_RUNTIME_PROVIDER_ID_V010,
  toEvoLedgerRuntimeApplicationIdBindingV010
} from "../contracts/evo-ledger-runtime-application-id.js";
import {
  ENTERPRISE_APPLICATION_RUNTIME_BINDING_CAPABILITY_V010,
  type EnterpriseApplicationRuntimeBindingProviderV010
} from "../contracts/enterprise-application-runtime-binding.js";
import {
  VISUAL_2D_VIEWER_CAPABILITY_V010
} from "../contracts/template-preview.js";
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
  IdentityAuthenticationProviderV010,
  IdentitySessionProviderV010,
  IdentityUserDirectoryProviderV010,
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
  createEvoBusinessDataHttpAdapterV010
} from "./evo-business-data-http-adapter.js";
import {
  createEvoRuntimeObservationHttpAdapterV010
} from "./evo-runtime-observation-http-adapter.js";
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
  mergeHostStaticAuthorizationPoliciesV010,
  parseHostStaticAuthorizationPolicyV010
} from "../providers/authorization/runtime.js";
import {
  ENTERPRISE_CONTEXT_CAPABILITY,
  HOST_ENTERPRISE_CONTEXT_PACKAGE_ID,
  HOST_ENTERPRISE_CONTEXT_PROVIDER_ID,
  HOST_ENTERPRISE_BUSINESS_DEFINITION_PROVIDER_ID,
  HOST_ENTERPRISE_TEMPLATE_TRANSFER_PROVIDER_ID,
  HOST_ENTERPRISE_RESOURCE_PROVIDER_ID,
  hostEnterpriseContextProviderPackage
} from "../providers/enterprise-context/package.js";
import {
  createHostEnterpriseContextHealthProbeV010,
  createHostEnterpriseContextProviderV010,
  parseHostEnterpriseContextsV010
} from "../providers/enterprise-context/runtime.js";
import {
  createFileBusinessDefinitionRepositoryV010,
  createMemoryBusinessDefinitionRepositoryV010
} from "../providers/enterprise-context/business-definitions.js";
import {
  createFileEnterpriseResourceRepositoryV010,
  createMemoryEnterpriseResourceRepositoryV010
} from "../providers/enterprise-context/resources.js";
import {
  createFileDefinitionProjectionStoreV010,
  createMemoryDefinitionProjectionStoreV010
} from "../providers/enterprise-context/definition-projection-store.js";
import {
  createEnterpriseTemplateTransferProviderV010
} from "../providers/enterprise-context/template-transfer.js";
import {
  migrateLegacyEogSopsV010
} from "../providers/enterprise-context/eog-sop-migration.js";
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
  HOST_MANAGED_SESSION_PACKAGE_ID,
  HOST_MANAGED_SESSION_PROVIDER_ID,
  hostManagedSessionProviderPackage
} from "../providers/managed-session/package.js";
import {
  GENERIC_OIDC_PACKAGE_ID,
  GENERIC_OIDC_PROVIDER_ID,
  genericOidcIdentityProviderPackage
} from "../providers/oidc/package.js";
import {
  configureGenericOidcProviderRuntimeV010
} from "../providers/oidc/host-runtime.js";
import {
  createHostManagedSessionHealthProbeV010,
  createHostManagedSessionProviderV010
} from "../providers/managed-session/runtime.js";
import {
  HOST_IDENTITY_USER_DIRECTORY_PACKAGE_ID,
  HOST_IDENTITY_USER_DIRECTORY_PROVIDER_ID,
  IDENTITY_USER_DIRECTORY_CAPABILITY,
  hostIdentityUserDirectoryProviderPackage
} from "../providers/identity-directory/package.js";
import {
  createHostIdentityUserDirectoryHealthProbeV010,
  createHostIdentityUserDirectoryServiceV010
} from "../providers/identity-directory/runtime.js";
import {
  createFileIdentityUserDirectoryStoreV010,
  createMemoryIdentityUserDirectoryStoreV010
} from "./identity-user-directory-store.js";
import {
  createJsonlManagedIdentitySessionEventStoreV010,
  createManagedIdentitySessionServiceV010,
  createMemoryManagedIdentitySessionEventStoreV010
} from "./identity-session-store.js";
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
  APPLICATION_RUNTIME_BINDING_FEATURE_ID,
  APPLICATION_RUNTIME_BINDING_PACKAGE_ID,
  APPLICATION_RUNTIME_BINDING_PROVIDER_ID,
  applicationRuntimeBindingProviderPackage
} from "../providers/application-runtime-binding/package.js";
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
  createFileExternalAgentGovernanceStoreV010,
  createMemoryExternalAgentGovernanceStoreV010
} from "./external-agent-governance-store.js";
import {
  createExternalAgentGovernanceServiceV010
} from "./external-agent-governance-service.js";
import {
  createExternalAgentGovernanceActionHandlersV010
} from "./external-agent-governance-actions.js";
import {
  EXTERNAL_AGENT_GOVERNANCE_PACKAGE_ID,
  externalAgentGovernancePackage
} from "./external-agent-governance-package.js";
import {
  createFileExternalAgentOAuthStoreV010,
  createMemoryExternalAgentOAuthStoreV010
} from "./external-agent-oauth-store.js";
import {
  createExternalAgentOAuthServiceV010
} from "./external-agent-oauth-service.js";
import {
  createExternalAgentOAuthHttpAdapterV010
} from "./external-agent-oauth-http.js";
import {
  renderExternalAgentOAuthConsentPageV010
} from "./external-agent-oauth-consent-page.js";
import { createMcpModernCoreV010 } from "./mcp-modern-core.js";
import { createMcpModernHttpAdapterV010 } from "./mcp-modern-http.js";
import { createMcpProtectedResourceV010 } from "./mcp-protected-resource.js";
import {
  createMcpCapabilityProjectionV010,
  type McpCapabilityProjectionModeV010
} from "./mcp-capability-projection.js";
import {
  createChatGptMcpProductAdapterV010,
  createCompositeMcpProductAdapterV010
} from "./mcp-product-adapter.js";
import {
  createEnterpriseContextCreationActionHandlerV010
} from "./enterprise-context-creation.js";
import {
  enterpriseContextGovernanceAuthorizationPolicyV010
} from "./enterprise-context-authorization.js";
import {
  EOG_DEFINITION_PROJECTION_RESOURCE_TYPE_V010,
  EOG_DEFINITION_PROJECTION_SAVE_AUTHORIZATION_ACTION_V010,
  EOG_OPERATING_GRAPH_VIEW_EDIT_AUTHORIZATION_ACTION_V010,
  EOG_OPERATING_GRAPH_VIEW_RESOURCE_TYPE_V010,
  eogDefinitionProjectionAuthorizationPolicyV010
} from "../apps/eog-2d-designer/authorization.js";
import {
  templateStoreAuthorizationPolicyV010
} from "./template-store-authorization.js";
import {
  createEnterpriseContextArchiveActionHandlerV010
} from "./enterprise-context-archive.js";
import {
  createEnterpriseContextDefaultActionHandlerV010
} from "./enterprise-context-default-actions.js";
import {
  resolveDefaultEnterpriseContextV010
} from "./default-enterprise-context.js";
import {
  createEnterpriseRelationshipActionHandlersV010
} from "./enterprise-relationship-actions.js";
import {
  contextFromHeaderV010,
  createPlatformRequestContextV010,
  identitySessionRequestFromHeadersV010
} from "./request-context.js";
import { requestAuthenticationHttpFailureV010 } from "./request-authentication.js";
import {
  requestSecurityHttpFailureV010,
  requireSameOriginForCookieMutationV010
} from "./request-security.js";
import {
  createAuthenticationFlowV010,
  normalizeAuthenticationReturnToV010
} from "./authentication-flow.js";
import { sessionTokenFromCookieHeaderV010 } from "./session-cookie.js";
import { IDENTITY_AUTHENTICATION_CAPABILITY } from "../providers/authentication/capability.js";
import {
  authorizeMaterialWriteV010,
  legacyScopeFromRequestContextV010,
  type MaterialWriteAuthorizationInputV010
} from "./material-write-authorization.js";
import {
  createCapabilityOperationActionPreExecuteV010,
  listAuthorizedCapabilityOperationsV010
} from "./capability-operation-access.js";
import { createLedgerRuntimeConfiguratorService } from "../apps/ledger-runtime-configurator/service.js";
import { createLedgerRuntimeConfiguratorActionHandler } from "../apps/ledger-runtime-configurator/action-handler.js";
import {
  createLedgerRuntimeConfiguratorCapabilityActionHandlers
} from "../apps/ledger-runtime-configurator/capability-action-handlers.js";
import { bookkeepingReferenceLegacyPostingRules } from "../apps/ledger-runtime-configurator/default-library.js";
import type { LedgerRuntimeSourceConfigurationV010, LedgerRuntimeTemplateV010 } from "../apps/ledger-runtime-configurator/contracts.js";
import {
  appHostShellCss,
  createAppHostShellHtmlV010
} from "./app-host-shell.js";
import {
  createLoginExperienceHtmlV010,
  defaultLoginMethodsV010
} from "./login-page.js";
import {
  normalizeAssetRevisionV010,
  resolveBrowserAssetRequestV010
} from "./web-delivery-cache.js";
import { webSecurityHeadersV010 } from "./web-security-headers.js";
import { createWebAssetArchiveV010 } from "./web-asset-archive.js";
import {
  applyWebRevisionHeadersV010,
  normalizeClientRevisionV010
} from "./web-version-skew.js";
import { createWebPerformanceStoreV010 } from "./web-performance.js";
import { appPlatformLocalizationBundles } from "./localization.js";
import {
  createWorkspaceHomePageV010,
  workspaceHomeExperienceManifest,
  workspaceHomePageSource
} from "./workspace-home-page.js";
import {
  createEnterpriseRoleWorkbenchDefaultRepositoryV010,
  createMemoryPersonalWorkbenchStateStoreV010
} from "./workbench-state.js";
import {
  createPostgresPersonalWorkbenchStateStoreV010
} from "./workbench-postgres-store.js";
import {
  createWorkbenchServiceV010
} from "./workbench-service.js";
import {
  createWorkbenchActionHandlersV010
} from "./workbench-actions.js";
import {
  createSettingsExperienceManifest,
  createSettingsGroupPage,
  createSettingsIndexPage,
  createSettingsPage,
  packageIdFromSettingsPageSource,
  settingsGroupFromPageSource,
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
  counterpartyPackage,
  dataImportPackage,
  enterpriseAgentPackage,
  enterpriseContextGovernanceAppPackage,
  enterpriseObservatoryPackage,
  eog2dPackage,
  eog3dPackage,
  evoFoundationPackage,
  ledgerManagerPackage,
  ledgerRuntimeConfiguratorPackage,
  objectExtensionPackage,
  responsibilityPackage,
  referenceExperienceAssets,
  templateStorePackage,
  tradingLitePackage
} from "../catalog/seed.js";
import {
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION,
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_PAGE_SOURCE,
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_SELECTION_GET_ACTION,
  EOG_2D_DESIGNER_FEATURE_ID,
  EOG_2D_DESIGNER_PACKAGE_ID
} from "../apps/eog-2d-designer/package.js";
import {
  ENTERPRISE_CONTEXT_DIRECTORY_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_OVERVIEW_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_GOVERNANCE_APP_FEATURE_ID,
  ENTERPRISE_CONTEXT_GOVERNANCE_APP_PACKAGE_ID,
  ENTERPRISE_CONTEXT_SELECT_COMMAND
} from "../apps/enterprise-context-governance/constants.js";
import {
  COUNTERPARTY_ARCHIVE_COMMAND,
  COUNTERPARTY_ASSIGN_ROLE_COMMAND,
  COUNTERPARTY_CREATE_COMMAND,
  COUNTERPARTY_CREATE_PAGE_SOURCE,
  COUNTERPARTY_CUSTOMERS_PAGE_SOURCE,
  COUNTERPARTY_DETAIL_PAGE_SOURCE,
  COUNTERPARTY_DIRECTORY_PAGE_SOURCE,
  COUNTERPARTY_EDIT_PAGE_SOURCE,
  COUNTERPARTY_MY_CUSTOMERS_PAGE_SOURCE,
  COUNTERPARTY_MY_SUPPLIERS_PAGE_SOURCE,
  COUNTERPARTY_MY_CUSTOMERS_READ_COMMAND_V010,
  COUNTERPARTY_MY_SUPPLIERS_READ_COMMAND_V010,
  COUNTERPARTY_SUPPLIERS_PAGE_SOURCE,
  COUNTERPARTY_FEATURE_ID,
  COUNTERPARTY_PACKAGE_ID,
  COUNTERPARTY_REMOVE_ROLE_COMMAND,
  COUNTERPARTY_UPDATE_COMMAND,
  parseCounterpartyDetailRouteV010,
  parseCounterpartyEditRouteV010
} from "../apps/counterparty/constants.js";
import {
  createCounterpartyRepositoryV010
} from "../apps/counterparty/repository.js";
import {
  createCounterpartyRoleRepositoryV010
} from "../apps/counterparty/roles.js";
import {
  createCounterpartyAddressRepositoryV010,
  createCounterpartyContactRepositoryV010,
  createCounterpartyProfileRepositoryV010
} from "../apps/counterparty/facets.js";
import {
  counterpartyCoreSchemaV010
} from "../apps/counterparty/foundation-object.js";
import {
  counterpartyAuthorizationPolicyV010
} from "../apps/counterparty/authorization.js";
import {
  resolveCounterpartyReadAccessV010
} from "../apps/counterparty/access.js";
import {
  COUNTERPARTY_CUSTOMER_PROJECTION_V010,
  COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010,
  COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
  COUNTERPARTY_SUPPLIER_PROJECTION_V010,
  type CounterpartyProjectionIdV010
} from "../apps/counterparty/projections.js";
import {
  createCounterpartyProjectionServiceV010
} from "../apps/counterparty/projection-service.js";
import {
  RESPONSIBILITY_ARCHIVE_COMMAND_V010,
  RESPONSIBILITY_ASSIGN_COMMAND_V010,
  RESPONSIBILITY_FEATURE_ID,
  RESPONSIBILITY_PACKAGE_ID
} from "../apps/responsibility/constants.js";
import {
  createResponsibilityRepositoryV010
} from "../apps/responsibility/repository.js";
import {
  COUNTERPARTY_IMPORT_TARGET_V010,
  createCounterpartyImportTargetV010
} from "../apps/counterparty/import-target.js";
import {
  DATA_IMPORT_COMMIT_COMMAND_V010,
  DATA_IMPORT_DRY_RUN_COMMAND_V010,
  DATA_IMPORT_DIRECTORY_PAGE_SOURCE,
  DATA_IMPORT_ERROR_CSV_COMMAND_V010,
  DATA_IMPORT_FEATURE_ID,
  DATA_IMPORT_GET_COMMAND_V010,
  DATA_IMPORT_MAPPING_APPLY_COMMAND_V010,
  DATA_IMPORT_MAPPING_INSPECT_COMMAND_V010,
  DATA_IMPORT_MAPPING_PAGE_SOURCE,
  DATA_IMPORT_PACKAGE_ID,
  DATA_IMPORT_REVIEW_COMMAND_V010,
  DATA_IMPORT_REVIEW_PAGE_SOURCE,
  DATA_IMPORT_STAGE_CSV_COMMAND_V010,
  DATA_IMPORT_STAGE_FILE_COMMAND_V010,
  DATA_IMPORT_UPLOAD_PAGE_SOURCE,
  dataImportUploadRouteV010,
  parseDataImportMappingRouteV010,
  parseDataImportReviewRouteV010,
  parseDataImportUploadRouteV010
} from "../apps/data-import/constants.js";
import {
  dataImportAuthorizationPolicyV010
} from "../apps/data-import/authorization.js";
import {
  createDataImportRepositoryV010
} from "../apps/data-import/repository.js";
import {
  createDataImportRecipeRepositoryV010
} from "../apps/data-import/recipe.js";
import {
  createDataImportServiceV010
} from "../apps/data-import/service.js";
import {
  createHttpDataImportExperienceAdvisorV010
} from "../apps/data-import/experience-advisor.js";
import {
  OBJECT_EXTENSION_DEFINITION_ARCHIVE_COMMAND_V010,
  OBJECT_EXTENSION_DEFINITION_LIST_COMMAND_V010,
  OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010,
  OBJECT_EXTENSION_FEATURE_ID,
  OBJECT_EXTENSION_PACKAGE_ID
} from "../apps/object-extension/constants.js";
import {
  objectExtensionAuthorizationPolicyV010
} from "../apps/object-extension/authorization.js";
import {
  createObjectExtensionRepositoryV010
} from "../apps/object-extension/repository.js";
import {
  createObjectExtensionValueRepositoryV010
} from "../apps/object-extension/values.js";
import {
  LEDGER_MANAGER_DEFINITION_KIND,
  LEDGER_MANAGER_DETAIL_PAGE_SOURCE,
  LEDGER_MANAGER_FEATURE_ID,
  LEDGER_MANAGER_OPEN_DETAIL_COMMAND,
  LEDGER_MANAGER_PACKAGE_ID,
  LEDGER_MANAGER_PAGE_SOURCE,
  LEDGER_MANAGER_PREVIEW_PROJECTION_COMMAND,
  LEDGER_MANAGER_PUBLISH_COMMAND,
  LEDGER_MANAGER_ROUTE,
  ledgerManagerDetailRouteV010,
  parseLedgerManagerDetailRouteV010
} from "../apps/ledger-manager/constants.js";
import {
  ledgerManagerAuthorizationPolicyV010
} from "../apps/ledger-manager/authorization.js";
import {
  EOG_2D_VIEWER_DEFINITION_PREVIEW_GET_ACTION,
  EOG_2D_VIEWER_DEFINITION_PREVIEW_PAGE_SOURCE,
  EOG_2D_VIEWER_DEFINITION_PREVIEW_SELECTION_GET_ACTION,
  EOG_2D_VIEWER_FEATURE_ID,
  EOG_2D_VIEWER_PACKAGE_ID,
  EOG_2D_VIEWER_TEMPLATE_PREVIEW_GET_ACTION,
  EOG_2D_VIEWER_TEMPLATE_PREVIEW_PAGE_SOURCE,
  EOG_2D_VIEWER_TEMPLATE_PREVIEW_SELECTION_GET_ACTION,
  EOG_2D_VIEWER_WORKSPACE_GET_ACTION,
  EOG_2D_VIEWER_WORKSPACE_PAGE_SOURCE,
  EOG_2D_VIEWER_WORKSPACE_SELECTION_GET_ACTION
} from "../apps/eog-2d-viewer/package.js";
import {
  EOG_3D_VIEWER_FEATURE_ID,
  EOG_3D_VIEWER_PACKAGE_ID
} from "../apps/eog-3d-viewer/package.js";
import {
  createEnterpriseOperatingGraph3dViewerPageV010,
  createEnterpriseOperatingGraph3dViewerReadActionV010,
  EOG_3D_VIEWER_PAGE_SOURCE
} from "../apps/eog-3d/workspace-page.js";
import {
  ENTERPRISE_OBSERVATORY_2D_FEATURE_ID,
  ENTERPRISE_OBSERVATORY_3D_FEATURE_ID,
  ENTERPRISE_OBSERVATORY_PACKAGE_ID
} from "../apps/enterprise-observatory/package.js";
import type {
  TemplateStoreRepositoryV010
} from "../apps/template-store/repository.js";
import {
  TEMPLATE_STORE_COPY_COMMAND,
  TEMPLATE_STORE_DETAIL_PAGE_SOURCE,
  TEMPLATE_STORE_DOWNLOAD_COMMAND,
  TEMPLATE_STORE_FEATURE_ID,
  TEMPLATE_STORE_OPEN_DETAIL_COMMAND,
  TEMPLATE_STORE_PACKAGE_ID,
  TEMPLATE_STORE_PAGE_SOURCE,
  TEMPLATE_STORE_PREVIEW_2D_COMMAND
} from "../apps/template-store/package.js";

const catalog = createPackageCatalog([
  companyNotesPackage,
  counterpartyPackage,
  dataImportPackage,
  enterpriseAgentPackage,
  enterpriseContextGovernanceAppPackage,
  enterpriseObservatoryPackage,
  eog2dPackage,
  eog3dPackage,
  evoFoundationPackage,
  externalAgentGovernancePackage,
  ledgerManagerPackage,
  ledgerRuntimeConfiguratorPackage,
  objectExtensionPackage,
  responsibilityPackage,
  openAiLlmProviderPackage,
  deepSeekLlmProviderPackage,
  hostRemoteCredentialProviderPackage,
  hostStaticAuthorizationProviderPackage,
  hostEncryptedSecretsProviderPackage,
  hostEnterpriseContextProviderPackage,
  hostStaticSessionProviderPackage,
  hostBearerSessionProviderPackage,
  hostManagedSessionProviderPackage,
  hostIdentityUserDirectoryProviderPackage,
  genericOidcIdentityProviderPackage,
  hostEnterpriseContextGrantProviderPackage,
  hostEnterpriseRelationshipProviderPackage,
  hostContextMemoryProviderPackage,
  hostMemoryIntakeProviderPackage,
  remoteContextMemorySemanticProviderPackage,
  remoteContextMemoryDlpProviderPackage,
  experienceCompilerMemoryIntakeProviderPackage,
  evoRuntimeObservatoryProviderPackage,
  eogBottleneckAnalysisProviderPackage,
  applicationRuntimeBindingProviderPackage,
  templateStorePackage,
  tradingLitePackage
]);
const lifecycleStateFile = process.env.APP_PLATFORM_STATE_FILE?.trim();
const store = lifecycleStateFile ? createFileLifecycleStore(lifecycleStateFile) : createMemoryLifecycleStore();
const enterpriseResourceStateFile =
  process.env.APP_PLATFORM_ENTERPRISE_RESOURCES_FILE?.trim()
  || (lifecycleStateFile
    ? join(dirname(lifecycleStateFile), "enterprise-resources.json")
    : undefined);
const enterpriseResourceRepository =
  enterpriseResourceStateFile
    ? createFileEnterpriseResourceRepositoryV010(
        enterpriseResourceStateFile
      )
    : createMemoryEnterpriseResourceRepositoryV010();
const counterpartyRepository =
  createCounterpartyRepositoryV010(enterpriseResourceRepository);
const counterpartyRoleRepository =
  createCounterpartyRoleRepositoryV010(
    enterpriseResourceRepository,
    counterpartyRepository
  );
const counterpartyContactRepository =
  createCounterpartyContactRepositoryV010({
    resources: enterpriseResourceRepository,
    counterpartyRepository
  });
const counterpartyAddressRepository =
  createCounterpartyAddressRepositoryV010({
    resources: enterpriseResourceRepository,
    counterpartyRepository
  });
const counterpartyProfileRepository =
  createCounterpartyProfileRepositoryV010({
    resources: enterpriseResourceRepository,
    counterpartyRepository,
    roleRepository: counterpartyRoleRepository
  });
const responsibilityRepository =
  createResponsibilityRepositoryV010(enterpriseResourceRepository);
const workbenchEnterpriseRoleDefaults =
  createEnterpriseRoleWorkbenchDefaultRepositoryV010(
    enterpriseResourceRepository
  );
const counterpartyProjectionService =
  createCounterpartyProjectionServiceV010({
    repository: counterpartyRepository,
    roleRepository: counterpartyRoleRepository,
    responsibilityRepository,
    resolveAuthorizationProvider,
    fieldIds: () =>
      counterpartyCoreSchemaV010.fields.map(field => field.fieldId)
  });
const objectExtensionRepository =
  createObjectExtensionRepositoryV010(enterpriseResourceRepository);
const objectExtensionValueRepository =
  createObjectExtensionValueRepositoryV010(enterpriseResourceRepository);
const dataImportRepository =
  createDataImportRepositoryV010(enterpriseResourceRepository);
const dataImportRecipeRepository =
  createDataImportRecipeRepositoryV010(enterpriseResourceRepository);
const counterpartyImportTarget =
  createCounterpartyImportTargetV010({
    resources: enterpriseResourceRepository,
    repository: counterpartyRepository,
    roleRepository: counterpartyRoleRepository,
    contactRepository: counterpartyContactRepository,
    addressRepository: counterpartyAddressRepository,
    profileRepository: counterpartyProfileRepository,
    extensionRepository: objectExtensionRepository,
    extensionValueRepository: objectExtensionValueRepository
  });
const dataImportTargets = [counterpartyImportTarget] as const;
const dataImportService =
  createDataImportServiceV010({
    repository: dataImportRepository,
    recipeRepository: dataImportRecipeRepository,
    targets: dataImportTargets
  });
const experienceCompilerAdvisoryBaseUrl =
  process.env.APP_PLATFORM_EC_ADVISORY_BASE_URL?.trim();
const dataImportExperienceAdvisor = experienceCompilerAdvisoryBaseUrl
  ? createHttpDataImportExperienceAdvisorV010({
      baseUrl: experienceCompilerAdvisoryBaseUrl,
      token: process.env.APP_PLATFORM_EC_ADVISORY_TOKEN?.trim()
    })
  : undefined;
const templateStoreStateFile =
  process.env.APP_PLATFORM_TEMPLATE_STORE_FILE?.trim()
  || (lifecycleStateFile
    ? join(dirname(lifecycleStateFile), "template-store.json")
    : undefined);
let templateStoreRepositoryPromise:
  | Promise<TemplateStoreRepositoryV010>
  | undefined;
async function resolveTemplateStoreRepository():
Promise<TemplateStoreRepositoryV010> {
  templateStoreRepositoryPromise ??= Promise.all([
    import("../apps/template-store/repository.js"),
    import("../apps/template-store/seed-records.js")
  ]).then(([repository, seed]) =>
    templateStoreStateFile
      ? repository.createFileTemplateStoreRepositoryV010(
          templateStoreStateFile,
          seed.templateStoreSeedRecordsV010
        )
      : repository.createMemoryTemplateStoreRepositoryV010(
          seed.templateStoreSeedRecordsV010
        )
  );
  return templateStoreRepositoryPromise;
}
const templatePreviewSessions =
  createMemoryTemplatePreviewSessionStoreV010();
const enterpriseDefinitionProjectionSessions =
  createMemoryDefinitionProjectionSessionStoreV010();
const current2dEditorSessions =
  createMemoryCurrent2dEditorSessionStoreV010();
const managedSessionEnabled =
  process.env.APP_PLATFORM_MANAGED_SESSION_ENABLED?.trim().toLowerCase() === "true";
const authenticationPublicBaseUrl =
  process.env.APP_PLATFORM_PUBLIC_BASE_URL?.trim();
const externalAgentOAuthEnabled =
  process.env.APP_PLATFORM_EXTERNAL_AGENT_OAUTH_ENABLED?.trim().toLowerCase()
  === "true";
const externalAgentMcpEnabled =
  process.env.APP_PLATFORM_EXTERNAL_AGENT_MCP_ENABLED?.trim().toLowerCase()
  === "true";
const externalAgentMcpCapabilityModeRaw =
  process.env.APP_PLATFORM_EXTERNAL_AGENT_MCP_CAPABILITY_MODE
    ?.trim()
    .toUpperCase()
  || "HYBRID";
if (
  externalAgentMcpCapabilityModeRaw !== "DIRECT"
  && externalAgentMcpCapabilityModeRaw !== "HYBRID"
  && externalAgentMcpCapabilityModeRaw !== "FABRIC"
) {
  throw new Error("EXTERNAL_AGENT_MCP_CAPABILITY_MODE_INVALID");
}
const externalAgentMcpCapabilityMode =
  externalAgentMcpCapabilityModeRaw as McpCapabilityProjectionModeV010;
if (externalAgentMcpEnabled && !externalAgentOAuthEnabled) {
  throw new Error("EXTERNAL_AGENT_MCP_REQUIRES_OAUTH");
}
if (externalAgentOAuthEnabled && !managedSessionEnabled) {
  throw new Error(
    "EXTERNAL_AGENT_OAUTH_REQUIRES_MANAGED_HUMAN_SESSION"
  );
}
if (externalAgentOAuthEnabled && !authenticationPublicBaseUrl) {
  throw new Error(
    "EXTERNAL_AGENT_OAUTH_REQUIRES_PUBLIC_BASE_URL"
  );
}
const externalAgentOAuthIssuer = authenticationPublicBaseUrl?.replace(/\/$/, "");
const externalAgentOAuthResource = externalAgentOAuthIssuer
  ? externalAgentOAuthIssuer + "/mcp"
  : undefined;
const authenticationSessionTtlSeconds = Number.parseInt(
  process.env.APP_PLATFORM_SESSION_TTL_SECONDS ?? "28800",
  10
);
if (
  !Number.isFinite(authenticationSessionTtlSeconds)
  || authenticationSessionTtlSeconds <= 0
) {
  throw new Error("AUTHENTICATION_SESSION_TTL_INVALID");
}
const managedSessionStateFile =
  process.env.APP_PLATFORM_MANAGED_SESSION_FILE?.trim()
  || (managedSessionEnabled && lifecycleStateFile
    ? join(dirname(lifecycleStateFile), "identity-sessions.jsonl")
    : undefined);
if (managedSessionEnabled && !managedSessionStateFile) {
  throw new Error(
    "IDENTITY_SESSION_DURABLE_STORE_REQUIRED: configure APP_PLATFORM_MANAGED_SESSION_FILE or APP_PLATFORM_STATE_FILE"
  );
}
const managedSessionEventStore = managedSessionStateFile
  ? createJsonlManagedIdentitySessionEventStoreV010(managedSessionStateFile)
  : createMemoryManagedIdentitySessionEventStoreV010();
const managedSessionService = createManagedIdentitySessionServiceV010({
  store: managedSessionEventStore
});
const identityUserDirectoryStateFile =
  process.env.APP_PLATFORM_IDENTITY_USER_DIRECTORY_FILE?.trim()
  || (lifecycleStateFile
    ? join(dirname(lifecycleStateFile), "identity-user-directory.json")
    : undefined);
const identityUserDirectoryStore = identityUserDirectoryStateFile
  ? createFileIdentityUserDirectoryStoreV010(identityUserDirectoryStateFile)
  : createMemoryIdentityUserDirectoryStoreV010();
const identityUserDirectoryService =
  createHostIdentityUserDirectoryServiceV010({
    store: identityUserDirectoryStore
  });
const externalAgentGovernanceStateFile =
  process.env.APP_PLATFORM_EXTERNAL_AGENT_GOVERNANCE_FILE?.trim()
  || (lifecycleStateFile
    ? join(dirname(lifecycleStateFile), "external-agent-governance.json")
    : undefined);
const externalAgentGovernanceStore = externalAgentGovernanceStateFile
  ? createFileExternalAgentGovernanceStoreV010(
      externalAgentGovernanceStateFile
    )
  : createMemoryExternalAgentGovernanceStoreV010();
const externalAgentOAuthStateFile =
  process.env.APP_PLATFORM_EXTERNAL_AGENT_OAUTH_FILE?.trim()
  || (lifecycleStateFile
    ? join(dirname(lifecycleStateFile), "external-agent-oauth.json")
    : undefined);
if (externalAgentOAuthEnabled && !externalAgentGovernanceStateFile) {
  throw new Error("EXTERNAL_AGENT_GOVERNANCE_DURABLE_STORE_REQUIRED");
}
if (externalAgentOAuthEnabled && !externalAgentOAuthStateFile) {
  throw new Error("EXTERNAL_AGENT_OAUTH_DURABLE_STORE_REQUIRED");
}
const externalAgentOAuthStore = externalAgentOAuthStateFile
  ? createFileExternalAgentOAuthStoreV010(externalAgentOAuthStateFile)
  : createMemoryExternalAgentOAuthStoreV010();
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
const legacyEnterpriseOperatingGraphStateFile =
  process.env.APP_PLATFORM_ENTERPRISE_OPERATING_GRAPH_FILE?.trim()
  || (lifecycleStateFile
    ? join(dirname(lifecycleStateFile), "enterprise-operating-graphs.json")
    : undefined);
const legacyEogExpectedSopStateFile =
  process.env.APP_PLATFORM_EOG_EXPECTED_SOP_FILE?.trim()
  || (lifecycleStateFile
    ? join(dirname(lifecycleStateFile), "eog-expected-sops.json")
    : undefined);
const enterpriseBusinessDefinitionStateFile =
  process.env.APP_PLATFORM_ENTERPRISE_BUSINESS_DEFINITIONS_FILE?.trim()
  || (lifecycleStateFile
    ? join(dirname(lifecycleStateFile), "enterprise-business-definitions.json")
    : undefined);
const enterpriseBusinessDefinitionRepository =
  enterpriseBusinessDefinitionStateFile
    ? createFileBusinessDefinitionRepositoryV010(
        enterpriseBusinessDefinitionStateFile
      )
    : createMemoryBusinessDefinitionRepositoryV010();

const enterpriseDefinitionProjectionStateFile =
  process.env.APP_PLATFORM_ENTERPRISE_DEFINITION_PROJECTIONS_FILE?.trim()
  || (lifecycleStateFile
    ? join(dirname(lifecycleStateFile), "enterprise-definition-projections.json")
    : undefined);
const enterpriseDefinitionProjectionStore =
  enterpriseDefinitionProjectionStateFile
    ? createFileDefinitionProjectionStoreV010(
        enterpriseDefinitionProjectionStateFile
      )
    : createMemoryDefinitionProjectionStoreV010();

const legacyGraphMigration = migrateLegacyEnterpriseOperatingGraphsV010({
  path: legacyEnterpriseOperatingGraphStateFile,
  repository: enterpriseBusinessDefinitionRepository
});
if (legacyGraphMigration.sourcePresent && legacyGraphMigration.imported > 0) {
  console.log(
    `Migrated ${legacyGraphMigration.imported} legacy EOG graph definition(s) into Enterprise Context.`
  );
}
const enterpriseOperatingGraphDefinitionPersistence =
  createEnterpriseOperatingGraphDefinitionPersistenceV010(
    enterpriseBusinessDefinitionRepository
  );
const enterpriseOperatingGraphService =
  createEnterpriseOperatingGraphHostServiceV010({
    persistence: enterpriseOperatingGraphDefinitionPersistence,
    id: randomUUID
  });

const eogPreviewSeed = parseEogPreviewSeedV010(
  process.env.APP_PLATFORM_EOG_PREVIEW_SEED_JSON
);
const eogPreviewSeedResult = applyEogPreviewSeedV010({
  service: enterpriseOperatingGraphService,
  seed: eogPreviewSeed
});
if (eogPreviewSeedResult.seeded) {
  console.log(
    "Seeded EOG public preview graph '" + eogPreviewSeedResult.graphId + "'."
  );
}

const enterpriseOperatingGraphViewStateFile =
  process.env.APP_PLATFORM_ENTERPRISE_OPERATING_GRAPH_VIEW_FILE?.trim()
  || (lifecycleStateFile
    ? join(dirname(lifecycleStateFile), "enterprise-operating-graph-views.json")
    : undefined);
const enterpriseOperatingGraphViewStore = enterpriseOperatingGraphViewStateFile
  ? createFileEogViewStateStoreV010(
      enterpriseOperatingGraphViewStateFile
    )
  : createMemoryEogViewStateStoreV010();
const enterpriseOperatingGraphViewService =
  createEogViewStateProviderV010({
    store: enterpriseOperatingGraphViewStore
  });

const applicationRuntimeBindingStateFile =
  process.env.APP_PLATFORM_APPLICATION_RUNTIME_BINDING_FILE?.trim()
  || process.env.APP_PLATFORM_EOG_APPLICATION_RUNTIME_BINDING_FILE?.trim()
  || (lifecycleStateFile
    ? join(dirname(lifecycleStateFile), "eog-application-runtime-bindings.json")
    : undefined);
const applicationRuntimeBindingStore = applicationRuntimeBindingStateFile
  ? createFileEnterpriseApplicationRuntimeBindingStoreV010(
      applicationRuntimeBindingStateFile
    )
  : createMemoryEnterpriseApplicationRuntimeBindingStoreV010();
const applicationRuntimeBindingProvider =
  createEnterpriseApplicationRuntimeBindingProviderV010({
    store: applicationRuntimeBindingStore
  });

const legacySopMigration = migrateLegacyEogSopsV010({
  path: legacyEogExpectedSopStateFile,
  repository: enterpriseBusinessDefinitionRepository
});
if (legacySopMigration.sourcePresent && legacySopMigration.imported > 0) {
  console.log(
    `Migrated ${legacySopMigration.imported} legacy EOG SOP definition(s) into Enterprise Context.`
  );
}
const eogExpectedSopService =
  createEogExpectedSopServiceV010({
    repository: enterpriseBusinessDefinitionRepository,
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
const configuredConversationAuthority =
  process.env.APP_PLATFORM_CONVERSATION_AUTHORITY?.trim().toUpperCase()
  || "JSONL";
if (
  configuredConversationAuthority !== "JSONL"
  && configuredConversationAuthority !== "JSONL_MIRROR_POSTGRES"
  && configuredConversationAuthority !== "POSTGRES"
) {
  throw new Error("CONVERSATION_AUTHORITY_INVALID");
}
const conversationDatabaseUrl =
  process.env.APP_PLATFORM_CONVERSATION_DATABASE_URL?.trim();
const conversationPostgresSchema =
  process.env.APP_PLATFORM_CONVERSATION_POSTGRES_SCHEMA?.trim();
const workbenchDatabaseUrl =
  process.env.APP_PLATFORM_WORKBENCH_DATABASE_URL?.trim()
  || conversationDatabaseUrl;
const workbenchPostgresSchema =
  process.env.APP_PLATFORM_WORKBENCH_POSTGRES_SCHEMA?.trim();
const personalWorkbenchStateStore = workbenchDatabaseUrl
  ? await createPostgresPersonalWorkbenchStateStoreV010({
      connectionString: workbenchDatabaseUrl,
      ...(workbenchPostgresSchema
        ? { schema: workbenchPostgresSchema }
        : {})
    })
  : createMemoryPersonalWorkbenchStateStoreV010();
let conversationPostgresAuthority:
  | PostgresConversationAuthorityV010
  | undefined;
if (conversationDatabaseUrl) {
  conversationPostgresAuthority =
    await createPostgresConversationAuthorityV010({
      connectionString: conversationDatabaseUrl,
      ...(conversationPostgresSchema
        ? { schema: conversationPostgresSchema }
        : {})
    });
}
if (
  configuredConversationAuthority !== "JSONL"
  && !conversationPostgresAuthority
) {
  throw new Error("CONVERSATION_POSTGRES_DATABASE_URL_REQUIRED");
}
const conversationThreadEventStore = conversationThreadFile
  ? createJsonlConversationThreadEventStoreV010(conversationThreadFile)
  : createMemoryConversationThreadEventStoreV010();
const compatibilityConversationThreadStore =
  createConversationThreadStoreV010({
    eventStore: conversationThreadEventStore,
    eventId: randomUUID
  });
const migrateJsonlOnStartup =
  process.env.APP_PLATFORM_CONVERSATION_MIGRATE_JSONL_ON_STARTUP?.trim()
    .toLowerCase() === "true";
if (
  conversationPostgresAuthority
  && conversationThreadFile
  && (
    configuredConversationAuthority === "JSONL_MIRROR_POSTGRES"
    || migrateJsonlOnStartup
  )
) {
  const migrated = await conversationPostgresAuthority.importEvents(
    conversationThreadEventStore.listEvents()
  );
  console.log(
    "CONVERSATION_POSTGRES_STARTUP_MIGRATION_PASS",
    JSON.stringify({
      authority: configuredConversationAuthority,
      sourceEventCount: migrated.sourceEventCount,
      sourceThreadCount: migrated.sourceThreadCount,
      sourceMessageCount: migrated.sourceMessageCount,
      sourceDigest: migrated.sourceDigest,
      target: migrated.target
    })
  );
}
const conversationThreadStore =
  configuredConversationAuthority === "POSTGRES"
    ? conversationPostgresAuthority!.store
    : configuredConversationAuthority === "JSONL_MIRROR_POSTGRES"
      ? createMirroredConversationThreadStoreV010({
          primary: compatibilityConversationThreadStore,
          postgres: conversationPostgresAuthority!,
          onMirrorError(error, threadId) {
            console.error(
              "CONVERSATION_POSTGRES_MIRROR_FAILED",
              JSON.stringify({
                threadId,
                error: error instanceof Error ? error.message : String(error)
              })
            );
          }
        })
      : compatibilityConversationThreadStore;

const conversationContextArtifactStore = conversationDatabaseUrl
  ? await createPostgresConversationContextArtifactStoreV010({
      connectionString: conversationDatabaseUrl,
      ...(conversationPostgresSchema
        ? { schema: conversationPostgresSchema }
        : {})
    })
  : undefined;
const conversationContextAssembler = conversationContextArtifactStore
  ? createConversationContextAssemblerV010({
      artifactStore: conversationContextArtifactStore
    })
  : undefined;
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
const transportTraffic = createTransportTrafficDiagnosticsV010();
const webPerformance = createWebPerformanceStoreV010(
  Number.parseInt(process.env.APP_PLATFORM_WEB_PERFORMANCE_CAPACITY ?? "500", 10)
);
const appHostAssetRevision = normalizeAssetRevisionV010(
  process.env.APP_PLATFORM_ASSET_REVISION
  ?? process.env.RAILWAY_GIT_COMMIT_SHA
  ?? process.env.APP_PLATFORM_DEPLOY_REVISION
);
const appHostShellHtml = createAppHostShellHtmlV010(appHostAssetRevision);
const webAssetArchive = createWebAssetArchiveV010({
  currentRevision: appHostAssetRevision,
  sourceRoot: fileURLToPath(new URL("../", import.meta.url)),
  archiveRoot:
    process.env.APP_PLATFORM_WEB_ASSET_ARCHIVE_DIR?.trim()
    || (lifecycleStateFile
      ? join(dirname(lifecycleStateFile), "web-assets")
      : undefined),
  shellCss: appHostShellCss,
  retention: Number.parseInt(
    process.env.APP_PLATFORM_WEB_ASSET_RETENTION ?? "5",
    10
  )
});
let webAssetArchiveError: string | undefined;
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

providerRuntimeRegistry.replace<EnterpriseApplicationRuntimeBindingProviderV010>(
  APPLICATION_RUNTIME_BINDING_PROVIDER_ID,
  applicationRuntimeBindingProvider
);
providerRuntimeRegistry.setHealth(
  APPLICATION_RUNTIME_BINDING_PROVIDER_ID,
  {
    state: "HEALTHY",
    message: "Enterprise Application Runtime Binding runtime is ready; package lifecycle controls discoverability.",
    checkedAt: new Date().toISOString()
  }
);

if (managedSessionEnabled) {
  providerRuntimeRegistry.replace<RequestIdentitySessionProviderV010>(
    HOST_MANAGED_SESSION_PROVIDER_ID,
    createHostManagedSessionProviderV010(managedSessionService)
  );
  providerRuntimeRegistry.setHealthProbe(
    HOST_MANAGED_SESSION_PROVIDER_ID,
    createHostManagedSessionHealthProbeV010(managedSessionService)
  );
  providerRuntimeRegistry.setHealth(HOST_MANAGED_SESSION_PROVIDER_ID, {
    state: "HEALTHY",
    message: "Host-managed durable request Session Provider is active.",
    checkedAt: new Date().toISOString()
  });
}

providerRuntimeRegistry.replace<IdentityUserDirectoryProviderV010>(
  HOST_IDENTITY_USER_DIRECTORY_PROVIDER_ID,
  identityUserDirectoryService.provider
);
providerRuntimeRegistry.setHealthProbe(
  HOST_IDENTITY_USER_DIRECTORY_PROVIDER_ID,
  createHostIdentityUserDirectoryHealthProbeV010(
    identityUserDirectoryService.provider
  )
);
providerRuntimeRegistry.setHealth(HOST_IDENTITY_USER_DIRECTORY_PROVIDER_ID, {
  state: "HEALTHY",
  message: "Host Identity User Directory Provider is active.",
  checkedAt: new Date().toISOString()
});

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
providerRuntimeRegistry.replace<BusinessDefinitionRepositoryV010>(
  HOST_ENTERPRISE_BUSINESS_DEFINITION_PROVIDER_ID,
  enterpriseBusinessDefinitionRepository
);
providerRuntimeRegistry.setHealth(
  HOST_ENTERPRISE_BUSINESS_DEFINITION_PROVIDER_ID,
  {
    state: "HEALTHY",
    message: "Enterprise Context Business Definitions are active.",
    checkedAt: new Date().toISOString()
  }
);
providerRuntimeRegistry.replace<EnterpriseResourceRepositoryV010>(
  HOST_ENTERPRISE_RESOURCE_PROVIDER_ID,
  enterpriseResourceRepository
);
providerRuntimeRegistry.setHealth(
  HOST_ENTERPRISE_RESOURCE_PROVIDER_ID,
  {
    state: "HEALTHY",
    message: "Enterprise Context Resource Library is active.",
    checkedAt: new Date().toISOString()
  }
);
const enterpriseTemplateTransferProvider =
  createEnterpriseTemplateTransferProviderV010(
    enterpriseBusinessDefinitionRepository
  );
providerRuntimeRegistry.replace<EnterpriseTemplateTransferProviderV010>(
  HOST_ENTERPRISE_TEMPLATE_TRANSFER_PROVIDER_ID,
  enterpriseTemplateTransferProvider
);
providerRuntimeRegistry.setHealth(
  HOST_ENTERPRISE_TEMPLATE_TRANSFER_PROVIDER_ID,
  {
    state: "HEALTHY",
    message: "Enterprise Context Template Transfer is active.",
    checkedAt: new Date().toISOString()
  }
);
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
const authorizationPolicy = mergeHostStaticAuthorizationPoliciesV010(
  parseHostStaticAuthorizationPolicyV010(
    process.env.APP_PLATFORM_AUTHORIZATION_POLICY_JSON
  ),
  enterpriseContextGovernanceAuthorizationPolicyV010,
  eogDefinitionProjectionAuthorizationPolicyV010,
  dataImportAuthorizationPolicyV010,
  counterpartyAuthorizationPolicyV010,
  objectExtensionAuthorizationPolicyV010,
  ledgerManagerAuthorizationPolicyV010,
  templateStoreAuthorizationPolicyV010,
  parseHostStaticAuthorizationPolicyV010(
    process.env.APP_PLATFORM_AUTHORIZATION_POLICY_OVERLAY_JSON
  )
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

const workbenchService = createWorkbenchServiceV010({
  manager,
  personalState: personalWorkbenchStateStore,
  enterpriseRoleLayer({ contextId, relationshipKind }) {
    return workbenchEnterpriseRoleDefaults.layer(
      contextId,
      relationshipKind
    );
  },
  resolveRelationshipKind(context) {
    const active = context.context?.activeContext;
    if (!active || active.kind !== "ENTERPRISE") return undefined;
    return (
      resolveEnterpriseContextRelationshipProvider()
        ?.listForPrincipal(context.principal) ?? []
    ).find(item =>
      item.contextId === active.contextId
      && item.state === "ACTIVE"
    )?.kind;
  },
  resolveAuthorizationProvider
});

const eog2dStartupSnapshot = manager.getSnapshot();
if (
  eog2dStartupSnapshot.installedPackages.some(
    item => item.packageId === EOG_2D_DESIGNER_PACKAGE_ID
  )
  && eog2dStartupSnapshot.activeFeatures.some(
    item => item.featureId === EOG_2D_VIEWER_FEATURE_ID
  )
  && !eog2dStartupSnapshot.activeFeatures.some(
    item => item.featureId === EOG_2D_DESIGNER_FEATURE_ID
  )
) {
  try {
    manager.enable(EOG_2D_DESIGNER_PACKAGE_ID);
    console.log(
      "Migrated EOG 2D installation to activate the contextual projection Designer."
    );
  } catch (error) {
    console.error(
      "Failed to activate EOG 2D projection Designer migration.",
      error
    );
  }
}

if (!manager.getSnapshot().activeFeatures.some(
  feature => feature.featureId === EOG_3D_VIEWER_FEATURE_ID
)) {
  try {
    manager.install(EOG_3D_VIEWER_PACKAGE_ID);
    console.log("Activated EOG 3D Viewer ownership cutover.");
  } catch (error) {
    console.error("Failed to activate EOG 3D Viewer ownership cutover.", error);
  }
}
if (
  !manager.getSnapshot().activeFeatures.some(
    feature => feature.featureId === ENTERPRISE_OBSERVATORY_2D_FEATURE_ID
  )
  || !manager.getSnapshot().activeFeatures.some(
    feature => feature.featureId === ENTERPRISE_OBSERVATORY_3D_FEATURE_ID
  )
) {
  try {
    manager.install(ENTERPRISE_OBSERVATORY_PACKAGE_ID);
    console.log("Activated Enterprise Observatory peer plugin.");
  } catch (error) {
    console.error("Failed to activate Enterprise Observatory peer plugin.", error);
  }
}

const enterpriseOperatingGraphObservatoryProviders =
  createEnterpriseOperatingGraphObservatoryProviderResolverV020({
    manager,
    registry: providerRuntimeRegistry,
    bindings: providerBindings,
    installationId: "default"
  });

const enterpriseOperatingGraphInspectorProperties =
  createEnterpriseOperatingGraphInspectorPropertyResolverV010({
    manager,
    registry: providerRuntimeRegistry
  });

const installedAtStartup = manager.getSnapshot().installedPackages;
if (
  installedAtStartup.some(
    item => item.packageId === "evo-ledger-runtime-configurator"
  )
  && !installedAtStartup.some(
    item => item.packageId === LEDGER_MANAGER_PACKAGE_ID
  )
) {
  try {
    manager.install(LEDGER_MANAGER_PACKAGE_ID);
    console.log(
      "Migrated Ledger Configurator product surface to Ledger Manager."
    );
  } catch (error) {
    console.error(
      "Failed to activate Ledger Manager product cutover.",
      error
    );
  }
}
if (
  applicationRuntimeBindingStore.snapshot().bindings.length > 0
  && !manager.getSnapshot().activeFeatures.some(
    item => item.featureId === APPLICATION_RUNTIME_BINDING_FEATURE_ID
  )
) {
  try {
    const installed = manager.getSnapshot().installedPackages.some(
      item => item.packageId === APPLICATION_RUNTIME_BINDING_PACKAGE_ID
    );
    if (installed) {
      manager.enable(APPLICATION_RUNTIME_BINDING_PACKAGE_ID);
    } else {
      manager.install(APPLICATION_RUNTIME_BINDING_PACKAGE_ID);
    }
    console.log("Migrated persisted Application Runtime Bindings onto the active provider feature.");
  } catch (error) {
    console.error("Failed to activate Application Runtime Binding Provider.", error);
  }
}
if (!installedAtStartup.some(
  item => item.packageId === EXTERNAL_AGENT_GOVERNANCE_PACKAGE_ID
)) {
  try {
    manager.install(EXTERNAL_AGENT_GOVERNANCE_PACKAGE_ID);
    console.log("Activated EVO External Agent Governance foundation.");
  } catch (error) {
    console.error("Failed to activate EVO External Agent Governance foundation.", error);
  }
}
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
  managedSessionEnabled
  && !installedAtStartup.some(item => item.packageId === HOST_MANAGED_SESSION_PACKAGE_ID)
) {
  try {
    manager.install(HOST_MANAGED_SESSION_PACKAGE_ID);
    console.log("Activated Host Managed Session Provider.");
  } catch (error) {
    console.error("Failed to activate Host Managed Session Provider.", error);
  }
}
if (
  managedSessionEnabled
  && !manager.getSnapshot().installedPackages.some(
    item => item.packageId === HOST_IDENTITY_USER_DIRECTORY_PACKAGE_ID
  )
) {
  try {
    manager.install(HOST_IDENTITY_USER_DIRECTORY_PACKAGE_ID);
    console.log("Activated Host Identity User Directory Provider.");
  } catch (error) {
    console.error("Failed to activate Host Identity User Directory Provider.", error);
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
if (
  manager.getSnapshot().effectiveCapabilities.includes(
    ENTERPRISE_RESOURCE_CAPABILITY_V010
  )
  && !manager.getSnapshot().installedPackages.some(
    item => item.packageId === COUNTERPARTY_PACKAGE_ID
  )
) {
  try {
    manager.install(COUNTERPARTY_PACKAGE_ID);
    console.log("Activated EVO Counterparty plugin.");
  } catch (error) {
    console.error("Failed to activate EVO Counterparty plugin.", error);
  }
}
if (
  manager.getSnapshot().effectiveCapabilities.includes(
    ENTERPRISE_RESOURCE_CAPABILITY_V010
  )
  && !manager.getSnapshot().installedPackages.some(
    item => item.packageId === OBJECT_EXTENSION_PACKAGE_ID
  )
) {
  try {
    manager.install(OBJECT_EXTENSION_PACKAGE_ID);
    console.log("Activated EVO Object Extension application.");
  } catch (error) {
    console.error("Failed to activate EVO Object Extension application.", error);
  }
}
if (
  manager.getSnapshot().effectiveCapabilities.includes(
    ENTERPRISE_RESOURCE_CAPABILITY_V010
  )
  && !manager.getSnapshot().installedPackages.some(
    item => item.packageId === DATA_IMPORT_PACKAGE_ID
  )
) {
  try {
    manager.install(DATA_IMPORT_PACKAGE_ID);
    console.log("Activated EVO Data Import application.");
  } catch (error) {
    console.error("Failed to activate EVO Data Import application.", error);
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

function resolveApplicationRuntimeBindingProvider():
  EnterpriseApplicationRuntimeBindingProviderV010 | undefined {
  return resolveProviderRuntimeV010<EnterpriseApplicationRuntimeBindingProviderV010>(
    providerRuntimeRegistry,
    manager.listEffectiveServiceProviders(
      ENTERPRISE_APPLICATION_RUNTIME_BINDING_CAPABILITY_V010
    ),
    providerBindings,
    ENTERPRISE_APPLICATION_RUNTIME_BINDING_CAPABILITY_V010,
    { installationId: "default" }
  )?.runtime;
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

const externalAgentGovernanceService =
  createExternalAgentGovernanceServiceV010({
    store: externalAgentGovernanceStore,
    manager,
    resolveAuthorizationProvider
  });

function resolveIdentityUserDirectoryProvider(): IdentityUserDirectoryProviderV010 | undefined {
  return resolveProviderRuntimeV010<IdentityUserDirectoryProviderV010>(
    providerRuntimeRegistry,
    manager.listEffectiveServiceProviders(IDENTITY_USER_DIRECTORY_CAPABILITY),
    providerBindings,
    IDENTITY_USER_DIRECTORY_CAPABILITY,
    { installationId: "default" }
  )?.runtime;
}

function resolveIdentityAuthenticationProvider(): IdentityAuthenticationProviderV010 | undefined {
  return resolveProviderRuntimeV010<IdentityAuthenticationProviderV010>(
    providerRuntimeRegistry,
    manager.listEffectiveServiceProviders(IDENTITY_AUTHENTICATION_CAPABILITY),
    providerBindings,
    IDENTITY_AUTHENTICATION_CAPABILITY,
    { installationId: "default" }
  )?.runtime;
}

function authenticationFlow() {
  if (!managedSessionEnabled) {
    throw new Error("MANAGED_IDENTITY_SESSION_NOT_ENABLED");
  }
  if (!authenticationPublicBaseUrl) {
    throw new Error("AUTHENTICATION_PUBLIC_BASE_URL_REQUIRED");
  }
  const provider = resolveIdentityAuthenticationProvider();
  if (!provider) {
    throw new Error("IDENTITY_AUTHENTICATION_PROVIDER_UNAVAILABLE");
  }
  return createAuthenticationFlowV010({
    provider,
    sessions: managedSessionService,
    publicBaseUrl: authenticationPublicBaseUrl,
    sessionTtlSeconds: authenticationSessionTtlSeconds,
    secureCookie: !authenticationPublicBaseUrl.startsWith("http://localhost"),
    onAuthenticatedPrincipal(principal) {
      const directory = resolveIdentityUserDirectoryProvider();
      if (!directory) {
        throw new Error("IDENTITY_USER_DIRECTORY_PROVIDER_UNAVAILABLE");
      }
      identityUserDirectoryService.recordAuthenticatedPrincipal(principal);
    }
  });
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

function externalAgentDelegatedAuthorityDependencies() {
  return {
    store: externalAgentGovernanceStore,
    manager,
    identityDirectory: resolveIdentityUserDirectoryProvider(),
    enterpriseDirectory: resolveEnterpriseContextProvider(),
    enterpriseGrants: resolveEnterpriseContextGrantProvider(),
    authorizationProvider: resolveAuthorizationProvider()
  };
}

function externalAgentOAuthService() {
  if (
    !externalAgentOAuthEnabled
    || !externalAgentOAuthIssuer
    || !externalAgentOAuthResource
  ) {
    throw new Error("EXTERNAL_AGENT_OAUTH_NOT_ENABLED");
  }
  return createExternalAgentOAuthServiceV010({
    store: externalAgentOAuthStore,
    governanceStore: externalAgentGovernanceStore,
    delegatedAuthority: externalAgentDelegatedAuthorityDependencies(),
    resourceIdentifier: externalAgentOAuthResource,
    authorizationServerIssuer: externalAgentOAuthIssuer,
    resourceName: "EVO External Agent Access"
  });
}

function buildExternalAgentHumanRequestContext(
  session: IdentitySessionV010,
  contextId: string,
  correlationId: string
): PlatformRequestContextV010 {
  const registry = createContextRegistryForSession(session);
  const selected = registry.list().find(item => item.contextId === contextId);
  if (!selected) throw new Error("EXTERNAL_AGENT_GRANT_CONTEXT_NOT_AVAILABLE");
  const context = registry.resolve(selected);
  const principal = {
    ...structuredClone(session.principal),
    sessionId: session.sessionId
  };
  const partial: PlatformRequestContextV010 = {
    contractVersion: "0.1.0",
    principal,
    scope: {
      contractVersion: "0.1.0",
      userId: principal.subjectId
    },
    context,
    correlationId
  };
  return {
    ...partial,
    scope: legacyScopeFromRequestContextV010(partial)
  };
}

function externalAgentOAuthHttpAdapter() {
  return createExternalAgentOAuthHttpAdapterV010({
    oauth: externalAgentOAuthService(),
    governanceStore: externalAgentGovernanceStore,
    governance: externalAgentGovernanceService,
    delegatedAuthority: externalAgentDelegatedAuthorityDependencies(),
    buildHumanRequestContext: buildExternalAgentHumanRequestContext,
    listHumanEnterpriseContexts(session) {
      const registry = createContextRegistryForSession(session);
      return registry.list().flatMap(ref => {
        if (ref.kind !== "ENTERPRISE") return [];
        const resolved = registry.resolve(ref);
        const enterprise = resolved.enterpriseContext;
        if (!enterprise) return [];
        return [{
          contextId: ref.contextId,
          enterpriseId: ref.enterpriseId,
          displayName:
            enterprise.displayName
            ?? enterprise.enterpriseId
        }];
      });
    }
  });
}

function externalAgentMcpHttpAdapterFor(
  access: Awaited<ReturnType<
    ReturnType<typeof externalAgentOAuthService>["resolveAccessToken"]
  >>,
  correlationId: string
) {
  const projection = createMcpCapabilityProjectionV010({
    delegatedAuthority: externalAgentDelegatedAuthorityDependencies(),
    actionRouter,
    productAdapter: createCompositeMcpProductAdapterV010([
      createChatGptMcpProductAdapterV010()
    ]),
    mode: externalAgentMcpCapabilityMode
  });
  const core = createMcpModernCoreV010({
    serverInfo: {
      name: "evo-app-platform",
      title: "EVO App Platform",
      version: "0.1.0",
      description:
        "Governed External Agent access to authorized EVO plugin capabilities."
    },
    instructions:
      externalAgentMcpCapabilityMode === "DIRECT"
        ? "Use only tools returned by the current authorized EVO capability catalog."
        : "Use EVO Capability Fabric to search and understand current authorized capabilities before invocation. Direct capability tools may also be present during HYBRID migration.",
    listTools() {
      return projection.listTools({
        access,
        correlationId
      });
    },
    callTool({ name, arguments: args }) {
      return projection.callTool({
        access,
        correlationId,
        name,
        arguments: args
      });
    }
  });
  return createMcpModernHttpAdapterV010(core);
}

function externalAgentMcpProtectedResource() {
  if (
    !externalAgentMcpEnabled
    || !externalAgentOAuthIssuer
    || !externalAgentOAuthResource
  ) {
    throw new Error("EXTERNAL_AGENT_MCP_NOT_ENABLED");
  }
  return createMcpProtectedResourceV010({
    oauth: externalAgentOAuthService(),
    resourceIdentifier: externalAgentOAuthResource,
    resourceMetadataUrl:
      externalAgentOAuthIssuer
      + "/.well-known/oauth-protected-resource/mcp",
    handleAuthorized({ access, request, correlationId }) {
      return externalAgentMcpHttpAdapterFor(
        access,
        correlationId
      ).handle(request);
    }
  });
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
const tradingLiteEvoApplicationId =
  process.env.APP_PLATFORM_TRADING_LITE_EVO_APPLICATION_ID?.trim()
  || "sales_order";
const evoRuntimeScopeMap = (() => {
  const raw = process.env.APP_PLATFORM_EVO_RUNTIME_SCOPE_MAP_JSON?.trim();
  if (!raw) return new Map<string, string>();
  const parsed = JSON.parse(raw) as unknown;
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("EVO_RUNTIME_SCOPE_MAP_INVALID");
  }
  const result = new Map<string, string>();
  for (const [hostEnterpriseId, value] of Object.entries(parsed)) {
    if (
      !hostEnterpriseId.trim()
      || typeof value !== "string"
      || !value.trim()
    ) {
      throw new Error("EVO_RUNTIME_SCOPE_MAP_INVALID");
    }
    result.set(hostEnterpriseId.trim(), value.trim());
  }
  return result;
})();
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
if (
  evoObservatoryApplicationMap.length > 0
  && !manager.getSnapshot().activeFeatures.some(
    item => item.featureId === APPLICATION_RUNTIME_BINDING_FEATURE_ID
  )
) {
  try {
    const installed = manager.getSnapshot().installedPackages.some(
      item => item.packageId === APPLICATION_RUNTIME_BINDING_PACKAGE_ID
    );
    if (installed) {
      manager.enable(APPLICATION_RUNTIME_BINDING_PACKAGE_ID);
    } else {
      manager.install(APPLICATION_RUNTIME_BINDING_PACKAGE_ID);
    }
    console.log("Activated Application Runtime Binding Provider for configured EVO Observatory mappings.");
  } catch (error) {
    console.error("Failed to activate Application Runtime Binding Provider.", error);
  }
}
const configuredApplicationRuntimeBindingProvider =
  evoObservatoryApplicationMap.length > 0
    ? resolveApplicationRuntimeBindingProvider()
    : undefined;
if (
  evoObservatoryApplicationMap.length > 0
  && !configuredApplicationRuntimeBindingProvider
) {
  throw new Error("APPLICATION_RUNTIME_BINDING_PROVIDER_REQUIRED");
}
for (const mapping of evoObservatoryApplicationMap) {
  configuredApplicationRuntimeBindingProvider!.bind({
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
const evoBusinessDataAdapter = createEvoBusinessDataHttpAdapterV010({
  baseUrl: evoBaseUrl
});
const evoRuntimeObservationAdapter = createEvoRuntimeObservationHttpAdapterV010({
  baseUrl: evoBaseUrl
});
let compatibilityEvoRuntimeScopeKey: string | undefined;

async function resolveCompatibilityEvoRuntimeScopeKey(): Promise<string> {
  if (compatibilityEvoRuntimeScopeKey) return compatibilityEvoRuntimeScopeKey;
  const response = await fetch(
    evoBaseUrl
      + "/api/v1/enterprises/"
      + encodeURIComponent(evoEnterpriseCode),
    { headers: { accept: "application/json" } }
  );
  const body = await response.json() as {
    id?: string;
    code?: string;
    status?: string;
    error?: { code?: string; message?: string };
  };
  if (!response.ok || typeof body.id !== "string" || !body.id.trim()) {
    throw new Error(
      (body.error?.code ?? "EVO_RUNTIME_SCOPE_RESOLUTION_FAILED")
      + ": "
      + (body.error?.message ?? response.statusText)
    );
  }
  compatibilityEvoRuntimeScopeKey = body.id.trim();
  return compatibilityEvoRuntimeScopeKey;
}

async function resolveTradingLiteEvoRuntimeTarget(
  context: PlatformRequestContextV010 | undefined
): Promise<{ scopeKey: string; enterpriseId: string; applicationId: string }> {
  const active = context?.context?.activeContext;
  if (!active || active.kind !== "ENTERPRISE") {
    throw new Error("TRADING_LITE_ENTERPRISE_CONTEXT_REQUIRED");
  }

  const provider = resolveApplicationRuntimeBindingProvider();
  if (!provider) {
    throw new Error("APPLICATION_RUNTIME_BINDING_PROVIDER_REQUIRED");
  }

  const enterpriseId = active.enterpriseId;
  let binding = provider.resolve({
    enterpriseId,
    hostApplicationRefId: TRADING_LITE_HOST_APPLICATION_REF_ID_V010,
    runtimeProviderId: EVO_LEDGER_RUNTIME_PROVIDER_ID_V010
  });
  if (!binding) {
    binding = provider.bind({
      enterpriseId,
      hostApplicationRefId: TRADING_LITE_HOST_APPLICATION_REF_ID_V010,
      runtimeProviderId: EVO_LEDGER_RUNTIME_PROVIDER_ID_V010,
      runtimeApplicationId: tradingLiteEvoApplicationId
    });
  }

  const runtime = toEvoLedgerRuntimeApplicationIdBindingV010(binding);
  const evoEnterpriseId =
    evoRuntimeScopeMap.get(enterpriseId)
    ?? await resolveCompatibilityEvoRuntimeScopeKey();
  return {
    scopeKey: evoEnterpriseId,
    enterpriseId: evoEnterpriseId,
    applicationId: runtime.applicationId
  };
}

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

async function refreshGenericOidcProviderRuntime(): Promise<void> {
  try {
    const result = await configureGenericOidcProviderRuntimeV010({
      settings: settingsStore.getNamespace(GENERIC_OIDC_PACKAGE_ID),
      secrets: resolveManagedSecretsProvider(),
      registry: providerRuntimeRegistry
    });
    if (!result.configured) {
      console.log(
        "Generic OIDC Identity Provider runtime is not active: " + result.reason + "."
      );
    }
  } catch (error) {
    providerRuntimeRegistry.remove(GENERIC_OIDC_PROVIDER_ID);
    console.error("Generic OIDC Identity Provider failed closed.", error);
  }
}

await refreshGenericOidcProviderRuntime();

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
      return resolveApplicationRuntimeBindingProvider()?.resolve({
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

function current2dEditorSessionKeysV010(
  principal: PlatformPrincipalV010
): string[] {
  return [
    principal.sessionId?.trim(),
    principal.subjectId.trim()
  ].filter((value, index, values): value is string =>
    Boolean(value) && values.indexOf(value) === index
  );
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
  const editorEnterpriseRef = (enterpriseId: string) =>
    contextRegistry.list().find(candidate =>
      candidate.kind === "ENTERPRISE"
      && candidate.enterpriseId === enterpriseId
    );
  const canManageEditorEnterprise = (
    currentPrincipal: PlatformPrincipalV010,
    enterpriseId: string
  ) => {
    const ref = editorEnterpriseRef(enterpriseId);
    if (!ref) return false;
    return (
      resolveEnterpriseContextRelationshipProvider()
        ?.listForPrincipal(currentPrincipal) ?? []
    ).some(item =>
      item.contextId === ref.contextId
      && item.state === "ACTIVE"
      && (item.kind === "OWNER" || item.kind === "ADMIN")
    );
  };
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
    async authorizeWrite(descriptor, args) {
      if (!requestContext) {
        return {
          allowed: false,
          code: "REQUEST_CONTEXT_REQUIRED",
          message: "Material WRITE requires a Host-resolved request context."
        };
      }

      if (descriptor.id === PERSONAL_AGENT_CAPABILITY_INVOKE_WRITE_TOOL_ID) {
        const operationId =
          typeof args.operationId === "string"
            ? args.operationId.trim()
            : "";
        if (!operationId) {
          return {
            allowed: false,
            code: "PERSONAL_AGENT_CAPABILITY_OPERATION_REQUIRED",
            message: "A concrete Capability Operation is required before WRITE authorization."
          };
        }
        const capabilityCatalog =
          await listAuthorizedCapabilityOperationsV010({
            manager,
            authorizationProvider: resolveAuthorizationProvider(),
            requestContext:
              personalAgentCapabilityRequestContextV010(requestContext),
            audience: "PERSONAL_AGENT"
          });
        const operation = capabilityCatalog.operations.find(item =>
          item.operationId === operationId && item.effect === "WRITE"
        );
        return operation
          ? { allowed: true }
          : {
              allowed: false,
              code: "PERSONAL_AGENT_CAPABILITY_NOT_AUTHORIZED",
              message:
                "The requested WRITE Capability Operation is not currently authorized for Personal Agent."
            };
      }

      const current2dEditorWrite =
        descriptor.id === "enterprise.current_2d_editor.crop";
      const current2dEditorTarget = current2dEditorWrite
        ? current2dEditorSessionKeysV010(principal)
            .map(key => current2dEditorSessions.get(key))
            .find(target => target !== undefined)
        : undefined;
      if (current2dEditorWrite && !current2dEditorTarget) {
        return {
          allowed: false,
          code: "CURRENT_2D_EDITOR_REQUIRED",
          message: "Open the target 2D editor before asking Personal Agent to change the current canvas."
        };
      }
      const current2dEditorEnterpriseRef = current2dEditorTarget
        ? editorEnterpriseRef(current2dEditorTarget.enterpriseId)
        : undefined;
      if (current2dEditorWrite && !current2dEditorEnterpriseRef) {
        return {
          allowed: false,
          code: "CURRENT_2D_EDITOR_ENTERPRISE_ACCESS_REQUIRED",
          message: "The current 2D editor belongs to an Enterprise Context that is not available to this principal."
        };
      }
      if (
        current2dEditorTarget
        && !canManageEditorEnterprise(
          principal,
          current2dEditorTarget.enterpriseId
        )
      ) {
        return {
          allowed: false,
          code: "CURRENT_2D_EDITOR_MANAGE_ROLE_REQUIRED",
          message: "Changing the current 2D editor requires an ACTIVE Owner or Admin relationship for its Enterprise Context."
        };
      }

      const current2dAuthorization: MaterialWriteAuthorizationInputV010 | undefined =
        current2dEditorTarget?.kind === "DEFINITION_PROJECTION"
        ? {
            action: EOG_DEFINITION_PROJECTION_SAVE_AUTHORIZATION_ACTION_V010,
            resource: {
              type: EOG_DEFINITION_PROJECTION_RESOURCE_TYPE_V010,
              id:
                `${current2dEditorTarget.definitionId}#${current2dEditorTarget.projectionId}`,
              attributes: {
                enterpriseId: current2dEditorTarget.enterpriseId,
                definitionRevision: current2dEditorTarget.definitionRevision,
                operator: "PERSONAL_AGENT"
              }
            }
          }
        : current2dEditorTarget?.kind === "OPERATING_GRAPH"
          ? {
              action: EOG_OPERATING_GRAPH_VIEW_EDIT_AUTHORIZATION_ACTION_V010,
              resource: {
                type: EOG_OPERATING_GRAPH_VIEW_RESOURCE_TYPE_V010,
                id: current2dEditorTarget.resourceId,
                attributes: {
                  enterpriseId: current2dEditorTarget.enterpriseId,
                  graphId: current2dEditorTarget.graphId,
                  operator: "PERSONAL_AGENT"
                }
              }
            }
          : undefined;

      const authorizationRequestContext =
        current2dEditorEnterpriseRef
          ? {
              ...requestContext,
              context: contextRegistry.resolve(
                current2dEditorEnterpriseRef
              )
            }
          : requestContext;
      const decision = await authorizeMaterialWriteV010(
        resolveAuthorizationProvider(),
        authorizationRequestContext,
        current2dAuthorization ?? {
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
    ...(requestContext
      ? createPersonalAgentCapabilityToolRegistrationsV010({
          manager,
          actionRouter,
          requestContext,
          resolveAuthorizationProvider
        })
      : []),
    ...createEnterpriseOperatingGraphAgentToolRegistrationsV010({
      service: enterpriseOperatingGraphService,
      viewService: enterpriseOperatingGraphViewService,
      principal,
      context,
      isDesignerActive: () => manager.getSnapshot().activeFeatures.some(
        feature => feature.featureId === EOG_2D_DESIGNER_FEATURE_ID
      ),
      is3dViewerActive: () => manager.getSnapshot().activeFeatures.some(
        feature => feature.featureId === EOG_3D_VIEWER_FEATURE_ID
      )
    }),
    ...createCurrent2dEditorAgentToolRegistrationsV010({
      currentEditors: current2dEditorSessions,
      graphService: enterpriseOperatingGraphService,
      graphViewService: enterpriseOperatingGraphViewService,
      definitionRepository: enterpriseBusinessDefinitionRepository,
      definitionProjectionStore: enterpriseDefinitionProjectionStore,
      definitionProjectionSource:
        createEnterpriseDefinitionProjectionArtifactSourceV010(
          enterpriseBusinessDefinitionRepository,
          enterpriseDefinitionProjectionStore
        ),
      principal,
      context,
      locale,
      isDesignerActive: () => manager.getSnapshot().activeFeatures.some(
        feature => feature.featureId === EOG_2D_DESIGNER_FEATURE_ID
      ),
      canAccessEnterprise(_currentPrincipal, enterpriseId) {
        return editorEnterpriseRef(enterpriseId) !== undefined;
      },
      canManageEnterprise(currentPrincipal, enterpriseId) {
        return canManageEditorEnterprise(currentPrincipal, enterpriseId);
      },
      onEditorUpdated(update) {
        const editorContext = editorEnterpriseRef(
          update.target.enterpriseId
        );
        if (!editorContext) {
          throw new Error(
            "CURRENT_2D_EDITOR_ENTERPRISE_ACCESS_REQUIRED"
          );
        }
        realtimeEvents.publish({
          topic: "resource.current-2d-editor",
          type: "RESOURCE_INVALIDATED",
          scope: {
            contextId: editorContext.contextId,
            enterpriseId: update.target.enterpriseId
          },
          resource: {
            kind: update.target.kind === "OPERATING_GRAPH"
              ? "enterprise-operating-graph"
              : "enterprise-business-definition-projection",
            resourceId: update.resourceId,
            ...(update.version === undefined
              ? {}
              : { version: update.version })
          },
          payload: {
            operator: "PERSONAL_AGENT",
            editorKind: update.target.kind,
            visibleNodeIds: [...update.visibleNodeIds],
            visibleEdgeIds: [...update.visibleEdgeIds]
          }
        });
      }
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
      context,
      isObservatoryActive: () => manager.getSnapshot().activeFeatures.some(
        feature => feature.featureId === ENTERPRISE_OBSERVATORY_2D_FEATURE_ID
      )
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
    ...createWorkbenchActionHandlersV010({
      service: workbenchService
    }),
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
      inspectorResolver: enterpriseOperatingGraphInspectorProperties,
      locale(context) {
        return context.locale;
      },
      onEditorRead(context, target) {
        const selectedAt = new Date().toISOString();
        for (const key of current2dEditorSessionKeysV010(context.principal)) {
          current2dEditorSessions.set(key, {
            contractVersion: "0.1.0",
            kind: "OPERATING_GRAPH",
            enterpriseId: target.enterpriseId,
            graphId: target.graphId,
            resourceId: target.resourceId,
            selectedAt
          });
        }
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
    createEnterpriseOperatingGraphObservatoryViewOperationActionHandlerV020(),
    createLazyAppActionHandlerV010({
      packageId: EOG_2D_VIEWER_PACKAGE_ID,
      featureId: EOG_2D_VIEWER_FEATURE_ID,
      commandCode: EOG_2D_VIEWER_WORKSPACE_GET_ACTION,
      async load() {
        const module = await import(
          "../apps/eog-2d-viewer/workspace-page.js"
        );
        return module.createEnterpriseOperatingGraphViewerWorkspaceReadActionV010({
          graphService: enterpriseOperatingGraphService,
          viewService: enterpriseOperatingGraphViewService,
          locale(context) {
            return context.locale;
          }
        });
      }
    }),
    createLazyAppActionHandlerV010({
      packageId: EOG_2D_VIEWER_PACKAGE_ID,
      featureId: EOG_2D_VIEWER_FEATURE_ID,
      commandCode: EOG_2D_VIEWER_WORKSPACE_SELECTION_GET_ACTION,
      async load() {
        const module = await import(
          "../apps/eog-2d-viewer/workspace-page.js"
        );
        return module.createEnterpriseOperatingGraphViewerWorkspaceSelectionReadActionV010({
          graphService: enterpriseOperatingGraphService,
          inspectorResolver: enterpriseOperatingGraphInspectorProperties
        });
      }
    }),
    createLazyAppActionHandlerV010({
      packageId: EOG_2D_VIEWER_PACKAGE_ID,
      featureId: EOG_2D_VIEWER_FEATURE_ID,
      commandCode: EOG_2D_VIEWER_TEMPLATE_PREVIEW_GET_ACTION,
      guard() {
        const templateStoreActive = manager.getSnapshot().activeFeatures.some(
          feature => feature.featureId === TEMPLATE_STORE_FEATURE_ID
        );
        return templateStoreActive
          ? undefined
          : {
              ok: false,
              error: {
                code: "TEMPLATE_STORE_NOT_ACTIVE",
                message: "Template Store is not active."
              }
            };
      },
      async load() {
        const [
          viewer,
          previewSource,
          templateStoreRepository
        ] = await Promise.all([
          import("../apps/eog-2d-viewer/template-preview.js"),
          import("../apps/template-store/preview-source.js"),
          resolveTemplateStoreRepository()
        ]);
        return viewer.createTemplate2dPreviewReadActionV010({
          source: previewSource.createTemplateStorePreviewArtifactSourceV010(
            templateStoreRepository
          )
        });
      }
    }),
    createLazyAppActionHandlerV010({
      packageId: EOG_2D_VIEWER_PACKAGE_ID,
      featureId: EOG_2D_VIEWER_FEATURE_ID,
      commandCode: EOG_2D_VIEWER_TEMPLATE_PREVIEW_SELECTION_GET_ACTION,
      guard() {
        const templateStoreActive = manager.getSnapshot().activeFeatures.some(
          feature => feature.featureId === TEMPLATE_STORE_FEATURE_ID
        );
        return templateStoreActive
          ? undefined
          : {
              ok: false,
              error: {
                code: "TEMPLATE_STORE_NOT_ACTIVE",
                message: "Template Store is not active."
              }
            };
      },
      async load() {
        const [
          viewer,
          previewSource,
          templateStoreRepository
        ] = await Promise.all([
          import("../apps/eog-2d-viewer/template-preview.js"),
          import("../apps/template-store/preview-source.js"),
          resolveTemplateStoreRepository()
        ]);
        return viewer.createTemplate2dPreviewSelectionReadActionV010({
          source: previewSource.createTemplateStorePreviewArtifactSourceV010(
            templateStoreRepository
          )
        });
      }
    }),
    createLazyAppActionHandlerV010({
      packageId: EOG_2D_VIEWER_PACKAGE_ID,
      featureId: EOG_2D_VIEWER_FEATURE_ID,
      commandCode: EOG_2D_VIEWER_DEFINITION_PREVIEW_GET_ACTION,
      async load() {
        const [viewer, sourceModule] = await Promise.all([
          import("../apps/eog-2d-viewer/definition-preview.js"),
          import("../providers/enterprise-context/definition-projection.js")
        ]);
        return viewer.createEnterpriseDefinition2dPreviewReadActionV010({
          source:
            sourceModule.createEnterpriseDefinitionProjectionArtifactSourceV010(
              enterpriseBusinessDefinitionRepository,
              enterpriseDefinitionProjectionStore
            )
        });
      }
    }),
    createLazyAppActionHandlerV010({
      packageId: EOG_2D_VIEWER_PACKAGE_ID,
      featureId: EOG_2D_VIEWER_FEATURE_ID,
      commandCode: EOG_2D_VIEWER_DEFINITION_PREVIEW_SELECTION_GET_ACTION,
      async load() {
        const [viewer, sourceModule] = await Promise.all([
          import("../apps/eog-2d-viewer/definition-preview.js"),
          import("../providers/enterprise-context/definition-projection.js")
        ]);
        return viewer.createEnterpriseDefinition2dPreviewSelectionReadActionV010({
          source:
            sourceModule.createEnterpriseDefinitionProjectionArtifactSourceV010(
              enterpriseBusinessDefinitionRepository,
              enterpriseDefinitionProjectionStore
            )
        });
      }
    }),
    createEnterpriseOperatingGraphMobileReadActionHandlerV010({
      graphService: enterpriseOperatingGraphService,
      providers: enterpriseOperatingGraphObservatoryProviders,
      locale(context) {
        return context.locale;
      }
    }),
    createEnterpriseOperatingGraph3dViewerReadActionV010({
      graphService: enterpriseOperatingGraphService,
      viewService: enterpriseOperatingGraphViewService
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
    createEnterpriseContextArchiveActionHandlerV010({
      store: enterpriseGovernanceStore,
      resolveAuthorizationProvider
    }),
    createEnterpriseContextDefaultActionHandlerV010({
      store: enterpriseGovernanceStore,
      listAvailableContexts(principal) {
        return createPrincipalContextRegistryV010(
          principal,
          principalContextSources()
        ).list();
      }
    }),
    createLazyAppActionHandlerV010({
      packageId: ENTERPRISE_CONTEXT_GOVERNANCE_APP_PACKAGE_ID,
      featureId: ENTERPRISE_CONTEXT_GOVERNANCE_APP_FEATURE_ID,
      commandCode: ENTERPRISE_CONTEXT_SELECT_COMMAND,
      async load() {
        const module = await import(
          "../apps/enterprise-context-governance/context-actions.js"
        );
        return module.createEnterpriseContextSelectionActionHandlerV010({
          listAvailableContexts(principal) {
            return createPrincipalContextRegistryV010(
              principal,
              principalContextSources()
            ).list();
          }
        });
      }
    }),
    ...[
      EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION,
      EOG_2D_DESIGNER_DEFINITION_PROJECTION_SELECTION_GET_ACTION,
      EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION
    ].map(commandCode =>
      createLazyAppActionHandlerV010({
        packageId: EOG_2D_DESIGNER_PACKAGE_ID,
        featureId: EOG_2D_DESIGNER_FEATURE_ID,
        commandCode,
        async load() {
          const [editor, sourceModule] = await Promise.all([
            import("../apps/eog-2d-designer/definition-projection-editor.js"),
            import("../providers/enterprise-context/definition-projection.js")
          ]);
          const handlers =
            editor.createEnterpriseDefinitionProjectionEditorActionHandlersV010({
              repository: enterpriseBusinessDefinitionRepository,
              projectionStore: enterpriseDefinitionProjectionStore,
              source:
                sourceModule.createEnterpriseDefinitionProjectionArtifactSourceV010(
                  enterpriseBusinessDefinitionRepository,
                  enterpriseDefinitionProjectionStore
                ),
              sessions: enterpriseDefinitionProjectionSessions,
              canManageEnterpriseContext(principal, contextId) {
                return (
                  resolveEnterpriseContextRelationshipProvider()
                    ?.listForPrincipal(principal) ?? []
                ).some(item =>
                  item.contextId === contextId
                  && item.state === "ACTIVE"
                  && (item.kind === "OWNER" || item.kind === "ADMIN")
                );
              },
              async authorizeProjectionSave(context, target) {
                const authorization = await authorizeMaterialWriteV010(
                  resolveAuthorizationProvider(),
                  context,
                  {
                    action:
                      EOG_DEFINITION_PROJECTION_SAVE_AUTHORIZATION_ACTION_V010,
                    resource: {
                      type: EOG_DEFINITION_PROJECTION_RESOURCE_TYPE_V010,
                      id: `${target.definitionId}#${target.projectionId}`,
                      attributes: {
                        enterpriseId: target.enterpriseId,
                        definitionRevision: target.definitionRevision
                      }
                    }
                  }
                );
                if (!authorization.allowed) {
                  throw new Error(
                    `${authorization.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED"}: denied by '${authorization.policyProviderId}' ${authorization.reasonCodes.join(", ")}`
                  );
                }
              },
              locale(context) {
                return context.locale;
              },
              onEditorRead(context, target) {
                const selectedAt = new Date().toISOString();
                for (const key of current2dEditorSessionKeysV010(context.principal)) {
                  current2dEditorSessions.set(key, {
                    contractVersion: "0.1.0",
                    kind: "DEFINITION_PROJECTION",
                    enterpriseId: target.enterpriseId,
                    definitionId: target.definitionId,
                    definitionRevision: target.definitionRevision,
                    projectionId: target.projectionId,
                    resourceId: target.resourceId,
                    selectedAt
                  });
                }
              }
            });
          const handler = handlers.find(
            candidate => candidate.commandCode === commandCode
          );
          if (!handler) {
            throw new Error("DEFINITION_PROJECTION_EDITOR_HANDLER_NOT_FOUND");
          }
          return handler;
        }
      })
    ),
    ...[
      COUNTERPARTY_CREATE_COMMAND,
      COUNTERPARTY_UPDATE_COMMAND,
      COUNTERPARTY_ARCHIVE_COMMAND,
      COUNTERPARTY_ASSIGN_ROLE_COMMAND,
      COUNTERPARTY_REMOVE_ROLE_COMMAND
    ].map(commandCode =>
      createLazyAppActionHandlerV010({
        packageId: COUNTERPARTY_PACKAGE_ID,
        featureId: COUNTERPARTY_FEATURE_ID,
        commandCode,
        async load() {
          const module = await import("../apps/counterparty/actions.js");
          const handlers = module.createCounterpartyActionHandlersV010({
            repository: counterpartyRepository,
            roleRepository: counterpartyRoleRepository,
            canManageEnterpriseContext(principal, contextId) {
              return (
                resolveEnterpriseContextRelationshipProvider()
                  ?.listForPrincipal(principal) ?? []
              ).some(item =>
                item.contextId === contextId
                && item.state === "ACTIVE"
                && (item.kind === "OWNER" || item.kind === "ADMIN")
              );
            },
            idFactory() {
              return "cp-" + randomUUID();
            }
          });
          const handler = handlers.find(
            candidate => candidate.commandCode === commandCode
          );
          if (!handler) {
            throw new Error("COUNTERPARTY_HANDLER_NOT_FOUND");
          }
          return handler;
        }
      })
    ),
    ...[
      COUNTERPARTY_MY_CUSTOMERS_READ_COMMAND_V010,
      COUNTERPARTY_MY_SUPPLIERS_READ_COMMAND_V010
    ].map(commandCode =>
      createLazyAppActionHandlerV010({
        packageId: COUNTERPARTY_PACKAGE_ID,
        featureId: COUNTERPARTY_FEATURE_ID,
        commandCode,
        async load() {
          const module = await import(
            "../apps/counterparty/projection-actions.js"
          );
          const handlers =
            module.createCounterpartyProjectionActionHandlersV010({
              service: counterpartyProjectionService,
              resolveEnterpriseRelationshipKind(principal, contextId) {
                return (
                  resolveEnterpriseContextRelationshipProvider()
                    ?.listForPrincipal(principal) ?? []
                ).find(item =>
                  item.contextId === contextId
                  && item.state === "ACTIVE"
                )?.kind;
              }
            });
          const handler = handlers.find(
            candidate => candidate.commandCode === commandCode
          );
          if (!handler) {
            throw new Error("COUNTERPARTY_PROJECTION_HANDLER_NOT_FOUND");
          }
          return handler;
        }
      })
    ),
    ...[
      RESPONSIBILITY_ASSIGN_COMMAND_V010,
      RESPONSIBILITY_ARCHIVE_COMMAND_V010
    ].map(commandCode =>
      createLazyAppActionHandlerV010({
        packageId: RESPONSIBILITY_PACKAGE_ID,
        featureId: RESPONSIBILITY_FEATURE_ID,
        commandCode,
        async load() {
          const module = await import("../apps/responsibility/actions.js");
          const handlers = module.createResponsibilityActionHandlersV010({
            repository: responsibilityRepository,
            canManageEnterpriseContext(principal, contextId) {
              return (
                resolveEnterpriseContextRelationshipProvider()
                  ?.listForPrincipal(principal) ?? []
              ).some(item =>
                item.contextId === contextId
                && item.state === "ACTIVE"
                && (item.kind === "OWNER" || item.kind === "ADMIN")
              );
            }
          });
          const handler = handlers.find(
            candidate => candidate.commandCode === commandCode
          );
          if (!handler) {
            throw new Error("RESPONSIBILITY_HANDLER_NOT_FOUND");
          }
          return handler;
        }
      })
    ),
    ...[
      OBJECT_EXTENSION_DEFINITION_LIST_COMMAND_V010,
      OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010,
      OBJECT_EXTENSION_DEFINITION_ARCHIVE_COMMAND_V010
    ].map(commandCode =>
      createLazyAppActionHandlerV010({
        packageId: OBJECT_EXTENSION_PACKAGE_ID,
        featureId: OBJECT_EXTENSION_FEATURE_ID,
        commandCode,
        async load() {
          const module = await import("../apps/object-extension/actions.js");
          const handlers = module.createObjectExtensionActionHandlersV010({
            repository: objectExtensionRepository,
            canManageEnterpriseContext(principal, contextId) {
              return (
                resolveEnterpriseContextRelationshipProvider()
                  ?.listForPrincipal(principal) ?? []
              ).some(item =>
                item.contextId === contextId
                && item.state === "ACTIVE"
                && (item.kind === "OWNER" || item.kind === "ADMIN")
              );
            }
          });
          const handler = handlers.find(
            candidate => candidate.commandCode === commandCode
          );
          if (!handler) {
            throw new Error("OBJECT_EXTENSION_HANDLER_NOT_FOUND");
          }
          return handler;
        }
      })
    ),
    ...[
      DATA_IMPORT_STAGE_FILE_COMMAND_V010,
      DATA_IMPORT_REVIEW_COMMAND_V010,
      DATA_IMPORT_STAGE_CSV_COMMAND_V010,
      DATA_IMPORT_DRY_RUN_COMMAND_V010,
      DATA_IMPORT_COMMIT_COMMAND_V010,
      DATA_IMPORT_GET_COMMAND_V010,
      DATA_IMPORT_MAPPING_INSPECT_COMMAND_V010,
      DATA_IMPORT_MAPPING_APPLY_COMMAND_V010,
      DATA_IMPORT_ERROR_CSV_COMMAND_V010
    ].map(commandCode =>
      createLazyAppActionHandlerV010({
        packageId: DATA_IMPORT_PACKAGE_ID,
        featureId: DATA_IMPORT_FEATURE_ID,
        commandCode,
        async load() {
          const module = await import("../apps/data-import/actions.js");
          const handlers = module.createDataImportActionHandlersV010({
            service: dataImportService,
            repository: dataImportRepository,
            targets: dataImportTargets,
            ...(dataImportExperienceAdvisor
              ? { experienceAdvisor: dataImportExperienceAdvisor }
              : {}),
            canManageEnterpriseContext(principal, contextId) {
              return (
                resolveEnterpriseContextRelationshipProvider()
                  ?.listForPrincipal(principal) ?? []
              ).some(item =>
                item.contextId === contextId
                && item.state === "ACTIVE"
                && (item.kind === "OWNER" || item.kind === "ADMIN")
              );
            },
            idFactory() {
              return "import-" + randomUUID();
            }
          });
          const handler = handlers.find(
            candidate => candidate.commandCode === commandCode
          );
          if (!handler) {
            throw new Error("DATA_IMPORT_HANDLER_NOT_FOUND");
          }
          return handler;
        }
      })
    ),
    ...[
      LEDGER_MANAGER_OPEN_DETAIL_COMMAND,
      LEDGER_MANAGER_PREVIEW_PROJECTION_COMMAND,
      LEDGER_MANAGER_PUBLISH_COMMAND
    ].map(commandCode =>
      createLazyAppActionHandlerV010({
        packageId: LEDGER_MANAGER_PACKAGE_ID,
        featureId: LEDGER_MANAGER_FEATURE_ID,
        commandCode,
        async load() {
          const module = await import("../apps/ledger-manager/actions.js");
          const handlers = module.createLedgerManagerActionHandlersV010({
            repository: enterpriseBusinessDefinitionRepository,
            projectionSessions: enterpriseDefinitionProjectionSessions,
            resolveAuthorizationProvider,
            canManageEnterpriseContext(principal, contextId) {
              return (
                resolveEnterpriseContextRelationshipProvider()
                  ?.listForPrincipal(principal) ?? []
              ).some(item =>
                item.contextId === contextId
                && item.state === "ACTIVE"
                && (item.kind === "OWNER" || item.kind === "ADMIN")
              );
            },
            viewerAvailable() {
              return manager.getSnapshot().effectiveCapabilities.includes(
                VISUAL_2D_VIEWER_CAPABILITY_V010
              );
            },
            async publishToLedgerRuntime({
              enterpriseId,
              enterpriseDisplayName,
              compiled
            }) {
              const runtimeEnterpriseId =
                evoRuntimeScopeMap.get(enterpriseId);
              const result = await evoJson(
                "/api/v1/configurator/burn",
                {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    ...compiled,
                    target: runtimeEnterpriseId
                      ? { enterpriseId: runtimeEnterpriseId }
                      : {
                          enterpriseCode: enterpriseId,
                          enterpriseName:
                            enterpriseDisplayName ?? enterpriseId
                        }
                  })
                }
              );
              if (result.status < 200 || result.status >= 300) {
                throw new Error(
                  "LEDGER_MANAGER_RUNTIME_PUBLISH_FAILED: "
                  + JSON.stringify(result.body)
                );
              }
              return result.body;
            },
            resolveEnterpriseDisplayName(enterpriseId) {
              const item = enterpriseGovernanceStore.snapshot().contexts
                .find(context => context.enterpriseId === enterpriseId);
              return item?.displayName;
            }
          });
          const handler = handlers.find(
            candidate => candidate.commandCode === commandCode
          );
          if (!handler) {
            throw new Error("LEDGER_MANAGER_HANDLER_NOT_FOUND");
          }
          return handler;
        }
      })
    ),
    createLazyAppActionHandlerV010({
      packageId: TEMPLATE_STORE_PACKAGE_ID,
      featureId: TEMPLATE_STORE_FEATURE_ID,
      commandCode: TEMPLATE_STORE_COPY_COMMAND,
      async load() {
        const [module, templateStoreRepository] = await Promise.all([
          import("../apps/template-store/copy-action.js"),
          resolveTemplateStoreRepository()
        ]);
        return module.createTemplateStoreCopyActionHandlerV010({
          store: templateStoreRepository,
          transfer: enterpriseTemplateTransferProvider,
          resolveAuthorizationProvider,
          listAvailableContexts(principal) {
            return createPrincipalContextRegistryV010(
              principal,
              principalContextSources()
            ).list();
          },
          resolveDefaultEnterpriseContext(principal) {
            const registry = createPrincipalContextRegistryV010(
              principal,
              principalContextSources()
            );
            return resolveDefaultEnterpriseContextV010({
              principal,
              availableContexts: registry.list(),
              store: enterpriseGovernanceStore
            });
          },
          canManageEnterpriseContext(principal, contextId) {
            return (
              resolveEnterpriseContextRelationshipProvider()
                ?.listForPrincipal(principal) ?? []
            ).some(item =>
              item.contextId === contextId
              && item.state === "ACTIVE"
              && (item.kind === "OWNER" || item.kind === "ADMIN")
            );
          }
        });
      }
    }),
    createLazyAppActionHandlerV010({
      packageId: TEMPLATE_STORE_PACKAGE_ID,
      featureId: TEMPLATE_STORE_FEATURE_ID,
      commandCode: TEMPLATE_STORE_DOWNLOAD_COMMAND,
      async load() {
        const [module, templateStoreRepository] = await Promise.all([
          import("../apps/template-store/download-action.js"),
          resolveTemplateStoreRepository()
        ]);
        return module.createTemplateStoreDownloadActionHandlerV010({
          store: templateStoreRepository
        });
      }
    }),
    createLazyAppActionHandlerV010({
      packageId: TEMPLATE_STORE_PACKAGE_ID,
      featureId: TEMPLATE_STORE_FEATURE_ID,
      commandCode: TEMPLATE_STORE_OPEN_DETAIL_COMMAND,
      async load() {
        const [module, templateStoreRepository] = await Promise.all([
          import("../apps/template-store/detail-action.js"),
          resolveTemplateStoreRepository()
        ]);
        return module.createTemplateStoreOpenDetailActionHandlerV010({
          store: templateStoreRepository,
          sessions: templatePreviewSessions
        });
      }
    }),
    createLazyAppActionHandlerV010({
      packageId: TEMPLATE_STORE_PACKAGE_ID,
      featureId: TEMPLATE_STORE_FEATURE_ID,
      commandCode: TEMPLATE_STORE_PREVIEW_2D_COMMAND,
      async load() {
        const [module, templateStoreRepository] = await Promise.all([
          import("../apps/template-store/preview-action.js"),
          resolveTemplateStoreRepository()
        ]);
        return module.createTemplateStorePreview2dActionHandlerV010({
          store: templateStoreRepository,
          sessions: templatePreviewSessions,
          viewerAvailable() {
            return manager.getSnapshot().effectiveCapabilities.includes(
              VISUAL_2D_VIEWER_CAPABILITY_V010
            );
          }
        });
      }
    }),
    ...createEnterpriseRelationshipActionHandlersV010({
      store: enterpriseGovernanceStore,
      resolveAuthorizationProvider
    }),
    ...createExternalAgentGovernanceActionHandlersV010({
      service: externalAgentGovernanceService
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
      ...(conversationContextAssembler
        ? { contextAssembler: conversationContextAssembler }
        : {}),
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
    ...createLedgerRuntimeConfiguratorCapabilityActionHandlers(ledgerConfigurator),
    createTradingLiteEvoActionHandler({
      adapter: evoBusinessDataAdapter,
      observationAdapter: evoRuntimeObservationAdapter,
      resolveRuntimeTarget: resolveTradingLiteEvoRuntimeTarget
    })
  ],
  featureId => manager.getSnapshot().activeFeatures.some(feature => feature.featureId === featureId),
  createCapabilityOperationActionPreExecuteV010({
    manager,
    resolveAuthorizationProvider
  })
);

const corsOrigin = process.env.CORS_ORIGIN ?? "*";

function ledgerConfiguratorActive(): boolean {
  return manager.getSnapshot().activeFeatures.some(feature => feature.featureId === ledgerConfiguratorFeatureId);
}

function applyWebSecurityHeaders(response: ServerResponse): void {
  for (const [name, value] of Object.entries(webSecurityHeadersV010())) {
    response.setHeader(name, value);
  }
}

function applyCors(response: ServerResponse): void {
  response.setHeader("access-control-allow-origin", corsOrigin);
  response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  response.setHeader(
    "access-control-allow-headers",
    "content-type,accept,authorization,x-evo-session-id,x-evo-context-id,if-none-match,last-event-id,x-evo-client-revision"
  );
  response.setHeader(
    "access-control-expose-headers",
    "etag,x-evo-host-revision,x-evo-web-contract,x-evo-client-update"
  );
}

function requestedLocale(url: URL): string {
  return url.searchParams.get("locale")?.trim() || "en";
}

function json(response: ServerResponse, status: number, body: unknown): void {
  const serialized = JSON.stringify(body);
  response.statusCode = status;
  applyCors(response);
  response.setHeader("content-type", "application/json; charset=utf-8");
  transportTraffic.recordJson(Buffer.byteLength(serialized));
  response.end(serialized);
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
    transportTraffic.recordNotModified();
    response.statusCode = 304;
    response.end();
    return;
  }
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  transportTraffic.recordJson(Buffer.byteLength(serialized));
  response.end(serialized);
}

function writeSseEvent(
  response: ServerResponse,
  event: HostRealtimeEventV010
): void {
  const frame =
    "id: " + event.eventId + "\n"
    + "event: " + event.type.toLowerCase() + "\n"
    + "data: " + JSON.stringify(event) + "\n\n";
  transportTraffic.recordSseEvent(Buffer.byteLength(frame));
  response.write(frame);
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function readFormUrlEncodedLimited(
  request: IncomingMessage,
  maxBytes = 32 * 1024
): Promise<URLSearchParams> {
  const contentType = request.headers["content-type"]?.split(";")[0]?.trim();
  if (contentType !== "application/x-www-form-urlencoded") {
    throw new Error("OAUTH_FORM_CONTENT_TYPE_REQUIRED");
  }
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += bytes.length;
    if (total > maxBytes) throw new Error("OAUTH_FORM_TOO_LARGE");
    chunks.push(bytes);
  }
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

async function readJsonLimited(
  request: IncomingMessage,
  maxBytes: number
): Promise<unknown> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += bytes.length;
    if (total > maxBytes) throw new Error("REQUEST_BODY_TOO_LARGE");
    chunks.push(bytes);
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
    applyWebSecurityHeaders(response);
    applyWebRevisionHeadersV010(
      (name, value) => response.setHeader(name, value),
      appHostAssetRevision,
      normalizeClientRevisionV010(request.headers["x-evo-client-revision"])
    );
    transportTraffic.recordRequest(
      request.method ?? "UNKNOWN",
      url.pathname,
      request.headers["if-none-match"] !== undefined
    );

    if (request.method === "OPTIONS") {
      response.statusCode = 204;
      applyCors(response);
      return response.end();
    }

    if (managedSessionEnabled && authenticationPublicBaseUrl) {
      requireSameOriginForCookieMutationV010({
        method: request.method,
        headers: request.headers,
        publicBaseUrl: authenticationPublicBaseUrl
      });
    }

    if (url.pathname === "/mcp") {
      if (!externalAgentMcpEnabled) {
        return json(response, 404, { code: "EXTERNAL_AGENT_MCP_NOT_ENABLED" });
      }
      if (request.method !== "POST") {
        response.statusCode = 405;
        response.setHeader("allow", "POST");
        response.setHeader("cache-control", "no-store");
        return response.end();
      }

      const protectedResource = externalAgentMcpProtectedResource();
      const correlationId = randomUUID();
      const authorization = await protectedResource.authorize({
        headers: request.headers,
        correlationId
      });
      if (!authorization.authorized) {
        response.statusCode = authorization.response.status;
        for (const [name, value] of Object.entries(
          authorization.response.headers
        )) {
          response.setHeader(name, value);
        }
        return response.end();
      }

      let body: unknown;
      try {
        body = await readJsonLimited(request, 1024 * 1024);
      } catch (error) {
        return json(response, 400, {
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32700,
            message: "Parse error",
            data: {
              code: "MCP_REQUEST_BODY_INVALID",
              message: error instanceof Error ? error.message : String(error)
            }
          }
        });
      }

      const result = await protectedResource.handleAuthorized({
        access: authorization.access,
        correlationId,
        request: {
          method: request.method,
          headers: request.headers,
          body
        }
      });
      response.statusCode = result.status;
      for (const [name, value] of Object.entries(result.headers)) {
        response.setHeader(name, value);
      }
      if (result.body === undefined) return response.end();
      return response.end(JSON.stringify(result.body));
    }

    if (
      request.method === "GET"
      && url.pathname === "/.well-known/oauth-protected-resource/mcp"
    ) {
      if (!externalAgentOAuthEnabled) {
        return json(response, 404, { code: "EXTERNAL_AGENT_OAUTH_NOT_ENABLED" });
      }
      response.setHeader("cache-control", "public, max-age=300");
      return json(
        response,
        200,
        externalAgentOAuthService().protectedResourceMetadata()
      );
    }

    if (
      request.method === "GET"
      && url.pathname === "/.well-known/oauth-authorization-server"
    ) {
      if (!externalAgentOAuthEnabled) {
        return json(response, 404, { code: "EXTERNAL_AGENT_OAUTH_NOT_ENABLED" });
      }
      response.setHeader("cache-control", "public, max-age=300");
      return json(
        response,
        200,
        externalAgentOAuthService().authorizationServerMetadata()
      );
    }

    if (request.method === "GET" && url.pathname === "/oauth/authorize") {
      if (!externalAgentOAuthEnabled) {
        return json(response, 404, { code: "EXTERNAL_AGENT_OAUTH_NOT_ENABLED" });
      }
      response.setHeader("cache-control", "no-store");

      let session: IdentitySessionV010;
      try {
        session = resolveRequestIdentitySession(request);
      } catch (error) {
        const failure = requestAuthenticationHttpFailureV010(error);
        if (failure?.status === 401) {
          const returnTo = url.pathname + url.search;
          response.statusCode = 303;
          response.setHeader(
            "location",
            "/login?returnTo=" + encodeURIComponent(returnTo)
          );
          return response.end();
        }
        throw error;
      }

      const result = await externalAgentOAuthHttpAdapter().authorize({
        url: new URL(url.pathname + url.search, externalAgentOAuthIssuer),
        session,
        correlationId: randomUUID()
      });
      response.statusCode = result.status;
      if (result.kind === "REDIRECT") {
        response.setHeader("location", result.location);
        return response.end();
      }
      response.setHeader("content-type", "text/html; charset=utf-8");
      return response.end(
        renderExternalAgentOAuthConsentPageV010(result.consent)
      );
    }

    if (request.method === "POST" && url.pathname === "/oauth/authorize") {
      if (!externalAgentOAuthEnabled) {
        return json(response, 404, { code: "EXTERNAL_AGENT_OAUTH_NOT_ENABLED" });
      }
      response.setHeader("cache-control", "no-store");

      let session: IdentitySessionV010;
      try {
        session = resolveRequestIdentitySession(request);
      } catch (error) {
        const failure = requestAuthenticationHttpFailureV010(error);
        if (failure?.status === 401) {
          return json(response, 401, {
            code: "EXTERNAL_AGENT_OAUTH_HUMAN_SESSION_REQUIRED"
          });
        }
        throw error;
      }

      let form: URLSearchParams;
      try {
        form = await readFormUrlEncodedLimited(request);
      } catch (error) {
        return json(response, 400, {
          code: "EXTERNAL_AGENT_OAUTH_CONSENT_FORM_INVALID",
          message: error instanceof Error ? error.message : String(error)
        });
      }

      const result = await externalAgentOAuthHttpAdapter().approve({
        form,
        session,
        correlationId: randomUUID()
      });
      response.statusCode = result.status;
      if (result.kind === "REDIRECT") {
        response.setHeader("location", result.location);
        return response.end();
      }
      response.setHeader("content-type", "text/html; charset=utf-8");
      return response.end(
        renderExternalAgentOAuthConsentPageV010(result.consent)
      );
    }

    if (request.method === "POST" && url.pathname === "/oauth/token") {
      if (!externalAgentOAuthEnabled) {
        return json(response, 404, { code: "EXTERNAL_AGENT_OAUTH_NOT_ENABLED" });
      }
      response.setHeader("cache-control", "no-store");
      let form: URLSearchParams;
      try {
        form = await readFormUrlEncodedLimited(request);
      } catch (error) {
        return json(response, 400, {
          error: "invalid_request",
          error_description:
            error instanceof Error ? error.message : String(error)
        });
      }
      const result = await externalAgentOAuthHttpAdapter().token({
        form,
        correlationId: randomUUID()
      });
      if (result.status >= 400) {
        console.warn(JSON.stringify({
          event: "external_agent_oauth_token_error",
          grantType: form.get("grant_type")?.trim() || null,
          clientId: form.get("client_id")?.trim() || null,
          hasResource: Boolean(form.get("resource")?.trim()),
          hasCode: Boolean(form.get("code")?.trim()),
          hasRedirectUri: Boolean(form.get("redirect_uri")?.trim()),
          hasCodeVerifier: Boolean(form.get("code_verifier")?.trim()),
          hasRefreshToken: Boolean(form.get("refresh_token")?.trim()),
          error: result.body.error ?? null,
          errorDescription: result.body.error_description ?? null
        }));
      }
      return json(response, result.status, result.body);
    }

    if (request.method === "POST" && url.pathname === "/oauth/revoke") {
      if (!externalAgentOAuthEnabled) {
        return json(response, 404, { code: "EXTERNAL_AGENT_OAUTH_NOT_ENABLED" });
      }
      response.setHeader("cache-control", "no-store");
      let form: URLSearchParams;
      try {
        form = await readFormUrlEncodedLimited(request);
      } catch (error) {
        return json(response, 400, {
          error: "invalid_request",
          error_description:
            error instanceof Error ? error.message : String(error)
        });
      }
      const result = externalAgentOAuthHttpAdapter().revoke({ form });
      return json(response, result.status, result.body);
    }

    if (
      request.method === "GET"
      && (
        url.pathname === "/login-assets/tuge-logo-reference.webp"
        || url.pathname === "/login-assets/tuge-global-connectivity-demo.webp"
        || url.pathname === "/login-assets/tuge-logo-final.png"
        || url.pathname === "/login-assets/tuge-login-background-final.png"
      )
    ) {
      const assetName = url.pathname.split("/").at(-1);
      if (!assetName) {
        return json(response, 404, { code: "LOGIN_ASSET_NOT_FOUND" });
      }
      try {
        const bytes = await readFile(
          fileURLToPath(new URL("./assets/" + assetName, import.meta.url))
        );
        const etag = "\"" + createHash("sha256")
          .update(bytes)
          .digest("base64url") + "\"";
        response.setHeader("etag", etag);
        response.setHeader("cache-control", "public, max-age=3600");
        response.setHeader(
          "content-type",
          assetName.endsWith(".png")
            ? "image/png"
            : assetName.endsWith(".jpg") || assetName.endsWith(".jpeg")
              ? "image/jpeg"
              : "image/webp"
        );
        if (ifNoneMatchSatisfied(request.headers["if-none-match"], etag)) {
          transportTraffic.recordNotModified();
          response.statusCode = 304;
          return response.end();
        }
        response.statusCode = 200;
        return response.end(bytes);
      } catch {
        return json(response, 404, { code: "LOGIN_ASSET_NOT_FOUND" });
      }
    }

    if (request.method === "GET" && url.pathname === "/login") {
      response.setHeader("cache-control", "no-store");
      const returnTo = normalizeAuthenticationReturnToV010(
        url.searchParams.get("returnTo") ?? "/"
      );
      const locale = url.searchParams.get("locale")?.trim() || "en";
      const skin = url.searchParams.get("skin") === "demo"
        ? "demo"
        : "standard";
      if (managedSessionEnabled) {
        try {
          resolveRequestIdentitySession(request);
          response.statusCode = 303;
          response.setHeader("location", returnTo);
          return response.end();
        } catch (error) {
          const failure = requestAuthenticationHttpFailureV010(error);
          if (!failure || failure.status !== 401) throw error;
        }
      }
      response.statusCode = 200;
      response.setHeader("content-type", "text/html; charset=utf-8");
      return response.end(createLoginExperienceHtmlV010({
        assetRevision: appHostAssetRevision,
        returnTo,
        locale,
        skin,
        authenticationEnabled: managedSessionEnabled,
        methods: defaultLoginMethodsV010({
          googleAvailable: managedSessionEnabled,
          locale
        })
      }));
    }

    if (request.method === "GET" && url.pathname === "/auth/login") {
      if (!managedSessionEnabled) {
        return json(response, 404, { code: "AUTHENTICATION_NOT_ENABLED" });
      }
      response.setHeader("cache-control", "no-store");
      const flow = authenticationFlow();
      const start = await flow.start({
        returnTo: url.searchParams.get("returnTo") ?? "/",
        locale: url.searchParams.get("locale") ?? undefined
      });
      response.statusCode = 302;
      response.setHeader("location", start.redirectUrl);
      return response.end();
    }

    if (request.method === "GET" && url.pathname === "/auth/callback") {
      if (!managedSessionEnabled) {
        return json(response, 404, { code: "AUTHENTICATION_NOT_ENABLED" });
      }
      if (!authenticationPublicBaseUrl) {
        throw new Error("AUTHENTICATION_PUBLIC_BASE_URL_REQUIRED");
      }
      response.setHeader("cache-control", "no-store");
      const callbackUrl = new URL(
        (request.url ?? "/auth/callback"),
        authenticationPublicBaseUrl
      ).toString();
      const completed = await authenticationFlow().complete(callbackUrl);
      response.statusCode = 303;
      response.setHeader("set-cookie", completed.setCookie);
      response.setHeader("location", completed.returnTo);
      return response.end();
    }

    if (request.method === "POST" && url.pathname === "/auth/logout") {
      if (!managedSessionEnabled) {
        return json(response, 404, { code: "AUTHENTICATION_NOT_ENABLED" });
      }
      response.setHeader("cache-control", "no-store");
      const logout = authenticationFlow().logout(
        sessionTokenFromCookieHeaderV010(request.headers),
        url.searchParams.get("returnTo") ?? "/"
      );
      response.statusCode = 303;
      response.setHeader("set-cookie", logout.setCookie);
      response.setHeader("location", logout.returnTo);
      return response.end();
    }

    if (request.method === "POST" && url.pathname === "/auth/session/revoke") {
      if (!managedSessionEnabled) {
        return json(response, 404, { code: "AUTHENTICATION_NOT_ENABLED" });
      }
      response.setHeader("cache-control", "no-store");
      const revoked = authenticationFlow().revokeCurrent(
        sessionTokenFromCookieHeaderV010(request.headers)
      );
      if (!revoked.revoked) {
        throw new Error("REQUEST_IDENTITY_SESSION_REQUIRED");
      }
      response.setHeader("set-cookie", revoked.setCookie);
      return json(response, 200, {
        contractVersion: "0.1.0",
        revoked: true
      });
    }

    if (request.method === "GET" && url.pathname === "/auth/session") {
      if (!managedSessionEnabled) {
        return json(response, 404, { code: "AUTHENTICATION_NOT_ENABLED" });
      }
      response.setHeader("cache-control", "no-store");
      const session = resolveRequestIdentitySession(request);
      return json(response, 200, {
        contractVersion: "0.1.0",
        sessionId: session.sessionId,
        principal: {
          subjectId: session.principal.subjectId,
          actorType: session.principal.actorType,
          identityProviderId: session.principal.identityProviderId,
          displayName: session.principal.displayName ?? null
        },
        issuedAt: session.issuedAt,
        expiresAt: session.expiresAt ?? null,
        assurance: session.assurance ?? []
      });
    }

    if (request.method === "GET" && url.pathname === "/") {
      if (managedSessionEnabled) {
        try {
          resolveRequestIdentitySession(request);
        } catch (error) {
          const failure = requestAuthenticationHttpFailureV010(error);
          if (failure?.status === 401) {
            response.statusCode = 303;
            response.setHeader("cache-control", "no-store");
            response.setHeader(
              "location",
              "/login?returnTo=" + encodeURIComponent("/")
            );
            return response.end();
          }
          throw error;
        }
      }
      const etag = representationEtag(appHostShellHtml);
      applyCors(response);
      response.setHeader("etag", etag);
      response.setHeader("cache-control", "no-store");
      if (ifNoneMatchSatisfied(request.headers["if-none-match"], etag)) {
        transportTraffic.recordNotModified();
        response.statusCode = 304;
        return response.end();
      }
      response.statusCode = 200;
      response.setHeader("content-type", "text/html; charset=utf-8");
      return response.end(appHostShellHtml);
    }

    if (request.method === "GET" && url.pathname.startsWith("/assets/")) {
      const rawAssetPath = url.pathname.slice("/assets/".length);
      const firstSlash = rawAssetPath.indexOf("/");
      if (firstSlash > 0) {
        const requestedRevision = rawAssetPath.slice(0, firstSlash);
        const archivedAssetPath = rawAssetPath.slice(firstSlash + 1);
        if (
          requestedRevision !== appHostAssetRevision
          && archivedAssetPath
        ) {
          const archivedBytes = await webAssetArchive.readArchived(
            requestedRevision,
            archivedAssetPath
          );
          if (archivedBytes) {
            const contentType = archivedAssetPath.endsWith(".js")
              ? "text/javascript; charset=utf-8"
              : archivedAssetPath.endsWith(".css")
                ? "text/css; charset=utf-8"
                : undefined;
            if (!contentType) {
              return json(response, 404, { code: "ASSET_NOT_FOUND" });
            }
            const etag = "\"" + createHash("sha256")
              .update(archivedBytes)
              .digest("base64url") + "\"";
            response.setHeader("etag", etag);
            response.setHeader(
              "cache-control",
              "public, max-age=31536000, immutable"
            );
            response.setHeader("content-type", contentType);
            if (ifNoneMatchSatisfied(request.headers["if-none-match"], etag)) {
              transportTraffic.recordNotModified();
              response.statusCode = 304;
              return response.end();
            }
            response.statusCode = 200;
            return response.end(archivedBytes);
          }
        }
      }

      const asset = resolveBrowserAssetRequestV010(
        url.pathname,
        appHostAssetRevision
      );
      if (!asset) {
        return json(response, 404, { code: "ASSET_NOT_FOUND" });
      }

      let bytes: Buffer;
      if (asset.assetPath === "manager/app-host-shell.css") {
        bytes = Buffer.from(appHostShellCss, "utf8");
      } else {
        const assetUrl = new URL(`../${asset.assetPath}`, import.meta.url);
        try {
          bytes = await readFile(fileURLToPath(assetUrl));
        } catch {
          return json(response, 404, { code: "ASSET_NOT_FOUND" });
        }
      }

      const etag = "\"" + createHash("sha256").update(bytes).digest("base64url") + "\"";
      response.setHeader("etag", etag);
      response.setHeader("cache-control", asset.cacheControl);
      response.setHeader("content-type", asset.contentType);
      if (ifNoneMatchSatisfied(request.headers["if-none-match"], etag)) {
        transportTraffic.recordNotModified();
        response.statusCode = 304;
        return response.end();
      }
      response.statusCode = 200;
      return response.end(bytes);
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json(response, 200, { ok: true, service: "evo-app-manager" });
    }

    if (request.method === "GET" && url.pathname === "/v1/web-delivery/diagnostics") {
      resolveRequestIdentitySession(request);
      return json(response, 200, {
        contractVersion: "0.1.0",
        currentRevision: appHostAssetRevision,
        archivedRevisions: await webAssetArchive.revisions(),
        archiveEnabled: Boolean(webAssetArchive.archiveRoot),
        archiveError: webAssetArchiveError ?? null,
        performance: webPerformance.diagnostics()
      });
    }

    if (request.method === "POST" && url.pathname === "/v1/web-performance") {
      resolveRequestIdentitySession(request);
      let body: unknown;
      try {
        body = await readJsonLimited(request, 32 * 1024);
      } catch (error) {
        return json(response, 413, {
          ok: false,
          error: {
            code: "WEB_PERFORMANCE_PAYLOAD_REJECTED",
            message: error instanceof Error ? error.message : String(error)
          }
        });
      }
      if (!webPerformance.record(body)) {
        return json(response, 422, {
          ok: false,
          error: {
            code: "WEB_PERFORMANCE_SAMPLE_INVALID",
            message: "Invalid Web performance sample."
          }
        });
      }
      return json(response, 202, { ok: true });
    }

    if (request.method === "GET" && url.pathname === "/v1/web-performance/diagnostics") {
      resolveRequestIdentitySession(request);
      return json(response, 200, webPerformance.diagnostics());
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
      transportTraffic.openSse();
      const connectedFrame = ": connected\n\n";
      transportTraffic.recordSseHeartbeat(Buffer.byteLength(connectedFrame));
      response.write(connectedFrame);

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
          const frame = ": heartbeat\n\n";
          transportTraffic.recordSseHeartbeat(Buffer.byteLength(frame));
          response.write(frame);
        }
      }, 25000);
      heartbeat.unref?.();

      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        unregisterEvoRuntimeRevision?.();
        transportTraffic.closeSse();
      };
      request.once("close", close);
      response.once("close", close);
      return;
    }
    if (request.method === "GET" && url.pathname === "/v1/realtime/diagnostics") {
      resolveRequestIdentitySession(request);
      return json(response, 200, {
        contractVersion: "0.1.0",
        traffic: transportTraffic.snapshot(),
        eventBus: realtimeEvents.diagnostics(),
        evoRuntimeRevisionBridge: evoRuntimeRevisionBridge?.diagnostics() ?? null
      });
    }
    if (request.method === "GET" && url.pathname === "/v1/contexts/effective") {
      const session = resolveRequestIdentitySession(request);
      const contextRegistry = createContextRegistryForSession(session);
      const defaultEnterpriseContext = resolveDefaultEnterpriseContextV010({
        principal: session.principal,
        availableContexts: contextRegistry.list(),
        store: enterpriseGovernanceStore
      });
      return json(response, 200, {
        contractVersion: "0.1.0",
        session: {
          sessionId: session.sessionId,
          principal: session.principal
        },
        personalContext: contextRegistry.personal(),
        availableContexts: contextRegistry.list(),
        availableContextOptions: contextRegistry.list().map(ref => {
          const resolved = contextRegistry.resolve(ref);
          return {
            ref,
            label: ref.kind === "PERSONAL"
              ? resolved.personalContext.displayName ?? ref.contextId
              : resolved.enterpriseContext?.displayName ?? ref.contextId
          };
        }),
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
        defaultEnterpriseContext,
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
        workspaceHomeExperienceManifest,
        pluginStoreExperienceManifest,
        createSettingsExperienceManifest(manager),
        createProviderManagerExperienceManifest(manager),
        createMemoryGovernanceExperienceManifestV010(),
        createHelpExperienceManifestV010(helpCorpus, requestedLocale(url)),
        ...manager.listEffectiveExperiences()
      ]);
    }

    if (request.method === "GET" && url.pathname === "/v1/experience-pages") {
      const source = url.searchParams.get("source");
      if (!source) return json(response, 400, { code: "SOURCE_REQUIRED" });
      if (source === ENTERPRISE_CONTEXT_DIRECTORY_PAGE_SOURCE) {
        const effective = manager.getSnapshot().activeFeatures.some(
          feature =>
            feature.featureId
            === ENTERPRISE_CONTEXT_GOVERNANCE_APP_FEATURE_ID
        );
        if (!effective) {
          return json(
            response,
            404,
            { code: "PAGE_NOT_EFFECTIVE_OR_NOT_FOUND" }
          );
        }
        const session = resolveRequestIdentitySession(request);
        const contextRegistry = createContextRegistryForSession(session);
        const selected = contextFromHeaderV010(
          request.headers,
          contextRegistry
        );
        const activeContext = contextRegistry.resolve(selected).activeContext;
        const defaultEnterpriseContext = resolveDefaultEnterpriseContextV010({
          principal: session.principal,
          availableContexts: contextRegistry.list(),
          store: enterpriseGovernanceStore
        });
        const ownerContextIds = (
          resolveEnterpriseContextRelationshipProvider()
            ?.listForPrincipal(session.principal) ?? []
        ).filter(item =>
          item.kind === "OWNER" && item.state === "ACTIVE"
        ).map(item => item.contextId);
        const contexts = contextRegistry.list().flatMap(ref => {
          if (ref.kind !== "ENTERPRISE") return [];
          const resolved = contextRegistry.resolve(ref);
          return resolved.enterpriseContext
            ? [resolved.enterpriseContext]
            : [];
        });
        const module = await import(
          "../apps/enterprise-context-governance/context-page.js"
        );
        return json(
          response,
          200,
          module.createEnterpriseContextDirectoryPageV010({
            contexts,
            activeContext,
            defaultContextId: defaultEnterpriseContext?.contextId,
            ownerContextIds,
            locale: requestedLocale(url)
          })
        );
      }
      if (source === ENTERPRISE_CONTEXT_OVERVIEW_PAGE_SOURCE) {
        const session = resolveRequestIdentitySession(request);
        const contextRegistry = createContextRegistryForSession(session);
        const selected = contextFromHeaderV010(
          request.headers,
          contextRegistry
        );
        const resolved = contextRegistry.resolve(selected);
        const active = resolved.activeContext;
        if (
          active.kind !== "ENTERPRISE"
          || !resolved.enterpriseContext
        ) {
          return json(response, 409, {
            code: "ENTERPRISE_CONTEXT_REQUIRED",
            message: "Select an Enterprise Context first."
          });
        }
        const defaultEnterpriseContext = resolveDefaultEnterpriseContextV010({
          principal: session.principal,
          availableContexts: contextRegistry.list(),
          store: enterpriseGovernanceStore
        });
        const relationship = (
          resolveEnterpriseContextRelationshipProvider()
            ?.listForPrincipal(session.principal) ?? []
        ).find(item =>
          item.contextId === active.contextId
          && item.state === "ACTIVE"
        );
        const module = await import(
          "../apps/enterprise-context-governance/context-page.js"
        );
        return json(
          response,
          200,
          module.createEnterpriseContextOverviewPageV010({
            context: resolved.enterpriseContext,
            currentRole: relationship?.kind,
            isDefault:
              defaultEnterpriseContext?.contextId === active.contextId,
            locale: requestedLocale(url)
          })
        );
      }

      if (
        source === COUNTERPARTY_DIRECTORY_PAGE_SOURCE
        || source === COUNTERPARTY_CUSTOMERS_PAGE_SOURCE
        || source === COUNTERPARTY_SUPPLIERS_PAGE_SOURCE
        || source === COUNTERPARTY_MY_CUSTOMERS_PAGE_SOURCE
        || source === COUNTERPARTY_MY_SUPPLIERS_PAGE_SOURCE
        || source === COUNTERPARTY_CREATE_PAGE_SOURCE
        || source === COUNTERPARTY_DETAIL_PAGE_SOURCE
        || source === COUNTERPARTY_EDIT_PAGE_SOURCE
      ) {
        const session = resolveRequestIdentitySession(request);
        const contextRegistry = createContextRegistryForSession(session);
        const resolved = contextRegistry.resolve(
          contextFromHeaderV010(request.headers, contextRegistry)
        );
        const active = resolved.activeContext;
        if (
          active.kind !== "ENTERPRISE"
          || !active.contextId?.trim()
        ) {
          return json(response, 409, {
            code: "COUNTERPARTY_ENTERPRISE_CONTEXT_REQUIRED",
            message: "Select an Enterprise Context first."
          });
        }

        const locale = requestedLocale(url);
        const principal = {
          ...structuredClone(session.principal),
          sessionId: session.sessionId
        };
        const readContextBase: PlatformRequestContextV010 = {
          contractVersion: "0.1.0",
          principal,
          scope: {
            contractVersion: "0.1.0",
            userId: principal.subjectId
          },
          context: resolved,
          correlationId: "counterparty-read-" + randomUUID(),
          locale
        };
        const readContext: PlatformRequestContextV010 = {
          ...readContextBase,
          scope: legacyScopeFromRequestContextV010(readContextBase)
        };
        const relationship = (
          resolveEnterpriseContextRelationshipProvider()
            ?.listForPrincipal(principal) ?? []
        ).find(item =>
          item.contextId === active.contextId
          && item.state === "ACTIVE"
        );
        const canManage = relationship?.kind === "OWNER"
          || relationship?.kind === "ADMIN";
        const allCounterparties =
          counterpartyRepository.list(active.contextId);
        const responsibilities = responsibilityRepository.list(
          active.contextId,
          { objectType: "counterparty.subject" }
        );
        const access = await resolveCounterpartyReadAccessV010({
          authorizationProvider: resolveAuthorizationProvider(),
          requestContext: readContext,
          enterpriseRelationshipKind: relationship?.kind,
          counterparties: allCounterparties,
          responsibilities,
          fieldIds: counterpartyCoreSchemaV010.fields.map(
            field => field.fieldId
          )
        });
        const authorizedCounterpartyIds = new Set(
          access.counterparties.map(item => item.counterpartyId)
        );
        const module = await import("../apps/counterparty/page.js");

        if (source === COUNTERPARTY_DIRECTORY_PAGE_SOURCE) {
          return json(
            response,
            200,
            module.createCounterpartyDirectoryPageV010({
              counterparties: access.counterparties,
              ...(dataImportTargets.some(target =>
                target.targetId === COUNTERPARTY_IMPORT_TARGET_V010
              )
                ? {
                    importRoute: dataImportUploadRouteV010(
                      COUNTERPARTY_IMPORT_TARGET_V010
                    )
                  }
                : {}),
              locale,
              readableFieldIds: access.readableFieldIds,
              canManage
            })
          );
        }

        const projectionId: CounterpartyProjectionIdV010 | undefined =
          source === COUNTERPARTY_CUSTOMERS_PAGE_SOURCE
            ? COUNTERPARTY_CUSTOMER_PROJECTION_V010
            : source === COUNTERPARTY_SUPPLIERS_PAGE_SOURCE
              ? COUNTERPARTY_SUPPLIER_PROJECTION_V010
              : source === COUNTERPARTY_MY_CUSTOMERS_PAGE_SOURCE
                ? COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010
                : source === COUNTERPARTY_MY_SUPPLIERS_PAGE_SOURCE
                  ? COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010
                  : undefined;

        if (projectionId) {
          const projection = await counterpartyProjectionService.read({
            contextId: active.contextId,
            projectionId,
            requestContext: readContext,
            enterpriseRelationshipKind: relationship?.kind
          });
          return json(
            response,
            200,
            module.createCounterpartyProjectionPageV010({
              projectionId,
              counterparties: projection.counterparties,
              locale,
              readableFieldIds: projection.readableFieldIds,
              canManage
            })
          );
        }

        if (source === COUNTERPARTY_CREATE_PAGE_SOURCE) {
          if (!canManage) {
            return json(response, 403, {
              code: "COUNTERPARTY_MANAGE_ROLE_REQUIRED"
            });
          }
          return json(
            response,
            200,
            module.createCounterpartyCreatePageV010(locale)
          );
        }

        const routeValue = url.searchParams.get("route")?.trim();
        const counterpartyId = source === COUNTERPARTY_EDIT_PAGE_SOURCE
          ? parseCounterpartyEditRouteV010(routeValue || undefined)
          : parseCounterpartyDetailRouteV010(routeValue || undefined);
        if (!counterpartyId) {
          return json(response, 400, {
            code: source === COUNTERPARTY_EDIT_PAGE_SOURCE
              ? "COUNTERPARTY_EDIT_ROUTE_INVALID"
              : "COUNTERPARTY_DETAIL_ROUTE_INVALID"
          });
        }
        const counterparty =
          counterpartyRepository.get(active.contextId, counterpartyId);
        if (
          !counterparty
          || !authorizedCounterpartyIds.has(counterpartyId)
        ) {
          return json(response, 404, {
            code: "COUNTERPARTY_NOT_FOUND"
          });
        }
        if (source === COUNTERPARTY_EDIT_PAGE_SOURCE && !canManage) {
          return json(response, 403, {
            code: "COUNTERPARTY_MANAGE_ROLE_REQUIRED"
          });
        }
        return json(
          response,
          200,
          source === COUNTERPARTY_EDIT_PAGE_SOURCE
            ? module.createCounterpartyEditPageV010({
                counterparty,
                locale
              })
            : module.createCounterpartyDetailPageV010({
                counterparty,
                roles: counterpartyRoleRepository.list(
                  active.contextId,
                  counterpartyId
                ),
                customerProfile: counterpartyProfileRepository.get(
                  active.contextId,
                  counterpartyId,
                  "CUSTOMER"
                ),
                supplierProfile: counterpartyProfileRepository.get(
                  active.contextId,
                  counterpartyId,
                  "SUPPLIER"
                ),
                contacts: counterpartyContactRepository.list(
                  active.contextId,
                  counterpartyId
                ),
                addresses: counterpartyAddressRepository.list(
                  active.contextId,
                  counterpartyId
                ),
                locale,
                readableFieldIds: access.readableFieldIds,
                canManage
              })
        );
      }

      if (
        source === DATA_IMPORT_DIRECTORY_PAGE_SOURCE
        || source === DATA_IMPORT_UPLOAD_PAGE_SOURCE
        || source === DATA_IMPORT_MAPPING_PAGE_SOURCE
        || source === DATA_IMPORT_REVIEW_PAGE_SOURCE
      ) {
        const session = resolveRequestIdentitySession(request);
        const contextRegistry = createContextRegistryForSession(session);
        const resolved = contextRegistry.resolve(
          contextFromHeaderV010(request.headers, contextRegistry)
        );
        const active = resolved.activeContext;
        if (
          active.kind !== "ENTERPRISE"
          || !active.contextId?.trim()
        ) {
          return json(response, 409, {
            code: "DATA_IMPORT_ENTERPRISE_CONTEXT_REQUIRED",
            message: "Select an Enterprise Context first."
          });
        }
        const module = await import("../apps/data-import/page.js");
        const locale = requestedLocale(url);
        const routeValue = url.searchParams.get("route")?.trim();

        if (source === DATA_IMPORT_DIRECTORY_PAGE_SOURCE) {
          return json(
            response,
            200,
            module.createDataImportDirectoryPageV010({
              targets: dataImportTargets,
              jobs: dataImportRepository.list(active.contextId),
              locale
            })
          );
        }

        if (source === DATA_IMPORT_UPLOAD_PAGE_SOURCE) {
          const targetId = parseDataImportUploadRouteV010(
            routeValue || undefined
          );
          const target = dataImportTargets.find(item =>
            item.targetId === targetId
          );
          if (!target) {
            return json(response, 404, {
              code: "DATA_IMPORT_TARGET_NOT_FOUND"
            });
          }
          return json(
            response,
            200,
            module.createDataImportUploadPageV010({
              target,
              locale
            })
          );
        }

        const importJobId = source === DATA_IMPORT_MAPPING_PAGE_SOURCE
          ? parseDataImportMappingRouteV010(routeValue || undefined)
          : parseDataImportReviewRouteV010(routeValue || undefined);
        if (!importJobId) {
          return json(response, 400, {
            code: "DATA_IMPORT_ROUTE_INVALID"
          });
        }
        const job = dataImportRepository.get(active.contextId, importJobId);
        if (!job) {
          return json(response, 404, {
            code: "DATA_IMPORT_JOB_NOT_FOUND"
          });
        }
        if (source === DATA_IMPORT_MAPPING_PAGE_SOURCE) {
          const target = dataImportTargets.find(item =>
            item.targetId === job.targetId
          );
          if (!target) {
            return json(response, 404, {
              code: "DATA_IMPORT_TARGET_NOT_FOUND"
            });
          }
          return json(
            response,
            200,
            module.createDataImportMappingPageV010({
              job,
              schema: target.describe({
                contextId: active.contextId,
                locale,
                parameters: job.targetParameters
              }),
              locale
            })
          );
        }
        return json(
          response,
          200,
          module.createDataImportReviewPageV010({
            job,
            locale
          })
        );
      }

      if (source === LEDGER_MANAGER_PAGE_SOURCE) {
        const session = resolveRequestIdentitySession(request);
        const contextRegistry = createContextRegistryForSession(session);
        const resolved = contextRegistry.resolve(
          contextFromHeaderV010(request.headers, contextRegistry)
        );
        const active = resolved.activeContext;
        if (active.kind !== "ENTERPRISE") {
          return json(response, 409, {
            code: "LEDGER_MANAGER_ENTERPRISE_CONTEXT_REQUIRED",
            message: "Select an Enterprise Context first."
          });
        }
        const relationships =
          resolveEnterpriseContextRelationshipProvider()
            ?.listForPrincipal(session.principal) ?? [];
        const canPublish = relationships.some(item =>
          item.contextId === active.contextId
          && item.state === "ACTIVE"
          && (item.kind === "OWNER" || item.kind === "ADMIN")
        );
        const module = await import("../apps/ledger-manager/page.js");
        return json(
          response,
          200,
          module.createLedgerManagerPageV010({
            enterpriseId: active.enterpriseId,
            repository: enterpriseBusinessDefinitionRepository,
            viewer2dAvailable:
              manager.getSnapshot().effectiveCapabilities.includes(
                VISUAL_2D_VIEWER_CAPABILITY_V010
              ),
            canPublish,
            projectionGallery(revision) {
              return enterpriseDefinitionProjectionStore.get({
                enterpriseId: revision.enterpriseId,
                definitionId: revision.definitionId,
                definitionRevision: revision.revision
              });
            },
            locale: requestedLocale(url)
          })
        );
      }

      if (source === LEDGER_MANAGER_DETAIL_PAGE_SOURCE) {
        const session = resolveRequestIdentitySession(request);
        const contextRegistry = createContextRegistryForSession(session);
        const resolved = contextRegistry.resolve(
          contextFromHeaderV010(request.headers, contextRegistry)
        );
        const active = resolved.activeContext;
        if (active.kind !== "ENTERPRISE") {
          return json(response, 409, {
            code: "LEDGER_MANAGER_ENTERPRISE_CONTEXT_REQUIRED"
          });
        }
        const routeValue = url.searchParams.get("route")?.trim();
        const routeSelection = parseLedgerManagerDetailRouteV010(
          routeValue || undefined
        );
        if (routeValue && !routeSelection) {
          return json(response, 400, {
            code: "LEDGER_MANAGER_DETAIL_ROUTE_INVALID"
          });
        }

        const sessionId = session.principal.sessionId?.trim();
        const sessionSelection =
          (sessionId
            ? enterpriseDefinitionProjectionSessions.get(sessionId)
            : undefined)
          ?? enterpriseDefinitionProjectionSessions.get(
            session.principal.subjectId
          );
        const selection = routeSelection
          ? {
              enterpriseId: active.enterpriseId,
              definitionId: routeSelection.definitionId,
              definitionRevision: routeSelection.definitionRevision
            }
          : sessionSelection;
        if (
          !selection
          || selection.enterpriseId !== active.enterpriseId
        ) {
          return json(response, 409, {
            code: "LEDGER_MANAGER_DETAIL_SELECTION_REQUIRED"
          });
        }
        const revision = enterpriseBusinessDefinitionRepository
          .listHistory({
            enterpriseId: selection.enterpriseId,
            definitionId: selection.definitionId
          })
          .find(item =>
            item.revision === selection.definitionRevision
            && item.kind === "LEDGER_RUNTIME_TEMPLATE"
          );
        if (!revision) {
          return json(response, 404, {
            code: "LEDGER_MANAGER_DEFINITION_NOT_FOUND"
          });
        }
        const relationships =
          resolveEnterpriseContextRelationshipProvider()
            ?.listForPrincipal(session.principal) ?? [];
        const canPublish = relationships.some(item =>
          item.contextId === active.contextId
          && item.state === "ACTIVE"
          && (item.kind === "OWNER" || item.kind === "ADMIN")
        );
        const module = await import("../apps/ledger-manager/page.js");
        return json(
          response,
          200,
          module.createLedgerManagerDetailPageV010({
            revision,
            displayRevision: module.ledgerManagerSemanticVersionV010(
              enterpriseBusinessDefinitionRepository,
              revision.enterpriseId,
              revision.definitionId,
              revision.revision
            ),
            projectionGallery: enterpriseDefinitionProjectionStore.get({
              enterpriseId: revision.enterpriseId,
              definitionId: revision.definitionId,
              definitionRevision: revision.revision
            }),
            viewer2dAvailable:
              manager.getSnapshot().effectiveCapabilities.includes(
                VISUAL_2D_VIEWER_CAPABILITY_V010
              ),
            canPublish,
            locale: requestedLocale(url)
          })
        );
      }

      if (source === EOG_EDITOR_PAGE_SOURCE) {
        const effective = manager.getSnapshot().activeFeatures.some(
          feature => feature.featureId === EOG_2D_DESIGNER_FEATURE_ID
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
      if (source === EOG_2D_VIEWER_WORKSPACE_PAGE_SOURCE) {
        const effective = manager.getSnapshot().activeFeatures.some(
          feature => feature.featureId === EOG_2D_VIEWER_FEATURE_ID
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
        const module = await import(
          "../apps/eog-2d-viewer/workspace-page.js"
        );
        return json(
          response,
          200,
          module.createEnterpriseOperatingGraphViewerWorkspacePageV010({
            activeContext,
            locale: requestedLocale(url)
          })
        );
      }

      if (source === EOG_2D_VIEWER_TEMPLATE_PREVIEW_PAGE_SOURCE) {
        const effective = manager.getSnapshot().activeFeatures.some(
          feature => feature.featureId === EOG_2D_VIEWER_FEATURE_ID
        );
        if (!effective) {
          return json(response, 404, { code: "PAGE_NOT_EFFECTIVE_OR_NOT_FOUND" });
        }
        const templateStoreEffective = manager.getSnapshot().activeFeatures.some(
          feature => feature.featureId === TEMPLATE_STORE_FEATURE_ID
        );
        if (!templateStoreEffective) {
          return json(response, 409, { code: "TEMPLATE_STORE_NOT_ACTIVE" });
        }
        const session = resolveRequestIdentitySession(request);
        const sessionId = session.principal.sessionId?.trim();
        const subjectId = session.principal.subjectId.trim();
        const previewSelection =
          (sessionId ? templatePreviewSessions.get(sessionId) : undefined)
          ?? templatePreviewSessions.get(subjectId);
        if (!previewSelection) {
          return json(response, 409, {
            code: "TEMPLATE_PREVIEW_SELECTION_REQUIRED",
            message: "Choose Preview from a Template Store card first."
          });
        }
        const [
          viewer,
          previewSource,
          templateStoreRepository
        ] = await Promise.all([
          import("../apps/eog-2d-viewer/template-preview.js"),
          import("../apps/template-store/preview-source.js"),
          resolveTemplateStoreRepository()
        ]);
        const artifact =
          previewSource.createTemplateStorePreviewArtifactSourceV010(
            templateStoreRepository
          ).get({
            templateId: previewSelection.templateId,
            templateVersion: previewSelection.templateVersion,
            ...(previewSelection.projectionId
              ? { projectionId: previewSelection.projectionId }
              : {})
          });
        if (!artifact) {
          return json(response, 404, {
            code: "TEMPLATE_PREVIEW_NOT_FOUND"
          });
        }
        return json(
          response,
          200,
          viewer.createTemplate2dPreviewPageV010({
            templateId: artifact.templateId,
            templateVersion: artifact.templateVersion,
            title: artifact.title,
            ...(artifact.projectionId
              ? { projectionId: artifact.projectionId }
              : {})
          })
        );
      }

      if (source === EOG_2D_DESIGNER_DEFINITION_PROJECTION_PAGE_SOURCE) {
        const effective = manager.getSnapshot().activeFeatures.some(
          feature => feature.featureId === EOG_2D_DESIGNER_FEATURE_ID
        );
        if (!effective) {
          return json(response, 404, { code: "PAGE_NOT_EFFECTIVE_OR_NOT_FOUND" });
        }
        const session = resolveRequestIdentitySession(request);
        const contextRegistry = createContextRegistryForSession(session);
        const resolved = contextRegistry.resolve(
          contextFromHeaderV010(request.headers, contextRegistry)
        );
        const active = resolved.activeContext;
        if (active.kind !== "ENTERPRISE") {
          return json(response, 409, {
            code: "DEFINITION_PROJECTION_ENTERPRISE_CONTEXT_REQUIRED"
          });
        }
        const routeValue = url.searchParams.get("route")?.trim();
        const routeSelection = parseDefinitionProjectionRouteV010(
          routeValue || undefined,
          DEFINITION_2D_EDITOR_ROUTE_V010
        );
        if (routeValue && !routeSelection) {
          return json(response, 400, {
            code: "DEFINITION_PROJECTION_ROUTE_INVALID"
          });
        }
        const sessionId = session.principal.sessionId?.trim();
        const subjectId = session.principal.subjectId.trim();
        const sessionSelection =
          (sessionId
            ? enterpriseDefinitionProjectionSessions.get(sessionId)
            : undefined)
          ?? enterpriseDefinitionProjectionSessions.get(subjectId);
        const selection = routeSelection
          ? {
              enterpriseId: active.enterpriseId,
              definitionId: routeSelection.definitionId,
              definitionRevision: routeSelection.definitionRevision,
              projectionId: routeSelection.projectionId
            }
          : sessionSelection;
        if (
          !selection?.projectionId
          || selection.enterpriseId !== active.enterpriseId
        ) {
          return json(response, 409, {
            code: "DEFINITION_PROJECTION_SELECTION_REQUIRED",
            message: "Open a saved Projection before editing it."
          });
        }
        const [editor, sourceModule] = await Promise.all([
          import("../apps/eog-2d-designer/definition-projection-editor.js"),
          import("../providers/enterprise-context/definition-projection.js")
        ]);
        const artifact =
          sourceModule.createEnterpriseDefinitionProjectionArtifactSourceV010(
            enterpriseBusinessDefinitionRepository,
            enterpriseDefinitionProjectionStore
          ).get({
            enterpriseId: selection.enterpriseId,
            definitionId: selection.definitionId,
            definitionRevision: selection.definitionRevision,
            projectionId: selection.projectionId
          });
        if (!artifact) {
          return json(response, 404, {
            code: "DEFINITION_PROJECTION_NOT_FOUND"
          });
        }
        const locale = requestedLocale(url);
        const definitionRevisionRecord =
          enterpriseBusinessDefinitionRepository
            .listHistory({
              enterpriseId: artifact.enterpriseId,
              definitionId: artifact.definitionId
            })
            .find(item => item.revision === artifact.definitionRevision);
        const definitionTitle =
          definitionRevisionRecord?.title ?? artifact.title;
        const contextNavigation =
          artifact.definitionKind === LEDGER_MANAGER_DEFINITION_KIND
            ? {
                items: [
                  {
                    id: "ledger-manager",
                    label: locale.toLowerCase().startsWith("zh")
                      ? "账本管理"
                      : "Ledger management",
                    route: LEDGER_MANAGER_ROUTE
                  },
                  {
                    id: "ledger-runtime-template",
                    label: definitionTitle,
                    route: ledgerManagerDetailRouteV010(
                      artifact.definitionId,
                      artifact.definitionRevision
                    )
                  },
                  {
                    id: "relationship-map",
                    label: locale.toLowerCase().startsWith("zh")
                      ? "投影视图"
                      : "Projection view",
                    route: definition2dPreviewRouteV010({
                      definitionId: artifact.definitionId,
                      definitionRevision: artifact.definitionRevision,
                      projectionId: selection.projectionId
                    })
                  },
                  {
                    id: "edit-projection",
                    label: locale.toLowerCase().startsWith("zh")
                      ? "编辑投影"
                      : "Edit projection"
                  }
                ]
              }
            : undefined;
        return json(
          response,
          200,
          editor.createEnterpriseDefinitionProjectionEditorPageV010({
            enterpriseId: artifact.enterpriseId,
            definitionId: artifact.definitionId,
            definitionRevision: artifact.definitionRevision,
            projectionId: selection.projectionId,
            title: artifact.title,
            ...(artifact.camera ? { camera: artifact.camera } : {}),
            ...(contextNavigation ? { contextNavigation } : {}),
            locale
          })
        );
      }

      if (source === EOG_2D_VIEWER_DEFINITION_PREVIEW_PAGE_SOURCE) {
        const effective = manager.getSnapshot().activeFeatures.some(
          feature => feature.featureId === EOG_2D_VIEWER_FEATURE_ID
        );
        if (!effective) {
          return json(response, 404, { code: "PAGE_NOT_EFFECTIVE_OR_NOT_FOUND" });
        }
        const session = resolveRequestIdentitySession(request);
        const contextRegistry = createContextRegistryForSession(session);
        const resolved = contextRegistry.resolve(
          contextFromHeaderV010(request.headers, contextRegistry)
        );
        const active = resolved.activeContext;
        if (active.kind !== "ENTERPRISE") {
          return json(response, 409, {
            code: "DEFINITION_PROJECTION_ENTERPRISE_CONTEXT_REQUIRED"
          });
        }
        const routeValue = url.searchParams.get("route")?.trim();
        const routeSelection = parseDefinitionProjectionRouteV010(
          routeValue || undefined,
          DEFINITION_2D_PREVIEW_ROUTE_V010
        );
        if (routeValue && !routeSelection) {
          return json(response, 400, {
            code: "DEFINITION_PROJECTION_ROUTE_INVALID"
          });
        }
        const sessionId = session.principal.sessionId?.trim();
        const subjectId = session.principal.subjectId.trim();
        const sessionSelection =
          (sessionId
            ? enterpriseDefinitionProjectionSessions.get(sessionId)
            : undefined)
          ?? enterpriseDefinitionProjectionSessions.get(subjectId);
        const selection = routeSelection
          ? {
              enterpriseId: active.enterpriseId,
              definitionId: routeSelection.definitionId,
              definitionRevision: routeSelection.definitionRevision,
              projectionId: routeSelection.projectionId
            }
          : sessionSelection;
        if (!selection || selection.enterpriseId !== active.enterpriseId) {
          return json(response, 409, {
            code: "DEFINITION_PROJECTION_SELECTION_REQUIRED",
            message: "Choose a Projection from Enterprise Software first."
          });
        }
        const [viewer, sourceModule] = await Promise.all([
          import("../apps/eog-2d-viewer/definition-preview.js"),
          import("../providers/enterprise-context/definition-projection.js")
        ]);
        const artifact =
          sourceModule.createEnterpriseDefinitionProjectionArtifactSourceV010(
            enterpriseBusinessDefinitionRepository,
            enterpriseDefinitionProjectionStore
          ).get({
            enterpriseId: selection.enterpriseId,
            definitionId: selection.definitionId,
            definitionRevision: selection.definitionRevision,
            ...(selection.projectionId
              ? { projectionId: selection.projectionId }
              : {})
          });
        if (!artifact) {
          return json(response, 404, {
            code: "DEFINITION_2D_PREVIEW_NOT_FOUND"
          });
        }
        const locale = requestedLocale(url);
        const definitionRevisionRecord =
          enterpriseBusinessDefinitionRepository
            .listHistory({
              enterpriseId: artifact.enterpriseId,
              definitionId: artifact.definitionId
            })
            .find(item => item.revision === artifact.definitionRevision);
        const definitionTitle =
          definitionRevisionRecord?.title ?? artifact.title;
        const contextNavigation =
          artifact.definitionKind === LEDGER_MANAGER_DEFINITION_KIND
            ? {
                items: [
                  {
                    id: "ledger-manager",
                    label: locale.toLowerCase().startsWith("zh")
                      ? "账本管理"
                      : "Ledger management",
                    route: LEDGER_MANAGER_ROUTE
                  },
                  {
                    id: "ledger-runtime-template",
                    label: definitionTitle,
                    route: ledgerManagerDetailRouteV010(
                      artifact.definitionId,
                      artifact.definitionRevision
                    )
                  },
                  {
                    id: "relationship-map",
                    label: locale.toLowerCase().startsWith("zh")
                      ? "投影视图"
                      : "Projection view"
                  }
                ]
              }
            : undefined;
        return json(
          response,
          200,
          viewer.createEnterpriseDefinition2dPreviewPageV010({
            enterpriseId: artifact.enterpriseId,
            definitionId: artifact.definitionId,
            definitionRevision: artifact.definitionRevision,
            title: artifact.title,
            ...(artifact.projectionId
              ? { projectionId: artifact.projectionId }
              : {}),
            ...(artifact.camera ? { camera: artifact.camera } : {}),
            ...(contextNavigation ? { contextNavigation } : {}),
            canEditProjection: manager.getSnapshot().activeFeatures.some(
              feature => feature.featureId === EOG_2D_DESIGNER_FEATURE_ID
            ),
            locale
          })
        );
      }

      if (
        source === EOG_OBSERVATORY_PAGE_SOURCE
        || source === EOG_MOBILE_READ_PAGE_SOURCE
      ) {
        const effective = manager.getSnapshot().activeFeatures.some(
          feature => feature.featureId === ENTERPRISE_OBSERVATORY_2D_FEATURE_ID
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
          source === EOG_MOBILE_READ_PAGE_SOURCE
            ? createEnterpriseOperatingGraphMobileReadPageV010({
                activeContext
              })
            : createEnterpriseOperatingGraphObservatoryPageV020({
                activeContext,
                locale: requestedLocale(url)
              })
        );
      }
      if (source === EOG_3D_VIEWER_PAGE_SOURCE) {
        const effective = manager.getSnapshot().activeFeatures.some(
          feature => feature.featureId === EOG_3D_VIEWER_FEATURE_ID
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
          createEnterpriseOperatingGraph3dViewerPageV010({
            activeContext,
            locale: requestedLocale(url)
          })
        );
      }
      if (source === EOG_SPATIAL_OBSERVATORY_PAGE_SOURCE) {
        const effective = manager.getSnapshot().activeFeatures.some(
          feature => feature.featureId === ENTERPRISE_OBSERVATORY_3D_FEATURE_ID
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
        || source === ENTERPRISE_AGENT_MOBILE_FOLLOW_UP_PAGE_SOURCE
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
        const requestedContext = contextFromHeaderV010(
          request.headers,
          contextRegistry
        );
        const availableContextRefs = contextRegistry.list();
        const defaultEnterpriseContext = resolveDefaultEnterpriseContextV010({
          principal: session.principal,
          availableContexts: availableContextRefs,
          store: enterpriseGovernanceStore
        });
        const effectiveContext = resolvePersonalAgentActiveContextV010({
          requestedContext,
          defaultEnterpriseContext,
          availableContexts: availableContextRefs
        });
        const context = contextRegistry.resolve(effectiveContext);
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
        if (source === ENTERPRISE_AGENT_MOBILE_FOLLOW_UP_PAGE_SOURCE) {
          return json(response, 200, createPersonalAgentFollowUpTaskInboxV010({
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
      if (
        source === TEMPLATE_STORE_PAGE_SOURCE
        || source === TEMPLATE_STORE_DETAIL_PAGE_SOURCE
      ) {
        const effective = manager.getSnapshot().activeFeatures.some(
          feature => feature.featureId === TEMPLATE_STORE_FEATURE_ID
        );
        if (!effective) {
          return json(response, 404, { code: "PAGE_NOT_EFFECTIVE_OR_NOT_FOUND" });
        }
        const [module, templateStoreRepository] = await Promise.all([
          import("../apps/template-store/experience-assets.js"),
          resolveTemplateStoreRepository()
        ]);
        const pageOptions = {
          viewer2dAvailable:
            manager.getSnapshot().effectiveCapabilities.includes(
              VISUAL_2D_VIEWER_CAPABILITY_V010
            ),
          locale: requestedLocale(url)
        };

        if (source === TEMPLATE_STORE_DETAIL_PAGE_SOURCE) {
          const session = resolveRequestIdentitySession(request);
          const sessionId = session.principal.sessionId?.trim();
          const subjectId = session.principal.subjectId.trim();
          const selection =
            (sessionId ? templatePreviewSessions.get(sessionId) : undefined)
            ?? templatePreviewSessions.get(subjectId);
          if (!selection) {
            return json(response, 409, {
              code: "TEMPLATE_DETAIL_SELECTION_REQUIRED",
              message: "Choose Details from a Template Store card first."
            });
          }
          const record = templateStoreRepository.getVersion(
            selection.templateId,
            selection.templateVersion
          );
          if (!record) {
            return json(response, 404, {
              code: "TEMPLATE_STORE_VERSION_NOT_FOUND"
            });
          }
          return json(
            response,
            200,
            module.createTemplateStoreDetailPageV010(
              record,
              pageOptions
            )
          );
        }

        return json(
          response,
          200,
          module.createTemplateStorePageV010(
            module.createTemplateStoreCatalogEntriesV010(
              templateStoreRepository.listLatest()
            ),
            pageOptions
          )
        );
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
      if (source === workspaceHomePageSource) {
        const session = resolveRequestIdentitySession(request);
        const contextRegistry = createContextRegistryForSession(session);
        const resolved = contextRegistry.resolve(
          contextFromHeaderV010(request.headers, contextRegistry)
        );
        const principal = {
          ...structuredClone(session.principal),
          sessionId: session.sessionId
        };
        const partialContext: PlatformRequestContextV010 = {
          contractVersion: "0.1.0",
          principal,
          scope: {
            contractVersion: "0.1.0",
            userId: principal.subjectId
          },
          context: resolved,
          correlationId: "workspace-home-" + randomUUID(),
          locale: requestedLocale(url)
        };
        const requestContext: PlatformRequestContextV010 = {
          ...partialContext,
          scope: legacyScopeFromRequestContextV010(partialContext)
        };
        return json(
          response,
          200,
          createWorkspaceHomePageV010(
            requestedLocale(url),
            await workbenchService.resolve(requestContext)
          )
        );
      }
      if (source === settingsIndexPageSource) {
        return json(
          response,
          200,
          createSettingsIndexPage(manager, requestedLocale(url))
        );
      }
      const settingsGroup = settingsGroupFromPageSource(source);
      if (settingsGroup) {
        return json(
          response,
          200,
          createSettingsGroupPage(
            manager,
            settingsGroup,
            requestedLocale(url)
          )
        );
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
          if (namespace === GENERIC_OIDC_PACKAGE_ID) {
            await refreshGenericOidcProviderRuntime();
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
    const securityFailure = requestSecurityHttpFailureV010(error);
    if (securityFailure) {
      return json(response, securityFailure.status, {
        code: securityFailure.code,
        message: securityFailure.message
      });
    }
    const authenticationFailure = requestAuthenticationHttpFailureV010(error);
    if (authenticationFailure) {
      return json(response, authenticationFailure.status, {
        code: authenticationFailure.code,
        message: authenticationFailure.message
      });
    }
    return json(response, 500, {
      code: "APP_MANAGER_ERROR",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

try {
  await webAssetArchive.ensureCurrent();
} catch (error) {
  webAssetArchiveError = error instanceof Error ? error.message : String(error);
  console.error("Web asset archive initialization failed.", error);
}

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
