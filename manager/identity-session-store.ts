import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync
} from "node:fs";
import { dirname } from "node:path";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import type {
  IdentitySessionV010,
  PlatformPrincipalV010
} from "../contracts/platform-services.js";

export type ManagedIdentitySessionEventV010 =
  | {
      contractVersion: "0.1.0";
      eventId: string;
      type: "ISSUED";
      occurredAt: string;
      tokenHash: string;
      session: IdentitySessionV010;
    }
  | {
      contractVersion: "0.1.0";
      eventId: string;
      type: "REVOKED";
      occurredAt: string;
      sessionId: string;
      reason?: string;
    };

export interface ManagedIdentitySessionRecordV010 {
  tokenHash: string;
  session: IdentitySessionV010;
  revokedAt?: string;
  revokeReason?: string;
}

export interface ManagedIdentitySessionEventStoreV010 {
  append(event: ManagedIdentitySessionEventV010): void;
  list(): ManagedIdentitySessionEventV010[];
}

export interface ManagedIdentitySessionCredentialV010 {
  token: string;
  session: IdentitySessionV010;
}

export interface ManagedIdentitySessionServiceV010 {
  issue(input: {
    principal: PlatformPrincipalV010;
    ttlSeconds: number;
    assurance?: string[];
  }): ManagedIdentitySessionCredentialV010;
  resolveToken(token: string): IdentitySessionV010 | undefined;
  revoke(sessionId: string, reason?: string): boolean;
  rotate(token: string, ttlSeconds?: number): ManagedIdentitySessionCredentialV010 | undefined;
  get(sessionId: string): ManagedIdentitySessionRecordV010 | undefined;
  list(): ManagedIdentitySessionRecordV010[];
}

export function hashIdentitySessionTokenV010(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function createMemoryManagedIdentitySessionEventStoreV010(
  seed: readonly ManagedIdentitySessionEventV010[] = []
): ManagedIdentitySessionEventStoreV010 {
  const events = seed.map(event => structuredClone(event));
  return {
    append(event) {
      events.push(structuredClone(event));
    },
    list() {
      return events.map(event => structuredClone(event));
    }
  };
}

export function createJsonlManagedIdentitySessionEventStoreV010(
  path: string
): ManagedIdentitySessionEventStoreV010 {
  const events = (() => {
    if (!existsSync(path)) return [] as ManagedIdentitySessionEventV010[];
    const raw = readFileSync(path, "utf8").trim();
    if (!raw) return [] as ManagedIdentitySessionEventV010[];
    return raw.split("\n").map((line, index) => {
      try {
        return JSON.parse(line) as ManagedIdentitySessionEventV010;
      } catch {
        throw new Error(`IDENTITY_SESSION_EVENT_INVALID: line ${index + 1}`);
      }
    });
  })();

  return {
    append(event) {
      mkdirSync(dirname(path), { recursive: true });
      appendFileSync(path, JSON.stringify(event) + "\n", {
        encoding: "utf8",
        mode: 0o600
      });
      events.push(structuredClone(event));
    },
    list() {
      return events.map(event => structuredClone(event));
    }
  };
}

function materialize(
  events: readonly ManagedIdentitySessionEventV010[]
): Map<string, ManagedIdentitySessionRecordV010> {
  const bySession = new Map<string, ManagedIdentitySessionRecordV010>();
  for (const event of events) {
    if (event.contractVersion !== "0.1.0") {
      throw new Error("IDENTITY_SESSION_EVENT_VERSION_UNSUPPORTED");
    }
    if (event.type === "ISSUED") {
      if (bySession.has(event.session.sessionId)) {
        throw new Error(`IDENTITY_SESSION_DUPLICATE: ${event.session.sessionId}`);
      }
      bySession.set(event.session.sessionId, {
        tokenHash: event.tokenHash,
        session: structuredClone(event.session)
      });
      continue;
    }
    const current = bySession.get(event.sessionId);
    if (!current) {
      throw new Error(`IDENTITY_SESSION_REVOKE_UNKNOWN: ${event.sessionId}`);
    }
    if (!current.revokedAt) {
      current.revokedAt = event.occurredAt;
      current.revokeReason = event.reason;
    }
  }
  return bySession;
}

export function createManagedIdentitySessionServiceV010(input: {
  store: ManagedIdentitySessionEventStoreV010;
  now?: () => Date;
  token?: () => string;
  id?: () => string;
}): ManagedIdentitySessionServiceV010 {
  const now = input.now ?? (() => new Date());
  const token = input.token ?? (() => randomBytes(32).toString("base64url"));
  const id = input.id ?? (() => randomUUID());
  const records = materialize(input.store.list());
  const sessionIdByTokenHash = new Map<string, string>();
  for (const [sessionId, record] of records) {
    if (sessionIdByTokenHash.has(record.tokenHash)) {
      throw new Error("IDENTITY_SESSION_TOKEN_HASH_DUPLICATE");
    }
    sessionIdByTokenHash.set(record.tokenHash, sessionId);
  }

  function active(record: ManagedIdentitySessionRecordV010): boolean {
    if (record.revokedAt) return false;
    const expiresAt = record.session.expiresAt
      ? Date.parse(record.session.expiresAt)
      : Number.NaN;
    return Number.isFinite(expiresAt) && now().getTime() < expiresAt;
  }

  function resolveToken(rawToken: string): IdentitySessionV010 | undefined {
    if (!rawToken.trim()) return undefined;
    const digest = hashIdentitySessionTokenV010(rawToken.trim());
    const sessionId = sessionIdByTokenHash.get(digest);
    const record = sessionId ? records.get(sessionId) : undefined;
    if (!record || !active(record)) return undefined;
    return structuredClone(record.session);
  }

  function revoke(sessionId: string, reason?: string): boolean {
    const record = records.get(sessionId);
    if (!record || record.revokedAt) return false;
    const occurredAt = now().toISOString();
    input.store.append({
      contractVersion: "0.1.0",
      eventId: `identity-session-event:${id()}`,
      type: "REVOKED",
      occurredAt,
      sessionId,
      ...(reason?.trim() ? { reason: reason.trim() } : {})
    });
    record.revokedAt = occurredAt;
    record.revokeReason = reason?.trim() || undefined;
    return true;
  }

  function issue(request: {
    principal: PlatformPrincipalV010;
    ttlSeconds: number;
    assurance?: string[];
  }): ManagedIdentitySessionCredentialV010 {
    if (!Number.isFinite(request.ttlSeconds) || request.ttlSeconds <= 0) {
      throw new Error("IDENTITY_SESSION_TTL_INVALID");
    }
    const issuedAt = now();
    const rawToken = token();
    if (!rawToken) throw new Error("IDENTITY_SESSION_TOKEN_EMPTY");
    const tokenHash = hashIdentitySessionTokenV010(rawToken);
    if (sessionIdByTokenHash.has(tokenHash)) {
      throw new Error("IDENTITY_SESSION_TOKEN_COLLISION");
    }
    const session: IdentitySessionV010 = {
      contractVersion: "0.1.0",
      sessionId: `session:${id()}`,
      principal: structuredClone(request.principal),
      issuedAt: issuedAt.toISOString(),
      expiresAt: new Date(
        issuedAt.getTime() + Math.trunc(request.ttlSeconds * 1000)
      ).toISOString(),
      ...(request.assurance?.length
        ? { assurance: [...request.assurance] }
        : {})
    };
    const event: ManagedIdentitySessionEventV010 = {
      contractVersion: "0.1.0",
      eventId: `identity-session-event:${id()}`,
      type: "ISSUED",
      occurredAt: issuedAt.toISOString(),
      tokenHash,
      session
    };
    input.store.append(event);
    records.set(session.sessionId, {
      tokenHash,
      session: structuredClone(session)
    });
    sessionIdByTokenHash.set(tokenHash, session.sessionId);
    return { token: rawToken, session: structuredClone(session) };
  }

  return {
    issue,
    resolveToken,
    revoke,
    rotate(rawToken, ttlSeconds) {
      const current = resolveToken(rawToken);
      if (!current) return undefined;
      const expiresAt = Date.parse(current.expiresAt ?? "");
      const remainingSeconds = Number.isFinite(expiresAt)
        ? Math.max(1, Math.ceil((expiresAt - now().getTime()) / 1000))
        : 1;
      if (!revoke(current.sessionId, "ROTATED")) return undefined;
      return issue({
        principal: current.principal,
        ttlSeconds: ttlSeconds ?? remainingSeconds,
        assurance: current.assurance
      });
    },
    get(sessionId) {
      const record = records.get(sessionId);
      return record ? structuredClone(record) : undefined;
    },
    list() {
      return [...records.values()].map(record => structuredClone(record));
    }
  };
}
