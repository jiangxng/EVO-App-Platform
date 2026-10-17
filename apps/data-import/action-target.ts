import type { AppActionRequestV010 } from "../../actions/contracts.js";
import type { DataImportRepositoryV010 } from "./repository.js";
import {
  DATA_IMPORT_GET_COMMAND_V010, DATA_IMPORT_ERROR_CSV_COMMAND_V010,
  DATA_IMPORT_STAGE_FILE_COMMAND_V010, DATA_IMPORT_STAGE_CSV_COMMAND_V010,
  DATA_IMPORT_REVIEW_COMMAND_V010, DATA_IMPORT_DRY_RUN_COMMAND_V010,
  DATA_IMPORT_COMMIT_COMMAND_V010, DATA_IMPORT_MAPPING_INSPECT_COMMAND_V010,
  DATA_IMPORT_MAPPING_APPLY_COMMAND_V010, DATA_IMPORT_ROW_CORRECT_COMMAND_V010
} from "./constants.js";

/** Loading plan only. The caller and original action retain authorization checks. */
export function dataImportActionTargetV010(input: {
  commandCode: string;
  request: AppActionRequestV010;
  contextId: string;
  repository: Pick<DataImportRepositoryV010, "get">;
}): string | undefined {
  const required = (value: unknown, code: string): string => {
    if (typeof value !== "string" || !value.trim()) throw new Error(code);
    return value.trim();
  };
  switch (input.commandCode) {
    // Persisted receipts/errors do not require a live business target.
    case DATA_IMPORT_GET_COMMAND_V010:
    case DATA_IMPORT_ERROR_CSV_COMMAND_V010:
      return undefined;
    case DATA_IMPORT_STAGE_FILE_COMMAND_V010:
    case DATA_IMPORT_STAGE_CSV_COMMAND_V010:
      return required(input.request.values.targetId, "DATA_IMPORT_TARGET_ID_REQUIRED");
    case DATA_IMPORT_REVIEW_COMMAND_V010:
    case DATA_IMPORT_DRY_RUN_COMMAND_V010:
    case DATA_IMPORT_COMMIT_COMMAND_V010:
    case DATA_IMPORT_MAPPING_INSPECT_COMMAND_V010:
    case DATA_IMPORT_MAPPING_APPLY_COMMAND_V010:
    case DATA_IMPORT_ROW_CORRECT_COMMAND_V010: {
      const id = required(input.request.values.importJobId, "DATA_IMPORT_JOB_ID_REQUIRED");
      const job = input.repository.get(input.contextId, id);
      if (!job) throw new Error("DATA_IMPORT_JOB_NOT_FOUND");
      // Never select another target from untrusted request values for an existing Job.
      return job.targetId;
    }
    default:
      throw new Error("DATA_IMPORT_HANDLER_NOT_FOUND");
  }
}
