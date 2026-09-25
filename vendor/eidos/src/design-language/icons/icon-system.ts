export type EidosIconNodeTag = "path" | "rect" | "circle" | "line" | "polyline";

export interface EidosIconNodeV010 {
  tag: EidosIconNodeTag;
  attrs: Record<string, string | number>;
  accent?: boolean;
}

export interface EidosIconDefinitionV010 {
  viewBox: "0 0 24 24";
  nodes: readonly EidosIconNodeV010[];
}

const p = (d: string, accent = false): EidosIconNodeV010 => ({
  tag: "path",
  attrs: { d },
  ...(accent ? { accent: true } : {})
});
const r = (x: number, y: number, width: number, height: number, rx = 2, accent = false): EidosIconNodeV010 => ({
  tag: "rect",
  attrs: { x, y, width, height, rx },
  ...(accent ? { accent: true } : {})
});
const c = (cx: number, cy: number, radius: number, accent = false, fill = false): EidosIconNodeV010 => ({
  tag: "circle",
  attrs: {
    cx,
    cy,
    r: radius,
    ...(fill ? { fill: "currentColor", stroke: "none" } : {})
  },
  ...(accent ? { accent: true } : {})
});
const l = (x1: number, y1: number, x2: number, y2: number, accent = false): EidosIconNodeV010 => ({
  tag: "line",
  attrs: { x1, y1, x2, y2 },
  ...(accent ? { accent: true } : {})
});
const poly = (points: string, accent = false): EidosIconNodeV010 => ({
  tag: "polyline",
  attrs: { points },
  ...(accent ? { accent: true } : {})
});

export const eidosIconDefinitionsV010 = {
  dashboard: {
    viewBox: "0 0 24 24",
    nodes: [r(3,3,7,7,2,true), r(14,3,7,7), r(3,14,7,7), r(14,14,7,7)]
  },
  workspace: {
    viewBox: "0 0 24 24",
    nodes: [r(4,4,12,11), r(8,8,12,11,2,true)]
  },
  plugins: {
    viewBox: "0 0 24 24",
    nodes: [
      p("M8 4h3a2 2 0 1 1 4 0h3a2 2 0 0 1 2 2v3h-3a2 2 0 1 0 0 4h3v3a2 2 0 0 1-2 2h-3a2 2 0 1 1-4 0H8a2 2 0 0 1-2-2v-3h3a2 2 0 1 0 0-4H6V6a2 2 0 0 1 2-2Z"),
      c(19,19,3,true),
      l(19,17.5,19,20.5,true),
      l(17.5,19,20.5,19,true)
    ]
  },
  package: {
    viewBox: "0 0 24 24",
    nodes: [
      poly("12 3 20 7.5 20 16.5 12 21 4 16.5 4 7.5 12 3"),
      l(4.5,7.7,12,12,true),
      l(19.5,7.7,12,12),
      l(12,12,12,20.5)
    ]
  },
  search: {
    viewBox: "0 0 24 24",
    nodes: [c(10.5,10.5,5.5), l(14.6,14.6,20,20,true)]
  },
  chat: {
    viewBox: "0 0 24 24",
    nodes: [
      p("M5 5h10a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9l-4 3v-3a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z"),
      p("M15 9h2a3 3 0 0 1 3 3v5l2 2-4-.6"),
      c(8,10.5,.8,true,true),
      c(11,10.5,.8,true,true),
      c(14,10.5,.8,true,true)
    ]
  },
  browser: {
    viewBox: "0 0 24 24",
    nodes: [r(3,4,18,16,2), l(3,9,21,9), c(6,6.5,.7,true,true), c(9,6.5,.7,true,true), c(12,6.5,.7,true,true)]
  },
  settings: {
    viewBox: "0 0 24 24",
    nodes: [
      p("M9.7 3.8 10.5 2h3l.8 1.8 1.8.8 1.8-.7 2.1 2.1-.7 1.8.8 1.8L21 10.5v3l-1.8.8-.8 1.8.7 1.8-2.1 2.1-1.8-.7-1.8.8-.8 1.9h-3l-.8-1.9-1.8-.8-1.8.7-2.1-2.1.7-1.8-.8-1.8L2 13.5v-3l1.8-.8.8-1.8-.7-1.8L6 4l1.8.7 1.9-.9Z"),
      c(12,12,3,true)
    ]
  },
  user: {
    viewBox: "0 0 24 24",
    nodes: [c(12,8,3.5), p("M5 20c.6-4 3.2-6 7-6s6.4 2 7 6"), c(18.5,17.5,1.5,true,true)]
  },
  notifications: {
    viewBox: "0 0 24 24",
    nodes: [p("M6 16h12l-1.5-2.2V10a4.5 4.5 0 0 0-9 0v3.8L6 16Z"), p("M10 19h4"), c(18.5,6,1.5,true,true)]
  },
  history: {
    viewBox: "0 0 24 24",
    nodes: [p("M5.5 7A8 8 0 1 1 4 14"), poly("3 5 5.5 7.2 8 5"), l(12,8,12,12,true), l(12,12,15,14,true)]
  },
  activity: {
    viewBox: "0 0 24 24",
    nodes: [l(6,18,6,13), l(12,18,12,9), l(18,18,18,5,true)]
  },
  sidebar: {
    viewBox: "0 0 24 24",
    nodes: [r(3,4,18,16,2), l(9,4,9,20), l(6,8,6,16,true)]
  },
  panel: {
    viewBox: "0 0 24 24",
    nodes: [r(3,4,18,16,2), l(3,9,21,9), l(7,13,13,13,true)]
  },
  folder: {
    viewBox: "0 0 24 24",
    nodes: [p("M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"), l(6,10,11,10,true)]
  },
  document: {
    viewBox: "0 0 24 24",
    nodes: [p("M6 3h8l4 4v14H6V3Z"), poly("14 3 14 8 18 8"), l(9,12,15,12,true), l(9,16,15,16,true)]
  },
  table: {
    viewBox: "0 0 24 24",
    nodes: [r(3,4,18,16,2), l(3,9,21,9), l(3,14,21,14), l(9,4,9,20), l(15,4,15,20), r(3.8,4.8,4.4,3.4,0.6,true)]
  },
  form: {
    viewBox: "0 0 24 24",
    nodes: [r(3,4,18,16,2), l(7,8,15,8,true), r(7,12,10,4,1)]
  },
  flow: {
    viewBox: "0 0 24 24",
    nodes: [c(5,17,2), c(10,7,2), c(19,16,2,true,true), p("M6.7 15.8 8.8 9M12 7.7l5.3 6.8")]
  },
  database: {
    viewBox: "0 0 24 24",
    nodes: [p("M5 6c0-2 14-2 14 0v12c0 2-14 2-14 0V6Z"), p("M5 6c0 2 14 2 14 0"), p("M5 12c0 2 14 2 14 0",true)]
  },
  play: {
    viewBox: "0 0 24 24",
    nodes: [c(12,12,9), p("M10 8.5 16 12l-6 3.5v-7Z",true)]
  },
  pause: {
    viewBox: "0 0 24 24",
    nodes: [c(12,12,9), l(10,9,10,15,true), l(14,9,14,15,true)]
  },
  refresh: {
    viewBox: "0 0 24 24",
    nodes: [p("M18.5 8A7 7 0 0 0 6 6.5"), poly("5 3.8 6.2 6.8 9.3 5.8"), p("M5.5 16A7 7 0 0 0 18 17.5",true), poly("19 20.2 17.8 17.2 14.7 18.2",true)]
  },
  help: {
    viewBox: "0 0 24 24",
    nodes: [c(12,12,9), p("M9.6 9.3a2.5 2.5 0 1 1 4.2 1.8c-1.2 1-1.8 1.5-1.8 2.9",true), c(12,17,0.8,true,true)]
  },
  agent: {
    viewBox: "0 0 24 24",
    nodes: [p("M6 6h10a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H10l-4 3v-3a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3Z"), p("M15.5 3.5 16.2 5.3 18 6l-1.8.7-.7 1.8-.7-1.8L13 6l1.8-.7.7-1.8Z",true)]
  },
  arrowRight: {
    viewBox: "0 0 24 24",
    nodes: [l(5,12,19,12), poly("14 7 19 12 14 17",true)]
  },
  externalLink: {
    viewBox: "0 0 24 24",
    nodes: [p("M14 5h5v5"), l(19,5,11,13,true), p("M17 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h5")]
  }
} as const satisfies Record<string, EidosIconDefinitionV010>;

export type EidosIconName = keyof typeof eidosIconDefinitionsV010;

export const eidosIconAliasesV010 = {
  apps: "dashboard",
  plugin: "plugins",
  "extension-manager": "plugins",
  "play-run": "play",
  "arrow-right": "arrowRight",
  "external-link": "externalLink"
} as const satisfies Record<string, EidosIconName>;

export interface EidosIconRenderOptionsV010 {
  size?: number;
  label?: string;
  className?: string;
}

export function resolveEidosIconName(name: string): EidosIconName | undefined {
  const normalized = name.trim();
  if (!normalized) return undefined;
  const alias = eidosIconAliasesV010[normalized as keyof typeof eidosIconAliasesV010];
  if (alias) return alias;
  return normalized in eidosIconDefinitionsV010 ? normalized as EidosIconName : undefined;
}

function baseSvgAttributes(size: number): Record<string, string> {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    width: String(size),
    height: String(size),
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.8",
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  };
}

export function createEidosIconElement(
  name: string,
  options: EidosIconRenderOptionsV010 = {}
): SVGSVGElement | undefined {
  const resolved = resolveEidosIconName(name);
  if (!resolved) return undefined;
  const definition = eidosIconDefinitionsV010[resolved];
  const size = options.size ?? 20;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [key, value] of Object.entries(baseSvgAttributes(size))) {
    svg.setAttribute(key, value);
  }
  svg.setAttribute("data-eidos-icon", resolved);
  if (options.className) svg.setAttribute("class", options.className);
  if (options.label) {
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", options.label);
  } else {
    svg.setAttribute("aria-hidden", "true");
  }

  for (const node of definition.nodes) {
    const child = document.createElementNS("http://www.w3.org/2000/svg", node.tag);
    for (const [key, value] of Object.entries(node.attrs)) {
      child.setAttribute(key, String(value));
    }
    if (node.accent) child.setAttribute("data-eidos-icon-accent", "");
    svg.appendChild(child);
  }
  return svg;
}

function escapeAttr(value: string | number): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function renderEidosIconToSvg(
  name: string,
  options: EidosIconRenderOptionsV010 = {}
): string | undefined {
  const resolved = resolveEidosIconName(name);
  if (!resolved) return undefined;
  const definition = eidosIconDefinitionsV010[resolved];
  const size = options.size ?? 20;
  const attrs = {
    ...baseSvgAttributes(size),
    "data-eidos-icon": resolved,
    ...(options.className ? { class: options.className } : {}),
    ...(options.label ? { role: "img", "aria-label": options.label } : { "aria-hidden": "true" })
  };
  const attrText = Object.entries(attrs)
    .map(([key, value]) => `${key}="${escapeAttr(value)}"`)
    .join(" ");
  const children = definition.nodes.map(node => {
    const nodeAttrs = {
      ...node.attrs,
      ...(node.accent ? { "data-eidos-icon-accent": "" } : {})
    };
    const childAttrs = Object.entries(nodeAttrs)
      .map(([key, value]) => `${key}="${escapeAttr(value)}"`)
      .join(" ");
    return `<${node.tag} ${childAttrs}></${node.tag}>`;
  }).join("");
  return `<svg ${attrText}>${children}</svg>`;
}

export const eidosIconSystemMetadataV010 = {
  contractVersion: "0.1.0",
  name: "Eidos Workbench Core Icon Set",
  designLanguage: "productive-quiet-precise",
  provenance: "original-eidos-project-assets",
  externalIconLibraryDependency: false,
  initialProductionIcons: Object.keys(eidosIconDefinitionsV010).length,
  expansionPolicy: "additive-semantic-registry"
} as const;
