import type {ManagedSecretsProviderV010, SecretReferenceV010} from "../contracts/platform-services.js";

/** Bind credentials at the existing Provider fetch boundary, not discovery.
 * No credential, pending request or connection is cached by this adapter.
 */
export function createLlmCredentialFetchV010(input: {
  reference: SecretReferenceV010;
  resolveSecrets(): ManagedSecretsProviderV010 | undefined;
  legacyKey(): string | undefined;
  isCurrent(): boolean;
  activationEpoch(): number;
  onSecretError(error: unknown): void;
  fetchImpl?: typeof fetch;
}): typeof fetch {
  const fetchImpl = input.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("LLM_PROVIDER_FETCH_UNAVAILABLE");
  return async (url, init) => {
    const epoch = input.activationEpoch();
    const check = () => {
      if (!input.isCurrent() || input.activationEpoch() !== epoch) {
        throw new Error("LLM_CREDENTIAL_CONTEXT_CHANGED");
      }
      init?.signal?.throwIfAborted();
    };
    check();
    let apiKey: string | undefined;
    try {
      const secrets = input.resolveSecrets();
      if (secrets) {
        const status = await secrets.describe(input.reference);
        check();
        if (status.configured) {
          apiKey = (await secrets.resolve(input.reference)).trim();
          check();
        }
      }
    } catch (error) {
      // Qualification/abort failures cannot fall back to an environment key.
      check();
      input.onSecretError(error);
    }
    apiKey ||= input.legacyKey()?.trim();
    check();
    if (!apiKey) throw new Error("LLM_PROVIDER_API_KEY_REQUIRED");
    const headers = new Headers(init?.headers);
    headers.set("authorization", `Bearer ${apiKey}`);
    return fetchImpl(url, {...init, headers});
  };
}
