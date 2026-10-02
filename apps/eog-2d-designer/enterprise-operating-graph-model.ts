import type {
  EogApplicationLedgerEnterpriseRelationV010,
  EogApplicationLedgerGuidanceRelationV010,
  EogNodeBindingV010,
  EogValidationIssueV010,
  EogValidationResultV010,
  EnterpriseOperatingGraphOperationV010,
  EnterpriseOperatingGraphV010
} from "../../contracts/enterprise-operating-graph.js";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function nonEmpty(value: string): boolean {
  return Boolean(value?.trim());
}

function validIso(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function nodeRefMatchesKind(node: EogNodeBindingV010): boolean {
  return (
    node.kind === "APPLICATION"
    && node.semanticRef.kind === "APPLICATION"
  ) || (
    node.kind === "LEDGER"
    && node.semanticRef.kind === "LEDGER_DEFINITION"
  );
}

function nodeById(
  graph: EnterpriseOperatingGraphV010,
  nodeId: string
): EogNodeBindingV010 | undefined {
  return graph.nodes.find(node => node.nodeId === nodeId);
}

function assertApplicationLedgerEndpoints(
  graph: EnterpriseOperatingGraphV010,
  applicationNodeId: string,
  ledgerNodeId: string
): void {
  const application = nodeById(graph, applicationNodeId);
  const ledger = nodeById(graph, ledgerNodeId);
  if (!application || application.kind !== "APPLICATION") {
    throw new Error("EOG_APPLICATION_NODE_REQUIRED");
  }
  if (!ledger || ledger.kind !== "LEDGER") {
    throw new Error("EOG_LEDGER_NODE_REQUIRED");
  }
}

function duplicatePair<T extends {
  applicationNodeId: string;
  ledgerNodeId: string;
}>(
  relations: readonly T[],
  applicationNodeId: string,
  ledgerNodeId: string
): boolean {
  return relations.some(relation =>
    relation.applicationNodeId === applicationNodeId
    && relation.ledgerNodeId === ledgerNodeId
  );
}

export function createEnterpriseOperatingGraphV010(input: {
  graphId: string;
  enterpriseId: string;
  createdAt: string;
}): EnterpriseOperatingGraphV010 {
  if (
    !nonEmpty(input.graphId)
    || !nonEmpty(input.enterpriseId)
    || !validIso(input.createdAt)
  ) {
    throw new Error("EOG_CREATE_INPUT_INVALID");
  }
  return {
    contractVersion: "0.1.0",
    graphId: input.graphId.trim(),
    enterpriseId: input.enterpriseId.trim(),
    state: "DRAFT",
    revision: 0,
    nodes: [],
    guidanceRelations: [],
    enterpriseRelations: [],
    createdAt: input.createdAt,
    updatedAt: input.createdAt
  };
}

export function validateEnterpriseOperatingGraphV010(
  graph: EnterpriseOperatingGraphV010
): EogValidationResultV010 {
  const issues: EogValidationIssueV010[] = [];
  const issue = (code: string, path: string, message: string): void => {
    issues.push({ code, path, message });
  };

  if (
    graph.contractVersion !== "0.1.0"
    || !nonEmpty(graph.graphId)
    || !nonEmpty(graph.enterpriseId)
    || !Number.isInteger(graph.revision)
    || graph.revision < 0
    || !validIso(graph.createdAt)
    || !validIso(graph.updatedAt)
  ) {
    issue("EOG_GRAPH_HEADER_INVALID", "$", "Graph header is invalid.");
  }

  if (
    graph.state === "PUBLISHED"
    && (!graph.publishedAt || !validIso(graph.publishedAt))
  ) {
    issue(
      "EOG_PUBLISHED_AT_REQUIRED",
      "$.publishedAt",
      "Published graph requires a valid publishedAt timestamp."
    );
  }

  const nodeIds = new Set<string>();
  const semanticRefs = new Set<string>();
  graph.nodes.forEach((node, index) => {
    const path = `$.nodes[${index}]`;
    if (!nonEmpty(node.nodeId) || !nodeRefMatchesKind(node)) {
      issue("EOG_NODE_INVALID", path, "Node binding is invalid.");
      return;
    }
    if (
      !nonEmpty(node.semanticRef.refId)
      || (node.semanticRef.versionRef !== undefined
        && !nonEmpty(node.semanticRef.versionRef))
    ) {
      issue(
        "EOG_SEMANTIC_REF_INVALID",
        path + ".semanticRef",
        "Canonical semantic reference is invalid."
      );
    }
    if (nodeIds.has(node.nodeId)) {
      issue("EOG_NODE_ID_DUPLICATE", path + ".nodeId", "nodeId must be unique.");
    }
    nodeIds.add(node.nodeId);
    const refKey = [
      node.semanticRef.authority,
      node.semanticRef.kind,
      node.semanticRef.refId,
      node.semanticRef.versionRef ?? ""
    ].join(":");
    if (semanticRefs.has(refKey)) {
      issue(
        "EOG_SEMANTIC_REF_DUPLICATE",
        path + ".semanticRef",
        "The same canonical definition cannot be bound twice in v0.1."
      );
    }
    semanticRefs.add(refKey);
  });

  const guidanceIds = new Set<string>();
  const guidancePairs = new Set<string>();
  graph.guidanceRelations.forEach((relation, index) => {
    const path = `$.guidanceRelations[${index}]`;
    const app = nodeById(graph, relation.applicationNodeId);
    const ledger = nodeById(graph, relation.ledgerNodeId);
    if (
      !nonEmpty(relation.relationId)
      || relation.kind !== "APPLICATION_LEDGER"
      || !app
      || app.kind !== "APPLICATION"
      || !ledger
      || ledger.kind !== "LEDGER"
      || !nonEmpty(relation.source.sourceRef)
    ) {
      issue(
        "EOG_GUIDANCE_RELATION_INVALID",
        path,
        "Guidance relation must connect one bound Application to one bound Ledger."
      );
    }
    if (guidanceIds.has(relation.relationId)) {
      issue(
        "EOG_GUIDANCE_RELATION_ID_DUPLICATE",
        path + ".relationId",
        "Guidance relationId must be unique."
      );
    }
    guidanceIds.add(relation.relationId);
    const pair = relation.applicationNodeId + "->" + relation.ledgerNodeId;
    if (guidancePairs.has(pair)) {
      issue(
        "EOG_GUIDANCE_RELATION_DUPLICATE",
        path,
        "Only one guidance relation per Application/Ledger pair is allowed in v0.1."
      );
    }
    guidancePairs.add(pair);
  });

  const enterpriseIds = new Set<string>();
  const enterprisePairs = new Set<string>();
  graph.enterpriseRelations.forEach((relation, index) => {
    const path = `$.enterpriseRelations[${index}]`;
    const app = nodeById(graph, relation.applicationNodeId);
    const ledger = nodeById(graph, relation.ledgerNodeId);
    if (
      !nonEmpty(relation.relationId)
      || relation.kind !== "APPLICATION_LEDGER"
      || !app
      || app.kind !== "APPLICATION"
      || !ledger
      || ledger.kind !== "LEDGER"
      || !nonEmpty(relation.confirmedBySubjectId)
      || !validIso(relation.confirmedAt)
    ) {
      issue(
        "EOG_ENTERPRISE_RELATION_INVALID",
        path,
        "Confirmed enterprise relation is invalid."
      );
    }
    if (enterpriseIds.has(relation.relationId)) {
      issue(
        "EOG_ENTERPRISE_RELATION_ID_DUPLICATE",
        path + ".relationId",
        "Enterprise relationId must be unique."
      );
    }
    enterpriseIds.add(relation.relationId);
    const pair = relation.applicationNodeId + "->" + relation.ledgerNodeId;
    if (enterprisePairs.has(pair)) {
      issue(
        "EOG_ENTERPRISE_RELATION_DUPLICATE",
        path,
        "Only one confirmed enterprise relation per Application/Ledger pair is allowed in v0.1."
      );
    }
    enterprisePairs.add(pair);

    if (relation.confirmedFromGuidanceRelationId) {
      const guidance = graph.guidanceRelations.find(item =>
        item.relationId === relation.confirmedFromGuidanceRelationId
      );
      if (
        !guidance
        || guidance.applicationNodeId !== relation.applicationNodeId
        || guidance.ledgerNodeId !== relation.ledgerNodeId
      ) {
        issue(
          "EOG_CONFIRMED_GUIDANCE_MISMATCH",
          path + ".confirmedFromGuidanceRelationId",
          "Confirmed guidance provenance must resolve to the same Application/Ledger pair."
        );
      }
    }
  });

  return {
    contractVersion: "0.1.0",
    publishable: issues.length === 0,
    issues
  };
}

function assertOperationHeader(
  graph: EnterpriseOperatingGraphV010,
  operation: EnterpriseOperatingGraphOperationV010
): void {
  if (
    operation.contractVersion !== "0.1.0"
    || !nonEmpty(operation.operationId)
    || operation.graphId !== graph.graphId
    || !Number.isInteger(operation.expectedRevision)
    || operation.expectedRevision !== graph.revision
    || !nonEmpty(operation.actor.subjectId)
    || !validIso(operation.occurredAt)
  ) {
    if (operation.expectedRevision !== graph.revision) {
      throw new Error("EOG_REVISION_CONFLICT");
    }
    throw new Error("EOG_OPERATION_INVALID");
  }
  if (graph.state !== "DRAFT") {
    throw new Error("EOG_PUBLISHED_IMMUTABLE");
  }
}

function nextRevision(
  graph: EnterpriseOperatingGraphV010,
  occurredAt: string
): EnterpriseOperatingGraphV010 {
  graph.revision += 1;
  graph.updatedAt = occurredAt;
  return graph;
}

export function applyEnterpriseOperatingGraphOperationV010(
  current: EnterpriseOperatingGraphV010,
  operation: EnterpriseOperatingGraphOperationV010
): EnterpriseOperatingGraphV010 {
  const graph = clone(current);
  assertOperationHeader(graph, operation);

  if (operation.type === "NODE_BIND") {
    const node = clone(operation.node);
    if (
      !nonEmpty(node.nodeId)
      || !nonEmpty(node.semanticRef.refId)
      || !nodeRefMatchesKind(node)
    ) {
      throw new Error("EOG_NODE_INVALID");
    }
    if (graph.nodes.some(item => item.nodeId === node.nodeId)) {
      throw new Error("EOG_NODE_ID_DUPLICATE");
    }
    const refKey = [
      node.semanticRef.authority,
      node.semanticRef.kind,
      node.semanticRef.refId,
      node.semanticRef.versionRef ?? ""
    ].join(":");
    if (graph.nodes.some(item => [
      item.semanticRef.authority,
      item.semanticRef.kind,
      item.semanticRef.refId,
      item.semanticRef.versionRef ?? ""
    ].join(":") === refKey)) {
      throw new Error("EOG_SEMANTIC_REF_DUPLICATE");
    }
    graph.nodes.push(node);
  } else if (operation.type === "NODE_REMOVE") {
    if (!graph.nodes.some(node => node.nodeId === operation.nodeId)) {
      throw new Error("EOG_NODE_NOT_FOUND");
    }
    graph.nodes = graph.nodes.filter(node => node.nodeId !== operation.nodeId);
    graph.guidanceRelations = graph.guidanceRelations.filter(relation =>
      relation.applicationNodeId !== operation.nodeId
      && relation.ledgerNodeId !== operation.nodeId
    );
    graph.enterpriseRelations = graph.enterpriseRelations.filter(relation =>
      relation.applicationNodeId !== operation.nodeId
      && relation.ledgerNodeId !== operation.nodeId
    );
  } else if (operation.type === "GUIDANCE_RELATION_PUT") {
    const relation: EogApplicationLedgerGuidanceRelationV010 =
      clone(operation.relation);
    if (
      !nonEmpty(relation.relationId)
      || !nonEmpty(relation.source.sourceRef)
      || relation.kind !== "APPLICATION_LEDGER"
    ) {
      throw new Error("EOG_GUIDANCE_RELATION_INVALID");
    }
    assertApplicationLedgerEndpoints(
      graph,
      relation.applicationNodeId,
      relation.ledgerNodeId
    );
    if (graph.guidanceRelations.some(item => item.relationId === relation.relationId)) {
      throw new Error("EOG_GUIDANCE_RELATION_ID_DUPLICATE");
    }
    if (duplicatePair(
      graph.guidanceRelations,
      relation.applicationNodeId,
      relation.ledgerNodeId
    )) {
      throw new Error("EOG_GUIDANCE_RELATION_DUPLICATE");
    }
    graph.guidanceRelations.push(relation);
  } else if (operation.type === "GUIDANCE_RELATION_REMOVE") {
    if (!graph.guidanceRelations.some(
      relation => relation.relationId === operation.relationId
    )) {
      throw new Error("EOG_GUIDANCE_RELATION_NOT_FOUND");
    }
    if (graph.enterpriseRelations.some(
      relation =>
        relation.confirmedFromGuidanceRelationId === operation.relationId
    )) {
      throw new Error("EOG_GUIDANCE_RELATION_REFERENCED_BY_ENTERPRISE");
    }
    graph.guidanceRelations = graph.guidanceRelations.filter(
      relation => relation.relationId !== operation.relationId
    );
  } else if (operation.type === "ENTERPRISE_RELATION_CONFIRM") {
    if (
      !nonEmpty(operation.enterpriseRelationId)
      || graph.enterpriseRelations.some(
        relation => relation.relationId === operation.enterpriseRelationId
      )
    ) {
      throw new Error("EOG_ENTERPRISE_RELATION_ID_DUPLICATE");
    }
    assertApplicationLedgerEndpoints(
      graph,
      operation.applicationNodeId,
      operation.ledgerNodeId
    );
    if (duplicatePair(
      graph.enterpriseRelations,
      operation.applicationNodeId,
      operation.ledgerNodeId
    )) {
      throw new Error("EOG_ENTERPRISE_RELATION_DUPLICATE");
    }

    if (operation.guidanceRelationId) {
      const guidance = graph.guidanceRelations.find(
        relation => relation.relationId === operation.guidanceRelationId
      );
      if (!guidance) throw new Error("EOG_GUIDANCE_RELATION_NOT_FOUND");
      if (
        guidance.applicationNodeId !== operation.applicationNodeId
        || guidance.ledgerNodeId !== operation.ledgerNodeId
      ) {
        throw new Error("EOG_CONFIRMED_GUIDANCE_MISMATCH");
      }
    }

    const relation: EogApplicationLedgerEnterpriseRelationV010 = {
      relationId: operation.enterpriseRelationId,
      kind: "APPLICATION_LEDGER",
      applicationNodeId: operation.applicationNodeId,
      ledgerNodeId: operation.ledgerNodeId,
      confirmedBySubjectId: operation.actor.subjectId,
      confirmedAt: operation.occurredAt,
      ...(operation.guidanceRelationId
        ? { confirmedFromGuidanceRelationId: operation.guidanceRelationId }
        : {})
    };
    graph.enterpriseRelations.push(relation);
  } else if (operation.type === "ENTERPRISE_RELATION_REMOVE") {
    if (!graph.enterpriseRelations.some(
      relation => relation.relationId === operation.relationId
    )) {
      throw new Error("EOG_ENTERPRISE_RELATION_NOT_FOUND");
    }
    graph.enterpriseRelations = graph.enterpriseRelations.filter(
      relation => relation.relationId !== operation.relationId
    );
  } else if (operation.type === "PUBLISH") {
    const validation = validateEnterpriseOperatingGraphV010(graph);
    if (!validation.publishable) {
      throw new Error(
        "EOG_NOT_PUBLISHABLE:" + validation.issues.map(item => item.code).join(",")
      );
    }
    graph.state = "PUBLISHED";
    graph.publishedAt = operation.occurredAt;
  }

  return nextRevision(graph, operation.occurredAt);
}
