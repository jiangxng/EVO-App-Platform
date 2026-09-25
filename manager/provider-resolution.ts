import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { ActivationScope } from "../contracts/package.js";
import type {
  ProviderDescriptorLike,
  ProviderRuntimeRegistry
} from "../providers/runtime-registry.js";

export interface ProviderResolutionContextV010 {
  installationId?: string;
  enterpriseId?: string;
  companyId?: string;
  workspaceId?: string;
  userId?: string;
}

export interface ProviderBindingV010 {
  contractVersion: "0.1.0";
  capability: string;
  providerId: string;
  scope: ActivationScope;
  scopeId?: string;
  priority?: number;
}

export interface ProviderBindingStoreV010 {
  list(capability?: string): ProviderBindingV010[];
  save(binding: ProviderBindingV010): void;
  delete(capability: string, scope: ActivationScope, scopeId?: string): void;
}

export interface ProviderResolutionResultV010<T> {
  contractVersion: "0.1.0";
  capability: string;
  providerId: string;
  source: "EXPLICIT_BINDING" | "SINGLE_CANDIDATE";
  scope?: ActivationScope;
  scopeId?: string;
  candidates: string[];
  runtime: T;
}

const scopeSpecificity: Record<ActivationScope, number> = {
  SYSTEM: 0,
  INSTALLATION: 1,
  ENTERPRISE: 2,
  COMPANY: 3,
  WORKSPACE: 4,
  USER: 5
};

function normalizedScopeId(scope: ActivationScope, scopeId: string | undefined): string | undefined {
  if (scope === "SYSTEM") return undefined;
  const value = scopeId?.trim();
  if (!value) throw new Error(`PROVIDER_BINDING_SCOPE_ID_REQUIRED: ${scope}`);
  return value;
}

function bindingKey(binding: Pick<ProviderBindingV010, "capability" | "scope" | "scopeId">): string {
  return `${binding.capability}\n${binding.scope}\n${binding.scopeId ?? ""}`;
}

function validateBinding(binding: ProviderBindingV010): ProviderBindingV010 {
  if (binding.contractVersion !== "0.1.0") {
    throw new Error("PROVIDER_BINDING_VERSION_UNSUPPORTED");
  }
  const capability = binding.capability.trim();
  const providerId = binding.providerId.trim();
  if (!capability) throw new Error("PROVIDER_BINDING_CAPABILITY_REQUIRED");
  if (!providerId) throw new Error("PROVIDER_BINDING_PROVIDER_REQUIRED");
  const scopeId = normalizedScopeId(binding.scope, binding.scopeId);
  const priority = binding.priority ?? 0;
  if (!Number.isInteger(priority)) throw new Error("PROVIDER_BINDING_PRIORITY_INVALID");
  return {
    contractVersion: "0.1.0",
    capability,
    providerId,
    scope: binding.scope,
    ...(scopeId ? { scopeId } : {}),
    ...(priority !== 0 ? { priority } : {})
  };
}

export function createMemoryProviderBindingStoreV010(
  initial: ProviderBindingV010[] = []
): ProviderBindingStoreV010 {
  const bindings = new Map<string, ProviderBindingV010>();
  for (const value of initial) {
    const binding = validateBinding(value);
    const key = bindingKey(binding);
    if (bindings.has(key)) throw new Error(`PROVIDER_BINDING_DUPLICATE: ${key}`);
    bindings.set(key, binding);
  }

  return {
    list(capability) {
      return [...bindings.values()]
        .filter(binding => !capability || binding.capability === capability)
        .sort((a, b) =>
          a.capability.localeCompare(b.capability)
          || scopeSpecificity[b.scope] - scopeSpecificity[a.scope]
          || (b.priority ?? 0) - (a.priority ?? 0)
          || (a.scopeId ?? "").localeCompare(b.scopeId ?? "")
          || a.providerId.localeCompare(b.providerId)
        )
        .map(binding => structuredClone(binding));
    },
    save(value) {
      const binding = validateBinding(value);
      bindings.set(bindingKey(binding), structuredClone(binding));
    },
    delete(capability, scope, scopeId) {
      bindings.delete(bindingKey({
        capability: capability.trim(),
        scope,
        scopeId: normalizedScopeId(scope, scopeId)
      }));
    }
  };
}

interface ProviderBindingFileV010 {
  contractVersion: "0.1.0";
  bindings: ProviderBindingV010[];
}

export function createFileProviderBindingStoreV010(
  filePath: string
): ProviderBindingStoreV010 {
  const parsed: ProviderBindingFileV010 = existsSync(filePath)
    ? JSON.parse(readFileSync(filePath, "utf8")) as ProviderBindingFileV010
    : { contractVersion: "0.1.0", bindings: [] };
  if (parsed.contractVersion !== "0.1.0" || !Array.isArray(parsed.bindings)) {
    throw new Error(`PROVIDER_BINDING_STORE_INVALID: ${filePath}`);
  }

  const memory = createMemoryProviderBindingStoreV010(parsed.bindings);
  const persist = (): void => {
    mkdirSync(dirname(filePath), { recursive: true });
    const tmp = `${filePath}.tmp`;
    writeFileSync(tmp, JSON.stringify({
      contractVersion: "0.1.0",
      bindings: memory.list()
    }, null, 2) + "\n", "utf8");
    renameSync(tmp, filePath);
  };

  return {
    list: memory.list,
    save(binding) {
      memory.save(binding);
      persist();
    },
    delete(capability, scope, scopeId) {
      memory.delete(capability, scope, scopeId);
      persist();
    }
  };
}

function contextScopeId(
  scope: ActivationScope,
  context: ProviderResolutionContextV010
): string | undefined {
  switch (scope) {
    case "SYSTEM": return undefined;
    case "INSTALLATION": return context.installationId;
    case "ENTERPRISE": return context.enterpriseId;
    case "COMPANY": return context.companyId;
    case "WORKSPACE": return context.workspaceId;
    case "USER": return context.userId;
  }
}

export function resolveProviderRuntimeV010<T>(
  registry: ProviderRuntimeRegistry,
  descriptors: readonly ProviderDescriptorLike[],
  bindings: ProviderBindingStoreV010,
  capability: string,
  context: ProviderResolutionContextV010 = {}
): ProviderResolutionResultV010<T> | undefined {
  const normalizedCapability = capability.trim();
  if (!normalizedCapability) throw new Error("PROVIDER_CAPABILITY_REQUIRED");

  const candidateIds = [...new Set(
    descriptors
      .filter(descriptor => descriptor.capability === normalizedCapability)
      .map(descriptor => descriptor.providerId)
      .filter(providerId => registry.has(providerId))
  )].sort();

  if (candidateIds.length === 0) return undefined;

  const matchingBindings = bindings.list(normalizedCapability)
    .filter(binding => {
      if (binding.scope === "SYSTEM") return true;
      const value = contextScopeId(binding.scope, context);
      return value !== undefined && value === binding.scopeId;
    })
    .sort((a, b) =>
      scopeSpecificity[b.scope] - scopeSpecificity[a.scope]
      || (b.priority ?? 0) - (a.priority ?? 0)
      || a.providerId.localeCompare(b.providerId)
    );

  if (matchingBindings.length > 0) {
    const binding = matchingBindings[0];
    if (!candidateIds.includes(binding.providerId)) {
      throw new Error(
        `PROVIDER_BINDING_UNAVAILABLE: ${normalizedCapability}: ${binding.providerId}: ${binding.scope}${binding.scopeId ? `:${binding.scopeId}` : ""}`
      );
    }
    const runtime = registry.get<T>(binding.providerId);
    if (runtime === undefined) {
      throw new Error(`PROVIDER_RUNTIME_UNAVAILABLE: ${binding.providerId}`);
    }
    return {
      contractVersion: "0.1.0",
      capability: normalizedCapability,
      providerId: binding.providerId,
      source: "EXPLICIT_BINDING",
      scope: binding.scope,
      ...(binding.scopeId ? { scopeId: binding.scopeId } : {}),
      candidates: candidateIds,
      runtime
    };
  }

  if (candidateIds.length > 1) {
    throw new Error(
      `PROVIDER_RESOLUTION_AMBIGUOUS: ${normalizedCapability}: ${candidateIds.join(",")}`
    );
  }

  const providerId = candidateIds[0];
  const runtime = registry.get<T>(providerId);
  if (runtime === undefined) return undefined;

  return {
    contractVersion: "0.1.0",
    capability: normalizedCapability,
    providerId,
    source: "SINGLE_CANDIDATE",
    candidates: candidateIds,
    runtime
  };
}
