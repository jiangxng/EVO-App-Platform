import type {
  EnterpriseResourceJsonV010,
  EnterpriseResourceRepositoryV010
} from "../../contracts/enterprise-resource.js";
import type {
  CounterpartyRepositoryV010
} from "./repository.js";
import type {
  CounterpartyRelationshipRoleCodeV010,
  CounterpartyRoleRepositoryV010
} from "./roles.js";

export const COUNTERPARTY_CONTACT_COLLECTION_V010 = "contacts" as const;
export const COUNTERPARTY_CONTACT_RESOURCE_TYPE_V010 =
  "counterparty.contact" as const;
export const COUNTERPARTY_CONTACT_SCHEMA_V010 =
  "evo.counterparty.contact/0.1.0" as const;

export const COUNTERPARTY_ADDRESS_COLLECTION_V010 = "addresses" as const;
export const COUNTERPARTY_ADDRESS_RESOURCE_TYPE_V010 =
  "counterparty.address" as const;
export const COUNTERPARTY_ADDRESS_SCHEMA_V010 =
  "evo.counterparty.address/0.1.0" as const;

export const COUNTERPARTY_PROFILE_COLLECTION_V010 = "profiles" as const;
export const COUNTERPARTY_PROFILE_RESOURCE_TYPE_V010 =
  "counterparty.profile" as const;
export const COUNTERPARTY_PROFILE_SCHEMA_V010 =
  "evo.counterparty.profile/0.1.0" as const;

export type CounterpartyContactStatusV010 = "ACTIVE" | "INACTIVE";
export type CounterpartyAddressStatusV010 = "ACTIVE" | "INACTIVE";
export type CounterpartyAddressPurposeV010 =
  | "REGISTERED"
  | "BILLING"
  | "SHIPPING"
  | "OTHER";

export interface CounterpartyContactV010 {
  contractVersion: "0.1.0";
  contactId: string;
  counterpartyId: string;
  displayName: string;
  status: CounterpartyContactStatusV010;
  title?: string;
  department?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface CounterpartyAddressV010 {
  contractVersion: "0.1.0";
  addressId: string;
  counterpartyId: string;
  purpose: CounterpartyAddressPurposeV010;
  status: CounterpartyAddressStatusV010;
  line1: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryOrRegion?: string;
  recipientName?: string;
  phone?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface CounterpartyRelationshipProfileV010 {
  contractVersion: "0.1.0";
  profileId: string;
  counterpartyId: string;
  roleCode: CounterpartyRelationshipRoleCodeV010;
  status: "ACTIVE" | "INACTIVE";
}

export interface CounterpartyContactRepositoryV010 {
  list(contextId: string, counterpartyId: string): CounterpartyContactV010[];
  get(
    contextId: string,
    counterpartyId: string,
    contactId: string
  ): CounterpartyContactV010 | undefined;
  save(input: {
    contextId: string;
    contact: CounterpartyContactV010;
    actorSubjectId: string;
    recordedAt: string;
  }): CounterpartyContactV010;
  archive(input: {
    contextId: string;
    counterpartyId: string;
    contactId: string;
    actorSubjectId: string;
    recordedAt: string;
  }): CounterpartyContactV010;
}

export interface CounterpartyAddressRepositoryV010 {
  list(contextId: string, counterpartyId: string): CounterpartyAddressV010[];
  get(
    contextId: string,
    counterpartyId: string,
    addressId: string
  ): CounterpartyAddressV010 | undefined;
  save(input: {
    contextId: string;
    address: CounterpartyAddressV010;
    actorSubjectId: string;
    recordedAt: string;
  }): CounterpartyAddressV010;
  archive(input: {
    contextId: string;
    counterpartyId: string;
    addressId: string;
    actorSubjectId: string;
    recordedAt: string;
  }): CounterpartyAddressV010;
}

export interface CounterpartyProfileRepositoryV010 {
  get(
    contextId: string,
    counterpartyId: string,
    roleCode: CounterpartyRelationshipRoleCodeV010
  ): CounterpartyRelationshipProfileV010 | undefined;
  save(input: {
    contextId: string;
    profile: CounterpartyRelationshipProfileV010;
    actorSubjectId: string;
    recordedAt: string;
  }): CounterpartyRelationshipProfileV010;
  archive(input: {
    contextId: string;
    counterpartyId: string;
    roleCode: CounterpartyRelationshipRoleCodeV010;
    actorSubjectId: string;
    recordedAt: string;
  }): CounterpartyRelationshipProfileV010;
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function optional(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function payload<T>(value: T): EnterpriseResourceJsonV010 {
  return JSON.parse(JSON.stringify(value)) as EnterpriseResourceJsonV010;
}

function activeCounterparty(
  repository: CounterpartyRepositoryV010,
  contextId: string,
  counterpartyId: string
): void {
  if (!repository.get(contextId, counterpartyId)) {
    throw new Error("COUNTERPARTY_NOT_FOUND");
  }
}

function assertContact(value: CounterpartyContactV010): CounterpartyContactV010 {
  if (value?.contractVersion !== "0.1.0") {
    throw new Error("COUNTERPARTY_CONTACT_CONTRACT_VERSION_INVALID");
  }
  if (!["ACTIVE", "INACTIVE"].includes(value.status)) {
    throw new Error("COUNTERPARTY_CONTACT_STATUS_INVALID");
  }
  const email = optional(value.email);
  if (email && !/^\S+@\S+\.\S+$/u.test(email)) {
    throw new Error("COUNTERPARTY_CONTACT_EMAIL_INVALID");
  }
  return {
    contractVersion: "0.1.0",
    contactId: required(value.contactId, "COUNTERPARTY_CONTACT_ID_REQUIRED"),
    counterpartyId: required(
      value.counterpartyId,
      "COUNTERPARTY_ID_REQUIRED"
    ),
    displayName: required(
      value.displayName,
      "COUNTERPARTY_CONTACT_DISPLAY_NAME_REQUIRED"
    ),
    status: value.status,
    ...(optional(value.title) ? { title: optional(value.title) } : {}),
    ...(optional(value.department)
      ? { department: optional(value.department) }
      : {}),
    ...(optional(value.phone) ? { phone: optional(value.phone) } : {}),
    ...(email ? { email } : {}),
    ...(value.isPrimary === true ? { isPrimary: true } : {}),
    ...(optional(value.notes) ? { notes: optional(value.notes) } : {})
  };
}

function assertAddress(value: CounterpartyAddressV010): CounterpartyAddressV010 {
  if (value?.contractVersion !== "0.1.0") {
    throw new Error("COUNTERPARTY_ADDRESS_CONTRACT_VERSION_INVALID");
  }
  if (!["ACTIVE", "INACTIVE"].includes(value.status)) {
    throw new Error("COUNTERPARTY_ADDRESS_STATUS_INVALID");
  }
  if (!["REGISTERED", "BILLING", "SHIPPING", "OTHER"].includes(value.purpose)) {
    throw new Error("COUNTERPARTY_ADDRESS_PURPOSE_INVALID");
  }
  return {
    contractVersion: "0.1.0",
    addressId: required(value.addressId, "COUNTERPARTY_ADDRESS_ID_REQUIRED"),
    counterpartyId: required(
      value.counterpartyId,
      "COUNTERPARTY_ID_REQUIRED"
    ),
    purpose: value.purpose,
    status: value.status,
    line1: required(value.line1, "COUNTERPARTY_ADDRESS_LINE1_REQUIRED"),
    ...(optional(value.line2) ? { line2: optional(value.line2) } : {}),
    ...(optional(value.city) ? { city: optional(value.city) } : {}),
    ...(optional(value.region) ? { region: optional(value.region) } : {}),
    ...(optional(value.postalCode)
      ? { postalCode: optional(value.postalCode) }
      : {}),
    ...(optional(value.countryOrRegion)
      ? { countryOrRegion: optional(value.countryOrRegion) }
      : {}),
    ...(optional(value.recipientName)
      ? { recipientName: optional(value.recipientName) }
      : {}),
    ...(optional(value.phone) ? { phone: optional(value.phone) } : {}),
    ...(value.isPrimary === true ? { isPrimary: true } : {}),
    ...(optional(value.notes) ? { notes: optional(value.notes) } : {})
  };
}

function assertProfile(
  value: CounterpartyRelationshipProfileV010
): CounterpartyRelationshipProfileV010 {
  if (value?.contractVersion !== "0.1.0") {
    throw new Error("COUNTERPARTY_PROFILE_CONTRACT_VERSION_INVALID");
  }
  if (value.roleCode !== "CUSTOMER" && value.roleCode !== "SUPPLIER") {
    throw new Error("COUNTERPARTY_PROFILE_ROLE_INVALID");
  }
  if (value.status !== "ACTIVE" && value.status !== "INACTIVE") {
    throw new Error("COUNTERPARTY_PROFILE_STATUS_INVALID");
  }
  const counterpartyId = required(
    value.counterpartyId,
    "COUNTERPARTY_ID_REQUIRED"
  );
  return {
    contractVersion: "0.1.0",
    profileId: required(value.profileId, "COUNTERPARTY_PROFILE_ID_REQUIRED"),
    counterpartyId,
    roleCode: value.roleCode,
    status: value.status
  };
}

function childResourceId(counterpartyId: string, childId: string): string {
  return encodeURIComponent(counterpartyId) + "~" + encodeURIComponent(childId);
}

function profileResourceId(
  counterpartyId: string,
  roleCode: CounterpartyRelationshipRoleCodeV010
): string {
  return encodeURIComponent(counterpartyId) + "~" + roleCode.toLowerCase();
}

export function createCounterpartyContactRepositoryV010(input: {
  resources: EnterpriseResourceRepositoryV010;
  counterpartyRepository: CounterpartyRepositoryV010;
}): CounterpartyContactRepositoryV010 {
  return {
    list(contextId, counterpartyId) {
      const normalizedId = required(counterpartyId, "COUNTERPARTY_ID_REQUIRED");
      activeCounterparty(input.counterpartyRepository, contextId, normalizedId);
      return input.resources.list({
        contextId,
        namespace: "evo.counterparty",
        collectionId: COUNTERPARTY_CONTACT_COLLECTION_V010,
        resourceType: COUNTERPARTY_CONTACT_RESOURCE_TYPE_V010,
        lifecycleState: "ACTIVE"
      })
        .map(resource => assertContact(
          resource.payload as unknown as CounterpartyContactV010
        ))
        .filter(contact => contact.counterpartyId === normalizedId)
        .sort((a, b) =>
          Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary))
          || a.displayName.localeCompare(b.displayName)
          || a.contactId.localeCompare(b.contactId)
        );
    },

    get(contextId, counterpartyId, contactId) {
      const resource = input.resources.get({
        contextId,
        namespace: "evo.counterparty",
        collectionId: COUNTERPARTY_CONTACT_COLLECTION_V010,
        resourceType: COUNTERPARTY_CONTACT_RESOURCE_TYPE_V010,
        resourceId: childResourceId(
          required(counterpartyId, "COUNTERPARTY_ID_REQUIRED"),
          required(contactId, "COUNTERPARTY_CONTACT_ID_REQUIRED")
        )
      });
      return resource?.lifecycleState === "ACTIVE"
        ? assertContact(resource.payload as unknown as CounterpartyContactV010)
        : undefined;
    },

    save(request) {
      const contact = assertContact(request.contact);
      activeCounterparty(
        input.counterpartyRepository,
        request.contextId,
        contact.counterpartyId
      );
      const saved = input.resources.put({
        contextId: request.contextId,
        namespace: "evo.counterparty",
        collectionId: COUNTERPARTY_CONTACT_COLLECTION_V010,
        resourceType: COUNTERPARTY_CONTACT_RESOURCE_TYPE_V010,
        resourceId: childResourceId(contact.counterpartyId, contact.contactId),
        schemaRef: COUNTERPARTY_CONTACT_SCHEMA_V010,
        ownerPackageId: "evo-counterparty",
        storageKind: "DOCUMENT",
        payload: payload(contact),
        metadata: {
          counterpartyId: contact.counterpartyId,
          displayName: contact.displayName,
          isPrimary: Boolean(contact.isPrimary)
        },
        actorSubjectId: request.actorSubjectId,
        recordedAt: request.recordedAt
      });
      return assertContact(
        saved.payload as unknown as CounterpartyContactV010
      );
    },

    archive(request) {
      const current = this.get(
        request.contextId,
        request.counterpartyId,
        request.contactId
      );
      if (!current) throw new Error("COUNTERPARTY_CONTACT_NOT_FOUND");
      input.resources.archive({
        address: {
          contextId: request.contextId,
          namespace: "evo.counterparty",
          collectionId: COUNTERPARTY_CONTACT_COLLECTION_V010,
          resourceType: COUNTERPARTY_CONTACT_RESOURCE_TYPE_V010,
          resourceId: childResourceId(
            current.counterpartyId,
            current.contactId
          )
        },
        actorSubjectId: request.actorSubjectId,
        recordedAt: request.recordedAt
      });
      return current;
    }
  };
}

export function createCounterpartyAddressRepositoryV010(input: {
  resources: EnterpriseResourceRepositoryV010;
  counterpartyRepository: CounterpartyRepositoryV010;
}): CounterpartyAddressRepositoryV010 {
  return {
    list(contextId, counterpartyId) {
      const normalizedId = required(counterpartyId, "COUNTERPARTY_ID_REQUIRED");
      activeCounterparty(input.counterpartyRepository, contextId, normalizedId);
      return input.resources.list({
        contextId,
        namespace: "evo.counterparty",
        collectionId: COUNTERPARTY_ADDRESS_COLLECTION_V010,
        resourceType: COUNTERPARTY_ADDRESS_RESOURCE_TYPE_V010,
        lifecycleState: "ACTIVE"
      })
        .map(resource => assertAddress(
          resource.payload as unknown as CounterpartyAddressV010
        ))
        .filter(address => address.counterpartyId === normalizedId)
        .sort((a, b) =>
          Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary))
          || a.purpose.localeCompare(b.purpose)
          || a.addressId.localeCompare(b.addressId)
        );
    },

    get(contextId, counterpartyId, addressId) {
      const resource = input.resources.get({
        contextId,
        namespace: "evo.counterparty",
        collectionId: COUNTERPARTY_ADDRESS_COLLECTION_V010,
        resourceType: COUNTERPARTY_ADDRESS_RESOURCE_TYPE_V010,
        resourceId: childResourceId(
          required(counterpartyId, "COUNTERPARTY_ID_REQUIRED"),
          required(addressId, "COUNTERPARTY_ADDRESS_ID_REQUIRED")
        )
      });
      return resource?.lifecycleState === "ACTIVE"
        ? assertAddress(resource.payload as unknown as CounterpartyAddressV010)
        : undefined;
    },

    save(request) {
      const address = assertAddress(request.address);
      activeCounterparty(
        input.counterpartyRepository,
        request.contextId,
        address.counterpartyId
      );
      const saved = input.resources.put({
        contextId: request.contextId,
        namespace: "evo.counterparty",
        collectionId: COUNTERPARTY_ADDRESS_COLLECTION_V010,
        resourceType: COUNTERPARTY_ADDRESS_RESOURCE_TYPE_V010,
        resourceId: childResourceId(address.counterpartyId, address.addressId),
        schemaRef: COUNTERPARTY_ADDRESS_SCHEMA_V010,
        ownerPackageId: "evo-counterparty",
        storageKind: "DOCUMENT",
        payload: payload(address),
        metadata: {
          counterpartyId: address.counterpartyId,
          purpose: address.purpose,
          isPrimary: Boolean(address.isPrimary)
        },
        actorSubjectId: request.actorSubjectId,
        recordedAt: request.recordedAt
      });
      return assertAddress(
        saved.payload as unknown as CounterpartyAddressV010
      );
    },

    archive(request) {
      const current = this.get(
        request.contextId,
        request.counterpartyId,
        request.addressId
      );
      if (!current) throw new Error("COUNTERPARTY_ADDRESS_NOT_FOUND");
      input.resources.archive({
        address: {
          contextId: request.contextId,
          namespace: "evo.counterparty",
          collectionId: COUNTERPARTY_ADDRESS_COLLECTION_V010,
          resourceType: COUNTERPARTY_ADDRESS_RESOURCE_TYPE_V010,
          resourceId: childResourceId(
            current.counterpartyId,
            current.addressId
          )
        },
        actorSubjectId: request.actorSubjectId,
        recordedAt: request.recordedAt
      });
      return current;
    }
  };
}

export function createCounterpartyProfileRepositoryV010(input: {
  resources: EnterpriseResourceRepositoryV010;
  counterpartyRepository: CounterpartyRepositoryV010;
  roleRepository: CounterpartyRoleRepositoryV010;
}): CounterpartyProfileRepositoryV010 {
  return {
    get(contextId, counterpartyId, roleCode) {
      const resource = input.resources.get({
        contextId,
        namespace: "evo.counterparty",
        collectionId: COUNTERPARTY_PROFILE_COLLECTION_V010,
        resourceType: COUNTERPARTY_PROFILE_RESOURCE_TYPE_V010,
        resourceId: profileResourceId(
          required(counterpartyId, "COUNTERPARTY_ID_REQUIRED"),
          roleCode
        )
      });
      return resource?.lifecycleState === "ACTIVE"
        ? assertProfile(
            resource.payload as unknown as CounterpartyRelationshipProfileV010
          )
        : undefined;
    },

    save(request) {
      const profile = assertProfile(request.profile);
      activeCounterparty(
        input.counterpartyRepository,
        request.contextId,
        profile.counterpartyId
      );
      const hasRole = input.roleRepository
        .list(request.contextId, profile.counterpartyId)
        .some(role => role.roleCode === profile.roleCode);
      if (!hasRole) {
        throw new Error("COUNTERPARTY_PROFILE_ROLE_REQUIRED");
      }
      const saved = input.resources.put({
        contextId: request.contextId,
        namespace: "evo.counterparty",
        collectionId: COUNTERPARTY_PROFILE_COLLECTION_V010,
        resourceType: COUNTERPARTY_PROFILE_RESOURCE_TYPE_V010,
        resourceId: profileResourceId(
          profile.counterpartyId,
          profile.roleCode
        ),
        schemaRef: COUNTERPARTY_PROFILE_SCHEMA_V010,
        ownerPackageId: "evo-counterparty",
        storageKind: "DOCUMENT",
        payload: payload(profile),
        metadata: {
          counterpartyId: profile.counterpartyId,
          roleCode: profile.roleCode,
          status: profile.status
        },
        actorSubjectId: request.actorSubjectId,
        recordedAt: request.recordedAt
      });
      return assertProfile(
        saved.payload as unknown as CounterpartyRelationshipProfileV010
      );
    },

    archive(request) {
      const current = this.get(
        request.contextId,
        request.counterpartyId,
        request.roleCode
      );
      if (!current) throw new Error("COUNTERPARTY_PROFILE_NOT_FOUND");
      input.resources.archive({
        address: {
          contextId: request.contextId,
          namespace: "evo.counterparty",
          collectionId: COUNTERPARTY_PROFILE_COLLECTION_V010,
          resourceType: COUNTERPARTY_PROFILE_RESOURCE_TYPE_V010,
          resourceId: profileResourceId(
            current.counterpartyId,
            current.roleCode
          )
        },
        actorSubjectId: request.actorSubjectId,
        recordedAt: request.recordedAt
      });
      return current;
    }
  };
}
