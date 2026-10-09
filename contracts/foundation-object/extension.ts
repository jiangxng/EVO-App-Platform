import type {
  FoundationObjectEnumOptionV010,
  FoundationObjectFieldControlV010,
  FoundationObjectFieldSurfaceV010,
  FoundationObjectLocalizedTextV010,
  FoundationObjectValueTypeV010
} from "./schema.js";

export interface ObjectExtensionApplicabilityV010 {
  /**
   * Object-neutral applicability dimensions. Values are semantic codes and
   * are normalized case-insensitively by the Foundation Object compiler.
   */
  qualifiers?: Record<string, string[]>;
  /**
   * Counterparty v0.1 compatibility alias. New object types must use
   * qualifiers instead of introducing another object-specific key.
   */
  relationshipRoles?: string[];
}

export interface ObjectExtensionDefinitionV010 {
  contractVersion: "0.1.0";
  extensionId: string;
  targetObjectType: string;
  targetSlot: string;
  namespace: string;
  fieldId: string;
  semanticType: string;
  valueType: FoundationObjectValueTypeV010;
  label: FoundationObjectLocalizedTextV010;
  description?: FoundationObjectLocalizedTextV010;
  required: boolean;
  order: number;
  applicability?: ObjectExtensionApplicabilityV010;
  control?: FoundationObjectFieldControlV010;
  enumOptions?: FoundationObjectEnumOptionV010[];
  surfaces: FoundationObjectFieldSurfaceV010[];
  permissions?: {
    readCapability?: string;
    writeCapability?: string;
  };
  searchable?: boolean;
  importable?: boolean;
  exportable?: boolean;
  agentReadable?: boolean;
  agentWritable?: boolean;
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

export function assertObjectExtensionDefinitionV010(
  value: ObjectExtensionDefinitionV010
): ObjectExtensionDefinitionV010 {
  if (value?.contractVersion !== "0.1.0") {
    throw new Error("OBJECT_EXTENSION_CONTRACT_VERSION_INVALID");
  }
  const roles = value.applicability?.relationshipRoles
    ?.map(item => required(item, "OBJECT_EXTENSION_ROLE_INVALID").toUpperCase());
  const qualifierEntries = Object.entries(
    value.applicability?.qualifiers ?? {}
  )
    .map(([dimension, values]) => [
      required(dimension, "OBJECT_EXTENSION_QUALIFIER_DIMENSION_INVALID")
        .toLocaleLowerCase(),
      [...new Set(values.map(item =>
        required(item, "OBJECT_EXTENSION_QUALIFIER_VALUE_INVALID")
          .toLocaleUpperCase()
      ))].sort()
    ] as const)
    .sort(([a], [b]) => a.localeCompare(b));
  const qualifiers = qualifierEntries.length > 0
    ? Object.fromEntries(qualifierEntries)
    : undefined;
  const enumOptions = value.enumOptions?.map(option => ({
    value: required(option.value, "OBJECT_EXTENSION_ENUM_VALUE_REQUIRED"),
    label: {
      default: required(
        option.label.default,
        "OBJECT_EXTENSION_ENUM_LABEL_REQUIRED"
      ),
      ...(option.label.translations
        ? { translations: { ...option.label.translations } }
        : {})
    },
    ...(option.aliases
      ? {
          aliases: [...new Set(
            option.aliases.map(item =>
              required(item, "OBJECT_EXTENSION_ENUM_ALIAS_INVALID")
            )
          )]
        }
      : {})
  }));
  if (value.valueType === "ENUM" && (!enumOptions || enumOptions.length === 0)) {
    throw new Error("OBJECT_EXTENSION_ENUM_OPTIONS_REQUIRED");
  }
  return {
    contractVersion: "0.1.0",
    extensionId: required(value.extensionId, "OBJECT_EXTENSION_ID_REQUIRED"),
    targetObjectType: required(
      value.targetObjectType,
      "OBJECT_EXTENSION_TARGET_OBJECT_REQUIRED"
    ),
    targetSlot: required(
      value.targetSlot,
      "OBJECT_EXTENSION_TARGET_SLOT_REQUIRED"
    ),
    namespace: required(value.namespace, "OBJECT_EXTENSION_NAMESPACE_REQUIRED"),
    fieldId: required(value.fieldId, "OBJECT_EXTENSION_FIELD_ID_REQUIRED"),
    semanticType: required(
      value.semanticType,
      "OBJECT_EXTENSION_SEMANTIC_TYPE_REQUIRED"
    ),
    valueType: value.valueType,
    label: {
      default: required(
        value.label.default,
        "OBJECT_EXTENSION_LABEL_REQUIRED"
      ),
      ...(value.label.translations
        ? { translations: { ...value.label.translations } }
        : {})
    },
    ...(value.description
      ? {
          description: {
            default: required(
              value.description.default,
              "OBJECT_EXTENSION_DESCRIPTION_REQUIRED"
            ),
            ...(value.description.translations
              ? { translations: { ...value.description.translations } }
              : {})
          }
        }
      : {}),
    required: Boolean(value.required),
    order: Number.isFinite(value.order) ? value.order : 1000,
    ...((roles && roles.length > 0) || qualifiers
      ? {
          applicability: {
            ...(qualifiers ? { qualifiers } : {}),
            ...(roles && roles.length > 0
              ? { relationshipRoles: [...new Set(roles)].sort() }
              : {})
          }
        }
      : {}),
    ...(value.control ? { control: value.control } : {}),
    ...(enumOptions ? { enumOptions } : {}),
    surfaces: [...new Set(value.surfaces)].sort(),
    ...(value.permissions ? { permissions: { ...value.permissions } } : {}),
    searchable: Boolean(value.searchable),
    importable: Boolean(value.importable),
    exportable: Boolean(value.exportable),
    agentReadable: Boolean(value.agentReadable),
    agentWritable: Boolean(value.agentWritable)
  };
}
