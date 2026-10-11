export interface FoundationObjectSlotDefinitionV010 {
  slotId: string;
  label: string;
  allowsEnterpriseExtensions: boolean;
}

export interface FoundationObjectDescriptorV010 {
  contractVersion: "0.1.0";
  objectType: string;
  ownerPackageId: string;
  identitySchemaRef: string;
  extensionSlots: FoundationObjectSlotDefinitionV010[];
  commands: string[];
  queries: string[];
  importTargets: string[];
  projectionSources: string[];
  permissionCapabilities: string[];
  agentOperations: string[];
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

export function assertFoundationObjectDescriptorV010(
  value: FoundationObjectDescriptorV010
): FoundationObjectDescriptorV010 {
  if (value?.contractVersion !== "0.1.0") {
    throw new Error("FOUNDATION_OBJECT_DESCRIPTOR_VERSION_INVALID");
  }
  const seen = new Set<string>();
  const slots = value.extensionSlots.map(slot => {
    const slotId = required(slot.slotId, "FOUNDATION_OBJECT_SLOT_ID_REQUIRED");
    if (seen.has(slotId)) throw new Error("FOUNDATION_OBJECT_SLOT_DUPLICATE");
    seen.add(slotId);
    return {
      slotId,
      label: required(slot.label, "FOUNDATION_OBJECT_SLOT_LABEL_REQUIRED"),
      allowsEnterpriseExtensions: Boolean(slot.allowsEnterpriseExtensions)
    };
  });
  return {
    contractVersion: "0.1.0",
    objectType: required(value.objectType, "FOUNDATION_OBJECT_TYPE_REQUIRED"),
    ownerPackageId: required(
      value.ownerPackageId,
      "FOUNDATION_OBJECT_OWNER_PACKAGE_REQUIRED"
    ),
    identitySchemaRef: required(
      value.identitySchemaRef,
      "FOUNDATION_OBJECT_IDENTITY_SCHEMA_REQUIRED"
    ),
    extensionSlots: slots,
    commands: [...new Set(value.commands.map(item =>
      required(item, "FOUNDATION_OBJECT_COMMAND_INVALID")
    ))].sort(),
    queries: [...new Set(value.queries.map(item =>
      required(item, "FOUNDATION_OBJECT_QUERY_INVALID")
    ))].sort(),
    importTargets: [...new Set(value.importTargets.map(item =>
      required(item, "FOUNDATION_OBJECT_IMPORT_TARGET_INVALID")
    ))].sort(),
    projectionSources: [...new Set(value.projectionSources.map(item =>
      required(item, "FOUNDATION_OBJECT_PROJECTION_SOURCE_INVALID")
    ))].sort(),
    permissionCapabilities: [...new Set(value.permissionCapabilities.map(item =>
      required(item, "FOUNDATION_OBJECT_PERMISSION_CAPABILITY_INVALID")
    ))].sort(),
    agentOperations: [...new Set(value.agentOperations.map(item =>
      required(item, "FOUNDATION_OBJECT_AGENT_OPERATION_INVALID")
    ))].sort()
  };
}
