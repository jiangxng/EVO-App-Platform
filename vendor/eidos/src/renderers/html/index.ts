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

function renderTaskStepsList(task: import("../../runtime/contracts.js").UidlFormReviewTaskV010): string {
  return task.steps?.length ? `<ol data-eidos-form-task-steps>
    ${task.steps.map(step => `<li data-eidos-task-step-state="${esc(step.state)}">${esc(step.label)}</li>`).join("")}
  </ol>` : "";
}

function renderTaskStepsHeading(task: import("../../runtime/contracts.js").UidlFormReviewTaskV010): string {
  const steps = renderTaskStepsList(task);
  return steps ? `<div data-eidos-task-presentation="workbench" data-eidos-task-steps-heading>${steps}</div>` : "";
}

function renderReviewTask(task: import("../../runtime/contracts.js").UidlFormReviewTaskV010, omitSteps = false): string {
  const subject = task.subject;
  const facts = subject.badgeLabel ? "" : (subject.facts ?? []).map(fact =>
    `<div data-eidos-form-task-fact><dt>${esc(fact.label)}</dt><dd>${esc(fact.value)}</dd></div>`
  ).join("");
  const fileContext = subject.badgeLabel ? " data-eidos-form-task-file-context" : "";
  const badge = subject.badgeLabel ? `<span data-eidos-form-task-file-kind>${esc(subject.badgeLabel)}</span>` : "";
  const statusTone = subject.statusTone ? ` data-tone="${esc(subject.statusTone)}"` : "";
  const context = `<section data-eidos-form-task-context${fileContext}>
    ${badge}<div data-eidos-form-task-identity><strong>${esc(subject.title)}</strong>
      ${subject.subtitle ? `<p>${esc(subject.subtitle)}</p>` : ""}</div>
    ${subject.statusLabel ? `<span data-eidos-form-task-source-status${statusTone}>${esc(subject.statusLabel)}</span>` : ""}
    ${facts ? `<dl data-eidos-form-task-facts>${facts}</dl>` : ""}
  </section>`;
  const steps = omitSteps ? "" : renderTaskStepsList(task);
  const metrics = task.metrics?.length ? `<section data-eidos-form-task-metrics>
    ${task.metrics.map(metric=>`<div data-eidos-form-task-metric
      data-eidos-form-task-metric-id="${esc(metric.id)}"
      data-tone="${esc(metric.tone ?? "neutral")}"><strong>${esc(metric.value)}</strong>
      <span>${esc(metric.label)}</span></div>`).join("")}
  </section>` : "";
  const issues = task.issues?.length ? `<section data-eidos-form-task-issues>
    <header><h2>${esc(task.issuesTitle ?? "Needs review")}</h2>
    ${task.issuesDescription ? `<p>${esc(task.issuesDescription)}</p>` : ""}</header>
    <ol>${task.issues.map(issue=>`<li data-eidos-form-task-issue="${esc(issue.id)}">
      <div><strong>${esc(issue.title)}</strong>
      ${issue.description ? `<p>${esc(issue.description)}</p>` : ""}</div>
      ${issue.focusGroupId ? `<button type="button" data-eidos-form-task-focus="${esc(issue.focusGroupId)}">${esc(issue.actionLabel ?? "Review")}</button>` : ""}
    </li>`).join("")}</ol>
  </section>` : "";
  const help = task.helpText ? `<p data-eidos-form-task-help>${esc(task.helpText)}</p>` : "";
  if (task.presentation === "decision-first") {
    const issuesLabel = task.issues?.length
      ? `<span data-eidos-task-summary-issues>${esc(task.issuesTitle ?? "Review")}: ${task.issues.length}</span>`
      : "";
    return `<div data-eidos-form-task-overview data-eidos-task-presentation="decision-first">
      <details data-eidos-form-task-details>
        <summary><strong>${esc(subject.title)}</strong>${issuesLabel}</summary>
        <div data-eidos-form-task-details-content>${steps}${context}${metrics}${issues}${help}</div>
      </details>
    </div>`;
  }
  if (task.presentation === "workbench") {
    return `<div data-eidos-form-task-overview data-eidos-task-presentation="workbench">
      ${steps}${context}${metrics}${issues}${help}
    </div>`;
  }
  return `<div data-eidos-form-task-overview>${steps}${context}${metrics}${issues}${help}</div>`;
}

export function renderToHtml(document: unknown): string {
  const model = toRenderModel(document);
  const renderContextLink = (field: RenderFieldV010) => field.contextLink
    ? `<button type="button" data-eidos-field-context-link data-eidos-context-route="${esc(field.contextLink.route)}">${esc(field.contextLink.label)}</button>` : "";
  const renderField = (field: RenderFieldV010, compactLabel = false,
    includeContextLink = true) => field.presentation === "hidden"
      ? `<input type="hidden" name="${esc(field.inputName)}" data-semantic-type="${esc(field.semanticType)}" value="${esc(field.initialValue ?? "")}">`
      : `<div data-eidos-form-field><label>${compactLabel
        ? `<span data-eidos-review-table-choice-label>${esc(field.label)}</span>`
        : esc(field.label)}${input(field)}</label>${includeContextLink
        ? renderContextLink(field) : ""}</div>`;
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
      const deferLink = compact && Boolean(primaryField.contextLink) && group.detailFieldKeys.length > 0;
      const primary = renderField(primaryField,compact,!deferLink);
      const details = group.detailFieldKeys.map(key => renderField(byKey.get(key)!)).join("")
        + (deferLink ? renderContextLink(primaryField) : "");
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
    const count=(model.reviewGroups ?? []).filter(group => !allowed || allowed.includes(group.reviewStatus!.key)).length;
    const summaryLabel = model.reviewTable?.summaryLabel ?? "";
    const showAllLabel = model.reviewTable?.showAllLabel ?? "";
    const heading = model.reviewTable?.title || summaryLabel || showAllLabel
      ? `<header data-eidos-form-review-table-heading>
          <div><h2>${esc(model.reviewTable?.title ?? "")}</h2>
            ${model.reviewTable?.description ? `<p>${esc(model.reviewTable.description)}</p>` : ""}</div>
          <div data-eidos-form-review-table-summary>
            ${summaryLabel ? `<span>${esc(summaryLabel)}</span>` : ""}
            ${showAllLabel ? `<button type="button" data-eidos-review-table-show-all>${esc(showAllLabel)}</button>` : ""}
          </div>
        </header>` : "";
    const links = (model.reviewTable?.links ?? []).map(link =>
      `<button type="button" data-eidos-context-route="${esc(link.route)}" data-eidos-review-table-link="${esc(link.id)}">${esc(link.label)}</button>`
    ).join("");
    const tableAgentActions = model.agentActions.map(action =>
      `<button type="button" data-eidos-agent-action="${esc(action.id)}">${esc(action.label)}</button>`
    ).join("");
    const tools = links + tableAgentActions;
    const filterMarkup = filter
      ? `<div data-eidos-form-review-table-filter-group><label>${esc(filter.label)}
          <select data-eidos-form-review-table-filter>${filter.options.map(option =>
            `<option value="${esc(option.id)}" data-eidos-review-table-filter-keys="${esc(option.statusKeys.join(","))}"${option.id === filter.selectedId ? " selected" : ""}>${esc(option.label)}</option>`
          ).join("")}</select></label>
          <span data-eidos-form-review-table-count
            data-eidos-review-table-count-prefix="${esc(model.reviewTable?.countPrefix ?? "")}"
            data-eidos-review-table-count-suffix="${esc(model.reviewTable?.countSuffix ?? "")}"
            role="status" aria-live="polite">${esc((model.reviewTable?.countPrefix ?? "") + count + " / " + (model.reviewGroups?.length ?? 0) + (model.reviewTable?.countSuffix ?? ""))}</span></div>`
      : "";
    const toolbar = tools || filterMarkup
      ? `<div data-eidos-form-review-table-toolbar>${tools ? `<div data-eidos-form-review-table-tools>${tools}</div>` : ""}${filterMarkup}</div>`
      : "";
    return `${heading}<section data-eidos-form-review-table-wrap data-eidos-review-table-presentation="${esc(model.reviewTable?.presentation ?? "standard")}">
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
  const workbenchSteps = model.reviewTask?.presentation === "workbench"
    ? renderTaskStepsHeading(model.reviewTask) : "";
  const taskOverview = model.reviewTask
    ? renderReviewTask(model.reviewTask, model.reviewTask.presentation === "workbench")
    : "";
  const taskPresentationAttribute = model.reviewTask?.presentation
    ? ` data-eidos-task-presentation="${esc(model.reviewTask.presentation)}"` : "";
  const fields = standalone + (model.reviewTable
    ? reviewTable : groups
      ? `<div data-eidos-form-review-groups>${groups}</div>` : "");
  const agentActions = model.reviewTable ? "" : model.agentActions
    .map(action =>
      `<button type="button" data-eidos-agent-action="${esc(action.id)}">${esc(action.label)}</button>`
    )
    .join("");
  const cancels = model.cancelActions
    .map(action => {
      const type = action.resetForm ? "reset" : "button";
      const route = action.route ? ` data-eidos-context-route="${esc(action.route)}"` : "";
      const reset = action.resetForm ? " data-eidos-form-reset" : "";
      return `<button type="${type}" data-eidos-action="${esc(action.id)}"${route}${reset}>${esc(action.label)}</button>`;
    })
    .join("");

  return `<form data-eidos-id="${esc(model.id)}" data-command="${esc(model.command.code)}" data-model-version="${model.modelVersion}"${taskPresentationAttribute}>
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
${model.submitActions.map((action,index)=>`<button type="submit" data-eidos-action="${esc(action.id)}" data-eidos-declared-command="${esc(action.command)}"${index===0 ? ` data-eidos-primary="true"` : ""}>${esc(action.label)}</button>`).join("")}
${agentActions}${cancels}
</footer>
</form>`;
}
