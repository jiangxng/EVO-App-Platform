import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import type {
  EogExpectedSopSnapshotV010,
  EogExpectedSopTransitionV010,
  EogExpectedSopV010
} from "../contracts/enterprise-operating-graph-sop.js";

export interface EogExpectedSopStoreV010 {
  create(sop: EogExpectedSopV010): EogExpectedSopV010;
  replace(sop: EogExpectedSopV010): EogExpectedSopV010;
  get(sopId: string): EogExpectedSopV010 | undefined;
  listByGraph(input: {
    enterpriseId: string;
    graphId: string;
  }): EogExpectedSopV010[];
  snapshot(): EogExpectedSopSnapshotV010;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(code);
  }
  return value.trim();
}

function linearTransitions(
  sop: Pick<EogExpectedSopV010, "steps">
): EogExpectedSopTransitionV010[] {
  const result: EogExpectedSopTransitionV010[] = [];
  for (let index = 0; index + 1 < sop.steps.length; index += 1) {
    result.push({
      transitionId: "transition:" + (index + 1),
      fromApplicationNodeId: sop.steps[index]!.applicationNodeId,
      toApplicationNodeId: sop.steps[index + 1]!.applicationNodeId,
      kind: "EXPECTED"
    });
  }
  return result;
}

function normalize(
  sop: EogExpectedSopV010
): EogExpectedSopV010 {
  return {
    ...clone(sop),
    transitions: Array.isArray(sop.transitions)
      ? clone(sop.transitions)
      : linearTransitions(sop)
  };
}

function validate(raw: EogExpectedSopV010): EogExpectedSopV010 {
  const sop = normalize(raw);
  if (
    sop.contractVersion !== "0.1.0"
    || !Number.isInteger(sop.revision)
    || sop.revision < 0
    || !Array.isArray(sop.steps)
    || !Array.isArray(sop.transitions)
    || !Number.isFinite(Date.parse(sop.createdAt))
    || !Number.isFinite(Date.parse(sop.updatedAt))
  ) {
    throw new Error("EOG_EXPECTED_SOP_INVALID");
  }

  required(sop.sopId, "EOG_EXPECTED_SOP_INVALID");
  required(sop.enterpriseId, "EOG_EXPECTED_SOP_INVALID");
  required(sop.graphId, "EOG_EXPECTED_SOP_INVALID");
  required(sop.title, "EOG_EXPECTED_SOP_INVALID");

  const stepIds = new Set<string>();
  const nodes = new Set<string>();
  for (const step of sop.steps) {
    required(step.stepId, "EOG_EXPECTED_SOP_INVALID");
    required(step.applicationNodeId, "EOG_EXPECTED_SOP_INVALID");
    if (stepIds.has(step.stepId)) {
      throw new Error("EOG_EXPECTED_SOP_STEP_ID_DUPLICATE");
    }
    stepIds.add(step.stepId);
    if (nodes.has(step.applicationNodeId)) {
      throw new Error("EOG_EXPECTED_SOP_APPLICATION_DUPLICATE");
    }
    nodes.add(step.applicationNodeId);
  }

  const transitionIds = new Set<string>();
  const transitionPairs = new Set<string>();
  for (const transition of sop.transitions) {
    required(transition.transitionId, "EOG_EXPECTED_SOP_INVALID");
    const from = required(
      transition.fromApplicationNodeId,
      "EOG_EXPECTED_SOP_INVALID"
    );
    const to = required(
      transition.toApplicationNodeId,
      "EOG_EXPECTED_SOP_INVALID"
    );
    if (!nodes.has(from) || !nodes.has(to)) {
      throw new Error("EOG_EXPECTED_SOP_TRANSITION_NODE_REQUIRED");
    }
    if (from === to) {
      throw new Error("EOG_EXPECTED_SOP_LOOP_NOT_SUPPORTED");
    }
    if (
      transition.kind !== "EXPECTED"
      && transition.kind !== "ALLOWED_ALTERNATIVE"
      && transition.kind !== "ALLOWED_EXCEPTION"
    ) {
      throw new Error("EOG_EXPECTED_SOP_TRANSITION_KIND_INVALID");
    }
    if (transitionIds.has(transition.transitionId)) {
      throw new Error("EOG_EXPECTED_SOP_TRANSITION_ID_DUPLICATE");
    }
    transitionIds.add(transition.transitionId);
    const pair = from + "->" + to;
    if (transitionPairs.has(pair)) {
      throw new Error("EOG_EXPECTED_SOP_TRANSITION_PAIR_DUPLICATE");
    }
    transitionPairs.add(pair);
    if (
      transition.conditionRef !== undefined
      && !transition.conditionRef.trim()
    ) {
      throw new Error("EOG_EXPECTED_SOP_CONDITION_REF_INVALID");
    }
    if (transition.kind === "ALLOWED_EXCEPTION") {
      required(
        transition.exceptionCode ?? "",
        "EOG_EXPECTED_SOP_EXCEPTION_CODE_REQUIRED"
      );
    } else if (
      transition.exceptionCode !== undefined
      && !transition.exceptionCode.trim()
    ) {
      throw new Error("EOG_EXPECTED_SOP_EXCEPTION_CODE_INVALID");
    }
  }

  if (sop.state === "PUBLISHED") {
    if (
      sop.steps.length < 2
      || sop.transitions.length < 1
      || !sop.publishedAt
      || !Number.isFinite(Date.parse(sop.publishedAt))
      || !sop.publishedBySubjectId?.trim()
    ) {
      throw new Error("EOG_EXPECTED_SOP_PUBLISHED_INVALID");
    }
  }

  return sop;
}

function createStore(
  read: () => EogExpectedSopSnapshotV010,
  write: (snapshot: EogExpectedSopSnapshotV010) => void
): EogExpectedSopStoreV010 {
  return {
    create(raw) {
      const sop = validate(raw);
      const current = read();
      if (current.sops.some(item => item.sopId === sop.sopId)) {
        throw new Error("EOG_EXPECTED_SOP_ALREADY_EXISTS");
      }
      const next: EogExpectedSopSnapshotV010 = {
        contractVersion: "0.1.0",
        sops: [...current.sops, clone(sop)]
      };
      write(next);
      return clone(sop);
    },
    replace(raw) {
      const sop = validate(raw);
      const current = read();
      const old = current.sops.find(item => item.sopId === sop.sopId);
      if (!old) throw new Error("EOG_EXPECTED_SOP_NOT_FOUND");
      if (
        old.enterpriseId !== sop.enterpriseId
        || old.graphId !== sop.graphId
        || old.createdAt !== sop.createdAt
      ) {
        throw new Error("EOG_EXPECTED_SOP_IDENTITY_IMMUTABLE");
      }
      if (sop.revision !== old.revision + 1) {
        throw new Error("EOG_EXPECTED_SOP_REVISION_INVALID");
      }
      const next: EogExpectedSopSnapshotV010 = {
        contractVersion: "0.1.0",
        sops: current.sops.map(item =>
          item.sopId === sop.sopId ? clone(sop) : item
        )
      };
      write(next);
      return clone(sop);
    },
    get(sopId) {
      const item = read().sops.find(sop => sop.sopId === sopId);
      return item ? clone(item) : undefined;
    },
    listByGraph(input) {
      return read().sops
        .filter(sop =>
          sop.enterpriseId === input.enterpriseId
          && sop.graphId === input.graphId
        )
        .sort((a, b) => a.sopId.localeCompare(b.sopId))
        .map(clone);
    },
    snapshot() {
      return clone(read());
    }
  };
}

function validSnapshot(
  snapshot: EogExpectedSopSnapshotV010
): EogExpectedSopSnapshotV010 {
  if (
    snapshot.contractVersion !== "0.1.0"
    || !Array.isArray(snapshot.sops)
  ) {
    throw new Error("EOG_EXPECTED_SOP_SNAPSHOT_INVALID");
  }
  const ids = new Set<string>();
  const sops = snapshot.sops.map(raw => {
    const sop = validate(raw);
    if (ids.has(sop.sopId)) {
      throw new Error("EOG_EXPECTED_SOP_ID_DUPLICATE");
    }
    ids.add(sop.sopId);
    return sop;
  });
  return {
    contractVersion: "0.1.0",
    sops
  };
}

export function createMemoryEogExpectedSopStoreV010(
  seed: EogExpectedSopSnapshotV010 = {
    contractVersion: "0.1.0",
    sops: []
  }
): EogExpectedSopStoreV010 {
  let snapshot = clone(validSnapshot(seed));
  return createStore(
    () => clone(snapshot),
    next => {
      snapshot = clone(validSnapshot(next));
    }
  );
}

export function createFileEogExpectedSopStoreV010(
  path: string
): EogExpectedSopStoreV010 {
  const read = () =>
    existsSync(path)
      ? clone(
          validSnapshot(
            JSON.parse(
              readFileSync(path, "utf8")
            ) as EogExpectedSopSnapshotV010
          )
        )
      : {
          contractVersion: "0.1.0" as const,
          sops: []
        };

  const write = (snapshot: EogExpectedSopSnapshotV010) => {
    const valid = validSnapshot(snapshot);
    mkdirSync(dirname(path), { recursive: true });
    const temp = path + ".tmp";
    writeFileSync(
      temp,
      JSON.stringify(valid, null, 2) + "\n",
      "utf8"
    );
    renameSync(temp, path);
  };

  return createStore(read, write);
}
