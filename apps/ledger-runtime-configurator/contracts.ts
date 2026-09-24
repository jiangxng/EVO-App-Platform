export interface LedgerConfiguratorAccountV010 {
  id: number;
  title: string;
  isFinance: boolean;
  bigClass: string | null;
  subClass: string | null;
  description: string | null;
  objectField: string | null;
  objectType: string | null;
  laneFields: string | null;
  objectBusinessType: string | null;
  allowNegative: number | null;
  costCalcConfig: string | null;
}

export interface LedgerConfiguratorApplicationV010 {
  legacyId: number;
  applicationId: string;
  title: string;
  processId: number | null;
  voucherType: string | null;
  iotcs: string | null;
  state: string | null;
  modified: string | null;
  entryType: string | null;
}

export interface LedgerConfiguratorDictionaryV010 {
  id: number;
  key: string;
  text: string;
  type: string | null;
  description: string | null;
}

export interface LedgerConfiguratorPostingRuleV010 {
  sourceId: number;
  applicationId: string;
  appTitle: string | null;
  ledgerId: number;
  ledgerTitle: string | null;
  direction: string;
  quantityFormula: string | null;
  amountFormula: string | null;
  entryConditions: string | null;
  defaultValues: string | null;
  objectField: string | null;
  objectType: string | null;
  accountLaneFieldsValues: string | null;
  source: string;
}

export interface LedgerConfiguratorLegacyPostingRuleV010 {
  sourceId: number;
  applicationId: string;
  appTitle: string | null;
  appType: string | null;
  ledgerId: number;
  ledgerTitle: string | null;
  direction: string;
  quantityFormula: string | null;
  amountFormula: string | null;
  entryConditions: string | null;
  source: string;
}

export interface LedgerRuntimeSourceConfigurationV010 {
  contractVersion: "0.1.0";
  kind: "evo.ledger-runtime.source-configuration";
  configurationId: string;
  displayName: string;
  source: {
    repository: "jiangxng/bookkeeping";
    baseline: "policy.sql";
    importedAtArchitectureDate: "2026-09-24";
  };
  accounts: LedgerConfiguratorAccountV010[];
  applications: LedgerConfiguratorApplicationV010[];
  dictionaries: LedgerConfiguratorDictionaryV010[];
  postingRules: LedgerConfiguratorPostingRuleV010[];
}

export interface LedgerConfiguratorSourceLibraryV010 {
  id: string;
  displayName: string;
  status: "ACTIVE_BASELINE" | "REFERENCE";
  source: string;
  ruleCount: number;
}

export interface LedgerConfiguratorValidationV010 {
  ok: boolean;
  semanticDigest: string;
  errors: Array<{ code: string; message: string }>;
  warnings: Array<{ code: string; message: string; count?: number }>;
  summary: {
    accounts: number;
    applications: number;
    dictionaries: number;
    postingRules: number;
  };
  burn: {
    ready: boolean;
    blockers: Array<{ code: string; message: string; count?: number }>;
  };
}

export interface LedgerConfiguratorSummaryV010 {
  configurationId: string;
  displayName: string;
  semanticDigest: string;
  counts: {
    accounts: number;
    applications: number;
    dictionaries: number;
    postingRules: number;
    referenceLegacyPostingRules: number;
  };
  sourceLibraries: LedgerConfiguratorSourceLibraryV010[];
  burnReady: boolean;
}

export interface LedgerRuntimeTemplateV010 {
  contractVersion: "0.1.0";
  kind: "evo.ledger-runtime.template";
  templateId: string;
  displayName: string;
  semanticDigest: string;
  configuration: LedgerRuntimeSourceConfigurationV010;
  compatibility: {
    burnReady: boolean;
    blockers: Array<{ code: string; message: string; count?: number }>;
  };
}
