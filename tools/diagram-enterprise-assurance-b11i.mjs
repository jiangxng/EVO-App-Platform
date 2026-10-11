/** B11i: B-Class synthetic presentation QA, not production App save implementation. */
export function twoWriterRaceV010(initialToken,firstExpected,secondExpected){if(![initialToken,firstExpected,secondExpected].every(x=>typeof x==="string"&&/^(0|[1-9][0-9]*)$/.test(x)&&Number.isSafeInteger(Number(x))))throw Error("invalid token");
 let token=initialToken,winners=0,rejections=0;for(const expected of [firstExpected,secondExpected]){if(expected===token){token=String(Number(token)+1);winners++}else rejections++}
 return {schema:"B11i-sequential-cas-race-model",wins:winners,rejected:rejections,finalToken:token,caveat:"sequential model, not real concurrent storage guarantee"};
}
