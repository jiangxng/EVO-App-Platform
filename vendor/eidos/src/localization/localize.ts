import type { AppHostLoadedPageV010 } from "../app-host/contracts.js";
import type { LocalizationRuntime } from "./contracts.js";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function localizeAppHostPageDefinition(
  page: AppHostLoadedPageV010,
  localization?: LocalizationRuntime
): unknown {
  if (!localization || !isObject(page.definition)) return page.definition;

  const definition = clone(page.definition);
  const namespace = page.packageId;
  const pageId = page.page.id;

  if (definition.kind === "chat" && definition.contractVersion === "0.1.0") {
    if (typeof definition.title === "string") {
      definition.title = localization.resolve(
        namespace,
        `page.${pageId}.title`,
        definition.title
      );
    }
    if (isObject(definition.composer)) {
      if (typeof definition.composer.placeholder === "string") {
        definition.composer.placeholder = localization.resolve(
          namespace,
          `chat.${pageId}.composer.placeholder`,
          definition.composer.placeholder
        );
      }
      if (typeof definition.composer.sendLabel === "string") {
        definition.composer.sendLabel = localization.resolve(
          namespace,
          `chat.${pageId}.composer.sendLabel`,
          definition.composer.sendLabel
        );
      }
    }
    if (typeof definition.emptyState === "string") {
      definition.emptyState = localization.resolve(
        namespace,
        `chat.${pageId}.emptyState`,
        definition.emptyState
      );
    }
    return definition;
  }

  if (definition.kind === "settings-editor" && definition.contractVersion === "0.1.0") {
    const settingsNamespace = typeof definition.namespace === "string"
      ? definition.namespace
      : namespace;
    if (typeof definition.title === "string") {
      definition.title = localization.resolve(
        settingsNamespace,
        "settings.title",
        definition.title
      );
    }
    if (typeof definition.description === "string") {
      definition.description = localization.resolve(
        settingsNamespace,
        "settings.description",
        definition.description
      );
    }
    if (typeof definition.saveLabel === "string") {
      definition.saveLabel = localization.resolve(
        settingsNamespace,
        "settings.saveLabel",
        definition.saveLabel
      );
    }
    if (typeof definition.emptyMessage === "string") {
      definition.emptyMessage = localization.resolve(
        settingsNamespace,
        "settings.emptyMessage",
        definition.emptyMessage
      );
    }
    if (Array.isArray(definition.settings)) {
      for (const setting of definition.settings) {
        if (!isObject(setting) || typeof setting.key !== "string") continue;
        if (typeof setting.label === "string") {
          setting.label = localization.resolve(
            settingsNamespace,
            `settings.${setting.key}.label`,
            setting.label
          );
        }
        if (typeof setting.description === "string") {
          setting.description = localization.resolve(
            settingsNamespace,
            `settings.${setting.key}.description`,
            setting.description
          );
        }
      }
    }
    return definition;
  }

  if (definition.kind === "form" && definition.contractVersion === "0.1.1") {
    if (typeof definition.title === "string") {
      definition.title = localization.resolve(
        namespace,
        `page.${pageId}.title`,
        definition.title
      );
    }

    if (Array.isArray(definition.fields)) {
      for (const field of definition.fields) {
        if (!isObject(field) || typeof field.key !== "string") continue;
        if (typeof field.label === "string") {
          field.label = localization.resolve(
            namespace,
            `field.${pageId}.${field.key}.label`,
            field.label
          );
        }
        if (Array.isArray(field.options)) {
          for (const option of field.options) {
            if (!isObject(option) || typeof option.label !== "string") continue;
            option.label = localization.resolve(
              namespace,
              `option.${pageId}.${field.key}.${String(option.value)}.label`,
              option.label
            );
          }
        }
      }
    }

    if (Array.isArray(definition.actions)) {
      for (const action of definition.actions) {
        if (!isObject(action) || typeof action.id !== "string" || typeof action.label !== "string") continue;
        action.label = localization.resolve(
          namespace,
          `action.${pageId}.${action.id}.label`,
          action.label
        );
      }
    }

    return definition;
  }

  if (definition.kind === "catalog-browser" && definition.contractVersion === "0.1.0") {
    const catalogId = typeof definition.id === "string" ? definition.id : pageId;
    if (typeof definition.title === "string") {
      definition.title = localization.resolve(namespace, `catalog.${catalogId}.title`, definition.title);
    }
    if (typeof definition.description === "string") {
      definition.description = localization.resolve(namespace, `catalog.${catalogId}.description`, definition.description);
    }
    if (typeof definition.emptyMessage === "string") {
      definition.emptyMessage = localization.resolve(namespace, `catalog.${catalogId}.empty`, definition.emptyMessage);
    }
    if (Array.isArray(definition.items)) {
      for (const item of definition.items) {
        if (!isObject(item) || typeof item.id !== "string") continue;
        if (typeof item.summary === "string") {
          item.summary = localization.resolve(
            namespace,
            `catalog.${catalogId}.item.summary`,
            item.summary,
            isObject(item.metadata) ? item.metadata : undefined
          );
        }
        if (isObject(item.status) && typeof item.status.label === "string") {
          const statusId = typeof item.status.id === "string" ? item.status.id : "default";
          item.status.label = localization.resolve(
            namespace,
            `catalog.${catalogId}.status.${statusId}.label`,
            item.status.label
          );
        }
        const actions = [
          ...(isObject(item.primaryAction) ? [item.primaryAction] : []),
          ...(Array.isArray(item.secondaryActions) ? item.secondaryActions.filter(isObject) : [])
        ];
        for (const action of actions) {
          if (typeof action.id !== "string") continue;
          if (typeof action.label === "string") {
            action.label = localization.resolve(namespace, `catalog.${catalogId}.action.${action.id}.label`, action.label);
          }
          if (typeof action.helpText === "string") {
            action.helpText = localization.resolve(namespace, `catalog.${catalogId}.action.${action.id}.help`, action.helpText);
          }
          if (typeof action.disabledReason === "string") {
            action.disabledReason = localization.resolve(namespace, `catalog.${catalogId}.action.${action.id}.disabled`, action.disabledReason);
          }
        }
      }
    }
    return definition;
  }

  return definition;
}
