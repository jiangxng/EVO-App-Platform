import type { JsonValue } from "../runtime/contracts.js";
import type {
  EidosContextNavigationV010
} from "../navigation/context-navigation.js";
export type CatalogStatusTone = "neutral" | "positive" | "warning";

export interface CatalogBrowserActionV010 {
  id: string;
  label: string;
  type: "command" | "navigate" | "download";
  command?: string;
  inputVersion?: string;
  route?: string;
  href?: string;
  downloadFileName?: string;
  requiresConfirmation?: boolean;
  enabled?: boolean;
  disabledReason?: string;
  helpText?: string;
  primary?: boolean;
  values?: Record<string, JsonValue>;
}

export interface CatalogBrowserThumbnailV010 {
  src: string;
  alt: string;
}

export interface CatalogBrowserItemV010 {
  id: string;
  title: string;
  thumbnail?: CatalogBrowserThumbnailV010;
  summary?: string;
  version?: string;
  category?: string;
  badges?: string[];
  status?: { id?: string; label: string; tone?: CatalogStatusTone };
  primaryAction?: CatalogBrowserActionV010;
  secondaryActions?: CatalogBrowserActionV010[];
  metadata?: Record<string, string | number | boolean | null>;
}

export interface CatalogBrowserV010 {
  contractVersion: "0.1.0";
  kind: "catalog-browser";
  /**
   * grid: browse/discovery cards such as stores and galleries.
   * list: management/work records where scanning and direct actions dominate.
   */
  layout?: "grid" | "list";
  density?: "comfortable" | "compact";
  /**
   * Makes the item's primary navigate action the row-level navigation affordance.
   * Use for management lists with one obvious destination; secondary actions remain explicit.
   */
  itemActivation?: "primary-action";
  id: string;
  title: string;
  description?: string;
  contextNavigation?: EidosContextNavigationV010;
  actions?: CatalogBrowserActionV010[];
  collectionTitle?: string;
  collectionDescription?: string;
  search?: {
    placeholder?: string;
    ariaLabel?: string;
    noResultsMessage?: string;
  };
  items: CatalogBrowserItemV010[];
  emptyMessage?: string;
}
