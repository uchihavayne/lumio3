// Prosedurel seviye ureteci — sonsuz mod.
//
// Onceki surum yalnizca sozlukteki uzun kelimeleri "tohum" olarak kullandigi
// icin katalog kucuk kaliyor, az seviyede tukenip basa donuyordu. Bu surum
// harf HAVUZLARINI kombinasyonla uretir:
//   1) Bankadaki her 4-7 harfli kelimenin havuzu (en az bir tam kelime garantili)
//   2) Bu kelimelere +1 harf eklenerek olusan yeni havuzlar
// Her havuz su kalite kapilarindan gecmek zorunda:
//   - en az MIN_SUBWORDS adet (>=3 harfli) kelime uretmeli
//   - havuzdaki HER harf en az bir kelimede kullanilmali (carkta bosta harf kalmasin)
// Ayni harf havuzunu veren adaylar (anagramlar) tekillestirilir.
// Havuzlar oyuncuya ozel salt ile karistirilip kademeli, tekrarsiz bir diziye
// dizilir -> katalog cok daha buyuk, gercekten sonsuz hissettirir.

import { allWords } from "./dictionary";
import type { Lang } from "./i18n";

export interface GenLevel {
  index: number;
  emoji: string;
  letters: string[];
  words: string[];
}

const SAFE_EMOJIS = [
  "🏮", "⭐", "🌙", "🌲", "🌊", "🌸", "🏰", "🪐", "🍃", "🔥",
  "💎", "🎈", "🦋", "🌷", "🍀", "🌻", "🗝️", "🪶", "🌈", "⛵",
];

// Kademeli zorluk: ilk seviyeler kisa (kolay), sonra uzar; karisik ama yukari yonlu.
const LEN_SCHEDULE = [4, 4, 4, 5, 4, 5, 5, 6, 5, 6, 6, 7, 6, 7, 6, 7, 7, 6, 7, 7];
const LEN_TAIL = [5, 6, 7, 6, 7, 5, 7, 6];
const MIN_SUBWORDS = 4;

function schedLen(p: number): number {
  if (p < LEN_SCHEDULE.length) return LEN_SCHEDULE[p];
  return LEN_TAIL[(p - LEN_SCHEDULE.length) % LEN_TAIL.length];
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function toCounts(word: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const c of word) m.set(c, (m.get(c) ?? 0) + 1);
  return m;
}

function isSubset(counts: Map<string, number>, pool: Map<string, number>): boolean {
  for (const [c, n] of counts) {
    if ((pool.get(c) ?? 0) < n) return false;
  }
  return true;
}

function poolKey(word: string): string {
  return [...word].sort().join("");
}

interface Catalog {
  seq: string[]; // her oge bir havuz (harf dizisi)
  wordsForPool: Map<string, string[]>; // poolKey -> kelimeler
  /** Seviye sirasina gore SECILEN kelimeler (tekrar penceresi uygulanmis). */
  chosen: string[][];
}
const catalogCache = new Map<string, Catalog>();

/** Iki havuzun harf kumesi ortusme orani (0..1). */
function overlapRatio(a: string, b: string): number {
  const sa = new Set(a);
  const sb = new Set(b);
  let n = 0;
  for (const ch of sa) if (sb.has(ch)) n++;
  return n / Math.min(sa.size, sb.size);
}

function getCatalog(lang: Lang, salt: number): Catalog {
  const ckey = `${lang}:${salt}`;
  const hit = catalogCache.get(ckey);
  if (hit) return hit;

  const words = allWords(lang);
  const wordCounts = words.map((w) => ({ w, c: toCounts(w) }));
  const alphabet = [...new Set(words.join("").split(""))];

  const groupsBase = new Map<number, string[]>(); // temiz kelime aileleri
  const groupsAug = new Map<number, string[]>(); // +1 harf kombinasyon havuzlari
  const wordsForPool = new Map<string, string[]>();
  const seenPool = new Set<string>();

  const consider = (poolStr: string, aug: boolean) => {
    if (poolStr.length < 4 || poolStr.length > 7) return;
    const pk = poolKey(poolStr);
    if (seenPool.has(pk)) return;
    const pool = toCounts(poolStr);
    const subs: string[] = [];
    const used = new Set<string>();
    for (const { w, c } of wordCounts) {
      if (w.length >= 3 && w.length <= poolStr.length && isSubset(c, pool)) {
        subs.push(w);
        for (const ch of w) used.add(ch);
      }
    }
    if (subs.length < MIN_SUBWORDS) return;
    // Her havuz harfi en az bir kelimede kullanilmali.
    for (const ch of pool.keys()) if (!used.has(ch)) return;
    seenPool.add(pk);
    const g = aug ? groupsAug : groupsBase;
    if (!g.has(poolStr.length)) g.set(poolStr.length, []);
    g.get(poolStr.length)!.push(poolStr);
    wordsForPool.set(pk, subs);
  };

  // 1) Temiz aileler: banka kelimelerinin kendi havuzlari (carkta tam kelime).
  for (const w of words) consider(w, false);
  // 2) Kombinasyon havuzlari (+1 harf) -> sonsuz, cesitli kuyruk.
  // 3 harfli kelimeler de dahil: 4 harfli havuz arzini genisletir, yoksa
  // erken seviyeler hep ayni dar aileden (ayni harflerden) gelir.
  for (const w of words) {
    if (w.length < 3 || w.length > 6) continue;
    for (const c of alphabet) consider(w + c, true);
  }

  const shuffle = (arr: string[], seed: number) => {
    const rng = mulberry32(seed);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };
  const h = (hashStr(lang) ^ (salt >>> 0)) >>> 0;
  for (const [L, arr] of groupsBase) shuffle(arr, h + L * 2654435761);
  for (const [L, arr] of groupsAug) shuffle(arr, h + L * 40503 + 7);

  // Her uzunlukta ONCE temiz aileler, sonra kombinasyon havuzlari tuketilir
  // -> erken seviyeler temiz/gercek kelimeler, kuyruk sonsuz.
  const combined = new Map<number, string[]>();
  const getList = (L: number) => {
    let c = combined.get(L);
    if (!c) {
      c = [...(groupsBase.get(L) ?? []), ...(groupsAug.get(L) ?? [])];
      combined.set(L, c);
    }
    return c;
  };
  const ptr = new Map<number, number>();
  const total = [4, 5, 6, 7].reduce((s, L) => s + getList(L).length, 0);
  const remaining = (L: number) => getList(L).length - (ptr.get(L) ?? 0);
  const nearest = (L: number): number | null => {
    for (let d = 0; d <= 5; d++) {
      if (remaining(L - d) > 0) return L - d;
      if (remaining(L + d) > 0) return L + d;
    }
    return null;
  };

  // Diziyi ve her seviyenin kelime secimini BIRLIKTE, sirali kur:
  // siradaki havuz adaylari son 5 seviyenin KELIMELERIYLE ve son 2 havuzun
  // HARFLERIYLE karsilastirilir; en az cakisan aday one alinir. Boylece
  // "ayni kelimeler / ayni harfler ust uste geliyor" hissi kirilir.
  const LOOKAHEAD = 25;
  const RECENT_WINDOW = 5;
  const seq: string[] = [];
  const chosen: string[][] = [];

  const subsOf = (pool: string) => wordsForPool.get(poolKey(pool)) ?? [pool];

  const pickWords = (pool: string, recent: Set<string>): string[] => {
    const all = [...new Set(subsOf(pool))].sort((a, b) => b.length - a.length);
    const picked: string[] = [];
    if (all.length) picked.push(all[0]); // en uzun kelime her zaman capa
    for (const w of all) {
      if (picked.length >= 12) break;
      if (!recent.has(w) && !picked.includes(w)) picked.push(w);
    }
    // Taze kelime yetmediyse tekrarlara izin vererek en az 4'e tamamla.
    for (const w of all) {
      if (picked.length >= Math.min(4, all.length)) break;
      if (!picked.includes(w)) picked.push(w);
    }
    return picked.sort((a, b) => b.length - a.length);
  };

  let p = 0;
  while (seq.length < total) {
    const L = nearest(schedLen(p++));
    if (L === null) break;
    const listL = getList(L);
    const o = ptr.get(L) ?? 0;
    const prev1 = seq[seq.length - 1];
    const prev2 = seq[seq.length - 2];
    const recent = new Set<string>();
    for (let d = 1; d <= RECENT_WINDOW; d++) {
      const prevWords = chosen[chosen.length - d];
      if (prevWords) for (const w of prevWords) recent.add(w);
    }

    let pick = -1;
    let fallback = o;
    let fallbackScore = Infinity;
    for (let k = o; k < Math.min(o + LOOKAHEAD, listL.length); k++) {
      const cand = listL[k];
      let rep = 0;
      for (const w of subsOf(cand)) if (recent.has(w)) rep++;
      const l1 = prev1 ? overlapRatio(cand, prev1) : 0;
      const l2 = prev2 ? overlapRatio(cand, prev2) : 0;
      if (rep <= 1 && l1 < 0.5 && l2 < 0.7) {
        pick = k;
        break;
      }
      const score = rep * 2 + l1 * 3 + l2 * 1.5;
      if (score < fallbackScore) {
        fallbackScore = score;
        fallback = k;
      }
    }
    if (pick === -1) pick = fallback;
    [listL[o], listL[pick]] = [listL[pick], listL[o]];
    const pool = listL[o];
    seq.push(pool);
    chosen.push(pickWords(pool, recent));
    ptr.set(L, o + 1);
  }

  const out: Catalog = {
    seq: seq.length ? seq : [words.find((w) => w.length >= 4) ?? "ABCD"],
    wordsForPool,
    chosen: chosen.length ? chosen : [[words.find((w) => w.length >= 4) ?? "ABCD"]],
  };
  catalogCache.set(ckey, out);
  return out;
}

/** Tek bir prosedurel seviye. Deterministik: ayni (lang,index,salt) -> ayni seviye. */
export function makeLevel(lang: Lang, index: number, salt: number): GenLevel {
  const cat = getCatalog(lang, salt);
  const p = index % cat.seq.length;
  const pool = cat.seq[p];
  const list = cat.chosen[p];

  const erng = mulberry32(hashStr(pool) + index);
  const emoji = SAFE_EMOJIS[Math.floor(erng() * SAFE_EMOJIS.length)];

  return { index, emoji, letters: [...pool], words: list };
}

/**
 * Günlük bulmaca: tarihe göre deterministik -> aynı gün herkese AYNI seviye
 * (oyuncu salt'ından bağımsız). Orta güçlük.
 */
export function makeDailyLevel(lang: Lang, dateStr: string): GenLevel {
  const s = hashStr("lumio-daily:" + dateStr) >>> 0;
  const idx = 6 + (s % 12); // 6-17 -> genelde 5-6 harf
  return { ...makeLevel(lang, idx, s), emoji: "🗓️" };
}
