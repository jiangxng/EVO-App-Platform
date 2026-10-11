# Counterparty Analytics Entry Principle v0.1

**Status:** REFERENCE / FUTURE PRODUCT DIRECTION  
**Date:** 2026-10-08  
**Program:** Foundation Object Program  
**Related scope:** Long-term BI / management analytics direction. Not a CP-05/CP-06 gate or near-term delivery dependency.  
**Canonical object:** Counterparty / 往来对象

## 1. Purpose

This note records a product/architecture conclusion reached at CP-04 closure:

> Counterparty lists and role projections are necessary operational views, but raw counts such as "number of customers" or "number of suppliers" are rarely the management outcome users care about. Their higher-value role is to become governed entry points into customer health, activity, risk, supplier performance and supply-chain stability analysis.

This document is a long-term BI / management analytics reference. It does **not** expand CP-04 scope, does **not** add CP-05/CP-06 acceptance criteria, and must not be used as a near-term delivery dependency.

## 2. External product comparison

### 2.1 Customer side

Salesforce Customer Health Score combines adoption, support and relationship signals to represent the vitality of a customer relationship and to predict renewal/risk. Salesforce also exposes revenue-at-risk and churn-oriented signals rather than treating account count as the management outcome.

Microsoft Dynamics 365 Customer Insights aggregates account engagement signals such as email/meeting activity, days since last contact and related interaction measures into an engagement score. The customer card can then expose the score and interaction history, and the same measures can be used to create segments such as stale accounts.

**Implication for EVO:** a Customer projection should remain a stable list of Counterparty identities, but future management value should come from derived questions such as:

- Which customers are active, cooling, dormant or reactivating?
- Which accounts are growing or shrinking?
- Which customers carry material revenue or collection risk?
- Which relationships require intervention now?
- Which owner/team is responsible for the next action?

### 2.2 Supplier side

SAP Supplier Evaluation uses operational criteria such as on-time delivery, quantity and price variance, and quality. Supplier scores can be trended over time and drilled down by supplier, purchasing group, material group and documents.

SAP Ariba Supplier Risk combines supplier data and risk incidents into risk exposure. SAP also exposes performance score directly on a supplier profile with navigation into detailed evaluations.

IBM supply-chain resilience guidance emphasizes outcome-oriented resilience measures such as time-to-survive and time-to-recover.

**Implication for EVO:** Supplier count is master-data inventory, not supply-chain health. Higher-value questions include:

- Which suppliers are becoming less reliable?
- Where are on-time delivery, quality or quantity deviations deteriorating?
- Which critical materials depend on concentrated or fragile supply?
- Which supplier risks are increasing?
- How quickly can the enterprise continue operating or recover after disruption?

## 3. Product conclusion

The Counterparty experience should distinguish three layers.

### Layer A — Identity / operational list

Examples:

- Counterparties
- Customers
- Suppliers
- My Customers
- My Suppliers

Purpose:

- find and open a stable identity;
- perform ordinary master-data work;
- navigate by role/responsibility;
- provide a safe, permission-governed base projection.

This is the scope proven by CP-04.

### Layer B — Derived management signals

Examples:

- Active Customers
- Dormant / At-risk Customers
- Customer Health
- Revenue at Risk
- Supplier Performance
- Supplier Risk
- Supply Stability

These are **derived views**, not new Counterparty identities.

They must be computed from business facts, time windows, relationship roles, responsibility, permissions and enterprise-specific definitions.

### Layer C — Analysis / action

A user should be able to start from a list, a scorecard, an alert, a chart, a Workbench item or an Agent answer and reach the same governed underlying Counterparty.

The list is therefore one analysis entry among several, not the final dashboard.

## 4. Architecture boundary

The following ownership rule is durable:

~~~text
Counterparty
= stable identity + relationship roles + profile/facets

Responsibility
= who owns or is accountable for the relationship/work

EVO / owning business runtimes
= transaction and operational facts

Analytics / projection providers
= derived measures, scores, segments, trends and risk signals

Eidos
= list/profile/dashboard/analysis rendering and drill-down

Experience Compiler
= learnable indicator patterns, benchmark knowledge and adaptation proposals;
  not authoritative runtime calculation state
~~~

Do not write "active", "healthy", "stable" or similar analytical conclusions back into Counterparty core identity as permanent truth.

## 5. Definition rule for analytical labels

Terms such as **Active Customer** and **Stable Supplier** are contextual definitions.

They must be explicit about:

- observation window;
- source facts;
- thresholds;
- weighting;
- enterprise/industry context;
- effective time;
- version of the calculation;
- authorization/data scope.

Example:

~~~text
Active Customer
!= CUSTOMER role

Active Customer
= CUSTOMER role
∩ authorized scope
∩ configured recent-business / engagement conditions
~~~

Likewise:

~~~text
Stable Supplier
!= SUPPLIER role

Stable Supplier
= SUPPLIER role
∩ authorized scope
∩ delivery / quality / quantity / price / risk evidence
∩ configured stability policy
~~~

The exact formulas are intentionally **not** frozen in this document.

## 6. UX principle

Do not over-invest in decorating the basic Customer/Supplier list merely to make raw master-data counts look like management insight.

Future evolution may add lightweight indicators to rows/cards, but their purpose is navigation and prioritization, for example:

- health/risk band;
- recent activity;
- trend direction;
- responsible owner;
- unresolved exception count;
- recommended next action.

Selecting an indicator should drill into its evidence and analysis rather than presenting an unexplained score.

## 7. Relationship to CP-04

CP-04 remains correctly scoped.

Its lasting value is not the visual importance of four lists. It proves the governed substrate required for future analytics:

~~~text
authorized data scope
∩ relationship role
∩ responsibility relation
= safe role/responsibility projection
~~~

Future health/risk/activity projections can build on this substrate without duplicating Counterparty identities or leaking unauthorized records/fields.

## 8. Future use

Use this note only when the product enters a dedicated BI / management analytics line.

Potential future consumers may include:

- customer/supplier analytics;
- management dashboards and scorecards;
- operational observability/analysis surfaces where relationship health affects operating flow;
- industry-specific analytical models and Experience Compiler knowledge.

This note is deliberately **non-gating** for Foundation Object milestones. CP-05, CP-06 and other near-term object/application milestones proceed from their own business acceptance criteria and must not inherit BI features from this document.

Preferred product questions should move from:

- "How many customers do we have?"
- "How many suppliers do we have?"

toward:

- "Which customers are healthy, active, growing or at risk, and why?"
- "Which suppliers make the supply chain more or less stable, and why?"
- "What changed, what is likely to matter, and who should act?"

## 9. Public references reviewed

1. Salesforce Help — Customer Health Score (CHS): https://help.salesforce.com/s/articleView?id=analytics.csi_score_work_metrics_chs.htm&language=en_US&type=5
2. Salesforce Help — CSI Metrics: https://help.salesforce.com/s/articleView?id=analytics.csi_score_work_metrics.htm&language=en_US&type=5
3. Microsoft Learn — Dynamics 365 Customer Insights account engagement enrichment: https://learn.microsoft.com/en-us/dynamics365/customer-insights/data/b2b/enrichment-office
4. Microsoft Learn — Customer activities: https://learn.microsoft.com/en-us/dynamics365/customer-insights/data/activities
5. SAP Help — Operational Supplier Evaluation: https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/af9ef57f504840d2b81be8667206d485/3eacc15585e5727fe10000000a44538d.html
6. SAP Help — Determining Scores: https://help.sap.com/docs/SAP_S4HANA_CLOUD/af9ef57f504840d2b81be8667206d485/174c1656214a410ee10000000a441470-70.html
7. SAP Help — Performance Score Display in Supplier Profile: https://help.sap.com/docs/ariba/f5681fbd739744be88f4f5e8f8a49ead/8de9f73c82f14d3f88fa37e9ecdab2f7.html
8. SAP Help — Supplier Profile / Supplier List: https://help.sap.com/docs/PRODUCT_ID/79c07a7005f74535bd3f50a98ebe3127/8c7e5f19d7a94f658a75d37e76b68d20.html
9. SAP Help — Risk Exposure Calculation Models: https://help.sap.com/docs/strategic-sourcing/setting-up-sap-ariba-supplier-risk/understanding-how-risk-exposure-is-calculated-b73f5772201f453199e9357e1a4373fb
10. IBM — Supply Chain Resiliency: https://www.ibm.com/think/topics/supply-chain-resiliency
