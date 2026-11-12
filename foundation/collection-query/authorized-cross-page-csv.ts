import type { DataCollectionResultV010 } from "../../contracts/data-collection/query.js";
import { serializeAuthorizedCollectionPageCsvV010 } from "./page-csv.js";

/**
 * CV-04 bounded cross-page EXPORT executor (not an Action/permission/Job API).
 *
 * It is intentionally NOT registered in a Plugin Manifest or Eidos and is
 * unusable without a calling Domain Owner's independent EXPORT authorization,
 * immutable authorized snapshot and durable audit writer. No Host/Owner may
 * expose it as a replacement for a resumable large/export task.
 */
export interface AuthorizedCrossPageExportPolicyV010 {
  pageSize: number;
  maxPages: number;
  maxRows: number;
  maxBytes: number;
  maxDurationMs: number;
}

export interface AuthorizedCrossPageExportScopeV010 {
  enterpriseId: string;
  subjectId: string;
  actorType: "HUMAN" | "AI" | "AUTOMATION" | "SERVICE";
}

export interface AuthorizedCrossPageExportAuditV010 {
  contractVersion: "0.1.0";
  auditId: string;
  stage: "STARTED" | "COMPLETED" | "REJECTED";
  enterpriseId: string;
  subjectId: string;
  actorType: AuthorizedCrossPageExportScopeV010["actorType"];
  snapshotId?: string;
  rowCount: number;
  byteCount: number;
  denialCode?: string;
}

export interface AuthorizedCrossPageExportSnapshotV010 {
  /** Caller must capture stable, pre-authorized Owner data; not live page-by-page re-query. */
  snapshotId: string;
  readPage(page: number, pageSize: number): Promise<DataCollectionResultV010>;
}

const MAX_ROWS = 1000;
const MAX_PAGES = 10;
const MAX_BYTES = 262144;
const MAX_DURATION_MS = 30000;
const MAX_PAGE_SIZE = 100;
const MAX_FIELD_IDS = 20;
const FIELD_ID = /^[A-Za-z][A-Za-z0-9._-]{0,127}$/u;
const SAFE_ID = /^[A-Za-z0-9._:-]{1,128}$/u;

function allowedInteger(value: unknown, max: number): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 1 && (value as number) <= max;
}

function enforcePolicy(policy: AuthorizedCrossPageExportPolicyV010): void {
  if (!policy
    || !allowedInteger(policy.pageSize, MAX_PAGE_SIZE)
    || !allowedInteger(policy.maxPages, MAX_PAGES)
    || !allowedInteger(policy.maxRows, MAX_ROWS)
    || !allowedInteger(policy.maxBytes, MAX_BYTES)
    || !allowedInteger(policy.maxDurationMs, MAX_DURATION_MS)
    || policy.pageSize * policy.maxPages < policy.maxRows) {
    throw new Error("COLLECTION_EXPORT_BUDGET_INVALID");
  }
}

function ensureDeadline(deadline: number, now: () => number): void {
  if (now() >= deadline) throw new Error("COLLECTION_EXPORT_TIME_BUDGET_EXCEEDED");
}

async function withinDeadline<T>(
  promise: () => Promise<T>,
  deadline: number,
  now: () => number
): Promise<T> {
  ensureDeadline(deadline, now);
  const remaining = Math.max(1, Math.ceil(deadline - now()));
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() =>
      reject(new Error("COLLECTION_EXPORT_TIME_BUDGET_EXCEEDED")), remaining);
    try {
      Promise.resolve().then(promise).then(
        value => { clearTimeout(timer); resolve(value); },
        error => { clearTimeout(timer); reject(error); }
      );
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
}

function validation(
  input: {
    auditId: string;
    scope: AuthorizedCrossPageExportScopeV010;
    fieldIds: readonly string[];
    policy: AuthorizedCrossPageExportPolicyV010;
    authorizeExport: () => Promise<boolean>;
    openSnapshot: () => Promise<AuthorizedCrossPageExportSnapshotV010>;
    audit: (event: AuthorizedCrossPageExportAuditV010) => Promise<void>;
  }
): void {
  enforcePolicy(input.policy);
  if (!SAFE_ID.test(input.auditId)
    || !SAFE_ID.test(input.scope?.enterpriseId)
    || !SAFE_ID.test(input.scope?.subjectId)
    || !["HUMAN", "AI", "AUTOMATION", "SERVICE"].includes(input.scope?.actorType)
    || !Array.isArray(input.fieldIds)
    || input.fieldIds.length < 1 || input.fieldIds.length > MAX_FIELD_IDS
    || input.fieldIds.some(field => typeof field !== "string" || !FIELD_ID.test(field))
    || new Set(input.fieldIds).size !== input.fieldIds.length
    || typeof input.authorizeExport !== "function"
    || typeof input.openSnapshot !== "function"
    || typeof input.audit !== "function") {
    throw new Error("COLLECTION_EXPORT_CONTRACT_INVALID");
  }
}

/**
 * Small, synchronous, fail-closed proof of a cross-page authorization and
 * budget gate. Real large exports still require a durable Job and fresh
 * authorization at separate download time. Audit callback MUST durably commit
 * before this function releases any bytes.
 */
export async function createAuthorizedCrossPageCsvV010(input: {
  auditId: string;
  scope: AuthorizedCrossPageExportScopeV010;
  fieldIds: readonly string[];
  policy: AuthorizedCrossPageExportPolicyV010;
  authorizeExport(): Promise<boolean>;
  openSnapshot(): Promise<AuthorizedCrossPageExportSnapshotV010>;
  audit(event: AuthorizedCrossPageExportAuditV010): Promise<void>;
  now?: () => number;
}): Promise<{
  contractVersion: "0.1.0";
  snapshotId: string;
  rowCount: number;
  byteCount: number;
  csv: string;
}> {
  validation(input);
  const now = input.now ?? Date.now;
  const deadline = now() + input.policy.maxDurationMs;
  let snapshotId: string | undefined;
  let rowCount = 0;
  let byteCount = 0;
  const event = (stage: AuthorizedCrossPageExportAuditV010["stage"],
    denialCode?: string): AuthorizedCrossPageExportAuditV010 => ({
    contractVersion: "0.1.0",
    auditId: input.auditId, stage, ...input.scope,
    ...(snapshotId ? { snapshotId } : {}),
    rowCount, byteCount,
    ...(denialCode ? { denialCode } : {})
  });
  const audit = (stage: AuthorizedCrossPageExportAuditV010["stage"],
    denialCode?: string) =>
    withinDeadline(() => input.audit(event(stage, denialCode)), deadline, now);
  const authorize = async (): Promise<void> => {
    if ((await withinDeadline(input.authorizeExport, deadline, now)) !== true) {
      throw new Error("COLLECTION_EXPORT_PERMISSION_DENIED");
    }
  };
  try {
    await authorize();
    await audit("STARTED");
    const snapshot = await withinDeadline(input.openSnapshot, deadline, now);
    if (!snapshot || !SAFE_ID.test(snapshot.snapshotId)
      || typeof snapshot.readPage !== "function") {
      throw new Error("COLLECTION_EXPORT_SNAPSHOT_INVALID");
    }
    snapshotId = snapshot.snapshotId;
    const rowIds = new Set<string>();
    let collectionId: string | undefined;
    let schemaRef: string | undefined;
    let readableSignature: string | undefined;
    let total: number | undefined;
    let csv = "";
    for (let pageIndex = 0; pageIndex < input.policy.maxPages; pageIndex++) {
      await authorize();
      const page = await withinDeadline(() =>
        snapshot.readPage(pageIndex, input.policy.pageSize), deadline, now);
      if (!page || page.contractVersion !== "0.1.0"
        || !page.collectionId || !page.schemaRef
        || page.pageInfo?.countKind !== "EXACT"
        || !Number.isSafeInteger(page.pageInfo.total)
        || page.pageInfo.total < 0
        || page.pageInfo.page !== pageIndex
        || page.pageInfo.pageSize !== input.policy.pageSize) {
        throw new Error("COLLECTION_EXPORT_PAGE_SCOPE_INVALID");
      }
      if (collectionId === undefined) {
        collectionId = page.collectionId;
        schemaRef = page.schemaRef;
        readableSignature = JSON.stringify(page.readableFieldIds);
        total = page.pageInfo.total;
        if (total > input.policy.maxRows) {
          throw new Error("COLLECTION_EXPORT_ROW_BUDGET_EXCEEDED");
        }
      } else if (page.collectionId !== collectionId || page.schemaRef !== schemaRef
        || JSON.stringify(page.readableFieldIds) !== readableSignature
        || page.pageInfo.total !== total) {
        throw new Error("COLLECTION_EXPORT_SNAPSHOT_DRIFT");
      }
      const expectedHasMore = (pageIndex + 1) * input.policy.pageSize < total!;
      if (page.pageInfo.hasMore !== expectedHasMore
        || page.rows.length !== Math.max(0,
          Math.min(input.policy.pageSize, total! - pageIndex * input.policy.pageSize))) {
        throw new Error("COLLECTION_EXPORT_PAGE_GAP");
      }
      for (const row of page.rows) {
        if (!row?.rowId || rowIds.has(row.rowId)) {
          throw new Error("COLLECTION_EXPORT_ROW_DUPLICATE");
        }
        rowIds.add(row.rowId);
      }
      const part = serializeAuthorizedCollectionPageCsvV010({
        page,fieldIds:input.fieldIds
      });
      // CSV column IDs contain no CR or LF, so only the first CRLF is a header.
      const headerEnd = part.indexOf("\r\n");
      if (headerEnd < 0) throw new Error("COLLECTION_EXPORT_CSV_INVALID");
      csv += pageIndex === 0 ? part : part.slice(headerEnd + 2);
      rowCount += page.rows.length;
      byteCount = Buffer.byteLength("\uFEFF" + csv,"utf8");
      if (byteCount > input.policy.maxBytes) {
        throw new Error("COLLECTION_EXPORT_BYTE_BUDGET_EXCEEDED");
      }
      if (!expectedHasMore) break;
      if (pageIndex + 1 >= input.policy.maxPages) {
        throw new Error("COLLECTION_EXPORT_PAGE_BUDGET_EXCEEDED");
      }
    }
    if (rowCount !== total) throw new Error("COLLECTION_EXPORT_ROW_COUNT_DRIFT");
    await authorize();
    await audit("COMPLETED");
    // The final gate is after durable audit; no caller gets bytes after revoke.
    await authorize();
    ensureDeadline(deadline, now);
    return { contractVersion:"0.1.0",snapshotId: snapshotId!,
      rowCount,byteCount,csv:"\uFEFF" + csv };
  } catch (error) {
    const raw = error instanceof Error ? error.message : "COLLECTION_EXPORT_FAILED";
    const code = /^[A-Z0-9_]+$/u.test(raw) ? raw : "COLLECTION_EXPORT_FAILED";
    try { await audit("REJECTED",code); } catch { /* no bytes may escape */ }
    throw error;
  }
}
