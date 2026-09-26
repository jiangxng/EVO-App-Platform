import type {
  ActiveContextRefV010,
  EnterpriseContextRelationshipProviderV010,
  PersonalContextV010,
  PlatformPrincipalV010
} from "../contracts/platform-services.js";

export function sameContextRefV010(
  left: ActiveContextRefV010,
  right: ActiveContextRefV010
): boolean {
  return left.kind === right.kind
    && left.contextId === right.contextId
    && (
      left.kind !== "ENTERPRISE"
      || right.kind !== "ENTERPRISE"
      || left.enterpriseId === right.enterpriseId
    );
}

export function requireContextMemoryWriteAuthorityV010(input: {
  principal: PlatformPrincipalV010;
  personalContext: PersonalContextV010 | undefined;
  targetContext: ActiveContextRefV010;
  relationshipProvider: EnterpriseContextRelationshipProviderV010 | undefined;
}): void {
  const { principal, personalContext, targetContext, relationshipProvider } = input;

  if (targetContext.kind === "PERSONAL") {
    if (
      !personalContext
      || personalContext.contextId !== targetContext.contextId
      || personalContext.ownerSubjectId !== principal.subjectId
    ) {
      throw new Error("PERSONAL_CONTEXT_MEMORY_OWNER_REQUIRED");
    }
    return;
  }

  const writable = relationshipProvider
    ?.listForPrincipal(principal)
    .some(item =>
      item.contextId === targetContext.contextId
      && item.state === "ACTIVE"
      && ["OWNER", "ADMIN", "MEMBER"].includes(item.kind)
    ) ?? false;

  if (!writable) {
    throw new Error("ENTERPRISE_CONTEXT_MEMORY_WRITE_RELATIONSHIP_REQUIRED");
  }
}
