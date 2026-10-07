import { inflateRawSync } from "node:zlib";
import type {
  FoundationObjectImportCellV010
} from "../../contracts/foundation-object/import.js";
import type {
  DataImportSourceV010
} from "./types.js";

const MAX_XLSX_BYTES_V010 = 10 * 1024 * 1024;
const MAX_ENTRY_BYTES_V010 = 32 * 1024 * 1024;
const MAX_TOTAL_UNCOMPRESSED_BYTES_V010 = 64 * 1024 * 1024;
const MAX_ROWS_V010 = 100_000;
const MAX_COLUMNS_V010 = 2_048;

interface ZipEntryV010 {
  name: string;
  compression: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

function u16(buffer: Buffer, offset: number): number {
  if (offset < 0 || offset + 2 > buffer.length) {
    throw new Error("DATA_IMPORT_XLSX_ZIP_TRUNCATED");
  }
  return buffer.readUInt16LE(offset);
}

function u32(buffer: Buffer, offset: number): number {
  if (offset < 0 || offset + 4 > buffer.length) {
    throw new Error("DATA_IMPORT_XLSX_ZIP_TRUNCATED");
  }
  return buffer.readUInt32LE(offset);
}

function eocdOffset(buffer: Buffer): number {
  const minimum = Math.max(0, buffer.length - 65_557);
  for (let offset = buffer.length - 22; offset >= minimum; offset -= 1) {
    if (u32(buffer, offset) === 0x06054b50) return offset;
  }
  throw new Error("DATA_IMPORT_XLSX_ZIP_EOCD_NOT_FOUND");
}

function zipEntries(buffer: Buffer): Map<string, ZipEntryV010> {
  const eocd = eocdOffset(buffer);
  const disk = u16(buffer, eocd + 4);
  const directoryDisk = u16(buffer, eocd + 6);
  const entriesOnDisk = u16(buffer, eocd + 8);
  const totalEntries = u16(buffer, eocd + 10);
  const directorySize = u32(buffer, eocd + 12);
  const directoryOffset = u32(buffer, eocd + 16);

  if (
    disk !== 0
    || directoryDisk !== 0
    || entriesOnDisk !== totalEntries
    || totalEntries === 0xffff
    || directorySize === 0xffffffff
    || directoryOffset === 0xffffffff
  ) {
    throw new Error("DATA_IMPORT_XLSX_ZIP64_OR_MULTIDISK_UNSUPPORTED");
  }
  if (
    directoryOffset + directorySize > buffer.length
    || directoryOffset + directorySize > eocd
  ) {
    throw new Error("DATA_IMPORT_XLSX_ZIP_DIRECTORY_INVALID");
  }

  const entries = new Map<string, ZipEntryV010>();
  let offset = directoryOffset;
  let totalUncompressed = 0;

  for (let index = 0; index < totalEntries; index += 1) {
    if (u32(buffer, offset) !== 0x02014b50) {
      throw new Error("DATA_IMPORT_XLSX_ZIP_DIRECTORY_INVALID");
    }
    const flags = u16(buffer, offset + 8);
    const compression = u16(buffer, offset + 10);
    const compressedSize = u32(buffer, offset + 20);
    const uncompressedSize = u32(buffer, offset + 24);
    const nameLength = u16(buffer, offset + 28);
    const extraLength = u16(buffer, offset + 30);
    const commentLength = u16(buffer, offset + 32);
    const localHeaderOffset = u32(buffer, offset + 42);

    if ((flags & 0x0001) !== 0) {
      throw new Error("DATA_IMPORT_XLSX_ENCRYPTED_UNSUPPORTED");
    }
    if (compression !== 0 && compression !== 8) {
      throw new Error("DATA_IMPORT_XLSX_COMPRESSION_UNSUPPORTED");
    }
    if (uncompressedSize > MAX_ENTRY_BYTES_V010) {
      throw new Error("DATA_IMPORT_XLSX_ENTRY_TOO_LARGE");
    }
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED_BYTES_V010) {
      throw new Error("DATA_IMPORT_XLSX_EXPANDED_TOO_LARGE");
    }

    const nameStart = offset + 46;
    const nameEnd = nameStart + nameLength;
    if (nameEnd > buffer.length) {
      throw new Error("DATA_IMPORT_XLSX_ZIP_TRUNCATED");
    }
    const name = buffer.subarray(nameStart, nameEnd).toString("utf8");
    if (!name || name.includes("\0")) {
      throw new Error("DATA_IMPORT_XLSX_ZIP_ENTRY_INVALID");
    }
    entries.set(name.replaceAll("\\", "/"), {
      name,
      compression,
      compressedSize,
      uncompressedSize,
      localHeaderOffset
    });

    offset = nameEnd + extraLength + commentLength;
    if (offset > directoryOffset + directorySize) {
      throw new Error("DATA_IMPORT_XLSX_ZIP_DIRECTORY_INVALID");
    }
  }

  return entries;
}

function readEntry(
  buffer: Buffer,
  entries: Map<string, ZipEntryV010>,
  name: string,
  required = true
): Buffer | undefined {
  const entry = entries.get(name);
  if (!entry) {
    if (required) throw new Error("DATA_IMPORT_XLSX_ENTRY_MISSING_" + name);
    return undefined;
  }
  const offset = entry.localHeaderOffset;
  if (u32(buffer, offset) !== 0x04034b50) {
    throw new Error("DATA_IMPORT_XLSX_LOCAL_HEADER_INVALID");
  }
  const nameLength = u16(buffer, offset + 26);
  const extraLength = u16(buffer, offset + 28);
  const dataStart = offset + 30 + nameLength + extraLength;
  const dataEnd = dataStart + entry.compressedSize;
  if (dataStart < 0 || dataEnd > buffer.length) {
    throw new Error("DATA_IMPORT_XLSX_ZIP_TRUNCATED");
  }
  const compressed = buffer.subarray(dataStart, dataEnd);
  const output = entry.compression === 0
    ? Buffer.from(compressed)
    : inflateRawSync(compressed, {
        maxOutputLength: MAX_ENTRY_BYTES_V010
      });
  if (output.length !== entry.uncompressedSize) {
    throw new Error("DATA_IMPORT_XLSX_ENTRY_SIZE_MISMATCH");
  }
  return output;
}

function xmlText(buffer: Buffer | undefined): string {
  return buffer?.toString("utf8") ?? "";
}

function decodeXml(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
    .replace(/&#(\d+);/gu, (_, code: string) =>
      String.fromCodePoint(Number(code))
    )
    .replace(/&#x([0-9a-f]+);/gui, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    );
}

function attr(fragment: string, name: string): string | undefined {
  const match = new RegExp(
    "\\b" + name + "=(?:\"([^\"]*)\"|'([^']*)')",
    "u"
  ).exec(fragment);
  const value = match?.[1] ?? match?.[2];
  return value === undefined ? undefined : decodeXml(value);
}

function sharedStrings(xml: string): string[] {
  if (!xml) return [];
  const values: string[] = [];
  for (const match of xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/gu)) {
    const text = [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gu)]
      .map(item => decodeXml(item[1]))
      .join("");
    values.push(text);
  }
  return values;
}

function normalizeWorkbookTarget(target: string): string {
  const normalized = target.replaceAll("\\", "/").replace(/^\.\//u, "");
  if (normalized.startsWith("/")) {
    return normalized.slice(1);
  }
  if (normalized.startsWith("xl/")) return normalized;
  return "xl/" + normalized;
}

function firstWorksheetPath(
  workbookXml: string,
  relationshipsXml: string
): string {
  const sheet = /<sheet\b([^>]*)\/?\s*>/u.exec(workbookXml);
  if (!sheet) throw new Error("DATA_IMPORT_XLSX_WORKSHEET_REQUIRED");
  const relationshipId =
    attr(sheet[1], "r:id")
    ?? attr(sheet[1], "id");
  if (!relationshipId) {
    throw new Error("DATA_IMPORT_XLSX_WORKSHEET_RELATIONSHIP_REQUIRED");
  }

  for (const match of relationshipsXml.matchAll(
    /<Relationship\b([^>]*)\/?\s*>/gu
  )) {
    if (attr(match[1], "Id") !== relationshipId) continue;
    const target = attr(match[1], "Target");
    if (!target) {
      throw new Error("DATA_IMPORT_XLSX_WORKSHEET_TARGET_REQUIRED");
    }
    return normalizeWorkbookTarget(target);
  }
  throw new Error("DATA_IMPORT_XLSX_WORKSHEET_RELATIONSHIP_NOT_FOUND");
}

function columnIndex(reference: string): number {
  const match = /^([A-Z]+)\d+$/u.exec(reference.toUpperCase());
  if (!match) throw new Error("DATA_IMPORT_XLSX_CELL_REFERENCE_INVALID");
  let value = 0;
  for (const character of match[1]) {
    value = value * 26 + character.charCodeAt(0) - 64;
  }
  const index = value - 1;
  if (index < 0 || index >= MAX_COLUMNS_V010) {
    throw new Error("DATA_IMPORT_XLSX_TOO_MANY_COLUMNS");
  }
  return index;
}

function cellValue(
  attributes: string,
  body: string,
  strings: string[]
): FoundationObjectImportCellV010 {
  const type = attr(attributes, "t") ?? "";
  if (type === "inlineStr") {
    return [...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gu)]
      .map(match => decodeXml(match[1]))
      .join("");
  }

  const raw = /<v\b[^>]*>([\s\S]*?)<\/v>/u.exec(body)?.[1];
  if (raw === undefined) return "";

  const decoded = decodeXml(raw);
  if (type === "s") {
    const index = Number(decoded);
    if (!Number.isInteger(index) || index < 0 || index >= strings.length) {
      throw new Error("DATA_IMPORT_XLSX_SHARED_STRING_INVALID");
    }
    return strings[index];
  }
  if (type === "b") return decoded === "1";
  if (type === "str" || type === "e") return decoded;

  const number = Number(decoded);
  return Number.isFinite(number) ? number : decoded;
}

function worksheetRows(
  xml: string,
  strings: string[]
): FoundationObjectImportCellV010[][] {
  const rows: FoundationObjectImportCellV010[][] = [];

  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/gu)) {
    if (rows.length >= MAX_ROWS_V010 + 1) {
      throw new Error("DATA_IMPORT_XLSX_TOO_MANY_ROWS");
    }
    const row: FoundationObjectImportCellV010[] = [];
    for (const cellMatch of rowMatch[1].matchAll(
      /<c\b([^>]*)>([\s\S]*?)<\/c>/gu
    )) {
      const ref = attr(cellMatch[1], "r");
      if (!ref) throw new Error("DATA_IMPORT_XLSX_CELL_REFERENCE_REQUIRED");
      row[columnIndex(ref)] = cellValue(
        cellMatch[1],
        cellMatch[2],
        strings
      );
    }
    while (row.length > 0 && row[row.length - 1] === undefined) row.pop();
    rows.push(row.map(value => value ?? ""));
  }
  return rows;
}

function headerText(value: FoundationObjectImportCellV010): string {
  return String(value ?? "").trim();
}

export function parseXlsxSourceV010(input: {
  contentBase64: string;
  name?: string;
}): DataImportSourceV010 {
  const contentBase64 = input.contentBase64.trim();
  if (
    !contentBase64
    || contentBase64.length % 4 !== 0
    || !/^[A-Za-z0-9+/]*={0,2}$/u.test(contentBase64)
  ) {
    throw new Error("DATA_IMPORT_XLSX_BASE64_INVALID");
  }

  const buffer = Buffer.from(contentBase64, "base64");
  if (buffer.length === 0 || buffer.length > MAX_XLSX_BYTES_V010) {
    throw new Error("DATA_IMPORT_XLSX_SIZE_INVALID");
  }

  const entries = zipEntries(buffer);
  const workbook = xmlText(readEntry(buffer, entries, "xl/workbook.xml"));
  const relationships = xmlText(
    readEntry(buffer, entries, "xl/_rels/workbook.xml.rels")
  );
  const strings = sharedStrings(xmlText(
    readEntry(buffer, entries, "xl/sharedStrings.xml", false)
  ));
  const worksheetPath = firstWorksheetPath(workbook, relationships);
  const rows = worksheetRows(
    xmlText(readEntry(buffer, entries, worksheetPath)),
    strings
  ).filter(row => row.some(value => headerText(value).length > 0));

  if (rows.length === 0) {
    throw new Error("DATA_IMPORT_XLSX_EMPTY");
  }

  const headers = rows[0].map(headerText);
  if (headers.length === 0 || headers.some(value => !value)) {
    throw new Error("DATA_IMPORT_XLSX_HEADER_REQUIRED");
  }
  if (new Set(headers).size !== headers.length) {
    throw new Error("DATA_IMPORT_XLSX_HEADER_DUPLICATE");
  }

  const dataRows = rows.slice(1).map((row, rowIndex) => {
    if (row.length > headers.length) {
      throw new Error(
        "DATA_IMPORT_XLSX_TOO_MANY_COLUMNS_AT_ROW_" + (rowIndex + 2)
      );
    }
    const output: Record<string, FoundationObjectImportCellV010> = {};
    headers.forEach((header, index) => {
      output[header] = row[index] ?? "";
    });
    return output;
  });

  return {
    kind: "XLSX",
    ...(input.name?.trim() ? { name: input.name.trim() } : {}),
    headers,
    rows: dataRows
  };
}
