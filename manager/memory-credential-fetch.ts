import type {ManagedSecretsProviderV010, SecretReferenceV010} from "../contracts/platform-services.js";

/** Request-bound optional tokens for the existing semantic, DLP and EC fetch ports.
 * Unconfigured is anonymous; unavailable/corrupt Secrets never falls back.
 */
export function createMemoryCredentialFetchV010(input: {
  reference: SecretReferenceV010;
  resolveSecrets(): ManagedSecretsProviderV010 | undefined;
  isCurrent(): boolean;
  epoch(): number;
  fetchImpl?: typeof fetch;
}): typeof fetch {
  const fetchImpl = input.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("MEMORY_PROVIDER_FETCH_UNAVAILABLE");
  return async (url, init) => {
    const epoch = input.epoch();
    const check = () => {
      if (!input.isCurrent() || input.epoch() !== epoch) {
        throw new Error("MEMORY_CREDENTIAL_CONTEXT_CHANGED");
      }
      init?.signal?.throwIfAborted();
    };
    check();
    const secrets = input.resolveSecrets();
    if (!secrets) throw new Error("SECRETS_PROVIDER_REQUIRED");
    const status = await secrets.describe(input.reference);
    check();
    if (input.resolveSecrets() !== secrets) throw new Error("MEMORY_CREDENTIAL_CONTEXT_CHANGED");
    let token: string | undefined;
    if (status.configured) {
      token = (await secrets.resolve(input.reference)).trim();
      check();
      if (!token) throw new Error(`SECRET_VALUE_EMPTY: ${input.reference.namespace}/${input.reference.key}`);
    }
    check();
    if (input.resolveSecrets() !== secrets) throw new Error("MEMORY_CREDENTIAL_CONTEXT_CHANGED");
    const headers = new Headers(init?.headers);
    headers.delete("authorization");
    if (token) headers.set("authorization", `Bearer ${token}`);
    return fetchImpl(url, {...init, headers});
  };
}
