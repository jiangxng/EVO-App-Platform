export const eidosDesignPolicyV010 = {
  contractVersion: "0.1.0",
  character: ["productive", "quiet", "precise"],
  workbench: {
    activityBar: {
      purpose: "select-context",
      forbidden: ["duplicate-app-navigation", "open-arbitrary-editor-webview"]
    },
    sidePanel: {
      purpose: "secondary-contextual-views",
      preferredContent: ["navigation", "tree", "search", "chat", "context"]
    },
    workspace: {
      purpose: "primary-task",
      dominance: "highest"
    },
    statusBar: {
      purpose: "contextual-status",
      authority: "non-business-truth"
    }
  },
  toolbar: {
    leading: ["navigation", "back", "sidebar-structure"],
    center: ["title", "current-context", "search", "address"],
    trailing: ["frequent-contextual-actions", "primary-action", "overflow"],
    maxVisibleLogicalGroups: 3,
    overflowLowFrequencyActions: true
  },
  icons: {
    owner: "Eidos",
    registryRequiredForStandardUi: true,
    arbitraryPluginSvgForbiddenByDefault: true,
    externalLibraryDependencyForbiddenByDefault: true,
    semanticNameStable: true,
    brandIconsSeparate: true
  },
  actions: {
    maxPrimaryPerScope: 1,
    primaryPlacement: "trailing",
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
    desktop: "productive",
    compactControlHeightPx: [32, 36],
    activityTargetDesktopPx: 48,
    touchTargetMinimumPx: 44
  },
  mobile: {
    normativeReference: "Eidos Mobile Design Language v0.1",
    semanticContract: "shared-with-desktop",
    primaryNavigation: "bottom",
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
      "device-specific-business-semantics"
    ]
  },
  accessibility: {
    nativeHtmlFirst: true,
    visibleFocusRequired: true,
    colorOnlyStateForbidden: true,
    ariaRoleRequiresKeyboardBehavior: true,
    gestureOnlyActionForbidden: true
  }
} as const;
