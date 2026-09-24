import type {
  LedgerConfiguratorLegacyPostingRuleV010,
  LedgerRuntimeSourceConfigurationV010
} from "./contracts.js";
import { bookkeepingAccounts } from "./defaults/bookkeeping/accounts.js";
import { bookkeepingApplications } from "./defaults/bookkeeping/applications.js";
import { bookkeepingDictionaries } from "./defaults/bookkeeping/dictionaries.js";
import { bookkeepingPostingRules } from "./defaults/bookkeeping/posting-rules.js";
import { bookkeepingLegacyPostingRules } from "./defaults/bookkeeping/legacy-posting-rules.js";

export const bookkeepingDefaultConfiguration: LedgerRuntimeSourceConfigurationV010 = {
  contractVersion: "0.1.0",
  kind: "evo.ledger-runtime.source-configuration",
  expressionLanguage: "bookkeeping-aviator-v1",
  configurationId: "bookkeeping-default",
  displayName: "Bookkeeping Default Ledger Configuration",
  source: {
    repository: "jiangxng/bookkeeping",
    baseline: "policy.sql",
    importedAtArchitectureDate: "2026-09-24"
  },
  accounts: structuredClone(bookkeepingAccounts) as unknown as LedgerRuntimeSourceConfigurationV010["accounts"],
  applications: structuredClone(bookkeepingApplications) as unknown as LedgerRuntimeSourceConfigurationV010["applications"],
  dictionaries: structuredClone(bookkeepingDictionaries) as unknown as LedgerRuntimeSourceConfigurationV010["dictionaries"],
  postingRules: structuredClone(bookkeepingPostingRules) as unknown as LedgerRuntimeSourceConfigurationV010["postingRules"]
};

export const bookkeepingReferenceLegacyPostingRules =
  structuredClone(bookkeepingLegacyPostingRules) as unknown as LedgerConfiguratorLegacyPostingRuleV010[];
