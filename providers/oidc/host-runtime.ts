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

  let clientSecret: string | undefined;
  if (input.secrets) {
    const reference = genericOidcClientSecretReferenceV010();
    const status = await input.secrets.describe(reference);
    if (status.configured) {
      const value = (await input.secrets.resolve(reference)).trim();
      if (!value) throw new Error("OIDC_CLIENT_SECRET_EMPTY");
      clientSecret = value;
    }
  }

  const scopes = stringSetting(input.settings, "scopes");
  const options: GenericOidcProviderOptionsV010 = {
    issuer,
    clientId,
    ...(clientSecret ? { clientSecret } : {}),
    ...(scopes ? { scopes } : {}),
    ...(input.fetchImpl ? { fetchImpl: input.fetchImpl } : {})
  };

  input.registry.replace<IdentityAuthenticationProviderV010>(
    GENERIC_OIDC_PROVIDER_ID,
    createGenericOidcIdentityAuthenticationProviderV010(options)
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
