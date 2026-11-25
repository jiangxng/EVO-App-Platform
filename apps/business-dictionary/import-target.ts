import type {
  EnterpriseResourceRepositoryV010
} from "../../contracts/enterprise-resource.js";
import type {
  FoundationObjectImportCellV010,
  FoundationObjectImportPreparedRowV010,
  FoundationObjectImportTargetV010,
  FoundationObjectImportValidationV010
} from "../../contracts/foundation-object/import.js";
import type {
  EffectiveFoundationObjectFieldV010,
  EffectiveObjectSchemaV010
} from "../../contracts/foundation-object/schema.js";
import {
  foundationObjectImportCellBlankV010,
  normalizeFoundationObjectImportCellV010
} from "../../foundation/import-values.js";
import type { BusinessDictionaryOptionV010 } from "../../contracts/reference-data/dictionary.js";
import {
  BUSINESS_DICTIONARY_DIRECTORY_ROUTE_V010 as DIRECTORY
} from "./constants.js";
import {
  parseBusinessDictionaryDirectoryRouteV010
} from "./directory-query.js";
import type { BusinessDictionaryRepositoryV010 } from "./repository.js";

export const BUSINESS_DICTIONARY_IMPORT_TARGET_V010 = "business-dictionary.option" as const;
export const BUSINESS_DICTIONARY_IMPORT_SCHEMA_V010 =
  "evo.business-dictionary.option-import/0.1.0" as const;

function field(
  fieldId: string,
  english: string,
  chinese: string,
  order: number,
  required: boolean,
  enumOptions?: EffectiveFoundationObjectFieldV010["enumOptions"]
): EffectiveFoundationObjectFieldV010 {
  return {
    fieldId, slotId: "business-dictionary.option-import",
    semanticType: "business-dictionary." + fieldId,
    valueType: enumOptions ? "ENUM" : "STRING",
    control: enumOptions ? "select" : "text",
    label: {default: english, translations: {"zh-CN": chinese}},
    required, order, surfaces: ["IMPORT"],
    ...(enumOptions ? {enumOptions} : {}),
    source: "CORE", resolvedLabel: english, readable: true, writable: true
  };
}

const FIELDS: EffectiveFoundationObjectFieldV010[] = [
  field("dictionaryId", "Dictionary code", "字典编码", 10, true),
  field("displayName", "Dictionary name", "字典名称", 20, true),
  field("optionCode", "Option code", "选项编码", 30, true),
  field("optionLabel", "Option name", "选项名称", 40, true),
  field("optionStatus", "Option status", "选项状态", 50, true, [
    {value:"ACTIVE",label:{default:"Active",translations:{"zh-CN":"启用"}}},
    {value:"INACTIVE",label:{default:"Inactive",translations:{"zh-CN":"停用"}}}
  ]),
  field("optionLabelZh", "Chinese option name", "简体中文名称", 60, false),
  field("optionAliases", "Source aliases (comma-separated)", "来源别名（逗号分隔）", 70, false)
];

function schema(locale = "en"): EffectiveObjectSchemaV010 {
  const normalized = locale.trim() || "en";
  return {
    contractVersion:"0.1.0",
    objectType: BUSINESS_DICTIONARY_IMPORT_TARGET_V010,
    ownerPackageId:"evo-business-dictionary",
    baseSchemaRef: BUSINESS_DICTIONARY_IMPORT_SCHEMA_V010,
    locale: normalized, activeRelationshipRoles: [],
    fields: FIELDS.map(f => ({
      ...structuredClone(f),
      resolvedLabel: f.label.translations?.[normalized] ?? f.label.default
    }))
  };
}
function textValue(
  values: Record<string, FoundationObjectImportCellV010>,
  key: string
): string {
  const value = values[key];
  return value === null || value === undefined ? "" : String(value).trim();
}
function optionFor(values: Record<string, FoundationObjectImportCellV010>): BusinessDictionaryOptionV010 {
  const option: BusinessDictionaryOptionV010 = {
    code: textValue(values,"optionCode"),
    label: {
      default: textValue(values,"optionLabel"),
      ...(textValue(values,"optionLabelZh") ? {
        translations: {"zh-CN":textValue(values,"optionLabelZh")}
      } : {})
    },
    status: textValue(values,"optionStatus") as "ACTIVE"|"INACTIVE"
  };
  const aliases = textValue(values,"optionAliases")
    .split(/[,，]/u).map(x=>x.trim()).filter(Boolean);
  if (aliases.length) option.aliases = [...new Set(aliases)];
  return option;
}
function normalized(value:string) {return value.normalize("NFKC").trim().toLowerCase();}
function preparedValues(row: FoundationObjectImportPreparedRowV010) {
  const dictionaryId=textValue(row.values,"dictionaryId");
  const displayName=textValue(row.values,"displayName");
  const option=optionFor(row.values);
  if (!dictionaryId || !displayName || !option.code || !option.label.default
      || !["ACTIVE","INACTIVE"].includes(option.status)) {
    throw new Error("BUSINESS_DICTIONARY_IMPORT_PREPARED_INVALID");
  }
  return {dictionaryId,displayName,option};
}

/**
 * A Data Import target is a Domain Owner, never a CSV writer in Eidos.
 * One row is one new option. A batch writes exactly one new DRAFT revision
 * per dictionary inside the existing Enterprise Resource transaction.
 * No row or batch can publish a dictionary or overwrite an existing code.
 */
export function createBusinessDictionaryImportTargetV010(input: {
  resources: EnterpriseResourceRepositoryV010;
  repository: BusinessDictionaryRepositoryV010;
}): FoundationObjectImportTargetV010 {
  return {
    contractVersion:"0.1.0",
    targetId: BUSINESS_DICTIONARY_IMPORT_TARGET_V010,
    label:{default:"Business dictionary options",translations:{"zh-CN":"业务字典项"}},
    objectType: BUSINESS_DICTIONARY_IMPORT_TARGET_V010,
    ownerPackageId:"evo-business-dictionary",
    completionNavigation(navigation) {
      let route: string = DIRECTORY;
      if (navigation.originRoute) {
        // Return location is presentation intent, not an authorization grant.
        parseBusinessDictionaryDirectoryRouteV010(navigation.originRoute);
        route=navigation.originRoute;
      }
      return {route,label:{default:"Business dictionaries",translations:{"zh-CN":"业务字典"}}};
    },
    describe(details) {return schema(details.locale);},
    validateRow(request): FoundationObjectImportValidationV010 {
      const values: Record<string, FoundationObjectImportCellV010> = {};
      const issues: FoundationObjectImportValidationV010["issues"] = [];
      const fields=new Map(request.schema.fields
        .filter(f=>f.surfaces.includes("IMPORT") && f.writable)
        .map(f=>[f.fieldId,f]));
      for(const key of Object.keys(request.values)) {
        if(!fields.has(key)) issues.push({code:"DATA_IMPORT_FIELD_NOT_IMPORTABLE",
          message:"Unknown dictionary import column.",fieldId:key});
      }
      for(const f of fields.values()) {
        const raw=request.values[f.fieldId];
        if (f.required && foundationObjectImportCellBlankV010(raw)) {
          issues.push({code:"DATA_IMPORT_REQUIRED_VALUE_MISSING",
            message:"A required dictionary field is missing.",fieldId:f.fieldId});
          continue;
        }
        if(raw === undefined) continue;
        try {
          const value = f.fieldId === "optionStatus" && typeof raw === "string"
            ? raw.trim() === "启用" ? "ACTIVE"
              : raw.trim() === "停用" ? "INACTIVE" : raw
            : raw;
          values[f.fieldId] = normalizeFoundationObjectImportCellV010(f,value);
        }
        catch(error) {
          const code=error instanceof Error?error.message:"DATA_IMPORT_VALUE_INVALID";
          issues.push({code,message:code,fieldId:f.fieldId});
        }
      }
      const id=textValue(values,"dictionaryId");
      const name=textValue(values,"displayName");
      const code=textValue(values,"optionCode");
      if(id && code) {
        const existing=input.repository.get(request.contextId,id);
        if(existing?.displayName && existing.displayName!==name) {
          issues.push({code:"BUSINESS_DICTIONARY_IMPORT_NAME_CONFLICT",
            message:"Existing dictionary has a different name.",fieldId:"displayName"});
        }
        if(existing?.options.some(option=>normalized(option.code)===normalized(code))) {
          issues.push({code:"BUSINESS_DICTIONARY_IMPORT_OPTION_EXISTS",
            message:"An option with this code already exists.",fieldId:"optionCode"});
        }
      }
      return {
        ok:issues.length===0,
        ...(issues.length===0 ? {prepared:{
          rowNumber:request.rowNumber,values,
          dedupeKey:normalized(id)+"|"+normalized(code)
        }} : {}),
        issues
      };
    },
    commitRow() {
      throw new Error("BUSINESS_DICTIONARY_IMPORT_ATOMIC_BATCH_REQUIRED");
    },
    commitPreparedRows(batch) {
      if(!input.resources.transaction) {
        throw new Error("BUSINESS_DICTIONARY_IMPORT_ATOMIC_RESOURCE_REQUIRED");
      }
      const groups = new Map<string, {
        dictionaryId:string;displayName:string;
        options: BusinessDictionaryOptionV010[];
      }>();
      const seen = new Set<string>();
      for(const prepared of batch.preparedRows) {
        const record=preparedValues(prepared);
        const dedupe=normalized(record.dictionaryId)+"|"+normalized(record.option.code);
        if(seen.has(dedupe)) throw new Error("BUSINESS_DICTIONARY_IMPORT_DUPLICATE_IN_BATCH");
        seen.add(dedupe);
        const group=groups.get(record.dictionaryId) ?? {
          dictionaryId:record.dictionaryId,displayName:record.displayName,options:[]
        };
        if(group.displayName!==record.displayName)
          throw new Error("BUSINESS_DICTIONARY_IMPORT_NAME_CONFLICT");
        group.options.push(record.option);
        groups.set(record.dictionaryId,group);
      }
      input.resources.transaction(()=>{
        for(const group of groups.values()) {
          const previous=input.repository.get(batch.contextId,group.dictionaryId);
          if(previous?.displayName && previous.displayName!==group.displayName)
            throw new Error("BUSINESS_DICTIONARY_IMPORT_NAME_CONFLICT");
          const existing=new Set(previous?.options.map(x=>normalized(x.code)) ?? []);
          if(group.options.some(option=>existing.has(normalized(option.code))))
            throw new Error("BUSINESS_DICTIONARY_IMPORT_OPTION_EXISTS");
          input.repository.saveDraft({
            contextId:batch.contextId,dictionaryId:group.dictionaryId,
            expectedVersion:previous?.version ?? 0,
            displayName:group.displayName,
            options:[...(previous?.options??[]),...group.options],
            actorSubjectId:batch.actorSubjectId,recordedAt:batch.recordedAt
          });
        }
      });
      return {semantics:"ATOMIC_BATCH",results:batch.preparedRows.map(row=>{
        const record=preparedValues(row);
        return {objectType:BUSINESS_DICTIONARY_IMPORT_TARGET_V010,
          objectId:record.dictionaryId+":"+record.option.code,
          displayKey:record.displayName+" · "+record.option.code};
      })};
    }
  };
}
