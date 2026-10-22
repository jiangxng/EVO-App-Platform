import type {
  IdentityAuthenticationProviderV010,
  ManagedSecretsProviderV010,
  SecretReferenceV010
} from "../../contracts/platform-services.js";
import type { SettingValueV010 } from "../../contracts/package.js";
import type { ProviderRuntimeRegistry } from "../runtime-registry.js";
import {
  createGenericOidcIdentityAuthenticationProviderV010,
  createGenericOidcIdentityHealthProbeV010,
  type GenericOidcProviderOptionsV010
} from "./runtime.js";
import {
  GENERIC_OIDC_PACKAGE_ID,
  GENERIC_OIDC_PROVIDER_ID
} from "./package.js";

export interface GenericOidcRuntimeConfigurationResultV010 {
  configured: boolean;
  providerId: string;
  reason:
    | "READY"
    | "ISSUER_REQUIRED"
    | "CLIENT_ID_REQUIRED";
}

function stringSetting(
  values: Record<string, SettingValueV010>,
  key: string
): string | undefined {
  const value = values[key];
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
}

export function genericOidcClientSecretReferenceV010(): SecretReferenceV010 {
  return {
    contractVersion: "0.1.0",
    namespace: GENERIC_OIDC_PACKAGE_ID,
    key: "clientSecret",
    scope: "INSTALLATION",
    scopeId: "default"
  };
}

export async function configureGenericOidcProviderRuntimeV010(input: {
  settings: Record<string, SettingValueV010>;
  secrets?: ManagedSecretsProviderV010;
  resolveSecrets?: () => ManagedSecretsProviderV010 | undefined;
  isCurrent?: () => boolean;
  epoch?: () => number;
  registry: ProviderRuntimeRegistry;
  fetchImpl?: typeof fetch;
}): Promise<GenericOidcRuntimeConfigurationResultV010> {
  const issuer = stringSetting(input.settings, "issuer");
  if (!issuer) {
    input.registry.remove(GENERIC_OIDC_PROVIDER_ID);
    return {
      configured: false,
      providerId: GENERIC_OIDC_PROVIDER_ID,
      reason: "ISSUER_REQUIRED"
    };
  }

  const clientId = stringSetting(input.settings, "clientId");
  if (!clientId) {
    input.registry.remove(GENERIC_OIDC_PROVIDER_ID);
    return {
      configured: false,
      providerId: GENERIC_OIDC_PROVIDER_ID,
      reason: "CLIENT_ID_REQUIRED"
    };
  }

  let runtime: IdentityAuthenticationProviderV010;
  const resolveSecrets = input.resolveSecrets ?? (() => input.secrets);
  const scopes = stringSetting(input.settings, "scopes");
  const options: GenericOidcProviderOptionsV010 = {
    issuer,
    clientId,
    captureContext() {
      const epoch = input.epoch?.();
      return () => {
        if (input.registry.get(GENERIC_OIDC_PROVIDER_ID) !== runtime
            || input.isCurrent?.() === false || input.epoch?.() !== epoch) {
          throw new Error("OIDC_CONTEXT_CHANGED");
        }
      };
    },
    async resolveClientSecret(signal, checkContext) {
      checkContext();
      signal.throwIfAborted();
      const secrets = resolveSecrets();
      if (!secrets) throw new Error("SECRETS_PROVIDER_REQUIRED");
      const reference = genericOidcClientSecretReferenceV010();
      const check = () => {
        checkContext();
        signal.throwIfAborted();
        if (resolveSecrets() !== secrets) throw new Error("OIDC_CONTEXT_CHANGED");
      };
      const status = await secrets.describe(reference);
      check();
      if (!status.configured) return undefined;
      const value = (await secrets.resolve(reference)).trim();
      check();
      if (!value) throw new Error("OIDC_CLIENT_SECRET_EMPTY");
      return value;
    },
    ...(scopes ? { scopes } : {}),
    ...(input.fetchImpl ? { fetchImpl: input.fetchImpl } : {})
  };

  runtime = createGenericOidcIdentityAuthenticationProviderV010(options);
  input.registry.replace<IdentityAuthenticationProviderV010>(
    GENERIC_OIDC_PROVIDER_ID,
    runtime
  );
  input.registry.setHealthProbe(
    GENERIC_OIDC_PROVIDER_ID,
    createGenericOidcIdentityHealthProbeV010(options)
  );
  input.registry.setHealth(GENERIC_OIDC_PROVIDER_ID, {
    state: "UNKNOWN",
    message:
      "OIDC runtime configuration is complete; external discovery health has not been actively probed.",
    checkedAt: new Date().toISOString()
  });

  return {
    configured: true,
    providerId: GENERIC_OIDC_PROVIDER_ID,
    reason: "READY"
  };
}

