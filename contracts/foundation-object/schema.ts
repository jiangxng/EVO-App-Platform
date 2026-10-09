export type FoundationObjectValueTypeV010 =
  | "STRING"
  | "NUMBER"
  | "BOOLEAN"
  | "DATE"
  | "ENUM";

export type FoundationObjectFieldSurfaceV010 =
  | "CREATE"
  | "EDIT"
  | "DETAIL"
  | "LIST"
  | "IMPORT"
  | "EXPORT"
  | "FILTER"
  | "AGENT_READ"
  | "AGENT_WRITE";

export type FoundationObjectFieldControlV010 =
  | "text"
  | "number"
  | "checkbox"
  | "date"
  | "select";

export interface FoundationObjectLocalizedTextV010 {
  default: string;
  translations?: Record<string, string>;
}

export interface FoundationObjectEnumOptionV010 {
  value: string;
  label: FoundationObjectLocalizedTextV010;
  /**
   * Governed import aliases that are semantically equivalent to this option.
   * Agents may normalize these values without Human review.
   */
  aliases?: string[];
}

export interface FoundationObjectFieldApplicabilityV010 {
  /**
   * The field exists only when at least one of these relationship roles is
   * active for the object/import scenario.
   */
  relationshipRoles?: string[];
}

export type FoundationObjectFieldDestinationKindV010 =
  | "OBJECT_FIELD"
  | "PROFILE_FIELD"
  | "RELATED_RESOURCE_FIELD";

export interface FoundationObjectFieldDestinationV010 {
  kind: FoundationObjectFieldDestinationKindV010;
  /**
   * Semantic resource type owned by the domain plugin.
   * Example: counterparty.profile / counterparty.contact.
   */
  resourceType: string;
  /**
   * Field path inside the semantic destination resource.
   * This is not a database column name.
   */
  fieldPath: string;
  cardinality: "ONE" | "MANY";
  relationshipRole?: string;
  /**
   * Groups several import columns into one related-resource instance.
   * Example: primary-contact name/phone/email.
   */
  groupId?: string;
}

export interface FoundationObjectFieldDefinitionV010 {
  fieldId: string;
  slotId: string;
  semanticType: string;
  valueType: FoundationObjectValueTypeV010;
  control: FoundationObjectFieldControlV010;
  label: FoundationObjectLocalizedTextV010;
  /**
   * Business meaning of the field. This is part of the governed schema
   * contract and is intended for Humans, Agents and integration tooling.
   */
  description?: FoundationObjectLocalizedTextV010;
  required: boolean;
  readOnly?: boolean;
  order: number;
  surfaces: FoundationObjectFieldSurfaceV010[];
  enumOptions?: FoundationObjectEnumOptionV010[];
  applicability?: FoundationObjectFieldApplicabilityV010;
  destination?: FoundationObjectFieldDestinationV010;
}

export interface FoundationObjectCoreSchemaV010 {
  contractVersion: "0.1.0";
  objectType: string;
  ownerPackageId: string;
  schemaRef: string;
  fields: FoundationObjectFieldDefinitionV010[];
}

export type EffectiveFieldSourceV010 =
  | "CORE"
  | "ENTERPRISE_EXTENSION";

export interface EffectiveFoundationObjectFieldV010
  extends FoundationObjectFieldDefinitionV010 {
  source: EffectiveFieldSourceV010;
  extensionId?: string;
  resolvedLabel: string;
  resolvedDescription?: string;
  readable: boolean;
  writable: boolean;
}

export interface EffectiveObjectSchemaV010 {
  contractVersion: "0.1.0";
  objectType: string;
  ownerPackageId: string;
  baseSchemaRef: string;
  locale: string;
  activeRelationshipRoles: string[];
  fields: EffectiveFoundationObjectFieldV010[];
}

export function localizedTextV010(
  text: FoundationObjectLocalizedTextV010,
  locale = "en"
): string {
  const normalized = locale.trim() || "en";
  return text.translations?.[normalized]
    ?? text.translations?.[normalized.toLowerCase()]
    ?? text.default;
}

export function fieldsForSurfaceV010(
  schema: EffectiveObjectSchemaV010,
  surface: FoundationObjectFieldSurfaceV010
): EffectiveFoundationObjectFieldV010[] {
  return schema.fields.filter(field =>
    field.readable && field.surfaces.includes(surface)
  );
}

export function importColumnsFromEffectiveSchemaV010(
  schema: EffectiveObjectSchemaV010
): Array<{
  fieldId: string;
  label: string;
  semanticType: string;
  valueType: FoundationObjectValueTypeV010;
  required: boolean;
  description?: string;
}> {
  return fieldsForSurfaceV010(schema, "IMPORT").map(field => ({
    fieldId: field.fieldId,
    label: field.resolvedLabel,
    semanticType: field.semanticType,
    valueType: field.valueType,
    required: field.required,
    ...(field.resolvedDescription
      ? { description: field.resolvedDescription }
      : {})
  }));
}

export function agentFieldsFromEffectiveSchemaV010(
  schema: EffectiveObjectSchemaV010,
  mode: "READ" | "WRITE"
): Array<{
  fieldId: string;
  semanticType: string;
  valueType: FoundationObjectValueTypeV010;
  required: boolean;
}> {
  const surface = mode === "READ" ? "AGENT_READ" : "AGENT_WRITE";
  return fieldsForSurfaceV010(schema, surface)
    .filter(field => mode === "READ" || field.writable)
    .map(field => ({
      fieldId: field.fieldId,
      semanticType: field.semanticType,
      valueType: field.valueType,
      required: field.required
    }));
}
