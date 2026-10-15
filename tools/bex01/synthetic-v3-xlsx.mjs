/**
 * Synthetic XLSX acceptance sample ONLY. Never a customer source file.
 * The 22-column, 172-row and three-blank structure is deliberately shaped
 * like the disclosed edge cases but does not reuse any original field data.
 * ZIP is stored (method 0) so fixture generation needs no third-party library.
 */
import { Buffer } from "node:buffer";

export const SYNTHETIC_V3_HEADERS = Object.freeze([
  "往来编码", "往来名称", "主体类型", "开户银行",
  ...Array.from({length: 17}, (_, i) => "企业属性" + (i + 1)),
  "原系统备注"
]);
export const SYNTHETIC_V3_MISSING_ROWS = Object.freeze([165, 169, 172]);

function escapeXml(value) {
  return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&apos;");
}
function columnName(index) {
  let name="";
  for(let i=index+1;i>0;i=Math.floor((i-1)/26)) {
    name=String.fromCharCode(65+(i-1)%26)+name;
  }
  return name;
}
function storedZip(entries) {
  const locals=[],centrals=[];
  let offset=0;
  for(const [path,contents] of entries) {
    const name=Buffer.from(path,"utf8"),body=Buffer.from(contents,"utf8");
    const local=Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50,0);
    local.writeUInt16LE(20,4);
    local.writeUInt32LE(body.length,18);
    local.writeUInt32LE(body.length,22);
    local.writeUInt16LE(name.length,26);
    locals.push(local,name,body);
    const central=Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50,0);
    central.writeUInt16LE(20,4);
    central.writeUInt16LE(20,6);
    central.writeUInt32LE(body.length,20);
    central.writeUInt32LE(body.length,24);
    central.writeUInt16LE(name.length,28);
    central.writeUInt32LE(offset,42);
    centrals.push(central,name);
    offset+=local.length+name.length+body.length;
  }
  const listing=Buffer.concat(centrals),end=Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50,0);
  end.writeUInt16LE(entries.length,8);
  end.writeUInt16LE(entries.length,10);
  end.writeUInt32LE(listing.length,12);
  end.writeUInt32LE(offset,16);
  return Buffer.concat([...locals,listing,end]);
}
export function syntheticV3WorkbookV010() {
  const headers=[...SYNTHETIC_V3_HEADERS];
  const rows=Array.from({length:172},(_,i)=>{
    const index=i+1,seq=String(index).padStart(4,"0");
    const missing=SYNTHETIC_V3_MISSING_ROWS.includes(index);
    return Object.fromEntries(headers.map((column,col)=>[
      column,
      col===0?"SYN-"+seq:
      col===1?"Synthetic Supplier "+seq:
      col===2?(missing?"":"ORGANIZATION"):
      col===3?"测试银行-"+(index%3+1):
      col===21?"legacy-"+seq:
      "synthetic-"+String(col)+"-"+seq
    ]));
  });
  const all=[Object.fromEntries(headers.map(x=>[x,x])),...rows];
  const xml='<worksheet><sheetData>'+all.map((values,index)=>
    '<row r="'+(index+1)+'">'+headers.map((header,col)=>{
      const value=values[header];
      const ref=columnName(col)+(index+1);
      return '<c r="'+ref+'" t="inlineStr"><is><t>'+escapeXml(value)
        +'</t></is></c>';
    }).join("")+'</row>'
  ).join("")+'</sheetData></worksheet>';
  const entries=[
    ["xl/workbook.xml",'<workbook><sheets><sheet name="Synthetic" r:id="rId1"/></sheets></workbook>'],
    ["xl/_rels/workbook.xml.rels",'<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>'],
    ["xl/worksheets/sheet1.xml",xml]
  ];
  return {
    bytes:storedZip(entries),headers,rows,
    missingRowNumbers:[...SYNTHETIC_V3_MISSING_ROWS],
    synthetic:true
  };
}
