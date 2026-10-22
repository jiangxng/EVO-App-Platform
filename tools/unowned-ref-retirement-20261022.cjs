const { execFileSync } = require('node:child_process');
const plan = require('../repository-hygiene/unowned-refs-20261022.json');

async function retire({ github, context, core, runGit = execFileSync }) {
  const { owner, repo } = context.repo;
  const full = owner + '/' + repo;
  if (full !== plan.repository || full !== 'jiangxng/EVO-App-Platform') throw Error('Wrong repository');
  const execute = context.eventName === 'push' && context.ref === 'refs/heads/main';
  if (!execute && context.eventName !== 'pull_request') throw Error('Wrong event');
  const ref = async name => {
    try { return (await github.rest.git.getRef({ owner, repo, ref: name })).data.object; }
    catch (e) { if (e.status === 404) return null; throw e; }
  };
  const ancestor = async (base, head) => {
    const c = (await github.rest.repos.compareCommits({ owner, repo, base, head })).data;
    if (c.behind_by !== 0 || c.merge_base_commit?.sha !== base) throw Error('Not ancestor: ' + base);
  };
  const reserved = async () => {
    const prs = await github.paginate(github.rest.pulls.list, { owner, repo, state: 'open', per_page: 100 });
    const names = new Set(['main']);
    for (const p of prs) { names.add(p.base.ref); if (p.head.repo?.full_name === full) names.add(p.head.ref); }
    return names;
  };
  const main = (await github.rest.repos.getBranch({ owner, repo, branch: 'main' })).data.commit.sha;
  await ancestor(plan.baseline, main);
  let own;
  if (execute) {
    const closed = await github.paginate(github.rest.pulls.list,
      { owner, repo, state: 'closed', head: owner + ':' + plan.cleanupBranch, per_page: 100 });
    const matches = closed.filter(p => p.merged_at && p.merge_commit_sha === context.sha &&
      p.head.ref === plan.cleanupBranch && p.base.ref === 'main' && p.head.repo?.full_name === full);
    if (matches.length !== 1) throw Error('Cleanup merged PR not unique');
    own = (await github.rest.pulls.get({ owner, repo, pull_number: matches[0].number })).data;
    if (!own.merged || own.merge_commit_sha !== context.sha) throw Error('Cleanup merge changed');
    await ancestor(context.sha, main);
    await ancestor(own.head.sha, main);
  } else {
    const p = context.payload.pull_request;
    if (!p?.number) throw Error('Missing audit PR');
    own = (await github.rest.pulls.get({ owner, repo, pull_number: p.number })).data;
    if (own.state !== 'open' || own.merged || own.head.sha !== p.head.sha) throw Error('Audit PR changed');
  }
  if (own.head.ref !== plan.cleanupBranch || own.base.ref !== 'main' ||
      own.head.repo?.full_name !== full || !/^[a-f0-9]{40}$/.test(own.head.sha)) throw Error('Wrong cleanup source');
  const changed = await github.paginate(github.rest.pulls.listFiles,
    { owner, repo, pull_number: own.number, per_page: 100 });
  if (changed.length !== plan.scopeFiles.length || plan.scopeFiles.some(f => !changed.some(c => c.filename === f))) {
    throw Error('Cleanup scope changed');
  }
  const eligible = [], archives = [], seen = new Set();
  const prepare = async t => {
    const current = await ref('heads/' + t.name);
    const tag = t.tag ? await ref('tags/' + t.tag) : null;
    if (!current) {
      if (t.tag && (tag?.sha !== t.sha || tag.type !== 'commit')) throw Error('Absent branch without archive: ' + t.name);
      core.info('ALREADY_ABSENT ' + t.name); return;
    }
    if (current.sha !== t.sha || current.type !== 'commit') throw Error('Moved branch: ' + t.name);
    if ((await reserved()).has(t.name)) throw Error('Open PR reference: ' + t.name);
    const b = (await github.rest.repos.getBranch({ owner, repo, branch: t.name })).data;
    if (b.protected || b.commit.sha !== t.sha) throw Error('Protected or moved branch: ' + t.name);
    if (t.tag) {
      if (tag) throw Error('Archive tag already occupied: ' + t.tag);
      archives.push(t);
      core.info('ARCHIVE_REQUIRED ' + t.tag + ' @ ' + t.sha);
    }
    eligible.push(t);
    core.info('AUDIT_ELIGIBLE ' + t.name + ' @ ' + t.sha + ' [' + t.mode + ']');
  };
  for (const t of plan.targets) {
    if (seen.has(t.name) || t.name === 'main' || !/^[a-f0-9]{40}$/.test(t.sha)) throw Error('Invalid target');
    seen.add(t.name);
    if (t.mode === 'ancestor') await ancestor(t.sha, main);
    else if (t.mode === 'merged-snapshot') {
      const p = (await github.rest.pulls.get({ owner, repo, pull_number: t.pr })).data;
      if (!p.merged || p.base.ref !== 'main' || p.head.repo?.full_name !== full ||
          p.head.ref !== t.name || p.head.sha !== t.sha || p.merge_commit_sha !== t.merge) throw Error('Merge proof changed');
      await ancestor(t.merge, main);
      const files = await github.paginate(github.rest.pulls.listFiles,
        { owner, repo, pull_number: t.pr, per_page: 100 });
      if (files.length !== t.files.length || t.files.some(f => !files.some(x => x.filename === f.path && x.sha === f.sha))) {
        throw Error('Merged file set changed');
      }
      for (const f of t.files) {
        for (const revision of [t.sha, t.merge]) {
          const content = (await github.rest.repos.getContent({ owner, repo, path: f.path, ref: revision })).data;
          if (Array.isArray(content) || content.type !== 'file' || content.sha !== f.sha) throw Error('Blob not preserved: ' + f.path);
        }
      }
    } else if (t.mode === 'archive') {
      if (t.tag !== 'archive/retired-20261022/' + t.name) throw Error('Invalid archive tag');
      if (t.prProof) {
        const p = (await github.rest.pulls.get({ owner, repo, pull_number: t.prProof.pr })).data;
        if (p.state !== 'closed' || !!p.merged !== t.prProof.merged || p.head.ref !== t.name ||
            p.head.repo?.full_name !== full || p.head.sha !== t.prProof.head ||
            p.merge_commit_sha !== t.prProof.merge) throw Error('Historical PR proof changed');
        await ancestor(t.prProof.head, t.sha);
        if (p.merged) await ancestor(t.prProof.merge, main);
      } else if (t.noPrExpected) {
        const prs = await github.paginate(github.rest.pulls.list,
          { owner, repo, state: 'all', head: owner + ':' + t.name, per_page: 100 });
        if (prs.length) throw Error('Previously unclaimed branch now has PR history');
      } else throw Error('Missing ownership proof');
      if (t.supersededBy) {
        const p = (await github.rest.pulls.get({ owner, repo, pull_number: t.supersededBy })).data;
        if (!p.merged || p.base.ref !== 'main') throw Error('Replacement PR not merged');
        await ancestor(p.merge_commit_sha, main);
      }
    } else throw Error('Unknown mode');
    await prepare(t);
  }
  if (!execute) { core.info('AUDIT_ONLY_UNOWNED_REFS'); return { execute, eligible, archives }; }
  await prepare({ name: plan.cleanupBranch, sha: own.head.sha, mode: 'own-merged-source' });
  // Fetch exact archived objects without checking out any abandoned branch code.
  for (const t of archives) {
    runGit('git', ['fetch', '--no-tags', '--depth=1', 'origin', t.sha], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    if (runGit('git', ['rev-parse', '--verify', t.sha + '^{commit}'], { encoding: 'utf8' }).trim() !== t.sha) {
      throw Error('Archived object not fetched');
    }
  }
  const active = await reserved();
  for (const t of eligible) {
    if (active.has(t.name) || (await ref('heads/' + t.name))?.sha !== t.sha) throw Error('Branch raced: ' + t.name);
  }
  for (const t of archives) if (await ref('tags/' + t.tag)) throw Error('Archive tag raced');
  if (eligible.length) {
    const args = ['push', '--atomic',
      ...eligible.map(t => '--force-with-lease=refs/heads/' + t.name + ':' + t.sha),
      ...archives.map(t => '--force-with-lease=refs/tags/' + t.tag + ':'), 'origin',
      ...archives.map(t => t.sha + ':refs/tags/' + t.tag), ...eligible.map(t => ':refs/heads/' + t.name)];
    try { runGit('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch { throw Error('Atomic archive/retirement failed; inspect refs before retry'); }
  }
  for (const t of archives) {
    const tag = await ref('tags/' + t.tag);
    if (tag?.sha !== t.sha || tag.type !== 'commit') throw Error('Archive not verified');
    core.info('ARCHIVED_EXACT_COMMIT ' + t.tag + ' @ ' + t.sha);
  }
  for (const t of eligible) {
    if (await ref('heads/' + t.name)) throw Error('Deletion not verified');
    core.info('DELETED_VERIFIED_REF ' + t.name + ' @ ' + t.sha);
  }
  await core.summary.addHeading('Repository branch ownership audit and retirement')
    .addCodeBlock(JSON.stringify({ deleted: eligible, archives }, null, 2), 'json').write();
  core.info('UNOWNED_REFS_RETIREMENT_COMPLETE');
  return { execute, deleted: eligible, archives };
}

module.exports = { retire, plan };
