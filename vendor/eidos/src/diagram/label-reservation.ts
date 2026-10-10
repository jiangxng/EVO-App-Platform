/** B8l: reserve what the actual 11px SVG label draws, not an arbitrary
 * 176-world-unit cap. Browser measures through a matching canvas font; the
 * pure fallback is deterministic for non-canvas and test environments.
 */
import type { DiagramEdgePointV010 } from "./edge-paths.js";
export interface DiagramLabelMetricsV010 {
  width: number;
  actualBoundingBoxAscent?: number;
  actualBoundingBoxDescent?: number;
}
export interface DiagramLabelReservationV010 {
  x: number; y: number; width: number; height: number;
}
export function diagramLabelReservationV010(
  anchor: DiagramEdgePointV010,
  caption: string,
  measured?: DiagramLabelMetricsV010
): DiagramLabelReservationV010 {
  if(!anchor || !Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)
    || typeof caption !== "string" || caption.length > 10000)
    throw Error("EIDOS_DIAGRAM_LABEL_RESERVATION_INVALID");
  // The renderer anchors labels at geometry.label.y - 8, centered, at 11px.
  const approximateWidth=[...caption].reduce((sum,ch)=>
    sum+(ch.codePointAt(0)! > 0x2e80 ? 11 : 6.2),0);
  const validWidth=measured && Number.isFinite(measured.width)
    && measured.width>0;
  const width=Math.min(4096,Math.max(8,validWidth ? measured.width : approximateWidth))+8;
  const asc=Number.isFinite(measured?.actualBoundingBoxAscent)
    && (measured?.actualBoundingBoxAscent??0)>0
    ? Math.min(32,measured!.actualBoundingBoxAscent!) : 10;
  const desc=Number.isFinite(measured?.actualBoundingBoxDescent)
    && (measured?.actualBoundingBoxDescent??-1)>=0
    ? Math.min(18,measured!.actualBoundingBoxDescent!) : 3;
  return {x:anchor.x-width/2,y:anchor.y-8-asc-3,width,
    height:asc+desc+6};
}

/** B8n: paint and reserve the exact same multiline layout.
 * Keep one-line legacy labels unchanged, use grapheme-safe wrapping with
 * up to four visible rows, plus the original full caption as SVG title.
 */
/** B8p: deterministic word-aware and bidirectional layout.
 * Browser SVG implements visual bidi ordering; keep every Unicode code point
 * in logical order so screen readers and stored captions do not get reversed.
 */
export interface DiagramCaptionLayoutV010 {
  lines: string[];
  truncated: boolean;
  direction: "ltr" | "rtl";
  box: DiagramLabelReservationV010;
}
function graphemeTokens(input:string):string[] {
  const ctor=(Intl as unknown as {Segmenter?:new (
    locale:string,options:{granularity:"grapheme"|"word"}
  )=>{segment(value:string):Iterable<{segment:string}>}}).Segmenter;
  if(ctor)return Array.from(new ctor("und",{granularity:"grapheme"}).segment(input),
    part=>part.segment);
  // Without Intl.Segmenter preserve at least full Unicode codepoints.
  return Array.from(input);
}
function wordTokens(input:string):string[] {
  const ctor=(Intl as unknown as {Segmenter?:new (
    locale:string,options:{granularity:"word"}
  )=>{segment(value:string):Iterable<{segment:string}>}}).Segmenter;
  if(ctor)return Array.from(new ctor("und",{granularity:"word"}).segment(input),
    part=>part.segment);
  // Legacy engines: words stay together where possible; other scripts
  // still have grapheme-safe hard-wrap if a unit exceeds available width.
  return input.match(/\s+|[^\s]+/gu)??[];
}
export function diagramCaptionDirectionV010(caption:string):"ltr"|"rtl" {
  if(typeof caption!=="string")throw Error("EIDOS_DIAGRAM_CAPTION_DIRECTION_INVALID");
  for(const char of caption){
    if(/[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(char))return "rtl";
    if(/\p{L}/u.test(char))return "ltr";
  }
  return "ltr";
}
export function diagramCaptionLayoutV010(
  anchor:DiagramEdgePointV010,caption:string,
  measure?: (text:string)=>DiagramLabelMetricsV010|undefined,
  maxWidth=260,maxLines=4
):DiagramCaptionLayoutV010 {
  if(!anchor||!Number.isFinite(anchor.x)||!Number.isFinite(anchor.y)
    || typeof caption!=="string"||caption.length>10000
    || !Number.isFinite(maxWidth)||maxWidth<40||maxWidth>4096
    || !Number.isInteger(maxLines)||maxLines<1||maxLines>12)
    throw Error("EIDOS_DIAGRAM_CAPTION_LAYOUT_INVALID");
  const width=(value:string)=>diagramLabelReservationV010(
    anchor,value,measure?.(value)).width-8;
  const normalized=caption.replace(/\r\n?/g,"\n").replace(/\t/g," ");
  const parts=normalized.split("\n"),lines:string[]=[];
  const direction=diagramCaptionDirectionV010(normalized);
  let truncated=false;
  outer:for(let p=0;p<parts.length;p++){
    const tokens=wordTokens(parts[p]!);
    let current="";
    for(let i=0;i<tokens.length;i++){
      let token=tokens[i]!;
      if(!current && /^\s+$/u.test(token))continue;
      if(width(current+token)<=maxWidth){current+=token;continue;}
      // Prefer a real word boundary. Do not put a long word onto the
      // previous line if the entire word fits on the next line.
      if(current && width(token.trimStart())<=maxWidth){
        lines.push(current.trimEnd());
        if(lines.length>=maxLines){truncated=true;break outer;}
        current=token.trimStart();
        continue;
      }
      // A single overlong word or CJK grapheme needs bounded hard wrapping.
      for(const cluster of graphemeTokens(token)){
        if(width(current+cluster)>maxWidth && current){
          lines.push(current.trimEnd());
          if(lines.length>=maxLines){truncated=true;break outer;}
          current=/^\s+$/u.test(cluster)?"":cluster;
        }else current+=cluster;
      }
    }
    lines.push(current.trimEnd());
    if(lines.length>=maxLines && p<parts.length-1){truncated=true;break;}
  }
  if(!lines.length)lines.push("");
  if(lines.length>maxLines){truncated=true;lines.length=maxLines;}
  if(truncated){
    const last=lines.length-1;
    const clusters=graphemeTokens(lines[last]!);
    while(clusters.length && width(clusters.join("")+"…")>maxWidth)clusters.pop();
    lines[last]=clusters.join("")+"…";
  }
  const widest=lines.reduce((best,line)=>width(line)>width(best)?line:best,"");
  const base=diagramLabelReservationV010(anchor,widest,measure?.(widest));
  const advance=14*(lines.length-1);
  return {lines,truncated,direction,box:{
    x:base.x,y:base.y-advance/2,
    width:base.width,height:base.height+advance
  }};
}
