import {createHash} from "node:crypto";
import type {EnterpriseResourceRepositoryV010} from "../../contracts/enterprise-resource.js";
import type {ObjectExtensionDefinitionV010} from "../../contracts/foundation-object/extension.js";
import {assertObjectExtensionDefinitionV010} from "../../contracts/foundation-object/extension.js";
import type {GovernedAgentBusinessOwnerV040} from
  "../../agents/enterprise-agent/pa02b-governed-owner-write-handoff.js";
import type {AgentOwnerVerifierV030} from
  "../../agents/enterprise-agent/pa02b-owner-reconciliation.js";
import {createObjectExtensionRepositoryV010} from "./repository.js";
import {OBJECT_EXTENSION_PACKAGE_ID,OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010}
  from "./constants.js";

/**
 * PREVIEW ONLY. Enterprise Resource snapshots have a synchronous in-process
 * transaction but NO cross-process compare-and-swap / distributed lock.
 * This adapter intentionally cannot be registered for production multi-worker
 * dispatch. It demonstrates a real domain Owner and immutable evidence using
 * the existing object-extension repository, not an invented sandbox table.
 */
const namespace="evo.object-extension";
const receiptsCollection="agent-owner-receipts-preview";
const receiptType="agent.owner-evidence.preview";
const schema="evo.object-extension.agent-owner-evidence-preview/0.1.0";
type Evidence = {
  contractVersion:"0.1.0";
  runId:string;effectId:string;receiptId:string;idempotencyKey:string;
  inputDigest:string;ownerPackageId:string;recordId:string;
  principalSubjectId:string;enterpriseId:string;
  definition:ObjectExtensionDefinitionV010;
  recordedAt:string;
};
const hash=(input:string)=>createHash("sha256").update(input).digest("hex");
function canonical(value:unknown):unknown {
  if(Array.isArray(value))return value.map(canonical);
  if(value!==null&&typeof value==="object")return Object.fromEntries(
    Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b))
      .map(([k,v])=>[k,canonical(v)]));
  return value;
}
const json=(value:unknown)=>JSON.stringify(canonical(value));
function evidenceAddress(contextId:string,idempotencyKey:string){
  return {contextId,namespace,collectionId:receiptsCollection,
    resourceType:receiptType,resourceId:hash(idempotencyKey)};
}
function same(a:unknown,b:unknown){return json(a)===json(b);}
function validScope(scope:{contextKind:string;contextId:string;enterpriseId?:string}){
  if(scope.contextKind!=="ENTERPRISE"||!scope.enterpriseId?.trim()||
     !scope.contextId?.trim())throw Error("PA02_EXTENSION_PREVIEW_ENTERPRISE_REQUIRED");
}
function definitionOf(argumentsValue:Record<string,unknown>|undefined) {
  if(!argumentsValue||Object.keys(argumentsValue).length!==1||
     !argumentsValue.definition||typeof argumentsValue.definition!=="object"||
     Array.isArray(argumentsValue.definition))
    throw Error("PA02_EXTENSION_PREVIEW_ARGUMENTS_INVALID");
  return assertObjectExtensionDefinitionV010(
    structuredClone(argumentsValue.definition) as ObjectExtensionDefinitionV010
  );
}
function readEvidence(resources:EnterpriseResourceRepositoryV010,scope:{
  contextId:string
},idempotencyKey:string):Evidence|undefined{
  const item=resources.get(evidenceAddress(scope.contextId,idempotencyKey));
  if(!item)return undefined;
  if(item.lifecycleState!=="ACTIVE"||!item.payload||
     typeof item.payload!=="object"||Array.isArray(item.payload))
    throw Error("PA02_EXTENSION_PREVIEW_EVIDENCE_CORRUPT");
  const e=item.payload as unknown as Evidence;
  if(e.contractVersion!=="0.1.0"||!e.effectId||!e.inputDigest)
    throw Error("PA02_EXTENSION_PREVIEW_EVIDENCE_CORRUPT");
  return e;
}

export function createObjectExtensionSingleProcessPreviewOwnerV010(input:{
  resources:EnterpriseResourceRepositoryV010;
  /** Explicitly acknowledge absence of multi-process storage guarantees. */
  singleProcessDevelopmentOnly:true;
  now?:()=>Date;
}):{owner:GovernedAgentBusinessOwnerV040;verifier:AgentOwnerVerifierV030} {
  if(input.singleProcessDevelopmentOnly!==true ||
     typeof input.resources?.transaction!=="function")
    throw Error("PA02_EXTENSION_PREVIEW_ATOMIC_LOCAL_TRANSACTION_REQUIRED");
  const resources=input.resources;
  const repo=createObjectExtensionRepositoryV010(resources);
  const now=input.now??(()=>new Date());
  const owner:GovernedAgentBusinessOwnerV040={
    ownerPackageId:OBJECT_EXTENSION_PACKAGE_ID,
    async invoke(r){
      validScope(r.scope);
      if(r.toolId!==OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010)
        throw Error("PA02_EXTENSION_PREVIEW_OPERATION_DENIED");
      const definition=definitionOf(r.arguments);
      if(hash(json(r.arguments))!==r.inputDigest)
        throw Error("PA02_EXTENSION_PREVIEW_DIGEST_MISMATCH");
      const contextId=r.scope.contextId;
      // Synchronous transaction is atomic only for a SINGLE PROCESS provider.
      // Both the real Object Extension and immutable Owner evidence are written
      // to the same resource snapshot; a crash cannot leave one without other.
      resources.transaction!(()=>{
        const prior=readEvidence(resources,r.scope,r.idempotencyKey);
        if(prior) {
          if(prior.runId!==r.runId||prior.effectId!==r.effectId||
             prior.receiptId!==r.receiptId||prior.inputDigest!==r.inputDigest||
             !same(prior.definition,definition))
            throw Error("PA02_EXTENSION_PREVIEW_IDEMPOTENCY_CONFLICT");
          // Same idempotency key must never call the domain repository twice.
          return;
        }
        if(repo.get(contextId,definition.extensionId))
          throw Error("PA02_EXTENSION_PREVIEW_CREATE_ONLY");
        const saved=repo.save({contextId,definition,
          actorSubjectId:r.scope.principalSubjectId,
          recordedAt:now().toISOString()});
        const evidence:Evidence={
          contractVersion:"0.1.0",runId:r.runId,effectId:r.effectId,
          receiptId:r.receiptId,idempotencyKey:r.idempotencyKey,
          inputDigest:r.inputDigest,ownerPackageId:OBJECT_EXTENSION_PACKAGE_ID,
          principalSubjectId:r.scope.principalSubjectId,
          enterpriseId:r.scope.enterpriseId!,
          recordId:saved.extensionId,definition:saved,
          recordedAt:now().toISOString()
        };
        resources.put({...evidenceAddress(contextId,r.idempotencyKey),
          schemaRef:schema,ownerPackageId:OBJECT_EXTENSION_PACKAGE_ID,
          storageKind:"DOCUMENT",payload:JSON.parse(JSON.stringify(evidence)),
          actorSubjectId:r.scope.principalSubjectId,recordedAt:evidence.recordedAt});
      });
    }
  };
  const verifier:AgentOwnerVerifierV030={
    async verify(r){
      validScope(r.scope);
      // Owner verification reads independently persisted domain state and
      // immutable evidence. A missing / changed record is UNKNOWN, never a
      // forged SUCCEEDED attestation from the Agent's optimistic response.
      const candidates=resources.list({contextId:r.scope.contextId,
        namespace,collectionId:receiptsCollection,resourceType:receiptType,
        lifecycleState:"ACTIVE"});
      for(const item of candidates){
        if(!item.payload||typeof item.payload!=="object"||
           Array.isArray(item.payload))continue;
        const e=item.payload as unknown as Evidence;
        if(e.effectId!==r.effectId||e.runId!==r.runId||
           e.receiptId!==r.receiptId||
           e.ownerPackageId!==r.ownerPackageId||
           e.inputDigest!==r.inputDigest||
           e.principalSubjectId!==r.scope.principalSubjectId||
           e.enterpriseId!==r.scope.enterpriseId||
           r.ownerPackageId!==OBJECT_EXTENSION_PACKAGE_ID)
          continue;
        if(item.resourceId!==hash(e.idempotencyKey))continue;
        const business=repo.get(r.scope.contextId,e.recordId);
        if(!business||!same(business,e.definition))return {outcome:"UNRESOLVED"};
        return {
          outcome:"SUCCEEDED",
          evidenceRef:"object-extension:preview:"+item.resourceId,
          evidenceDigest:hash(json(e)),
          terminal:{
            receiptId:r.receiptId,status:"SUCCEEDED",
            completedAt:e.recordedAt,
            resultDigest:hash(json(e.definition)),
            resultEntityRefs:["object-extension:"+e.recordId],
            resultSummary:"Object Extension created and independently verified"
          }
        };
      }
      return {outcome:"UNRESOLVED"};
    }
  };
  return {owner,verifier};
}
