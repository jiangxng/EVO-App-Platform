import test from "node:test";
import assert from "node:assert/strict";
import { parseXlsxSourceV010 } from "../../dist/apps/data-import/xlsx.js";
import {
  SYNTHETIC_V3_HEADERS,
  SYNTHETIC_V3_MISSING_ROWS,
  syntheticV3WorkbookV010
} from "../../tools/bex01/synthetic-v3-xlsx.mjs";

test("synthetic 22-column 172-row binary XLSX parses with every original value preserved", () => {
  const fixture = syntheticV3WorkbookV010();
  assert.equal(fixture.synthetic,true);
  assert.ok(Buffer.isBuffer(fixture.bytes));
  assert.equal(fixture.headers.length,22);
  assert.equal(fixture.rows.length,172);
  const restored = parseXlsxSourceV010({
    bytes:fixture.bytes,name:"synthetic-acceptance.xlsx"
  });
  assert.equal(restored.kind,"XLSX");
  assert.equal(restored.name,"synthetic-acceptance.xlsx");
  assert.equal(restored.worksheetName,"Synthetic",
    "sheet identity comes from the actual workbook metadata");
  assert.deepEqual(restored.headers,SYNTHETIC_V3_HEADERS);
  assert.equal(restored.rows.length,172);
  assert.deepEqual(restored.rows,fixture.rows);
  assert.deepEqual(
    restored.rows.map((row,index)=>row["主体类型"]===""?index+1:null)
      .filter(Boolean),
    SYNTHETIC_V3_MISSING_ROWS
  );
  assert.deepEqual(restored.rows.map(row=>row["往来编码"]),
    [...new Set(restored.rows.map(row=>row["往来编码"]))]);
  assert.equal(restored.rows[171]["原系统备注"],"legacy-0172");
  assert.equal(restored.rows[171]["开户银行"],"测试银行-2");
  assert.ok(restored.rows.every(row=>Object.keys(row).length===22));
});

test("the synthetic XLSX generator is deterministic and structurally isolated", () => {
  const x=syntheticV3WorkbookV010();
  const y=syntheticV3WorkbookV010();
  assert.deepEqual(x.bytes,y.bytes);
  assert.deepEqual(x.missingRowNumbers,[165,169,172]);
  assert.ok(x.rows.every(row=>row["往来编码"].startsWith("SYN-")));
  assert.ok(x.rows.every(row=>row["往来名称"].startsWith("Synthetic Supplier ")));
  assert.ok(!x.headers.includes("真实企业身份"));
  assert.deepEqual(x.headers.filter(h=>h==="开户银行"),["开户银行"],
    "The user's two ambiguous names refer to target fields; this generator does not invent a duplicate source header.");
});

test("second isolated XLSX has distinct identities while preserving every mapped 22-column value", () => {
  const retained = syntheticV3WorkbookV010({
    codePrefix:"RET-",namePrefix:"Retained Supplier "
  });
  const parsed = parseXlsxSourceV010({bytes:retained.bytes});
  assert.deepEqual(parsed.headers,SYNTHETIC_V3_HEADERS);
  assert.deepEqual(parsed.rows,retained.rows);
  assert.equal(parsed.rows.length,172);
  assert.equal(parsed.worksheetName,"Synthetic");
  assert.equal(parsed.rows[0]["往来编码"],"RET-0001");
  assert.equal(parsed.rows[171]["往来名称"],"Retained Supplier 0172");
  assert.equal(parsed.rows[171]["企业属性17"],"synthetic-20-0172");
  assert.equal(parsed.rows[171]["开户银行"],"测试银行-2");
  assert.deepEqual(
    parsed.rows.flatMap((row,index)=>row["主体类型"]===""?[index+1]:[]),
    SYNTHETIC_V3_MISSING_ROWS
  );
  const originals = syntheticV3WorkbookV010();
  assert.equal(new Set([...originals.rows,...retained.rows]
    .map(row=>row["往来编码"])).size,344,
    "two independent imports must never reuse source identities");
  assert.ok(!retained.rows.some(row=>row["往来名称"].startsWith("Synthetic Supplier ")));
  assert.throws(()=>syntheticV3WorkbookV010({
    codePrefix:"../PRODUCTION-",namePrefix:"customer"
  }),/BEX01_SYNTHETIC_XLSX_PREFIX_INVALID/);
});
