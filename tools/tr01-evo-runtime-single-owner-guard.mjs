// Scoped single-owner architecture protection. No Platform runtime/finance logic.
// EVO (not the App Platform) is the source of FIFO, costing, allocation,
// Posting, Ledger and replay execution. Platform may authorize and invoke
// a public versioned EVO capability, but may not implement a second engine.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const EVO_SINGLE_OWNER_SOURCE_ROOTS_V010 = Object.freeze([
  'apps', 'providers', 'manager', 'catalog'
]);

const forbidden = Object.freeze([
  {
    pattern: /(?:from\s*|import\s*\()\s*['"][^'"]*(?:\/modules\/(?:cost|allocation|valuation|ledger|posting|replay)(?:\/|['"]))/u,
    reason: 'private EVO finance/ledger module imported into App Platform'
  },
  {
    pattern: /\b(?:class|function)\s+(?:CostEngine|AllocationEngine|FifoCostEngine|LedgerPostingEngine|AllocationInstructionWriter|AllocationRelationWriter)\b/u,
    reason: 'duplicate financial/ledger engine declaration'
  },
  {
    pattern: /\bnew\s+(?:CostEngine|AllocationEngine|FifoCostEngine|LedgerPostingEngine)\s*\(/u,
    reason: 'duplicate financial/ledger engine construction'
  },
  {
    pattern: /\b(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE)\s+["'`\w.]*\b(?:ledger_entry|ledger_balance|cost_run|cost_result|allocation_instruction|allocation_relation|allocation_run)\b/iu,
    reason: 'direct write/schema ownership of EVO ledger, cost or allocation facts'
  },
  {
    pattern: /\b(?:function|const)\s+(?:compute|calculate|execute|run)(?:FIFO|Fifo|CostAllocation|CashAllocation|LedgerPosting|CostRun)\b/u,
    reason: 'duplicate finance algorithm'
  }
]);

// Inspect module code rather than textual descriptions/comments.
function executableSource(source) {
  return source.replace(/\/\*[\s\S]*?\*\/|^\s*\/\/[^\n]*/gm,'');
}
export function inspectEvoRuntimeSingleOwnerV010(files) {
  const errors = [];
  for (const [path, raw] of Object.entries(files)) {
    const src = executableSource(raw);
    for (const entry of forbidden) {
      if (entry.pattern.test(src)) {
        errors.push('EVO_SINGLE_OWNER_VIOLATION: '+path+': '+entry.reason);
      }
    }
  }
  return errors;
}

export function collectEvoRuntimeBoundarySourcesV010(rootDir) {
  const output = {};
  function visit(root) {
    for (const entry of readdirSync(root,{withFileTypes:true})) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      const abs=join(root,entry.name);
      if (entry.isDirectory()) visit(abs);
      else if (entry.isFile() && /\.(?:ts|tsx|js|mjs)$/u.test(entry.name)) {
        output[relative(rootDir,abs).replaceAll('\\','/')] = readFileSync(abs,'utf8');
      }
    }
  }
  for (const name of EVO_SINGLE_OWNER_SOURCE_ROOTS_V010) visit(join(rootDir,name));
  return output;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root=fileURLToPath(new URL('../',import.meta.url));
  const errors=inspectEvoRuntimeSingleOwnerV010(
    collectEvoRuntimeBoundarySourcesV010(root));
  if (errors.length) {
    errors.forEach(error=>console.error(error));
    process.exitCode=1;
  } else {
    console.log('EVO_LEDGER_FIFO_ALLOCATION_SINGLE_OWNER=PASS');
  }
}
