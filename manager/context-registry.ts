import type {
  ActiveContextRefV010,
  EnterpriseContextV010,
  PersonalContextV010,
  ResolvedContextSetV010
} from "../contracts/platform-services.js";

export interface HostContextRegistryOptionsV010 {
  personalContext: PersonalContextV010;
  enterpriseContexts?: readonly EnterpriseContextV010[];
  enterpriseContextSource?: () => readonly EnterpriseContextV010[];
}

function normalized(value: string | undefined, field: string): string {
  const result = value?.trim();
  if (!result) throw new Error(`CONTEXT_FIELD_REQUIRED: ${field}`);
  return result;
}

function enterpriseRef(context: EnterpriseContextV010): ActiveContextRefV010 {
  return {
    contractVersion: "0.1.0",
    kind: "ENTERPRISE",
    contextId: normalized(context.contextId, "enterpriseContext.contextId"),
    enterpriseId: normalized(context.enterpriseId, "enterpriseContext.enterpriseId")
  };
}

function sameRef(a: ActiveContextRefV010, b: ActiveContextRefV010): boolean {
  if (a.kind !== b.kind || a.contextId !== b.contextId) return false;
  return a.kind === "PERSONAL"
    || (b.kind === "ENTERPRISE" && a.enterpriseId === b.enterpriseId);
}

export interface HostContextRegistryV010 {
  personal(): PersonalContextV010;
  list(): ActiveContextRefV010[];
  resolve(selection?: ActiveContextRefV010): ResolvedContextSetV010;
}

/**
 * Minimal Host-owned Context source for the Person-first MVP.
 *
 * Browser/request data may select one of these Contexts, but cannot create a
 * new Enterprise Context by supplying arbitrary ids.
 */
export function createHostContextRegistryV010(
  options: HostContextRegistryOptionsV010
): HostContextRegistryV010 {
  const personalContext = structuredClone(options.personalContext);
  if (personalContext.kind !== "PERSONAL") {
    throw new Error("PERSONAL_CONTEXT_KIND_INVALID");
  }
  personalContext.contextId = normalized(personalContext.contextId, "personalContext.contextId");

  const personalRef: ActiveContextRefV010 = {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: personalContext.contextId
  };

  const enterpriseMap = (): Map<string, EnterpriseContextV010> => {
    const enterprises = new Map<string, EnterpriseContextV010>();
    const all = [
      ...(options.enterpriseContexts ?? []),
      ...(options.enterpriseContextSource?.() ?? [])
    ];
    for (const source of all) {
      const context = structuredClone(source);
      const ref = enterpriseRef(context);
      context.kind = "ENTERPRISE";
      context.contextId = ref.contextId;

      if (enterprises.has(ref.contextId)) {
        throw new Error(`CONTEXT_DUPLICATE: ${ref.contextId}`);
      }
      enterprises.set(ref.contextId, context);
    }
    return enterprises;
  };

  return {
    personal() {
      return structuredClone(personalContext);
    },

    list() {
      return [
        structuredClone(personalRef),
        ...[...enterpriseMap().values()]
          .map(enterpriseRef)
          .sort((a, b) => a.contextId.localeCompare(b.contextId))
      ];
    },

    resolve(selection) {
      const requested = selection ?? personalRef;

      if (requested.kind === "PERSONAL") {
        if (!sameRef(requested, personalRef)) {
          throw new Error(`CONTEXT_NOT_AVAILABLE: ${requested.contextId}`);
        }
        return {
          contractVersion: "0.1.0",
          personalContext: structuredClone(personalContext),
          activeContext: structuredClone(personalRef)
        };
      }

      const enterprise = enterpriseMap().get(requested.contextId);
      if (!enterprise) {
        throw new Error(`CONTEXT_NOT_AVAILABLE: ${requested.contextId}`);
      }

      const canonicalRef = enterpriseRef(enterprise);
      if (!sameRef(requested, canonicalRef)) {
        throw new Error(`CONTEXT_NOT_AVAILABLE: ${requested.contextId}`);
      }

      return {
        contractVersion: "0.1.0",
        personalContext: structuredClone(personalContext),
        activeContext: canonicalRef,
        enterpriseContext: structuredClone(enterprise)
      };
    }
  };
}
