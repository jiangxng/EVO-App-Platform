import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import retirement from '../../tools/unowned-ref-retirement-20261022.cjs';

const { retire, plan } = retirement;
const ownSha = 'a'.repeat(40), mergeSha = 'b'.repeat(40), mainSha = 'c'.repeat(40), movedSha = 'd'.repeat(40);
const archive = plan.targets.filter(t => t.mode === 'archive');
const snapshot = plan.targets.find(t => t.mode === 'merged-snapshot');

function harness(execute = false) {
  const own = { number: 9999, state: execute ? 'closed' : 'open', merged: execute,
    merged_at: execute ? '2026-10-22' : null, merge_commit_sha: mergeSha, base: { ref: 'main' },
    head: { ref: plan.cleanupBranch, sha: ownSha, repo: { full_name: plan.repository } } };
  const prs = new Map([[9999, own], [984, { number: 984, merged: true, base: { ref: 'main' }, merge_commit_sha: 'e'.repeat(40) }]]);
  for (const t of plan.targets) {
    const proof = t.prProof || (t.pr ? { pr: t.pr, head: t.sha, merged: true, merge: t.merge } : null);
    if (proof) prs.set(proof.pr, { number: proof.pr, state: 'closed', merged: proof.merged,
      base: { ref: 'main' }, head: { ref: t.name, sha: proof.head, repo: { full_name: plan.repository } },
      merge_commit_sha: proof.merge });
  }
  const state = { own, prs, refs: new Map([...plan.targets.map(t => ['heads/' + t.name, t.sha]),
    ['heads/' + plan.cleanupBranch, ownSha]]), protected: new Set(), open: [], badAncestor: null,
    badBlob: false, claimed: false, scope: plan.scopeFiles.map(filename => ({ filename })),
    calls: [], log: [], raceAtPush: null };
  const context = { repo: { owner: 'jiangxng', repo: 'EVO-App-Platform' }, eventName: execute ? 'push' : 'pull_request',
    ref: execute ? 'refs/heads/main' : 'refs/pull/9999/merge', sha: mergeSha,
    payload: { pull_request: structuredClone(own) } };
  const pulls = { list: async () => {}, listFiles: async () => {}, get: async ({ pull_number }) => ({ data: prs.get(pull_number) }) };
  const github = { rest: { pulls, git: { getRef: async ({ ref }) => {
    if (!state.refs.has(ref)) throw Object.assign(Error('absent'), { status: 404 });
    return { data: { object: { sha: state.refs.get(ref), type: 'commit' } } };
  } }, repos: {
    getBranch: async ({ branch }) => ({ data: { protected: state.protected.has(branch),
      commit: { sha: branch === 'main' ? mainSha : state.refs.get('heads/' + branch) } } }),
    compareCommits: async ({ base }) => ({ data: { behind_by: state.badAncestor === base ? 1 : 0,
      merge_base_commit: { sha: state.badAncestor === base ? movedSha : base } } }),
    getContent: async ({ path: filename, ref }) => {
      const target = plan.targets.find(t => t.files?.some(f => f.path === filename) && [t.sha, t.merge].includes(ref));
      return { data: { type: 'file', sha: state.badBlob ? movedSha : target.files.find(f => f.path === filename).sha } };
    }
  } }, paginate: async (method, args) => {
    if (method === pulls.listFiles) {
      if (args.pull_number === own.number) return state.scope;
      return plan.targets.find(t => t.pr === args.pull_number).files.map(f => ({ filename: f.path, sha: f.sha }));
    }
    assert.equal(method, pulls.list);
    if (args.state === 'closed') return state.closed ?? [own];
    if (args.state === 'all') return state.claimed ? [{ number: 11111 }] : [];
    return state.open;
  } };
  const summary = { addHeading() { return this; }, addCodeBlock() { return this; }, async write() {} };
  const core = { info: s => state.log.push(s), summary };
  const runGit = (binary, args) => {
    state.calls.push({ binary, args }); assert.equal(binary, 'git');
    if (args[0] === 'fetch') {
      assert.deepEqual(args.slice(0, 4), ['fetch', '--no-tags', '--depth=1', 'origin']);
      assert.ok(archive.some(t => t.sha === args[4])); return '';
    }
    if (args[0] === 'rev-parse') return args[2].replace('^{commit}', '') + '\n';
    assert.deepEqual(args.slice(0, 2), ['push', '--atomic']);
    if (state.raceAtPush === 'branch') state.refs.set('heads/' + archive[0].name, movedSha);
    if (state.raceAtPush === 'tag') state.refs.set('tags/' + archive[0].tag, movedSha);
    for (const arg of args.filter(a => a.startsWith('--force-with-lease='))) {
      const [fullRef, expected] = arg.slice('--force-with-lease='.length).split(':');
      if ((state.refs.get(fullRef.slice('refs/'.length)) || '') !== expected) throw Error('stale lease');
    }
    const refspecs = args.slice(args.indexOf('origin') + 1);
    for (const spec of refspecs) {
      const [sha, fullRef] = spec.split(':'), ref = fullRef.slice('refs/'.length);
      if (sha) state.refs.set(ref, sha); else state.refs.delete(ref);
    }
    return '';
  };
  return { state, context, run: () => retire({ github, context, core, runGit }) };
}

test('PR audit validates eight target modes and four free archive refs without any git mutation', async () => {
  const h = harness(); const result = await h.run();
  assert.equal(result.execute, false); assert.equal(result.eligible.length, 8);
  assert.equal(result.archives.length, 4); assert.equal(h.state.calls.length, 0);
  assert.equal(h.state.refs.size, 9);
});

test('main execution atomically creates four exact tags and deletes eight branches plus itself', async () => {
  const h = harness(true); const result = await h.run();
  assert.equal(result.deleted.length, 9); assert.equal(result.archives.length, 4);
  assert.equal(h.state.calls.filter(c => c.args[0] === 'push').length, 1);
  assert.equal(h.state.calls.filter(c => c.args[0] === 'fetch').length, 4);
  assert.equal(h.state.refs.size, 4);
  for (const t of archive) assert.equal(h.state.refs.get('tags/' + t.tag), t.sha);
  for (const t of plan.targets) assert.equal(h.state.refs.has('heads/' + t.name), false);
});

for (const [name, change, expected] of [
  ['moved target', h => h.state.refs.set('heads/' + archive.at(-1).name, movedSha), /Moved branch/],
  ['protected target', h => h.state.protected.add(archive.at(-1).name), /Protected/],
  ['open base reference', h => h.state.open.push({ base: { ref: archive[0].name }, head: { repo: null } }), /Open PR/],
  ['open head reference', h => h.state.open.push({ base: { ref: 'main' }, head: { ref: archive[0].name, repo: { full_name: plan.repository } } }), /Open PR/],
  ['changed accepted blob', h => { h.state.badBlob = true; }, /Blob not preserved/],
  ['changed merged PR', h => { h.state.prs.get(snapshot.pr).merged = false; }, /Merge proof/],
  ['merge no longer ancestral', h => { h.state.badAncestor = snapshot.merge; }, /Not ancestor/],
  ['changed closed historical PR', h => { h.state.prs.get(987).state = 'open'; }, /Historical PR/],
  ['new PR claims old source', h => { h.state.claimed = true; }, /Previously unclaimed/],
  ['occupied archive tag', h => h.state.refs.set('tags/' + archive[0].tag, movedSha), /already occupied/],
  ['missing branch without archive', h => h.state.refs.delete('heads/' + archive[0].name), /without archive/],
  ['wrong repository', h => { h.context.repo.repo = 'other'; }, /Wrong repository/],
  ['wrong push branch', h => { h.context.ref = 'refs/heads/other'; }, /Wrong event/],
  ['missing cleanup merge', h => { h.state.closed = []; }, /not unique/],
  ['changed cleanup scope', h => h.state.scope.push({ filename: 'manager/server.ts' }), /scope changed/],
  ['protected cleanup source', h => h.state.protected.add(plan.cleanupBranch), /Protected/]
]) test(name + ' aborts before any remote update', async () => {
  const h = harness(true); change(h); await assert.rejects(h.run(), expected);
  assert.equal(h.state.calls.length, 0);
});

for (const race of ['branch', 'tag']) test(race + ' race at atomic push cannot partially delete or overwrite archives', async () => {
  const h = harness(true); h.state.raceAtPush = race;
  await assert.rejects(h.run(), /Atomic archive\/retirement failed/);
  for (const t of plan.targets) assert.ok(h.state.refs.has('heads/' + t.name));
  assert.ok(h.state.refs.has('heads/' + plan.cleanupBranch));
  if (race === 'tag') assert.equal(h.state.refs.get('tags/' + archive[0].tag), movedSha);
});

test('rerun verifies existing archives when all source branches are absent', async () => {
  const h = harness(true); await h.run(); h.state.calls.length = 0;
  const result = await h.run(); assert.equal(result.deleted.length, 0); assert.equal(h.state.calls.length, 0);
});

test('native local Git preserves all refs on stale branch/tag leases, then archives complete commits', async () => {
  const h = harness(true); await h.run();
  const template = h.state.calls.find(c => c.args[0] === 'push').args;
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'repository-ref-retirement-'));
  const work = path.join(temp, 'work'), remote = path.join(temp, 'remote.git'); fs.mkdirSync(work);
  const git = args => execFileSync('git', args, { cwd: work, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  try {
    git(['init', '--bare', remote]); git(['init']); git(['remote', 'add', 'origin', remote]);
    const commit = name => { git(['-c', 'user.name=Ref Test', '-c', 'user.email=refs@example.invalid', 'commit', '--allow-empty', '-m', name]); return git(['rev-parse', 'HEAD']); };
    const first = commit('preserve source'), second = commit('concurrent update');
    const names = [...plan.targets.map(t => t.name), plan.cleanupBranch];
    git(['push', 'origin', ...names.map(n => first + ':refs/heads/' + n)]);
    const args = template.map(a => a.startsWith('--force-with-lease=refs/heads/') ? a.replace(/:[a-f0-9]{40}$/, ':' + first)
      : /^[a-f0-9]{40}:refs\/tags\//.test(a) ? a.replace(/^[a-f0-9]{40}/, first) : a);
    git(['push', 'origin', second + ':refs/heads/' + names[0]]);
    assert.notEqual(spawnSync('git', args, { cwd: work }).status, 0);
    for (const name of names) assert.ok(git(['ls-remote', '--heads', 'origin']).includes('refs/heads/' + name));
    assert.equal(git(['ls-remote', '--tags', 'origin']), '');
    git(['push', '--force-with-lease=refs/heads/' + names[0] + ':' + second, 'origin', first + ':refs/heads/' + names[0]]);
    const tag = archive[0].tag; git(['push', 'origin', second + ':refs/tags/' + tag]);
    assert.notEqual(spawnSync('git', args, { cwd: work }).status, 0);
    for (const name of names) assert.ok(git(['ls-remote', '--heads', 'origin']).includes('refs/heads/' + name));
    assert.ok(git(['ls-remote', '--tags', 'origin']).includes(second + '\trefs/tags/' + tag));
    git(['push', '--force-with-lease=refs/tags/' + tag + ':' + second, 'origin', ':refs/tags/' + tag]);
    git(args); assert.equal(git(['ls-remote', '--heads', 'origin']), '');
    const tags = git(['ls-remote', '--tags', 'origin']);
    for (const t of archive) assert.ok(tags.includes(first + '\trefs/tags/' + t.tag));
    assert.equal(tags.split('\n').length, 4);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
