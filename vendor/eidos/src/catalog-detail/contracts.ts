import type {
  CatalogBrowserActionV010,
  CatalogBrowserThumbnailV010
} from "../catalog-browser/contracts.js";

export interface CatalogDetailGalleryItemV010 {
  id: string;
  title: string;
  thumbnail: CatalogBrowserThumbnailV010;
  action?: CatalogBrowserActionV010;
}

export interface CatalogDetailGalleryV010 {
  primaryItemId: string;
  items: CatalogDetailGalleryItemV010[];
  /**
   * Optional product-level gallery limit. Template Store / Enterprise Context
   * projection galleries use 9 (1 primary + up to 8 alternates).
   */
  maxItems?: number;
  /**
   * When true, every gallery item must expose a primary action. This allows
   * product surfaces to guarantee that thumbnails are interactive entries into
   * a viewer instead of decorative screenshots.
   */
  requireItemActions?: boolean;
}

export interface CatalogDetailV010 {
  contractVersion: "0.1.0";
  kind: "catalog-detail";
  id: string;
  itemId: string;
  title: string;
  description?: string;
  version?: string;
  category?: string;
  badges?: string[];
  metadata?: Record<string, string | number | boolean | null>;
  gallery: CatalogDetailGalleryV010;
  primaryAction?: CatalogBrowserActionV010;
  secondaryActions?: CatalogBrowserActionV010[];
}
