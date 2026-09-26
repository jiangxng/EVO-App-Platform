import { renderToHtml } from "../renderers/html/index.js";
import { renderCatalogBrowserToHtml } from "../catalog-browser/render.js";
import { isChatExperienceV010, renderChatExperienceToHtml } from "../chat/index.js";
import { isSettingsEditorV010, renderSettingsEditorToHtml } from "../settings/index.js";
import { isExtensionManagerV010, renderExtensionManagerToHtml } from "../extension-manager/index.js";
import { isHelpDocumentV010, renderHelpDocumentToHtml } from "../help/index.js";
import type { AppHostLoadedPageV010 } from "./contracts.js";
import type { LocalizationRuntime } from "../localization/contracts.js";
import { localizeAppHostPageDefinition } from "../localization/localize.js";

export function renderAppHostPageToHtml(
  page: AppHostLoadedPageV010,
  localization?: LocalizationRuntime
): string {
  const localizedDefinition = localizeAppHostPageDefinition(page, localization);
  const definition = localizedDefinition as { kind?: unknown };

  if (definition?.kind === "catalog-browser") {
    return renderCatalogBrowserToHtml(
      localizedDefinition as import("../catalog-browser/contracts.js").CatalogBrowserV010
    );
  }

  if (isChatExperienceV010(localizedDefinition)) {
    return renderChatExperienceToHtml(localizedDefinition);
  }

  if (isSettingsEditorV010(localizedDefinition)) {
    return renderSettingsEditorToHtml(localizedDefinition);
  }

  if (isExtensionManagerV010(localizedDefinition)) {
    return renderExtensionManagerToHtml(localizedDefinition);
  }

  if (isHelpDocumentV010(localizedDefinition)) {
    return renderHelpDocumentToHtml(localizedDefinition);
  }

  return renderToHtml(localizedDefinition);
}
