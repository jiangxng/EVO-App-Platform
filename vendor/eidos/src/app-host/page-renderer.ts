import { renderToHtml } from "../renderers/html/index.js";
import { renderCatalogBrowserToHtml } from "../catalog-browser/render.js";
import { renderCatalogDetailToHtml } from "../catalog-detail/render.js";
import { isChatExperienceV010, isChatExperienceV020, renderChatExperienceToHtml } from "../chat/index.js";
import { isSettingsEditorV010, isSettingsEditorV020, renderSettingsEditorToHtml } from "../settings/index.js";
import { isExtensionManagerV010, renderExtensionManagerToHtml } from "../extension-manager/index.js";
import { isHelpDocumentV010, renderHelpDocumentToHtml } from "../help/index.js";
import { isSetupFlowV010, renderSetupFlowToHtml } from "../setup-flow/index.js";
import { isReviewQueueV010, renderReviewQueueToHtml } from "../review-queue/index.js";
import { isTaskInboxV010, renderTaskInboxToHtml } from "../task-inbox/index.js";
import { isDiagramEditorPageV010, renderDiagramEditorPageShellToHtmlV010 } from "../diagram/surface.js";
import {
  isSpatialObservatoryPageV010,
  renderSpatialObservatoryPageShellToHtmlV010
} from "../spatial/surface.js";
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

  if (definition?.kind === "catalog-detail") {
    return renderCatalogDetailToHtml(
      localizedDefinition as import("../catalog-detail/contracts.js").CatalogDetailV010
    );
  }

  if (isChatExperienceV010(localizedDefinition) || isChatExperienceV020(localizedDefinition)) {
    return renderChatExperienceToHtml(localizedDefinition);
  }

  if (isSettingsEditorV010(localizedDefinition) || isSettingsEditorV020(localizedDefinition)) {
    return renderSettingsEditorToHtml(localizedDefinition);
  }

  if (isExtensionManagerV010(localizedDefinition)) {
    return renderExtensionManagerToHtml(localizedDefinition);
  }

  if (isSetupFlowV010(localizedDefinition)) {
    return renderSetupFlowToHtml(localizedDefinition);
  }

  if (isReviewQueueV010(localizedDefinition)) {
    return renderReviewQueueToHtml(localizedDefinition);
  }

  if (isTaskInboxV010(localizedDefinition)) {
    return renderTaskInboxToHtml(localizedDefinition);
  }

  if (isDiagramEditorPageV010(localizedDefinition)) {
    return renderDiagramEditorPageShellToHtmlV010(localizedDefinition);
  }

  if (isSpatialObservatoryPageV010(localizedDefinition)) {
    return renderSpatialObservatoryPageShellToHtmlV010(localizedDefinition, localization);
  }

  if (isHelpDocumentV010(localizedDefinition)) {
    return renderHelpDocumentToHtml(localizedDefinition, localization);
  }

  return renderToHtml(localizedDefinition);
}
