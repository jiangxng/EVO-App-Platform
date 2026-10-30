import type {
  FoundationObjectManagedReferenceV010
} from "../../contracts/foundation-object/schema.js";
import type {
  BusinessDictionaryRepositoryV010
} from "../../apps/business-dictionary/repository.js";
import type {
  OrganizationRepositoryV010
} from "../../apps/organization/repository.js";
import type {
  PersonnelRepositoryV010
} from "../../apps/personnel/repository.js";

/**
 * Host-composed reference projection over existing owning plugins, NOT a
 * second model or source-of-truth. Always use the authenticated enterprise
 * context and the CURRENT published version, never an unverified UI claim.
 */
export function createManagedReferencePublicationResolverV010(input: {
  contextId: string;
  businessDictionary?: {
    isActive(): boolean;
    reader: Pick<BusinessDictionaryRepositoryV010, "getEffective">;
  };
  organization?: {
    isActive(): boolean;
    reader: Pick<OrganizationRepositoryV010, "getEffective">;
  };
  personnel?: {
    isActive(): boolean;
    reader: Pick<PersonnelRepositoryV010, "getEffective">;
  };
}): (request: {
  fieldId: string;
  reference: FoundationObjectManagedReferenceV010;
}) => boolean {
  const contextId = input.contextId.trim();
  if (!contextId) throw new Error("FOUNDATION_REFERENCE_ENTERPRISE_CONTEXT_REQUIRED");
  return ({ reference }) => {
    switch (reference.sourceKind) {
      case "BUSINESS_DICTIONARY":
        return Boolean(input.businessDictionary?.isActive()
          && input.businessDictionary.reader.getEffective(
            contextId, reference.sourceId
          )?.version === reference.expectedVersion);
      case "ORGANIZATION":
        return Boolean(input.organization?.isActive()
          && input.organization.reader.getEffective(
            contextId, reference.sourceId
          )?.version === reference.expectedVersion);
      case "PERSONNEL":
        return Boolean(input.personnel?.isActive()
          && input.personnel.reader.getEffective(
            contextId, reference.sourceId
          )?.version === reference.expectedVersion);
      default:
        return false;
    }
  };
}
