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
