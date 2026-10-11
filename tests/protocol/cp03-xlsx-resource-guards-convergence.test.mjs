import test from "node:test";
import assert from "node:assert/strict";
import { parseXlsxSourceV010 } from "../../dist/apps/data-import/xlsx.js";

// Small, in-memory ZIP fixture builder; no third-party package or remote sample.
function xlsxWithRows(rows) {
  const worksheet = '<worksheet><sheetData>' + rows.map((cells, index) =>
    '<row r="' + (index + 1) + '">' + cells.map(([ref, value]) =>
      '<c r="' + ref + '" t="inlineStr"><is><t>' + value +
      '</t></is></c>').join("") + '</row>'
  ).join("") + '</sheetData></worksheet>';
  const entries = [
    ["xl/workbook.xml", '<workbook><sheets><sheet name="Sheet1" r:id="rId1"/></sheets></workbook>'],
    ["xl/_rels/workbook.xml.rels", '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>'],
    ["xl/worksheets/sheet1.xml", worksheet]
  ];
  const locals = [];
  const directory = [];
  let offset = 0;
  for (const [path, source] of entries) {
    const name = Buffer.from(path);
    const data = Buffer.from(source);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name, data);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    directory.push(central, name);
    offset += local.length + name.length + data.length;
  }
  const centralBytes = Buffer.concat(directory);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBytes.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBytes, end]);
}

test("CP-03 XLSX retains valid first-sheet staged rows and a caller-configured limit", () => {
  const bytes = xlsxWithRows([
    [["A1", "Code"], ["B1", "Name"]],
    [["A2", "SUP-001"], ["B2", "Supplier"]]
  ]);
  assert.deepEqual(parseXlsxSourceV010({ bytes, maxRows: 1 }), {
    kind: "XLSX",
    headers: ["Code", "Name"],
    rows: [{ Code: "SUP-001", Name: "Supplier" }]
  });
});

test("CP-03 XLSX fails before expanding a maliciously sparse far-column reference", () => {
  const bytes = xlsxWithRows([
    [["A1", "Code"], ["ZZZZ1", "Unexpected"]],
    [["A2", "SUP-001"]]
  ]);
  assert.throws(
    () => parseXlsxSourceV010({ bytes }),
    /DATA_IMPORT_XLSX_TOO_MANY_COLUMNS/
  );
});

test("CP-03 XLSX rejects silently truncating data cells beyond declared headers", () => {
  const bytes = xlsxWithRows([
    [["A1", "Code"], ["B1", "Name"]],
    [["A2", "SUP-001"], ["B2", "Supplier"], ["C2", "Extra"]]
  ]);
  assert.throws(
    () => parseXlsxSourceV010({ bytes }),
    /DATA_IMPORT_XLSX_TOO_MANY_COLUMNS_AT_ROW_2/
  );
});

test("CP-03 XLSX enforces row count during streaming worksheet parsing", () => {
  const bytes = xlsxWithRows([
    [["A1", "Code"]], [["A2", "A"]], [["A3", "B"]]
  ]);
  assert.throws(() => parseXlsxSourceV010({ bytes, maxRows: 1 }),
    /DATA_IMPORT_XLSX_ROW_LIMIT_EXCEEDED/);
  assert.throws(() => parseXlsxSourceV010({ bytes, maxRows: Number.MAX_SAFE_INTEGER + 1 }),
    /DATA_IMPORT_XLSX_MAX_ROWS_INVALID/);
});
