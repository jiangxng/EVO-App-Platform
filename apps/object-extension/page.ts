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
  const returnRoute=dataImportMappingRouteV010(job.importJobId);
  // Never silently switch a link for 开户银行 to another Excel column.
  if (input.sourceColumn && !remaining.includes(input.sourceColumn)) {
    throw new Error("OBJECT_EXTENSION_SOURCE_NOT_UNMAPPED");
  }
  const selected = input.sourceColumn ?? remaining[0] ?? "";
  const examples: string[] = [];
  const seen = new Set<string>();
  for (const row of job.source.rows) {
    const value = row[selected];
    if (value === null || value === undefined || value === "") continue;
    const text = String(value);
    if (seen.has(text)) continue;
    seen.add(text);
    examples.push(text.length > 48 ? text.slice(0, 48) + "…" : text);
    if (examples.length === 3) break;
  }
  return {
    contractVersion:"0.1.1" as const,
    kind:"form" as const,
    id:"evo-object-extension.import",
    title:zh?"创建企业扩展字段":"Create enterprise extension field",
    description:zh
      ? "当前来源列及字段名称已带入。请确认业务含义和类型；保存后自动映射原列，不会提交供应商数据。"
      : "Source column and label are prefilled. Confirm the business meaning and type; saving maps the column without importing records.",
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
        required:true,initialValue:selected,
        options:(input.sourceColumn ? [input.sourceColumn] : remaining)
          .map(x=>({value:x,label:x}))},
      {key:"sourceSample",label:zh?"本列 Excel 原始样本":"Original Excel samples",
        semanticType:"object-extension-original-source-examples",
        control:"text" as const,readOnly:true,required:false,
        initialValue:examples.length?examples.join(" · ")
          :zh?"本列暂无非空样本":"No nonempty source samples"},
      {key:"label",label:zh?"字段业务名称":"Field label",
        semanticType:"object-extension-label",control:"text" as const,required:true,
        initialValue:selected},
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
      id:"create-extension",label:zh?"保存字段并自动映射":"Save field and map this column",
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
