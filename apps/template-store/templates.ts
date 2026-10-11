import type { TemplateProjectionGalleryV010 } from "../../contracts/template-projection-gallery.js";
export interface TemplateStoreThumbnailV010 {
  src: string;
  alt: string;
}

export interface TemplateStoreEntryV010 {
  templateId: string;
  name: string;
  description: string;
  thumbnail: TemplateStoreThumbnailV010;
  projectionGallery?: TemplateProjectionGalleryV010;
  copyMode: "COPY";
  source: {
    kind: "BUILT_IN_REFERENCE";
    ownerProject: "EVO";
    artifact: string;
    version: string;
  };
}

const ledgerRuntimeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">
  <rect width="640" height="360" rx="24" fill="#111827"/>
  <text x="40" y="64" fill="#f9fafb" font-size="28" font-family="system-ui,sans-serif" font-weight="700">EVO Ledger Runtime</text>
  <text x="40" y="96" fill="#9ca3af" font-size="16" font-family="system-ui,sans-serif">BusinessData → Posting → LedgerEntry → LedgerBalance</text>
  <g font-family="system-ui,sans-serif" font-size="16" text-anchor="middle">
    <rect x="38" y="152" width="126" height="72" rx="14" fill="#1f2937" stroke="#4b5563"/>
    <text x="101" y="194" fill="#f3f4f6">BusinessData</text>
    <rect x="190" y="152" width="110" height="72" rx="14" fill="#1f2937" stroke="#4b5563"/>
    <text x="245" y="194" fill="#f3f4f6">Posting</text>
    <rect x="326" y="152" width="124" height="72" rx="14" fill="#1f2937" stroke="#4b5563"/>
    <text x="388" y="194" fill="#f3f4f6">LedgerEntry</text>
    <rect x="476" y="152" width="126" height="72" rx="14" fill="#1f2937" stroke="#4b5563"/>
    <text x="539" y="194" fill="#f3f4f6">LedgerBalance</text>
  </g>
  <g stroke="#9ca3af" stroke-width="3" fill="none">
    <path d="M164 188h26"/>
    <path d="M300 188h26"/>
    <path d="M450 188h26"/>
  </g>
  <text x="40" y="300" fill="#d1d5db" font-size="15" font-family="system-ui,sans-serif">First built-in shared template · copy semantics</text>
</svg>`;

export const ledgerRuntimeBaselineTemplateV010: TemplateStoreEntryV010 = {
  templateId: "evo.ledger-runtime.baseline.v0.1",
  name: "EVO 账本运行时基线",
  description:
    "EVO Ledger Runtime Configurator 的完整可烧录基线：143 个应用、141 个账本、106 条字典和 912 条 Posting Rules，可用于安装、预览与上线验证。",
  thumbnail: {
    src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(ledgerRuntimeSvg)}`,
    alt: "EVO 账本运行时基线缩略图"
  },
  projectionGallery: {
    contractVersion: "0.1.0",
    primaryProjectionId: "projection:main",
    projections: [{
      projectionId: "projection:main",
      title: "完整账本运行时",
      description: "完整展示当前模板中的应用、账本与条件记账关系。",
      thumbnail: {
        src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(ledgerRuntimeSvg)}`,
        alt: "完整账本运行时主投影"
      },
      view: {
        contractVersion: "0.1.0",
        kind: "DIAGRAM_2D"
      }
    }]
  },
  copyMode: "COPY",
  source: {
    kind: "BUILT_IN_REFERENCE",
    ownerProject: "EVO",
    artifact: "ledger-runtime-configurator/bookkeeping-default",
    version: "8a1e5f7110625cf92da1c6c65a57d875cca9c008bc47c391ebeb76a694990e98"
  }
};

export const templateStoreSeedTemplatesV010: TemplateStoreEntryV010[] = [
  ledgerRuntimeBaselineTemplateV010
];
