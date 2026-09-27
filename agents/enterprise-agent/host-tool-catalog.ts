import type { AppManagerService } from "../../manager/service.js";
import type { ProviderBindingV010 } from "../../manager/provider-resolution.js";
import type { ProviderRuntimeHealthV010 } from "../../providers/runtime-registry.js";
import type { HelpContextSelectorsV010, HelpSearchResultV010 } from "../../manager/help-system.js";
import type {
  ActiveContextRefV010,
  PlatformPrincipalV010,
  ResolvedContextSetV010
} from "../../contracts/platform-services.js";
import type {
  AgentToolCall,
  AgentToolCatalogV010,
  AgentToolDescriptorV010,
  AgentToolObservation
} from "./contracts.js";

export interface EnterpriseAgentToolRegistrationV010 {
  descriptor: AgentToolDescriptorV010;
  available?: () => boolean;
  execute(
    args: Record<string, unknown>,
    observations: readonly AgentToolObservation[]
  ): Promise<unknown> | unknown;
}

export interface EnterpriseAgentHostToolDependenciesV010 {
  manager: AppManagerService;
  principal: PlatformPrincipalV010;
  context: ResolvedContextSetV010;
  listAvailableContexts(): ActiveContextRefV010[];
  listProviderBindings(capability?: string): ProviderBindingV010[];
  getProviderHealth(providerId: string): ProviderRuntimeHealthV010;
  readContextMemory?: (input: {
    query?: string;
    kinds?: Array<"FACT" | "CLAIM" | "EXPERIENCE" | "PRACTICE">;
    memoryIds?: string[];
    limit?: number;
  }) => Promise<unknown> | unknown;
  proposeContextMemory?: (input: {
    kind: "FACT" | "CLAIM" | "EXPERIENCE" | "PRACTICE";
    summary: string;
    evidenceRefs: string[];
    proposedConfidence?: number;
    observedAt?: string;
    supersedesMemoryId?: string;
    potentialContradictionMemoryIds: string[];
  }) => Promise<unknown> | unknown;
  getContextMemoryProposal?: (proposalId: string) => Promise<unknown> | unknown;
  proposeContextMemoryCanonicalization?: (input: {
    duplicateMemoryId: string;
    canonicalMemoryId: string;
    reason?: string;
  }) => Promise<unknown> | unknown;
  getContextMemoryCanonicalizationProposal?: (proposalId: string) => Promise<unknown> | unknown;
  listPersonalFollowUps?: () => Promise<unknown> | unknown;
  searchHelp(
    query: string,
    context?: HelpContextSelectorsV010
  ): HelpSearchResultV010[];
  authorizeWrite?: (
    descriptor: AgentToolDescriptorV010,
    args: Record<string, unknown>
  ) => Promise<{ allowed: boolean; code?: string; message?: string }>
    | { allowed: boolean; code?: string; message?: string };
}

function stringArg(
  args: Record<string, unknown>,
  key: string,
  required = true
): string | undefined {
  const value = args[key];
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`AGENT_TOOL_ARGUMENT_REQUIRED: ${key}`);
  }
  return value.trim();
}

function successfulInstallPlan(
  observations: readonly AgentToolObservation[],
  packageId: string
): AgentToolObservation | undefined {
  return [...observations].reverse().find(observation => {
    if (observation.tool !== "app.install.plan" || !observation.ok) return false;
    const plan = observation.result as {
      packageId?: unknown;
      blockers?: unknown;
      sideEffectFree?: unknown;
    } | undefined;
    return plan?.packageId === packageId
      && plan.sideEffectFree === true
      && Array.isArray(plan.blockers)
      && plan.blockers.length === 0;
  });
}

function descriptor(
  input: Omit<AgentToolDescriptorV010, "contractVersion">
): AgentToolDescriptorV010 {
  return { contractVersion: "0.1.0", ...input };
}

export function createEnterpriseAgentHostToolCatalogV010(
  dependencies: EnterpriseAgentHostToolDependenciesV010,
  additional: readonly EnterpriseAgentToolRegistrationV010[] = []
): AgentToolCatalogV010 {
  const registrations: EnterpriseAgentToolRegistrationV010[] = [
    {
      descriptor: descriptor({
        id: "context.current.get",
        modelName: "context_current_get",
        title: "Current Context",
        description: "Read the Host-resolved Personal Context and current active Context for this Agent run.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform",
        capability: "agent.personal"
      }),
      execute() {
        return structuredClone(dependencies.context);
      }
    },
    {
      descriptor: descriptor({
        id: "context.available.list",
        modelName: "context_available_list",
        title: "Available Contexts",
        description: "List only the Personal and Enterprise Context references currently offered by the Host.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform",
        capability: "agent.personal"
      }),
      execute() {
        return dependencies.listAvailableContexts().map(context => structuredClone(context));
      }
    },
    {
      descriptor: descriptor({
        id: "enterprise.context.profile.get",
        modelName: "enterprise_context_profile_get",
        title: "Enterprise Context profile",
        description: "Read the Host-resolved Enterprise Context profile for the current authorized Agent run.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform",
        capability: "enterprise.directory"
      }),
      available() {
        return dependencies.context.activeContext.kind === "ENTERPRISE"
          && dependencies.context.enterpriseContext !== undefined
          && dependencies.context.personalContext.ownerSubjectId === dependencies.principal.subjectId;
      },
      execute() {
        if (
          dependencies.context.activeContext.kind !== "ENTERPRISE"
          || !dependencies.context.enterpriseContext
        ) {
          throw new Error("ENTERPRISE_CONTEXT_REQUIRED");
        }
        return structuredClone(dependencies.context.enterpriseContext);
      }
    },
    {
      descriptor: descriptor({
        id: "personal.follow-up.list",
        modelName: "personal_follow_up_list",
        title: "Personal Agent follow-ups",
        description: "Read open planning-only Personal Agent follow-ups for the current Principal and active Context. Follow-ups may suggest review work but never authorize writes.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "enterprise-agent",
        capability: "agent.personal"
      }),
      available() {
        return dependencies.listPersonalFollowUps !== undefined;
      },
      execute() {
        if (!dependencies.listPersonalFollowUps) {
          throw new Error("PERSONAL_AGENT_FOLLOW_UP_READER_REQUIRED");
        }
        return dependencies.listPersonalFollowUps();
      }
    },
    {
      descriptor: descriptor({
        id: "context.memory.search",
        modelName: "context_memory_search",
        title: "Context Memory",
        description: "Read immutable Memory records only from the current Host-resolved Context, including provenance and attribution.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Optional text filter over memory summaries and evidence references."
            },
            kind: {
              type: "string",
              enum: ["FACT", "CLAIM", "EXPERIENCE", "PRACTICE"],
              description: "Optional Memory kind filter."
            },
            limit: {
              type: "number",
              description: "Optional result limit from 1 to 100."
            }
          },
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform",
        capability: "context.memory.read"
      }),
      available() {
        return dependencies.readContextMemory !== undefined;
      },
      execute(args) {
        if (!dependencies.readContextMemory) {
          throw new Error("CONTEXT_MEMORY_READER_REQUIRED");
        }
        const query = stringArg(args, "query", false);
        const rawKind = stringArg(args, "kind", false);
        const kind = rawKind as "FACT" | "CLAIM" | "EXPERIENCE" | "PRACTICE" | undefined;
        if (rawKind && !["FACT", "CLAIM", "EXPERIENCE", "PRACTICE"].includes(rawKind)) {
          throw new Error("CONTEXT_MEMORY_KIND_INVALID");
        }
        const rawLimit = args.limit;
        if (
          rawLimit !== undefined
          && (
            typeof rawLimit !== "number"
            || !Number.isInteger(rawLimit)
            || rawLimit < 1
            || rawLimit > 100
          )
        ) {
          throw new Error("CONTEXT_MEMORY_LIMIT_INVALID");
        }
        return dependencies.readContextMemory({
          ...(query ? { query } : {}),
          ...(kind ? { kinds: [kind] } : {}),
          ...(rawLimit !== undefined ? { limit: rawLimit } : {})
        });
      }
    },
    {
      descriptor: descriptor({
        id: "context.memory.audit.compare",
        modelName: "context_memory_audit_compare",
        title: "Context Memory effective-vs-history audit",
        description: "In one authoritative READ, compare ordinary effective Context Memory retrieval for a query with exact-ID historical audit of specified Memory records. Use this when the human wants to verify canonicalization/supersession effects without multiple model round trips. This never changes Memory.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Text query for ordinary effective Memory retrieval."
            },
            memoryIds: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
              maxItems: 20,
              description: "Exact Memory IDs to audit historically, including records hidden from ordinary retrieval."
            }
          },
          required: ["query", "memoryIds"],
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform",
        capability: "context.memory.read"
      }),
      available() {
        return dependencies.readContextMemory !== undefined;
      },
      async execute(args) {
        if (!dependencies.readContextMemory) {
          throw new Error("CONTEXT_MEMORY_READER_REQUIRED");
        }
        const query = stringArg(args, "query")!;
        const rawMemoryIds = args.memoryIds;
        if (
          !Array.isArray(rawMemoryIds)
          || rawMemoryIds.length < 1
          || rawMemoryIds.length > 20
          || rawMemoryIds.some(item => typeof item !== "string" || !item.trim())
        ) {
          throw new Error("CONTEXT_MEMORY_AUDIT_MEMORY_IDS_INVALID");
        }
        const memoryIds = [...new Set(rawMemoryIds.map(item => (item as string).trim()))];

        const [effective, audit] = await Promise.all([
          dependencies.readContextMemory({
            query,
            limit: 100
          }),
          dependencies.readContextMemory({
            memoryIds,
            limit: Math.min(100, memoryIds.length)
          })
        ]);

        if (
          effective === null
          || typeof effective !== "object"
          || !Array.isArray((effective as { items?: unknown }).items)
          || audit === null
          || typeof audit !== "object"
          || !Array.isArray((audit as { items?: unknown }).items)
        ) {
          throw new Error("CONTEXT_MEMORY_AUDIT_COMPARE_RESULT_INVALID");
        }

        const auditedIds = new Set(
          (audit as { items: unknown[] }).items
            .map(item =>
              item !== null
              && typeof item === "object"
              && typeof (item as { memoryId?: unknown }).memoryId === "string"
                ? (item as { memoryId: string }).memoryId
                : undefined
            )
            .filter((memoryId): memoryId is string => Boolean(memoryId))
        );

        return {
          contractVersion: "0.1.0",
          effective,
          audit,
          missingMemoryIds: memoryIds.filter(memoryId => !auditedIds.has(memoryId))
        };
      }
    },
    {
      descriptor: descriptor({
        id: "context.memory.audit.get",
        modelName: "context_memory_audit_get",
        title: "Context Memory exact-ID audit",
        description: "Read one immutable Memory record by exact memoryId from the current Host-resolved Context, including records hidden from ordinary retrieval by supersession or canonicalization. Use only for audit/verification; this never changes Memory.",
        inputSchema: {
          type: "object",
          properties: {
            memoryId: {
              type: "string",
              description: "Exact Memory ID to audit."
            }
          },
          required: ["memoryId"],
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform",
        capability: "context.memory.read"
      }),
      available() {
        return dependencies.readContextMemory !== undefined;
      },
      async execute(args) {
        if (!dependencies.readContextMemory) {
          throw new Error("CONTEXT_MEMORY_READER_REQUIRED");
        }
        const memoryId = stringArg(args, "memoryId")!;
        const result = await dependencies.readContextMemory({
          memoryIds: [memoryId],
          limit: 1
        });
        if (
          result === null
          || typeof result !== "object"
          || !Array.isArray((result as { items?: unknown }).items)
        ) {
          throw new Error("CONTEXT_MEMORY_AUDIT_RESULT_INVALID");
        }
        const items = (result as { items: unknown[] }).items;
        if (items.length === 0) {
          throw new Error("CONTEXT_MEMORY_NOT_FOUND");
        }
        return result;
      }
    },
    {
      descriptor: descriptor({
        id: "context.memory.proposal.get",
        modelName: "context_memory_proposal_get",
        title: "Context Memory Proposal",
        description: "Read one existing Context Memory proposal by proposalId from the current Host-resolved Context. Use this to verify proposal state and review semantics; it never changes Memory.",
        inputSchema: {
          type: "object",
          properties: {
            proposalId: { type: "string" }
          },
          required: ["proposalId"],
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "enterprise-agent",
        capability: "context.memory.read"
      }),
      available() {
        return dependencies.getContextMemoryProposal !== undefined;
      },
      execute(args) {
        if (!dependencies.getContextMemoryProposal) {
          throw new Error("CONTEXT_MEMORY_PROPOSAL_READER_REQUIRED");
        }
        return dependencies.getContextMemoryProposal(
          stringArg(args, "proposalId")!
        );
      }
    },
    {
      descriptor: descriptor({
        id: "context.memory.canonicalization.proposal.get",
        modelName: "context_memory_canonicalization_proposal_get",
        title: "Memory canonicalization proposal",
        description: "Read one existing duplicate-to-canonical Memory proposal by proposalId from the current Host-resolved Context. This never changes Memory or governance.",
        inputSchema: {
          type: "object",
          properties: {
            proposalId: { type: "string" }
          },
          required: ["proposalId"],
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "enterprise-agent",
        capability: "context.memory.read"
      }),
      available() {
        return dependencies.getContextMemoryCanonicalizationProposal !== undefined;
      },
      execute(args) {
        if (!dependencies.getContextMemoryCanonicalizationProposal) {
          throw new Error("CONTEXT_MEMORY_CANONICALIZATION_PROPOSAL_READER_REQUIRED");
        }
        return dependencies.getContextMemoryCanonicalizationProposal(
          stringArg(args, "proposalId")!
        );
      }
    },
    {
      descriptor: descriptor({
        id: "context.memory.canonicalization.proposal.create",
        modelName: "context_memory_canonicalization_proposal_create",
        title: "Propose Memory canonicalization",
        description: "Stage a reviewable proposal that marks one existing Memory as a semantic duplicate of another existing canonical Memory. This creates no Memory record and changes no retrieval until a Human accepts it.",
        inputSchema: {
          type: "object",
          properties: {
            duplicateMemoryId: { type: "string" },
            canonicalMemoryId: { type: "string" },
            reason: { type: "string" }
          },
          required: ["duplicateMemoryId", "canonicalMemoryId"],
          additionalProperties: false
        },
        effect: "WRITE",
        ownerPackageId: "enterprise-agent",
        capability: "context.memory.write"
      }),
      available() {
        return dependencies.proposeContextMemoryCanonicalization !== undefined;
      },
      execute(args) {
        if (!dependencies.proposeContextMemoryCanonicalization) {
          throw new Error("CONTEXT_MEMORY_CANONICALIZATION_PROPOSAL_SERVICE_REQUIRED");
        }
        return dependencies.proposeContextMemoryCanonicalization({
          duplicateMemoryId: stringArg(args, "duplicateMemoryId")!,
          canonicalMemoryId: stringArg(args, "canonicalMemoryId")!,
          ...(stringArg(args, "reason", false)
            ? { reason: stringArg(args, "reason", false) }
            : {})
        });
      }
    },
    {
      descriptor: descriptor({
        id: "context.memory.proposal.create",
        modelName: "context_memory_proposal_create",
        title: "Propose Context Memory",
        description: "Create a reviewable Memory proposal for the current Host-resolved Context. This does not write durable Memory; a human must review and accept it.",
        inputSchema: {
          type: "object",
          properties: {
            kind: {
              type: "string",
              enum: ["FACT", "CLAIM", "EXPERIENCE", "PRACTICE"]
            },
            summary: { type: "string" },
            evidenceRefs: {
              type: "array",
              items: { type: "string" }
            },
            proposedConfidence: {
              type: "number",
              minimum: 0,
              maximum: 1
            },
            observedAt: { type: "string" },
            supersedesMemoryId: { type: "string" },
            potentialContradictionMemoryIds: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["kind", "summary"],
          additionalProperties: false
        },
        effect: "WRITE",
        ownerPackageId: "enterprise-agent",
        capability: "context.memory.write"
      }),
      available() {
        return dependencies.proposeContextMemory !== undefined;
      },
      execute(args) {
        if (!dependencies.proposeContextMemory) {
          throw new Error("CONTEXT_MEMORY_PROPOSAL_SERVICE_REQUIRED");
        }
        const rawKind = stringArg(args, "kind")!;
        if (!["FACT", "CLAIM", "EXPERIENCE", "PRACTICE"].includes(rawKind)) {
          throw new Error("CONTEXT_MEMORY_PROPOSAL_KIND_INVALID");
        }
        const summary = stringArg(args, "summary")!;
        const stringArrayArg = (key: string): string[] => {
          const value = args[key];
          if (value === undefined) return [];
          if (!Array.isArray(value) || value.some(item => typeof item !== "string" || !item.trim())) {
            throw new Error(`CONTEXT_MEMORY_PROPOSAL_ARGUMENT_INVALID: ${key}`);
          }
          return [...new Set(value.map(item => (item as string).trim()))];
        };
        const confidence = args.proposedConfidence;
        if (
          confidence !== undefined
          && (
            typeof confidence !== "number"
            || !Number.isFinite(confidence)
            || confidence < 0
            || confidence > 1
          )
        ) {
          throw new Error("CONTEXT_MEMORY_PROPOSAL_CONFIDENCE_INVALID");
        }
        return dependencies.proposeContextMemory({
          kind: rawKind as "FACT" | "CLAIM" | "EXPERIENCE" | "PRACTICE",
          summary,
          evidenceRefs: stringArrayArg("evidenceRefs"),
          ...(confidence !== undefined ? { proposedConfidence: confidence } : {}),
          ...(stringArg(args, "observedAt", false)
            ? { observedAt: stringArg(args, "observedAt", false) }
            : {}),
          ...(stringArg(args, "supersedesMemoryId", false)
            ? { supersedesMemoryId: stringArg(args, "supersedesMemoryId", false) }
            : {}),
          potentialContradictionMemoryIds: stringArrayArg("potentialContradictionMemoryIds")
        });
      }
    },
    {
      descriptor: descriptor({
        id: "platform.snapshot.get",
        modelName: "platform_snapshot_get",
        title: "Platform snapshot",
        description: "Read installed Packages, active Features and effective Capabilities.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform"
      }),
      execute() {
        return dependencies.manager.getSnapshot();
      }
    },
    {
      descriptor: descriptor({
        id: "capability.list",
        modelName: "capability_list",
        title: "Effective capabilities",
        description: "List the platform Capabilities currently effective from active Features.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform"
      }),
      execute() {
        return dependencies.manager.getSnapshot().effectiveCapabilities;
      }
    },
    {
      descriptor: descriptor({
        id: "app.catalog.list",
        modelName: "app_catalog_list",
        title: "Package catalog",
        description: "List Packages currently available in the App Manager catalog.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform"
      }),
      execute() {
        return dependencies.manager.listCatalog();
      }
    },
    {
      descriptor: descriptor({
        id: "app.install.plan",
        modelName: "app_install_plan",
        title: "Plan Package installation",
        description: "Run a side-effect-free installation preflight for a Package.",
        inputSchema: {
          type: "object",
          properties: {
            packageId: {
              type: "string",
              description: "Exact Package id from the catalog."
            }
          },
          required: ["packageId"],
          additionalProperties: false
        },
        effect: "PLAN",
        ownerPackageId: "evo-app-platform"
      }),
      execute(args) {
        return dependencies.manager.planInstall(stringArg(args, "packageId")!);
      }
    },
    {
      descriptor: descriptor({
        id: "app.install.execute",
        modelName: "app_install_execute",
        title: "Install Package",
        description: "Execute Package installation after a successful side-effect-free preflight.",
        inputSchema: {
          type: "object",
          properties: {
            packageId: {
              type: "string",
              description: "Exact Package id from the successful installation preflight."
            }
          },
          required: ["packageId"],
          additionalProperties: false
        },
        effect: "WRITE",
        ownerPackageId: "evo-app-platform"
      }),
      execute(args, observations) {
        const packageId = stringArg(args, "packageId")!;
        if (!successfulInstallPlan(observations, packageId)) {
          throw new Error(
            `INSTALL_PLAN_REQUIRED: A successful side-effect-free install plan is required before installing '${packageId}'`
          );
        }
        return dependencies.manager.install(packageId);
      }
    },
    {
      descriptor: descriptor({
        id: "provider.list",
        modelName: "provider_list",
        title: "Effective Providers",
        description: "List active platform service Providers and their current runtime health.",
        inputSchema: {
          type: "object",
          properties: {
            capability: {
              type: "string",
              description: "Optional exact Capability id used to filter Providers."
            }
          },
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform"
      }),
      execute(args) {
        const capability = stringArg(args, "capability", false);
        return dependencies.manager
          .listEffectiveServiceProviders(capability)
          .map(provider => ({
            ...provider,
            health: dependencies.getProviderHealth(provider.providerId)
          }));
      }
    },
    {
      descriptor: descriptor({
        id: "provider.health.get",
        modelName: "provider_health_get",
        title: "Provider health",
        description: "Read the current recorded health of one active Provider without running a new probe.",
        inputSchema: {
          type: "object",
          properties: {
            providerId: {
              type: "string",
              description: "Exact Provider id returned by provider_list."
            }
          },
          required: ["providerId"],
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform"
      }),
      execute(args) {
        const providerId = stringArg(args, "providerId")!;
        const active = dependencies.manager
          .listEffectiveServiceProviders()
          .some(provider => provider.providerId === providerId);
        if (!active) throw new Error(`PROVIDER_NOT_ACTIVE: ${providerId}`);
        return {
          providerId,
          health: dependencies.getProviderHealth(providerId)
        };
      }
    },
    {
      descriptor: descriptor({
        id: "provider.binding.list",
        modelName: "provider_binding_list",
        title: "Provider bindings",
        description: "Read Host-owned Provider bindings, optionally filtered by Capability.",
        inputSchema: {
          type: "object",
          properties: {
            capability: {
              type: "string",
              description: "Optional exact Capability id."
            }
          },
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform"
      }),
      execute(args) {
        return dependencies.listProviderBindings(
          stringArg(args, "capability", false)
        );
      }
    },
    {
      descriptor: descriptor({
        id: "help.search",
        modelName: "help_search",
        title: "Platform Help search",
        description: "Search authoritative version-aware Platform Help for concepts, procedures or errors.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Natural-language or exact identifier search query."
            },
            errorCode: {
              type: "string",
              description: "Optional exact platform error code."
            },
            capability: {
              type: "string",
              description: "Optional exact Capability id."
            }
          },
          required: ["query"],
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform",
        capability: "platform.help.search"
      }),
      execute(args) {
        const query = stringArg(args, "query")!;
        const errorCode = stringArg(args, "errorCode", false);
        const capability = stringArg(args, "capability", false);
        return dependencies.searchHelp(query, {
          ...(errorCode ? { errorCodes: [errorCode] } : {}),
          ...(capability ? { capabilities: [capability] } : {})
        });
      }
    },
    ...additional
  ];

  const byId = new Map<string, EnterpriseAgentToolRegistrationV010>();
  const byModelName = new Set<string>();
  for (const registration of registrations) {
    const id = registration.descriptor.id.trim();
    const modelName = registration.descriptor.modelName.trim();
    if (!id || !modelName) throw new Error("AGENT_TOOL_DESCRIPTOR_INVALID");
    if (byId.has(id)) throw new Error(`AGENT_TOOL_DUPLICATE: ${id}`);
    if (byModelName.has(modelName)) {
      throw new Error(`AGENT_TOOL_MODEL_NAME_DUPLICATE: ${modelName}`);
    }
    byId.set(id, registration);
    byModelName.add(modelName);
  }

  const effective = (): EnterpriseAgentToolRegistrationV010[] =>
    [...byId.values()]
      .filter(registration => registration.available?.() ?? true)
      .sort((a, b) => a.descriptor.id.localeCompare(b.descriptor.id));

  return {
    list() {
      return effective().map(registration =>
        structuredClone(registration.descriptor)
      );
    },

    async invoke(call: AgentToolCall, observations) {
      const registration = effective()
        .find(item => item.descriptor.id === call.tool);
      if (!registration) {
        return {
          tool: call.tool,
          ok: false,
          error: {
            code: "AGENT_TOOL_UNAVAILABLE",
            message: `Tool '${call.tool}' is not present in the current Host tool catalog.`
          }
        };
      }

      try {
        if (registration.descriptor.effect === "WRITE") {
          if (!dependencies.authorizeWrite) {
            return {
              tool: call.tool,
              ok: false,
              error: {
                code: "MATERIAL_WRITE_AUTHORIZATION_REQUIRED",
                message: "Material WRITE tools require Host authorization."
              }
            };
          }
          const decision = await dependencies.authorizeWrite(
            registration.descriptor,
            call.arguments
          );
          if (!decision.allowed) {
            return {
              tool: call.tool,
              ok: false,
              error: {
                code: decision.code ?? "MATERIAL_WRITE_DENIED",
                message: decision.message ?? "Material WRITE denied by Host authorization."
              }
            };
          }
        }

        return {
          tool: call.tool,
          ok: true,
          result: await registration.execute(call.arguments, observations)
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const [candidate] = message.split(":");
        return {
          tool: call.tool,
          ok: false,
          error: {
            code: candidate && /^[A-Z0-9_]+$/.test(candidate)
              ? candidate
              : "TOOL_EXECUTION_FAILED",
            message
          }
        };
      }
    }
  };
}
