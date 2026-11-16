#!/usr/bin/env node
/**
 * Guard visibility of intentionally omitted physical PostgreSQL proofs.
 * A green generic suite is never evidence of those skipped PG proofs.
 *
 * Usage: node tools/ecosystem-skip-proof-inventory.mjs <node-test-tap-log>
 * No deployment, database access or permission changes.
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const BASELINE_SKIPPED_PHYSICAL_PG_V010 = 127;
const PHYSICAL_PG_REASON = /PostgreSQL|Postgres|PG(?:16|18)?|_DATABASE_URL|localhost\/(?:cv03proof|cv04_ci)/i;

export function classifyPhysicalPgProof(name) {
  if (/^(?:CV03|CV-03|N1-|C3-)/i.test(name)) return "CV03";
  if (/^CV04/i.test(name)) return "CV04";
  if (/^(?:PA02|PA-02|Host injected async|Host configured read-through|Host action get)/i.test(name))
    return "PA02";
  if (/^PA04/i.test(name)) return "PA04";
  if (/^(?:PA05|E01J)/i.test(name)) return "PA05";
  return "UNCLASSIFIED";
}

export function auditEcosystemSkipProofs(tap, baseline = BASELINE_SKIPPED_PHYSICAL_PG_V010) {
  if (typeof tap !== "string" || tap.length === 0)
    throw Error("ECOSYSTEM_TAP_MISSING");
  const skipped = [];
  for (const line of tap.split(/\r?\n/u)) {
    // GitHub Actions prefixes each line with a UTC timestamp. Local runs do not.
    const match = line.match(/(?:^|\s)ok\s+(\d+)\s+-\s+(.*?)\s+# SKIP\s+(.+)$/u);
    if (match) skipped.push({ testId: Number(match[1]), name: match[2], reason: match[3] });
  }
  const extractSummary = label => {
    const matches = [...tap.matchAll(new RegExp(`(?:^|\\n)(?:\\S+\\s+)?# ${label} (\\d+)(?=\\s|$)`, "gu"))];
    return matches.length ? Number(matches.at(-1)[1]) : undefined;
  };
  const tests = extractSummary("tests"), passed = extractSummary("pass");
  const failed = extractSummary("fail"), skippedTotal = extractSummary("skipped");
  if (![tests, passed, failed, skippedTotal].every(Number.isSafeInteger))
    throw Error("ECOSYSTEM_TAP_SUMMARY_MISSING");
  if (tests !== passed + failed + skippedTotal || skippedTotal !== skipped.length)
    throw Error(`ECOSYSTEM_TAP_COUNTS_MISMATCH: tests=${tests} pass=${passed} fail=${failed} skip=${skippedTotal} parsed=${skipped.length}`);
  if (failed !== 0) throw Error(`ECOSYSTEM_FULL_SUITE_FAILED: ${failed}`);
  if (skipped.length > baseline)
    throw Error(`ECOSYSTEM_UNREVIEWED_SKIP_GROWTH: baseline=${baseline} actual=${skipped.length}`);

  const groups = { CV03: 0, CV04: 0, PA02: 0, PA04: 0, PA05: 0 };
  for (const proof of skipped) {
    const group = classifyPhysicalPgProof(proof.name);
    if (group === "UNCLASSIFIED" || !PHYSICAL_PG_REASON.test(proof.reason))
      throw Error(`ECOSYSTEM_UNREVIEWED_SKIP: ${proof.testId} ${proof.name} / ${proof.reason}`);
    groups[group]++;
  }
  return { tests, passed, failed, skipped: skippedTotal, groups,
    warning: "SKIPPED_PHYSICAL_POSTGRES_PROOFS_ARE_NOT_PASSED_OR_PRODUCTION_CERTIFIED" };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (!process.argv[2]) throw Error("ECOSYSTEM_TAP_PATH_REQUIRED");
    const report = auditEcosystemSkipProofs(readFileSync(process.argv[2], "utf8"));
    console.log("ECOSYSTEM_PHYSICAL_PG_SKIP_INVENTORY_PASS " + JSON.stringify(report));
  } catch (error) {
    console.error("ECOSYSTEM_PHYSICAL_PG_SKIP_INVENTORY_FAIL " + String(error));
    process.exitCode = 1;
  }
}
