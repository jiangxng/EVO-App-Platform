import type { LedgerConfiguratorPostingRuleV010, LedgerRuntimeSourceConfigurationV010 } from "./contracts.js";

export type EvoExpressionIr =
  | { type: "literal"; value: null | boolean | number | string }
  | { type: "field"; path: string }
  | { type: "builtin"; name: string }
  | { type: "not"; value: EvoExpressionIr }
  | { type: "and" | "or"; values: EvoExpressionIr[] }
  | { type: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "add" | "sub" | "mul" | "div"; left: EvoExpressionIr; right: EvoExpressionIr }
  | { type: "conditional"; condition: EvoExpressionIr; whenTrue: EvoExpressionIr; whenFalse: EvoExpressionIr }
  | { type: "split"; value: EvoExpressionIr; separator: EvoExpressionIr }
  | { type: "contains"; collection: EvoExpressionIr; value: EvoExpressionIr };

export type CanonicalDirection = "DEBIT" | "CREDIT" | "ADD" | "SUB";

export interface CompiledPostingRuleV010 {
  sourceId: number;
  applicationId: string;
  ledgerId: number;
  ledgerTitle: string | null;
  direction: CanonicalDirection;
  conditionAst: EvoExpressionIr;
  quantityAst: EvoExpressionIr | null;
  amountAst: EvoExpressionIr | null;
  source: string;
}

export interface CompiledLedgerRuntimeConfigurationV010 {
  contractVersion: "0.1.0";
  kind: "evo.ledger-runtime.compiled-configuration";
  sourceDialect: "bookkeeping-aviator-v1";
  configurationId: string;
  semanticDigest: string;
  accounts: Array<{ id: number; title: string; isFinance: boolean }>;
  applications: Array<{ applicationId: string; title: string }>;
  rules: CompiledPostingRuleV010[];
  compiler: {
    expressionIrVersion: 1;
    uniqueExpressionCount: number;
    compiledExpressionCount: number;
    builtinNames: string[];
  };
}

type TokenType = "identifier" | "string" | "number" | "operator" | "punctuation" | "eof";
interface Token { type: TokenType; value: string; position: number }

const BUILTIN_NAMES = new Map<string, string>([
  ["成本", "cost"],
  ["成本合计", "costTotal"],
  ["借方成本", "debitCost"],
  ["贷方成本", "creditCost"],
  ["成本入库", "inboundCost"],
  ["借方", "debitTotal"],
  ["贷方", "creditTotal"],
  ["贷方合计", "creditTotal"],
  ["借方合计", "debitTotal"],
  ["分摊成本", "allocatedCost"],
  ["跨库成本", "globalCost"]
]);

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const push = (type: TokenType, value: string, position: number) => tokens.push({ type, value, position });
  const isSpace = (c: string) => /\s/u.test(c);
  const isBoundary = (c: string) => /[()?,:+\-*\/<>!=&|]/u.test(c);

  while (i < source.length) {
    const start = i;
    const c = source[i]!;
    if (isSpace(c)) { i += 1; continue; }

    if (c === "'" || c === '"') {
      const quote = c;
      i += 1;
      let value = "";
      while (i < source.length) {
        const ch = source[i]!;
        if (ch === "\\") {
          const next = source[i + 1];
          if (next === undefined) throw new Error(`Unterminated escape at ${i}.`);
          value += next;
          i += 2;
          continue;
        }
        if (ch === quote) { i += 1; break; }
        value += ch;
        i += 1;
      }
      if (source[i - 1] !== quote) throw new Error(`Unterminated string at ${start}.`);
      push("string", value, start);
      continue;
    }

    const two = source.slice(i, i + 2);
    if (["==", "!=", ">=", "<=", "&&", "||"].includes(two)) {
      push("operator", two, start);
      i += 2;
      continue;
    }
    if (["+", "-", "*", "/", ">", "<", "!"].includes(c)) {
      push("operator", c, start);
      i += 1;
      continue;
    }
    if (["(", ")", "?", ":", ","].includes(c)) {
      push("punctuation", c, start);
      i += 1;
      continue;
    }

    if (/[0-9]/u.test(c)) {
      i += 1;
      while (i < source.length && /[0-9.]/u.test(source[i]!)) i += 1;
      push("number", source.slice(start, i), start);
      continue;
    }

    i += 1;
    while (i < source.length && !isSpace(source[i]!) && !isBoundary(source[i]!)) i += 1;
    const value = source.slice(start, i).trim();
    if (value.length === 0) throw new Error(`Unexpected token at ${start}.`);
    push("identifier", value, start);
  }

  push("eof", "", source.length);
  return tokens;
}

class Parser {
  private index = 0;
  constructor(private readonly source: string, private readonly tokens: Token[]) {}

  parse(): EvoExpressionIr {
    const value = this.parseConditional();
    this.expect("eof");
    return value;
  }

  private current(): Token { return this.tokens[this.index]!; }
  private consume(): Token { return this.tokens[this.index++]!; }

  private match(value: string): boolean {
    if (this.current().value !== value) return false;
    this.index += 1;
    return true;
  }

  private expect(type: TokenType, value?: string): Token {
    const token = this.current();
    if (token.type !== type || (value !== undefined && token.value !== value)) {
      throw new Error(`Expected ${value ?? type} at ${token.position} in '${this.source}'.`);
    }
    this.index += 1;
    return token;
  }

  private parseConditional(): EvoExpressionIr {
    const condition = this.parseOr();
    if (!this.match("?")) return condition;
    const whenTrue = this.parseConditional();
    this.expect("punctuation", ":");
    const whenFalse = this.parseConditional();
    return { type: "conditional", condition, whenTrue, whenFalse };
  }

  private parseOr(): EvoExpressionIr {
    const values = [this.parseAnd()];
    while (this.match("||")) values.push(this.parseAnd());
    return values.length === 1 ? values[0]! : { type: "or", values };
  }

  private parseAnd(): EvoExpressionIr {
    const values = [this.parseEquality()];
    while (this.match("&&")) values.push(this.parseEquality());
    return values.length === 1 ? values[0]! : { type: "and", values };
  }

  private parseEquality(): EvoExpressionIr {
    let left = this.parseComparison();
    while (["==", "!="].includes(this.current().value)) {
      const op = this.consume().value;
      const right = this.parseComparison();
      left = { type: op === "==" ? "eq" : "ne", left, right };
    }
    return left;
  }

  private parseComparison(): EvoExpressionIr {
    let left = this.parseAdditive();
    while ([">", ">=", "<", "<="].includes(this.current().value)) {
      const op = this.consume().value;
      const right = this.parseAdditive();
      const type = op === ">" ? "gt" : op === ">=" ? "gte" : op === "<" ? "lt" : "lte";
      left = { type, left, right };
    }
    return left;
  }

  private parseAdditive(): EvoExpressionIr {
    let left = this.parseMultiplicative();
    while (["+", "-"].includes(this.current().value)) {
      const op = this.consume().value;
      const right = this.parseMultiplicative();
      left = { type: op === "+" ? "add" : "sub", left, right };
    }
    return left;
  }

  private parseMultiplicative(): EvoExpressionIr {
    let left = this.parseUnary();
    while (["*", "/"].includes(this.current().value)) {
      const op = this.consume().value;
      const right = this.parseUnary();
      left = { type: op === "*" ? "mul" : "div", left, right };
    }
    return left;
  }

  private parseUnary(): EvoExpressionIr {
    if (this.match("!")) return { type: "not", value: this.parseUnary() };
    if (this.match("-")) return { type: "sub", left: { type: "literal", value: 0 }, right: this.parseUnary() };
    return this.parsePrimary();
  }

  private parsePrimary(): EvoExpressionIr {
    const token = this.current();
    if (this.match("(")) {
      const expression = this.parseConditional();
      this.expect("punctuation", ")");
      return expression;
    }
    if (token.type === "string") {
      this.consume();
      return { type: "literal", value: token.value };
    }
    if (token.type === "number") {
      this.consume();
      return { type: "literal", value: token.value };
    }
    if (token.type !== "identifier") {
      throw new Error(`Unexpected token '${token.value}' at ${token.position} in '${this.source}'.`);
    }

    this.consume();
    const name = token.value;
    if (name === "true") return { type: "literal", value: true };
    if (name === "false") return { type: "literal", value: false };
    if (name === "null") return { type: "literal", value: null };

    if (this.match("(")) {
      const args: EvoExpressionIr[] = [];
      if (!this.match(")")) {
        do { args.push(this.parseConditional()); } while (this.match(","));
        this.expect("punctuation", ")");
      }
      if (name === "include") {
        if (args.length !== 2) throw new Error("include() requires two arguments.");
        return { type: "contains", collection: args[0]!, value: args[1]! };
      }
      if (name === "string.split" || name === "split") {
        if (args.length !== 2) throw new Error("split() requires two arguments.");
        return { type: "split", value: args[0]!, separator: args[1]! };
      }
      const builtin = BUILTIN_NAMES.get(name) ?? (name.endsWith("Cost") || name.endsWith("Total") ? name : undefined);
      if (builtin !== undefined) {
        if (args.length > 0) throw new Error(`Builtin '${name}' does not accept arguments in v0.1.`);
        return { type: "builtin", name: builtin };
      }
      throw new Error(`Unsupported function '${name}'.`);
    }

    const builtin = BUILTIN_NAMES.get(name);
    return builtin === undefined ? { type: "field", path: name } : { type: "builtin", name: builtin };
  }
}

export function compileExpression(source: string): EvoExpressionIr {
  const trimmed = source.trim();
  if (trimmed.length === 0) return { type: "literal", value: null };
  return new Parser(trimmed, tokenize(trimmed)).parse();
}

export function canonicalDirection(source: string): CanonicalDirection {
  const value = source.trim().toLowerCase();
  if (["借方", "dr", "debit"].includes(value)) return "DEBIT";
  if (["贷方", "cr", "credit"].includes(value)) return "CREDIT";
  if (["增加", "add", "increase", "+"].includes(value)) return "ADD";
  if (["减少", "sub", "decrease", "-"].includes(value)) return "SUB";
  throw new Error(`Unsupported posting direction '${source}'.`);
}

function expressionSources(rule: LedgerConfiguratorPostingRuleV010): string[] {
  return [rule.quantityFormula, rule.amountFormula, rule.entryConditions]
    .filter((value): value is string => value !== null && value.trim().length > 0);
}

function builtinsIn(expression: EvoExpressionIr, output: Set<string>): void {
  if (expression.type === "builtin") output.add(expression.name);
  if ("left" in expression) { builtinsIn(expression.left, output); builtinsIn(expression.right, output); }
  if (expression.type === "not") builtinsIn(expression.value, output);
  if (expression.type === "and" || expression.type === "or") for (const value of expression.values) builtinsIn(value, output);
  if (expression.type === "conditional") {
    builtinsIn(expression.condition, output);
    builtinsIn(expression.whenTrue, output);
    builtinsIn(expression.whenFalse, output);
  }
  if (expression.type === "split") { builtinsIn(expression.value, output); builtinsIn(expression.separator, output); }
  if (expression.type === "contains") { builtinsIn(expression.collection, output); builtinsIn(expression.value, output); }
}

export function compileConfiguration(
  source: LedgerRuntimeSourceConfigurationV010,
  semanticDigest: string
): CompiledLedgerRuntimeConfigurationV010 {
  const uniqueSources = new Set<string>();
  const compiledBySource = new Map<string, EvoExpressionIr>();

  for (const rule of source.postingRules) {
    for (const expressionSource of expressionSources(rule)) {
      uniqueSources.add(expressionSource);
      if (!compiledBySource.has(expressionSource)) compiledBySource.set(expressionSource, compileExpression(expressionSource));
    }
  }

  const builtinNames = new Set<string>();
  const rules = source.postingRules.map((rule): CompiledPostingRuleV010 => {
    const conditionAst = rule.entryConditions === null || rule.entryConditions.trim().length === 0
      ? { type: "literal", value: true } as const
      : compiledBySource.get(rule.entryConditions)!;
    const quantityAst = rule.quantityFormula === null || rule.quantityFormula.trim().length === 0
      ? null
      : compiledBySource.get(rule.quantityFormula)!;
    const amountAst = rule.amountFormula === null || rule.amountFormula.trim().length === 0
      ? null
      : compiledBySource.get(rule.amountFormula)!;
    builtinsIn(conditionAst, builtinNames);
    if (quantityAst !== null) builtinsIn(quantityAst, builtinNames);
    if (amountAst !== null) builtinsIn(amountAst, builtinNames);
    return {
      sourceId: rule.sourceId,
      applicationId: rule.applicationId,
      ledgerId: rule.ledgerId,
      ledgerTitle: rule.ledgerTitle,
      direction: canonicalDirection(rule.direction),
      conditionAst,
      quantityAst,
      amountAst,
      source: rule.source
    };
  });

  return {
    contractVersion: "0.1.0",
    kind: "evo.ledger-runtime.compiled-configuration",
    sourceDialect: "bookkeeping-aviator-v1",
    configurationId: source.configurationId,
    semanticDigest,
    accounts: source.accounts.map(account => ({ id: account.id, title: account.title, isFinance: account.isFinance })),
    applications: source.applications.map(app => ({ applicationId: app.applicationId, title: app.title })),
    rules,
    compiler: {
      expressionIrVersion: 1,
      uniqueExpressionCount: uniqueSources.size,
      compiledExpressionCount: compiledBySource.size,
      builtinNames: [...builtinNames].sort()
    }
  };
}
