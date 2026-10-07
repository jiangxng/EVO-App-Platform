import type {
  EnterpriseResourceJsonV010,
  EnterpriseResourceRepositoryV010
} from "../../contracts/enterprise-resource.js";

export const COUNTERPARTY_NAMESPACE_V010 = "evo.counterparty" as const;
export const COUNTERPARTY_COLLECTION_V010 = "counterparties" as const;
export const COUNTERPARTY_RESOURCE_TYPE_V010 = "counterparty.subject" as const;
export const COUNTERPARTY_SCHEMA_V010 = "evo.counterparty/0.1.0" as const;

export type CounterpartySubjectTypeV010 = "ORGANIZATION" | "PERSON";
export type CounterpartyStatusV010 = "ACTIVE" | "INACTIVE";

export interface CounterpartySubjectV010 {
  contractVersion: "0.1.0";
  counterpartyId: string;
  code: string;
  displayName: string;
  subjectType: CounterpartySubjectTypeV010;
  status: CounterpartyStatusV010;
  legalName?: string;
  taxIdentifier?: string;
  countryOrRegion?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface CounterpartyRepositoryV010 {
  list(contextId: string): CounterpartySubjectV010[];
  get(contextId: string, counterpartyId: string): CounterpartySubjectV010 | undefined;
  save(input: {
    contextId: string;
    subject: CounterpartySubjectV010;
    actorSubjectId: string;
    recordedAt: string;
  }): CounterpartySubjectV010;
  saveMany(input: {
    contextId: string;
    subjects: CounterpartySubjectV010[];
    actorSubjectId: string;
    recordedAt: string;
  }): CounterpartySubjectV010[];
  archive(input: {
    contextId: string;
    counterpartyId: string;
    actorSubjectId: string;
    recordedAt: string;
  }): CounterpartySubjectV010;
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function optional(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function assertCounterpartySubjectV010(
  value: CounterpartySubjectV010
): CounterpartySubjectV010 {
  if (value?.contractVersion !== "0.1.0") {
    throw new Error("COUNTERPARTY_CONTRACT_VERSION_INVALID");
  }
  if (!["ORGANIZATION", "PERSON"].includes(value.subjectType)) {
    throw new Error("COUNTERPARTY_SUBJECT_TYPE_INVALID");
  }
  if (!["ACTIVE", "INACTIVE"].includes(value.status)) {
    throw new Error("COUNTERPARTY_STATUS_INVALID");
  }
  const email = optional(value.email);
  if (email && !/^\S+@\S+\.\S+$/u.test(email)) {
    throw new Error("COUNTERPARTY_EMAIL_INVALID");
  }
  return {
    contractVersion: "0.1.0",
    counterpartyId: required(
      value.counterpartyId,
      "COUNTERPARTY_ID_REQUIRED"
    ),
    code: required(value.code, "COUNTERPARTY_CODE_REQUIRED"),
    displayName: required(
      value.displayName,
      "COUNTERPARTY_DISPLAY_NAME_REQUIRED"
    ),
    subjectType: value.subjectType,
    status: value.status,
    ...(optional(value.legalName) ? { legalName: optional(value.legalName) } : {}),
    ...(optional(value.taxIdentifier)
      ? { taxIdentifier: optional(value.taxIdentifier) }
      : {}),
    ...(optional(value.countryOrRegion)
      ? { countryOrRegion: optional(value.countryOrRegion) }
      : {}),
    ...(optional(value.phone) ? { phone: optional(value.phone) } : {}),
    ...(email ? { email } : {}),
    ...(optional(value.notes) ? { notes: optional(value.notes) } : {})
  };
}

function payloadOf(subject: CounterpartySubjectV010): EnterpriseResourceJsonV010 {
  return JSON.parse(JSON.stringify(subject)) as EnterpriseResourceJsonV010;
}

function subjectFromPayload(
  payload: EnterpriseResourceJsonV010 | undefined
): CounterpartySubjectV010 {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("COUNTERPARTY_RESOURCE_PAYLOAD_INVALID");
  }
  return assertCounterpartySubjectV010(
    payload as unknown as CounterpartySubjectV010
  );
}

export function createCounterpartyRepositoryV010(
  resources: EnterpriseResourceRepositoryV010
): CounterpartyRepositoryV010 {
  return {
    list(contextId) {
      return resources.list({
        contextId: required(contextId, "COUNTERPARTY_CONTEXT_REQUIRED"),
        namespace: COUNTERPARTY_NAMESPACE_V010,
        collectionId: COUNTERPARTY_COLLECTION_V010,
        resourceType: COUNTERPARTY_RESOURCE_TYPE_V010,
        lifecycleState: "ACTIVE"
      })
        .map(resource => subjectFromPayload(resource.payload))
        .sort((a, b) =>
          a.displayName.localeCompare(b.displayName)
          || a.code.localeCompare(b.code)
          || a.counterpartyId.localeCompare(b.counterpartyId)
        );
    },

    get(contextId, counterpartyId) {
      const resource = resources.get({
        contextId: required(contextId, "COUNTERPARTY_CONTEXT_REQUIRED"),
        namespace: COUNTERPARTY_NAMESPACE_V010,
        collectionId: COUNTERPARTY_COLLECTION_V010,
        resourceType: COUNTERPARTY_RESOURCE_TYPE_V010,
        resourceId: required(
          counterpartyId,
          "COUNTERPARTY_ID_REQUIRED"
        )
      });
      if (!resource || resource.lifecycleState !== "ACTIVE") return undefined;
      return subjectFromPayload(resource.payload);
    },

    save(input) {
      const subject = assertCounterpartySubjectV010(input.subject);
      const duplicate = resources.list({
        contextId: required(input.contextId, "COUNTERPARTY_CONTEXT_REQUIRED"),
        namespace: COUNTERPARTY_NAMESPACE_V010,
        collectionId: COUNTERPARTY_COLLECTION_V010,
        resourceType: COUNTERPARTY_RESOURCE_TYPE_V010,
        lifecycleState: "ACTIVE"
      }).map(resource => subjectFromPayload(resource.payload))
        .find(existing =>
          existing.counterpartyId !== subject.counterpartyId
          && existing.code.toLocaleLowerCase()
            === subject.code.toLocaleLowerCase()
        );
      if (duplicate) {
        throw new Error("COUNTERPARTY_CODE_DUPLICATE");
      }
      const saved = resources.put({
        contextId: input.contextId,
        namespace: COUNTERPARTY_NAMESPACE_V010,
        collectionId: COUNTERPARTY_COLLECTION_V010,
        resourceType: COUNTERPARTY_RESOURCE_TYPE_V010,
        resourceId: subject.counterpartyId,
        schemaRef: COUNTERPARTY_SCHEMA_V010,
        ownerPackageId: "evo-counterparty",
        storageKind: "DOCUMENT",
        payload: payloadOf(subject),
        metadata: {
          code: subject.code,
          displayName: subject.displayName,
          subjectType: subject.subjectType,
          status: subject.status
        },
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      });
      return subjectFromPayload(saved.payload);
    },

    saveMany(input) {
      const contextId = required(
        input.contextId,
        "COUNTERPARTY_CONTEXT_REQUIRED"
      );
      const subjects = input.subjects.map(assertCounterpartySubjectV010);
      const existingCodes = new Map(
        resources.list({
          contextId,
          namespace: COUNTERPARTY_NAMESPACE_V010,
          collectionId: COUNTERPARTY_COLLECTION_V010,
          resourceType: COUNTERPARTY_RESOURCE_TYPE_V010,
          lifecycleState: "ACTIVE"
        })
          .map(resource => subjectFromPayload(resource.payload))
          .map(subject => [
            subject.code.toLocaleLowerCase(),
            subject.counterpartyId
          ])
      );
      const batchCodes = new Set<string>();
      for (const subject of subjects) {
        const code = subject.code.toLocaleLowerCase();
        const existingId = existingCodes.get(code);
        if (existingId && existingId !== subject.counterpartyId) {
          throw new Error("COUNTERPARTY_CODE_DUPLICATE");
        }
        if (batchCodes.has(code)) {
          throw new Error("COUNTERPARTY_CODE_DUPLICATE");
        }
        batchCodes.add(code);
      }
      if (!resources.putMany) {
        return subjects.map(subject => this.save({
          contextId,
          subject,
          actorSubjectId: input.actorSubjectId,
          recordedAt: input.recordedAt
        }));
      }
      const saved = resources.putMany(subjects.map(subject => ({
        contextId,
        namespace: COUNTERPARTY_NAMESPACE_V010,
        collectionId: COUNTERPARTY_COLLECTION_V010,
        resourceType: COUNTERPARTY_RESOURCE_TYPE_V010,
        resourceId: subject.counterpartyId,
        schemaRef: COUNTERPARTY_SCHEMA_V010,
        ownerPackageId: "evo-counterparty",
        storageKind: "DOCUMENT" as const,
        payload: payloadOf(subject),
        metadata: {
          code: subject.code,
          displayName: subject.displayName,
          subjectType: subject.subjectType,
          status: subject.status
        },
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      })));
      return saved.map(resource => subjectFromPayload(resource.payload));
    },

    archive(input) {
      const current = this.get(input.contextId, input.counterpartyId);
      if (!current) throw new Error("COUNTERPARTY_NOT_FOUND");
      resources.archive({
        address: {
          contextId: input.contextId,
          namespace: COUNTERPARTY_NAMESPACE_V010,
          collectionId: COUNTERPARTY_COLLECTION_V010,
          resourceType: COUNTERPARTY_RESOURCE_TYPE_V010,
          resourceId: input.counterpartyId
        },
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      });
      return current;
    }
  };
}
