import { createHash } from "node:crypto";
import type {
  EnterpriseResourceRepositoryV010
} from "../../contracts/enterprise-resource.js";
import type {
  FoundationObjectImportCellV010,
  FoundationObjectImportTargetParametersV010,
  FoundationObjectImportTargetV010,
  FoundationObjectImportValidationV010
} from "../../contracts/foundation-object/import.js";
import {
  fieldsForSurfaceV010,
  type EffectiveFoundationObjectFieldV010,
  type EffectiveObjectSchemaV010
} from "../../contracts/foundation-object/schema.js";
import type {
  ObjectExtensionRepositoryV010
} from "../object-extension/repository.js";
import type {
  ObjectExtensionValueRepositoryV010
} from "../object-extension/values.js";
import {
  createCounterpartyEffectiveObjectSchemaV010
} from "./foundation-object.js";
import {
  assertCounterpartySubjectV010,
  type CounterpartyRepositoryV010,
  type CounterpartySubjectV010
} from "./repository.js";
import type {
  CounterpartyRelationshipRoleCodeV010,
  CounterpartyRoleRepositoryV010
} from "./roles.js";
import type {
  CounterpartyAddressRepositoryV010,
  CounterpartyContactRepositoryV010,
  CounterpartyProfileRepositoryV010,
  CounterpartyProfileValueV010
} from "./facets.js";

export const COUNTERPARTY_IMPORT_TARGET_V010 =
  "counterparty.subject" as const;

function roles(
  parameters?: FoundationObjectImportTargetParametersV010
): CounterpartyRelationshipRoleCodeV010[] {
  const explicitMode = typeof parameters?.relationshipMode === "string"
    ? parameters.relationshipMode.trim().toUpperCase()
    : undefined;
  const values = explicitMode
    ? explicitMode === "BOTH"
      ? ["CUSTOMER", "SUPPLIER"]
      : explicitMode === "CUSTOMER" || explicitMode === "SUPPLIER"
        ? [explicitMode]
        : explicitMode === "NONE"
          ? []
          : (() => { throw new Error("COUNTERPARTY_IMPORT_ROLE_MODE_INVALID"); })()
    : parameters?.relationshipRoles ?? [];
  const normalized = [...new Set(values.map(value => value.trim().toUpperCase()))];
  for (const value of normalized) {
    if (value !== "CUSTOMER" && value !== "SUPPLIER") {
      throw new Error("COUNTERPARTY_IMPORT_ROLE_INVALID");
    }
  }
  return normalized as CounterpartyRelationshipRoleCodeV010[];
}

function blank(value: FoundationObjectImportCellV010 | undefined): boolean {
  return value === null
    || value === undefined
    || (typeof value === "string" && !value.trim());
}

function normalizeCell(
  field: EffectiveFoundationObjectFieldV010,
  value: FoundationObjectImportCellV010 | undefined
): FoundationObjectImportCellV010 {
  if (blank(value)) return null;

  switch (field.valueType) {
    case "STRING":
      return typeof value === "string"
        ? value.trim()
        : String(value);
    case "NUMBER": {
      const number = typeof value === "number"
        ? value
        : Number(String(value).trim());
      if (!Number.isFinite(number)) {
        throw new Error("DATA_IMPORT_VALUE_NUMBER_INVALID");
      }
      return number;
    }
    case "BOOLEAN": {
      if (typeof value === "boolean") return value;
      const normalized = String(value).trim().toLowerCase();
      if (["true", "1", "yes", "y"].includes(normalized)) return true;
      if (["false", "0", "no", "n"].includes(normalized)) return false;
      throw new Error("DATA_IMPORT_VALUE_BOOLEAN_INVALID");
    }
    case "DATE": {
      const normalized = String(value).trim();
      if (!Number.isFinite(Date.parse(normalized))) {
        throw new Error("DATA_IMPORT_VALUE_DATE_INVALID");
      }
      return normalized;
    }
    case "ENUM": {
      const normalized = String(value).trim();
      const match = field.enumOptions?.find(option =>
        option.value.toLocaleLowerCase() === normalized.toLocaleLowerCase()
      );
      if (!match) throw new Error("DATA_IMPORT_VALUE_ENUM_INVALID");
      return match.value;
    }
  }
}

function textValue(
  values: Record<string, FoundationObjectImportCellV010>,
  fieldId: string
): string | undefined {
  const value = values[fieldId];
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function deterministicCounterpartyId(input: {
  contextId: string;
  importJobId: string;
  rowNumber: number;
  code: string;
}): string {
  const digest = createHash("sha256")
    .update([
      input.contextId,
      input.importJobId,
      String(input.rowNumber),
      input.code.toLocaleLowerCase()
    ].join("|"))
    .digest("hex")
    .slice(0, 24);
  return "cp-import-" + digest;
}

function deterministicRelatedId(input: {
  kind: "contact" | "address";
  contextId: string;
  importJobId: string;
  rowNumber: number;
  counterpartyId: string;
  groupId: string;
}): string {
  const digest = createHash("sha256")
    .update([
      input.kind,
      input.contextId,
      input.importJobId,
      String(input.rowNumber),
      input.counterpartyId,
      input.groupId
    ].join("|"))
    .digest("hex")
    .slice(0, 24);
  return "cp-" + input.kind + "-import-" + digest;
}

interface CounterpartySemanticDestinationsV010 {
  profiles: Map<
    CounterpartyRelationshipRoleCodeV010,
    Record<string, CounterpartyProfileValueV010>
  >;
  related: Map<string, {
    resourceType: string;
    groupId: string;
    values: Record<string, FoundationObjectImportCellV010>;
  }>;
}

function semanticDestinationsV010(
  schema: EffectiveObjectSchemaV010,
  values: Record<string, FoundationObjectImportCellV010>
): CounterpartySemanticDestinationsV010 {
  const fields = new Map(schema.fields.map(field => [field.fieldId, field]));
  const profiles = new Map<
    CounterpartyRelationshipRoleCodeV010,
    Record<string, CounterpartyProfileValueV010>
  >();
  const related = new Map<string, {
    resourceType: string;
    groupId: string;
    values: Record<string, FoundationObjectImportCellV010>;
  }>();

  for (const [fieldId, value] of Object.entries(values)) {
    if (blank(value)) continue;
    const destination = fields.get(fieldId)?.destination;
    if (!destination) continue;

    if (destination.kind === "PROFILE_FIELD") {
      const roleCode = destination.relationshipRole;
      if (roleCode !== "CUSTOMER" && roleCode !== "SUPPLIER") {
        throw new Error("COUNTERPARTY_IMPORT_PROFILE_DESTINATION_INVALID");
      }
      const target = profiles.get(roleCode) ?? {};
      target[destination.fieldPath] = value as CounterpartyProfileValueV010;
      profiles.set(roleCode, target);
      continue;
    }

    if (destination.kind === "RELATED_RESOURCE_FIELD") {
      const groupId = destination.groupId?.trim();
      if (!groupId) {
        throw new Error("COUNTERPARTY_IMPORT_RELATED_GROUP_REQUIRED");
      }
      const key = destination.resourceType + "|" + groupId;
      const target = related.get(key) ?? {
        resourceType: destination.resourceType,
        groupId,
        values: {}
      };
      target.values[destination.fieldPath] = value;
      related.set(key, target);
    }
  }

  return { profiles, related };
}

function semanticDestinationValidationIssuesV010(
  destinations: CounterpartySemanticDestinationsV010
): FoundationObjectImportValidationV010["issues"] {
  const issues: FoundationObjectImportValidationV010["issues"] = [];
  for (const related of destinations.related.values()) {
    if (related.resourceType === "counterparty.contact") {
      const displayName = related.values.displayName;
      if (blank(displayName)) {
        issues.push({
          code: "COUNTERPARTY_IMPORT_CONTACT_NAME_REQUIRED",
          message: "Primary Contact fields require a primary Contact name.",
          fieldId: "primaryContactName"
        });
      }
      const email = related.values.email;
      if (
        !blank(email)
        && !/^\S+@\S+\.\S+$/u.test(String(email).trim())
      ) {
        issues.push({
          code: "COUNTERPARTY_CONTACT_EMAIL_INVALID",
          message: "Primary Contact email is invalid.",
          fieldId: "primaryContactEmail"
        });
      }
    }
    if (
      related.resourceType === "counterparty.address"
      && blank(related.values.line1)
    ) {
      issues.push({
        code: "COUNTERPARTY_IMPORT_ADDRESS_LINE1_REQUIRED",
        message: "Primary Address fields require the primary address line.",
        fieldId: "primaryAddressLine1"
      });
    }
  }
  return issues;
}

export function createCounterpartyImportTargetV010(input: {
  resources: EnterpriseResourceRepositoryV010;
  repository: CounterpartyRepositoryV010;
  roleRepository: CounterpartyRoleRepositoryV010;
  contactRepository?: CounterpartyContactRepositoryV010;
  addressRepository?: CounterpartyAddressRepositoryV010;
  profileRepository?: CounterpartyProfileRepositoryV010;
  extensionRepository: ObjectExtensionRepositoryV010;
  extensionValueRepository: ObjectExtensionValueRepositoryV010;
}): FoundationObjectImportTargetV010 {
  const existingCodeCache = new Map<string, Set<string>>();
  const extensionDefinitionCache = new Map<
    string,
    ReturnType<ObjectExtensionRepositoryV010["list"]>
  >();

  function describe(contextId: string, locale?: string, parameters?: FoundationObjectImportTargetParametersV010) {
    return createCounterpartyEffectiveObjectSchemaV010({
      locale,
      activeRelationshipRoles: roles(parameters),
      extensions: input.extensionRepository.list(
        contextId,
        "counterparty.subject"
      )
    });
  }

  function persistSemanticResources(write: {
    contextId: string;
    importJobId: string;
    rowNumber: number;
    counterpartyId: string;
    schema: EffectiveObjectSchemaV010;
    values: Record<string, FoundationObjectImportCellV010>;
    actorSubjectId: string;
    recordedAt: string;
  }): void {
    const destinations = semanticDestinationsV010(write.schema, write.values);

    for (const [roleCode, values] of destinations.profiles) {
      if (!input.profileRepository) {
        throw new Error("COUNTERPARTY_IMPORT_PROFILE_REPOSITORY_REQUIRED");
      }
      input.profileRepository.save({
        contextId: write.contextId,
        profile: {
          contractVersion: "0.1.0",
          profileId:
            write.counterpartyId + "." + roleCode.toLocaleLowerCase(),
          counterpartyId: write.counterpartyId,
          roleCode,
          status: "ACTIVE",
          values
        },
        actorSubjectId: write.actorSubjectId,
        recordedAt: write.recordedAt
      });
    }

    for (const related of destinations.related.values()) {
      if (related.resourceType === "counterparty.contact") {
        if (!input.contactRepository) {
          throw new Error("COUNTERPARTY_IMPORT_CONTACT_REPOSITORY_REQUIRED");
        }
        const displayName = textValue(related.values, "displayName");
        if (!displayName) {
          throw new Error("COUNTERPARTY_IMPORT_CONTACT_NAME_REQUIRED");
        }
        input.contactRepository.save({
          contextId: write.contextId,
          contact: {
            contractVersion: "0.1.0",
            contactId: deterministicRelatedId({
              kind: "contact",
              contextId: write.contextId,
              importJobId: write.importJobId,
              rowNumber: write.rowNumber,
              counterpartyId: write.counterpartyId,
              groupId: related.groupId
            }),
            counterpartyId: write.counterpartyId,
            displayName,
            status: "ACTIVE",
            ...(textValue(related.values, "title")
              ? { title: textValue(related.values, "title") }
              : {}),
            ...(textValue(related.values, "phone")
              ? { phone: textValue(related.values, "phone") }
              : {}),
            ...(textValue(related.values, "email")
              ? { email: textValue(related.values, "email") }
              : {}),
            isPrimary: true
          },
          actorSubjectId: write.actorSubjectId,
          recordedAt: write.recordedAt
        });
        continue;
      }

      if (related.resourceType === "counterparty.address") {
        if (!input.addressRepository) {
          throw new Error("COUNTERPARTY_IMPORT_ADDRESS_REPOSITORY_REQUIRED");
        }
        const line1 = textValue(related.values, "line1");
        if (!line1) {
          throw new Error("COUNTERPARTY_IMPORT_ADDRESS_LINE1_REQUIRED");
        }
        input.addressRepository.save({
          contextId: write.contextId,
          address: {
            contractVersion: "0.1.0",
            addressId: deterministicRelatedId({
              kind: "address",
              contextId: write.contextId,
              importJobId: write.importJobId,
              rowNumber: write.rowNumber,
              counterpartyId: write.counterpartyId,
              groupId: related.groupId
            }),
            counterpartyId: write.counterpartyId,
            purpose: "OTHER",
            status: "ACTIVE",
            line1,
            ...(textValue(related.values, "city")
              ? { city: textValue(related.values, "city") }
              : {}),
            ...(textValue(related.values, "region")
              ? { region: textValue(related.values, "region") }
              : {}),
            ...(textValue(related.values, "postalCode")
              ? { postalCode: textValue(related.values, "postalCode") }
              : {}),
            ...(textValue(related.values, "countryOrRegion")
              ? {
                  countryOrRegion: textValue(
                    related.values,
                    "countryOrRegion"
                  )
                }
              : {}),
            isPrimary: true
          },
          actorSubjectId: write.actorSubjectId,
          recordedAt: write.recordedAt
        });
      }
    }
  }

  const target: FoundationObjectImportTargetV010 = {
    contractVersion: "0.1.0",
    targetId: COUNTERPARTY_IMPORT_TARGET_V010,
    label: {
      default: "Counterparties",
      translations: { "zh-CN": "往来对象" }
    },
    parameters: [{
      key: "relationshipMode",
      label: {
        default: "Relationship role",
        translations: { "zh-CN": "导入关系角色" }
      },
      required: true,
      control: "select",
      defaultValue: "NONE",
      options: [{
        value: "NONE",
        label: {
          default: "No role yet",
          translations: { "zh-CN": "暂不设置角色" }
        }
      }, {
        value: "CUSTOMER",
        label: {
          default: "Customer",
          translations: { "zh-CN": "客户" }
        }
      }, {
        value: "SUPPLIER",
        label: {
          default: "Supplier",
          translations: { "zh-CN": "供应商" }
        }
      }, {
        value: "BOTH",
        label: {
          default: "Customer + Supplier",
          translations: { "zh-CN": "客户 + 供应商" }
        }
      }]
    }],
    objectType: "counterparty.subject",
    ownerPackageId: "evo-counterparty",

    describe(describeInput) {
      return describe(
        describeInput.contextId,
        describeInput.locale,
        describeInput.parameters
      );
    },

    validateRow(validateInput): FoundationObjectImportValidationV010 {
      const schema = validateInput.schema;
      const importFields = fieldsForSurfaceV010(schema, "IMPORT")
        .filter(field => field.writable);
      const fieldMap = new Map(
        importFields.map(field => [field.fieldId, field])
      );
      const normalizedValues: Record<string, FoundationObjectImportCellV010> = {};
      const issues: FoundationObjectImportValidationV010["issues"] = [];

      for (const field of importFields) {
        const raw = validateInput.values[field.fieldId];
        if (field.required && blank(raw)) {
          issues.push({
            code: "DATA_IMPORT_REQUIRED_VALUE_MISSING",
            message: "Required import value is missing.",
            fieldId: field.fieldId
          });
          continue;
        }
        if (raw === undefined) continue;
        try {
          normalizedValues[field.fieldId] = normalizeCell(field, raw);
        } catch (error) {
          const code = error instanceof Error
            ? error.message
            : "DATA_IMPORT_VALUE_INVALID";
          issues.push({
            code,
            message: code,
            fieldId: field.fieldId
          });
        }
      }

      for (const fieldId of Object.keys(validateInput.values)) {
        if (!fieldMap.has(fieldId)) {
          issues.push({
            code: "DATA_IMPORT_FIELD_NOT_IMPORTABLE",
            message: "Mapped field is not importable.",
            fieldId
          });
        }
      }

      const code = textValue(normalizedValues, "code");
      const displayName = textValue(normalizedValues, "displayName");
      const subjectType = textValue(normalizedValues, "subjectType");

      if (code && displayName && subjectType && issues.length === 0) {
        try {
          const candidate: CounterpartySubjectV010 = {
            contractVersion: "0.1.0",
            counterpartyId: "dry-run",
            code,
            displayName,
            subjectType: subjectType as CounterpartySubjectV010["subjectType"],
            status: "ACTIVE",
            ...(textValue(normalizedValues, "legalName")
              ? { legalName: textValue(normalizedValues, "legalName") }
              : {}),
            ...(textValue(normalizedValues, "taxIdentifier")
              ? { taxIdentifier: textValue(normalizedValues, "taxIdentifier") }
              : {}),
            ...(textValue(normalizedValues, "countryOrRegion")
              ? { countryOrRegion: textValue(normalizedValues, "countryOrRegion") }
              : {}),
            ...(textValue(normalizedValues, "phone")
              ? { phone: textValue(normalizedValues, "phone") }
              : {}),
            ...(textValue(normalizedValues, "email")
              ? { email: textValue(normalizedValues, "email") }
              : {}),
            ...(textValue(normalizedValues, "notes")
              ? { notes: textValue(normalizedValues, "notes") }
              : {})
          };
          assertCounterpartySubjectV010(candidate);
        } catch (error) {
          const errorCode = error instanceof Error
            ? error.message
            : "COUNTERPARTY_IMPORT_SUBJECT_INVALID";
          issues.push({
            code: errorCode,
            message: errorCode
          });
        }

        const cacheKey =
          validateInput.contextId + "|" + validateInput.importJobId;
        if (validateInput.rowNumber === 1 || !existingCodeCache.has(cacheKey)) {
          existingCodeCache.set(
            cacheKey,
            new Set(
              input.repository.list(validateInput.contextId)
                .map(existing => existing.code.toLocaleLowerCase())
            )
          );
        }
        if (
          existingCodeCache.get(cacheKey)
            ?.has(code.toLocaleLowerCase())
        ) {
          issues.push({
            code: "COUNTERPARTY_CODE_DUPLICATE",
            message: "Counterparty code already exists.",
            fieldId: "code"
          });
        }
      }

      return {
        ok: issues.length === 0,
        ...(issues.length === 0 && code
          ? {
              prepared: {
                rowNumber: validateInput.rowNumber,
                values: normalizedValues,
                dedupeKey: "counterparty-code:" + code.toLocaleLowerCase()
              }
            }
          : {}),
        issues
      };
    },

    commitRow(commitInput) {
      const code = textValue(commitInput.prepared.values, "code");
      const displayName = textValue(
        commitInput.prepared.values,
        "displayName"
      );
      const subjectType = textValue(
        commitInput.prepared.values,
        "subjectType"
      );
      if (!code || !displayName || !subjectType) {
        throw new Error("COUNTERPARTY_IMPORT_PREPARED_ROW_INVALID");
      }
      const counterpartyId = deterministicCounterpartyId({
        contextId: commitInput.contextId,
        importJobId: commitInput.importJobId,
        rowNumber: commitInput.prepared.rowNumber,
        code
      });
      const subject: CounterpartySubjectV010 = {
        contractVersion: "0.1.0",
        counterpartyId,
        code,
        displayName,
        subjectType: subjectType as CounterpartySubjectV010["subjectType"],
        status: "ACTIVE",
        ...(textValue(commitInput.prepared.values, "legalName")
          ? { legalName: textValue(commitInput.prepared.values, "legalName") }
          : {}),
        ...(textValue(commitInput.prepared.values, "taxIdentifier")
          ? { taxIdentifier: textValue(commitInput.prepared.values, "taxIdentifier") }
          : {}),
        ...(textValue(commitInput.prepared.values, "countryOrRegion")
          ? { countryOrRegion: textValue(commitInput.prepared.values, "countryOrRegion") }
          : {}),
        ...(textValue(commitInput.prepared.values, "phone")
          ? { phone: textValue(commitInput.prepared.values, "phone") }
          : {}),
        ...(textValue(commitInput.prepared.values, "email")
          ? { email: textValue(commitInput.prepared.values, "email") }
          : {}),
        ...(textValue(commitInput.prepared.values, "notes")
          ? { notes: textValue(commitInput.prepared.values, "notes") }
          : {})
      };
      input.repository.save({
        contextId: commitInput.contextId,
        subject,
        actorSubjectId: commitInput.actorSubjectId,
        recordedAt: commitInput.recordedAt
      });

      for (const roleCode of roles(commitInput.parameters)) {
        input.roleRepository.assign({
          contextId: commitInput.contextId,
          counterpartyId,
          roleCode,
          actorSubjectId: commitInput.actorSubjectId,
          recordedAt: commitInput.recordedAt
        });
      }

      const definitionCacheKey =
        commitInput.contextId + "|" + commitInput.importJobId;
      if (
        commitInput.prepared.rowNumber === 1
        || !extensionDefinitionCache.has(definitionCacheKey)
      ) {
        extensionDefinitionCache.set(
          definitionCacheKey,
          input.extensionRepository.list(
            commitInput.contextId,
            "counterparty.subject"
          )
        );
      }
      const definitions =
        extensionDefinitionCache.get(definitionCacheKey) ?? [];
      const byFieldId = new Map(
        definitions.map(definition => [definition.fieldId, definition])
      );
      const grouped = new Map<string, {
        slot: string;
        namespace: string;
        values: Record<string, FoundationObjectImportCellV010>;
      }>();

      for (const [fieldId, value] of Object.entries(
        commitInput.prepared.values
      )) {
        const definition = byFieldId.get(fieldId);
        if (!definition) continue;
        const key = definition.targetSlot + "|" + definition.namespace;
        const group = grouped.get(key) ?? {
          slot: definition.targetSlot,
          namespace: definition.namespace,
          values: {}
        };
        group.values[fieldId] = value;
        grouped.set(key, group);
      }

      for (const group of grouped.values()) {
        input.extensionValueRepository.save({
          contextId: commitInput.contextId,
          valueSet: {
            contractVersion: "0.1.0",
            targetRef: {
              objectType: "counterparty.subject",
              objectId: counterpartyId,
              slot: group.slot
            },
            namespace: group.namespace,
            values: group.values,
            provenance: {
              source: "IMPORT",
              sourceRef: commitInput.importJobId
            }
          },
          actorSubjectId: commitInput.actorSubjectId,
          recordedAt: commitInput.recordedAt
        });
      }

      return {
        objectType: "counterparty.subject",
        objectId: counterpartyId,
        displayKey: code
      };
    },

    commitPreparedRows(batchInput) {
      if (!input.resources.transaction) {
        throw new Error("ENTERPRISE_RESOURCE_TRANSACTION_REQUIRED");
      }

      const roleCodes = roles(batchInput.parameters);
      const definitions = input.extensionRepository.list(
        batchInput.contextId,
        "counterparty.subject"
      );
      const definitionByFieldId = new Map(
        definitions.map(definition => [definition.fieldId, definition])
      );

      const subjects: CounterpartySubjectV010[] = [];
      const assignments: Array<{
        counterpartyId: string;
        roleCode: CounterpartyRelationshipRoleCodeV010;
      }> = [];
      const valueSets: Parameters<
        ObjectExtensionValueRepositoryV010["save"]
      >[0]["valueSet"][] = [];
      const results = [];

      for (const prepared of batchInput.preparedRows) {
        const code = textValue(prepared.values, "code");
        const displayName = textValue(prepared.values, "displayName");
        const subjectType = textValue(prepared.values, "subjectType");
        if (!code || !displayName || !subjectType) {
          throw new Error("COUNTERPARTY_IMPORT_PREPARED_ROW_INVALID");
        }
        const counterpartyId = deterministicCounterpartyId({
          contextId: batchInput.contextId,
          importJobId: batchInput.importJobId,
          rowNumber: prepared.rowNumber,
          code
        });
        subjects.push(assertCounterpartySubjectV010({
          contractVersion: "0.1.0",
          counterpartyId,
          code,
          displayName,
          subjectType: subjectType as CounterpartySubjectV010["subjectType"],
          status: "ACTIVE",
          ...(textValue(prepared.values, "legalName")
            ? { legalName: textValue(prepared.values, "legalName") }
            : {}),
          ...(textValue(prepared.values, "taxIdentifier")
            ? { taxIdentifier: textValue(prepared.values, "taxIdentifier") }
            : {}),
          ...(textValue(prepared.values, "countryOrRegion")
            ? { countryOrRegion: textValue(prepared.values, "countryOrRegion") }
            : {}),
          ...(textValue(prepared.values, "phone")
            ? { phone: textValue(prepared.values, "phone") }
            : {}),
          ...(textValue(prepared.values, "email")
            ? { email: textValue(prepared.values, "email") }
            : {}),
          ...(textValue(prepared.values, "notes")
            ? { notes: textValue(prepared.values, "notes") }
            : {})
        }));

        for (const roleCode of roleCodes) {
          assignments.push({ counterpartyId, roleCode });
        }

        const grouped = new Map<string, {
          slot: string;
          namespace: string;
          values: Record<string, FoundationObjectImportCellV010>;
        }>();
        for (const [fieldId, value] of Object.entries(prepared.values)) {
          const definition = definitionByFieldId.get(fieldId);
          if (!definition) continue;
          const key = definition.targetSlot + "|" + definition.namespace;
          const group = grouped.get(key) ?? {
            slot: definition.targetSlot,
            namespace: definition.namespace,
            values: {}
          };
          group.values[fieldId] = value;
          grouped.set(key, group);
        }
        for (const group of grouped.values()) {
          valueSets.push({
            contractVersion: "0.1.0",
            targetRef: {
              objectType: "counterparty.subject",
              objectId: counterpartyId,
              slot: group.slot
            },
            namespace: group.namespace,
            values: group.values,
            provenance: {
              source: "IMPORT",
              sourceRef: batchInput.importJobId
            }
          });
        }

        results.push({
          objectType: "counterparty.subject",
          objectId: counterpartyId,
          displayKey: code
        });
      }

      input.resources.transaction(() => {
        input.repository.saveMany({
          contextId: batchInput.contextId,
          subjects,
          actorSubjectId: batchInput.actorSubjectId,
          recordedAt: batchInput.recordedAt
        });
        if (assignments.length > 0) {
          input.roleRepository.assignMany({
            contextId: batchInput.contextId,
            assignments,
            actorSubjectId: batchInput.actorSubjectId,
            recordedAt: batchInput.recordedAt
          });
        }
        if (valueSets.length > 0) {
          input.extensionValueRepository.saveMany({
            contextId: batchInput.contextId,
            valueSets,
            actorSubjectId: batchInput.actorSubjectId,
            recordedAt: batchInput.recordedAt
          });
        }
      });

      return {
        semantics: "ATOMIC_BATCH",
        results
      };
    }
  };
  return target;
}
