import type {
  ManagedSecretsProviderV010,
  SecretReferenceV010
} from "../../contracts/platform-services.js";
import type { SecretStoreV010 } from "../../manager/secret-store.js";
import { HOST_ENCRYPTED_SECRETS_PROVIDER_ID } from "./package.js";

export function createHostEncryptedSecretsProviderV010(
  store: SecretStoreV010
): ManagedSecretsProviderV010 {
  return {
    providerId: HOST_ENCRYPTED_SECRETS_PROVIDER_ID,
    resolve(reference: SecretReferenceV010) {
      return store.resolve(reference);
    },
    describe(reference: SecretReferenceV010) {
      return store.describe(reference);
    },
    put(reference: SecretReferenceV010, value: string) {
      return store.put(reference, value);
    },
    remove(reference: SecretReferenceV010) {
      store.remove(reference);
    }
  };
}

export function createHostEncryptedSecretsHealthProbeV010(
  store: SecretStoreV010
) {
  return () => {
    store.listMetadata();
    return {
      state: "HEALTHY" as const,
      message: "Encrypted Host secret store is available."
    };
  };
}
