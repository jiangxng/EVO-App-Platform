/**
 * CV-01 experimental public read model. This is not a storage model, an Eidos
 * renderer or an authorization grant. Domain owners expose authorized rows.
 */
export interface DataCollectionQueryV010 {
  search?: string;
  sort?: string;
  direction?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface DataCollectionPageInfoV010 {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  countKind: "EXACT" | "ESTIMATED" | "UNKNOWN";
}

export type DataCollectionCellV010 = string | number | boolean | null;

export interface DataCollectionRowV010 {
  rowId: string;
  cells: Record<string, DataCollectionCellV010>;
}

export interface DataCollectionResultV010 {
  contractVersion: "0.1.0";
  collectionId: string;
  schemaRef: string;
  readableFieldIds: string[];
  rows: DataCollectionRowV010[];
  pageInfo: DataCollectionPageInfoV010;
}
