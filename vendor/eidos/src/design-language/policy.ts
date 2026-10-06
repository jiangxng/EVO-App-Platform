export const eidosDesignPolicyV010 = {
  contractVersion: "0.1.0",
  visualRevision: "0.2.0",
  character: ["business", "calm", "approachable", "productive", "trustworthy"],
  visualLanguage: {
    name: "Eidos Business Office",
    referenceClass: "enterprise-productivity",
    developerConsoleAsDefault: false,
    technicalChrome: "progressive-disclosure",
    contentDominance: "business-content-over-framework-chrome"
  },
  workbench: {
    activityBar: {
      purpose: "select-context",
      selectedTreatment: "rounded-brand-subtle",
      mobileLabels: "visible",
      forbidden: ["duplicate-app-navigation", "open-arbitrary-editor-webview"]
    },
    sidePanel: {
      purpose: "secondary-contextual-views",
      preferredContent: ["navigation", "tree", "search", "chat", "context"],
      headingStyle: "natural-case"
    },
    workspace: {
      purpose: "primary-task",
      dominance: "highest",
      internalRouteAddress: "not-rendered-in-standard-business-workbench"
    },
    statusBar: {
      purpose: "contextual-status",
      authority: "non-business-truth",
      defaultVisibility: "hidden"
    }
  },
  toolbar: {
    leading: ["navigation", "back", "sidebar-structure"],
    center: ["title", "current-context", "search"],
    trailing: ["frequent-contextual-actions", "primary-action", "overflow"],
    technicalAddress: "separate-explicit-capability-only",
    maxVisibleLogicalGroups: 3,
    overflowLowFrequencyActions: true
  },
  colors: {
    neutralSurfacesDominate: true,
    brandColorUse: ["selection", "primary-action", "focus", "navigation-emphasis"],
    semanticColorUse: ["status", "feedback", "urgency"],
    decorativeSemanticColorForbidden: true,
    pluginChromeColorForkForbidden: true,
    domainAccentAllowedFor: ["application-identity", "category", "chart-series"]
  },
  icons: {
    owner: "Eidos",
    registryRequiredForStandardUi: true,
    standardUiMode: "monochrome",
    selectedStateUsesBrandTone: true,
    productAndDomainColorSeparate: true,
    friendlyRecognizableMetaphors: true,
    arbitraryPluginSvgForbiddenByDefault: true,
    externalLibraryDependencyForbiddenByDefault: true,
    semanticNameStable: true,
    brandIconsSeparate: true
  },
  surfaces: {
    canvas: "soft-neutral",
    content: "white",
    card: "white-subtle-border-light-elevation",
    overlay: "white-raised",
    radiusCharacter: "soft-not-playful"
  },
  actions: {
    maxPrimaryPerScope: 1,
    primaryPlacement: "trailing",
    primaryTone: "brand",
    navigationPlacement: "leading-or-contextual-navigation",
    destructive: {
      explicitTone: true,
      separateFromForwardPrimary: true,
      dominateOnlyWhenWorkflowPrimary: true
    },
    iconOnly: {
      useSparingly: true,
      accessibleNameRequired: true,
      tooltipRequired: true
    }
  },
  density: {
    desktop: "productive-comfortable",
    compactControlHeightPx: [32, 36],
    activityTargetDesktopPx: 56,
    touchTargetMinimumPx: 44
  },
  mobile: {
    normativeReference: "Eidos Mobile Design Language v0.1",
    semanticContract: "shared-with-desktop",
    primaryNavigation: "bottom",
    primaryNavigationLabels: "visible",
    contentFlow: "single-column",
    secondaryContext: "replace-or-overlay",
    globalContextChrome: "top-compact",
    accountDetails: "bottom-sheet",
    statusBar: "hidden",
    safeAreaAware: true
  },
  plugin: {
    inheritHostTokens: true,
    inheritStandardControlRealization: true,
    inheritResponsiveRealization: true,
    forbiddenByDefault: [
      "custom-shell-layout",
      "custom-mobile-shell",
      "custom-breakpoint-system",
      "custom-spacing-scale",
      "custom-focus-system",
      "competing-standard-button-hierarchy",
      "device-specific-business-semantics",
      "developer-console-default-chrome",
      "private-standard-ui-color-palette"
    ]
  },
  typography: {
    preferenceAuthority: "os-and-user-agent",
    hostOptIn: "meta-text-scale",
    sizing: "root-relative",
    defaultFamily: "platform-office-system-font",
    fixedPixelFontSizesForbidden: true,
    productFontScaleOverride: "system-relative-presets",
    defaultTextScalePreference: "system"
  },
  accessibility: {
    systemTextScaleRequired: true,
    reflowWithoutTextClippingRequired: true,
    nativeHtmlFirst: true,
    visibleFocusRequired: true,
    colorOnlyStateForbidden: true,
    ariaRoleRequiresKeyboardBehavior: true,
    gestureOnlyActionForbidden: true
  }
} as const;
