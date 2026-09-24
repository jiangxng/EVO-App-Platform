export type CatalogStatusTone = "neutral" | "positive" | "warning";

export interface CatalogBrowserActionV010 {
  id: string;
  label: string;
  requiresConfirmation?: boolean;
}

export interface CatalogBrowserItemV010 {
  id: string;
  title: string;
  summary?: string;
  version?: string;
  category?: string;
  badges?: string[];
  status?: { label: string; tone?: CatalogStatusTone };
  primaryAction?: CatalogBrowserActionV010;
  secondaryActions?: CatalogBrowserActionV010[];
  metadata?: Record<string, string | number | boolean | null>;
}

export interface CatalogBrowserV010 {
  contractVersion: "0.1.0";
  kind: "catalog-browser";
  id: string;
  title: string;
  description?: string;
  items: CatalogBrowserItemV010[];
  emptyMessage?: string;
}
