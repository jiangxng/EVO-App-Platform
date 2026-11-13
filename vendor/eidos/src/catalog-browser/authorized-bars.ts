/**
 * CV06 presentation only: the domain must supply authorized full-query
 * aggregates. Never infer a global metric from current-page table rows.
 */
export interface CatalogAuthorizedAggregateBarsV010 {
  contractVersion: "0.1.0";
  kind: "authorized-aggregate-bars";
  title: string;
  metricId: string;
  dimensionFieldId: string;
  schemaRef: string;
  unit: string;
  asOf: string;
  scope: "AUTHORIZED_ALL_MATCHING_ROWS";
  total: number | null;
  countKind: "EXACT" | "SUPPRESSED";
  buckets: readonly {
    key: string;
    label: string;
    count: number | null;
    countKind: "EXACT" | "SUPPRESSED";
  }[];
  suppressedLabel: string;
  totalLabel: string;
  asOfLabel: string;
}

function escapeText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

/** Shape admission only: authorization belongs to Host and the business owner. */
export function assertAuthorizedAggregateBarsV010(
  input: CatalogAuthorizedAggregateBarsV010
): CatalogAuthorizedAggregateBarsV010 {
  if (!input || input.contractVersion !== "0.1.0"
    || input.kind !== "authorized-aggregate-bars"
    || input.scope !== "AUTHORIZED_ALL_MATCHING_ROWS"
    || !input.title?.trim() || input.title.length > 100
    || !/^[a-z0-9][a-z0-9._:-]{0,119}$/i.test(input.metricId ?? "")
    || !/^[a-z0-9][a-z0-9._:-]{0,79}$/i.test(input.dimensionFieldId ?? "")
    || !/^[a-z0-9][a-z0-9._:/-]{0,159}$/i.test(input.schemaRef ?? "")
    || !input.unit?.trim() || input.unit.length > 36
    || typeof input.asOf !== "string"
    || !Number.isFinite(Date.parse(input.asOf))
    || new Date(input.asOf).toISOString() !== input.asOf
    || !input.suppressedLabel?.trim() || input.suppressedLabel.length > 120
    || !input.totalLabel?.trim() || input.totalLabel.length > 80
    || !input.asOfLabel?.trim() || input.asOfLabel.length > 80
    || !Array.isArray(input.buckets)
    || input.buckets.length < 1 || input.buckets.length > 12
    || !["EXACT","SUPPRESSED"].includes(input.countKind)
    || (input.countKind === "EXACT" && !safeCount(input.total))
    || (input.countKind === "SUPPRESSED" && input.total !== null)) {
    throw new Error("EIDOS_AUTHORIZED_BARS_INVALID");
  }
  const keys = new Set<string>();
  let suppressed = false;
  let sum = 0;
  for (const bucket of input.buckets) {
    if (!bucket || !/^[a-z0-9][a-z0-9._:-]{0,79}$/i.test(bucket.key ?? "")
      || keys.has(bucket.key)
      || !bucket.label?.trim() || bucket.label.length > 120
      || !["EXACT","SUPPRESSED"].includes(bucket.countKind)
      || (bucket.countKind === "EXACT" && !safeCount(bucket.count))
      || (bucket.countKind === "SUPPRESSED" && bucket.count !== null)) {
      throw new Error("EIDOS_AUTHORIZED_BARS_BUCKET_INVALID");
    }
    keys.add(bucket.key);
    if (bucket.countKind === "SUPPRESSED") suppressed = true;
    else sum += bucket.count!;
  }
  if (!Number.isSafeInteger(sum)
    || (suppressed && input.countKind !== "SUPPRESSED")
    || (!suppressed && (input.countKind !== "EXACT" || sum !== input.total))) {
    throw new Error("EIDOS_AUTHORIZED_BARS_TOTAL_INVALID");
  }
  return input;
}

export function renderAuthorizedAggregateBarsToHtmlV010(
  value: CatalogAuthorizedAggregateBarsV010
): string {
  const model = assertAuthorizedAggregateBarsV010(value);
  const max = Math.max(1, ...model.buckets.flatMap(bucket =>
    bucket.countKind === "EXACT" ? [bucket.count!] : []));
  const bars = model.buckets.map(bucket => {
    const exact = bucket.countKind === "EXACT";
    const count = exact ? String(bucket.count) : model.suppressedLabel;
    const width = exact ? Math.round(1000 * bucket.count! / max) / 10 : 0;
    return '<li data-eidos-authorized-bar-key="' + escapeText(bucket.key)
      + '" data-eidos-count-kind="' + bucket.countKind + '">'
      + '<span data-eidos-authorized-bar-label>' + escapeText(bucket.label) + '</span>'
      + '<span data-eidos-authorized-bar-track aria-hidden="true">'
      + (exact
        ? '<span data-eidos-authorized-bar-fill style="width:' + width + '%"></span>'
        : '<span data-eidos-authorized-bar-suppressed></span>')
      + '</span><span data-eidos-authorized-bar-count>' + escapeText(count)
      + '</span></li>';
  }).join("");
  return '<section data-eidos-authorized-aggregate-bars data-eidos-chart-scope="'
    + model.scope + '" aria-labelledby="eidos-aggregate-title-'
    + escapeText(model.metricId) + '">'
    + '<h2 id="eidos-aggregate-title-' + escapeText(model.metricId) + '">'
    + escapeText(model.title) + '</h2>'
    + '<dl data-eidos-authorized-chart-source><div><dt>'
    + escapeText(model.totalLabel) + '</dt><dd>'
    + (model.countKind === "EXACT" ? model.total : escapeText(model.suppressedLabel))
    + '</dd></div><div><dt>' + escapeText(model.asOfLabel) + '</dt><dd>'
    + escapeText(model.asOf) + '</dd></div></dl>'
    + '<ul data-eidos-authorized-bars-list aria-label="' + escapeText(model.title)
    + '">' + bars + '</ul></section>';
}
