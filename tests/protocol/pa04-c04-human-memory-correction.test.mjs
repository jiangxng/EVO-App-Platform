import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryContextMemoryStoreV010
} from "../../dist/manager/context-memory-store.js";
import {
  createHostContextMemoryReaderV010,
  createHostContextMemoryWriterV010
} from "../../dist/providers/context-memory/runtime.js";
import {
  createMemoryContextMemoryProposalStoreV010
} from "../../dist/manager/context-memory-proposal-store.js";
import {
  createContextMemoryProposalServiceV010
} from "../../dist/manager/context-memory-proposal-service.js";

const human = { contractVersion:"0.1.0", subjectId:"user:pa04-c04",
  actorType:"HUMAN", identityProviderId:"isolated" };
const agent = { ...human, subjectId:"agent:pa04-c04", actorType:"AI" };
const automation = { ...human, subjectId:"job:pa04-c04", actorType:"AUTOMATION" };
const serviceActor = { ...human, subjectId:"service:pa04-c04", actorType:"SERVICE" };
const personal = { contractVersion:"0.1.0", kind:"PERSONAL",
  contextId:"personal:pa04-c04" };
const enterprise = { contractVersion:"0.1.0", kind:"ENTERPRISE",
  contextId:"enterprise:pa04-c04", enterpriseId:"company:pa04-c04" };
const timestamp = "2026-10-15T03:00:00.000Z";
function harness() {
  const store=createMemoryContextMemoryStoreV010();
  const reader=createHostContextMemoryReaderV010(store);
  const writer=createHostContextMemoryWriterV010(store);
  const proposals=createMemoryContextMemoryProposalStoreV010();
  let counter=0;
  const memoryProposals=createContextMemoryProposalServiceV010({
    store:proposals,resolveReader:()=>reader,resolveWriter:()=>writer,
    now:()=>new Date(timestamp),id:()=>String(++counter)
  });
  const exact = (context,memoryIds)=>reader.read({
    contractVersion:"0.1.0",context,memoryIds,limit:100
  });
  const search = (context)=>reader.read({
    contractVersion:"0.1.0",context,limit:100
  });
  const seed = async (context, memoryId, summary)=>{
    return writer.write({contractVersion:"0.1.0",item:{
      contractVersion:"0.1.0",memoryId,context,kind:"FACT",summary,
      provenance:{contractVersion:"0.1.0",origin:"DIRECT",
        sourceContext:context,evidenceRefs:[]},
      attribution:{contractVersion:"0.1.0",
        recordedBySubjectId:human.subjectId,
        recordedByActorType:"HUMAN",recordedAt:timestamp}
    }});
  };
  return {store,reader,writer,proposals,memoryProposals,exact,search,seed};
}

test("PA-04 C04: incorrect Agent inference stays a pending proposal until Human review",async()=>{
  const h=harness();
  await h.seed(personal,"memory:wrong","Supplier limit is 100");
  const draft=await h.memoryProposals.create({
    principal:agent,context:personal,authoredBy:"PERSONAL_AGENT",
    draft:{kind:"FACT",summary:"Supplier limit is 500",
      supersedesMemoryId:"memory:wrong",
      potentialContradictionMemoryIds:["memory:wrong"]}
  });
  assert.equal(draft.state,"PENDING");
  assert.ok(draft.revisions.at(-1).reviewSignals.some(
    s=>s.kind==="POTENTIAL_CONTRADICTION"));
  assert.equal((await h.search(personal)).items.length,1,
    "no auto-promotion of a machine guess");
  assert.equal(h.store.snapshot().items.length,1);

  for(const actor of [agent,automation,serviceActor]){
    await assert.rejects(h.memoryProposals.accept({
      proposalId:draft.proposalId,principal:actor
    }),{message:"CONTEXT_MEMORY_PROPOSAL_HUMAN_REQUIRED"});
    await assert.rejects(h.memoryProposals.edit({
      proposalId:draft.proposalId,principal:actor,
      summary:"Machine tries to revise Human Memory"
    }),{message:"CONTEXT_MEMORY_PROPOSAL_HUMAN_REQUIRED"});
    assert.throws(()=>h.memoryProposals.reject({
      proposalId:draft.proposalId,principal:actor
    }),{message:"CONTEXT_MEMORY_PROPOSAL_HUMAN_REQUIRED"});
  }
  assert.equal(h.memoryProposals.get(draft.proposalId).state,"PENDING");
  assert.equal(h.memoryProposals.get(draft.proposalId).revisions.length,1);
  assert.equal(h.store.snapshot().items.length,1);
});

test("PA-04 C04: Human correction supersedes wrong Memory without mutating its audit record",async()=>{
  const h=harness();
  const original=await h.seed(personal,"memory:wrong","Supplier limit is 100");
  const proposal=await h.memoryProposals.create({
    principal:agent,context:personal,authoredBy:"PERSONAL_AGENT",
    draft:{kind:"CLAIM",summary:"Maybe supplier limit is 500",
      supersedesMemoryId:"memory:wrong",
      potentialContradictionMemoryIds:["memory:wrong"]}
  });
  const edited=await h.memoryProposals.edit({
    proposalId:proposal.proposalId,principal:human,
    kind:"FACT",summary:"Supplier limit is 150"
  });
  assert.equal(edited.revisions.length,2);
  assert.equal(edited.revisions.at(-1).authoredBy,"HUMAN");
  const accepted=await h.memoryProposals.accept({
    proposalId:proposal.proposalId,principal:human
  });
  assert.equal(accepted.proposal.state,"ACCEPTED");
  assert.equal(accepted.memory.kind,"FACT");
  assert.equal(accepted.memory.summary,"Supplier limit is 150");
  assert.equal(accepted.memory.supersedesMemoryId,"memory:wrong");
  assert.equal(accepted.memory.attribution.recordedByActorType,"HUMAN");
  assert.equal(accepted.memory.attribution.recordedBySubjectId,human.subjectId);
  const visible=await h.search(personal);
  assert.deepEqual(visible.items.map(x=>x.memoryId),[accepted.memory.memoryId]);
  const historical=await h.exact(personal,["memory:wrong"]);
  assert.deepEqual(historical.items,[original],
    "wrong historical fact remains accessible only by exact audit");
  assert.equal(h.store.snapshot().items.length,2);
  const repeated=await h.memoryProposals.accept({
    proposalId:proposal.proposalId,principal:human
  });
  assert.equal(repeated.memory.memoryId,accepted.memory.memoryId);
  assert.equal(h.store.snapshot().items.length,2,
    "Human acceptance is idempotent");
  assert.deepEqual(proposal.revisions[0].summary,"Maybe supplier limit is 500",
    "original machine draft is immutable");
});

test("PA-04 C04: Human rejects inaccurate claim; no durable memory created",async()=>{
  const h=harness();
  const proposed=await h.memoryProposals.create({
    principal:agent,context:personal,
    draft:{kind:"CLAIM",summary:"Agent inference cannot be verified"}
  });
  const rejected=h.memoryProposals.reject({
    proposalId:proposed.proposalId,principal:human,
    reason:"Unsupported inference, not a business fact"
  });
  assert.equal(rejected.state,"REJECTED");
  assert.equal(rejected.decision.decidedBySubjectId,human.subjectId);
  assert.equal(h.store.snapshot().items.length,0);
  await assert.rejects(h.memoryProposals.accept({
    proposalId:proposed.proposalId,principal:human
  }),/CONTEXT_MEMORY_PROPOSAL_NOT_PENDING/);
});

test("PA-04 C04: AI cannot turn an enterprise-scoped proposal into a FACT, even by direct service call",async()=>{
  const h=harness();
  const proposed=await h.memoryProposals.create({
    principal:agent,context:enterprise,authoredBy:"PERSONAL_AGENT",
    draft:{kind:"FACT",summary:"Unverified enterprise revenue estimate"}
  });
  await assert.rejects(h.memoryProposals.accept({
    proposalId:proposed.proposalId,principal:agent
  }),{message:"CONTEXT_MEMORY_PROPOSAL_HUMAN_REQUIRED"});
  assert.equal((await h.search(enterprise)).items.length,0);
  assert.equal(h.memoryProposals.get(proposed.proposalId).state,"PENDING");
});

test("PA-04 C04: correction cannot supersede another Context's Memory",async()=>{
  const h=harness();
  await h.seed(enterprise,"memory:enterprise-authoritative","Enterprise order limit");
  await assert.rejects(h.memoryProposals.create({
    principal:agent,context:personal,
    draft:{kind:"FACT",summary:"Unauthorized cross-Context correction",
      supersedesMemoryId:"memory:enterprise-authoritative"}
  }),/CONTEXT_MEMORY_SUPERSEDES_NOT_FOUND/);
  assert.equal(h.proposals.snapshot().proposals.length,0);
});
