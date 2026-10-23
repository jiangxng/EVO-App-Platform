const { execFileSync } = require('node:child_process');

// One-time, owner-authorized cleanup. Never infer targets from branch prefixes.
const cleanupBranch = 'chore/governance-merged-ref-retirement-20261022';
const files = [
  '.github/workflows/governance-merged-ref-retirement-20261022.yml',
  'tools/governance-branch-retirement-20261022.cjs',
  'tests/protocol/governance-branch-retirement-20261022.test.mjs'
];
const targets = [
  { pr: 1101, name: 'fix/governance-oidc-transaction-budget-20261022',
    sha: 'fad5559569a078e6f4dd73de29625b1f1959b451', merge: '2811789dd7df7e5deb90ac8c772811b82d71820f' },
  { pr: 1102, name: 'fix/governance-memory-intake-budget-20261022',
    sha: 'ef05c3cb11178331e90770ee533a26eb5db7e6fc', merge: 'b732ed64873523587609bd2dcb8add9ff696ba08' },
  { pr: 1106, name: 'docs/governance-architecture-admission-closeout-20261022',
    sha: '5b886053115a58612cd0ee1e21935600815d25ca', merge: '05c699637b42ee42b5cba882ade1e8e02422f480' }
];

async function retire({ github, context, core, runGit = execFileSync }) {
  const { owner, repo } = context.repo;
  const full = owner + '/' + repo;
  if (full !== 'jiangxng/EVO-App-Platform') throw Error('Unexpected repository');
  const execute = context.eventName === 'push' && context.ref === 'refs/heads/main';
  if (!execute && context.eventName !== 'pull_request') throw Error('Unsupported event');
  const head = async name => {
    try { return (await github.rest.git.getRef({ owner, repo, ref: 'heads/' + name })).data.object.sha; }
    catch (error) { if (error.status === 404) return null; throw error; }
  };
  const ancestor = async (base, tip) => {
    const c = (await github.rest.repos.compareCommits({ owner, repo, base, head: tip })).data;
    if (c.behind_by !== 0 || c.merge_base_commit?.sha !== base) throw Error('Non-ancestor: ' + base);
  };
  const reserved = async () => {
    const open = await github.paginate(github.rest.pulls.list, { owner, repo, state: 'open', per_page: 100 });
    const refs = new Set(['main']);
    for (const p of open) {
      refs.add(p.base.ref);
      if (p.head.repo?.full_name === full) refs.add(p.head.ref);
    }
    return refs;
  };
  const main = (await github.rest.repos.getBranch({ owner, repo, branch: 'main' })).data.commit.sha;
  let own;
  if (execute) {
    const closed = await github.paginate(github.rest.pulls.list,
      { owner, repo, state: 'closed', head: owner + ':' + cleanupBranch, per_page: 100 });
    const candidates = closed.filter(p => p.merged_at && p.merge_commit_sha === context.sha &&
      p.base.ref === 'main' && p.head.ref === cleanupBranch && p.head.repo?.full_name === full);
    if (candidates.length !== 1) throw Error('No unique merged cleanup PR for this push');
    own = (await github.rest.pulls.get({ owner, repo, pull_number: candidates[0].number })).data;
    if (!own.merged || own.merge_commit_sha !== context.sha) throw Error('Cleanup merge proof changed');
    await ancestor(context.sha, main);
  } else {
    const p = context.payload.pull_request;
    if (!p?.number) throw Error('Missing audit PR');
    own = (await github.rest.pulls.get({ owner, repo, pull_number: p.number })).data;
    if (own.state !== 'open' || own.merged || own.head.sha !== p.head.sha) throw Error('Audit PR changed');
  }
  if (own.base.ref !== 'main' || own.head.ref !== cleanupBranch || own.head.repo?.full_name !== full ||
      !/^[a-f0-9]{40}$/.test(own.head.sha)) throw Error('Unexpected cleanup PR identity');
  const changed = await github.paginate(github.rest.pulls.listFiles,
    { owner, repo, pull_number: own.number, per_page: 100 });
  if (changed.length !== files.length || files.some(f => !changed.some(c => c.filename === f))) {
    throw Error('Cleanup PR scope changed');
  }
  const auditTip = execute ? context.sha : own.head.sha;
  const eligible = [];
  const prepare = async target => {
    await ancestor(target.sha, auditTip);
    const current = await head(target.name);
    if (current === null) { core.info('ALREADY_ABSENT ' + target.name); return; }
    if (current !== target.sha) throw Error('Moved ref: ' + target.name);
    if ((await reserved()).has(target.name)) throw Error('Open PR reference: ' + target.name);
    const b = (await github.rest.repos.getBranch({ owner, repo, branch: target.name })).data;
    if (b.protected || b.commit.sha !== target.sha) throw Error('Protected or moved branch: ' + target.name);
    eligible.push(target);
    core.info('AUDIT_ELIGIBLE ' + target.name + ' @ ' + target.sha);
  };
  // Preflight every target before attempting any deletion.
  for (const t of targets) {
    const p = (await github.rest.pulls.get({ owner, repo, pull_number: t.pr })).data;
    if (!p.merged || p.base.ref !== 'main' || p.head.repo?.full_name !== full ||
        p.head.ref !== t.name || p.head.sha !== t.sha || p.merge_commit_sha !== t.merge) {
      throw Error('Merged PR proof changed: #' + t.pr);
    }
    await ancestor(t.merge, main);
    await prepare(t);
  }
  if (!execute) { core.info('AUDIT_ONLY_GOVERNANCE_RETIREMENT'); return { execute, eligible }; }
  await prepare({ name: cleanupBranch, sha: own.head.sha });
  const active = await reserved();
  for (const t of eligible) {
    if (active.has(t.name) || await head(t.name) !== t.sha) throw Error('Ref raced: ' + t.name);
  }
  if (eligible.length) {
    // Server-side leases protect the last-read/delete window; atomic push avoids partial deletion.
    const args = ['push', '--atomic', ...eligible.map(t => '--force-with-lease=refs/heads/' + t.name + ':' + t.sha),
      'origin', ...eligible.map(t => ':refs/heads/' + t.name)];
    try { runGit('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch { throw Error('Atomic leased retirement failed; inspect remote refs before retrying'); }
  }
  for (const t of eligible) {
    if (await head(t.name) !== null) throw Error('Deletion not verified: ' + t.name);
    core.info('DELETED_VERIFIED_GOVERNANCE_REF ' + t.name + ' @ ' + t.sha);
  }
  await core.summary.addHeading('Governance merged refs retired')
    .addCodeBlock(JSON.stringify(eligible, null, 2), 'json').write();
  core.info('GOVERNANCE_MERGED_REFS_RETIREMENT_COMPLETE');
  return { execute, deleted: eligible };
}

module.exports = { retire, targets, cleanupBranch, files };
