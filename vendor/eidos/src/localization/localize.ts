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

  if (definition.kind === "chat" && definition.contractVersion === "0.2.0") {
    if (typeof definition.title === "string") {
      definition.title = localization.resolve(namespace, `page.${pageId}.title`, definition.title);
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
    if (isObject(definition.context) && typeof definition.context.label === "string") {
      definition.context.label = localization.resolve(
        namespace,
        `chat.${pageId}.context.label`,
        definition.context.label
      );
    }
    if (isObject(definition.readiness)) {
      const state = typeof definition.readiness.state === "string" ? definition.readiness.state : "default";
      if (typeof definition.readiness.label === "string") {
        definition.readiness.label = localization.resolve(
          namespace,
          `chat.${pageId}.readiness.${state}.label`,
          definition.readiness.label
        );
      }
      if (typeof definition.readiness.message === "string") {
        definition.readiness.message = localization.resolve(
          namespace,
          `chat.${pageId}.readiness.${state}.message`,
          definition.readiness.message
        );
      }
      if (isObject(definition.readiness.action) && typeof definition.readiness.action.id === "string" && typeof definition.readiness.action.label === "string") {
        definition.readiness.action.label = localization.resolve(
          namespace,
          `chat.${pageId}.action.${definition.readiness.action.id}.label`,
          definition.readiness.action.label
        );
      }
    }
    if (isObject(definition.emptyState)) {
      if (typeof definition.emptyState.title === "string") {
        definition.emptyState.title = localization.resolve(
          namespace,
          `chat.${pageId}.empty.title`,
          definition.emptyState.title
        );
      }
      if (typeof definition.emptyState.description === "string") {
        definition.emptyState.description = localization.resolve(
          namespace,
          `chat.${pageId}.empty.description`,
          definition.emptyState.description
        );
      }
      if (Array.isArray(definition.emptyState.suggestions)) {
        for (const suggestion of definition.emptyState.suggestions) {
          if (!isObject(suggestion) || typeof suggestion.id !== "string" || typeof suggestion.label !== "string") continue;
          suggestion.label = localization.resolve(
            namespace,
            `chat.${pageId}.suggestion.${suggestion.id}.label`,
            suggestion.label
          );
        }
      }
    }
    return definition;
  }

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

  if (definition.kind === "settings-editor" && definition.contractVersion === "0.2.0") {
    const settingsNamespace = typeof definition.namespace === "string" ? definition.namespace : namespace;
    if (typeof definition.title === "string") {
      definition.title = localization.resolve(settingsNamespace, "settings.title", definition.title);
    }
    if (typeof definition.description === "string") {
      definition.description = localization.resolve(settingsNamespace, "settings.description", definition.description);
    }
    if (typeof definition.saveLabel === "string") {
      definition.saveLabel = localization.resolve(settingsNamespace, "settings.saveLabel", definition.saveLabel);
    }
    if (isObject(definition.notice)) {
      if (typeof definition.notice.title === "string") {
        definition.notice.title = localization.resolve(settingsNamespace, "settings.notice.title", definition.notice.title);
      }
      if (typeof definition.notice.message === "string") {
        definition.notice.message = localization.resolve(settingsNamespace, "settings.notice.message", definition.notice.message);
      }
    }
    if (Array.isArray(definition.groups)) {
      for (const group of definition.groups) {
        if (!isObject(group) || typeof group.id !== "string") continue;
        if (typeof group.title === "string") {
          group.title = localization.resolve(settingsNamespace, `settings.group.${group.id}.title`, group.title);
        }
        if (typeof group.description === "string") {
          group.description = localization.resolve(settingsNamespace, `settings.group.${group.id}.description`, group.description);
        }
        if (!Array.isArray(group.settings)) continue;
        for (const setting of group.settings) {
          if (!isObject(setting) || typeof setting.key !== "string") continue;
          if (typeof setting.label === "string") {
            setting.label = localization.resolve(settingsNamespace, `settings.${setting.key}.label`, setting.label);
          }
          if (typeof setting.description === "string") {
            setting.description = localization.resolve(settingsNamespace, `settings.${setting.key}.description`, setting.description);
          }
          if (isObject(setting.status) && typeof setting.status.label === "string") {
            setting.status.label = localization.resolve(settingsNamespace, `settings.${setting.key}.status`, setting.status.label);
          }
          if (Array.isArray(setting.options)) {
            for (const option of setting.options) {
              if (!isObject(option) || typeof option.label !== "string") continue;
              option.label = localization.resolve(
                settingsNamespace,
                `settings.${setting.key}.option.${String(option.value)}`,
                option.label
              );
            }
          }
        }
      }
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

  if (definition.kind === "extension-manager" && definition.contractVersion === "0.1.0") {
    const managerId = typeof definition.id === "string" ? definition.id : pageId;
    if (typeof definition.title === "string") {
      definition.title = localization.resolve(
        namespace,
        `extensions.${managerId}.title`,
        definition.title
      );
    }
    if (typeof definition.description === "string") {
      definition.description = localization.resolve(
        namespace,
        `extensions.${managerId}.description`,
        definition.description
      );
    }
    if (typeof definition.emptyMessage === "string") {
      definition.emptyMessage = localization.resolve(
        namespace,
        `extensions.${managerId}.empty`,
        definition.emptyMessage
      );
    }
    if (typeof definition.technicalDetailsLabel === "string") {
      definition.technicalDetailsLabel = localization.resolve(
        namespace,
        `extensions.${managerId}.technicalDetails`,
        definition.technicalDetailsLabel
      );
    }
    if (Array.isArray(definition.items)) {
      for (const item of definition.items) {
        if (!isObject(item) || typeof item.id !== "string") continue;
        if (isObject(item.status) && typeof item.status.label === "string") {
          const statusId = typeof item.status.id === "string" ? item.status.id : "default";
          item.status.label = localization.resolve(
            namespace,
            `extensions.${managerId}.status.${statusId}.label`,
            item.status.label
          );
        }
        if (isObject(item.readiness)) {
          const readinessId = typeof item.readiness.id === "string" ? item.readiness.id : "default";
          if (typeof item.readiness.label === "string") {
            item.readiness.label = localization.resolve(
              namespace,
              `extensions.${managerId}.readiness.${readinessId}.label`,
              item.readiness.label
            );
          }
          if (typeof item.readiness.message === "string") {
            item.readiness.message = localization.resolve(
              namespace,
              `extensions.${managerId}.readiness.${readinessId}.message`,
              item.readiness.message
            );
          }
        }
        const actions = [
          ...(isObject(item.primaryAction) ? [item.primaryAction] : []),
          ...(Array.isArray(item.secondaryActions) ? item.secondaryActions.filter(isObject) : [])
        ];
        for (const action of actions) {
          if (typeof action.id !== "string") continue;
          if (typeof action.label === "string") {
            action.label = localization.resolve(
              namespace,
              `extensions.${managerId}.action.${action.id}.label`,
              action.label
            );
          }
          if (typeof action.helpText === "string") {
            action.helpText = localization.resolve(
              namespace,
              `extensions.${managerId}.action.${action.id}.help`,
              action.helpText
            );
          }
          if (typeof action.disabledReason === "string") {
            action.disabledReason = localization.resolve(
              namespace,
              `extensions.${managerId}.action.${action.id}.disabled`,
              action.disabledReason
            );
          }
        }
      }
    }
    return definition;
  }

  if (definition.kind === "setup-flow" && definition.contractVersion === "0.1.0") {
    const setupId = typeof definition.id === "string" ? definition.id : pageId;
    if (typeof definition.title === "string") {
      definition.title = localization.resolve(namespace, `setup.${setupId}.title`, definition.title);
    }
    if (typeof definition.description === "string") {
      definition.description = localization.resolve(namespace, `setup.${setupId}.description`, definition.description);
    }
    if (Array.isArray(definition.steps)) {
      for (const step of definition.steps) {
        if (!isObject(step) || typeof step.id !== "string") continue;
        if (typeof step.title === "string") {
          step.title = localization.resolve(namespace, `setup.${setupId}.step.${step.id}.title`, step.title);
        }
        if (typeof step.description === "string") {
          step.description = localization.resolve(namespace, `setup.${setupId}.step.${step.id}.description`, step.description);
        }
        if (typeof step.statusDetail === "string") {
          step.statusDetail = localization.resolve(namespace, `setup.${setupId}.step.${step.id}.status`, step.statusDetail);
        }
        const actions = [
          ...(isObject(step.primaryAction) ? [step.primaryAction] : []),
          ...(Array.isArray(step.secondaryActions) ? step.secondaryActions.filter(isObject) : [])
        ];
        for (const action of actions) {
          if (typeof action.id !== "string" || typeof action.label !== "string") continue;
          action.label = localization.resolve(
            namespace,
            `setup.${setupId}.action.${action.id}.label`,
            action.label
          );
        }
      }
    }
    if (isObject(definition.completionAction)
      && typeof definition.completionAction.id === "string"
      && typeof definition.completionAction.label === "string") {
      definition.completionAction.label = localization.resolve(
        namespace,
        `setup.${setupId}.action.${definition.completionAction.id}.label`,
        definition.completionAction.label
      );
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
    if (isObject(definition.search)) {
      if (typeof definition.search.placeholder === "string") {
        definition.search.placeholder = localization.resolve(
          namespace,
          `catalog.${catalogId}.search.placeholder`,
          definition.search.placeholder
        );
      }
      if (typeof definition.search.ariaLabel === "string") {
        definition.search.ariaLabel = localization.resolve(
          namespace,
          `catalog.${catalogId}.search.ariaLabel`,
          definition.search.ariaLabel
        );
      }
      if (typeof definition.search.noResultsMessage === "string") {
        definition.search.noResultsMessage = localization.resolve(
          namespace,
          `catalog.${catalogId}.search.noResults`,
          definition.search.noResultsMessage
        );
      }
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
