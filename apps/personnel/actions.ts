import type {
  AppActionHandler, AppActionExecutionResultV010, JsonValue
} from "../../actions/contracts.js";
import type {
  PlatformPrincipalV010, PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type { BusinessPersonV010, PersonnelDirectorySnapshotV010 } from "../../contracts/reference-data/personnel.js";
import {
  PERSONNEL_PACKAGE_ID_V010 as PACKAGE,
  PERSONNEL_FEATURE_ID_V010 as FEATURE,
  PERSONNEL_LIST_COMMAND_V010 as LIST,
  PERSONNEL_DRAFT_COMMAND_V010 as DRAFT,
  PERSONNEL_PUBLISH_COMMAND_V010 as PUBLISH,
  PERSONNEL_RESOLVE_COMMAND_V010 as RESOLVE
} from "../../contracts/reference-data/personnel.js";
import type { PersonnelRepositoryV010 } from "./repository.js";

function required(value: unknown, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}
function integer(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error("PERSONNEL_VERSION_INVALID");
  }
  return value as number;
}
function enterprise(context?: PlatformRequestContextV010): string {
  const active = context?.context?.activeContext;
  if (!context || active?.kind !== "ENTERPRISE" || !active.contextId || !active.enterpriseId
    || context.scope.enterpriseId !== active.enterpriseId) {
    throw new Error("PERSONNEL_ENTERPRISE_CONTEXT_REQUIRED");
  }
  return active.contextId;
}
function failure(error: unknown, context?: PlatformRequestContextV010): AppActionExecutionResultV010 {
  const code = error instanceof Error ? error.message : "PERSONNEL_ACTION_FAILED";
  return { ok: false, ...(context?.correlationId ? { correlationId: context.correlationId } : {}),
    error: { code, message: code } };
}
function publicSnapshot(snapshot: PersonnelDirectorySnapshotV010 | undefined) {
  if (!snapshot) return undefined;
  // Never leak the optional login association in the general business directory.
  return { ...snapshot, persons: snapshot.persons.map(({ linkedPrincipalSubjectId: _ignored, ...person }) => person) };
}

export function createPersonnelActionHandlersV010(input: ({
  repository: PersonnelRepositoryV010
} | {
  resolveRepository(): Promise<PersonnelRepositoryV010>
}) & {
  canRead(principal: PlatformPrincipalV010, contextId: string): boolean;
  canManage(principal: PlatformPrincipalV010, contextId: string): boolean;
  now?: () => Date;
}): AppActionHandler[] {
  const now = input.now ?? (() => new Date());
  const handler = (code: string, writable: boolean,
    work: (repo: PersonnelRepositoryV010, ctx: PlatformRequestContextV010,
      contextId: string, values: Record<string, JsonValue>) => unknown): AppActionHandler => ({
    packageId: PACKAGE, featureId: FEATURE, commandCode: code,
    async execute(request, context) {
      try {
        const contextId = enterprise(context);
        const may = () => (writable ? input.canManage : input.canRead)(context!.principal, contextId);
        if (!may()) throw new Error("PERSONNEL_PERMISSION_DENIED");
        if (writable && context!.principal.actorType !== "HUMAN") {
          throw new Error("PERSONNEL_WRITE_HUMAN_REQUIRED");
        }
        const repo = "resolveRepository" in input ? await input.resolveRepository() : input.repository;
        if (!may()) throw new Error("PERSONNEL_PERMISSION_DENIED");
        const data = work(repo, context!, contextId, request.values);
        return { ok: true, correlationId: context!.correlationId,
          result: JSON.parse(JSON.stringify({ contractVersion: "0.1.0", data })) as JsonValue };
      } catch (error) { return failure(error, context); }
    }
  });
  return [
    handler(LIST, false, (repo, ctx, id, values) => {
      // Ordinary members may only read published personnel. Draft HR changes
      // remain visible to OWNER/ADMIN managing the active enterprise.
      const manage = input.canManage(ctx.principal, id);
      if (values.personnelDirectoryId) {
        const key = required(values.personnelDirectoryId, "PERSONNEL_DIRECTORY_ID_REQUIRED");
        return publicSnapshot(manage ? repo.get(id, key) : repo.getEffective(id, key));
      }
      const directories = repo.list(id);
      return directories.map(x => publicSnapshot(
        manage ? x : repo.getEffective(id, x.personnelDirectoryId)
      )).filter(Boolean);
    }),
    handler(DRAFT, true, (repo, ctx, id, values) => repo.saveDraft({
      contextId: id,
      personnelDirectoryId: required(values.personnelDirectoryId, "PERSONNEL_DIRECTORY_ID_REQUIRED"),
      expectedVersion: integer(values.expectedVersion),
      persons: Array.isArray(values.persons)
        ? values.persons as unknown as BusinessPersonV010[]
        : (() => { throw new Error("PERSONNEL_PERSONS_REQUIRED"); })(),
      actorSubjectId: ctx.principal.subjectId, recordedAt: now().toISOString()
    })),
    handler(PUBLISH, true, (repo, ctx, id, values) => repo.publish({
      contextId: id,
      personnelDirectoryId: required(values.personnelDirectoryId, "PERSONNEL_DIRECTORY_ID_REQUIRED"),
      expectedVersion: integer(values.expectedVersion),
      actorSubjectId: ctx.principal.subjectId,
      actorType: "HUMAN", recordedAt: now().toISOString()
    })),
    handler(RESOLVE, false, (repo, _ctx, id, values) => repo.resolveBatch({
      contextId: id,
      personnelDirectoryId: required(values.personnelDirectoryId, "PERSONNEL_DIRECTORY_ID_REQUIRED"),
      ...(values.expectedVersion === undefined ? {} : { expectedVersion: integer(values.expectedVersion) }),
      sourceValues: Array.isArray(values.sourceValues)
        && values.sourceValues.every(x => typeof x === "string")
        ? values.sourceValues as string[]
        : (() => { throw new Error("PERSONNEL_SOURCE_VALUES_INVALID"); })()
    }))
  ];
}
