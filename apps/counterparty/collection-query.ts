import type { DataCollectionResultV010, DataCollectionCellV010 } from "../../contracts/data-collection/query.js";
import { COUNTERPARTY_SCHEMA_V010 } from "./constants.js";
import type { CounterpartyProjectionResultV010 } from "./projection-service.js";

/**
 * CV-01: normalize the EXISTING authorized Counterparty projection, not a new
 * query engine. Role/responsibility/row/field access and server pagination are
 * executed by the domain ProjectionService before this adapter is called.
 */
export function counterpartyProjectionCollectionResultV010(
  projection: CounterpartyProjectionResultV010
): DataCollectionResultV010 {
  if (!projection.pageInfo) {
    // An unbounded legacy read must never be silently advertised as paged.
    throw new Error("COUNTERPARTY_COLLECTION_PAGE_REQUIRED");
  }
  const fields = [...new Set([
    // ID is an existing public Row identity; a denied displayName grant is
    // never silently restored by the collection adapter.
    "counterpartyId", ...projection.readableFieldIds
  ])];
  const allowed = new Set(fields);
  const rows = projection.counterparties.map(record => {
    const cells: Record<string, DataCollectionCellV010> = {};
    for (const [field, value] of Object.entries(record)) {
      if (!allowed.has(field)) continue;
      if (value === null || typeof value === "string"
        || typeof value === "number" || typeof value === "boolean") {
        cells[field] = value;
      }
    }
    // Row identity is already public in the existing domain READ result.
    return { rowId: record.counterpartyId, cells };
  });
  return {
    contractVersion: "0.1.0",
    collectionId: projection.projectionId,
    schemaRef: COUNTERPARTY_SCHEMA_V010,
    readableFieldIds: fields,
    rows,
    pageInfo: { ...projection.pageInfo, countKind: "EXACT" }
  };
}
