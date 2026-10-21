import type {
  RenderFieldV010
} from "../../runtime/contracts.js";
import { toRenderModel } from "../../runtime/render-model.js";
import {
  renderContextNavigationV010
} from "../../navigation/context-navigation.js";

function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function input(field: RenderFieldV010): string {
  const common = [
    `name="${esc(field.inputName)}"`,
    `data-semantic-type="${esc(field.semanticType)}"`,
    field.required ? "required" : "",
    field.readOnly ? "disabled" : ""
  ].filter(Boolean).join(" ");

  if (field.control === "select") {
    const exclusive=field.exclusiveSelect
      ? ` data-eidos-exclusive-group="${esc(field.exclusiveSelect.group)}"`
      : "";
    return `<select ${common}${exclusive}>${(field.options ?? []).map(option =>
      `<option data-value-type="${typeof option.value}" value="${esc(option.value)}"${field.initialValue === option.value ? " selected" : ""}>${esc(option.label)}</option>`
    ).join("")}</select>`;
  }

  if (field.control === "file") {
    const accept = field.accept?.length
      ? ` accept="${esc(field.accept.join(","))}"`
      : "";
    const maxBytes = field.maxBytes !== undefined
      ? ` data-eidos-file-max-bytes="${esc(field.maxBytes)}"`
      : "";
    return `<input type="file" ${common} data-eidos-file-field${accept}${maxBytes}>`;
  }

  const type = field.control === "number" || field.control === "money"
    ? "number"
    : field.control === "date"
      ? "date"
      : "text";
  const min = field.validation?.min !== undefined
    ? ` min="${esc(field.validation.min)}"`
    : "";
  const max = field.validation?.max !== undefined
    ? ` max="${esc(field.validation.max)}"`
    : "";
  const pattern = field.validation?.pattern
    ? ` pattern="${esc(field.validation.pattern)}"`
    : "";
  const initial = field.initialValue !== undefined
    ? ` value="${esc(field.initialValue)}"`
    : "";

  return `<input type="${type}" ${common}${initial}${min}${max}${pattern}>${field.unit ? `<span data-unit>${esc(field.unit)}</span>` : ""}`;
}

function renderReviewTaskSteps(task: import("../../runtime/contracts.js").UidlFormReviewTaskV010): string {
  return task.steps?.length ? `<ol data-eidos-form-task-steps${task.presentation === "workbench"
      ? ' data-eidos-task-steps-presentation="workbench"' : ""}>
    ${task.steps.map(step => `<li data-eidos-task-step-state="${esc(step.state)}"${step.state === "current"
      ? ' aria-current="step"' : ""}>${esc(step.label)}</li>`).join("")}
  </ol>` : "";
}

function renderReviewTask(task: import("../../runtime/contracts.js").UidlFormReviewTaskV010, stepsInHeader = false): string {
  const subject=task.subject;
  const facts=(subject.facts ?? []).map(fact =>
    `<div data-eidos-form-task-fact><dt>${esc(fact.label)}</dt><dd>${esc(fact.value)}</dd></div>`
  ).join("");
  const context=`<section data-eidos-form-task-context>
    <div data-eidos-form-task-identity${subject.iconLabel ? ' data-eidos-form-task-has-icon="true"' : ""}>
      ${subject.iconLabel ? `<span data-eidos-form-task-icon aria-hidden="true">${esc(subject.iconLabel)}</span>` : ""}
      <div data-eidos-form-task-copy><strong>${esc(subject.title)}</strong>
      ${subject.subtitle ? `<p>${esc(subject.subtitle)}</p>` : ""}</div></div>
    ${subject.statusLabel ? `<span data-eidos-form-task-source-status${subject.statusTone
      ? ` data-tone="${esc(subject.statusTone)}"` : ""}>${esc(subject.statusLabel)}</span>` : ""}
    ${facts ? `<dl data-eidos-form-task-facts>${facts}</dl>` : ""}
  </section>`;
  const steps=renderReviewTaskSteps(task);
  const metrics=task.metrics?.length ? `<section data-eidos-form-task-metrics>
    ${task.metrics.map(metric=>`<div data-eidos-form-task-metric
      data-eidos-form-task-metric-id="${esc(metric.id)}"
      data-tone="${esc(metric.tone ?? "neutral")}"><strong>${esc(metric.value)}</strong>
      <span>${esc(metric.label)}</span></div>`).join("")}
  </section>` : "";
  const issues=task.issues?.length ? `<section data-eidos-form-task-issues${task.presentation === "workbench"
    && task.issuesLayout === "connected" ? ' data-eidos-task-issues-layout="connected"' : ""}>
    <header><h2>${esc(task.issuesTitle ?? "Needs review")}</h2>
    ${task.issuesDescription ? `<p>${esc(task.issuesDescription)}</p>` : ""}
    ${task.presentation === "workbench" && task.issuesCountSuffix
      ? `<span data-eidos-form-task-issue-count aria-label="${esc(task.issues.length + " " + task.issuesCountSuffix)}">${esc(task.issues.length + " " + task.issuesCountSuffix)}</span>` : ""}</header>
    <ol>${task.issues.map(issue=>`<li data-eidos-form-task-issue="${esc(issue.id)}">
      <div><strong>${esc(issue.title)}</strong>
      ${issue.description ? `<p>${esc(issue.description)}</p>` : ""}</div>
      ${issue.relatedRoutes?.length
        ? `<details data-eidos-form-task-issue-related>
            <summary>${esc(issue.actionLabel ?? "View records")}</summary>
            <div data-eidos-form-task-issue-related-links>${issue.relatedRoutes.map(link=>
              `<button type="button" data-eidos-form-task-issue-row
                data-eidos-context-route="${esc(link.route)}">${esc(link.label)}</button>`
              ).join("")}</div>
          </details>`
        : issue.focusGroupId ? `<button type="button"
        data-eidos-form-task-focus="${esc(issue.focusGroupId)}">${esc(issue.actionLabel ?? "Review")}</button>` : ""}
    </li>`).join("")}</ol>
  </section>` : "";
  const help=task.helpText ? `<p data-eidos-form-task-help>${esc(task.helpText)}</p>` : "";
  if(task.presentation === "decision-first") {
    // Support context stays discoverable and keyboard accessible, but does not
    // consume the first viewport ahead of Human field decisions.
    const issuesLabel=task.issues?.length
      ? `<span data-eidos-task-summary-issues>${esc(task.issuesTitle ?? "Review")}: ${task.issues.length}</span>`
      : "";
    return `<div data-eidos-form-task-overview data-eidos-task-presentation="decision-first">
      <details data-eidos-form-task-details>
        <summary><strong>${esc(subject.title)}</strong>${issuesLabel}</summary>
        <div data-eidos-form-task-details-content>${steps}${context}${metrics}${issues}${help}</div>
      </details>
    </div>`;
  }
  if(task.presentation === "workbench") {
    // Keep actual source, status, metrics, and actionable issues visible in
    // their workflow order before Human review choices (Eidos #201).
    return `<div data-eidos-form-task-overview data-eidos-task-presentation="workbench">
      ${stepsInHeader ? "" : steps}${context}${metrics}${issues}${help}
    </div>`;
  }
  return `<div data-eidos-form-task-overview>${steps}${context}${metrics}${issues}${help}</div>`;
}

export function renderToHtml(document: unknown): string {
  const model = toRenderModel(document);
  const renderContextLink = (field: RenderFieldV010) => field.contextLink
    ? `<button type="button" data-eidos-field-context-link data-eidos-context-route="${esc(field.contextLink.route)}">${esc(field.contextLink.label)}</button>` : "";
  const renderField = (field: RenderFieldV010, compactLabel = false,
    includeContextLink = true) => {
    if (field.hidden === true) {
      return `<input type="hidden" name="${esc(field.inputName)}" data-semantic-type="${esc(field.semanticType)}" data-eidos-hidden-field value="${esc(field.initialValue)}">`;
    }
    return `<div data-eidos-form-field><label>${compactLabel
      ? `<span data-eidos-review-table-choice-label>${esc(field.label)}</span>`
      : esc(field.label)}${input(field)}</label>${includeContextLink
      ? renderContextLink(field) : ""}</div>`;
  };
  const byKey = new Map(model.fields.map(field => [field.key, field]));
  const used = new Set<string>();
  const groups = (model.reviewGroups ?? []).map(group => {
    const primary = byKey.get(group.primaryFieldKey)!;
    used.add(primary.key);
    const details = group.detailFieldKeys.map(key => {
      used.add(key);
      return renderField(byKey.get(key)!);
    }).join("");
    return `<section data-eidos-form-review-group="${esc(group.id)}">
      <header data-eidos-review-group-heading>
        <div><strong>${esc(group.title)}</strong>
        ${group.summary ? `<p>${esc(group.summary)}</p>` : ""}</div>
        <div data-eidos-review-group-primary>${renderField(primary)}</div>
      </header>
      ${details ? `<details data-eidos-review-group-detail${group.defaultExpanded ? " open" : ""}>
        <summary>${esc(group.detailsLabel ?? "Details")}</summary>
        <div data-eidos-review-group-fields>${details}</div>
      </details>` : ""}
    </section>`;
  }).join("");
  const standalone = model.fields.filter(field => !used.has(field.key))
    .map(field => renderField(field)).join("");
  // Table is a second, optional presentation of the SAME Form group keys.
  // It does not create a new command, synthetic field or separate save path.
  const reviewTable = model.reviewTable ? (() => {
    const columns = model.reviewTable!.columnLabels;
    const filter = model.reviewTable!.filter;
    const selected = filter?.options.find(option => option.id === filter.selectedId);
    const allowed = selected?.statusKeys;
    const tableRows = (model.reviewGroups ?? []).map(group => {
      const status = group.reviewStatus!;
      const primaryField = byKey.get(group.primaryFieldKey)!;
      const compact = model.reviewTable?.presentation === "compact";
      const deferLink = compact && Boolean(primaryField.contextLink)
        && group.detailFieldKeys.length > 0;
      const primary = renderField(primaryField,compact,!deferLink);
      const details = group.detailFieldKeys.map(key =>
        renderField(byKey.get(key)!)
      ).join("") + (deferLink ? renderContextLink(primaryField) : "");
      const visible = !allowed || allowed.includes(status.key);
      const planFields=model.reviewPlan?.proposedFields?.find(item=>item.groupId===group.id);
      const planAttrs=planFields
        ? ` data-eidos-plan-label-field="${esc(planFields.labelFieldKey)}" data-eidos-plan-type-field="${esc(planFields.typeFieldKey)}"`
        : "";
      return `<tbody data-eidos-form-review-table-row="${esc(group.id)}"
        data-eidos-review-table-status-key="${esc(status.key)}"${planAttrs}${group.statusByChoice
          ? ` data-eidos-review-status-by-choice="${esc(JSON.stringify(group.statusByChoice))}"` : ""}${visible ? "" : " hidden"}>
        <tr>
          <th scope="row" data-eidos-review-table-subject>${esc(group.title)}</th>
          <td data-eidos-review-table-evidence data-heading="${esc(columns.evidence)}">
            <span data-eidos-review-table-sample>${esc(group.summary ?? "")}</span>
            ${details ? `<details data-eidos-review-group-detail${group.defaultExpanded ? " open" : ""}>
              <summary>${esc(group.detailsLabel ?? "Details")}</summary>
              <div data-eidos-review-group-fields>${details}</div>
            </details>` : ""}
          </td>
          <td data-eidos-review-table-choice data-heading="${esc(columns.decision)}">${primary}</td>
          <td data-eidos-review-table-status data-tone="${esc(status.tone ?? "neutral")}"
            data-heading="${esc(columns.status)}">${esc(status.label)}</td>
        </tr>
      </tbody>`;
    }).join("");
    const count=(model.reviewGroups ?? []).filter(group =>
      !allowed || allowed.includes(group.reviewStatus!.key)).length;
    const toolbarAgent=model.reviewTable?.agentActionId
      ? model.agentActions.find(action=>action.id===model.reviewTable?.agentActionId)
      : undefined;
    const toolbar=filter || toolbarAgent
      ? `<div data-eidos-form-review-table-toolbar>
          ${filter ? `<div data-eidos-form-review-table-toolbar-context>
            <span data-eidos-form-review-table-count role="status" aria-live="polite">${count} / ${model.reviewGroups?.length ?? 0}</span>
            ${model.reviewTable?.toolbarHint ? `<p data-eidos-form-review-table-toolbar-hint>${esc(model.reviewTable.toolbarHint)}</p>` : ""}
          </div>` : ""}
          <div data-eidos-form-review-table-toolbar-tools>
          ${filter ? `<label>${esc(filter.label)}
          <select data-eidos-form-review-table-filter>${filter.options.map(option =>
            `<option value="${esc(option.id)}"
              data-eidos-review-table-filter-keys="${esc(option.statusKeys.join(","))}"${option.id === filter.selectedId ? " selected" : ""}>${esc(option.label)}</option>`
          ).join("")}</select></label>` : ""}
          ${toolbarAgent ? `<button type="button" data-eidos-review-table-agent-action
            data-eidos-agent-action="${esc(toolbarAgent.id)}">${esc(toolbarAgent.label)}</button>` : ""}
          </div></div>`
      : "";
    const utilities=model.reviewTable?.utilityNavigation;
    const utilityMenu=utilities
      ? `<details data-eidos-form-review-table-utility-nav>
          <summary>${esc(utilities.label)}</summary>
          <div data-eidos-form-review-table-utility-links>${utilities.items.map(item=>
            `<button type="button" data-eidos-form-review-table-utility-id="${esc(item.id)}"
              data-eidos-context-route="${esc(item.route)}">${esc(item.label)}</button>`
          ).join("")}</div>
        </details>` : "";
    const heading=model.reviewTable?.heading
      ? `<header data-eidos-form-review-table-heading>
          <h2>${esc(model.reviewTable.heading.title)}</h2>
          ${model.reviewTable.heading.description
            ? `<p>${esc(model.reviewTable.heading.description)}</p>` : ""}
          ${utilityMenu}
        </header>` : utilityMenu;
    return `${heading}<section data-eidos-form-review-table-wrap data-eidos-review-table-presentation="${esc(model.reviewTable?.presentation ?? "standard")}" data-eidos-review-table-evidence-layout="${esc(model.reviewTable?.evidenceLayout ?? "stacked")}">
      ${toolbar}
      <div data-eidos-form-review-table-scroll>
        <table data-eidos-form-review-table aria-label="${esc(model.title)}">
          <thead><tr><th scope="col">${esc(columns.subject)}</th>
            <th scope="col">${esc(columns.evidence)}</th>
            <th scope="col">${esc(columns.decision)}</th>
            <th scope="col">${esc(columns.status)}</th>
          </tr></thead>${tableRows}
        </table>
      </div>
      ${filter ? `<p data-eidos-form-review-table-empty${count ? " hidden" : ""}>${esc(filter.noMatchesMessage)}</p>` : ""}
      ${model.reviewTable?.footnote ? `<p data-eidos-form-review-table-footnote>${esc(model.reviewTable.footnote)}</p>` : ""}
      </section>`;
  })() : "";
  const preview=model.reviewPlan ? `<section data-eidos-form-review-plan
    data-eidos-review-plan-categories="${esc(JSON.stringify(model.reviewPlan.categories))}"
    aria-label="${esc(model.reviewPlan.title)}">
    <header><h2>${esc(model.reviewPlan.title)}</h2>
    ${model.reviewPlan.description ? `<p>${esc(model.reviewPlan.description)}</p>` : ""}</header>
    <dl data-eidos-review-plan-counts role="status" aria-live="polite"></dl>
    <ul data-eidos-review-plan-items></ul>
    <p data-eidos-review-plan-warning>${esc(model.reviewPlan.warning)}</p>
  </section>` : "";
  const workbenchSteps=model.reviewTask?.presentation === "workbench"
    ? renderReviewTaskSteps(model.reviewTask) : "";
  const taskOverview=model.reviewTask
    ? renderReviewTask(model.reviewTask,model.reviewTask.presentation === "workbench") : "";
  const fields = standalone + (model.reviewTable
    ? reviewTable : groups
      ? `<div data-eidos-form-review-groups>${groups}</div>` : "");
  const agentActions = model.agentActions
    .filter(action=>action.id!==model.reviewTable?.agentActionId)
    .map(action =>
      `<button type="button" data-eidos-agent-action="${esc(action.id)}">${esc(action.label)}</button>`
    )
    .join("");
  const footer=model.reviewTask?.presentation === "workbench" ? model.reviewTask.footer : undefined;
  const footerNavigation=footer?.back
    ? `<button type="button" data-eidos-form-task-back data-eidos-context-route="${esc(footer.back.route)}">${esc(footer.back.label)}</button>` : "";
  const footerReset=footer?.resetLabel
    ? `<button type="reset" data-eidos-form-task-reset>${esc(footer.resetLabel)}</button>` : "";
  const footerHint=footer?.saveHint
    ? `<span data-eidos-form-task-save-hint>${esc(footer.saveHint)}</span>` : "";
  const cancels = model.cancelActions
    .map(action =>
      `<button type="button" data-eidos-action="${esc(action.id)}">${esc(action.label)}</button>`
    )
    .join("");

  return `<form data-eidos-id="${esc(model.id)}" data-command="${esc(model.command.code)}" data-model-version="${model.modelVersion}">
<header data-eidos-page-header>
${renderContextNavigationV010(model.contextNavigation)}
<div data-eidos-page-heading>
<div data-eidos-page-heading-copy>
<h1>${esc(model.title)}</h1>
${model.description ? `<p data-eidos-page-description>${esc(model.description)}</p>` : ""}
</div>
${workbenchSteps}
</div>
</header>
${taskOverview}
<div data-eidos-form-fields>${fields}</div>
${preview}
<footer data-eidos-form-actions>
${footerHint}${footerNavigation}${footerReset}
${model.submitActions.map((action,index)=>`<button type="submit" data-eidos-action="${esc(action.id)}" data-eidos-declared-command="${esc(action.command)}"${index===0 ? ` data-eidos-primary="true"` : ""}>${esc(action.label)}</button>`).join("")}
${agentActions}${cancels}
</footer>
</form>`;
}
