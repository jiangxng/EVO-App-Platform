import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {diagramCaptionLayoutV010,diagramLabelReservationV010}
  from "../../dist/vendor/eidos/src/diagram/label-reservation.js";
import {diagramSelfLoopDecisionV010} from "../../dist/vendor/eidos/src/diagram/edge-lanes.js";
const anchor={x:355,y:180};
const measure=text=>({width:Array.from(text).reduce((sum,ch)=>
 sum+(ch==="界"||ch==="品"||ch==="日"||ch==="本" ? 12:ch==="M"?9:6),0),
 actualBoundingBoxAscent:10,actualBoundingBoxDescent:3});
test("B8n Chinese Japanese mixed emoji explicit newline displayed and reserved consistently",()=>{
 const caption="中文业务界👩‍💻日本語 ABCD\n采购付款——行二";
 const layout=diagramCaptionLayoutV010(anchor,caption,measure,112,4);
 assert.ok(layout.lines.length>=2);
 assert.ok(layout.lines.some(x=>x.includes("采购付款")));
 assert.ok(layout.box.height>diagramLabelReservationV010(anchor,"单行",measure("单行")).height);
 assert.ok(layout.box.width<=120);
 assert.ok(!layout.truncated);
 const again=diagramCaptionLayoutV010(anchor,caption,measure,112,4);
 assert.deepEqual(layout,again);
});
test("B8n long unbroken text wraps and retains grapheme sequence with bounded ellipsis",()=>{
 const caption="M".repeat(250);
 const layout=diagramCaptionLayoutV010(anchor,caption,measure,200,4);
 assert.equal(layout.lines.length,4);
 assert.equal(layout.truncated,true);
 assert.ok(layout.lines.at(-1).endsWith("…"));
 assert.ok(layout.lines.every(x=>measure(x).width<=200));
 assert.ok(layout.box.width>170);
 assert.ok(layout.box.height>55);
});
test("B8n one-line legacy labels are unchanged and don't use tspan",()=>{
 const value=diagramCaptionLayoutV010(anchor,"Short",measure);
 assert.deepEqual(value.lines,["Short"]);
 assert.equal(value.truncated,false);
 const old=diagramLabelReservationV010(anchor,"Short",measure("Short"));
 assert.deepEqual(value.box,old);
});
test("B8n actual multiline label rectangle can block different loop side",()=>{
 const n={x:100,y:100,width:160,height:120};
 const label=diagramCaptionLayoutV010({x:340,y:210},"M".repeat(80),measure,210,4);
 const result=diagramSelfLoopDecisionV010(n,[],0,[],{labels:[label.box]});
 assert.notEqual(result.side,"right");
});
test("B8n rejects malformed length and line budgets",()=>{
 assert.throws(()=>diagramCaptionLayoutV010(anchor,"ABC",measure,10,4),
  /EIDOS_DIAGRAM_CAPTION_LAYOUT_INVALID/);
 assert.throws(()=>diagramCaptionLayoutV010(anchor,"ABC",measure,260,0),
  /EIDOS_DIAGRAM_CAPTION_LAYOUT_INVALID/);
});
test("B8n same lines feed layout of drawn SVG and collision index",async()=>{
 const surface=await readFile(new URL("../../vendor/eidos/src/diagram/surface.ts",import.meta.url),"utf8");
 assert.match(surface,/diagramCaptionLayoutV010\(geometry.label,caption,measuredCaption\)\.box/);
 assert.match(surface,/captionLayout.lines.forEach\(\(content,i\)=>/);
 assert.match(surface,/svgElement\("tspan"\)/);
 assert.match(surface,/data-eidos-diagram-caption-truncated/);
 assert.match(surface,/tooltip.textContent=edgeCaption/);
});
