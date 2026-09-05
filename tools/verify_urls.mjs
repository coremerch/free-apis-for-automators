#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────
// verify_urls.mjs — health-check every API in this dataset and stamp
// last_checked + http_status back into data/free_apis.csv (and rebuild
// data/free_apis.json so both stay in sync).
//
// Run:  node tools/verify_urls.mjs
// Stdlib only (node ≥ 18). CC0. The CSV parser below is mini-csv.js
// from artifact 1 — we dogfood our own snippets. 🐶
// ─────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('../data/free_apis.csv', import.meta.url);
const src = readFileSync(file, 'utf8');

// ── mini-csv (same as artifact-1 snippets/mini-csv.js) ──
function parseCsv(text, delim = ',') {
  const rows = []; let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = ''; rows.push(row); row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => !(r.length === 1 && r[0] === ''));
}
const esc = v => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

// ── load ──
const rows = parseCsv(src);
const headers = rows[0];
const iName = headers.indexOf('name'), iUrl = headers.indexOf('base_url');
const iChk = headers.indexOf('last_checked'), iSt = headers.indexOf('http_status');
const records = rows.slice(1).map(r => ({ row: r, name: r[iName], url: r[iUrl] }));

// ── probe with a small pool ──
async function probe(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'free-apis-dataset-verifier/1.0 (CC0 dataset maintenance)' },
      redirect: 'follow',
    });
    // drain a little so sockets close cleanly
    await res.arrayBuffer().catch(() => {});
    return String(res.status);
  } catch (e) {
    return 'ERR:' + String(e && e.cause && e.cause.code || e.message || e).slice(0, 40);
  } finally { clearTimeout(t); }
}

const results = new Array(records.length);
let next = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (next < records.length) {
    const i = next++;
    results[i] = await probe(records[i].url);
    process.stdout.write(`  ${records[i].name.padEnd(32)} ${results[i]}\n`);
  }
}));

// ── stamp + write back ──
const today = new Date().toISOString().slice(0, 10);
for (let i = 0; i < records.length; i++) {
  records[i].row[iChk] = today;
  records[i].row[iSt] = results[i];
}
const csvOut = [headers, ...records.map(r => r.row)].map(r => r.map(esc).join(',')).join('\n') + '\n';
writeFileSync(file, csvOut);

const jsonOut = records.map(r => Object.fromEntries(headers.map((h, k) => [h, r.row[k]])));
writeFileSync(new URL('../data/free_apis.json', import.meta.url), JSON.stringify(jsonOut, null, 2) + '\n');

const ok = results.filter(s => /^[23]/.test(s)).length;
const blocked = results.filter(s => /^(403|429)/.test(s)).length;
const bad = results.length - ok - blocked;
console.log(`\n${ok} ok · ${blocked} alive-but-bot-blocked · ${bad} failing  (${records.length} total) — stamped ${today}`);
