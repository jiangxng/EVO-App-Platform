import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";
import type { EffectiveWorkbenchHomeItemV010 } from "./workbench-composition.js";

export const workspaceHomePageSource =
  "app://evo-app-platform/pages/workspace-home";

export const workspaceHomeExperienceManifest = {
  contractVersion: "0.1.0",
  experienceId: "evo-workspace-home",
  packageId: "evo-app-platform",
  featureId: "evo-workspace-home.system",
  defaultRoute: "/workspace",
  pages: [{
    id: "evo-workspace.home",
    title: "Workspace",
    source: workspaceHomePageSource
  }],
  routes: [{
    id: "evo-workspace.home",
    path: "/workspace",
    pageId: "evo-workspace.home"
  }]
} as const;

function textFor(locale: string) {
  const zh = locale.toLowerCase().startsWith("zh");
  return zh
    ? {
        title: "工作区",
        description: "汇总当前用户已授权的工作、业务投影、固定能力和个人代理入口。",
        empty: "当前没有可显示的工作内容。",
        myWork: "我的工作",
        myBusinessObjects: "我的业务对象",
        operational: "运营视图",
        fixedCapabilities: "常用功能",
        personalAgent: "个人代理",
        open: "打开"
      }
    : {
        title: "Workspace",
        description:
          "Compose currently authorized work, business projections, fixed capabilities and Personal Agent entry points.",
        empty: "No authorized work is available.",
        myWork: "My Work",
        myBusinessObjects: "My Business Objects",
        operational: "Operational views",
        fixedCapabilities: "Fixed capabilities",
        personalAgent: "Personal Agent",
        open: "Open"
      };
}

function sectionLabel(
  section: EffectiveWorkbenchHomeItemV010["section"],
  locale: string
): string {
  const text = textFor(locale);
  switch (section) {
    case "MY_WORK":
      return text.myWork;
    case "MY_BUSINESS_OBJECTS":
      return text.myBusinessObjects;
    case "OPERATIONAL_PROJECTIONS":
      return text.operational;
    case "FIXED_CAPABILITIES":
      return text.fixedCapabilities;
    case "PERSONAL_AGENT":
      return text.personalAgent;
  }
}

export function createWorkspaceHomePageV010(
  locale = "en",
  items: readonly EffectiveWorkbenchHomeItemV010[] = []
): CatalogBrowserV010 {
  const text = textFor(locale);
  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    layout: "list",
    density: "compact",
    itemActivation: "primary-action",
    id: "evo.workspace.home",
    title: text.title,
    description: text.description,
    items: items.map(item => ({
      id: item.id,
      title: item.title,
      ...(item.description ? { summary: item.description } : {}),
      category: sectionLabel(item.section, locale),
      primaryAction: {
        id: "open",
        label: text.open,
        type: "navigate" as const,
        route: item.route,
        requiresConfirmation: false
      }
    })),
    emptyMessage: text.empty
  };
}
