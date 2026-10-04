import type {
  Template2dPreviewV010,
  TemplatePreviewArtifactSourceV010,
  TemplatePreviewArtifactV010,
  TemplatePreviewEdgeV010,
  TemplatePreviewNodeV010
} from "../../contracts/template-preview.js";
import type {
  TemplateStoreRecordV010,
  TemplateStoreRepositoryV010
} from "./repository.js";

function asObject(
  value: unknown
): Record<string, unknown> | undefined {
  return value !== null
    && typeof value === "object"
    && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function previewFromDeclaredPayload(
  payload: unknown
): Template2dPreviewV010 | undefined {
  const root = asObject(payload);
  const preview = asObject(root?.preview2d);
  if (
    preview?.contractVersion !== "0.1.0"
    || !Array.isArray(preview.nodes)
    || !Array.isArray(preview.edges)
  ) {
    return undefined;
  }

  const nodes: TemplatePreviewNodeV010[] = [];
  for (const [index, raw] of preview.nodes.entries()) {
    const node = asObject(raw);
    const id = asString(node?.id);
    const kind = asString(node?.kind);
    const label = asString(node?.label);
    const x = asFiniteNumber(node?.x);
    const y = asFiniteNumber(node?.y);
    const width = asFiniteNumber(node?.width);
    const height = asFiniteNumber(node?.height);
    if (
      !id || !kind || !label
      || x === undefined || y === undefined
      || width === undefined || height === undefined
      || width <= 0 || height <= 0
    ) {
      throw new Error(
        `TEMPLATE_PREVIEW_2D_NODE_INVALID: preview2d.nodes[${index}]`
      );
    }
    nodes.push({
      id,
      kind,
      label,
      x,
      y,
      width,
      height,
      ...(asString(node?.detail) ? { detail: asString(node?.detail)! } : {})
    });
  }

  const nodeIds = new Set(nodes.map(node => node.id));
  const edges: TemplatePreviewEdgeV010[] = [];
  for (const [index, raw] of preview.edges.entries()) {
    const edge = asObject(raw);
    const id = asString(edge?.id);
    const source = asString(edge?.source);
    const target = asString(edge?.target);
    const kind = asString(edge?.kind) ?? "relation";
    if (
      !id || !source || !target
      || !nodeIds.has(source)
      || !nodeIds.has(target)
    ) {
      throw new Error(
        `TEMPLATE_PREVIEW_2D_EDGE_INVALID: preview2d.edges[${index}]`
      );
    }
    edges.push({
      id,
      source,
      target,
      kind,
      ...(asString(edge?.label) ? { label: asString(edge?.label)! } : {}),
      ...(asString(edge?.detail) ? { detail: asString(edge?.detail)! } : {})
    });
  }

  return {
    contractVersion: "0.1.0",
    nodes,
    edges
  };
}

function previewFromRuntimeFlow(
  payload: unknown
): Template2dPreviewV010 | undefined {
  const root = asObject(payload);
  if (!Array.isArray(root?.runtimeFlow)) return undefined;
  const stages = root.runtimeFlow
    .map(asString)
    .filter((value): value is string => value !== undefined);
  if (stages.length === 0) return undefined;

  const nodes: TemplatePreviewNodeV010[] = stages.map((stage, index) => ({
    id: `stage:${index + 1}`,
    kind: "ledger-runtime-stage",
    label: stage,
    x: 60 + index * 230,
    y: 160,
    width: 180,
    height: 88,
    detail: `Ledger Runtime stage ${index + 1} of ${stages.length}`,
    properties: [{
      key: "stage",
      label: "Stage",
      value: stage
    }, {
      key: "position",
      label: "Position",
      value: index + 1
    }]
  }));

  const edges: TemplatePreviewEdgeV010[] = stages
    .slice(0, -1)
    .map((stage, index) => ({
      id: `flow:${index + 1}`,
      source: `stage:${index + 1}`,
      target: `stage:${index + 2}`,
      kind: "flow",
      label: "next",
      properties: [{
        key: "flow",
        label: "Flow",
        value: `${stage} -> ${stages[index + 1]}`
      }]
    }));

  return {
    contractVersion: "0.1.0",
    nodes,
    edges
  };
}

function toArtifact(
  record: TemplateStoreRecordV010
): TemplatePreviewArtifactV010 {
  const payload = record.bundle.definition.payload;
  const diagram2d =
    previewFromDeclaredPayload(payload)
    ?? previewFromRuntimeFlow(payload);

  return {
    contractVersion: "0.1.0",
    templateId: record.templateId,
    templateVersion: record.version,
    title: record.bundle.listing.name,
    ...(record.bundle.listing.description
      ? { description: record.bundle.listing.description }
      : {}),
    definitionKind: record.bundle.definition.kind,
    ...(diagram2d ? { diagram2d } : {})
  };
}

export function createTemplateStorePreviewArtifactSourceV010(
  repository: TemplateStoreRepositoryV010
): TemplatePreviewArtifactSourceV010 {
  return {
    get(input) {
      const record = input.templateVersion === undefined
        ? repository.getLatest(input.templateId)
        : repository.getVersion(
            input.templateId,
            input.templateVersion
          );
      return record ? toArtifact(record) : undefined;
    }
  };
}
