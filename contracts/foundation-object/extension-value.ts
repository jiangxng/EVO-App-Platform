export type ObjectExtensionScalarValueV010 =
  | string
  | number
  | boolean
  | null;

export interface ObjectExtensionTargetRefV010 {
  objectType: string;
  objectId: string;
  slot: string;
}

export interface ObjectExtensionValueSetV010 {
  contractVersion: "0.1.0";
  targetRef: ObjectExtensionTargetRefV010;
  namespace: string;
  values: Record<string, ObjectExtensionScalarValueV010>;
  provenance?: {
    source: "MANUAL" | "IMPORT" | "MIGRATION" | "AGENT";
    sourceRef?: string;
  };
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

export function assertObjectExtensionValueSetV010(
  value: ObjectExtensionValueSetV010
): ObjectExtensionValueSetV010 {
  if (value?.contractVersion !== "0.1.0") {
    throw new Error("OBJECT_EXTENSION_VALUE_CONTRACT_VERSION_INVALID");
  }
  if (
    !value.targetRef
    || typeof value.targetRef !== "object"
  ) {
    throw new Error("OBJECT_EXTENSION_VALUE_TARGET_REQUIRED");
  }
  const normalizedValues: Record<string, ObjectExtensionScalarValueV010> = {};
  for (const [key, scalar] of Object.entries(value.values ?? {})) {
    const fieldId = required(key, "OBJECT_EXTENSION_VALUE_FIELD_ID_REQUIRED");
    if (
      scalar !== null
      && typeof scalar !== "string"
      && typeof scalar !== "number"
      && typeof scalar !== "boolean"
    ) {
      throw new Error("OBJECT_EXTENSION_VALUE_SCALAR_INVALID");
    }
    normalizedValues[fieldId] = scalar;
  }
  return {
    contractVersion: "0.1.0",
    targetRef: {
      objectType: required(
        value.targetRef.objectType,
        "OBJECT_EXTENSION_VALUE_OBJECT_TYPE_REQUIRED"
      ),
      objectId: required(
        value.targetRef.objectId,
        "OBJECT_EXTENSION_VALUE_OBJECT_ID_REQUIRED"
      ),
      slot: required(
        value.targetRef.slot,
        "OBJECT_EXTENSION_VALUE_SLOT_REQUIRED"
      )
    },
    namespace: required(
      value.namespace,
      "OBJECT_EXTENSION_VALUE_NAMESPACE_REQUIRED"
    ),
    values: normalizedValues,
    ...(value.provenance
      ? {
          provenance: {
            source: value.provenance.source,
            ...(value.provenance.sourceRef?.trim()
              ? { sourceRef: value.provenance.sourceRef.trim() }
              : {})
          }
        }
      : {})
  };
}
