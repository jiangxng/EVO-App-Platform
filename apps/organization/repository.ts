import type {
  EnterpriseResourceJsonV010,
  EnterpriseResourceRepositoryV010
} from "../../contracts/enterprise-resource.js";
import type {
  OrganizationUnitV010, OrganizationSnapshotV010, OrganizationResolveBatchV010,
  OrganizationResolutionV010
} from "../../contracts/reference-data/organization.js";
import { ORGANIZATION_PACKAGE_ID_V010 } from "../../contracts/reference-data/organization.js";

const NAMESPACE = "evo.organization";
const TYPE = "organization.definition";
const SCHEMA = "evo.organization.definition/0.1.0";
const normalize = (s: string) => s.normalize("NFKC").trim().toLowerCase();

function required(v: string, code: string): string {
  if (typeof v !== "string" || !v.trim()) throw new Error(code);
  return v.trim();
}
function date(value: string | undefined, error: string): string | undefined {
  if (value === undefined) return undefined;
  const normalized = required(value, error);
  if (!Number.isFinite(Date.parse(normalized))) throw new Error(error);
  return normalized;
}
function validateUnits(units: OrganizationUnitV010[]): OrganizationUnitV010[] {
  if (!Array.isArray(units) || units.length === 0) throw new Error("ORGANIZATION_UNITS_REQUIRED");
  const ids = new Set<string>();
  const codes = new Set<string>();
  return units.map(unit => {
    const unitId = required(unit?.unitId, "ORGANIZATION_UNIT_ID_REQUIRED");
    const code = required(unit?.code, "ORGANIZATION_UNIT_CODE_REQUIRED");
    if (unitId !== unit.unitId || code !== unit.code) throw new Error("ORGANIZATION_IDENTIFIER_NONCANONICAL");
    if (ids.has(unitId)) throw new Error("ORGANIZATION_DUPLICATE_UNIT_ID");
    if (codes.has(normalize(code))) throw new Error("ORGANIZATION_DUPLICATE_CODE");
    ids.add(unitId);
    codes.add(normalize(code));
    if (!unit.displayName || !required(unit.displayName.default, "ORGANIZATION_LABEL_REQUIRED")) {
      throw new Error("ORGANIZATION_LABEL_REQUIRED");
    }
    if (!["DEPARTMENT","DIVISION","TEAM","OTHER"].includes(unit.kind)) {
      throw new Error("ORGANIZATION_UNIT_KIND_INVALID");
    }
    if (unit.status !== "ACTIVE" && unit.status !== "INACTIVE") {
      throw new Error("ORGANIZATION_UNIT_STATUS_INVALID");
    }
    const from = date(unit.effectiveFrom, "ORGANIZATION_EFFECTIVE_FROM_INVALID");
    const to = date(unit.effectiveTo, "ORGANIZATION_EFFECTIVE_TO_INVALID");
    if (from && to && Date.parse(to) < Date.parse(from)) {
      throw new Error("ORGANIZATION_EFFECTIVE_RANGE_INVALID");
    }
    return {
      unitId, code, kind: unit.kind, status: unit.status,
      displayName: { default: unit.displayName.default.trim(),
        ...(unit.displayName.translations ? { translations: { ...unit.displayName.translations } } : {}) },
      ...(unit.parentUnitId ? { parentUnitId: required(unit.parentUnitId, "ORGANIZATION_PARENT_INVALID") } : {}),
      ...(unit.aliases?.length ? { aliases: [...new Set(unit.aliases.map(a =>
        required(a, "ORGANIZATION_ALIAS_INVALID")))] } : {}),
      ...(from ? { effectiveFrom: from } : {}),
      ...(to ? { effectiveTo: to } : {})
    };
  });
}
function assertGraph(units: OrganizationUnitV010[]): void {
  const byId = new Map(units.map(unit => [unit.unitId, unit]));
  const state = new Map<string, 1 | 2>();
  const visit = (id: string) => {
    if (state.get(id) === 1) throw new Error("ORGANIZATION_HIERARCHY_CYCLE");
    if (state.get(id) === 2) return;
    const unit = byId.get(id);
    if (!unit) throw new Error("ORGANIZATION_PARENT_NOT_FOUND");
    state.set(id, 1);
    if (unit.parentUnitId) {
      const parent = byId.get(unit.parentUnitId);
      if (!parent) throw new Error("ORGANIZATION_PARENT_NOT_FOUND");
      if (unit.status === "ACTIVE" && parent.status !== "ACTIVE") {
        throw new Error("ORGANIZATION_PARENT_INACTIVE");
      }
      visit(parent.unitId);
    }
    state.set(id, 2);
  };
  for (const unit of units) visit(unit.unitId);
  const identities = new Map<string, Set<string>>();
  for (const unit of units) {
    for (const key of [unit.code, ...(unit.aliases ?? [])]) {
      const normalized = normalize(key);
      const ids = identities.get(normalized) ?? new Set<string>();
      ids.add(unit.unitId);
      identities.set(normalized, ids);
    }
  }
  if ([...identities.values()].some(ids => ids.size > 1)) {
    throw new Error("ORGANIZATION_SOURCE_MAPPING_AMBIGUOUS");
  }
}
function payload(v: OrganizationSnapshotV010): EnterpriseResourceJsonV010 {
  return JSON.parse(JSON.stringify(v)) as EnterpriseResourceJsonV010;
}
function fromPayload(p: EnterpriseResourceJsonV010 | undefined): OrganizationSnapshotV010 {
  if (!p || typeof p !== "object" || Array.isArray(p)) {
    throw new Error("ORGANIZATION_RESOURCE_PAYLOAD_INVALID");
  }
  const x = p as unknown as OrganizationSnapshotV010;
  if (x.contractVersion !== "0.1.0" || !x.contextId || !x.organizationId ||
      !Number.isSafeInteger(x.version) || x.version < 1 ||
      (x.state !== "DRAFT" && x.state !== "PUBLISHED")) {
    throw new Error("ORGANIZATION_SNAPSHOT_INVALID");
  }
  return { ...x, units: validateUnits(x.units) };
}

export interface OrganizationRepositoryV010 {
  list(contextId: string): OrganizationSnapshotV010[];
  get(contextId: string, organizationId: string): OrganizationSnapshotV010 | undefined;
  getEffective(contextId: string, organizationId: string): OrganizationSnapshotV010 | undefined;
  history(contextId: string, organizationId: string): OrganizationSnapshotV010[];
  saveDraft(input: {
    contextId: string; organizationId: string; expectedVersion: number;
    units: OrganizationUnitV010[]; actorSubjectId: string; recordedAt: string;
  }): OrganizationSnapshotV010;
  publish(input: {
    contextId: string; organizationId: string; expectedVersion: number;
    actorSubjectId: string; actorType: "HUMAN" | "AI"; recordedAt: string;
  }): OrganizationSnapshotV010;
  resolveBatch(input: OrganizationResolveBatchV010): OrganizationResolutionV010[];
}
export function createOrganizationRepositoryV010(resources: EnterpriseResourceRepositoryV010):
  OrganizationRepositoryV010 {
  const address = (contextId: string, organizationId: string, collectionId: string, suffix = "") => ({
    contextId: required(contextId, "ORGANIZATION_CONTEXT_REQUIRED"),
    namespace: NAMESPACE, collectionId, resourceType: TYPE,
    resourceId: required(organizationId, "ORGANIZATION_ID_REQUIRED") + suffix
  });
  const safe = <T>(work: () => T) => {
    if (!resources.transaction) throw new Error("ORGANIZATION_ATOMIC_RESOURCE_REQUIRED");
    return resources.transaction(work);
  };
  const store = (x: OrganizationSnapshotV010, actorSubjectId: string, recordedAt: string) => {
    for (const dest of [
      address(x.contextId, x.organizationId, "current"),
      address(x.contextId, x.organizationId, "history", "::" + x.version)
    ]) {
      resources.put({ ...dest, schemaRef: SCHEMA, ownerPackageId: ORGANIZATION_PACKAGE_ID_V010,
        payload: payload(x), storageKind: "DOCUMENT", actorSubjectId, recordedAt });
    }
    return x;
  };
  return {
    list(contextId) {
      return resources.list({
        contextId: required(contextId, "ORGANIZATION_CONTEXT_REQUIRED"),
        namespace: NAMESPACE, collectionId: "current", resourceType: TYPE, lifecycleState: "ACTIVE"
      }).map(x => fromPayload(x.payload)).sort((a,b)=>a.organizationId.localeCompare(b.organizationId));
    },
    get(contextId, organizationId) {
      const x = resources.get(address(contextId, organizationId, "current"));
      return x && x.lifecycleState === "ACTIVE" ? fromPayload(x.payload) : undefined;
    },
    history(contextId, organizationId) {
      const prefix = required(organizationId,"ORGANIZATION_ID_REQUIRED") + "::";
      return resources.list({
        contextId: required(contextId, "ORGANIZATION_CONTEXT_REQUIRED"),
        namespace: NAMESPACE, collectionId: "history", resourceType: TYPE, lifecycleState: "ACTIVE"
      }).filter(x=>x.resourceId.startsWith(prefix))
        .map(x=>fromPayload(x.payload)).sort((a,b)=>a.version-b.version);
    },
    getEffective(contextId, organizationId) {
      return this.history(contextId, organizationId)
        .filter(x=>x.state==="PUBLISHED").at(-1);
    },
    saveDraft(input) {
      return safe(()=>{
        const contextId=required(input.contextId,"ORGANIZATION_CONTEXT_REQUIRED");
        const organizationId=required(input.organizationId,"ORGANIZATION_ID_REQUIRED");
        const units=validateUnits(input.units);
        const previous=this.get(contextId,organizationId);
        if ((previous?.version??0)!==input.expectedVersion) {
          if (previous?.state==="DRAFT" && previous.version===input.expectedVersion+1
            && JSON.stringify(previous.units)===JSON.stringify(units)) return previous;
          throw new Error("ORGANIZATION_VERSION_CONFLICT");
        }
        if (previous?.state==="DRAFT" && JSON.stringify(previous.units)===JSON.stringify(units)) return previous;
        const next:OrganizationSnapshotV010={
          contractVersion:"0.1.0", contextId,organizationId,
          version:(previous?.version??0)+1,state:"DRAFT",units
        };
        return store(next,required(input.actorSubjectId,"ORGANIZATION_ACTOR_REQUIRED"),input.recordedAt);
      });
    },
    publish(input) {
      return safe(()=>{
        const x=this.get(input.contextId,input.organizationId);
        if (!x) throw new Error("ORGANIZATION_NOT_FOUND");
        if (x.version!==input.expectedVersion) throw new Error("ORGANIZATION_VERSION_CONFLICT");
        if (x.state==="PUBLISHED") return x; // acknowledged retry
        if (input.actorType!=="HUMAN") throw new Error("ORGANIZATION_PUBLISH_HUMAN_REQUIRED");
        assertGraph(x.units);
        return store({...x,state:"PUBLISHED"},
          required(input.actorSubjectId,"ORGANIZATION_ACTOR_REQUIRED"),input.recordedAt);
      });
    },
    resolveBatch(input) {
      const snapshot=this.getEffective(input.contextId,input.organizationId);
      if (!snapshot) throw new Error("ORGANIZATION_NOT_PUBLISHED");
      if (!Array.isArray(input.sourceValues) ||
          !input.sourceValues.every(x=>typeof x==="string")) {
        throw new Error("ORGANIZATION_SOURCE_VALUES_INVALID");
      }
      if (input.effectiveAt && !Number.isFinite(Date.parse(input.effectiveAt))) {
        throw new Error("ORGANIZATION_EFFECTIVE_AT_INVALID");
      }
      const fail = (status:"VERSION_MISMATCH"|"NOT_PUBLISHED"):OrganizationResolutionV010[] =>
        input.sourceValues.map(()=>({status,organizationVersion:snapshot.version}));
      if (input.expectedVersion!==undefined && input.expectedVersion!==snapshot.version) {
        return fail("VERSION_MISMATCH");
      }
      const byValue=new Map<string,OrganizationUnitV010[]>();
      for (const unit of snapshot.units) {
        for (const key of [unit.code,...(unit.aliases??[])]) {
          const normalized=normalize(key);
          const matches=byValue.get(normalized)??[];
          if (!matches.includes(unit))matches.push(unit);
          byValue.set(normalized,matches);
        }
      }
      return input.sourceValues.map(raw=>{
        const matches=byValue.get(normalize(raw))??[];
        if (!matches.length) return {status:"UNKNOWN",organizationVersion:snapshot.version};
        if (matches.length>1) return {status:"AMBIGUOUS",organizationVersion:snapshot.version,
          candidateUnitIds:matches.map(x=>x.unitId).sort()};
        const unit=matches[0];
        const now=input.effectiveAt?Date.parse(input.effectiveAt):undefined;
        if (unit.status!=="ACTIVE" ||
          (now!==undefined && unit.effectiveFrom && now<Date.parse(unit.effectiveFrom)) ||
          (now!==undefined && unit.effectiveTo && now>Date.parse(unit.effectiveTo))) {
          return {status:"INACTIVE",organizationVersion:snapshot.version};
        }
        return {status:"RESOLVED",organizationVersion:snapshot.version,unitId:unit.unitId};
      });
    }
  };
}
