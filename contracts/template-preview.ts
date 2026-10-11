import type { TemplateProjectionEdgePathKindV010, TemplateProjectionEdgeAnchorV010, TemplateProjectionEdgePointV010 } from "./template-projection-gallery.js";

export const VISUAL_2D_VIEWER_CAPABILITY_V010 = "visual.viewer.2d";
export const TEMPLATE_2D_PREVIEW_ROUTE_V010 = "/template-preview/2d";

export interface TemplatePreviewPropertyV010 {
  key: string;
  label: string;
  value: string | number | boolean | null;
  detail?: string;
}

export interface TemplatePreviewNodeV010 {
  id: string;
  kind: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: "rectangle" | "rounded-rectangle";
  typeLabel?: string;
  detail?: string;
  properties?: TemplatePreviewPropertyV010[];
}

export interface TemplatePreviewEdgeV010 {
  id: string;
  source: string;
  target: string;
  kind: string;
  label?: string;
  arrow?: "none" | "start" | "end" | "both";
  /** Optional rendering route, not a business relationship type. */
  pathKind?: TemplateProjectionEdgePathKindV010;
  waypoints?: TemplateProjectionEdgePointV010[];
  sourceAnchor?: TemplateProjectionEdgeAnchorV010;
  targetAnchor?: TemplateProjectionEdgeAnchorV010;
  detail?: string;
  properties?: TemplatePreviewPropertyV010[];
}

export interface Template2dPreviewV010 {
  contractVersion: "0.1.0";
  nodes: TemplatePreviewNodeV010[];
  edges: TemplatePreviewEdgeV010[];
}

export interface TemplatePreviewArtifactV010 {
  contractVersion: "0.1.0";
  templateId: string;
  templateVersion: number;
  projectionId?: string;
  title: string;
  description?: string;
  definitionKind: string;
  diagram2d?: Template2dPreviewV010;
}

export interface TemplatePreviewArtifactSourceV010 {
  get(input: {
    templateId: string;
    templateVersion?: number;
    projectionId?: string;
  }): TemplatePreviewArtifactV010 | undefined;
}

export interface TemplatePreviewSelectionV010 {
  contractVersion: "0.1.0";
  templateId: string;
  templateVersion: number;
  projectionId?: string;
  selectedAt: string;
}

export interface TemplatePreviewSessionStoreV010 {
  set(sessionKey: string, selection: TemplatePreviewSelectionV010): void;
  get(sessionKey: string): TemplatePreviewSelectionV010 | undefined;
  remove(sessionKey: string): void;
}
