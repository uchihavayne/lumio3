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
  for (const w of words) if (w.length >= 4 && w.length <= 6) for (const c of alphabet) consider(w + c, true);
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
  const seq = []; let p = 0;
  while (seq.length < total) { const L = nearest(schedLen(p++)); if (L === null) break; const o = ptr.get(L) || 0; seq.push(getList(L)[o]); ptr.set(L, o + 1); }
  return { seq: seq.length ? seq : [words[0]], wordsForPool };
}
function makeLevel(lang, index, salt, cat) {
  const pool = cat.seq[index % cat.seq.length];
  const list = [...new Set(cat.wordsForPool.get(poolKey(pool)) || [pool])].sort((a, b) => b.length - a.length).slice(0, 12);
  return { letters: [...pool], words: list };
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

  const sample = []; for (let i = 0; i < 14; i++) { const lv = makeLevel(lang, i, SALT, cat); sample.push(`${lv.letters.join("")}(${lv.words.length})`); }
  console.log(`${lang}: dict=${BANK[lang].length} | benzersizSeviye=${seenK.size} | tekrarBaslangici=${loopAt ?? ">" + N} | yakinTekrar(8)=${nearRep}`);
  console.log("    örnek:", sample.slice(0, 10).join(" "));
  console.log("    enSık:", top.join(" "));
}
console.log(`\nGENEL: subsetHata=${subsetErr} azKelime=${fewWords}`);
