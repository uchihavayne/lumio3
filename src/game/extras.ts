// Tema ve basarim tanimlari.

import type { Stats } from "./storage";

export interface ThemeDef {
  id: string;
  swatch: string; // ayar ekranindaki renk dairesi
}

// Dünyalar: her bölüm (10 seviye) bir dünya emojisiyle işaretlenir; ilerledikçe
// döner. Sadece görsel çeşitlilik — mekanik değişmez, kullanıcı temasını ezmez.
export const WORLDS: string[] = ["🏮", "🌊", "🌲", "🏔️", "🏜️", "🌸", "🌌", "🎡"];

export function worldEmoji(chapter: number): string {
  return WORLDS[((chapter % WORLDS.length) + WORLDS.length) % WORLDS.length];
}

export const THEMES: ThemeDef[] = [
  { id: "night", swatch: "#ffcf6b" },
  { id: "sunset", swatch: "#ff8a5c" },
  { id: "forest", swatch: "#b8f06b" },
  { id: "ocean", swatch: "#4aa8ff" },
  { id: "berry", swatch: "#c77dff" },
];

export interface Achievement {
  id: string;
  emoji: string;
  titleKey: string; // i18n anahtari
  /** Acilma kosulu. */
  check: (s: Stats) => boolean;
  /** Ilerleme metni (ör. "37/100"). */
  progress?: (s: Stats) => string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first", emoji: "🌱", titleKey: "ach_first", check: (s) => s.wordsFound >= 1 },
  { id: "words100", emoji: "📚", titleKey: "ach_words100", check: (s) => s.wordsFound >= 100, progress: (s) => `${Math.min(s.wordsFound, 100)}/100` },
  { id: "words500", emoji: "🧠", titleKey: "ach_words500", check: (s) => s.wordsFound >= 500, progress: (s) => `${Math.min(s.wordsFound, 500)}/500` },
  { id: "levels10", emoji: "⭐", titleKey: "ach_levels10", check: (s) => s.levelsCompleted >= 10, progress: (s) => `${Math.min(s.levelsCompleted, 10)}/10` },
  { id: "levels50", emoji: "🪐", titleKey: "ach_levels50", check: (s) => s.levelsCompleted >= 50, progress: (s) => `${Math.min(s.levelsCompleted, 50)}/50` },
  { id: "streak7", emoji: "🔥", titleKey: "ach_streak7", check: (s) => s.bestStreak >= 7, progress: (s) => `${Math.min(s.bestStreak, 7)}/7` },
  { id: "bonus50", emoji: "🪲", titleKey: "ach_bonus50", check: (s) => s.bonusFound >= 50, progress: (s) => `${Math.min(s.bonusFound, 50)}/50` },
  { id: "combo5", emoji: "⚡", titleKey: "ach_combo5", check: (s) => s.maxCombo >= 5, progress: (s) => `${Math.min(s.maxCombo, 5)}/5` },
  { id: "pangram1", emoji: "✨", titleKey: "ach_pangram1", check: (s) => s.pangrams >= 1 },
  { id: "daily1", emoji: "🗓️", titleKey: "ach_daily1", check: (s) => s.dailies >= 1 },
  { id: "words250", emoji: "📖", titleKey: "ach_words250", check: (s) => s.wordsFound >= 250, progress: (s) => `${Math.min(s.wordsFound, 250)}/250` },
  { id: "levels100", emoji: "🏆", titleKey: "ach_levels100", check: (s) => s.levelsCompleted >= 100, progress: (s) => `${Math.min(s.levelsCompleted, 100)}/100` },
];
