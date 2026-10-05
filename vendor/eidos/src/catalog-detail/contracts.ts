import type {
  CatalogBrowserActionV010,
  CatalogBrowserThumbnailV010
} from "../catalog-browser/contracts.js";

export interface CatalogDetailGalleryItemV010 {
  id: string;
  title: string;
  thumbnail: CatalogBrowserThumbnailV010;
  action?: CatalogBrowserActionV010;
  secondaryActions?: CatalogBrowserActionV010[];
}

export interface CatalogDetailGalleryV010 {
  primaryItemId: string;
  items: CatalogDetailGalleryItemV010[];
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
