import type {
  FoundationObjectImportCellV010
} from "../contracts/foundation-object/import.js";
import type {
  EffectiveFoundationObjectFieldV010
} from "../contracts/foundation-object/schema.js";

export function foundationObjectImportCellBlankV010(
  value: FoundationObjectImportCellV010 | undefined
): boolean {
  return value === null
    || value === undefined
    || (typeof value === "string" && !value.trim());
}

export function normalizeFoundationObjectImportCellV010(
  field: EffectiveFoundationObjectFieldV010,
  value: FoundationObjectImportCellV010 | undefined
): FoundationObjectImportCellV010 {
  if (foundationObjectImportCellBlankV010(value)) return null;

  switch (field.valueType) {
    case "STRING":
      return typeof value === "string"
        ? value.trim()
        : String(value);
    case "NUMBER": {
      const number = typeof value === "number"
        ? value
        : Number(String(value).trim());
      if (!Number.isFinite(number)) {
        throw new Error("DATA_IMPORT_VALUE_NUMBER_INVALID");
      }
      return number;
    }
    case "BOOLEAN": {
      if (typeof value === "boolean") return value;
      const normalized = String(value).trim().toLowerCase();
      if (["true", "1", "yes", "y"].includes(normalized)) return true;
      if (["false", "0", "no", "n"].includes(normalized)) return false;
      throw new Error("DATA_IMPORT_VALUE_BOOLEAN_INVALID");
    }
    case "DATE": {
      const normalized = String(value).trim();
      if (!Number.isFinite(Date.parse(normalized))) {
        throw new Error("DATA_IMPORT_VALUE_DATE_INVALID");
      }
      return normalized;
    }
    case "ENUM": {
      const normalized = String(value).trim();
      const match = field.enumOptions?.find(option =>
        option.value.toLocaleLowerCase() === normalized.toLocaleLowerCase()
      );
      if (!match) throw new Error("DATA_IMPORT_VALUE_ENUM_INVALID");
      return match.value;
    }
  }
}
