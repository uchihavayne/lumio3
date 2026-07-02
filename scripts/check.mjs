// Bagimsiz uretici kalite kontrolu (modul cozumlemesine takilmadan).
// dictionary.ts'i metin olarak okuyup kelime listelerini cikarir, generator.ts
// mantigini birebir yeniden uygular. Calistir: node scripts/check.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, "../src/game/dictionary.ts"), "utf8");

// --- sozlukten kelime listeleri ---
const LANGS = ["EN", "TR", "ES", "DE", "FR", "PT"];
function extractBlock(name) {
  const start = src.indexOf(`const ${name}: Bank = {`);
  if (start < 0) return [];
  const end = src.indexOf("\n};", start);
  const block = src.slice(start, end);
  const words = [];
  const re = /^\s+([^\s:]+):\s*"/gm;
  let m;
  while ((m = re.exec(block))) words.push(m[1]);
  return words;
}
const BANK = {};
for (const L of LANGS)
  BANK[L.toLowerCase()] = [
    ...new Set([...extractBlock(L), ...extractBlock(L + "2"), ...extractBlock(L + "3")]),
  ];

// --- generator.ts mantigi (birebir) ---
const LEN_SCHEDULE = [4, 4, 4, 5, 4, 5, 5, 6, 5, 6, 6, 7, 6, 7, 6, 7, 7, 6, 7, 7];
const LEN_TAIL = [5, 6, 7, 6, 7, 5, 7, 6];
const MIN_SUBWORDS = 4;
const schedLen = (p) => (p < LEN_SCHEDULE.length ? LEN_SCHEDULE[p] : LEN_TAIL[(p - LEN_SCHEDULE.length) % LEN_TAIL.length]);
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function toCounts(w) { const m = new Map(); for (const c of w) m.set(c, (m.get(c) || 0) + 1); return m; }
function isSubset(counts, pool) { for (const [c, n] of counts) if ((pool.get(c) || 0) < n) return false; return true; }
const poolKey = (w) => [...w].sort().join("");

function buildCatalog(lang, salt) {
  const words = BANK[lang];
  const wc = words.map((w) => ({ w, c: toCounts(w) }));
  const alphabet = [...new Set(words.join("").split(""))];
  const groupsBase = new Map(), groupsAug = new Map();
  const wordsForPool = new Map();
  const seen = new Set();
  const consider = (poolStr, aug) => {
    if (poolStr.length < 4 || poolStr.length > 7) return;
    const pk = poolKey(poolStr);
    if (seen.has(pk)) return;
    const pool = toCounts(poolStr);
    const subs = []; const used = new Set();
    for (const { w, c } of wc)
      if (w.length >= 3 && w.length <= poolStr.length && isSubset(c, pool)) { subs.push(w); for (const ch of w) used.add(ch); }
    if (subs.length < MIN_SUBWORDS) return;
    for (const ch of pool.keys()) if (!used.has(ch)) return;
    seen.add(pk);
    const g = aug ? groupsAug : groupsBase;
    if (!g.has(poolStr.length)) g.set(poolStr.length, []);
    g.get(poolStr.length).push(poolStr);
    wordsForPool.set(pk, subs);
  };
  for (const w of words) consider(w, false);
  for (const w of words) if (w.length >= 3 && w.length <= 6) for (const c of alphabet) consider(w + c, true);
  const shuffle = (arr, seed) => { const rng = mulberry32(seed); for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } };
  const h = (hashStr(lang) ^ (salt >>> 0)) >>> 0;
  for (const [L, arr] of groupsBase) shuffle(arr, h + L * 2654435761);
  for (const [L, arr] of groupsAug) shuffle(arr, h + L * 40503 + 7);
  const combined = new Map();
  const getList = (L) => { let c = combined.get(L); if (!c) { c = [...(groupsBase.get(L) || []), ...(groupsAug.get(L) || [])]; combined.set(L, c); } return c; };
  const ptr = new Map();
  const total = [4, 5, 6, 7].reduce((s, L) => s + getList(L).length, 0);
  const remaining = (L) => getList(L).length - (ptr.get(L) || 0);
  const nearest = (L) => { for (let d = 0; d <= 5; d++) { if (remaining(L - d) > 0) return L - d; if (remaining(L + d) > 0) return L + d; } return null; };
  const overlapRatio = (a, b) => { const sa = new Set(a), sb = new Set(b); let n = 0; for (const ch of sa) if (sb.has(ch)) n++; return n / Math.min(sa.size, sb.size); };
  const LOOKAHEAD = 25;
  const seq = []; const chosen = []; const used = new Set();
  const subsOf = (pool) => wordsForPool.get(poolKey(pool)) || [pool];
  const WORDS_PER_LEVEL = 9;
  const freshList = (pool) => {
    const all = [...new Set(subsOf(pool))].filter((w) => !used.has(w)).sort((a, b) => b.length - a.length);
    if (all.length < MIN_SUBWORDS) return null;
    const covered = new Set();
    for (const w of all) for (const ch of w) covered.add(ch);
    for (const ch of new Set(pool)) if (!covered.has(ch)) return null;
    return all.slice(0, WORDS_PER_LEVEL);
  };
  const lengthOrder = (L0) => {
    const out = [];
    for (let d = 0; d <= 5; d++) {
      if (remaining(L0 - d) > 0) out.push(L0 - d);
      if (d > 0 && remaining(L0 + d) > 0) out.push(L0 + d);
    }
    return out;
  };
  const scan = (listL, o, prev1, prev2) => {
    let fb = -1, fbScore = Infinity, fbList = null;
    for (let k = o; k < listL.length; k++) {
      const cand = listL[k];
      const list = freshList(cand);
      if (!list) continue;
      if (k >= o + LOOKAHEAD) {
        return fb !== -1 ? { pick: fb, list: fbList } : { pick: k, list };
      }
      const l1 = prev1 ? overlapRatio(cand, prev1) : 0;
      const l2 = prev2 ? overlapRatio(cand, prev2) : 0;
      if (l1 < 0.5 && l2 < 0.7) return { pick: k, list };
      const score = l1 * 3 + l2 * 1.5;
      if (score < fbScore) { fbScore = score; fb = k; fbList = list; }
    }
    return fb !== -1 ? { pick: fb, list: fbList } : null;
  };
  let p = 0;
  while (seq.length < total) {
    const L0 = schedLen(p++);
    if (nearest(L0) === null) break;
    const prev1 = seq[seq.length - 1], prev2 = seq[seq.length - 2];
    const tryAll = () => {
      for (const L of lengthOrder(L0)) {
        const res = scan(getList(L), ptr.get(L) || 0, prev1, prev2);
        if (res) return { L, res };
      }
      return null;
    };
    let hit = tryAll();
    if (!hit) { used.clear(); hit = tryAll(); }
    if (!hit) {
      const L = nearest(L0);
      const listL = getList(L); const o = ptr.get(L) || 0;
      hit = { L, res: { pick: o, list: [...new Set(subsOf(listL[o]))].sort((a, b) => b.length - a.length).slice(0, WORDS_PER_LEVEL) } };
    }
    const listL = getList(hit.L);
    const o = ptr.get(hit.L) || 0;
    [listL[o], listL[hit.res.pick]] = [listL[hit.res.pick], listL[o]];
    seq.push(listL[o]);
    chosen.push(hit.res.list);
    for (const w of hit.res.list) used.add(w);
    ptr.set(hit.L, o + 1);
  }
  return { seq: seq.length ? seq : [words[0]], wordsForPool, chosen: chosen.length ? chosen : [[words[0]]] };
}
function makeLevel(lang, index, salt, cat) {
  const p = index % cat.seq.length;
  return { letters: [...cat.seq[p]], words: cat.chosen[p] };
}

// --- rapor ---
const SALT = 777, N = 600;
let subsetErr = 0, fewWords = 0;
for (const lang of Object.keys(BANK)) {
  const cat = buildCatalog(lang, SALT);
  const first = makeLevel(lang, 0, SALT, cat).letters.slice().sort().join("");
  const seenK = new Set(); let loopAt = null; const win = []; let nearRep = 0;
  for (let i = 0; i < N; i++) {
    const lv = makeLevel(lang, i, SALT, cat);
    const key = lv.letters.slice().sort().join("");
    if (i > 0 && key === first && loopAt === null) loopAt = i;
    seenK.add(key);
    if (win.includes(key)) nearRep++; win.push(key); if (win.length > 8) win.shift();
    if (lv.words.length < 3) fewWords++;
    const pool = {}; for (const c of lv.letters) pool[c] = (pool[c] || 0) + 1;
    for (const w of lv.words) { const need = {}; for (const c of [...w]) need[c] = (need[c] || 0) + 1; for (const c of Object.keys(need)) if ((pool[c] || 0) < need[c]) { subsetErr++; break; } }
  }
  // En sik gecen kelimeler (ilk 40 seviyede) — tek bir kelime her yerde cikiyor mu?
  const freq = new Map();
  const L40 = Math.min(40, cat.seq.length);
  for (let i = 0; i < L40; i++) for (const w of makeLevel(lang, i, SALT, cat).words) freq.set(w, (freq.get(w) || 0) + 1);
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
    .map(([w, n]) => `${w}=%${Math.round((100 * n) / L40)}`);

  // TEKRAR METRIKLERI: ardisik seviyeler arasi kelime ve harf ortusmesi
  // + KURESEL ilk tekrar (bir kelimenin herhangi bir onceki seviyede gecmesi).
  const M = Math.min(200, cat.seq.length);
  let wordOverlapSum = 0, letterOverlapSum = 0, backToBack = 0;
  let prevWords = null, prevPool = null;
  const seenGlobal = new Set();
  let firstGlobalRep = null;
  for (let i = 0; i < M; i++) {
    const lv = makeLevel(lang, i, SALT, cat);
    const ws = new Set(lv.words);
    const pl = new Set(lv.letters);
    if (prevWords) {
      let inter = 0; for (const w of ws) if (prevWords.has(w)) inter++;
      wordOverlapSum += inter / ws.size;
      if (inter > 0) backToBack++;
      let li = 0; for (const ch of pl) if (prevPool.has(ch)) li++;
      letterOverlapSum += li / Math.min(pl.size, prevPool.size);
    }
    if (firstGlobalRep === null) {
      for (const w of ws) if (seenGlobal.has(w)) { firstGlobalRep = i + 1; break; }
      for (const w of ws) seenGlobal.add(w);
    }
    prevWords = ws; prevPool = pl;
  }
  const avgWordRep = Math.round((100 * wordOverlapSum) / (M - 1));
  const avgLetterRep = Math.round((100 * letterOverlapSum) / (M - 1));

  const sample = []; for (let i = 0; i < 14; i++) { const lv = makeLevel(lang, i, SALT, cat); sample.push(`${lv.letters.join("")}(${lv.words.length})`); }
  console.log(`${lang}: dict=${BANK[lang].length} | benzersizSeviye=${seenK.size} | tekrarBaslangici=${loopAt ?? ">" + N} | yakinTekrar(8)=${nearRep}`);
  console.log(`    ardisikKelimeTekrari=%${avgWordRep} (ardisikTekrarliSeviye=${backToBack}/${M - 1}) | ardisikHarfOrtusmesi=%${avgLetterRep} | ilkKureselTekrar=${firstGlobalRep ?? "> " + M + ". seviye"}`);
  console.log("    örnek:", sample.slice(0, 10).join(" "));
  console.log("    enSık:", top.join(" "));
}
console.log(`\nGENEL: subsetHata=${subsetErr} azKelime=${fewWords}`);
