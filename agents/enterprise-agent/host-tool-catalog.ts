import type { AppManagerService } from "../../manager/service.js";
import type { ProviderBindingV010 } from "../../manager/provider-resolution.js";
import type { ProviderRuntimeHealthV010 } from "../../providers/runtime-registry.js";
import type { HelpContextSelectorsV010, HelpSearchResultV010 } from "../../manager/help-system.js";
import type { ResolvedContextSetV010 } from "../../contracts/platform-services.js";
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
  context: ResolvedContextSetV010;
  listProviderBindings(capability?: string): ProviderBindingV010[];
  getProviderHealth(providerId: string): ProviderRuntimeHealthV010;
  searchHelp(
    query: string,
    context?: HelpContextSelectorsV010
  ): HelpSearchResultV010[];
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
