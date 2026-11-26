import type {
  FoundationObjectImportCellV010
} from "../../contracts/foundation-object/import.js";
import type {
  DataImportSourceV010
} from "./types.js";

/** Stable machine code plus actionable, bounded Human diagnostics. */
export class DataImportCsvErrorV010 extends Error {
  constructor(readonly code: string, readonly detail: string) {
    super(code);
  }
}

/** Automatic detection uses strict UTF-8 first, then strict GB18030 for legacy Chinese CSV.
 * Valid UTF-8 is preferred when both encodings are possible; explicit overrides remain available.
 * A BOM is authoritative, and parse errors must never trigger another decoding attempt.
 */
export function decodeCsvUploadV010(bytes: Uint8Array, encoding?: unknown): string {
  const selected = encoding === undefined ? "AUTO" : encoding;
  if (selected !== "AUTO" && selected !== "UTF-8" && selected !== "GB18030") {
    throw new DataImportCsvErrorV010("DATA_IMPORT_CSV_ENCODING_UNSUPPORTED",
      "请选择自动识别、UTF-8 或 GB18030 / Choose automatic detection, UTF-8 or GB18030.");
  }
  const utf8Bom = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  const unsupportedBom = (bytes[0] === 0xff && bytes[1] === 0xfe)
    || (bytes[0] === 0xfe && bytes[1] === 0xff)
    || (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0xfe && bytes[3] === 0xff);
  if (unsupportedBom) {
    throw new DataImportCsvErrorV010("DATA_IMPORT_CSV_ENCODING_UNSUPPORTED",
      "此 CSV 使用不支持的 Unicode 编码，请另存为 UTF-8 CSV。/ Unsupported Unicode BOM; save as UTF-8 CSV.");
  }
  if (selected === "GB18030" && utf8Bom) {
    throw new DataImportCsvErrorV010("DATA_IMPORT_CSV_ENCODING_MISMATCH",
      "文件包含 UTF-8 BOM，请使用自动识别或 UTF-8 / UTF-8 BOM detected; use automatic detection or UTF-8.");
  }
  const candidates = selected === "AUTO"
    ? (utf8Bom ? ["utf-8"] : ["utf-8", "gb18030"])
    : [selected === "UTF-8" ? "utf-8" : "gb18030"];
  for (const candidate of candidates) {
    try {
      return new TextDecoder(candidate, { fatal: true }).decode(bytes);
    } catch {
      // Only decoding failure may advance to the next supported encoding.
    }
  }
  throw new DataImportCsvErrorV010("DATA_IMPORT_CSV_ENCODING_INVALID",
    "无法读取 CSV 编码。可手动选择 UTF-8 或 GB18030，或另存为 UTF-8 CSV。/ Cannot decode CSV; try UTF-8 or GB18030 manually, or save as UTF-8 CSV.");
}

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
    const duplicates = new Set(headers.filter((header, index) =>
      headers.indexOf(header) !== index));
    const positions = headers.flatMap((header, index) =>
      duplicates.has(header) ? [index + 1] : []);
    const columns = positions.slice(0, 20).join(", ") + (positions.length > 20 ? ", …" : "");
    throw new DataImportCsvErrorV010("DATA_IMPORT_CSV_HEADER_DUPLICATE",
      "表头重复，请检查并区分第 " + columns
        + " 列的名称后重新上传（保留所有数据列）。/ Duplicate headers at columns "
        + columns + "; rename them distinctly and upload again.");
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
