# Bookkeeping Runtime Expression Semantics

This document records executable semantics discovered from the original `jiangxng/bookkeeping` implementation.

## Expression engine

The original project depends on:

```text
com.googlecode.aviator:aviator:5.3.1
```

and evaluates configurable rule expressions through:

```text
AviatorEvaluator.execute(expression, context)
```

Conditions and ordinary quantity/amount formulas are therefore genuine executable configuration, not static labels.

The Ledger Runtime Configurator must preserve these expressions losslessly.

The new implementation does not need to embed Java/Aviator itself. It may implement a deterministic compatible subset/compiler as long as the supported source semantics are preserved and certified against the imported bookkeeping rules.

## Direction model

Bookkeeping intentionally distinguishes financial and non-financial directions:

```text
Dr / 借方  = financial debit
Cr / 贷方  = financial credit
add / 增加 = business-ledger increase
sub / 减少 = business-ledger decrease
-Dr / -Cr  = correction/reversal direction forms
```

Old balance-sign grouping:

```text
in-side  = Dr, add, -Cr
out-side = Cr, sub, -Dr
```

This grouping is an execution mechanic only. It does not erase the semantic distinction between financial Dr/Cr and business add/sub.

## Runtime built-in amount symbols

`Policy.serverFormula` defines these engine-provided symbols:

```text
成本
成本合计
借方成本
贷方成本
成本入库
借方
贷方
贷方合计
借方合计
分摊成本
跨库成本
```

They are **not Configurator fields**.

They are symbols callable/referable from configurable amount expressions, whose values are supplied by Ledger Runtime execution.

The original mapping in `TransdataAccount.sqlFunctionAmount` includes:

- `成本` → historical/current cost lookup for the ledger/object/dimension grain;
- `跨库成本` → global/latest cost lookup;
- `借方成本` / `贷方成本` → opposite-side amount restricted to cost-account IDs and related transaction item;
- `成本合计` → sum of credit-side amount factors for child/sub-items;
- `贷方合计` / `贷方` → sum current temporary-entry amounts on Cr side;
- `借方合计` / `借方` → sum current temporary-entry amounts on Dr side;
- `分摊成本` → cost lookup using inbound/allocation semantics.

The SQL functions/procedures that implemented these values are historical implementation evidence. They are **not exported in Ledger Runtime Template**.

## Architectural consequence

```text
configurable expression
+ BusinessData fields
+ Ledger Runtime built-in functions
→ executable Posting effect
```

Configurator owns the expression text/AST and validation.

Ledger Runtime owns execution semantics and built-in calculation capabilities.
