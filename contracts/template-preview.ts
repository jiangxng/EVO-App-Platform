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
  detail?: string;
  properties?: TemplatePreviewPropertyV010[];
}

export interface TemplatePreviewEdgeV010 {
  id: string;
  source: string;
  target: string;
  kind: string;
  label?: string;
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
  title: string;
  description?: string;
  definitionKind: string;
  diagram2d?: Template2dPreviewV010;
}

export interface TemplatePreviewArtifactSourceV010 {
  get(input: {
    templateId: string;
    templateVersion?: number;
  }): TemplatePreviewArtifactV010 | undefined;
}
