export const eidosMobileDesignLanguageV010 = {
  contractVersion: "0.1.0",
  principle: "same-semantic-experience-different-realization",
  viewport: {
    maxWidthPx: 700,
    safeAreaInsetsRequired: true,
    horizontalPageScrollForbidden: true
  },
  navigation: {
    primaryPlacement: "bottom",
    preferredVisibleDestinations: [3, 5],
    sideRailOnPhoneForbidden: true,
    destinationTouchTargetPx: 44
  },
  typography: {
    preferenceAuthority: "os-and-user-agent",
    hostOptIn: "meta-text-scale",
    sizing: "rem",
    defaultPreference: "system",
    userScalePresets: ["system", "small", "standard", "large"],
    presetAdditionalScale: { small: 0.9, standard: 1, large: 1.15 },
    userScaleComposesWithSystem: true,
    fixedPixelFontSizesForbidden: true,
    overflowStrategy: "reflow-not-clip"
  },
  content: {
    primaryFlow: "single-column",
    workspaceWidth: "full",
    secondaryContext: "replace-or-overlay",
    progressiveDisclosurePreferred: true
  },
  chrome: {
    globalContextPlacement: "top-compact",
    statusBar: "hidden-on-phone",
    accountDetailsPresentation: "bottom-sheet"
  },
  actions: {
    maxPrimaryPerScope: 1,
    primaryMustBeThumbReachable: true,
    narrowActionGroupsStack: true,
    destructiveSeparatedFromForwardPrimary: true
  },
  forms: {
    fieldFlow: "single-column",
    controlMinimumHeightPx: 44,
    primaryCommitPlacement: "sticky-or-trailing"
  },
  collections: {
    listFlow: "single-column",
    detailMedia: "horizontal-scroll-rail",
    wideTableStrategy: "scroll-or-semantic-reflow"
  },
  plugin: {
    sameSemanticContractAcrossSurfaces: true,
    customMobileShellForbidden: true,
    customBreakpointForbidden: true,
    deviceSpecificBusinessSemanticsForbidden: true,
    inheritEidosResponsiveRealization: true,
    allowedOverrides: [
      "domain-content",
      "domain-actions",
      "declared-capability-layout-hints"
    ]
  },
  accessibility: {
    touchTargetMinimumPx: 44,
    gestureOnlyActionForbidden: true,
    safeAreaAware: true,
    keyboardAndScreenReaderSemanticsPreserved: true
  }
} as const;
