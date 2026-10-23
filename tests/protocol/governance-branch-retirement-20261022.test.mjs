import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import retirement from '../../tools/governance-branch-retirement-20261022.cjs';

const { retire, targets, cleanupBranch, files } = retirement;
const ownSha = 'a'.repeat(40), mainSha = 'b'.repeat(40), mergeSha = 'c'.repeat(40);
const full = 'jiangxng/EVO-App-Platform';

function harness(execute = false) {
  const own = { number: 9999, state: execute ? 'closed' : 'open', merged: execute,
    merged_at: execute ? '2026-10-22T00:00:00Z' : null, merge_commit_sha: mergeSha,
    base: { ref: 'main' }, head: { ref: cleanupBranch, sha: ownSha, repo: { full_name: full } } };
  const prs = new Map(targets.map(t => [t.pr, { number: t.pr, merged: true, base: { ref: 'main' },
    head: { ref: t.name, sha: t.sha, repo: { full_name: full } }, merge_commit_sha: t.merge }]));
  prs.set(own.number, own);
  const state = { own, prs, refs: new Map([...targets.map(t => [t.name, t.sha]), [cleanupBranch, ownSha]]),
    protected: new Set(), open: [], openCalls: 0, scope: files.map(filename => ({ filename })),
    badAncestor: null, getCalls: new Map(), gitCalls: [], info: [], raceAtPush: false, raceAtRead: false,
    openAfter: Infinity };
  const context = { repo: { owner: 'jiangxng', repo: 'EVO-App-Platform' },
    eventName: execute ? 'push' : 'pull_request', ref: execute ? 'refs/heads/main' : 'refs/pull/9999/merge',
    sha: mergeSha, payload: { pull_request: structuredClone(own) } };
  const pulls = { get: async ({ pull_number }) => ({ data: prs.get(pull_number) }),
    list: async () => {}, listFiles: async () => {} };
  const github = { rest: { pulls,
    git: { getRef: async ({ ref }) => {
      const name = ref.slice('heads/'.length), count = (state.getCalls.get(name) || 0) + 1;
      state.getCalls.set(name, count);
      if (state.raceAtRead && name === targets[0].name && count === 2) state.refs.set(name, 'd'.repeat(40));
      if (!state.refs.has(name)) throw Object.assign(Error('Absent'), { status: 404 });
      return { data: { object: { sha: state.refs.get(name) } } };
    } },
    repos: {
      getBranch: async ({ branch }) => ({ data: { protected: state.protected.has(branch),
        commit: { sha: branch === 'main' ? mainSha : state.refs.get(branch) } } }),
      compareCommits: async ({ base }) => ({ data: { behind_by: state.badAncestor === base ? 1 : 0,
        merge_base_commit: { sha: state.badAncestor === base ? '0'.repeat(40) : base } } })
    } },
    paginate: async (method, args) => {
      if (method === pulls.listFiles) return state.scope;
      assert.equal(method, pulls.list);
      if (args.state === 'closed') return state.closed ?? [own];
      state.openCalls++;
      return state.openCalls >= state.openAfter ? [{ base: { ref: targets[0].name },
        head: { ref: 'foreign', repo: { full_name: 'other/repo' } } }] : state.open;
    }
  };
  const summary = { addHeading() { return this; }, addCodeBlock() { return this; }, async write() {} };
  const core = { info: value => state.info.push(value), summary };
  const runGit = (binary, args, options) => {
    state.gitCalls.push({ binary, args, options });
    assert.equal(binary, 'git');
    assert.deepEqual(args.slice(0, 2), ['push', '--atomic']);
    const leases = args.filter(a => a.startsWith('--force-with-lease='));
    const removals = args.filter(a => a.startsWith(':refs/heads/')).map(a => a.slice(':refs/heads/'.length));
    assert.equal(leases.length, removals.length);
    if (state.raceAtPush) state.refs.set(targets[0].name, 'd'.repeat(40));
    // Model server validation before the atomic update: no deletion on any stale lease.
    for (const name of removals) {
      const expected = leases.find(l => l.startsWith('--force-with-lease=refs/heads/' + name + ':'))?.split(':').at(-1);
      if (state.refs.get(name) !== expected) throw Error('Stale lease');
    }
    for (const name of removals) state.refs.delete(name);
    return '';
  };
  return { state, context, run: () => retire({ github, context, core, runGit }) };
}

test('PR audit verifies the three exact targets and cannot execute git', async () => {
  const h = harness();
  const result = await h.run();
  assert.equal(result.execute, false);
  assert.equal(result.eligible.length, 3);
  assert.equal(h.state.gitCalls.length, 0);
  assert.equal(h.state.refs.size, 4);
});

test('main push atomically deletes only pinned targets and its verified merged source', async () => {
  const h = harness(true);
  const result = await h.run();
  assert.equal(result.deleted.length, 4);
  assert.equal(h.state.refs.size, 0);
  assert.equal(h.state.gitCalls.length, 1);
  const args = h.state.gitCalls[0].args;
  for (const t of [...targets, { name: cleanupBranch, sha: ownSha }]) {
    assert.ok(args.includes('--force-with-lease=refs/heads/' + t.name + ':' + t.sha));
    assert.ok(args.includes(':refs/heads/' + t.name));
  }
  assert.equal(h.state.info.filter(s => s.startsWith('DELETED_VERIFIED')).length, 4);
});

for (const [name, change, expected] of [
  ['moved target', h => h.state.refs.set(targets[2].name, 'd'.repeat(40)), /Moved ref/],
  ['protected target', h => h.state.protected.add(targets[2].name), /Protected/],
  ['open PR base', h => h.state.open.push({ base: { ref: targets[2].name }, head: { repo: null } }), /Open PR reference/],
  ['open PR head', h => h.state.open.push({ base: { ref: 'main' }, head: { ref: targets[2].name, repo: { full_name: full } } }), /Open PR reference/],
  ['non-ancestor merge', h => { h.state.badAncestor = targets[2].merge; }, /Non-ancestor/],
  ['unmerged target PR', h => { h.state.prs.get(targets[2].pr).merged = false; }, /Merged PR proof/],
  ['changed PR head proof', h => { h.state.prs.get(targets[2].pr).head.sha = 'd'.repeat(40); }, /Merged PR proof/],
  ['unexpected PR files', h => h.state.scope.push({ filename: 'manager/server.ts' }), /scope changed/],
  ['wrong repository', h => { h.context.repo.repo = 'another'; }, /Unexpected repository/],
  ['push to another branch', h => { h.context.ref = 'refs/heads/other'; }, /Unsupported event/],
  ['missing own merged proof', h => { h.state.closed = []; }, /No unique merged cleanup PR/],
  ['moved cleanup source', h => h.state.refs.set(cleanupBranch, 'd'.repeat(40)), /Moved ref/],
  ['protected cleanup source', h => h.state.protected.add(cleanupBranch), /Protected/],
  ['read race', h => { h.state.raceAtRead = true; }, /Ref raced/],
  ['late open PR reference', h => { h.state.openAfter = 5; }, /Ref raced/]
]) {
  test(name + ' aborts the whole batch before any deletion', async () => {
    const h = harness(true); change(h);
    const before = new Map(h.state.refs);
    await assert.rejects(h.run(), expected);
    assert.equal(h.state.gitCalls.length, 0);
    for (const name of before.keys()) assert.ok(h.state.refs.has(name));
  });
}

test('server lease rejects a race after the final API read with no partial deletion', async () => {
  const h = harness(true); h.state.raceAtPush = true;
  await assert.rejects(h.run(), /Atomic leased retirement failed/);
  assert.equal(h.state.gitCalls.length, 1);
  assert.equal(h.state.refs.size, 4);
});

test('rerun safely accepts already absent targets and cleanup source', async () => {
  const h = harness(true); h.state.refs.clear();
  const result = await h.run();
  assert.equal(result.deleted.length, 0);
  assert.equal(h.state.gitCalls.length, 0);
});

test('stale audit payload or another cleanup source cannot authorize execution', async () => {
  const h = harness(); h.context.payload.pull_request.head.sha = 'd'.repeat(40);
  await assert.rejects(h.run(), /Audit PR changed/);
  assert.equal(h.state.gitCalls.length, 0);
  const other = harness(); other.state.own.head.ref = 'chore/other';
  await assert.rejects(other.run(), /Unexpected cleanup PR identity/);
  assert.equal(other.state.gitCalls.length, 0);
});

test('native local Git verifies atomic deletion and stale-lease rejection', async () => {
  const h = harness(true); await h.run();
  const template = h.state.gitCalls[0].args;
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'governance-retirement-git-'));
  const work = path.join(temp, 'work'), remote = path.join(temp, 'remote.git');
  const git = args => execFileSync('git', args, { cwd: work, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  try {
    fs.mkdirSync(work);
    git(['init', '--bare', remote]);
    git(['init']); git(['remote', 'add', 'origin', remote]);
    const commit = message => {
      git(['-c', 'user.name=Retirement Test', '-c', 'user.email=retirement@example.invalid',
        'commit', '--allow-empty', '-m', message]);
      return git(['rev-parse', 'HEAD']);
    };
    const first = commit('initial');
    const names = [...targets.map(t => t.name), cleanupBranch];
    git(['push', 'origin', ...names.map(name => first + ':refs/heads/' + name)]);
    const second = commit('concurrent branch update');
    git(['push', 'origin', second + ':refs/heads/' + names[0]]);
    const leaseArgs = moved => template.map(arg => {
      if (!arg.startsWith('--force-with-lease=')) return arg;
      const ref = arg.slice('--force-with-lease='.length).split(':')[0];
      return '--force-with-lease=' + ref + ':' + (moved && ref === 'refs/heads/' + names[0] ? second : first);
    });
    const stale = spawnSync('git', leaseArgs(false), { cwd: work, encoding: 'utf8' });
    assert.notEqual(stale.status, 0);
    const retained = git(['ls-remote', '--heads', 'origin']);
    for (const name of names) assert.ok(retained.includes('refs/heads/' + name));
    assert.ok(retained.includes(second + '\trefs/heads/' + names[0]));
    git(leaseArgs(true));
    assert.equal(git(['ls-remote', '--heads', 'origin']), '');
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
