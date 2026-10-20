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
export function syntheticV3WorkbookV010(options = {}) {
  const codePrefix = options.codePrefix ?? "SYN-";
  const namePrefix = options.namePrefix ?? "Synthetic Supplier ";
  if (!/^[A-Z]{3,6}-$/.test(codePrefix)
    || !/^[-A-Za-z ]{6,48}$/.test(namePrefix)) {
    throw new Error("BEX01_SYNTHETIC_XLSX_PREFIX_INVALID");
  }
  const headers=[...SYNTHETIC_V3_HEADERS];
  const rows=Array.from({length:172},(_,i)=>{
    const index=i+1,seq=String(index).padStart(4,"0");
    const missing=SYNTHETIC_V3_MISSING_ROWS.includes(index);
    return Object.fromEntries(headers.map((column,col)=>[
      column,
      col===0?codePrefix+seq:
      col===1?namePrefix+seq:
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


// Dedicated visual-parity fixture: synthetic only, never customer data.
export const SYNTHETIC_V3_VISUAL_REVIEW_HEADERS = Object.freeze([
  "往来编码","往来名称","主体类型","法定名称","税号 / 纳税识别号",
  "国家或地区","联系电话","电子邮件","备注","供应商分类","采购区域",
  "主要联系人","主要联系人职位","主要联系人电话","主要联系人邮箱","主要地址",
  "默认支付方式","结算方式","默认账期方式","账期天数","开户银行","系统编码"
]);
export function syntheticV3VisualReviewWorkbookV010() {
  const headers=[...SYNTHETIC_V3_VISUAL_REVIEW_HEADERS];
  const rows=Array.from({length:172},(_,i)=>{
    const index=i+1,seq=String(index).padStart(4,"0");
    const missing=SYNTHETIC_V3_MISSING_ROWS.includes(index);
    const values=[
      "VIS-"+seq,"V3 Visual Supplier "+seq,missing?"":"ORGANIZATION",
      "Synthetic Legal Entity "+seq,"TAX-VIS-"+seq,"中国",
      "1380000"+String(index).padStart(4,"0"),"supplier"+seq+"@example.cn",
      "Synthetic visual review row "+seq,"常规供应商","华南",
      "联系人 "+seq,"采购经理","1390000"+String(index).padStart(4,"0"),
      "contact"+seq+"@example.cn","深圳市南山区科技园 "+seq,
      "银行转账","月结","月结30天","30","招商银行深圳科技园支行","EXT-"+seq
    ];
    return Object.fromEntries(headers.map((column,col)=>[column,values[col]]));
  });
  const all=[Object.fromEntries(headers.map(x=>[x,x])),...rows];
  const xml='<worksheet><sheetData>'+all.map((values,index)=>
    '<row r="'+(index+1)+'">'+headers.map((header,col)=>{
      const value=values[header],ref=columnName(col)+(index+1);
      return '<c r="'+ref+'" t="inlineStr"><is><t>'+escapeXml(value)
        +'</t></is></c>';
    }).join("")+'</row>'
  ).join("")+'</sheetData></worksheet>';
  const entries=[
    ["xl/workbook.xml",'<workbook><sheets><sheet name="Visual review" r:id="rId1"/></sheets></workbook>'],
    ["xl/_rels/workbook.xml.rels",'<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>'],
    ["xl/worksheets/sheet1.xml",xml]
  ];
  return {bytes:storedZip(entries),headers,rows,
    missingRowNumbers:[...SYNTHETIC_V3_MISSING_ROWS],synthetic:true,productionUsed:false};
}
