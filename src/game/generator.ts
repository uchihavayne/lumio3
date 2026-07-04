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

// Kademeli zorluk: ilk seviyeler kisa (kolay), sonra uzar. En fazla 6 harf —
// tahta telefonda buyuk kutularla sigsin ve yasli oyunculara kolay olsun.
const LEN_SCHEDULE = [4, 4, 4, 5, 4, 5, 5, 6, 5, 6, 5, 6, 6, 5, 6, 6, 5, 6, 6, 6];
const LEN_TAIL = [5, 6, 5, 6, 6, 5, 6, 6];
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

  // TEKRARSIZLIK KURALI: bir kelime bir seviyede kullanildiysa sonraki
  // seviyelerde BIR DAHA CIKMAZ (kuresel "used" kumesi). Sozluk tukenip
  // pencerede hic uygun havuz kalmazsa kume sifirlanir (yeni dongu) — bu
  // pratikte yuzlerce seviye sonra olur. Ek olarak ardisik havuzlarin harf
  // kumeleri de ayristirilir (l1<0.5, l2<0.7).
  const LOOKAHEAD = 25;
  const seq: string[] = [];
  const chosen: string[][] = [];
  const used = new Set<string>();

  const subsOf = (pool: string) => wordsForPool.get(poolKey(pool)) ?? [pool];

  /**
   * Havuzun TAZE (hic kullanilmamis) kelime listesi. Kosullar saglanmazsa
   * null -> havuz bu turda atlanir:
   *  - en az MIN_SUBWORDS taze kelime
   *  - carktaki HER harf en az bir taze kelimede gecmeli (bosta harf olmasin)
   */
  // Seviye basina en fazla bu kadar kelime tuketilir (arz daha uzun dayanir).
  const WORDS_PER_LEVEL = 6;

  const freshList = (pool: string): string[] | null => {
    const all = [...new Set(subsOf(pool))]
      .filter((w) => !used.has(w))
      .sort((a, b) => b.length - a.length);
    if (all.length < MIN_SUBWORDS) return null;
    const covered = new Set<string>();
    for (const w of all) for (const ch of w) covered.add(ch);
    for (const ch of new Set(pool)) if (!covered.has(ch)) return null;
    return all.slice(0, WORDS_PER_LEVEL);
  };

  // Hedef uzunluktan baslayarak yakin uzunluklari sirala (kalani olanlar).
  const lengthOrder = (L0: number): number[] => {
    const out: number[] = [];
    for (let d = 0; d <= 5; d++) {
      if (remaining(L0 - d) > 0) out.push(L0 - d);
      if (d > 0 && remaining(L0 + d) > 0) out.push(L0 + d);
    }
    return out;
  };

  // Yakin pencerede harf cesitliligi de gozetilir; pencere taze havuz
  // vermezse liste SONUNA KADAR taranir (tazelik > harf cesitliligi).
  const scan = (
    listL: string[],
    o: number,
    prev1: string | undefined,
    prev2: string | undefined
  ): { pick: number; list: string[] } | null => {
    let fb = -1;
    let fbScore = Infinity;
    let fbList: string[] | null = null;
    for (let k = o; k < listL.length; k++) {
      const cand = listL[k];
      const list = freshList(cand);
      if (!list) continue;
      if (k >= o + LOOKAHEAD) {
        return fb !== -1 ? { pick: fb, list: fbList! } : { pick: k, list };
      }
      const l1 = prev1 ? overlapRatio(cand, prev1) : 0;
      const l2 = prev2 ? overlapRatio(cand, prev2) : 0;
      if (l1 < 0.5 && l2 < 0.7) return { pick: k, list };
      const score = l1 * 3 + l2 * 1.5;
      if (score < fbScore) {
        fbScore = score;
        fb = k;
        fbList = list;
      }
    }
    return fb !== -1 ? { pick: fb, list: fbList! } : null;
  };

  let p = 0;
  while (seq.length < total) {
    const L0 = schedLen(p++);
    if (nearest(L0) === null) break;
    const prev1 = seq[seq.length - 1];
    const prev2 = seq[seq.length - 2];

    // Hedef uzunlukta taze havuz yoksa DIGER uzunluklara gec; hicbirinde
    // yoksa sozluk gercekten tukenmistir -> yeni dongu.
    const tryAll = (): { L: number; res: { pick: number; list: string[] } } | null => {
      for (const L of lengthOrder(L0)) {
        const res = scan(getList(L), ptr.get(L) ?? 0, prev1, prev2);
        if (res) return { L, res };
      }
      return null;
    };

    let hit = tryAll();
    if (!hit) {
      used.clear(); // tum sozluk tuketildi -> yeni dongu
      hit = tryAll();
    }
    if (!hit) {
      const L = nearest(L0)!;
      const listL = getList(L);
      const o = ptr.get(L) ?? 0;
      hit = {
        L,
        res: {
          pick: o,
          list: [...new Set(subsOf(listL[o]))]
            .sort((a, b) => b.length - a.length)
            .slice(0, WORDS_PER_LEVEL),
        },
      };
    }
    const listL = getList(hit.L);
    const o = ptr.get(hit.L) ?? 0;
    [listL[o], listL[hit.res.pick]] = [listL[hit.res.pick], listL[o]];
    seq.push(listL[o]);
    chosen.push(hit.res.list);
    for (const w of hit.res.list) used.add(w);
    ptr.set(hit.L, o + 1);
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
