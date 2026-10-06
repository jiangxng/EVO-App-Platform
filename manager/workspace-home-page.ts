import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";

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

export function createWorkspaceHomePageV010(
  locale = "en"
): CatalogBrowserV010 {
  const zh = locale.toLowerCase().startsWith("zh");
  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo.workspace.home",
    title: zh ? "工作区" : "Workspace",
    description: zh
      ? "这里保留给当前工作。打开业务应用后，工作内容会显示在这里。"
      : "This area is reserved for current work. Open a business application to begin.",
    items: [],
    emptyMessage: zh
      ? "当前没有打开的工作。"
      : "No work is open."
  };
}
