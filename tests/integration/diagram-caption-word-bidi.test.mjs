import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {diagramCaptionDirectionV010,diagramCaptionLayoutV010}
 from "../../dist/vendor/eidos/src/diagram/label-reservation.js";
const at={x:260,y:175};
const measure=s=>({width:[...s].length*8,
  actualBoundingBoxAscent:10,actualBoundingBoxDescent:3});

test("B8p English wraps at word boundaries before dividing words",()=>{
 const text="Sales order payment reconciliation";
 const layout=diagramCaptionLayoutV010(at,text,measure,150,4);
 assert.equal(layout.direction,"ltr");
 assert.equal(layout.lines[0],"Sales order");
 assert.equal(layout.lines[1],"payment");
 assert.equal(layout.lines[2],"reconciliation");
 assert.equal(layout.truncated,false);
});
test("B8p RTL first strong character sets visual direction without reversing words",()=>{
 const arabic="مرحبا بالعالم 123 — חשבונית 2026";
 const rtl=diagramCaptionLayoutV010(at,arabic,measure,200,4);
 assert.equal(rtl.direction,"rtl");
 assert.match(rtl.lines.join(" "),/مرحبا بالعالم/);
 assert.match(rtl.lines.join(" "),/חשבונית/);
 assert.equal(diagramCaptionDirectionV010("🧾 (123) שלום Hello"),"rtl");
 assert.equal(diagramCaptionDirectionV010("Invoice חשבונית 2026"),"ltr");
 assert.equal(diagramCaptionDirectionV010("销售到收款 مرحبا"),"ltr");
 assert.equal(diagramCaptionDirectionV010("123 · ---"),"ltr");
 assert.equal(diagramCaptionLayoutV010(at,arabic,measure,200,4).box.width,
   rtl.box.width);
});
test("B8p preserves no-mid-grapheme fallback even for overlong Arabic words",()=>{
 const word="المستحقات".repeat(16);
 const layout=diagramCaptionLayoutV010(at,word,measure,104,4);
 assert.equal(layout.direction,"rtl");
 assert.equal(layout.lines.length,4);
 assert.equal(layout.truncated,true);
 assert.ok(layout.lines.at(-1).endsWith("…"));
});
test("B8p hard newline and English words occupy common stable collision box",()=>{
 const text="Accounts payable approval\nInvoice settlement مرحبا";
 const one=diagramCaptionLayoutV010(at,text,measure,156,4);
 const two=diagramCaptionLayoutV010(at,text,measure,156,4);
 assert.deepEqual(one,two);
 assert.equal(one.direction,"ltr");
 assert.ok(one.lines.length>2);
 assert.ok(one.box.height>30);
 assert.ok(one.box.width<=164);
});
test("B8p shared Designer and Viewer SVG direction, isolated bidi",async()=>{
 const surface=await readFile(new URL("../../vendor/eidos/src/diagram/surface.ts",import.meta.url),"utf8");
 assert.match(surface,/label.setAttribute\("direction",captionLayout.direction\)/);
 assert.match(surface,/label.setAttribute\("unicode-bidi","plaintext"\)/);
 assert.match(surface,/data-eidos-diagram-caption-direction/);
 assert.match(surface,/diagramCaptionLayoutV010\(geometry.label,caption,measuredCaption\)\.box/);
});


test("B8s real Firefox/WebKit RTL bbox safety margin is used by both wrap and collision",()=>{
 const caption="مرحبا بالعالم · فواتير المورد والمستحقات 2026";
 const measured=text=>({width:[...text].length*8,
  actualBoundingBoxAscent:10,actualBoundingBoxDescent:3});
 const anchor={x:280,y:160};
 const rtl=diagramCaptionLayoutV010(anchor,caption,measured,260,4);
 const ltr=diagramCaptionLayoutV010(anchor,"Invoice approval and payment",measured,260,4);
 assert.equal(rtl.direction,"rtl");
 assert.equal(ltr.direction,"ltr");
 assert.ok(rtl.box.width>0&&rtl.box.width<=268);
 assert.equal(rtl.box.x,anchor.x-rtl.box.width/2);
 assert.ok(rtl.lines.every(line=>[...line].length*8*1.25<=260));
 // Existing one-line English experience must not gain bidi headroom.
 const one=diagramCaptionLayoutV010(anchor,"Short",measured);
 assert.equal(one.box.width,48);
});

test("B8s paint pass centers RTL actual SVG ink on the same reservation anchor",async()=>{
 const source=await readFile(new URL("../../vendor/eidos/src/diagram/surface.ts",import.meta.url),"utf8");
 assert.match(source,/bbox=label.getBBox\(\)/);
 assert.match(source,/const offset=anchor-center/);
 assert.match(source,/label.querySelectorAll\("tspan"\)\.forEach/);
 assert.match(source,/data-eidos-diagram-bidi-measure-limit/);
 assert.match(source,/data-eidos-diagram-bidi-measure-unavailable/);
});
