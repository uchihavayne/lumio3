// localStorage tabanli kayit.

import type { Lang } from "./i18n";

const KEY = "harfika.save.v3";

export interface LangProgress {
  /** O dilde tamamlanan seviye sayisi. Siradaki oynanabilir index = completed. */
  completed: number;
  /** Seviye index'ine gore bulunan bonus kelimeler. */
  bonusFound: Record<number, string[]>;
}

export interface SaveData {
  lang: Lang | null;
  fireflies: number;
  progress: Record<string, LangProgress>;
  muted: boolean;
  lastClaim: string | null;
  streak: number;
  /** Prosedurel uretim icin oyuncuya ozel tohum (sonsuz mod). */
  salt: number;
  /** Toplam puan (tum zamanlar). */
  totalScore: number;
  /** Haftalik lider tablosu icin: hafta kimligi ve o haftanin puani. */
  weekId: string | null;
  weekScore: number;
  /** Lider tablosunda gorunecek isim. */
  name: string;
  /** Ilk acilis ogreticisi gosterildi mi. */
  tutorialSeen: boolean;
  /** Kalici istatistik / rekorlar. */
  stats: Stats;
  /** Secili renk temasi id'si. */
  theme: string;
  /** Arka plan muzigi acik mi. */
  musicOn: boolean;
  /** Acilmis basarim id'leri. */
  achievements: string[];
  /** Ogrenilen (bulunan) kelimeler — dile gore, kelime defteri icin. */
  learned: Record<string, string[]>;
  /** Erisilebilirlik: buyuk yazi tipi. */
  bigText: boolean;
  /** Gunluk bulmaca en son hangi tarihte tamamlandi (YYYY-MM-DD). */
  dailyDone: string | null;
  /** Rahat mod: ucretsiz ipucu + ucuz joker. */
  relaxed: boolean;
  /** Renk koru dostu yuksek kontrast. */
  highContrast: boolean;
  /** Kelime bulununca anlamini otomatik goster. */
  autoMeaning: boolean;
}

export interface Stats {
  wordsFound: number;
  bonusFound: number;
  levelsCompleted: number;
  bestStreak: number;
  bestWeekScore: number;
  maxCombo: number;
  pangrams: number;
  dailies: number;
}

const DEFAULT: SaveData = {
  lang: null,
  fireflies: 5,
  progress: {},
  muted: false,
  lastClaim: null,
  streak: 0,
  salt: 0,
  totalScore: 0,
  weekId: null,
  weekScore: 0,
  name: "",
  tutorialSeen: false,
  stats: {
    wordsFound: 0,
    bonusFound: 0,
    levelsCompleted: 0,
    bestStreak: 0,
    bestWeekScore: 0,
    maxCombo: 0,
    pangrams: 0,
    dailies: 0,
  },
  theme: "night",
  musicOn: false,
  achievements: [],
  learned: {},
  bigText: false,
  dailyDone: null,
  relaxed: false,
  highContrast: false,
  autoMeaning: false,
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      ...DEFAULT,
      ...parsed,
      progress: parsed.progress ?? {},
      stats: { ...DEFAULT.stats, ...(parsed.stats ?? {}) },
    };
  } catch {
    return structuredClone(DEFAULT);
  }
}

export function persist(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* yok say */
  }
}

export function progressFor(data: SaveData, lang: Lang): LangProgress {
  if (!data.progress[lang]) {
    data.progress[lang] = { completed: 0, bonusFound: {} };
  }
  return data.progress[lang];
}
