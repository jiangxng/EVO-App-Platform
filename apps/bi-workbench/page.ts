import type {
  CatalogBrowserV010
} from "../../vendor/eidos/src/catalog-browser/contracts.js";
import type {
  EffectiveWorkbenchHomeItemV010
} from "./composition.js";
import {
  BI_WORKBENCH_ITEM_FAVORITE_SET_COMMAND_V010,
  BI_WORKBENCH_ITEM_OPEN_COMMAND_V010
} from "./constants.js";
import type {
  WorkbenchResolvedHomeV010
} from "./service.js";

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
        favorites: "收藏",
        recent: "最近使用",
        open: "打开",
        favorite: "收藏",
        unfavorite: "取消收藏"
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
        favorites: "Favorites",
        recent: "Recent",
        open: "Open",
        favorite: "Favorite",
        unfavorite: "Remove favorite"
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

function homeInput(
  value:
    | readonly EffectiveWorkbenchHomeItemV010[]
    | WorkbenchResolvedHomeV010
): WorkbenchResolvedHomeV010 {
  if (Array.isArray(value)) {
    return {
      contractVersion: "0.1.0",
      items: [...value] as EffectiveWorkbenchHomeItemV010[],
      favorites: [],
      recent: [],
      rejectedPreferenceItemIds: []
    };
  }
  return value as WorkbenchResolvedHomeV010;
}

export function createWorkspaceHomePageV010(
  locale = "en",
  input:
    | readonly EffectiveWorkbenchHomeItemV010[]
    | WorkbenchResolvedHomeV010 = []
): CatalogBrowserV010 {
  const text = textFor(locale);
  const home = homeInput(input);
  const favoriteIds = new Set(home.favorites.map(item => item.id));

  const render = (
    item: EffectiveWorkbenchHomeItemV010,
    input: {
      id: string;
      category: string;
      showFavoriteAction?: boolean;
    }
  ) => ({
    id: input.id,
    title: item.title,
    ...(item.description ? { summary: item.description } : {}),
    category: input.category,
    ...(favoriteIds.has(item.id) ? { badges: [text.favorites] } : {}),
    primaryAction: {
      id: "open",
      label: text.open,
      type: "command" as const,
      command: BI_WORKBENCH_ITEM_OPEN_COMMAND_V010,
      inputVersion: "0.1.0",
      values: { itemId: item.id },
      requiresConfirmation: false
    },
    ...(input.showFavoriteAction
      ? {
          secondaryActions: [{
            id: favoriteIds.has(item.id) ? "unfavorite" : "favorite",
            label: favoriteIds.has(item.id)
              ? text.unfavorite
              : text.favorite,
            type: "command" as const,
            command: BI_WORKBENCH_ITEM_FAVORITE_SET_COMMAND_V010,
            inputVersion: "0.1.0",
            values: {
              itemId: item.id,
              favorite: !favoriteIds.has(item.id)
            },
            requiresConfirmation: false
          }]
        }
      : {})
  });

  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    layout: "list",
    density: "compact",
    itemActivation: "primary-action",
    id: "evo.bi-workbench.home",
    title: text.title,
    description: text.description,
    items: [
      ...home.favorites.map(item => render(item, {
        id: "favorite:" + item.id,
        category: text.favorites
      })),
      ...home.recent.map(item => render(item, {
        id: "recent:" + item.id,
        category: text.recent
      })),
      ...home.items.map(item => render(item, {
        id: item.id,
        category: sectionLabel(item.section, locale),
        showFavoriteAction: true
      }))
    ],
    emptyMessage: text.empty
  };
}
