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
