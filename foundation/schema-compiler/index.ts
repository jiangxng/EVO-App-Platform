import {
  assertFoundationObjectDescriptorV010,
  type FoundationObjectDescriptorV010
} from "../../contracts/foundation-object/descriptor.js";
import {
  assertObjectExtensionDefinitionV010,
  type ObjectExtensionDefinitionV010
} from "../../contracts/foundation-object/extension.js";
import {
  localizedTextV010,
  type EffectiveFoundationObjectFieldV010,
  type EffectiveObjectSchemaV010,
  type FoundationObjectCoreSchemaV010,
  type FoundationObjectFieldControlV010,
  type FoundationObjectFieldDefinitionV010,
  type FoundationObjectValueTypeV010
} from "../../contracts/foundation-object/schema.js";

export interface FoundationObjectFieldAuthorizationInputV010 {
  fieldId: string;
  source: "CORE" | "ENTERPRISE_EXTENSION";
  readCapability?: string;
  writeCapability?: string;
}

export type FoundationObjectFieldAuthorizationV010 = (
  input: FoundationObjectFieldAuthorizationInputV010
) => {
  readable: boolean;
  writable: boolean;
};

export interface CompileEffectiveObjectSchemaInputV010 {
  descriptor: FoundationObjectDescriptorV010;
  coreSchema: FoundationObjectCoreSchemaV010;
  extensions?: readonly ObjectExtensionDefinitionV010[];
  /**
   * EFFECTIVE applies the current qualifier/role context.
   * DISCOVERY retains conditionally-applicable fields so mapping/schema
   * discovery can expose every governed possibility before row context exists.
   */
  applicabilityMode?: "EFFECTIVE" | "DISCOVERY";
  /**
   * Object-neutral applicability dimensions for the current object scenario.
   * Dimension names and values are matched case-insensitively.
   */
  activeQualifiers?: Readonly<Record<string, readonly string[]>>;
  /**
   * Counterparty v0.1 compatibility input. New Foundation Objects should use
   * activeQualifiers.
   */
  activeRelationshipRoles?: readonly string[];
  locale?: string;
  authorizeField?: FoundationObjectFieldAuthorizationV010;
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function normalizedQualifierRecord(
  value: Record<string, string[]> | undefined,
  dimensionCode: string,
  valueCode: string
): Record<string, string[]> | undefined {
  const entries = Object.entries(value ?? {})
    .map(([dimension, values]) => [
      required(dimension, dimensionCode).toLocaleLowerCase(),
      [...new Set(values.map(item =>
        required(item, valueCode).toLocaleUpperCase()
      ))].sort()
    ] as const)
    .sort(([a], [b]) => a.localeCompare(b));
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function activeQualifierMap(
  value: Readonly<Record<string, readonly string[]>> | undefined
): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>();
  for (const [dimension, values] of Object.entries(value ?? {})) {
    const key = required(
      dimension,
      "FOUNDATION_OBJECT_ACTIVE_QUALIFIER_DIMENSION_INVALID"
    ).toLocaleLowerCase();
    result.set(key, new Set(values.map(item =>
      required(
        item,
        "FOUNDATION_OBJECT_ACTIVE_QUALIFIER_VALUE_INVALID"
      ).toLocaleUpperCase()
    )));
  }
  return result;
}

function qualifierSnapshot(
  value: Map<string, Set<string>>
): Record<string, string[]> | undefined {
  const entries = [...value.entries()]
    .map(([dimension, values]) => [
      dimension,
      [...values].sort()
    ] as const)
    .sort(([a], [b]) => a.localeCompare(b));
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function qualifiersApply(
  configured: Record<string, string[]> | undefined,
  active: Map<string, Set<string>>
): boolean {
  for (const [dimension, values] of Object.entries(configured ?? {})) {
    const current = active.get(dimension.toLocaleLowerCase());
    if (!current || !values.some(value =>
      current.has(value.toLocaleUpperCase())
    )) {
      return false;
    }
  }
  return true;
}

function defaultControl(
  valueType: FoundationObjectValueTypeV010
): FoundationObjectFieldControlV010 {
  switch (valueType) {
    case "NUMBER":
      return "number";
    case "BOOLEAN":
      return "checkbox";
    case "DATE":
      return "date";
    case "ENUM":
      return "select";
    default:
      return "text";
  }
}

function assertCoreSchema(
  value: FoundationObjectCoreSchemaV010,
  descriptor: FoundationObjectDescriptorV010
): FoundationObjectCoreSchemaV010 {
  if (value?.contractVersion !== "0.1.0") {
    throw new Error("FOUNDATION_OBJECT_CORE_SCHEMA_VERSION_INVALID");
  }
  if (required(value.objectType, "FOUNDATION_OBJECT_TYPE_REQUIRED")
      !== descriptor.objectType) {
    throw new Error("FOUNDATION_OBJECT_CORE_SCHEMA_TYPE_MISMATCH");
  }
  if (required(value.ownerPackageId, "FOUNDATION_OBJECT_OWNER_PACKAGE_REQUIRED")
      !== descriptor.ownerPackageId) {
    throw new Error("FOUNDATION_OBJECT_CORE_SCHEMA_OWNER_MISMATCH");
  }
  const slots = new Set(descriptor.extensionSlots.map(slot => slot.slotId));
  const seen = new Set<string>();
  const fields = value.fields.map(field => {
    const fieldId = required(field.fieldId, "FOUNDATION_OBJECT_FIELD_ID_REQUIRED");
    if (seen.has(fieldId)) throw new Error("FOUNDATION_OBJECT_FIELD_DUPLICATE");
    seen.add(fieldId);
    if (!slots.has(field.slotId)) {
      throw new Error("FOUNDATION_OBJECT_FIELD_SLOT_UNKNOWN");
    }
    if (
      field.valueType === "ENUM"
      && (!field.enumOptions || field.enumOptions.length === 0)
    ) {
      throw new Error("FOUNDATION_OBJECT_FIELD_ENUM_OPTIONS_REQUIRED");
    }
    return {
      ...field,
      fieldId,
      slotId: required(field.slotId, "FOUNDATION_OBJECT_FIELD_SLOT_REQUIRED"),
      semanticType: required(
        field.semanticType,
        "FOUNDATION_OBJECT_FIELD_SEMANTIC_TYPE_REQUIRED"
      ),
      label: {
        default: required(
          field.label.default,
          "FOUNDATION_OBJECT_FIELD_LABEL_REQUIRED"
        ),
        ...(field.label.translations
          ? { translations: { ...field.label.translations } }
          : {})
      },
      ...(field.description
        ? {
            description: {
              default: required(
                field.description.default,
                "FOUNDATION_OBJECT_FIELD_DESCRIPTION_REQUIRED"
              ),
              ...(field.description.translations
                ? { translations: { ...field.description.translations } }
                : {})
            }
          }
        : {}),
      surfaces: [...new Set(field.surfaces)],
      ...(field.enumOptions
        ? {
            enumOptions: field.enumOptions.map(option => ({
              value: required(
                option.value,
                "FOUNDATION_OBJECT_FIELD_ENUM_VALUE_REQUIRED"
              ),
              label: {
                default: required(
                  option.label.default,
                  "FOUNDATION_OBJECT_FIELD_ENUM_LABEL_REQUIRED"
                ),
                ...(option.label.translations
                  ? { translations: { ...option.label.translations } }
                  : {})
              },
              ...(option.aliases
                ? {
                    aliases: [...new Set(
                      option.aliases
                        .map(item => required(
                          item,
                          "FOUNDATION_OBJECT_FIELD_ENUM_ALIAS_INVALID"
                        ))
                    )]
                  }
                : {})
            }))
          }
        : {}),
      ...(field.applicability
        ? {
            applicability: {
              ...(normalizedQualifierRecord(
                field.applicability.qualifiers,
                "FOUNDATION_OBJECT_FIELD_QUALIFIER_DIMENSION_INVALID",
                "FOUNDATION_OBJECT_FIELD_QUALIFIER_VALUE_INVALID"
              )
                ? {
                    qualifiers: normalizedQualifierRecord(
                      field.applicability.qualifiers,
                      "FOUNDATION_OBJECT_FIELD_QUALIFIER_DIMENSION_INVALID",
                      "FOUNDATION_OBJECT_FIELD_QUALIFIER_VALUE_INVALID"
                    )
                  }
                : {}),
              ...(field.applicability.relationshipRoles
                ? {
                    relationshipRoles: [...new Set(
                      field.applicability.relationshipRoles.map(role =>
                        required(
                          role,
                          "FOUNDATION_OBJECT_FIELD_RELATIONSHIP_ROLE_INVALID"
                        ).toUpperCase()
                      )
                    )].sort()
                  }
                : {})
            }
          }
        : {}),
      ...(field.destination
        ? {
            destination: {
              kind: field.destination.kind,
              resourceType: required(
                field.destination.resourceType,
                "FOUNDATION_OBJECT_FIELD_DESTINATION_RESOURCE_TYPE_REQUIRED"
              ),
              fieldPath: required(
                field.destination.fieldPath,
                "FOUNDATION_OBJECT_FIELD_DESTINATION_FIELD_PATH_REQUIRED"
              ),
              cardinality: field.destination.cardinality,
              ...(field.destination.relationshipRole
                ? {
                    relationshipRole: required(
                      field.destination.relationshipRole,
                      "FOUNDATION_OBJECT_FIELD_DESTINATION_ROLE_INVALID"
                    ).toUpperCase()
                  }
                : {}),
              ...(field.destination.groupId
                ? {
                    groupId: required(
                      field.destination.groupId,
                      "FOUNDATION_OBJECT_FIELD_DESTINATION_GROUP_INVALID"
                    )
                  }
                : {})
            }
          }
        : {})
    };
  });
  return {
    contractVersion: "0.1.0",
    objectType: descriptor.objectType,
    ownerPackageId: descriptor.ownerPackageId,
    schemaRef: required(
      value.schemaRef,
      "FOUNDATION_OBJECT_CORE_SCHEMA_REF_REQUIRED"
    ),
    fields
  };
}

function extensionApplicabilityApplies(
  definition: ObjectExtensionDefinitionV010,
  activeRoles: Set<string>,
  activeQualifiers: Map<string, Set<string>>
): boolean {
  const requiredRoles = definition.applicability?.relationshipRoles ?? [];
  if (
    requiredRoles.length > 0
    && !requiredRoles.some(role => activeRoles.has(role.toUpperCase()))
  ) {
    return false;
  }
  return qualifiersApply(
    definition.applicability?.qualifiers,
    activeQualifiers
  );
}

function coreFieldApplicabilityApplies(
  field: FoundationObjectFieldDefinitionV010,
  activeRoles: Set<string>,
  activeQualifiers: Map<string, Set<string>>
): boolean {
  const requiredRoles = field.applicability?.relationshipRoles ?? [];
  if (
    requiredRoles.length > 0
    && !requiredRoles.some(role => activeRoles.has(role.toUpperCase()))
  ) {
    return false;
  }
  return qualifiersApply(field.applicability?.qualifiers, activeQualifiers);
}

function effectiveField(
  field: FoundationObjectFieldDefinitionV010,
  source: "CORE" | "ENTERPRISE_EXTENSION",
  locale: string,
  authorize: FoundationObjectFieldAuthorizationV010,
  input?: {
    extensionId?: string;
    readCapability?: string;
    writeCapability?: string;
  }
): EffectiveFoundationObjectFieldV010 {
  const authority = authorize({
    fieldId: field.fieldId,
    source,
    ...(input?.readCapability
      ? { readCapability: input.readCapability }
      : {}),
    ...(input?.writeCapability
      ? { writeCapability: input.writeCapability }
      : {})
  });
  return {
    ...field,
    source,
    ...(input?.extensionId ? { extensionId: input.extensionId } : {}),
    resolvedLabel: localizedTextV010(field.label, locale),
    ...(field.description
      ? { resolvedDescription: localizedTextV010(field.description, locale) }
      : {}),
    readable: Boolean(authority.readable),
    writable: !field.readOnly && Boolean(authority.writable)
  };
}

export function compileEffectiveObjectSchemaV010(
  input: CompileEffectiveObjectSchemaInputV010
): EffectiveObjectSchemaV010 {
  const descriptor = assertFoundationObjectDescriptorV010(input.descriptor);
  const core = assertCoreSchema(input.coreSchema, descriptor);
  const locale = input.locale?.trim() || "en";
  const applicabilityMode = input.applicabilityMode ?? "EFFECTIVE";
  const activeRoles = new Set(
    (input.activeRelationshipRoles ?? []).map(role =>
      required(role, "FOUNDATION_OBJECT_RELATIONSHIP_ROLE_INVALID").toUpperCase()
    )
  );
  const activeQualifiers = activeQualifierMap(input.activeQualifiers);
  const activeQualifierRecord = qualifierSnapshot(activeQualifiers);
  const authorize = input.authorizeField ?? (() => ({
    readable: true,
    writable: true
  }));
  const slots = new Map(
    descriptor.extensionSlots.map(slot => [slot.slotId, slot])
  );

  const coreFields = core.fields
    .filter(field =>
      applicabilityMode === "DISCOVERY"
      || coreFieldApplicabilityApplies(
        field,
        activeRoles,
        activeQualifiers
      )
    )
    .map(field =>
      effectiveField(field, "CORE", locale, authorize)
    );

  const extensionFields = [...(input.extensions ?? [])]
    .map(assertObjectExtensionDefinitionV010)
    .filter(definition => definition.targetObjectType === descriptor.objectType)
    .filter(definition =>
      applicabilityMode === "DISCOVERY"
      || extensionApplicabilityApplies(
        definition,
        activeRoles,
        activeQualifiers
      )
    )
    .map(definition => {
      const slot = slots.get(definition.targetSlot);
      if (!slot) throw new Error("OBJECT_EXTENSION_TARGET_SLOT_UNKNOWN");
      if (!slot.allowsEnterpriseExtensions) {
        throw new Error("OBJECT_EXTENSION_TARGET_SLOT_CLOSED");
      }
      const surfaces = new Set(definition.surfaces);
      if (definition.importable) surfaces.add("IMPORT");
      if (definition.exportable) surfaces.add("EXPORT");
      if (definition.searchable) surfaces.add("FILTER");
      if (definition.agentReadable) surfaces.add("AGENT_READ");
      if (definition.agentWritable) surfaces.add("AGENT_WRITE");
      const field: FoundationObjectFieldDefinitionV010 = {
        fieldId: definition.fieldId,
        slotId: definition.targetSlot,
        semanticType: definition.semanticType,
        valueType: definition.valueType,
        control: definition.control ?? defaultControl(definition.valueType),
        label: definition.label,
        ...(definition.description
          ? { description: definition.description }
          : {}),
        required: definition.required,
        order: definition.order,
        surfaces: [...surfaces],
        ...(definition.applicability
          ? { applicability: definition.applicability }
          : {}),
        ...(definition.enumOptions
          ? { enumOptions: definition.enumOptions }
          : {})
      };
      return effectiveField(
        field,
        "ENTERPRISE_EXTENSION",
        locale,
        authorize,
        {
          extensionId: definition.extensionId,
          ...(definition.permissions?.readCapability
            ? { readCapability: definition.permissions.readCapability }
            : {}),
          ...(definition.permissions?.writeCapability
            ? { writeCapability: definition.permissions.writeCapability }
            : {})
        }
      );
    });

  const seen = new Set<string>();
  for (const field of [...coreFields, ...extensionFields]) {
    if (seen.has(field.fieldId)) {
      throw new Error("EFFECTIVE_OBJECT_FIELD_ID_COLLISION");
    }
    seen.add(field.fieldId);
  }

  const slotOrder = new Map(
    descriptor.extensionSlots.map((slot, index) => [slot.slotId, index])
  );
  const fields = [...coreFields, ...extensionFields]
    .filter(field => field.readable)
    .sort((a, b) =>
      (slotOrder.get(a.slotId) ?? Number.MAX_SAFE_INTEGER)
        - (slotOrder.get(b.slotId) ?? Number.MAX_SAFE_INTEGER)
      || a.order - b.order
      || a.fieldId.localeCompare(b.fieldId)
    );

  return {
    contractVersion: "0.1.0",
    objectType: descriptor.objectType,
    ownerPackageId: descriptor.ownerPackageId,
    baseSchemaRef: core.schemaRef,
    locale,
    activeRelationshipRoles: [...activeRoles].sort(),
    ...(activeQualifierRecord
      ? { activeQualifiers: activeQualifierRecord }
      : {}),
    fields
  };
}
