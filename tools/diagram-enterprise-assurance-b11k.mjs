/** B11k local evidence-policy regression. NOT independent customer consent verification. */
export function safeErrorReportV010(error){const code=typeof error?.code==="string"?error.code:"";const allow=new Set(["DEFINITION_PROJECTION_WRITE_CONFLICT","DEFINITION_PROJECTION_REVISION_CONFLICT","DEFINITION_PROJECTION_WRITE_TOKEN_INVALID","DEFINITION_PROJECTION_WRITE_TOKEN_REQUIRED"]);return{schema:"B11k-error-codes-only",category:allow.has(code)?code:"UNCLASSIFIED_ERROR",disclosure:"Never serialize exception text, customer graph, stack or paths"};
}
