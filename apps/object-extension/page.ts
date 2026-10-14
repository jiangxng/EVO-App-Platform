import type { DataImportJobV010 } from "../data-import/types.js";
import {
  DATA_IMPORT_DIRECTORY_ROUTE,
  dataImportMappingRouteV010
} from "../data-import/constants.js";
import { OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010 } from "./constants.js";

/** Enterprise-owned field definition, invoked explicitly from a preserved import job. */
export function createObjectExtensionImportPageV010(input: {
  job: DataImportJobV010;
  locale?: string;
  sourceColumn?: string;
}) {
  const {job}=input;
  const zh=input.locale?.startsWith("zh")??false;
  const used=new Set(job.mapping.filter(x=>x.sourceColumn).map(x=>x.sourceColumn));
  const remaining=job.source.headers.filter(x=>!used.has(x));
  const selected = input.sourceColumn && remaining.includes(input.sourceColumn)
    ? input.sourceColumn : undefined;
  // A column-specific action never silently falls back to a different Excel column.
  if (input.sourceColumn && !selected) throw new Error("OBJECT_EXTENSION_SOURCE_NOT_UNMAPPED");
  const returnRoute=dataImportMappingRouteV010(job.importJobId);
  return {
    contractVersion:"0.1.1" as const,
    kind:"form" as const,
    id:"evo-object-extension.import",
    title:zh?"创建企业扩展字段":"Create enterprise extension field",
    description:zh
      ? "已从当前来源列填写字段名称。确认业务含义和类型后保存，系统将自动映射回原列；不自动导入数据。系统日志、历史状态等保持不映射。"
      : "The source column and suggested name are prefilled. Confirm its meaning and type; saving maps this column without importing records.",
    contextNavigation:{items:[
      {id:"data-import",label:zh?"数据导入":"Data Import",route:DATA_IMPORT_DIRECTORY_ROUTE},
      {id:"mapping",label:zh?"字段映射":"Field mapping",route:returnRoute},
      {id:"extension",label:zh?"创建扩展字段":"Create extension field"}
    ]},
    purpose:"execute-command" as const,
    command:{code:OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010,inputVersion:"0.1.0"},
    fields:[
      {key:"importJobId",label:"Import Job",semanticType:"import-job-id",
        control:"select" as const,required:true,initialValue:job.importJobId,
        options:[{value:job.importJobId,label:job.importJobId}]},
      {key:"sourceColumn",label:zh?"未匹配来源列":"Unmapped source column",
        semanticType:"object-extension-source",control:"select" as const,
        required:true,initialValue:selected??remaining[0]??"",
        options:(selected?[selected]:remaining).map(x=>({value:x,label:x}))},
      {key:"label",label:zh?"字段业务名称":"Field label",
        semanticType:"object-extension-label",control:"text" as const,required:true,
        ...(selected?{initialValue:selected}:{})},
      {key:"valueType",label:zh?"数据类型":"Value type",
        semanticType:"object-extension-value-type",control:"select" as const,required:true,
        initialValue:"STRING",options:[
          {value:"STRING",label:zh?"文本":"Text"},
          {value:"NUMBER",label:zh?"数字":"Number"},
          {value:"BOOLEAN",label:zh?"是/否":"Yes/No"},
          {value:"DATE",label:zh?"日期":"Date"}
        ]}
    ],
    actions:[{
      id:"create-extension",label:zh?"保存字段并返回映射":"Save field and return to mapping",
      type:"submit" as const,command:OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010,
      requiresConfirmation:false
    }],
    metadata:{
      packageId:"evo-object-extension",
      featureId:"evo-object-extension.default",
      importJobId:job.importJobId,
      description:zh
        ? "创建字段不会导入数据或修改供应商。新字段仅属于当前企业。"
        : "Creating a field does not import data or change any supplier."
    }
  };
}
