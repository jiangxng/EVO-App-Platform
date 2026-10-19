import {randomUUID} from "node:crypto";
import {
  closeSync, constants, fstatSync, fsyncSync, lstatSync, mkdirSync,
  openSync, writeSync
} from "node:fs";
import {dirname} from "node:path";

/**
 * PA05 E01J4H: standalone, Host-internal durable non-secret audit sink for
 * E01J4G's prestartup maintenance. No Host startup/HTTP/Agent attachment.
 *
 * The caller is responsible for a trusted HUMAN identity and the original
 * J4G admission checks. This is local append-only evidence, NOT a signed,
 * immutable or cross-Worker audit service and NOT a production runbook.
 */
export interface Pa05PrestartupAuditEventV010 {
  stage: "AUTHORIZED" | "COMPLETED";
  principalId: string;
  sessionId: string;
  hostId: string;
  operation: "UNINSTALL";
  packageId: "evo-purchase-attention";
}

function identity(value: string, kind: "PRINCIPAL" | "SESSION"): string {
  // Deliberately does not accept free-text or secrets in audit fields.
  if (typeof value !== "string" ||
      value.length < 1 || value.length > 128 ||
      !/^[A-Za-z0-9:@._\/-]+$/.test(value)) {
    throw Error("PA05_J4H_AUDIT_" + kind + "_INVALID");
  }
  return value;
}

function validate(event: Pa05PrestartupAuditEventV010, hostId: string) {
  if (!event || !["AUTHORIZED","COMPLETED"].includes(event.stage) ||
      event.hostId !== hostId || event.operation !== "UNINSTALL" ||
      event.packageId !== "evo-purchase-attention") {
    throw Error("PA05_J4H_AUDIT_EVENT_INVALID");
  }
  return {
    stage: event.stage,
    principalId: identity(event.principalId, "PRINCIPAL"),
    sessionId: identity(event.sessionId, "SESSION"),
    hostId,
    operation: "UNINSTALL" as const,
    packageId: "evo-purchase-attention" as const
  };
}

export function createPa05PrestartupAuditJournalV010(input: {
  filePath: string;
  hostId: string;
  now?: () => Date;
}): {
  append(event: Pa05PrestartupAuditEventV010): Promise<void>;
} {
  if (typeof input?.filePath !== "string" ||
      !input.filePath.startsWith("/") ||
      input.filePath.endsWith("/") ||
      typeof input.hostId !== "string" ||
      !/^[a-z0-9][a-z0-9_-]{2,79}$/.test(input.hostId)) {
    throw Error("PA05_J4H_AUDIT_CONFIGURATION_INVALID");
  }
  const dir = dirname(input.filePath);
  const now = input.now ?? (() => new Date());

  return {
    async append(event) {
      const valid = validate(event, input.hostId);
      const time = now().toISOString();
      const record = {
        contractVersion: "0.1.0" as const,
        eventId: randomUUID(), occurredAt: time,
        ...valid
      };
      const line = Buffer.from(JSON.stringify(record) + "\n", "utf8");
      if (line.length > 2048) throw Error("PA05_J4H_AUDIT_RECORD_TOO_LARGE");
      let fd: number | undefined;
      try {
        // No automatically created weak or symlinked audit directory.
        mkdirSync(dir, {recursive: true, mode: 0o700});
        const d = lstatSync(dir);
        const uid = process.getuid?.();
        if (!d.isDirectory() || (d.mode & 0o077) !== 0 ||
            (uid !== undefined && d.uid !== uid))
          throw Error("PA05_J4H_AUDIT_DIRECTORY_UNTRUSTED");

        fd = openSync(input.filePath,
          constants.O_WRONLY | constants.O_CREAT | constants.O_APPEND |
          constants.O_NOFOLLOW, 0o600);
        const f = fstatSync(fd);
        if (!f.isFile() || f.nlink !== 1 ||
            (f.mode & 0o077) !== 0 ||
            (uid !== undefined && f.uid !== uid))
          throw Error("PA05_J4H_AUDIT_FILE_UNTRUSTED");
        // One append-only write followed by an actual fsync before resolving.
        // Partial writes cannot be called a successfully audited mutation.
        if (writeSync(fd, line) !== line.length)
          throw Error("PA05_J4H_AUDIT_PARTIAL_APPEND");
        fsyncSync(fd);
      } catch {
        // Never echo file paths, Session tokens or SQL URLs on failure.
        throw Error("PA05_J4H_AUDIT_UNAVAILABLE");
      } finally {
        if (fd !== undefined) closeSync(fd);
      }
    }
  };
}
