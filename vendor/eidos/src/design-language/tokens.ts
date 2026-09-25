export const eidosDesignTokensV010 = {
  contractVersion: "0.1.0",
  density: "productive",
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
    activityBarDesktop: 48,
    activityBarMobile: 44,
    compactControl: 32,
    normalControl: 36,
    touchTarget: 44,
    sideHeader: 40,
    statusBar: 22,
    sidePanelDefault: 336,
    sidePanelMin: 240,
    sidePanelMax: 720
  },
  radius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 10,
    pill: 999
  },
  type: {
    meta: 11,
    supporting: 12,
    compactBody: 13,
    body: 14,
    sectionTitle: 16,
    pageTitle: 22
  },
  icon: {
    canvas: 24,
    strokeWidth: 1.8,
    compact: 16,
    default: 20,
    prominent: 24,
    accent: "#1769ff"
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
  --eidos-activity-width:48px;
  --eidos-side-header-height:40px;
  --eidos-status-height:22px;

  --eidos-radius-xs:4px;
  --eidos-radius-sm:6px;
  --eidos-radius-md:8px;
  --eidos-radius-lg:10px;
  --eidos-radius-pill:999px;

  --eidos-font-meta:11px;
  --eidos-font-supporting:12px;
  --eidos-font-compact:13px;
  --eidos-font-body:14px;
  --eidos-font-section:16px;
  --eidos-font-page:22px;

  --eidos-fg:#24262a;
  --eidos-fg-muted:#686d75;
  --eidos-fg-subtle:#7a7f87;
  --eidos-bg:#ffffff;
  --eidos-bg-subtle:#f7f8fa;
  --eidos-bg-chrome:#f3f4f6;
  --eidos-bg-hover:#eceef1;
  --eidos-border:#dde1e7;
  --eidos-border-strong:#c8cdd5;
  --eidos-focus:#6b8fd6;
  --eidos-icon-accent:#1769ff;
  --eidos-primary:#25272b;
  --eidos-primary-fg:#ffffff;
  --eidos-success:#0b6d39;
  --eidos-success-bg:#f1fbf5;
  --eidos-danger:#a12626;
  --eidos-danger-bg:#fff5f5;
  --eidos-warning:#876800;
}
`;
