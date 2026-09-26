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
