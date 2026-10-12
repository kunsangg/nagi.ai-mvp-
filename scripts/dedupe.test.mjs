// node --test scripts/dedupe.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dedupeVersions, arxivIdOf } from '../src/lib/providers/openalex.ts';

const paper = (id, title, authors, extra = {}) => ({ id, title, authors, citationCount: 0, ...extra });

test('merges preprint and published versions, keeps published, keeps rank', () => {
  // From "Speech recognition for code-mixed Hinglish"
  const out = dedupeVersions([
    paper('W1', 'Unrelated paper', ['A. Person']),
    paper('W3211492579', 'HinGE: A Dataset for Generation and Evaluation of Code-Mixed Hinglish Text',
      ['Vivek Prakash Srivastava', 'Mayank Singh'], { type: 'preprint', doi: '10.48550/arxiv.2107.03760', pdfUrl: 'arxiv.pdf', isOpenAccess: true }),
    paper('W4321854111', 'MUTANT: A Multi-sentential Code-mixed Hinglish Dataset',
      ['Gupta, Rahul', 'Vivek Prakash Srivastava'], { type: 'preprint' }),
    paper('W3182993912', 'HinGE: A Dataset for Generation and Evaluation of Code-Mixed Hinglish Text',
      ['Vivek Prakash Srivastava', 'Mayank Singh'], { type: 'conference-paper', citationCount: 35 }),
    paper('W4386576716', 'MUTANT: A Multi-sentential Code-mixed Hinglish Dataset',
      ['Rahul Gupta', 'Vivek Prakash Srivastava'], { type: 'conference-paper', citationCount: 3 }),
    paper('W4206224260', 'Towards Code-Mixed Hinglish Dialogue Generation', ['Vibhav Agarwal', 'Pooja S. B. Rao']),
    paper('W3212094587', 'Towards Code-Mixed Hinglish Dialogue Generation', ['Vibhav Agarwal', 'Pooja Rao'], { citationCount: 2 }),
  ]);

  assert.deepEqual(out.map(p => p.id), ['W1', 'W3182993912', 'W4386576716', 'W3212094587']);
  const hinge = out[1];
  assert.deepEqual(hinge.versions, ['W3211492579']);
  assert.equal(hinge.citationCount, 35);
  assert.equal(hinge.pdfUrl, 'arxiv.pdf'); // from the preprint
  assert.equal(hinge.isOpenAccess, true);
  assert.equal(out[3].citationCount, 2);
});

test('same title, no shared author: not merged', () => {
  const out = dedupeVersions([
    paper('W1', 'Introduction', ['Jane Smith']),
    paper('W2', 'Introduction', ['Wei Zhang']),
  ]);
  assert.equal(out.length, 2);
});

test('non-Latin titles and names are not collapsed to empty keys', () => {
  const out = dedupeVersions([
    paper('W1', '深度学习综述', ['张伟']),
    paper('W2', '图神经网络研究', ['张伟']),
    paper('W3', '深度学习综述', ['李娜']),
  ]);
  assert.equal(out.length, 3);
});

test('shared arXiv ID merges even when the title changed', () => {
  const out = dedupeVersions([
    paper('W1', 'RocketQA: An Optimized Training Approach to Dense Passage Retrieval', ['Yingqi Qu'], { type: 'preprint', arxivId: '2010.08191' }),
    paper('W2', 'RocketQA: Optimized Dense Passage Retrieval for Open-Domain QA', ['Yingqi Qu'], { arxivId: '2010.08191', citationCount: 9 }),
  ]);
  assert.deepEqual(out.map(p => p.id), ['W2']);
});

test('same title and author but different arXiv IDs: not merged', () => {
  const out = dedupeVersions([
    paper('W1', 'Lecture Notes on Deep Learning', ['Jane Smith'], { arxivId: '2101.00001' }),
    paper('W2', 'Lecture Notes on Deep Learning', ['Jane Smith'], { arxivId: '2205.00002' }),
  ]);
  assert.equal(out.length, 2);
});

test('arxivIdOf reads DOIs and arxiv.org URLs', () => {
  assert.equal(arxivIdOf('https://doi.org/10.48550/arxiv.2107.03760'), '2107.03760');
  assert.equal(arxivIdOf('https://arxiv.org/pdf/2004.04906v3.pdf'), '2004.04906');
  assert.equal(arxivIdOf('http://arxiv.org/abs/hep-th/9901001'), 'hep-th/9901001');
  assert.equal(arxivIdOf('https://aclanthology.org/2021.eval4nlp-1.20.pdf'), undefined);
});
