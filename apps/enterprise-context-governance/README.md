# Enterprise Context Governance

## Product ownership

`evo-enterprise-context-governance` is the existing product ownership boundary for enterprise software/template governance.

No separate Template Plugin or Version Plugin is introduced.

Enterprise Context owns:

- Default Enterprise Template;
- Enterprise Template Catalog;
- enterprise adoption / trimming / adjustment metadata;
- Enterprise Template Working Draft;
- Save Working Draft;
- Create Version;
- immutable version history and diff metadata;
- administrator active-version selection/governance;
- Enterprise Graph Definition / EOG Graph revisions.

Ledger Runtime remains the owner of the Runtime Spec and deterministic execution.

```text
Ledger Runtime = hardware specification + execution
Enterprise Context = enterprise software/template + versions
EOG = projection/editing surface over those existing authorities
```

Activation is a cross-plugin protocol: Enterprise Context selects/requests a version; Ledger Runtime validates compatibility and accepts or rejects execution.

Implementation of the full capability surface may be incremental, but ownership must not drift into EOG or a new plugin.