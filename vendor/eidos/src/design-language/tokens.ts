export const eidosDesignTokensV010 = {
  contractVersion: "0.1.0",
  visualRevision: "0.2.0",
  density: "productive",
  character: ["business", "calm", "approachable", "productive", "trustworthy"],
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    section: 24,
    major: 32,
    huge: 40,
    touch: 48
  },
  size: {
    activityBarDesktop: 56,
    activityBarMobile: 56,
    mobileNavigationHeight: 64,
    mobileChromeMinHeight: 52,
    compactControl: 32,
    normalControl: 36,
    touchTarget: 44,
    sideHeader: 48,
    statusBar: 22,
    sidePanelDefault: 336,
    sidePanelMin: 240,
    sidePanelMax: 720
  },
  radius: {
    xs: 6,
    sm: 8,
    md: 10,
    lg: 12,
    xl: 16,
    pill: 999
  },
  type: {
    unit: "rem",
    referenceRootPx: 16,
    meta: 12,
    supporting: 12,
    compactBody: 13,
    body: 14,
    sectionTitle: 16,
    pageTitle: 24
  },
  icon: {
    canvas: 24,
    strokeWidth: 2,
    compact: 16,
    default: 20,
    prominent: 24,
    standardMode: "monochrome",
    selectedTone: "brand",
    productColorSeparate: true,
    accent: "#2B6CB0"
  },
  color: {
    foreground: "#1F2933",
    foregroundMuted: "#5F6B76",
    foregroundSubtle: "#768390",
    surface: "#FFFFFF",
    canvas: "#F5F7FA",
    chrome: "#FAFBFC",
    hover: "#EEF3F8",
    selected: "#EAF2FB",
    border: "#E2E7ED",
    borderStrong: "#C9D2DC",
    brand: "#2B6CB0",
    brandHover: "#245B95",
    brandSubtle: "#EAF2FB",
    success: "#217A4A",
    warning: "#8A6100",
    danger: "#B42318"
  },
  accent: {
    blue: "#2B6CB0",
    teal: "#0F7B83",
    green: "#2E7D4F",
    orange: "#B76514",
    purple: "#7352A8",
    magenta: "#A13D79"
  },
  elevation: {
    surface: "0 1px 2px rgba(31,41,51,.05)",
    raised: "0 6px 18px rgba(31,41,51,.10)",
    overlay: "0 16px 40px rgba(31,41,51,.16)"
  },
  action: {
    maxPrimaryPerScope: 1,
    iconOnlyRequiresAccessibleName: true,
    destructiveRequiresExplicitTone: true
  },
  responsive: {
    mobileMax: 700,
    tabletMax: 1024
  }
} as const;

export const eidosDesignTokenCss = `
:root{
  --eidos-space-xxs:2px;
  --eidos-space-xs:4px;
  --eidos-space-sm:6px;
  --eidos-space-md:8px;
  --eidos-space-lg:12px;
  --eidos-space-xl:16px;
  --eidos-space-xxl:20px;
  --eidos-space-section:24px;
  --eidos-space-major:32px;

  --eidos-control-compact:32px;
  --eidos-control-normal:36px;
  --eidos-touch-target:44px;
  --eidos-activity-width:56px;
  --eidos-mobile-nav-height:64px;
  --eidos-mobile-chrome-min-height:52px;
  --eidos-safe-area-top:env(safe-area-inset-top,0px);
  --eidos-safe-area-right:env(safe-area-inset-right,0px);
  --eidos-safe-area-bottom:env(safe-area-inset-bottom,0px);
  --eidos-safe-area-left:env(safe-area-inset-left,0px);
  --eidos-side-header-height:48px;
  --eidos-status-height:22px;

  --eidos-radius-xs:6px;
  --eidos-radius-sm:8px;
  --eidos-radius-md:10px;
  --eidos-radius-lg:12px;
  --eidos-radius-xl:16px;
  --eidos-radius-pill:999px;

  --eidos-font-meta:.75rem;
  --eidos-font-supporting:.75rem;
  --eidos-font-compact:.8125rem;
  --eidos-font-body:.875rem;
  --eidos-font-section:1rem;
  --eidos-font-page:1.5rem;
  --eidos-font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei UI","PingFang SC","Noto Sans SC",Arial,sans-serif;

  --eidos-fg:#1F2933;
  --eidos-fg-muted:#5F6B76;
  --eidos-fg-subtle:#768390;
  --eidos-bg:#FFFFFF;
  --eidos-bg-subtle:#F5F7FA;
  --eidos-bg-chrome:#FAFBFC;
  --eidos-bg-hover:#EEF3F8;
  --eidos-bg-selected:#EAF2FB;
  --eidos-border:#E2E7ED;
  --eidos-border-strong:#C9D2DC;
  --eidos-focus:#2B6CB0;
  --eidos-icon-accent:#2B6CB0;
  --eidos-primary:#2B6CB0;
  --eidos-primary-hover:#245B95;
  --eidos-primary-subtle:#EAF2FB;
  --eidos-primary-fg:#FFFFFF;
  --eidos-success:#217A4A;
  --eidos-success-bg:#EDF8F1;
  --eidos-danger:#B42318;
  --eidos-danger-bg:#FFF1F0;
  --eidos-warning:#8A6100;
  --eidos-warning-bg:#FFF7E0;

  --eidos-accent-blue:#2B6CB0;
  --eidos-accent-teal:#0F7B83;
  --eidos-accent-green:#2E7D4F;
  --eidos-accent-orange:#B76514;
  --eidos-accent-purple:#7352A8;
  --eidos-accent-magenta:#A13D79;

  --eidos-shadow-surface:0 1px 2px rgba(31,41,51,.05);
  --eidos-shadow-raised:0 6px 18px rgba(31,41,51,.10);
  --eidos-shadow-overlay:0 16px 40px rgba(31,41,51,.16);
}
`;
