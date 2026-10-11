import type {
  FoundationObjectImportCellV010
} from "../../contracts/foundation-object/import.js";
import type {
  DataImportSourceV010
} from "./types.js";

function parseCsvRecords(input: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (quoted) {
      if (ch === "\"") {
        if (input[i + 1] === "\"") {
          cell += "\"";
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === "\"") {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.replace(/\r$/u, ""));
      records.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  if (quoted) throw new Error("DATA_IMPORT_CSV_UNCLOSED_QUOTE");
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.replace(/\r$/u, ""));
    records.push(row);
  }
  return records;
}

export function parseCsvSourceV010(input: {
  csv: string;
  name?: string;
}): DataImportSourceV010 {
  const records = parseCsvRecords(input.csv.replace(/^\uFEFF/u, ""));
  if (records.length === 0) {
    throw new Error("DATA_IMPORT_CSV_EMPTY");
  }
  const headers = records[0].map(value => value.trim());
  if (headers.some(value => !value)) {
    throw new Error("DATA_IMPORT_CSV_HEADER_REQUIRED");
  }
  if (new Set(headers).size !== headers.length) {
    throw new Error("DATA_IMPORT_CSV_HEADER_DUPLICATE");
  }
  const rows = records.slice(1)
    .filter(record => record.some(value => value.length > 0))
    .map((record, rowIndex) => {
      if (record.length > headers.length) {
        throw new Error(
          "DATA_IMPORT_CSV_TOO_MANY_COLUMNS_AT_ROW_" + (rowIndex + 2)
        );
      }
      const output: Record<string, FoundationObjectImportCellV010> = {};
      headers.forEach((header, index) => {
        output[header] = record[index] ?? "";
      });
      return output;
    });
  return {
    kind: "CSV",
    ...(input.name?.trim() ? { name: input.name.trim() } : {}),
    headers,
    rows
  };
}
