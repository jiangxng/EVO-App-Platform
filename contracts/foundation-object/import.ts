import type {
  EffectiveObjectSchemaV010,
  FoundationObjectLocalizedTextV010
} from "./schema.js";

export type FoundationObjectImportCellV010 =
  | string
  | number
  | boolean
  | null;

export interface FoundationObjectImportIssueV010 {
  code: string;
  message: string;
  fieldId?: string;
}

export interface FoundationObjectImportTargetParametersV010 {
  /**
   * Object-owned import parameters. The shared contract intentionally does
   * not name Counterparty, Item or any other domain semantic.
   */
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface FoundationObjectImportPreparedRowV010 {
  rowNumber: number;
  values: Record<string, FoundationObjectImportCellV010>;
  dedupeKey?: string;
}

export interface FoundationObjectImportValidationV010 {
  ok: boolean;
  prepared?: FoundationObjectImportPreparedRowV010;
  issues: FoundationObjectImportIssueV010[];
}

export interface FoundationObjectImportCommitResultV010 {
  objectType: string;
  objectId: string;
  displayKey?: string;
}

export interface FoundationObjectImportTargetParameterOptionV010 {
  value: string;
  label: FoundationObjectLocalizedTextV010;
}

export interface FoundationObjectImportTargetParameterV010 {
  key: string;
  label: FoundationObjectLocalizedTextV010;
  required: boolean;
  control: "select";
  defaultValue?: string;
  options: FoundationObjectImportTargetParameterOptionV010[];
}

export interface FoundationObjectImportTargetV010 {
  contractVersion: "0.1.0";
  targetId: string;
  label: FoundationObjectLocalizedTextV010;
  parameters?: FoundationObjectImportTargetParameterV010[];
  objectType: string;
  ownerPackageId: string;
  describe(input: {
    contextId: string;
    locale?: string;
    parameters?: FoundationObjectImportTargetParametersV010;
  }): EffectiveObjectSchemaV010;
  validateRow(input: {
    contextId: string;
    importJobId: string;
    schema: EffectiveObjectSchemaV010;
    rowNumber: number;
    values: Record<string, FoundationObjectImportCellV010>;
    parameters?: FoundationObjectImportTargetParametersV010;
  }): FoundationObjectImportValidationV010;
  commitRow(input: {
    contextId: string;
    importJobId: string;
    schema: EffectiveObjectSchemaV010;
    prepared: FoundationObjectImportPreparedRowV010;
    parameters?: FoundationObjectImportTargetParametersV010;
    actorSubjectId: string;
    recordedAt: string;
  }): FoundationObjectImportCommitResultV010;
  commitPreparedRows?(input: {
    contextId: string;
    importJobId: string;
    schema: EffectiveObjectSchemaV010;
    preparedRows: FoundationObjectImportPreparedRowV010[];
    parameters?: FoundationObjectImportTargetParametersV010;
    actorSubjectId: string;
    recordedAt: string;
  }): {
    semantics: "ATOMIC_BATCH";
    results: FoundationObjectImportCommitResultV010[];
  };
}
