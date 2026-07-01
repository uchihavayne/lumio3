// Haftalik lider tablosu.
//  - Supabase yapilandirilmissa (config.ts) GERCEK kuresel siralama (REST/PostgREST).
//  - Aksi halde YEREL + BOT siralamaya duser (backend'siz, hemen calisir).
// Ayni getBoard() imzasi her iki durumda da kullanilir.

import { SUPABASE_URL, SUPABASE_ANON_KEY, isOnlineLeaderboard } from "./config";

export interface BoardEntry {
  rank: number;
  name: string;
  score: number;
  isPlayer: boolean;
}

const BOT_NAMES = [
  "Mia", "Leo", "Aria", "Yuki", "Omar", "Sofia", "Liam", "Noor",
  "Elif", "Lucas", "Maya", "Hugo", "Zara", "Ivan", "Lina", "Pablo",
  "Aylin", "Nina", "Theo", "Sara", "Kenji", "Rosa", "Max", "Lara",
];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
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

/** ISO benzeri hafta kimligi: "2026-W26". */
export function weekId(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7
    );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function rank(entries: { name: string; score: number; isPlayer: boolean }[]): BoardEntry[] {
  entries.sort((a, b) => b.score - a.score || (a.isPlayer ? 1 : 0));
  return entries.map((e, i) => ({ rank: i + 1, ...e }));
}

function localBoard(week: string, playerName: string, playerScore: number): BoardEntry[] {
  const rng = mulberry32(hashStr(week));
  const names = [...BOT_NAMES].sort(() => rng() - 0.5).slice(0, 13);
  const bots = names.map((name) => ({
    name,
    score: Math.floor(150 + Math.pow(rng(), 1.7) * 4200),
    isPlayer: false,
  }));
  return rank([...bots, { name: playerName, score: playerScore, isPlayer: true }]);
}

function headers() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

/** Oyuncunun haftalik skorunu Supabase'e yazar (upsert). */
async function submitScore(playerId: string, name: string, week: string, score: number) {
  await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
    method: "POST",
    headers: { ...headers(), Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ player_id: playerId, name, week_id: week, score }]),
  });
}

async function onlineBoard(
  playerId: string,
  playerName: string,
  week: string,
  playerScore: number
): Promise<BoardEntry[]> {
  await submitScore(playerId, playerName, week, playerScore);
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/scores?week_id=eq.${encodeURIComponent(week)}` +
      `&order=score.desc&limit=50&select=name,score,player_id`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(`leaderboard ${res.status}`);
  const rows = (await res.json()) as { name: string; score: number; player_id: string }[];
  const entries = rows.map((r) => ({
    name: r.name,
    score: r.score,
    isPlayer: r.player_id === playerId,
  }));
  if (!entries.some((e) => e.isPlayer)) {
    entries.push({ name: playerName, score: playerScore, isPlayer: true });
  }
  return rank(entries);
}

/**
 * Haftanin lider tablosunu dondurur. Online yapilandirilmissa Supabase'den,
 * degilse yerel + bot. Hata olursa sessizce yerele duser.
 */
export async function getBoard(
  week: string,
  playerName: string,
  playerScore: number,
  playerId = "local"
): Promise<BoardEntry[]> {
  if (isOnlineLeaderboard()) {
    try {
      return await onlineBoard(playerId, playerName, week, playerScore);
    } catch {
      /* online basarisiz -> yerele dus */
    }
  }
  return localBoard(week, playerName, playerScore);
}
