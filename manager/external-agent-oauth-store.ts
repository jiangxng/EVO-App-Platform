import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import type {
  ExternalAgentOAuthAccessTokenV010,
  ExternalAgentOAuthAuthorizationCodeV010,
  ExternalAgentOAuthEventV010,
  ExternalAgentOAuthRefreshTokenV010,
  ExternalAgentOAuthSnapshotV010,
  ExternalAgentOAuthStoreV010
} from "../contracts/external-agent-oauth.js";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function empty(): ExternalAgentOAuthSnapshotV010 {
  return {
    contractVersion: "0.1.0",
    authorizationCodes: [],
    accessTokens: [],
    refreshTokens: [],
    events: []
  };
}

function requireIso(value: string, code: string): number {
  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString() !== value) {
    throw new Error(code);
  }
  return epoch;
}

function unique(values: readonly string[], code: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(code + ": " + value);
    seen.add(value);
  }
}

function validateCode(code: ExternalAgentOAuthAuthorizationCodeV010): void {
  if (
    code.contractVersion !== "0.1.0"
    || !code.codeId.trim()
    || !/^[0-9a-f]{64}$/.test(code.codeHash)
    || !code.oauthClientId.trim()
    || !code.clientId.trim()
    || !code.agentId.trim()
    || !code.grantId.trim()
    || !code.authorizingPrincipalSubjectId.trim()
    || !code.resource.trim()
    || !code.redirectUri.trim()
    || code.scopes.length === 0
    || code.codeChallengeMethod !== "S256"
    || !code.codeChallenge.trim()
  ) {
    throw new Error("EXTERNAL_AGENT_OAUTH_CODE_INVALID");
  }
  unique(code.scopes, "EXTERNAL_AGENT_OAUTH_SCOPE_DUPLICATE");
  if (code.operationIds !== undefined) {
    if (code.operationIds.length === 0) {
      throw new Error("EXTERNAL_AGENT_OAUTH_CODE_OPERATION_CEILING_INVALID");
    }
    unique(
      code.operationIds,
      "EXTERNAL_AGENT_OAUTH_CODE_OPERATION_DUPLICATE"
    );
  }
  const createdAt = requireIso(
    code.createdAt,
    "EXTERNAL_AGENT_OAUTH_CODE_CREATED_AT_INVALID"
  );
  const expiresAt = requireIso(
    code.expiresAt,
    "EXTERNAL_AGENT_OAUTH_CODE_EXPIRES_AT_INVALID"
  );
  if (expiresAt <= createdAt) {
    throw new Error("EXTERNAL_AGENT_OAUTH_CODE_WINDOW_INVALID");
  }
  if (code.consumedAt !== undefined) {
    const consumedAt = requireIso(
      code.consumedAt,
      "EXTERNAL_AGENT_OAUTH_CODE_CONSUMED_AT_INVALID"
    );
    if (consumedAt < createdAt) {
      throw new Error("EXTERNAL_AGENT_OAUTH_CODE_CONSUMED_AT_INVALID");
    }
  }
}

function validateAccessToken(token: ExternalAgentOAuthAccessTokenV010): void {
  if (
    token.contractVersion !== "0.1.0"
    || !token.tokenId.trim()
    || !/^[0-9a-f]{64}$/.test(token.tokenHash)
    || !token.oauthClientId.trim()
    || !token.clientId.trim()
    || !token.agentId.trim()
    || !token.grantId.trim()
    || !token.resource.trim()
    || token.scopes.length === 0
  ) {
    throw new Error("EXTERNAL_AGENT_OAUTH_ACCESS_TOKEN_INVALID");
  }
  unique(token.scopes, "EXTERNAL_AGENT_OAUTH_SCOPE_DUPLICATE");
  if (token.operationIds !== undefined) {
    if (token.operationIds.length === 0) {
      throw new Error("EXTERNAL_AGENT_OAUTH_ACCESS_OPERATION_CEILING_INVALID");
    }
    unique(
      token.operationIds,
      "EXTERNAL_AGENT_OAUTH_ACCESS_OPERATION_DUPLICATE"
    );
  }
  const createdAt = requireIso(
    token.createdAt,
    "EXTERNAL_AGENT_OAUTH_ACCESS_CREATED_AT_INVALID"
  );
  const expiresAt = requireIso(
    token.expiresAt,
    "EXTERNAL_AGENT_OAUTH_ACCESS_EXPIRES_AT_INVALID"
  );
  if (expiresAt <= createdAt) {
    throw new Error("EXTERNAL_AGENT_OAUTH_ACCESS_WINDOW_INVALID");
  }
  if (token.revokedAt !== undefined) {
    const revokedAt = requireIso(
      token.revokedAt,
      "EXTERNAL_AGENT_OAUTH_ACCESS_REVOKED_AT_INVALID"
    );
    if (revokedAt < createdAt) {
      throw new Error("EXTERNAL_AGENT_OAUTH_ACCESS_REVOKED_AT_INVALID");
    }
  }
}

function validateRefreshToken(token: ExternalAgentOAuthRefreshTokenV010): void {
  if (
    token.contractVersion !== "0.1.0"
    || !token.refreshTokenId.trim()
    || !/^[0-9a-f]{64}$/.test(token.tokenHash)
    || !token.oauthClientId.trim()
    || !token.clientId.trim()
    || !token.agentId.trim()
    || !token.grantId.trim()
    || !token.resource.trim()
    || token.scopes.length === 0
  ) {
    throw new Error("EXTERNAL_AGENT_OAUTH_REFRESH_TOKEN_INVALID");
  }
  unique(token.scopes, "EXTERNAL_AGENT_OAUTH_SCOPE_DUPLICATE");
  if (token.operationIds !== undefined) {
    if (token.operationIds.length === 0) {
      throw new Error("EXTERNAL_AGENT_OAUTH_REFRESH_OPERATION_CEILING_INVALID");
    }
    unique(
      token.operationIds,
      "EXTERNAL_AGENT_OAUTH_REFRESH_OPERATION_DUPLICATE"
    );
  }
  const createdAt = requireIso(
    token.createdAt,
    "EXTERNAL_AGENT_OAUTH_REFRESH_CREATED_AT_INVALID"
  );
  const expiresAt = requireIso(
    token.expiresAt,
    "EXTERNAL_AGENT_OAUTH_REFRESH_EXPIRES_AT_INVALID"
  );
  if (expiresAt <= createdAt) {
    throw new Error("EXTERNAL_AGENT_OAUTH_REFRESH_WINDOW_INVALID");
  }
  if (token.consumedAt !== undefined) {
    const consumedAt = requireIso(
      token.consumedAt,
      "EXTERNAL_AGENT_OAUTH_REFRESH_CONSUMED_AT_INVALID"
    );
    if (consumedAt < createdAt) {
      throw new Error("EXTERNAL_AGENT_OAUTH_REFRESH_CONSUMED_AT_INVALID");
    }
  }
  if (token.revokedAt !== undefined) {
    const revokedAt = requireIso(
      token.revokedAt,
      "EXTERNAL_AGENT_OAUTH_REFRESH_REVOKED_AT_INVALID"
    );
    if (revokedAt < createdAt) {
      throw new Error("EXTERNAL_AGENT_OAUTH_REFRESH_REVOKED_AT_INVALID");
    }
  }
  if (
    token.replacedByRefreshTokenId !== undefined
    && token.consumedAt === undefined
  ) {
    throw new Error("EXTERNAL_AGENT_OAUTH_REFRESH_REPLACEMENT_REQUIRES_CONSUMPTION");
  }
}

function validateEvent(event: ExternalAgentOAuthEventV010): void {
  if (
    event.contractVersion !== "0.1.0"
    || !event.eventId.trim()
    || !event.oauthClientId.trim()
    || !event.clientId.trim()
    || !event.agentId.trim()
    || !event.grantId.trim()
  ) {
    throw new Error("EXTERNAL_AGENT_OAUTH_EVENT_INVALID");
  }
  requireIso(event.occurredAt, "EXTERNAL_AGENT_OAUTH_EVENT_TIME_INVALID");
}

function validate(
  snapshot: ExternalAgentOAuthSnapshotV010
): ExternalAgentOAuthSnapshotV010 {
  if (snapshot.contractVersion !== "0.1.0") {
    throw new Error("EXTERNAL_AGENT_OAUTH_CONTRACT_UNSUPPORTED");
  }
  unique(
    snapshot.authorizationCodes.map(item => item.codeId),
    "EXTERNAL_AGENT_OAUTH_CODE_ID_DUPLICATE"
  );
  unique(
    snapshot.authorizationCodes.map(item => item.codeHash),
    "EXTERNAL_AGENT_OAUTH_CODE_HASH_DUPLICATE"
  );
  unique(
    snapshot.accessTokens.map(item => item.tokenId),
    "EXTERNAL_AGENT_OAUTH_ACCESS_TOKEN_ID_DUPLICATE"
  );
  unique(
    snapshot.accessTokens.map(item => item.tokenHash),
    "EXTERNAL_AGENT_OAUTH_ACCESS_TOKEN_HASH_DUPLICATE"
  );
  unique(
    snapshot.refreshTokens.map(item => item.refreshTokenId),
    "EXTERNAL_AGENT_OAUTH_REFRESH_TOKEN_ID_DUPLICATE"
  );
  unique(
    snapshot.refreshTokens.map(item => item.tokenHash),
    "EXTERNAL_AGENT_OAUTH_REFRESH_TOKEN_HASH_DUPLICATE"
  );
  unique(
    snapshot.events.map(item => item.eventId),
    "EXTERNAL_AGENT_OAUTH_EVENT_ID_DUPLICATE"
  );
  for (const item of snapshot.authorizationCodes) validateCode(item);
  for (const item of snapshot.accessTokens) validateAccessToken(item);
  for (const item of snapshot.refreshTokens) validateRefreshToken(item);
  for (const item of snapshot.events) validateEvent(item);
  return clone(snapshot);
}

function immutableFields(
  code: string,
  id: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: readonly string[]
): void {
  for (const field of fields) {
    if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) {
      throw new Error(code + ": " + id + " field=" + field);
    }
  }
}

function appendOnlyEvents(
  before: ExternalAgentOAuthEventV010[],
  after: ExternalAgentOAuthEventV010[]
): void {
  if (after.length < before.length) {
    throw new Error("EXTERNAL_AGENT_OAUTH_EVENTS_APPEND_ONLY");
  }
  for (let index = 0; index < before.length; index += 1) {
    if (JSON.stringify(before[index]) !== JSON.stringify(after[index])) {
      throw new Error("EXTERNAL_AGENT_OAUTH_EVENTS_APPEND_ONLY");
    }
  }
}

function validateTransition(
  previous: ExternalAgentOAuthSnapshotV010,
  next: ExternalAgentOAuthSnapshotV010
): void {
  const previousCodes = new Map(
    previous.authorizationCodes.map(item => [item.codeId, item])
  );
  for (const item of next.authorizationCodes) {
    const existing = previousCodes.get(item.codeId);
    if (!existing) continue;
    immutableFields(
      "EXTERNAL_AGENT_OAUTH_CODE_FACT_IMMUTABLE",
      item.codeId,
      existing as unknown as Record<string, unknown>,
      item as unknown as Record<string, unknown>,
      [
        "codeId",
        "codeHash",
        "oauthClientId",
        "clientId",
        "agentId",
        "grantId",
        "authorizingPrincipalSubjectId",
        "resource",
        "redirectUri",
        "scopes",
        "operationIds",
        "codeChallengeMethod",
        "codeChallenge",
        "createdAt",
        "expiresAt"
      ]
    );
    if (existing.consumedAt !== undefined && item.consumedAt !== existing.consumedAt) {
      throw new Error("EXTERNAL_AGENT_OAUTH_CODE_CONSUMPTION_TERMINAL");
    }
  }

  const previousAccess = new Map(
    previous.accessTokens.map(item => [item.tokenId, item])
  );
  for (const item of next.accessTokens) {
    const existing = previousAccess.get(item.tokenId);
    if (!existing) continue;
    immutableFields(
      "EXTERNAL_AGENT_OAUTH_ACCESS_FACT_IMMUTABLE",
      item.tokenId,
      existing as unknown as Record<string, unknown>,
      item as unknown as Record<string, unknown>,
      [
        "tokenId",
        "tokenHash",
        "oauthClientId",
        "clientId",
        "agentId",
        "grantId",
        "resource",
        "scopes",
        "operationIds",
        "createdAt",
        "expiresAt"
      ]
    );
    if (existing.revokedAt !== undefined && item.revokedAt !== existing.revokedAt) {
      throw new Error("EXTERNAL_AGENT_OAUTH_ACCESS_REVOCATION_TERMINAL");
    }
  }

  const previousRefresh = new Map(
    previous.refreshTokens.map(item => [item.refreshTokenId, item])
  );
  for (const item of next.refreshTokens) {
    const existing = previousRefresh.get(item.refreshTokenId);
    if (!existing) continue;
    immutableFields(
      "EXTERNAL_AGENT_OAUTH_REFRESH_FACT_IMMUTABLE",
      item.refreshTokenId,
      existing as unknown as Record<string, unknown>,
      item as unknown as Record<string, unknown>,
      [
        "refreshTokenId",
        "tokenHash",
        "oauthClientId",
        "clientId",
        "agentId",
        "grantId",
        "resource",
        "scopes",
        "operationIds",
        "createdAt",
        "expiresAt"
      ]
    );
    if (existing.consumedAt !== undefined && item.consumedAt !== existing.consumedAt) {
      throw new Error("EXTERNAL_AGENT_OAUTH_REFRESH_CONSUMPTION_TERMINAL");
    }
    if (existing.revokedAt !== undefined && item.revokedAt !== existing.revokedAt) {
      throw new Error("EXTERNAL_AGENT_OAUTH_REFRESH_REVOCATION_TERMINAL");
    }
    if (
      existing.replacedByRefreshTokenId !== undefined
      && item.replacedByRefreshTokenId !== existing.replacedByRefreshTokenId
    ) {
      throw new Error("EXTERNAL_AGENT_OAUTH_REFRESH_REPLACEMENT_IMMUTABLE");
    }
  }

  appendOnlyEvents(previous.events, next.events);
}

export function createMemoryExternalAgentOAuthStoreV010(
  seed: ExternalAgentOAuthSnapshotV010 = empty()
): ExternalAgentOAuthStoreV010 {
  let current = validate(seed);
  return {
    snapshot() {
      return clone(current);
    },
    save(next) {
      const valid = validate(next);
      validateTransition(current, valid);
      current = valid;
    }
  };
}

export function createFileExternalAgentOAuthStoreV010(
  path: string
): ExternalAgentOAuthStoreV010 {
  const load = (): ExternalAgentOAuthSnapshotV010 => {
    if (!existsSync(path)) return empty();
    return validate(
      JSON.parse(readFileSync(path, "utf8")) as ExternalAgentOAuthSnapshotV010
    );
  };

  return {
    snapshot: load,
    save(next) {
      const previous = load();
      const valid = validate(next);
      validateTransition(previous, valid);
      mkdirSync(dirname(path), { recursive: true });
      const temporary = path + ".tmp";
      writeFileSync(
        temporary,
        JSON.stringify(valid, null, 2) + "\n",
        "utf8"
      );
      renameSync(temporary, path);
    }
  };
}
