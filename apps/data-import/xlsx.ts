import { inflateRawSync } from "node:zlib";
import type {
  FoundationObjectImportCellV010
} from "../../contracts/foundation-object/import.js";
import type {
  DataImportSourceV010
} from "./types.js";

const XLSX_MAX_ZIP_ENTRIES_V010 = 512;
// CP-03 legacy anti-sparse-column bound; also prevents unbounded null-array growth.
const XLSX_MAX_COLUMNS_V010 = 2_048;
const XLSX_MAX_ENTRY_UNCOMPRESSED_BYTES_V010 = 32 * 1024 * 1024;
const XLSX_MAX_TOTAL_UNCOMPRESSED_BYTES_V010 = 64 * 1024 * 1024;

interface ZipEntryV010 {
  name: string;
  compression: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

function u16(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function u32(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset]
    | (bytes[offset + 1] << 8)
    | (bytes[offset + 2] << 16)
    | (bytes[offset + 3] << 24)
  ) >>> 0;
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function zipEntries(bytes: Uint8Array): Map<string, ZipEntryV010> {
  const min = Math.max(0, bytes.length - 65557);
  let eocd = -1;
  for (let offset = bytes.length - 22; offset >= min; offset -= 1) {
    if (u32(bytes, offset) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw new Error("DATA_IMPORT_XLSX_ZIP_EOCD_NOT_FOUND");

  const totalEntries = u16(bytes, eocd + 10);
  if (totalEntries < 1 || totalEntries > XLSX_MAX_ZIP_ENTRIES_V010) {
    throw new Error("DATA_IMPORT_XLSX_ZIP_ENTRY_LIMIT_EXCEEDED");
  }
  const centralOffset = u32(bytes, eocd + 16);
  if (centralOffset >= bytes.length) {
    throw new Error("DATA_IMPORT_XLSX_ZIP_CENTRAL_INVALID");
  }
  const entries = new Map<string, ZipEntryV010>();
  let offset = centralOffset;
  let totalUncompressedBytes = 0;

  for (let index = 0; index < totalEntries; index += 1) {
    if (u32(bytes, offset) !== 0x02014b50) {
      throw new Error("DATA_IMPORT_XLSX_ZIP_CENTRAL_INVALID");
    }
    const compression = u16(bytes, offset + 10);
    const compressedSize = u32(bytes, offset + 20);
    const uncompressedSize = u32(bytes, offset + 24);
    const nameLength = u16(bytes, offset + 28);
    const extraLength = u16(bytes, offset + 30);
    const commentLength = u16(bytes, offset + 32);
    const localHeaderOffset = u32(bytes, offset + 42);
    if (
      uncompressedSize > XLSX_MAX_ENTRY_UNCOMPRESSED_BYTES_V010
      || compressedSize > bytes.length
      || localHeaderOffset >= bytes.length
    ) {
      throw new Error("DATA_IMPORT_XLSX_ZIP_ENTRY_SIZE_INVALID");
    }
    totalUncompressedBytes += uncompressedSize;
    if (totalUncompressedBytes > XLSX_MAX_TOTAL_UNCOMPRESSED_BYTES_V010) {
      throw new Error("DATA_IMPORT_XLSX_ZIP_TOTAL_SIZE_EXCEEDED");
    }
    const name = decodeUtf8(
      bytes.subarray(offset + 46, offset + 46 + nameLength)
    ).replaceAll("\\", "/");
    entries.set(name, {
      name,
      compression,
      compressedSize,
      uncompressedSize,
      localHeaderOffset
    });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function readZipEntry(
  bytes: Uint8Array,
  entry: ZipEntryV010
): Uint8Array {
  const offset = entry.localHeaderOffset;
  if (u32(bytes, offset) !== 0x04034b50) {
    throw new Error("DATA_IMPORT_XLSX_ZIP_LOCAL_INVALID");
  }
  const nameLength = u16(bytes, offset + 26);
  const extraLength = u16(bytes, offset + 28);
  const start = offset + 30 + nameLength + extraLength;
  const end = start + entry.compressedSize;
  if (start < 0 || end > bytes.length || end < start) {
    throw new Error("DATA_IMPORT_XLSX_ZIP_ENTRY_BOUNDS_INVALID");
  }
  const compressed = bytes.subarray(start, end);

  if (entry.compression === 0) {
    if (
      entry.uncompressedSize !== 0
      && compressed.byteLength !== entry.uncompressedSize
    ) {
      throw new Error("DATA_IMPORT_XLSX_ZIP_SIZE_MISMATCH");
    }
    return new Uint8Array(compressed);
  }
  if (entry.compression !== 8) {
    throw new Error("DATA_IMPORT_XLSX_ZIP_COMPRESSION_UNSUPPORTED");
  }
  const inflated = inflateRawSync(compressed);
  if (
    entry.uncompressedSize !== 0
    && inflated.byteLength !== entry.uncompressedSize
  ) {
    throw new Error("DATA_IMPORT_XLSX_ZIP_SIZE_MISMATCH");
  }
  return new Uint8Array(inflated);
}

function xmlText(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
    .replace(/&#(\d+);/gu, (_, code: string) =>
      String.fromCodePoint(Number(code))
    )
    .replace(/&#x([0-9a-f]+);/giu, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    );
}

function attr(fragment: string, name: string): string | undefined {
  const match = fragment.match(
    new RegExp(
      "(?:^|\\s)" + name + "=([\"'])(.*?)\\1",
      "u"
    )
  );
  return match ? xmlText(match[2]) : undefined;
}

function normalizeZipPath(base: string, target: string): string {
  if (target.startsWith("/")) return target.slice(1);
  const parts = (base + "/" + target).split("/");
  const normalized: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") normalized.pop();
    else normalized.push(part);
  }
  return normalized.join("/");
}

function firstWorksheetPath(
  workbookXml: string,
  relsXml: string
): string {
  const sheet = workbookXml.match(/<sheet\b([^>]*)\/?\s*>/u);
  const relationshipId = sheet ? attr(sheet[1], "r:id") : undefined;
  if (!relationshipId) {
    throw new Error("DATA_IMPORT_XLSX_WORKSHEET_NOT_FOUND");
  }

  const relationshipPattern = /<Relationship\b([^>]*)\/?\s*>/gu;
  for (const match of relsXml.matchAll(relationshipPattern)) {
    if (attr(match[1], "Id") !== relationshipId) continue;
    const target = attr(match[1], "Target");
    if (!target) break;
    return normalizeZipPath("xl", target);
  }
  throw new Error("DATA_IMPORT_XLSX_WORKSHEET_RELATIONSHIP_NOT_FOUND");
}

function sharedStrings(xml: string | undefined): string[] {
  if (!xml) return [];
  const values: string[] = [];
  for (const match of xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/gu)) {
    const text = [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gu)]
      .map(item => xmlText(item[1]))
      .join("");
    values.push(text);
  }
  return values;
}

function columnIndex(reference: string): number {
  const letters = reference.match(/^[A-Z]+/iu)?.[0]?.toUpperCase();
  if (!letters) return -1;
  let value = 0;
  for (const char of letters) {
    value = value * 26 + char.charCodeAt(0) - 64;
  }
  return value - 1;
}

function cellValue(
  cellTag: string,
  body: string,
  strings: readonly string[]
): FoundationObjectImportCellV010 {
  const type = attr(cellTag, "t");
  if (type === "inlineStr") {
    return [...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gu)]
      .map(item => xmlText(item[1]))
      .join("");
  }
  const raw = body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/u)?.[1];
  if (raw === undefined) return null;
  const decoded = xmlText(raw).trim();

  if (type === "s") {
    const index = Number(decoded);
    if (!Number.isInteger(index) || index < 0 || index >= strings.length) {
      throw new Error("DATA_IMPORT_XLSX_SHARED_STRING_INVALID");
    }
    return strings[index];
  }
  if (type === "b") return decoded === "1";
  if (type === "str" || type === "e") return decoded;

  if (decoded === "") return null;
  const number = Number(decoded);
  return Number.isFinite(number) ? number : decoded;
}

function worksheetRows(
  xml: string,
  strings: readonly string[],
  maxRows: number
): FoundationObjectImportCellV010[][] {
  const rows: FoundationObjectImportCellV010[][] = [];
  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/gu)) {
    const cells: FoundationObjectImportCellV010[] = [];
    const cellPattern = /<c\b([^>]*)>([\s\S]*?)<\/c>/gu;
    for (const cellMatch of rowMatch[1].matchAll(cellPattern)) {
      const reference = attr(cellMatch[1], "r");
      const index = reference ? columnIndex(reference) : cells.length;
      if (index < 0) continue;
      if (index >= XLSX_MAX_COLUMNS_V010) {
        throw new Error("DATA_IMPORT_XLSX_TOO_MANY_COLUMNS");
      }
      while (cells.length <= index) cells.push(null);
      cells[index] = cellValue(cellMatch[1], cellMatch[2], strings);
    }
    if (cells.some(value => value !== null && String(value).trim() !== "")) {
      rows.push(cells);
      if (rows.length > maxRows + 1) {
        throw new Error("DATA_IMPORT_XLSX_ROW_LIMIT_EXCEEDED");
      }
    }
  }
  return rows;
}

function headerName(
  value: FoundationObjectImportCellV010,
  index: number
): string {
  const normalized = value === null ? "" : String(value).trim();
  return normalized || "Column " + (index + 1);
}

export function parseXlsxSourceV010(input: {
  bytes: Uint8Array;
  name?: string;
  maxRows?: number;
}): DataImportSourceV010 {
  if (input.bytes.byteLength < 22) {
    throw new Error("DATA_IMPORT_XLSX_FILE_INVALID");
  }
  const maxRows = input.maxRows ?? 10000;
  if (!Number.isSafeInteger(maxRows) || maxRows < 1) {
    throw new Error("DATA_IMPORT_XLSX_MAX_ROWS_INVALID");
  }

  const entries = zipEntries(input.bytes);
  const readText = (path: string): string | undefined => {
    const entry = entries.get(path);
    return entry ? decodeUtf8(readZipEntry(input.bytes, entry)) : undefined;
  };

  const workbook = readText("xl/workbook.xml");
  const rels = readText("xl/_rels/workbook.xml.rels");
  if (!workbook || !rels) {
    throw new Error("DATA_IMPORT_XLSX_WORKBOOK_INVALID");
  }
  const worksheetPath = firstWorksheetPath(workbook, rels);
  const worksheet = readText(worksheetPath);
  if (!worksheet) throw new Error("DATA_IMPORT_XLSX_WORKSHEET_NOT_FOUND");

  const strings = sharedStrings(readText("xl/sharedStrings.xml"));
  const rawRows = worksheetRows(worksheet, strings, maxRows);
  if (rawRows.length === 0) {
    throw new Error("DATA_IMPORT_XLSX_EMPTY");
  }

  const headers = rawRows[0].map(headerName);
  const normalizedHeaders = headers.map(header => header.toLocaleLowerCase());
  if (new Set(normalizedHeaders).size !== headers.length) {
    throw new Error("DATA_IMPORT_XLSX_HEADER_DUPLICATE");
  }

  const body = rawRows.slice(1);
  if (body.length > maxRows) {
    throw new Error("DATA_IMPORT_XLSX_ROW_LIMIT_EXCEEDED");
  }

  const rows = body.map((cells, index) => {
    if (cells.length > headers.length) {
      throw new Error("DATA_IMPORT_XLSX_TOO_MANY_COLUMNS_AT_ROW_" + (index + 2));
    }
    const row: Record<string, FoundationObjectImportCellV010> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? null;
    });
    return row;
  });

  return {
    kind: "XLSX",
    ...(input.name?.trim() ? { name: input.name.trim() } : {}),
    headers,
    rows
  };
}
