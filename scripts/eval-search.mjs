// dup@10, nDCG@10 and false merges, before vs. after dedup. Needs OPENALEX_API_KEY.
//   npm run eval:search
//   npm run eval:search -- --pool   unlabeled top-10 results and unverified merges, for labeling
// Labels: grades { id: 0|1|2 }, same [[ids of one work]]. Unlabeled = 0.
import { readFileSync } from 'node:fs';
import { fetchRankedPapers, dedupeVersions } from '../src/lib/providers/openalex.ts';

const K = 10;
const queries = JSON.parse(readFileSync(new URL('../eval/search-queries.json', import.meta.url), 'utf8'));
const poolMode = process.argv.includes('--pool');

function score(list, { grades, same }) {
  const workOf = id => same.find(group => group.includes(id))?.[0] ?? id;
  const gradeOf = {};
  for (const [id, g] of Object.entries(grades)) gradeOf[workOf(id)] = Math.max(g, gradeOf[workOf(id)] ?? 0);

  const seen = new Set();
  let dcg = 0, dups = 0, unjudged = 0;
  list.slice(0, K).forEach((p, i) => {
    const work = workOf(p.id);
    if (!(work in gradeOf)) unjudged++;
    if (seen.has(work)) dups++;
    else dcg += (2 ** (gradeOf[work] ?? 0) - 1) / Math.log2(i + 2);
    seen.add(work);
  });
  const idcg = Object.values(gradeOf).sort((a, b) => b - a).slice(0, K)
    .reduce((sum, g, i) => sum + (2 ** g - 1) / Math.log2(i + 2), 0);
  return { dup: dups / Math.min(K, list.length || 1), ndcg: idcg ? dcg / idcg : 0, unjudged };
}

// A merge is false if both ids are labeled but not in one `same` group
function checkMerges(deduped, { grades, same }) {
  const labeled = id => id in grades || same.some(g => g.includes(id));
  const confirmed = [], falseMerges = [], unverified = [];
  for (const p of deduped) {
    for (const v of p.versions || []) {
      const ok = same.some(g => g.includes(p.id) && g.includes(v));
      (ok ? confirmed : labeled(p.id) && labeled(v) ? falseMerges : unverified).push([p.id, v]);
    }
  }
  return { confirmed, falseMerges, unverified };
}

const rows = [];
const pool = [];
for (const q of queries) {
  const { papers } = await fetchRankedPapers(q.query);
  const before = papers.slice(0, 20);
  const deduped = dedupeVersions(papers);
  const after = deduped.slice(0, 20);
  const merges = checkMerges(deduped, q);

  if (poolMode) {
    const ids = new Set();
    for (const p of [...before.slice(0, K), ...after.slice(0, K)]) {
      if (ids.has(p.id) || p.id in q.grades) continue;
      ids.add(p.id);
      pool.push({
        query: q.query, id: p.id, title: p.title, year: p.publicationYear, type: p.type,
        venue: p.journal, authors: p.authors.slice(0, 3), abstract: p.abstract.slice(0, 400),
      });
    }
    const title = id => papers.find(p => p.id === id)?.title;
    for (const pair of merges.unverified) pool.push({ query: q.query, merge: pair, titles: pair.map(title) });
    continue;
  }
  for (const [a, b] of merges.falseMerges) console.error(`FALSE MERGE  ${q.query}: ${a} + ${b}`);
  rows.push({ query: q.query, before: score(before, q), after: score(after, q), merges });
}

if (poolMode) {
  console.log(JSON.stringify(pool, null, 2));
} else {
  const f = n => n.toFixed(3);
  const total = k => rows.reduce((s, r) => s + r.merges[k].length, 0);
  const mean = (key, m) => rows.reduce((s, r) => s + r[key][m], 0) / rows.length;
  console.log(['query'.padEnd(50), 'dup@10 before', 'after', 'nDCG@10 before', 'after', 'unjudged', 'false merges'].join('\t'));
  for (const r of rows) {
    console.log([r.query.slice(0, 50).padEnd(50), f(r.before.dup), f(r.after.dup), f(r.before.ndcg), f(r.after.ndcg), r.after.unjudged, r.merges.falseMerges.length].join('\t'));
  }
  console.log(['MEAN'.padEnd(50), f(mean('before', 'dup')), f(mean('after', 'dup')), f(mean('before', 'ndcg')), f(mean('after', 'ndcg')),
    rows.reduce((s, r) => s + r.after.unjudged, 0), total('falseMerges')].join('\t'));
  console.log(`merges: ${total('confirmed')} confirmed, ${total('falseMerges')} false, ${total('unverified')} unverified`);
  if (total('falseMerges')) process.exitCode = 1;
}
