import type {
  FoundationObjectDescriptorV010
} from "../../contracts/foundation-object/descriptor.js";
import type {
  FoundationObjectCoreSchemaV010,
  FoundationObjectFieldSurfaceV010
} from "../../contracts/foundation-object/schema.js";
import {
  compileEffectiveObjectSchemaV010
} from "../schema-compiler/index.js";

export interface FoundationObjectConformanceReportV010 {
  contractVersion: "0.1.0";
  objectType: string;
  ownerPackageId: string;
  schemaRef: string;
  fieldCount: number;
  extensionSlotCount: number;
  surfaces: FoundationObjectFieldSurfaceV010[];
}

export function assertFoundationObjectConformanceV010(input: {
  descriptor: FoundationObjectDescriptorV010;
  coreSchema: FoundationObjectCoreSchemaV010;
}): FoundationObjectConformanceReportV010 {
  if (input.descriptor.identitySchemaRef !== input.coreSchema.schemaRef) {
    throw new Error("FOUNDATION_OBJECT_IDENTITY_SCHEMA_REF_MISMATCH");
  }
  const first = compileEffectiveObjectSchemaV010({
    descriptor: input.descriptor,
    coreSchema: input.coreSchema
  });
  const second = compileEffectiveObjectSchemaV010({
    descriptor: structuredClone(input.descriptor),
    coreSchema: structuredClone(input.coreSchema)
  });
  if (JSON.stringify(first) !== JSON.stringify(second)) {
    throw new Error("FOUNDATION_OBJECT_SCHEMA_NON_DETERMINISTIC");
  }
  const surfaces = [...new Set(
    first.fields.flatMap(field => field.surfaces)
  )].sort();
  return {
    contractVersion: "0.1.0",
    objectType: first.objectType,
    ownerPackageId: first.ownerPackageId,
    schemaRef: first.baseSchemaRef,
    fieldCount: first.fields.length,
    extensionSlotCount: input.descriptor.extensionSlots.length,
    surfaces
  };
}
