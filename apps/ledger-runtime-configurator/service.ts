import { createHash } from "node:crypto";
import type {
  LedgerConfiguratorSummaryV010,
  LedgerConfiguratorValidationV010,
  LedgerRuntimeSourceConfigurationV010,
  LedgerRuntimeTemplateV010
} from "./contracts.js";
import {
  bookkeepingDefaultConfiguration,
  bookkeepingReferenceLegacyPostingRules
} from "./default-library.js";
import {
  compileConfiguration,
  compileExpression,
  type CompiledLedgerRuntimeConfigurationV010
} from "./expression-compiler.js";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, canonicalize(child)])
    );
  }
  return value;
}

function digest(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex");
}

export interface LedgerRuntimeConfiguratorService {
  getCurrent(): LedgerRuntimeSourceConfigurationV010;
  getSummary(): LedgerConfiguratorSummaryV010;
  validate(input?: LedgerRuntimeSourceConfigurationV010): LedgerConfiguratorValidationV010;
  importConfiguration(input: LedgerRuntimeSourceConfigurationV010): LedgerConfiguratorValidationV010;
  exportTemplate(): LedgerRuntimeTemplateV010;
  importTemplate(input: LedgerRuntimeTemplateV010): LedgerConfiguratorValidationV010;
  resetToBookkeepingDefault(): LedgerConfiguratorValidationV010;
  compileCurrent(): CompiledLedgerRuntimeConfigurationV010;
}

export function createLedgerRuntimeConfiguratorService(): LedgerRuntimeConfiguratorService {
  let current = clone(bookkeepingDefaultConfiguration);

  function validate(input: LedgerRuntimeSourceConfigurationV010 = current): LedgerConfiguratorValidationV010 {
    const errors: LedgerConfiguratorValidationV010["errors"] = [];
    const warnings: LedgerConfiguratorValidationV010["warnings"] = [];

    if (
      input.contractVersion !== "0.1.0"
      || input.kind !== "evo.ledger-runtime.source-configuration"
      || input.expressionLanguage !== "bookkeeping-aviator-v1"
    ) {
      errors.push({ code: "CONFIGURATION_CONTRACT_INVALID", message: "Unsupported Ledger Runtime source configuration contract or expression language." });
    }

    const accountIds = new Set<number>();
    for (const account of input.accounts) {
      if (accountIds.has(account.id)) errors.push({ code: "DUPLICATE_ACCOUNT", message: `Duplicate account/ledger id '${account.id}'.` });
      accountIds.add(account.id);
    }

    const applicationIds = new Set<string>();
    for (const app of input.applications) {
      if (applicationIds.has(app.applicationId)) errors.push({ code: "DUPLICATE_APPLICATION", message: `Duplicate applicationId '${app.applicationId}'.` });
      applicationIds.add(app.applicationId);
    }

    const dictionaryKeys = new Set<string>();
    for (const item of input.dictionaries) {
      const key = `${item.key}::${item.type ?? ""}`;
      if (dictionaryKeys.has(key)) errors.push({ code: "DUPLICATE_DICTIONARY_KEY", message: `Duplicate dictionary key/type '${key}'.` });
      dictionaryKeys.add(key);
    }

    for (const rule of input.postingRules) {
      if (!applicationIds.has(rule.applicationId)) {
        errors.push({ code: "POSTING_RULE_APPLICATION_MISSING", message: `Rule '${rule.sourceId}' references missing applicationId '${rule.applicationId}'.` });
      }
      if (!accountIds.has(rule.ledgerId)) {
        errors.push({ code: "POSTING_RULE_LEDGER_MISSING", message: `Rule '${rule.sourceId}' references missing ledger/account '${rule.ledgerId}'.` });
      }
      if (!rule.direction.trim()) {
        errors.push({ code: "POSTING_RULE_DIRECTION_MISSING", message: `Rule '${rule.sourceId}' has no direction.` });
      }
    }

    const accountCapabilityGaps = input.accounts.filter(
      item => item.objectBusinessType === null || item.allowNegative === null || item.costCalcConfig === null
    ).length;
    if (accountCapabilityGaps > 0) {
      warnings.push({
        code: "SOURCE_DEFAULT_VALUES_NOT_PRESENT",
        message: "Later bookkeeping code exposes account configuration fields whose default values are not present in the imported SQL snapshot; they remain explicit null/unset values.",
        count: accountCapabilityGaps
      });
    }

    const blockers: LedgerConfiguratorValidationV010["burn"]["blockers"] = [];
    const uniqueExpressions = new Set<string>();
    for (const rule of input.postingRules) {
      for (const value of [rule.quantityFormula, rule.amountFormula, rule.entryConditions]) {
        if (value !== null && value.trim().length > 0) uniqueExpressions.add(value);
      }
    }
    let expressionCompileFailures = 0;
    for (const source of uniqueExpressions) {
      try {
        compileExpression(source);
      } catch (error) {
        expressionCompileFailures += 1;
        if (expressionCompileFailures <= 20) {
          errors.push({
            code: "EXPRESSION_COMPILE_FAILED",
            message: `${source}: ${error instanceof Error ? error.message : String(error)}`
          });
        }
      }
    }
    if (expressionCompileFailures > 20) {
      errors.push({
        code: "EXPRESSION_COMPILE_FAILED_MORE",
        message: `${expressionCompileFailures - 20} additional unique expressions failed compilation.`
      });
    }

    const serverFormulaNames = [
      "成本", "成本合计", "借方成本", "贷方成本", "成本入库",
      "借方", "贷方", "贷方合计", "借方合计", "分摊成本", "跨库成本"
    ];
    const costDerivedRules = input.postingRules.filter(rule =>
      rule.amountFormula !== null
      && serverFormulaNames.some(name => rule.amountFormula?.includes(name))
    ).length;
    if (costDerivedRules > 0) {
      warnings.push({
        code: "LEDGER_RUNTIME_BUILTINS_PRESENT",
        message: "Cost/debit/credit aggregate expressions compile to runtime builtin nodes. Their algorithms remain runtime-provider capabilities rather than Configurator formulas.",
        count: costDerivedRules
      });
    }

    return {
      ok: errors.length === 0,
      semanticDigest: digest(input),
      errors,
      warnings,
      summary: {
        accounts: input.accounts.length,
        applications: input.applications.length,
        dictionaries: input.dictionaries.length,
        postingRules: input.postingRules.length
      },
      burn: {
        ready: errors.length === 0 && blockers.length === 0,
        blockers
      }
    };
  }

  function getSummary(): LedgerConfiguratorSummaryV010 {
    const validation = validate(current);
    return {
      configurationId: current.configurationId,
      displayName: current.displayName,
      semanticDigest: validation.semanticDigest,
      counts: {
        ...validation.summary,
        referenceLegacyPostingRules: bookkeepingReferenceLegacyPostingRules.length
      },
      sourceLibraries: [
        {
          id: "bookkeeping-default",
          displayName: "Bookkeeping policy.sql runtime-used baseline",
          status: "ACTIVE_BASELINE",
          source: "src/main/resources/policy.sql",
          ruleCount: bookkeepingDefaultConfiguration.postingRules.length
        },
        {
          id: "bookkeeping-legacy-posting-rules",
          displayName: "Bookkeeping 记账规则.sql reference rule set",
          status: "REFERENCE",
          source: "src/main/resources/记账规则.sql",
          ruleCount: bookkeepingReferenceLegacyPostingRules.length
        }
      ],
      burnReady: validation.burn.ready
    };
  }

  return {
    getCurrent: () => clone(current),
    getSummary,
    validate,
    importConfiguration(input) {
      const result = validate(input);
      if (result.ok) current = clone(input);
      return result;
    },
    exportTemplate() {
      const configuration = clone(current);
      const validation = validate(configuration);
      return {
        contractVersion: "0.1.0",
        kind: "evo.ledger-runtime.template",
        templateId: configuration.configurationId,
        displayName: configuration.displayName,
        semanticDigest: validation.semanticDigest,
        configuration,
        compatibility: {
          burnReady: validation.burn.ready,
          requiredRuntimeCapabilities: [
            "expression.evo-ir-v1",
            "legacy-import.bookkeeping-aviator-v1",
            "direction.financial-dr-cr",
            "direction.business-add-sub",
            "amount.runtime-builtins"
          ],
          blockers: clone(validation.burn.blockers)
        }
      };
    },
    importTemplate(input) {
      if (input.contractVersion !== "0.1.0" || input.kind !== "evo.ledger-runtime.template") {
        return {
          ok: false,
          semanticDigest: digest(input),
          errors: [{ code: "TEMPLATE_CONTRACT_INVALID", message: "Unsupported Ledger Runtime template contract." }],
          warnings: [],
          summary: { accounts: 0, applications: 0, dictionaries: 0, postingRules: 0 },
          burn: { ready: false, blockers: [] }
        };
      }
      const actualDigest = digest(input.configuration);
      if (actualDigest !== input.semanticDigest) {
        const validation = validate(input.configuration);
        return {
          ...validation,
          ok: false,
          semanticDigest: actualDigest,
          errors: [
            ...validation.errors,
            { code: "TEMPLATE_DIGEST_MISMATCH", message: "Template semanticDigest does not match its configuration content." }
          ],
          burn: { ...validation.burn, ready: false }
        };
      }
      return this.importConfiguration(input.configuration);
    },
    resetToBookkeepingDefault() {
      current = clone(bookkeepingDefaultConfiguration);
      return validate(current);
    },
    compileCurrent() {
      const validation = validate(current);
      if (!validation.burn.ready) {
        throw new Error("Current Ledger Runtime configuration is not burn-ready.");
      }
      return compileConfiguration(current, validation.semanticDigest);
    }
  };
}
