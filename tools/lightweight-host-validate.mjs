import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';

export const roots = ['manager/server.ts', 'catalog/seed.ts'];
export const baselinePath = 'tools/lightweight-host-baseline.json';

// Inspect emitted JS: erased type imports must not become runtime dependencies.
export function imports(source, filename) {
  const emitted = ts.transpileModule(source, { fileName: filename, compilerOptions: {
    module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022
  }}).outputText;
  const ast = ts.createSourceFile(filename + '.js', emitted, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const found = [];
  function visit(node, deferred = false) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      found.push({ specifier: node.moduleSpecifier.text, kind: 'static' });
    }
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword
      || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
      const isRequire = node.expression.kind !== ts.SyntaxKind.ImportKeyword;
      if (isRequire || !deferred) {
        const argument = node.arguments[0];
        if (!argument || !ts.isStringLiteralLike(argument)) throw new Error(filename + ': computed eager module load requires explicit review');
        found.push({ specifier: argument.text, kind: isRequire ? 'require' : 'eager-dynamic' });
      }
    }
    // An immediately invoked function is startup work, not a lazy factory.
    // Preserve the surrounding deferred context: an IIFE inside an uncalled
    // factory is still deferred. Do not treat arbitrary callbacks as immediate.
    if (ts.isCallExpression(node)) {
      let callee = node.expression;
      while (ts.isParenthesizedExpression(callee)) callee = callee.expression;
      if (ts.isArrowFunction(callee) || ts.isFunctionExpression(callee)) {
        ts.forEachChild(callee, child => visit(child, deferred));
        node.arguments.forEach(argument => visit(argument, deferred));
        return;
      }
    }
    ts.forEachChild(node, child => visit(child, deferred || ts.isFunctionLike(node)));
  }
  visit(ast);
  return found;
}

export function inspect(root, entries = roots) {
  const visited = new Set();
  const edges = new Set();
  function walk(file) {
    if (visited.has(file)) return;
    visited.add(file);
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    for (const item of imports(source, file)) {
      if (!item.specifier.startsWith('.')) continue;
      const raw = path.posix.normalize(path.posix.join(path.posix.dirname(file), item.specifier));
      const candidates = [raw.replace(/\.js$/, '.ts'), raw, raw + '.ts', raw + '/index.ts'];
      const target = candidates.find(candidate => fs.existsSync(path.join(root, candidate)) && fs.statSync(path.join(root, candidate)).isFile());
      if (!target) throw new Error(file + ': unresolved runtime import ' + item.specifier);
      if (/^(apps|providers|agents)\//.test(target)) edges.add(file + ' -> ' + target + ' [' + item.kind + ']');
      if (/\.[cm]?[jt]sx?$/.test(target)) walk(target);
    }
  }
  entries.forEach(walk);
  return { edges: [...edges].sort(), visited: visited.size };
}

export function compare(actual, allowed) {
  const expected = new Set(allowed);
  const current = new Set(actual);
  return {
    added: actual.filter(edge => !expected.has(edge)),
    removed: allowed.filter(edge => !current.has(edge))
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const baseline = JSON.parse(fs.readFileSync(path.join(root, baselinePath), 'utf8'));
  const result = inspect(root);
  const delta = compare(result.edges, baseline.edges);
  const errors = [];
  if (delta.added.length) errors.push('New eager plugin dependencies:\n' + delta.added.join('\n'));
  if (delta.removed.length) errors.push('Remove retired entries from baseline:\n' + delta.removed.join('\n'));
  const baseIndex = process.argv.indexOf('--base');
  if (baseIndex !== -1) {
    const ref = process.argv[baseIndex + 1];
    if (!/^[a-f0-9]{40}$/.test(ref ?? '')) throw new Error('--base requires a full commit SHA');
    const files = execFileSync('git', ['ls-tree', '--name-only', ref, '--', baselinePath], { cwd: root, encoding: 'utf8' });
    if (files.trim()) {
      const trusted = JSON.parse(execFileSync('git', ['show', ref + ':' + baselinePath], { cwd: root, encoding: 'utf8' }));
      const expanded = compare(baseline.edges, trusted.edges).added;
      if (expanded.length) errors.push('Baseline may shrink, not expand:\n' + expanded.join('\n'));
    } else {
      // First introduction: derive the allowance from the actual target commit.
      // CI tests this bootstrap branch against a detached checkout of that commit.
      const baseRoot = process.env.LIGHTWEIGHT_HOST_BASE_ROOT;
      if (!baseRoot) throw new Error('First introduction requires LIGHTWEIGHT_HOST_BASE_ROOT checkout');
      const checkedHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: baseRoot, encoding: 'utf8' }).trim();
      if (checkedHead !== ref) throw new Error('Baseline checkout SHA mismatch');
      const expanded = compare(baseline.edges, inspect(baseRoot).edges).added;
      if (expanded.length) errors.push('Initial baseline exceeds base code:\n' + expanded.join('\n'));
    }
  }
  console.log(JSON.stringify({ gate: 'lightweight-host-static', visitedModules: result.visited,
    legacyEagerEdges: result.edges.length, added: delta.added, removed: delta.removed, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
}
