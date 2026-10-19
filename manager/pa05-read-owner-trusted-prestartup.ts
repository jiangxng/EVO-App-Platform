import type {AppManagerService} from "./service.js";
import type {PlatformSnapshotV010} from "../contracts/package.js";
import type {
  AuthorizationProviderV010,
  IdentitySessionV010,
  RequestIdentitySessionProviderV010,
  SecretsResolverV010
} from "../contracts/platform-services.js";
import {createPa05ReadLifecyclePgAuthorityV010} from "./pa05-read-owner-lifecycle-pg.js";
import {recoverPa05ReadOwnerPrestartupUninstallV010} from "./pa05-read-owner-prestartup-recovery.js";

/**
 * PA05 E01J4G: opt-in, Host-internal operator trust composition for J4F.
 * NO CLI/HTTP/startup activation. Provider instances MUST be supplied by a
 * trusted environment; this module does not provision or validate an IdP,
 * DBA roles, PKI, production credentials or distributed lifecycle consensus.
 */
export async function recoverPa05TrustedPrestartupUninstallV010(input: {
  mode: "OPT_IN";
  hostId: string;
  schema: string;
  manager: Pick<AppManagerService,
    "getSnapshot"|"planDisable"|"planUninstall"|"disable"|"uninstall">;
  bearerToken: string;
  sessionProvider: RequestIdentitySessionProviderV010;
  authorizationProvider: AuthorizationProviderV010;
  secretsProvider: SecretsResolverV010;
  audit(event: {
    stage: "AUTHORIZED" | "COMPLETED";
    principalId: string;
    sessionId: string;
    hostId: string;
    operation: "UNINSTALL";
    packageId: "evo-purchase-attention";
  }): Promise<void>;
  now?: () => Date;
}): Promise<PlatformSnapshotV010> {
  // Never accept an environment flag as an operator identity, and never
  // permit an accidentally imported library to run in normal startup.
  if (input?.mode !== "OPT_IN" || !input.manager ||
      !input.sessionProvider?.providerId ||
      !input.authorizationProvider?.providerId ||
      !input.secretsProvider?.providerId ||
      typeof input.audit !== "function" ||
      typeof input.bearerToken !== "string" || !input.bearerToken.trim() ||
      !/^[a-z0-9][a-z0-9_-]{2,79}$/.test(input.hostId ?? "") ||
      !/^[a-z][a-z0-9_]{0,62}$/.test(input.schema ?? "")) {
    throw Error("PA05_J4G_TRUST_CONFIGURATION_INVALID");
  }
  const owner = "evo-purchase-attention" as const;
  const now = input.now ?? (() => new Date());
  let firstSession: IdentitySessionV010 | undefined;
  async function authorized(): Promise<boolean> {
    try {
      // Resolve live on EVERY J4F precheck and J4C local mutation attempt.
      // A cached ALLOW cannot outlive a Provider/session revocation.
      const session = input.sessionProvider.resolve({
        contractVersion: "0.1.0", bearerToken: input.bearerToken
      });
      if (!session || session.contractVersion !== "0.1.0" ||
          !session.sessionId || !session.principal?.subjectId ||
          session.principal.contractVersion !== "0.1.0" ||
          session.principal.actorType !== "HUMAN" ||
          !session.principal.identityProviderId ||
          !session.issuedAt || !session.expiresAt) return false;
      const time = now().getTime();
      const issued = Date.parse(session.issuedAt);
      const expires = Date.parse(session.expiresAt);
      if (!Number.isFinite(time) || !Number.isFinite(issued) ||
          !Number.isFinite(expires) ||
          issued > time || expires <= time || expires <= issued) return false;
      if (firstSession &&
          (session.sessionId !== firstSession.sessionId ||
           session.principal.subjectId !== firstSession.principal.subjectId ||
           session.principal.identityProviderId !== firstSession.principal.identityProviderId))
        return false;
      const decision = await input.authorizationProvider.check({
        contractVersion: "0.1.0",
        principal: session.principal,
        scope: {contractVersion: "0.1.0"},
        action: "host.plugin.lifecycle.prestartup-uninstall-recovery",
        resource: {
          type: "plugin-package", id: owner,
          attributes: {
            effect: "READ", operation: "UNINSTALL",
            admission: "PRESTART_RECOVERY", hostId: input.hostId
          }
        }
      });
      if (decision?.contractVersion !== "0.1.0" ||
          decision.allowed !== true ||
          decision.policyProviderId !== input.authorizationProvider.providerId ||
          (decision.obligations?.length ?? 0) !== 0) return false;
      firstSession ??= session;
      return true;
    } catch {
      return false;
    }
  }

  if (!(await authorized()) || !firstSession)
    throw Error("PA05_J4G_OPERATOR_DENIED");

  // Mandatory pre-mutation audit: an unavailable audit sink cannot silently
  // permit potentially destructive local JSON reconciliation.
  try {
    await input.audit({
      stage: "AUTHORIZED", principalId: firstSession.principal.subjectId,
      sessionId: firstSession.sessionId, hostId: input.hostId,
      operation: "UNINSTALL", packageId: owner
    });
  } catch {
    throw Error("PA05_J4G_AUDIT_UNAVAILABLE");
  }

  let authority: ReturnType<typeof createPa05ReadLifecyclePgAuthorityV010> | undefined;
  try {
    // Resolve only after genuine identity + policy checks. Database URL is
    // never logged/returned. This reference is deliberately scoped per Host.
    const connectionString = await input.secretsProvider.resolve({
      contractVersion: "0.1.0",
      namespace: "pa05-read-lifecycle",
      key: "operatorDatabaseUrl",
      scope: "INSTALLATION",
      scopeId: input.hostId
    });
    authority = createPa05ReadLifecyclePgAuthorityV010({
      connectionString, schema: input.schema, hostId: input.hostId
    });
    const snapshot = await recoverPa05ReadOwnerPrestartupUninstallV010({
      manager: input.manager,
      authority,
      authorizeHostOperator: authorized
    });
    await input.audit({
      stage: "COMPLETED", principalId: firstSession.principal.subjectId,
      sessionId: firstSession.sessionId, hostId: input.hostId,
      operation: "UNINSTALL", packageId: owner
    });
    return snapshot;
  } catch {
    // The central fence may have COMMITTED before local JSON or final audit
    // failed: this is an unknown/recoverable result, not permission to retry
    // blindly or roll back central revocation.
    throw Error("PA05_J4G_RECOVERY_DENIED_OR_UNKNOWN");
  } finally {
    await authority?.close().catch(() => {});
  }
}
