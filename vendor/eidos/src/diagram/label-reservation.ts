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
export interface DiagramCaptionLayoutV010 {
  lines: string[];
  truncated: boolean;
  box: DiagramLabelReservationV010;
}
function graphemeTokens(input:string):string[] {
  const ctor=(Intl as unknown as {Segmenter?:new (
    locale:string,options:{granularity:"grapheme"}
  )=>{segment(value:string):Iterable<{segment:string}>}}).Segmenter;
  if(ctor)return Array.from(new ctor("und",{granularity:"grapheme"}).segment(input),
    part=>part.segment);
  // Fallback never splits a surrogate pair (older browsers may lack Segmenter).
  return Array.from(input);
}
export function diagramCaptionLayoutV010(
  anchor:DiagramEdgePointV010,caption:string,
  measure?: (text:string)=>DiagramLabelMetricsV010|undefined,
  maxWidth=260,maxLines=4
):DiagramCaptionLayoutV010 {
  if(typeof caption!=="string"||caption.length>10000
    || !Number.isFinite(maxWidth)||maxWidth<40||maxWidth>4096
    || !Number.isInteger(maxLines)||maxLines<1||maxLines>12)
    throw Error("EIDOS_DIAGRAM_CAPTION_LAYOUT_INVALID");
  const width=(value:string)=>diagramLabelReservationV010(
    anchor,value,measure?.(value)).width-8;
  const normalized=caption.replace(/\r\n?/g,"\n").replace(/\t/g," ");
  const parts=normalized.split("\n"),lines:string[]=[];
  let truncated=false;
  outer:for(let p=0;p<parts.length;p++){
    const tokens=graphemeTokens(parts[p]!);
    let current="";
    for(let i=0;i<tokens.length;i++){
      const token=tokens[i]!;
      if(width(current+token)>maxWidth && current){
        lines.push(current);
        if(lines.length>=maxLines){truncated=true;break outer;}
        current=token;
      }else current+=token;
    }
    lines.push(current);
    if(lines.length>=maxLines && p<parts.length-1){truncated=true;break;}
  }
  if(!lines.length)lines.push("");
  if(lines.length>maxLines){truncated=true;lines.length=maxLines;}
  if(truncated){
    const last=lines.length-1;
    let value=lines[last]!;
    const tokens=graphemeTokens(value);
    while(tokens.length && width(tokens.join("")+"…")>maxWidth)tokens.pop();
    lines[last]=tokens.join("")+"…";
  }
  const widest=lines.reduce((best,line)=>{
    const metrics=measure?.(line);
    return width(line)>width(best)?line:best;
  },"");
  const metrics=measure?.(widest);
  const base=diagramLabelReservationV010(anchor,widest,metrics);
  const advance=14*(lines.length-1);
  return {lines,truncated,box:{
    x:base.x,y:base.y-advance/2,
    width:base.width,height:base.height+advance
  }};
}
