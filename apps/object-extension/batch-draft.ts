import type {JsonValue} from "../../actions/contracts.js";
import type {
  DataImportBatchReviewDraftV010, DataImportJobV010
} from "../data-import/types.js";
import {
  batchUnmappedColumnsV010, batchReviewSourceRevisionV010, BEX_BATCH_CREATE,
  BEX_BATCH_IGNORE, BEX_BATCH_REVIEW,
  type BexImportTargetField
} from "./batch-page.js";

const TYPE_VALUES=["STRING","NUMBER","BOOLEAN","DATE"] as const;

export function createObjectExtensionBatchReviewDraftV010(input:{
  job:DataImportJobV010;
  actorSubjectId:string; recordedAt:string;
  values:Record<string,JsonValue>;
  importableTargets:BexImportTargetField[];
}):DataImportBatchReviewDraftV010 {
  const {job,values}=input;
  if (job.targetId!=="counterparty.subject" ||
    job.state==="COMMITTED" || job.state==="COMMITTED_WITH_ERRORS") {
    throw new Error("OBJECT_EXTENSION_BATCH_DRAFT_JOB_UNAVAILABLE");
  }
  // Never reinterpret choice_N from a stale page after a mapping edit.
  // A fresh page will supply the current source-column revision.
  if (values.batchMode!==batchReviewSourceRevisionV010(job)) {
    throw new Error("OBJECT_EXTENSION_BATCH_DRAFT_STALE_REVIEW");
  }
  const allowed=new Set(input.importableTargets.map(x=>x.fieldId));
  const reserved=new Set(job.mapping.map(x=>x.targetFieldId));
  const choices=new Set<string>();
  const columns=batchUnmappedColumnsV010(job).map((sourceColumn,index)=>{
    const value=values["choice_"+index];
    if (typeof value!=="string" || !value ||
      ![BEX_BATCH_CREATE,BEX_BATCH_IGNORE,BEX_BATCH_REVIEW].includes(value as
        typeof BEX_BATCH_CREATE|typeof BEX_BATCH_IGNORE|typeof BEX_BATCH_REVIEW)
        && (!allowed.has(value) || reserved.has(value) || choices.has(value))) {
      throw new Error("OBJECT_EXTENSION_BATCH_DRAFT_CHOICE_INVALID");
    }
    if (allowed.has(value)) choices.add(value);
    const label=values["label_"+index], type=values["type_"+index];
    if (typeof label!=="string" || !label.trim() || label.length>80 ||
      typeof type!=="string" || !TYPE_VALUES.includes(type as typeof TYPE_VALUES[number])) {
      throw new Error("OBJECT_EXTENSION_BATCH_DRAFT_FIELD_INVALID");
    }
    return {
      sourceColumn,choice:value,label:label.trim(),
      valueType:type as typeof TYPE_VALUES[number]
    };
  });
  const subjectSource=job.mapping.find(x=>
    x.targetFieldId==="subjectType" && x.sourceColumn);
  const requested=values.batchSubjectType;
  if (requested!==undefined && (
    typeof requested!=="string" ||
    !["__KEEP__","ORGANIZATION","PERSON"].includes(requested)
  )) throw new Error("OBJECT_EXTENSION_BATCH_DRAFT_SUBJECT_INVALID");
  if (subjectSource && requested!==undefined) {
    throw new Error("OBJECT_EXTENSION_BATCH_DRAFT_SUBJECT_SOURCE_CONFLICT");
  }
  return {
    actorSubjectId:input.actorSubjectId,
    recordedAt:input.recordedAt,columns,
    ...(!subjectSource && typeof requested==="string"
      ? {batchSubjectType:requested as "__KEEP__"|"ORGANIZATION"|"PERSON"}
      : {})
  };
}
