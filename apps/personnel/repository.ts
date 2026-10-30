import type {
  EnterpriseResourceJsonV010, EnterpriseResourceRepositoryV010
} from "../../contracts/enterprise-resource.js";
import type {
  BusinessPersonV010, PersonnelAssignmentV010, PersonnelDirectorySnapshotV010,
  PersonnelResolveBatchRequestV010, PersonnelResolveResultV010
} from "../../contracts/reference-data/personnel.js";
import { PERSONNEL_PACKAGE_ID_V010 } from "../../contracts/reference-data/personnel.js";
import type { OrganizationRepositoryV010 } from "../organization/repository.js";

const NAMESPACE = "evo.personnel";
const TYPE = "personnel.directory";
const SCHEMA = "evo.personnel.directory/0.1.0";
const norm = (value: string) => value.normalize("NFKC").trim().toLocaleLowerCase();

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}
function date(value: string | undefined, code: string): string | undefined {
  if (value === undefined) return undefined;
  const canonical = required(value, code);
  if (!Number.isFinite(Date.parse(canonical))) throw new Error(code);
  return canonical;
}
function normalizeAssignment(raw: PersonnelAssignmentV010): PersonnelAssignmentV010 {
  const organizationId = required(raw?.organizationId, "PERSONNEL_ORGANIZATION_ID_REQUIRED");
  const unitId = required(raw?.unitId, "PERSONNEL_UNIT_ID_REQUIRED");
  const organizationVersion = raw.organizationVersion;
  if (!Number.isSafeInteger(organizationVersion) || organizationVersion < 1) {
    throw new Error("PERSONNEL_ORGANIZATION_VERSION_INVALID");
  }
  const from = date(raw.effectiveFrom, "PERSONNEL_EFFECTIVE_FROM_INVALID");
  const to = date(raw.effectiveTo, "PERSONNEL_EFFECTIVE_TO_INVALID");
  if (from && to && Date.parse(from) > Date.parse(to)) {
    throw new Error("PERSONNEL_EFFECTIVE_RANGE_INVALID");
  }
  return { organizationId, unitId, organizationVersion,
    ...(from ? { effectiveFrom: from } : {}),
    ...(to ? { effectiveTo: to } : {}) };
}
function validatePersons(persons: BusinessPersonV010[]): BusinessPersonV010[] {
  if (!Array.isArray(persons) || persons.length === 0) {
    throw new Error("PERSONNEL_PERSONS_REQUIRED");
  }
  const ids = new Set<string>(), codes = new Set<string>();
  return persons.map(raw => {
    const personId = required(raw?.personId, "PERSONNEL_PERSON_ID_REQUIRED");
    const code = required(raw?.code, "PERSONNEL_CODE_REQUIRED");
    if (personId !== raw.personId || code !== raw.code) {
      throw new Error("PERSONNEL_IDENTIFIER_NONCANONICAL");
    }
    if (ids.has(personId)) throw new Error("PERSONNEL_DUPLICATE_PERSON_ID");
    if (codes.has(norm(code))) throw new Error("PERSONNEL_DUPLICATE_CODE");
    ids.add(personId); codes.add(norm(code));
    if (!raw.displayName || !required(raw.displayName.default, "PERSONNEL_NAME_REQUIRED")) {
      throw new Error("PERSONNEL_NAME_REQUIRED");
    }
    if (raw.state !== "ACTIVE" && raw.state !== "INACTIVE") {
      throw new Error("PERSONNEL_STATE_INVALID");
    }
    if (!Array.isArray(raw.assignments)) throw new Error("PERSONNEL_ASSIGNMENTS_INVALID");
    const assignments = raw.assignments.map(normalizeAssignment);
    const keys = new Set<string>();
    for (const item of assignments) {
      const key = item.organizationId + "::" + item.unitId;
      if (keys.has(key)) throw new Error("PERSONNEL_ASSIGNMENT_DUPLICATE");
      keys.add(key);
    }
    const aliases = raw.aliases?.map(a => required(a, "PERSONNEL_ALIAS_INVALID")) ?? [];
    const principal = raw.linkedPrincipalSubjectId === undefined
      ? undefined : required(raw.linkedPrincipalSubjectId, "PERSONNEL_PRINCIPAL_INVALID");
    return { personId, code, state: raw.state,
      displayName: { default: raw.displayName.default.trim(),
        ...(raw.displayName.translations
          ? { translations: { ...raw.displayName.translations } } : {}) },
      ...(aliases.length ? { aliases: [...new Set(aliases)] } : {}),
      assignments,
      ...(principal ? { linkedPrincipalSubjectId: principal } : {}) };
  });
}
function readPayload(payload: EnterpriseResourceJsonV010 | undefined): PersonnelDirectorySnapshotV010 {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("PERSONNEL_RESOURCE_PAYLOAD_INVALID");
  }
  const x = payload as unknown as PersonnelDirectorySnapshotV010;
  if (x.contractVersion !== "0.1.0" || !x.contextId || !x.personnelDirectoryId
    || !Number.isSafeInteger(x.version) || x.version < 1
    || (x.state !== "DRAFT" && x.state !== "PUBLISHED")) {
    throw new Error("PERSONNEL_SNAPSHOT_INVALID");
  }
  return { ...x, persons: validatePersons(x.persons) };
}
function payload(x: PersonnelDirectorySnapshotV010): EnterpriseResourceJsonV010 {
  return JSON.parse(JSON.stringify(x)) as EnterpriseResourceJsonV010;
}
function assertOrganizationalReferences(
  contextId: string, persons: BusinessPersonV010[], organizations: OrganizationRepositoryV010
): void {
  for (const person of persons) {
    for (const item of person.assignments) {
      const published = organizations.getEffective(contextId, item.organizationId);
      if (!published) throw new Error("PERSONNEL_ORGANIZATION_NOT_PUBLISHED");
      if (published.version !== item.organizationVersion) {
        throw new Error("PERSONNEL_ORGANIZATION_VERSION_STALE");
      }
      const unit = published.units.find(unit => unit.unitId === item.unitId);
      if (!unit) throw new Error("PERSONNEL_ORGANIZATION_UNIT_NOT_FOUND");
      if (person.state === "ACTIVE" && unit.status !== "ACTIVE") {
        throw new Error("PERSONNEL_ORGANIZATION_UNIT_INACTIVE");
      }
      // A person's assignment may not extend beyond its effective organization unit.
      if (person.state === "ACTIVE") {
        if (unit.effectiveFrom
          && (!item.effectiveFrom || Date.parse(item.effectiveFrom) < Date.parse(unit.effectiveFrom))) {
          throw new Error("PERSONNEL_ASSIGNMENT_BEFORE_UNIT_ACTIVE");
        }
        if (unit.effectiveTo
          && (!item.effectiveTo || Date.parse(item.effectiveTo) > Date.parse(unit.effectiveTo))) {
          throw new Error("PERSONNEL_ASSIGNMENT_AFTER_UNIT_INACTIVE");
        }
      }
    }
  }
}

export interface PersonnelRepositoryV010 {
  list(contextId: string): PersonnelDirectorySnapshotV010[];
  get(contextId: string, directoryId: string): PersonnelDirectorySnapshotV010 | undefined;
  getEffective(contextId: string, directoryId: string): PersonnelDirectorySnapshotV010 | undefined;
  history(contextId: string, directoryId: string): PersonnelDirectorySnapshotV010[];
  saveDraft(input: {
    contextId: string; personnelDirectoryId: string; expectedVersion: number;
    persons: BusinessPersonV010[]; actorSubjectId: string; recordedAt: string;
  }): PersonnelDirectorySnapshotV010;
  publish(input: {
    contextId: string; personnelDirectoryId: string; expectedVersion: number;
    actorSubjectId: string; actorType: "HUMAN" | "AI"; recordedAt: string;
  }): PersonnelDirectorySnapshotV010;
  resolveBatch(input: PersonnelResolveBatchRequestV010): PersonnelResolveResultV010[];
}

export function createPersonnelRepositoryV010(
  resources: EnterpriseResourceRepositoryV010, organizations: OrganizationRepositoryV010
): PersonnelRepositoryV010 {
  const address = (contextId: string, id: string, collectionId: string, suffix = "") => ({
    contextId: required(contextId, "PERSONNEL_CONTEXT_REQUIRED"),
    namespace: NAMESPACE, collectionId, resourceType: TYPE,
    resourceId: required(id, "PERSONNEL_DIRECTORY_ID_REQUIRED") + suffix
  });
  const atomic = <T>(fn: () => T): T => {
    if (!resources.transaction) throw new Error("PERSONNEL_ATOMIC_RESOURCE_REQUIRED");
    return resources.transaction(fn);
  };
  const save = (x: PersonnelDirectorySnapshotV010, by: string, recordedAt: string) => {
    for (const destination of [
      address(x.contextId, x.personnelDirectoryId, "current"),
      address(x.contextId, x.personnelDirectoryId, "history", "::" + x.version)
    ]) {
      resources.put({ ...destination, schemaRef: SCHEMA,
        ownerPackageId: PERSONNEL_PACKAGE_ID_V010, storageKind: "DOCUMENT",
        payload: payload(x), actorSubjectId: by, recordedAt });
    }
    return x;
  };
  return {
    list(contextId) {
      return resources.list({ contextId: required(contextId, "PERSONNEL_CONTEXT_REQUIRED"),
        namespace: NAMESPACE, collectionId: "current",
        resourceType: TYPE, lifecycleState: "ACTIVE" })
        .map(item => readPayload(item.payload))
        .sort((a, b) => a.personnelDirectoryId.localeCompare(b.personnelDirectoryId));
    },
    get(contextId, directoryId) {
      const x = resources.get(address(contextId, directoryId, "current"));
      return x?.lifecycleState === "ACTIVE" ? readPayload(x.payload) : undefined;
    },
    history(contextId, directoryId) {
      const prefix = required(directoryId, "PERSONNEL_DIRECTORY_ID_REQUIRED") + "::";
      return resources.list({ contextId: required(contextId, "PERSONNEL_CONTEXT_REQUIRED"),
        namespace: NAMESPACE, collectionId: "history", resourceType: TYPE, lifecycleState: "ACTIVE" })
        .filter(item => item.resourceId.startsWith(prefix))
        .map(item => readPayload(item.payload)).sort((a, b) => a.version - b.version);
    },
    getEffective(contextId, directoryId) {
      return this.history(contextId, directoryId)
        .filter(item => item.state === "PUBLISHED").at(-1);
    },
    saveDraft(input) {
      return atomic(() => {
        const contextId = required(input.contextId, "PERSONNEL_CONTEXT_REQUIRED");
        const directoryId = required(input.personnelDirectoryId, "PERSONNEL_DIRECTORY_ID_REQUIRED");
        const persons = validatePersons(input.persons);
        const previous = this.get(contextId, directoryId);
        if ((previous?.version ?? 0) !== input.expectedVersion) {
          if (previous?.state === "DRAFT" && previous.version === input.expectedVersion + 1
              && JSON.stringify(previous.persons) === JSON.stringify(persons)) return previous;
          throw new Error("PERSONNEL_VERSION_CONFLICT");
        }
        if (previous?.state === "DRAFT"
            && JSON.stringify(previous.persons) === JSON.stringify(persons)) return previous;
        const next: PersonnelDirectorySnapshotV010 = {
          contractVersion: "0.1.0", contextId, personnelDirectoryId: directoryId,
          version: (previous?.version ?? 0) + 1, state: "DRAFT", persons
        };
        return save(next, required(input.actorSubjectId, "PERSONNEL_ACTOR_REQUIRED"), input.recordedAt);
      });
    },
    publish(input) {
      return atomic(() => {
        const current = this.get(input.contextId, input.personnelDirectoryId);
        if (!current) throw new Error("PERSONNEL_NOT_FOUND");
        if (current.version !== input.expectedVersion) throw new Error("PERSONNEL_VERSION_CONFLICT");
        if (input.actorType !== "HUMAN") throw new Error("PERSONNEL_PUBLISH_HUMAN_REQUIRED");
        if (current.state === "PUBLISHED") return current;
        // Validate actual published organization identity at the mutation boundary.
        assertOrganizationalReferences(current.contextId, current.persons, organizations);
        const lookup = new Map<string, string>();
        for (const person of current.persons) {
          for (const key of [person.code, ...(person.aliases ?? [])]) {
            const normalized = norm(key);
            const owner = lookup.get(normalized);
            if (owner && owner !== person.personId) {
              throw new Error("PERSONNEL_SOURCE_MAPPING_AMBIGUOUS");
            }
            lookup.set(normalized, person.personId);
          }
        }
        return save({ ...current, state: "PUBLISHED" },
          required(input.actorSubjectId, "PERSONNEL_ACTOR_REQUIRED"), input.recordedAt);
      });
    },
    resolveBatch(input) {
      const effective = this.getEffective(input.contextId, input.personnelDirectoryId);
      if (!effective) throw new Error("PERSONNEL_NOT_PUBLISHED");
      if (!Array.isArray(input.sourceValues)
          || !input.sourceValues.every(value => typeof value === "string")) {
        throw new Error("PERSONNEL_SOURCE_VALUES_INVALID");
      }
      if (input.expectedVersion !== undefined && effective.version !== input.expectedVersion) {
        return input.sourceValues.map(() => ({
          status: "VERSION_MISMATCH" as const, personnelVersion: effective.version
        }));
      }
      // Published org version is separately governed; stale changes cannot be silently ignored.
      assertOrganizationalReferences(effective.contextId, effective.persons, organizations);
      const bySource = new Map<string, BusinessPersonV010[]>();
      for (const person of effective.persons) {
        for (const key of [person.code, ...(person.aliases ?? [])]) {
          const normalized = norm(key);
          const matches = bySource.get(normalized) ?? [];
          if (!matches.includes(person)) matches.push(person);
          bySource.set(normalized, matches);
        }
      }
      return input.sourceValues.map(value => {
        const matches = bySource.get(norm(value)) ?? [];
        if (!matches.length) return { status: "UNKNOWN", personnelVersion: effective.version };
        if (matches.length > 1) return { status: "AMBIGUOUS",
          candidatePersonIds: matches.map(person => person.personId).sort(),
          personnelVersion: effective.version };
        const person = matches[0];
        return person.state === "ACTIVE"
          ? { status: "RESOLVED", personId: person.personId, personnelVersion: effective.version }
          : { status: "INACTIVE", personnelVersion: effective.version };
      });
    }
  };
}
