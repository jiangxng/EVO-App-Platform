import type { PlatformCapabilityOperationContributionV010 } from
  "../../contracts/package.js";
import {DICTIONARY_EXPORT_PERMISSION_V010} from "./export-jobs.js";

/**
 * CV-04 STAGING DESCRIPTOR. Deliberately NOT registered in catalog/seed.ts
 * or manager/server.ts. The only consumer today is the isolated Manager +
 * ActionRouter regression. Future production admission requires separately
 * certified SQL roles/Host signing, retained audit and live Human+AI evidence.
 *
 * Export is a distinct authorization action; dictionary.read never grants it.
 */
export const DICTIONARY_EXPORT_CAPABILITY_V010 =
  "enterprise.business-dictionary.bounded-export" as const;

const COMMON={
  contractVersion:"0.1.0" as const,
  capability:DICTIONARY_EXPORT_CAPABILITY_V010,
  operationVersion:"0.1.0",
  dataScope:"ENTERPRISE" as const,
  authorization:{
    action:DICTIONARY_EXPORT_PERMISSION_V010,
    resource:{type:"business-dictionary.definition",idSource:"DATA_SCOPE" as const}
  },
  exposure:["HUMAN","PERSONAL_AGENT"] as ("HUMAN"|"PERSONAL_AGENT")[],
  outputSchema:{type:"object" as const},
  inputVersion:"0.1.0"
};

function operation(input:{
  operationId:string;
  title:string;
  description:string;
  effect:"READ"|"WRITE";
  inputSchema:Record<string,unknown>;
}):PlatformCapabilityOperationContributionV010 {
  return {
    kind:"platform.capability-operation",
    operation:{
      contractVersion:COMMON.contractVersion,
      operationId:input.operationId,
      capability:COMMON.capability,
      operationVersion:COMMON.operationVersion,
      title:input.title,description:input.description,effect:input.effect,
      dataScope:COMMON.dataScope,
      authorization:COMMON.authorization,
      inputSchema:input.inputSchema,
      outputSchema:COMMON.outputSchema,
      binding:{
        type:"ACTION_HOST",
        commandCode:input.operationId,
        inputVersion:COMMON.inputVersion
      },
      exposure:[...COMMON.exposure],
      ...(input.effect==="WRITE"
        ?{writeSafety:{idempotency:"HOST_REQUIRED" as const,
          receipt:"HOST_REQUIRED" as const}}:{})
    }
  };
}

export function createStagedDictionaryExportCapabilityContributionsV010():
  PlatformCapabilityOperationContributionV010[] {
  const boundedQuery={
    type:"object",additionalProperties:false,properties:{
      view:{type:"string",enum:["all","draft","published"]},
      search:{type:"string",maxLength:200},
      sort:{type:"string",enum:["dictionaryId","displayName","state","version"]},
      direction:{type:"string",enum:["asc","desc"]}
    }
  };
  return [
    operation({
      operationId:"dictionary.collection.export.job.request",
      title:"Queue bounded Dictionary export",
      description:"Requires independent dictionary.export grant, durable audit and Host WRITE safety.",
      effect:"WRITE",
      inputSchema:{
        type:"object",additionalProperties:false,
        required:["idempotencyKey","query","fieldIds"],
        properties:{
          idempotencyKey:{type:"string",minLength:8,maxLength:80},
          query:boundedQuery,
          fieldIds:{type:"array",minItems:1,maxItems:5,
            items:{type:"string",enum:[
              "dictionaryId","displayName","state","version","optionCount"
            ]}}
        }
      }
    }),
    operation({
      operationId:"dictionary.collection.export.job.status",
      title:"Read bounded Dictionary export status",
      description:"Requires fresh dictionary.export grant and original task scope.",
      effect:"READ",
      inputSchema:{type:"object",additionalProperties:false,
        required:["jobId"],properties:{jobId:{type:"string",pattern:"^exj-[a-f0-9]{48}$"}}}
    }),
    operation({
      operationId:"dictionary.collection.export.job.download",
      title:"Download bounded Dictionary export",
      description:"Requires fresh dictionary.export grant, original task actor and download audit.",
      effect:"READ",
      inputSchema:{type:"object",additionalProperties:false,
        required:["jobId"],properties:{jobId:{type:"string",pattern:"^exj-[a-f0-9]{48}$"}}}
    })
  ];
}
