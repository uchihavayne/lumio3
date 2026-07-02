import { makeLevel, makeDailyLevel, type GenLevel } from "./generator";
import { buildCrossword, type Crossword } from "./crossword";
import { defOf, allWords } from "./dictionary";
import { Wheel } from "./wheel";
import { FireflyLayer } from "./fx";
import { Sound } from "./sound";
import { getBoard, weekId } from "./leaderboard";
import { THEMES, ACHIEVEMENTS, worldEmoji } from "./extras";
import { ADS_ENABLED } from "./config";
import { initAds, showRewardedAd } from "./ads";
import {
  loadSave,
  persist,
  progressFor,
  type SaveData,
} from "./storage";
import {
  LANGUAGES,
  detectLang,
  getLang,
  setLang,
  t,
  type Lang,
} from "./i18n";

const HINT_COST = 1;
const AD_REWARD = 3;
const LEVEL_REWARD = 2;

function dayStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Kullanici girdisini HTML'e gomerken kacislar (isim vb.). */
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}

export class Game {
  private root: HTMLElement;
  private fx: FireflyLayer;
  private sound: Sound;
  private save: SaveData;

  private wheel!: Wheel;
  private levelIndex = 0;
  private daily = false;
  private gen!: GenLevel;
  private crossword!: Crossword;
  private found = new Set<string>();
  private bonus = new Set<string>();
  private combo = 0;
  /** Her yerlesik kelimeye uygulanan ipucu (harf) sayisi -> puan cezasi. */
  private hintedWords = new Map<string, number>();

  private elLevelName!: HTMLElement;
  private elProg!: HTMLElement;
  private elJarCount!: HTMLElement;
  private elJarFill!: HTMLElement;
  private elBoard!: HTMLElement;
  private elFound!: HTMLElement;
  private elPreview!: HTMLElement;
  private elCombo!: HTMLElement;
  private elHint!: HTMLButtonElement;
  private elJar!: HTMLElement;
  private cellEls = new Map<string, HTMLElement>();

  constructor(root: HTMLElement) {
    this.root = root;
    this.save = loadSave();
    if (!this.save.salt) {
      this.save.salt = (Math.random() * 2 ** 31) >>> 0 || 12345;
      persist(this.save);
    }
    this.fx = new FireflyLayer(document.body);
    this.sound = new Sound(this.save.muted);
    this.applyTheme();
    // Ses + müzik ilk dokunusta acilir (tarayici politikasi).
    window.addEventListener(
      "pointerdown",
      () => {
        this.sound.unlock();
        if (this.save.musicOn) this.sound.setMusicEnabled(true);
        void initAds();
      },
      { once: true }
    );
    // Sessiz mod otomasyonu: uygulama arka plandayken sesi kıs, geri gelince aç.
    document.addEventListener("visibilitychange", () =>
      this.sound.setActive(!document.hidden)
    );
    // Ekran boyutu/yönü değişince tahtayı yeniden sığdır.
    window.addEventListener("resize", () => this.layoutBoard());
    this.buildShell();

    if (this.save.lang) {
      setLang(this.save.lang);
      this.applyStaticText();
      this.startSession();
    } else {
      setLang(detectLang());
      this.showLanguageSelect(true);
    }
  }

  private startSession() {
    this.ensureWeek();
    if (!this.save.tutorialSeen) {
      this.showTutorial(false);
      return;
    }
    if (!this.showDailyReward()) this.showHome();
  }

  // ---------- Iskelet ----------
  private buildShell() {
    this.root.innerHTML = `
      <div class="topbar">
        <button class="tb-icon" id="btn-home" aria-label="Home">‹</button>
        <div class="tb-center">
          <div class="tb-level" id="level-name">Lumio</div>
          <div class="tb-bar"><div class="tb-bar-fill" id="prog-fill"></div></div>
        </div>
        <button class="tb-coin" id="jar" aria-label="Fireflies">
          <span class="tb-coin-ico">🪲</span>
          <span id="jar-count">0</span>
          <div class="jar-fill" id="jar-fill"></div>
          <span class="jar-plus">+</span>
        </button>
      </div>
      <div class="board-wrap"><div class="world-mark" id="world-mark"></div><div class="board" id="board"></div></div>
      <div class="found-strip" id="found"></div>
      <div class="combo" id="combo"></div>
      <div class="preview" id="preview"></div>
      <div class="wheel-area">
        <div class="wheel-controls">
          <button class="icon-btn" id="btn-hint">💡</button>
          <button class="icon-btn" id="btn-reveal">🔓</button>
          <button class="icon-btn" id="btn-shuffle">🔀</button>
          <button class="icon-btn" id="btn-sound">🔊</button>
        </div>
        <div id="wheel-host"></div>
      </div>
      <div class="overlay hidden" id="overlay"></div>
    `;

    this.elLevelName = this.q("#level-name");
    this.elProg = this.q("#prog-fill");
    this.elJarCount = this.q("#jar-count");
    this.elJarFill = this.q("#jar-fill");
    this.elBoard = this.q("#board");
    this.elFound = this.q("#found");
    this.elPreview = this.q("#preview");
    this.elCombo = this.q("#combo");
    this.elHint = this.q("#btn-hint");
    this.elJar = this.q("#jar");

    this.wheel = new Wheel({
      onPreview: (w) => this.onPreview(w),
      onSubmit: (w) => this.onSubmit(w),
      onStep: (order) => this.sound.step(order),
    });
    this.q("#wheel-host").appendChild(this.wheel.root);

    this.q("#btn-shuffle").addEventListener("click", () => {
      this.sound.play("click");
      this.wheel.shuffle();
    });
    this.elHint.addEventListener("click", () => this.useHint());
    this.q("#btn-reveal").addEventListener("click", () => this.revealRandomWord());
    this.q("#btn-reveal").title = t("revealWordTip");
    this.q("#btn-home").addEventListener("click", () => {
      this.sound.play("click");
      this.showHome();
    });
    this.elJar.addEventListener("click", () => {
      this.sound.play("click");
      this.showAdOffer();
    });
    this.q("#btn-sound").addEventListener("click", () => this.toggleSound());

    this.updateSoundBtn();
    this.updateJar();
    this.updateScore();
  }

  private q<T extends HTMLElement>(sel: string): T {
    return this.root.querySelector(sel) as T;
  }

  private applyStaticText() {
    this.elHint.title = t("hintTip");
    this.q("#btn-shuffle").title = t("shuffleTip");
    this.elJar.title = t("jarTip");
  }

  private playerName(): string {
    return this.save.name || t("you");
  }

  private toggleSound() {
    const muted = !this.sound.isMuted();
    this.sound.setMuted(muted);
    this.save.muted = muted;
    persist(this.save);
    this.updateSoundBtn();
    if (!muted) this.sound.play("tap");
  }

  private updateSoundBtn() {
    const b = this.q("#btn-sound");
    b.textContent = this.sound.isMuted() ? "🔇" : "🔊";
    b.title = t("soundTip");
    b.classList.toggle("dim", this.sound.isMuted());
  }

  // ---------- Tema / erişilebilirlik ----------
  private applyTheme() {
    document.body.dataset.theme = this.save.theme || "night";
    document.body.classList.toggle("big-text", this.save.bigText);
    document.body.classList.toggle("high-contrast", this.save.highContrast);
  }

  private toggleBigText() {
    this.save.bigText = !this.save.bigText;
    persist(this.save);
    this.applyTheme();
    this.sound.play("tap");
  }

  private setTheme(id: string) {
    this.save.theme = id;
    persist(this.save);
    this.applyTheme();
    this.sound.play("tap");
  }

  private toggleMusic() {
    this.save.musicOn = !this.save.musicOn;
    this.sound.setMusicEnabled(this.save.musicOn);
    persist(this.save);
  }

  /** Günün kelimesi: tarihe + dile göre deterministik seçilir. */
  private wordOfDay(): { word: string; def: string } | null {
    const lang = getLang();
    const words = allWords(lang).filter((w) => w.length >= 4);
    if (!words.length) return null;
    const seed = dayStr(new Date()) + ":" + lang;
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const word = words[(h >>> 0) % words.length];
    return { word, def: defOf(lang, word) ?? "" };
  }

  /** Bulunan kelimeyi kelime defterine ekler. */
  private learnWord(word: string) {
    const lang = getLang();
    const list = (this.save.learned[lang] ??= []);
    if (!list.includes(word)) list.push(word);
  }

  // ---------- Başarımlar ----------
  /** Yeni açılan başarımları bulur, kaydeder, kutlama gösterir. */
  private checkAchievements() {
    for (const a of ACHIEVEMENTS) {
      if (this.save.achievements.includes(a.id)) continue;
      if (a.check(this.save.stats)) {
        this.save.achievements.push(a.id);
        persist(this.save);
        this.sound.play("achievement");
        this.fx.celebrate();
        this.toast(`${a.emoji} ${t("achievementUnlocked")} ${t(a.titleKey)}`);
      }
    }
  }

  // ---------- Skor ----------
  private ensureWeek() {
    const wk = weekId();
    if (this.save.weekId !== wk) {
      this.save.weekId = wk;
      this.save.weekScore = 0;
      persist(this.save);
    }
  }

  private addScore(pts: number) {
    this.ensureWeek();
    this.save.totalScore += pts;
    this.save.weekScore += pts;
    if (this.save.weekScore > this.save.stats.bestWeekScore)
      this.save.stats.bestWeekScore = this.save.weekScore;
    persist(this.save);
    this.updateScore();
  }

  private updateScore() {
    /* Skor ana ekran / lider tablosu / kazanma ekranlarinda gosterilir. */
  }

  /** Üst bardaki ilerleme çubuğu: bulunan / toplam yerlesik kelime. */
  private updateProgress() {
    if (!this.crossword) return;
    const tot = this.crossword.placed.length || 1;
    const pct = Math.round((this.found.size / tot) * 100);
    this.elProg.style.width = `${pct}%`;
  }

  // ---------- Dil secimi ----------
  private showLanguageSelect(initial = false) {
    const ov = this.q("#overlay");
    const cards = LANGUAGES.map(
      (l) => `<button class="lang-card" data-lang="${l.code}">
          <span class="lang-flag">${l.flag}</span>
          <span class="lang-name">${l.name}</span>
        </button>`
    ).join("");
    ov.innerHTML = `
      <div class="panel select-panel">
        <h1 class="brand">Lum<span>io</span></h1>
        <p class="tagline">${t("chooseLanguage")}</p>
        <div class="lang-grid">${cards}</div>
      </div>`;
    ov.classList.remove("hidden");
    ov.querySelectorAll<HTMLButtonElement>(".lang-card").forEach((b) => {
      b.addEventListener("click", () => {
        this.sound.play("click");
        const lang = b.dataset.lang as Lang;
        const first = !this.save.lang;
        setLang(lang);
        this.save.lang = lang;
        persist(this.save);
        this.applyStaticText();
        if (first) this.startSession();
        else this.showHome();
      });
    });
    void initial;
  }

  // ---------- Ana ekran (hub) ----------
  private showHome() {
    const lang = getLang();
    const prog = progressFor(this.save, lang);
    const next = prog.completed;
    const ov = this.q("#overlay");
    const dailyDone = this.save.dailyDone === dayStr(new Date());
    const wod = this.wordOfDay();

    // Bölüm/ilerleme haritası: içinde bulunulan 10'luk bölümün seviyeleri.
    const ch = Math.floor(next / 10);
    const chStart = ch * 10;
    let nodes = "";
    for (let i = chStart; i < chStart + 10; i++) {
      const done = i < next;
      const cur = i === next;
      const open = done || cur;
      const g = open ? makeLevel(lang, i, this.save.salt) : null;
      const cls = done ? "node done" : cur ? "node cur" : "node locked";
      nodes += `<button class="${cls}" data-i="${i}" ${open ? "" : "disabled"}>
        <span class="node-ico">${open ? g!.emoji : "🔒"}</span>
        <span class="node-n">${i + 1}</span>
      </button>`;
    }

    ov.innerHTML = `
      <div class="panel home-panel">
        <div class="home-logo">
          <div class="home-lantern">🏮</div>
          <h1 class="brand">Lum<span>io</span></h1>
          <p class="tagline">${t("tagline")}</p>
        </div>
        <button class="name-chip" id="btn-name">👤 ${esc(this.playerName())}</button>
        <button class="btn primary continue-btn" id="btn-continue">
          ▶ ${t("playBtn")} · ${t("levelWord")} ${next + 1}
        </button>
        <button class="daily-card ${dailyDone ? "done" : ""}" id="btn-daily">
          <span>🗓️ ${t("dailyPuzzle")}</span>
          <b>${dailyDone ? t("dailyDoneLabel") : "▶"}</b>
        </button>
        <div class="home-row">
          <button class="home-btn" id="h-board"><span>🏆</span>${t("leaderboard")}</button>
          <button class="home-btn" id="h-notebook"><span>📖</span>${t("notebook")}</button>
          <button class="home-btn" id="h-stats"><span>📊</span>${t("statsTitle")}</button>
          <button class="home-btn" id="h-settings"><span>⚙️</span>${t("settings")}</button>
        </div>
        <div class="home-score">
          ${this.save.streak > 0 ? `<span class="streak-flame">🔥 ${t("dailyStreak", { n: this.save.streak })}</span> · ` : ""}🏆 ${t("thisWeek")}: <b>${this.save.weekScore}</b>
        </div>
        <div class="chapter-strip">
          <div class="chapter-label">${worldEmoji(ch)} ${t("chapter")} ${ch + 1}</div>
          <div class="chapter-nodes">${nodes}</div>
        </div>
        ${wod ? `<button class="wod-card" id="btn-wod"><span class="wod-label">💡 ${t("wordOfDay")}</span><b class="wod-word">${wod.word}</b><span class="wod-def">${wod.def}</span></button>` : ""}
      </div>`;
    ov.classList.remove("hidden");

    this.q("#btn-continue").addEventListener("click", () => {
      this.sound.play("click");
      ov.classList.add("hidden");
      this.loadLevel(next);
    });
    this.q("#btn-daily").addEventListener("click", () => {
      this.sound.play("click");
      ov.classList.add("hidden");
      this.loadDaily();
    });
    const wodBtn = this.root.querySelector("#btn-wod");
    if (wodBtn && wod)
      wodBtn.addEventListener("click", () => this.showDefinition(wod.word, false));
    this.q("#h-board").addEventListener("click", () => {
      this.sound.play("click");
      this.showLeaderboard();
    });
    this.q("#h-notebook").addEventListener("click", () => {
      this.sound.play("click");
      this.showNotebook();
    });
    this.q("#h-stats").addEventListener("click", () => {
      this.sound.play("click");
      this.showStats();
    });
    this.q("#h-settings").addEventListener("click", () => {
      this.sound.play("click");
      this.showSettings();
    });
    this.q("#btn-name").addEventListener("click", () => this.editName(() => this.showHome()));
    ov.querySelectorAll<HTMLButtonElement>(".node").forEach((b) => {
      if (b.disabled) return;
      b.addEventListener("click", () => {
        this.sound.play("click");
        ov.classList.add("hidden");
        this.loadLevel(Number(b.dataset.i));
      });
    });
  }

  /**
   * Isim duzenleme: oyun ici panel (window.prompt iOS WKWebView'de calismaz,
   * magaza derlemesinde isim degistirme kirilirdi).
   */
  private editName(after: () => void) {
    const ov = this.q("#overlay");
    ov.innerHTML = `
      <div class="panel name-panel">
        <div class="ad-emoji">👤</div>
        <h2>${t("changeNameLabel")}</h2>
        <input class="name-input" id="name-input" maxlength="16"
          autocomplete="off" autocorrect="off" spellcheck="false"
          value="${esc(this.playerName())}" />
        <div class="win-actions">
          <button class="btn primary" id="name-save">${t("saveBtn")}</button>
          <button class="btn ghost" id="name-cancel">${t("cancel")}</button>
        </div>
      </div>`;
    ov.classList.remove("hidden");
    const input = this.q<HTMLInputElement>("#name-input");
    input.focus();
    input.select();
    const done = () => {
      const name = input.value.trim().slice(0, 16);
      if (name) {
        this.save.name = name;
        persist(this.save);
      }
      this.sound.play("click");
      after();
    };
    this.q("#name-save").addEventListener("click", done);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") done();
    });
    this.q("#name-cancel").addEventListener("click", () => {
      this.sound.play("click");
      after();
    });
  }

  // ---------- Ayarlar ----------
  private showSettings() {
    const ov = this.q("#overlay");
    const lm = LANGUAGES.find((l) => l.code === getLang())!;
    const swatches = THEMES.map(
      (th) =>
        `<button class="theme-dot ${th.id === this.save.theme ? "sel" : ""}" data-theme="${th.id}" style="background:${th.swatch}"></button>`
    ).join("");
    ov.innerHTML = `
      <div class="panel settings-panel">
        <h2>⚙️ ${t("settings")}</h2>
        <div class="set-row theme-row"><span>🎨 ${t("themeLabel")}</span><div class="theme-dots">${swatches}</div></div>
        <button class="set-row" id="s-sound"><span>🔊 ${t("soundLabel")}</span><b id="s-sound-val">${this.sound.isMuted() ? "✕" : "✓"}</b></button>
        <button class="set-row" id="s-music"><span>🎵 ${t("musicLabel")}</span><b id="s-music-val">${this.save.musicOn ? "✓" : "✕"}</b></button>
        <button class="set-row" id="s-big"><span>🔠 ${t("largeText")}</span><b id="s-big-val">${this.save.bigText ? "✓" : "✕"}</b></button>
        <button class="set-row" id="s-relaxed"><span>🌿 ${t("relaxedLabel")}</span><b id="s-relaxed-val">${this.save.relaxed ? "✓" : "✕"}</b></button>
        <button class="set-row" id="s-contrast"><span>◐ ${t("highContrastLabel")}</span><b id="s-contrast-val">${this.save.highContrast ? "✓" : "✕"}</b></button>
        <button class="set-row" id="s-automean"><span>💬 ${t("autoMeaningLabel")}</span><b id="s-automean-val">${this.save.autoMeaning ? "✓" : "✕"}</b></button>
        <button class="set-row" id="s-lang"><span>🌐 ${t("languageLabel")}</span><b>${lm.flag} ${lm.name}</b></button>
        <button class="set-row" id="s-name"><span>👤 ${t("changeNameLabel")}</span><b>${esc(this.playerName())}</b></button>
        <button class="set-row" id="s-howto"><span>❓ ${t("tutorialTitle")}</span><b>›</b></button>
        <button class="set-row danger" id="s-reset"><span>🗑️ ${t("resetProgress")}</span><b>›</b></button>
        <p class="about">${t("aboutLine")} · v1.0</p>
        <div class="win-actions"><button class="btn primary" id="s-close">${t("closeBtn")}</button></div>
      </div>`;
    ov.classList.remove("hidden");
    ov.querySelectorAll<HTMLButtonElement>(".theme-dot").forEach((d) => {
      d.addEventListener("click", () => {
        this.setTheme(d.dataset.theme!);
        ov.querySelectorAll(".theme-dot").forEach((x) => x.classList.remove("sel"));
        d.classList.add("sel");
      });
    });
    this.q("#s-music").addEventListener("click", () => {
      this.toggleMusic();
      this.q("#s-music-val").textContent = this.save.musicOn ? "✓" : "✕";
    });
    this.q("#s-big").addEventListener("click", () => {
      this.toggleBigText();
      this.q("#s-big-val").textContent = this.save.bigText ? "✓" : "✕";
    });
    this.q("#s-relaxed").addEventListener("click", () => {
      this.save.relaxed = !this.save.relaxed;
      persist(this.save);
      this.sound.play("tap");
      this.q("#s-relaxed-val").textContent = this.save.relaxed ? "✓" : "✕";
    });
    this.q("#s-contrast").addEventListener("click", () => {
      this.save.highContrast = !this.save.highContrast;
      persist(this.save);
      this.applyTheme();
      this.sound.play("tap");
      this.q("#s-contrast-val").textContent = this.save.highContrast ? "✓" : "✕";
    });
    this.q("#s-automean").addEventListener("click", () => {
      this.save.autoMeaning = !this.save.autoMeaning;
      persist(this.save);
      this.sound.play("tap");
      this.q("#s-automean-val").textContent = this.save.autoMeaning ? "✓" : "✕";
    });
    this.q("#s-lang").addEventListener("click", () => {
      this.sound.play("click");
      this.showLanguageSelect();
    });
    this.q("#s-sound").addEventListener("click", () => {
      this.toggleSound();
      this.q("#s-sound-val").textContent = this.sound.isMuted() ? "✕" : "✓";
    });
    this.q("#s-name").addEventListener("click", () => this.editName(() => this.showSettings()));
    this.q("#s-howto").addEventListener("click", () => {
      this.sound.play("click");
      this.showTutorial(true);
    });
    this.q("#s-reset").addEventListener("click", () => {
      this.sound.play("click");
      this.showResetConfirm();
    });
    this.q("#s-close").addEventListener("click", () => {
      this.sound.play("click");
      this.showHome();
    });
  }

  private showResetConfirm() {
    const ov = this.q("#overlay");
    ov.innerHTML = `
      <div class="panel ad-panel">
        <div class="ad-emoji">🗑️</div>
        <h2>${t("resetProgress")}</h2>
        <p class="win-sub">${t("resetConfirm")}</p>
        <div class="win-actions">
          <button class="btn danger-btn" id="r-yes">${t("yes")}</button>
          <button class="btn ghost" id="r-no">${t("cancel")}</button>
        </div>
      </div>`;
    this.q("#r-yes").addEventListener("click", () => {
      try { localStorage.removeItem("harfika.save.v3"); } catch { /* yok say */ }
      location.reload();
    });
    this.q("#r-no").addEventListener("click", () => {
      this.sound.play("click");
      this.showSettings();
    });
  }

  // ---------- Istatistik ----------
  private showStats() {
    const s = this.save.stats;
    const ov = this.q("#overlay");
    const badges = ACHIEVEMENTS.map((a) => {
      const got = this.save.achievements.includes(a.id);
      const sub = got ? t(a.titleKey) : a.progress ? a.progress(s) : "";
      return `<div class="badge ${got ? "got" : ""}" title="${t(a.titleKey)}">
        <span class="badge-ico">${got ? a.emoji : "🔒"}</span>
        <span class="badge-sub">${sub}</span>
      </div>`;
    }).join("");
    const got = this.save.achievements.length;
    ov.innerHTML = `
      <div class="panel stats-panel">
        <h2>📊 ${t("statsTitle")}</h2>
        <div class="stat-grid">
          <div class="stat-card"><b>${s.wordsFound}</b><span>${t("wordsFoundLabel")}</span></div>
          <div class="stat-card"><b>${s.levelsCompleted}</b><span>${t("levelsDoneLabel")}</span></div>
          <div class="stat-card"><b>${s.bonusFound}</b><span>${t("bonus")}</span></div>
          <div class="stat-card"><b>${s.bestStreak}</b><span>${t("bestStreakLabel")}</span></div>
          <div class="stat-card wide"><b>${s.bestWeekScore}</b><span>${t("bestWeekLabel")}</span></div>
        </div>
        <h3 class="stats-sub">🏅 ${t("achievements")} · ${got}/${ACHIEVEMENTS.length}</h3>
        <div class="badge-grid">${badges}</div>
        <div class="win-actions"><button class="btn primary" id="st-close">${t("closeBtn")}</button></div>
      </div>`;
    ov.classList.remove("hidden");
    this.q("#st-close").addEventListener("click", () => {
      this.sound.play("click");
      this.showHome();
    });
  }

  // ---------- Kelime Defteri ----------
  private showNotebook() {
    const words = [...(this.save.learned[getLang()] ?? [])].sort((a, b) =>
      a.localeCompare(b, getLang())
    );
    const ov = this.q("#overlay");
    const body = words.length
      ? `<div class="nb-grid">${words
          .map((w) => `<button class="nb-word" data-w="${w}">${w}</button>`)
          .join("")}</div>`
      : `<p class="hint-text nb-empty">${t("notebookEmpty")}</p>`;
    ov.innerHTML = `
      <div class="panel nb-panel">
        <h2>📖 ${t("notebook")} · ${words.length}</h2>
        ${body}
        <div class="win-actions"><button class="btn primary" id="nb-close">${t("closeBtn")}</button></div>
      </div>`;
    ov.classList.remove("hidden");
    ov.querySelectorAll<HTMLButtonElement>(".nb-word").forEach((b) => {
      b.addEventListener("click", () => this.showDefinition(b.dataset.w!, false));
    });
    this.q("#nb-close").addEventListener("click", () => {
      this.sound.play("click");
      this.showHome();
    });
  }

  // ---------- Ogretici ----------
  private showTutorial(fromSettings = false) {
    const ov = this.q("#overlay");
    ov.innerHTML = `
      <div class="panel tut-panel">
        <h2>📖 ${t("tutorialTitle")}</h2>
        <div class="tut-step"><div class="tut-ico">✋</div><p>${t("tut1")}</p></div>
        <div class="tut-step"><div class="tut-ico">🧩</div><p>${t("tut2")}</p></div>
        <div class="tut-step"><div class="tut-ico">📖</div><p>${t("tut3")}</p></div>
        <div class="win-actions"><button class="btn primary" id="tut-ok">${t("gotIt")}</button></div>
      </div>`;
    ov.classList.remove("hidden");
    this.q("#tut-ok").addEventListener("click", () => {
      this.sound.play("click");
      if (fromSettings) {
        this.showSettings();
      } else {
        this.save.tutorialSeen = true;
        persist(this.save);
        if (!this.showDailyReward()) this.showHome();
      }
    });
  }

  // ---------- Seviye yukleme ----------
  private loadLevel(index: number) {
    this.daily = false;
    this.levelIndex = index;
    this.gen = makeLevel(getLang(), index, this.save.salt);
    this.startLevel();
  }

  private loadDaily() {
    this.daily = true;
    this.levelIndex = -1;
    this.gen = makeDailyLevel(getLang(), dayStr(new Date()));
    this.startLevel();
  }

  private startLevel() {
    this.crossword = buildCrossword(this.gen.words);
    this.found.clear();
    this.hintedWords.clear();
    const prog = progressFor(this.save, getLang());
    this.bonus = new Set(this.daily ? [] : prog.bonusFound[this.levelIndex] ?? []);
    this.combo = 0;

    const world = this.daily ? "🗓️" : worldEmoji(Math.floor(this.levelIndex / 10));
    this.q("#world-mark").textContent = world;
    this.elLevelName.textContent = this.daily
      ? `🗓️ ${t("dailyPuzzle")}`
      : `${world} ${t("levelWord")} ${this.levelIndex + 1}`;
    this.wheel.setLetters(this.gen.letters, this.gen.words);
    this.wheel.shuffle();
    this.renderBoard();
    this.renderFound();
    this.updateJar();
    this.updateCombo();
    this.updateProgress();
  }

  private renderBoard() {
    const cw = this.crossword;
    this.elBoard.style.setProperty("--cols", String(cw.cols));
    this.elBoard.style.setProperty("--rows", String(cw.rows));
    this.elBoard.innerHTML = "";
    this.cellEls.clear();

    for (const cell of cw.cells) {
      const el = document.createElement("div");
      el.className = "cell";
      el.style.gridColumn = String(cell.col + 1);
      el.style.gridRow = String(cell.row + 1);
      const span = document.createElement("span");
      span.textContent = cell.letter;
      el.appendChild(span);
      this.elBoard.appendChild(el);
      this.cellEls.set(`${cell.row},${cell.col}`, el);
    }

    this.layoutBoard();
  }

  /**
   * Hücre boyutu: tahtayı hem GENİŞLİĞE hem YÜKSEKLİĞE sığdırır.
   * (Eskiden yalnızca sütun sayısına bakılıyordu; uzun bulmacalar aşağı
   * taşıp kelime rozetlerinin/butonların üstüne biniyordu.)
   */
  private layoutBoard() {
    if (!this.crossword) return;
    const cw = this.crossword;
    const wrap = this.elBoard.parentElement;
    if (!wrap) return;
    const availW = Math.min(wrap.clientWidth * 0.94, 440);
    const availH = Math.max(wrap.clientHeight - 12, 80);
    const gap = Math.round(Math.min(Math.max(availW * 0.014, 3), 6));
    const size = Math.floor(
      Math.min(
        (availW - gap * (cw.cols - 1)) / cw.cols,
        (availH - gap * (cw.rows - 1)) / cw.rows
      )
    );
    const cell = Math.max(20, Math.min(size, 54));
    this.elBoard.style.setProperty("--cell-max", `${cell}px`);
    this.elBoard.style.gap = `${gap}px`;
    this.elBoard.style.width = `${cw.cols * cell + gap * (cw.cols - 1)}px`;
  }

  private renderFound() {
    this.elFound.innerHTML = "";
    if (this.found.size === 0 && this.bonus.size === 0) {
      const hint = document.createElement("span");
      hint.className = "found-hint";
      hint.textContent = t("tapForMeaning");
      this.elFound.appendChild(hint);
      return;
    }
    for (const w of this.found) this.addPill(w, false);
    for (const w of this.bonus) this.addPill(w, true);
  }

  private addPill(word: string, isBonus: boolean) {
    // Placeholder ipucunu temizle.
    const hint = this.elFound.querySelector(".found-hint");
    if (hint) hint.remove();
    const pill = document.createElement("button");
    pill.className = `found-pill ${isBonus ? "bonus" : ""}`;
    pill.textContent = word;
    pill.addEventListener("click", () => this.showDefinition(word, isBonus));
    this.elFound.appendChild(pill);
  }

  // ---------- Kelime anlami ----------
  private showDefinition(word: string, isBonus: boolean) {
    this.sound.play("tap");
    document.getElementById("defpop")?.remove();
    const def = defOf(getLang(), word) ?? t("noDefinition");
    const pop = document.createElement("div");
    pop.id = "defpop";
    pop.className = "defpop";
    pop.innerHTML = `
      <div class="defpop-card ${isBonus ? "bonus" : ""}">
        <div class="defpop-word">${word}</div>
        <div class="defpop-def">${def}</div>
      </div>`;
    document.body.appendChild(pop);
    requestAnimationFrame(() => pop.classList.add("show"));
    const close = () => {
      pop.classList.remove("show");
      setTimeout(() => pop.remove(), 200);
    };
    pop.addEventListener("click", close);
    setTimeout(close, 3500);
  }

  // ---------- Cark olaylari ----------
  private onPreview(word: string) {
    if (!word) {
      this.elPreview.className = "preview";
      this.elPreview.textContent = "";
      return;
    }
    this.elPreview.textContent = word;
    this.elPreview.className = `preview show ${this.classify(word)}`;
  }

  private classify(word: string): "new" | "dup" | "none" {
    const isPlaced = this.crossword.placed.some((p) => p.word === word);
    const isBonus = this.crossword.bonus.includes(word);
    if ((isPlaced && !this.found.has(word)) || (isBonus && !this.bonus.has(word)))
      return "new";
    if (this.found.has(word) || this.bonus.has(word)) return "dup";
    return "none";
  }

  private onSubmit(word: string) {
    const placed = this.crossword.placed.find((p) => p.word === word);
    const isBonus = this.crossword.bonus.includes(word);

    if (placed && !this.found.has(word)) {
      this.found.add(word);
      this.save.stats.wordsFound++;
      this.learnWord(word);
      if (navigator.vibrate) navigator.vibrate([0, 18, 30, 18]);
      this.sound.play("found");
      this.revealWord(word);
      this.bumpCombo();
      // İpucu cezasi: kelimeye alinan her ipucu harfi puani %25 azaltir
      // (alt sinir: harf basina 2 puan). Tamamen ipucuyla acildiysa minimuma duser.
      const base = word.length * 10 + this.combo * 5;
      const hints = this.hintedWords.get(word) ?? 0;
      const pts = Math.max(Math.round(base * Math.max(0, 1 - 0.25 * hints)), word.length * 2);
      this.addScore(pts);
      this.addPill(word, false);
      this.floatWord(word, "good", pts, hints > 0);
      // Pangram: çarkın tüm harflerini kullanan kelime -> bonus + ışıltı.
      if (hints === 0 && new Set(word).size === new Set(this.gen.letters).size) {
        const bonus = this.gen.letters.length * 5;
        this.addScore(bonus);
        this.save.stats.pangrams++;
        this.fx.celebrate();
        this.sound.play("achievement");
        this.toast(`✨ PANGRAM!  +${bonus}`);
      } else if (this.save.autoMeaning) {
        // Otomatik anlam flaşı: bulunan kelimenin anlamını kısa göster.
        const d = defOf(getLang(), word);
        if (d) this.toast(`${word}: ${d}`);
      }
      this.flyFireflies(word);
      this.updateProgress();
      this.checkAchievements();
      this.checkComplete();
    } else if (isBonus && !this.bonus.has(word)) {
      this.bonus.add(word);
      this.save.stats.bonusFound++;
      this.learnWord(word);
      if (navigator.vibrate) navigator.vibrate([0, 18, 30, 18]);
      const prog = progressFor(this.save, getLang());
      if (!this.daily) prog.bonusFound[this.levelIndex] = [...this.bonus];
      this.save.fireflies += 1;
      persist(this.save);
      this.sound.play("bonus");
      this.bumpCombo();
      this.addScore(word.length * 15);
      this.updateJar();
      this.addPill(word, true);
      this.floatWord(word, "bonus");
      this.flyFireflies(word, true);
      this.toast(`${t("bonusFound")} (${word})`);
      this.checkAchievements();
    } else if (this.found.has(word) || this.bonus.has(word)) {
      this.sound.play("tap");
      this.elPreview.classList.add("flash-dup");
      setTimeout(() => this.elPreview.classList.remove("flash-dup"), 300);
    } else {
      this.combo = 0;
      this.updateCombo();
      if (navigator.vibrate) navigator.vibrate(40);
      this.sound.play("error");
      this.elPreview.classList.add("shake");
      setTimeout(() => this.elPreview.classList.remove("shake"), 320);
    }
  }

  private revealWord(word: string) {
    const p = this.crossword.placed.find((x) => x.word === word)!;
    const dr = p.dir === "V" ? 1 : 0;
    const dc = p.dir === "H" ? 1 : 0;
    for (let i = 0; i < word.length; i++) {
      const el = this.cellEls.get(`${p.row + dr * i},${p.col + dc * i}`);
      if (!el) continue;
      setTimeout(() => el.classList.add("revealed", "pop"), i * 80);
      setTimeout(() => el.classList.remove("pop"), i * 80 + 420);
    }
  }

  // ---------- Combo / aurora ----------
  private bumpCombo() {
    this.combo++;
    if (this.combo > this.save.stats.maxCombo) this.save.stats.maxCombo = this.combo;
    this.updateCombo();
  }

  private updateCombo() {
    const c = this.combo;
    if (c >= 2) {
      this.elCombo.textContent = `🔥 ${t("streak", { n: c })}`;
      this.elCombo.className = "combo show";
      this.elCombo.style.animation = "none";
      void this.elCombo.offsetWidth;
      this.elCombo.style.animation = "combopop 0.4s ease";
    } else {
      this.elCombo.className = "combo";
    }
    const intensity = Math.min(c, 6) / 6;
    document.body.style.setProperty("--aurora", intensity.toFixed(2));
  }

  private floatWord(
    word: string,
    kind: "good" | "bonus",
    pts = 0,
    penalized = false
  ) {
    const box = this.elPreview.getBoundingClientRect();
    const el = document.createElement("div");
    el.className = `float-word ${kind}${penalized ? " penalized" : ""}`;
    if (kind === "bonus") {
      el.textContent = `+1 🪲 ${word}`;
    } else {
      el.textContent = pts ? `${word}  +${pts}${penalized ? " ⬇" : ""}` : word;
    }
    el.style.left = `${box.left + box.width / 2}px`;
    el.style.top = `${box.top}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  // ---------- Kavanoz ----------
  private updateJar() {
    this.elJarCount.textContent = String(this.save.fireflies);
    const cap = 5;
    const fill = Math.min(this.save.fireflies, cap) / cap;
    this.elJarFill.style.height = `${fill * 100}%`;
    this.elHint.classList.toggle("dim", this.save.fireflies <= 0);
  }

  private flyFireflies(word: string, fromPreview = false) {
    const jar = this.elJar.getBoundingClientRect();
    let from: DOMRect;
    if (fromPreview) {
      from = this.elPreview.getBoundingClientRect();
    } else {
      const p = this.crossword.placed.find((x) => x.word === word)!;
      const el = this.cellEls.get(`${p.row},${p.col}`);
      from = (el ?? this.elPreview).getBoundingClientRect();
    }
    this.fx.burst(
      from.left + from.width / 2,
      from.top + from.height / 2,
      jar.left + jar.width / 2,
      jar.top + jar.height / 2,
      Math.min(5 + word.length, 13)
    );
  }

  // ---------- Ipucu ----------
  private useHint() {
    const cost = this.save.relaxed ? 0 : HINT_COST;
    if (this.save.fireflies < cost) {
      this.toast(t("noFireflies"));
      this.showAdOffer();
      return;
    }
    const unfound = this.crossword.placed.filter((p) => !this.found.has(p.word));
    if (unfound.length === 0) return;
    const target = unfound[Math.floor(Math.random() * unfound.length)];
    const dr = target.dir === "V" ? 1 : 0;
    const dc = target.dir === "H" ? 1 : 0;
    for (let i = 0; i < target.word.length; i++) {
      const k = `${target.row + dr * i},${target.col + dc * i}`;
      const el = this.cellEls.get(k);
      if (el && !el.classList.contains("revealed")) {
        el.classList.add("revealed", "hinted", "pop");
        this.sound.play("hint");
        setTimeout(() => el.classList.remove("pop"), 420);
        this.save.fireflies -= cost;
        // Bu kelimeye ipucu cezasi ekle (bulununca puani azalacak).
        this.hintedWords.set(target.word, (this.hintedWords.get(target.word) ?? 0) + 1);
        persist(this.save);
        this.updateJar();
        return;
      }
    }
  }

  /** Joker: rastgele bir kelimeyi tamamen açar (yüksek bedel, minimum puan). */
  private revealRandomWord() {
    const COST = this.save.relaxed ? 1 : 3;
    const unfound = this.crossword.placed.filter((p) => !this.found.has(p.word));
    if (unfound.length === 0) return;
    if (this.save.fireflies < COST) {
      this.toast(t("noFireflies"));
      this.showAdOffer();
      return;
    }
    this.save.fireflies -= COST;
    const target = unfound[Math.floor(Math.random() * unfound.length)];
    const word = target.word;
    this.found.add(word);
    this.save.stats.wordsFound++;
    this.learnWord(word);
    this.hintedWords.set(word, word.length); // tamamen açık -> puan minimuma iner
    this.revealWord(word);
    const pts = word.length * 2;
    this.addScore(pts);
    this.addPill(word, false);
    this.floatWord(word, "good", pts, true);
    this.sound.play("reward");
    persist(this.save);
    this.updateJar();
    this.updateProgress();
    this.checkAchievements();
    this.checkComplete();
  }

  // ---------- Ateşböceği: gerçek ödüllü reklam veya hediye ----------
  private async showAdOffer() {
    // Native + AdMob varsa gerçek ödüllü reklam; web/başarısızsa hediye.
    if (ADS_ENABLED) {
      const rewarded = await showRewardedAd();
      if (rewarded) {
        this.adReward();
        return;
      }
    }
    this.showGift();
  }

  /** Reklam kapalıyken: doğrudan ateşböceği hediyesi (gerçek reklam yok). */
  private showGift() {
    const ov = this.q("#overlay");
    ov.innerHTML = `
      <div class="panel ad-panel">
        <div class="ad-emoji">🎁</div>
        <h2>${t("adTitle")}</h2>
        <div class="win-actions">
          <button class="btn primary" id="gift-claim">${t("adClaim")}</button>
          <button class="btn ghost" id="gift-close">${t("adNoThanks")}</button>
        </div>
      </div>`;
    ov.classList.remove("hidden");
    this.q("#gift-claim").addEventListener("click", () => this.adReward());
    this.q("#gift-close").addEventListener("click", () => {
      this.sound.play("click");
      ov.classList.add("hidden");
    });
  }

  private adReward() {
    const ov = this.q("#overlay");
    this.save.fireflies += AD_REWARD;
    persist(this.save);
    this.updateJar();
    this.sound.play("reward");
    ov.innerHTML = `
      <div class="panel ad-panel">
        <div class="ad-emoji bob">🪲</div>
        <h2>+${AD_REWARD} 🪲</h2>
        <div class="win-actions">
          <button class="btn primary" id="ad-done">${t("adClaim")}</button>
        </div>
      </div>`;
    this.q("#ad-done").addEventListener("click", () => {
      ov.classList.add("hidden");
      const jar = this.elJar.getBoundingClientRect();
      this.fx.burst(
        window.innerWidth / 2,
        window.innerHeight / 2,
        jar.left + jar.width / 2,
        jar.top + jar.height / 2,
        14
      );
    });
  }

  // ---------- Gunluk odul ----------
  private showDailyReward(): boolean {
    const today = dayStr(new Date());
    if (this.save.lastClaim === today) return false;

    const yesterday = dayStr(new Date(Date.now() - 86400000));
    const twoDaysAgo = dayStr(new Date(Date.now() - 2 * 86400000));
    const FREEZE_COST = 5;
    // Seri dondurucu: tam 1 gün kaçırdıysa ve serisi değerliyse, ateşböceği
    // karşılığı seriyi kurtarma teklifi.
    if (
      this.save.lastClaim === twoDaysAgo &&
      this.save.streak >= 2 &&
      this.save.fireflies >= FREEZE_COST
    ) {
      this.showStreakFreeze(FREEZE_COST);
      return true;
    }
    const newStreak = this.save.lastClaim === yesterday ? this.save.streak + 1 : 1;
    this.showDailyRewardPanel(newStreak);
    return true;
  }

  private showStreakFreeze(cost: number) {
    const ov = this.q("#overlay");
    ov.innerHTML = `
      <div class="panel daily-panel">
        <div class="daily-emoji">🧊</div>
        <h2>${t("streakFreezeTitle")}</h2>
        <p class="win-sub">${t("streakFreezeDesc", { n: cost, s: this.save.streak })}</p>
        <div class="win-actions">
          <button class="btn primary" id="fr-yes">${t("streakFreezeYes", { n: cost })}</button>
          <button class="btn ghost" id="fr-no">${t("streakFreezeNo")}</button>
        </div>
      </div>`;
    ov.classList.remove("hidden");
    this.q("#fr-yes").addEventListener("click", () => {
      this.save.fireflies -= cost;
      persist(this.save);
      this.updateJar();
      this.sound.play("reward");
      this.showDailyRewardPanel(this.save.streak + 1);
    });
    this.q("#fr-no").addEventListener("click", () => {
      this.sound.play("click");
      this.showDailyRewardPanel(1);
    });
  }

  private showDailyRewardPanel(newStreak: number) {
    const today = dayStr(new Date());
    const reward = Math.min(2 + newStreak, 8);

    const ov = this.q("#overlay");
    ov.innerHTML = `
      <div class="panel daily-panel">
        <div class="daily-emoji">🎁</div>
        <h2>${t("dailyTitle")}</h2>
        <p class="win-sub">${t("dailyStreak", { n: newStreak })}</p>
        <div class="daily-dots">${this.dailyDots(newStreak)}</div>
        <div class="win-actions">
          <button class="btn primary" id="daily-claim">${t("dailyClaim", { n: reward })}</button>
        </div>
        <p class="hint-text">${t("dailyComeBack")}</p>
      </div>`;
    ov.classList.remove("hidden");
    this.q("#daily-claim").addEventListener("click", () => {
      this.save.fireflies += reward;
      this.save.lastClaim = today;
      this.save.streak = newStreak;
      if (newStreak > this.save.stats.bestStreak)
        this.save.stats.bestStreak = newStreak;
      persist(this.save);
      this.updateJar();
      this.sound.play("reward");
      this.checkAchievements();
      const jar = this.elJar.getBoundingClientRect();
      this.fx.burst(
        window.innerWidth / 2,
        window.innerHeight / 2,
        jar.left + jar.width / 2,
        jar.top + jar.height / 2,
        16
      );
      ov.classList.add("hidden");
      setTimeout(() => this.showHome(), 200);
    });
    return true;
  }

  private dailyDots(streak: number): string {
    let out = "";
    for (let i = 1; i <= 7; i++) {
      const filled = i <= ((streak - 1) % 7) + 1;
      out += `<span class="daily-dot ${filled ? "on" : ""}">${i}</span>`;
    }
    return out;
  }

  // ---------- Lider tablosu ----------
  private async showLeaderboard() {
    this.ensureWeek();
    const ov = this.q("#overlay");
    // Önce iskelet/yükleniyor (online çekiliyor olabilir).
    ov.innerHTML = `
      <div class="panel lb-panel">
        <h2>🏆 ${t("leaderboard")}</h2>
        <p class="win-sub">${t("thisWeek")}</p>
        <div class="lb-list" id="lb-list"><div class="lb-loading">…</div></div>
        <p class="hint-text">${t("weekResetsInfo")}</p>
        <div class="win-actions">
          <button class="btn primary" id="lb-close">${t("closeBtn")}</button>
        </div>
      </div>`;
    ov.classList.remove("hidden");
    this.q("#lb-close").addEventListener("click", () => {
      this.sound.play("click");
      this.showHome();
    });

    const board = await getBoard(
      weekId(),
      this.playerName(),
      this.save.weekScore,
      String(this.save.salt)
    );
    // Panel hâlâ açıksa doldur.
    const list = this.root.querySelector("#lb-list");
    if (!list) return;
    list.innerHTML = board
      .map((e) => {
        const medal = e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : `${e.rank}`;
        return `<div class="lb-row ${e.isPlayer ? "me" : ""}">
          <span class="lb-rank">${medal}</span>
          <span class="lb-name">${esc(e.name)}</span>
          <span class="lb-score">${e.score}</span>
        </div>`;
      })
      .join("");
    const me = list.querySelector(".lb-row.me");
    if (me) me.scrollIntoView({ block: "center" });
  }

  // ---------- Tamamlanma ----------
  private checkComplete() {
    if (this.found.size < this.crossword.placed.length) return;
    setTimeout(() => this.levelComplete(), 650);
  }

  private levelComplete() {
    if (this.daily) {
      this.dailyComplete();
      return;
    }
    const prog = progressFor(this.save, getLang());
    const wasNew = this.levelIndex === prog.completed;
    if (wasNew) {
      prog.completed = this.levelIndex + 1;
      this.save.stats.levelsCompleted++;
      this.save.fireflies += LEVEL_REWARD;
      this.addScore(100);
    }
    persist(this.save);
    this.updateJar();
    this.fx.celebrate();
    this.sound.play("win");
    this.checkAchievements();

    // Bölüm sonu sandığı: her 10. seviye ilk kez bitirildiğinde sürpriz ödül.
    if (wasNew && (this.levelIndex + 1) % 10 === 0) {
      this.showChest(() => this.showWinPanel());
      return;
    }
    this.showWinPanel();
  }

  private showChest(after: () => void) {
    const CHEST_REWARD = 10;
    const ov = this.q("#overlay");
    ov.innerHTML = `
      <div class="panel daily-panel">
        <div class="daily-emoji">🎁</div>
        <h2>${t("chestTitle")}</h2>
        <p class="win-sub">${t("chestDesc", { n: Math.floor((this.levelIndex + 1) / 10) })}</p>
        <div class="win-actions">
          <button class="btn primary" id="chest-open">${t("chestOpen", { n: CHEST_REWARD })}</button>
        </div>
      </div>`;
    ov.classList.remove("hidden");
    this.q("#chest-open").addEventListener("click", () => {
      this.save.fireflies += CHEST_REWARD;
      persist(this.save);
      this.updateJar();
      this.sound.play("achievement");
      this.fx.celebrate();
      const jar = this.elJar.getBoundingClientRect();
      this.fx.burst(
        window.innerWidth / 2,
        window.innerHeight / 2,
        jar.left + jar.width / 2,
        jar.top + jar.height / 2,
        18
      );
      after();
    });
  }

  private showWinPanel() {
    const ov = this.q("#overlay");
    ov.innerHTML = `
      <div class="panel win-panel">
        <div class="win-emoji">${this.gen.emoji}</div>
        <h2>${t("levelComplete")}</h2>
        <p class="win-sub">${t("levelWord")} ${this.levelIndex + 1}</p>
        <div class="win-stats">
          <div><b>${this.found.size}</b><span>${t("words")}</span></div>
          <div><b>${this.bonus.size}</b><span>${t("bonus")}</span></div>
          <div><b>${this.save.weekScore}</b><span>${t("score")}</span></div>
        </div>
        <div class="win-actions">
          <button class="btn primary" id="btn-next">${t("nextLevel")}</button>
          <button class="btn ghost" id="btn-share">📤 ${t("share")}</button>
          <button class="btn ghost" id="btn-menu">${t("backToLevels")}</button>
        </div>
      </div>`;
    ov.classList.remove("hidden");
    this.q("#btn-next").addEventListener("click", () => {
      this.sound.play("click");
      ov.classList.add("hidden");
      this.loadLevel(this.levelIndex + 1);
    });
    this.q("#btn-share").addEventListener("click", () =>
      this.share(
        `Lumio 🏮\n${t("levelWord")} ${this.levelIndex + 1} ✓ · ${this.found.size}/${this.crossword.placed.length}`
      )
    );
    this.q("#btn-menu").addEventListener("click", () => {
      this.sound.play("click");
      this.showHome();
    });
  }

  private dailyComplete() {
    const today = dayStr(new Date());
    const firstToday = this.save.dailyDone !== today;
    if (firstToday) {
      this.save.dailyDone = today;
      this.save.stats.dailies++;
      this.save.fireflies += 3;
      this.addScore(50);
    }
    persist(this.save);
    this.updateJar();
    this.fx.celebrate();
    this.sound.play("win");
    this.checkAchievements();

    const ov = this.q("#overlay");
    ov.innerHTML = `
      <div class="panel win-panel">
        <div class="win-emoji">🗓️</div>
        <h2>${t("dailyPuzzle")}</h2>
        <p class="win-sub">${t("levelComplete")}</p>
        <div class="win-stats">
          <div><b>${this.found.size}</b><span>${t("words")}</span></div>
          <div><b>${this.bonus.size}</b><span>${t("bonus")}</span></div>
          <div><b>+${firstToday ? 3 : 0}</b><span>🪲</span></div>
        </div>
        <div class="win-actions">
          <button class="btn primary" id="btn-share">📤 ${t("share")}</button>
          <button class="btn ghost" id="btn-menu">${t("closeBtn")}</button>
        </div>
      </div>`;
    ov.classList.remove("hidden");
    this.q("#btn-share").addEventListener("click", () =>
      this.share(this.dailyShareText())
    );
    this.q("#btn-menu").addEventListener("click", () => {
      this.sound.play("click");
      this.showHome();
    });
  }

  /**
   * Günlük bulmaca emoji özeti (Wordle tarzı): bulmacanın şekli 🟩,
   * ipucuyla açılan kelimelerin hücreleri 🟨, boşluklar ⬛.
   */
  private dailyShareText(): string {
    const cw = this.crossword;
    const hintedCells = new Set<string>();
    for (const p of cw.placed) {
      if ((this.hintedWords.get(p.word) ?? 0) > 0) {
        const dr = p.dir === "V" ? 1 : 0;
        const dc = p.dir === "H" ? 1 : 0;
        for (let i = 0; i < p.word.length; i++)
          hintedCells.add(`${p.row + dr * i},${p.col + dc * i}`);
      }
    }
    const have = new Set(cw.cells.map((c) => `${c.row},${c.col}`));
    let grid = "";
    for (let r = 0; r < cw.rows; r++) {
      for (let c = 0; c < cw.cols; c++) {
        const k = `${r},${c}`;
        grid += have.has(k) ? (hintedCells.has(k) ? "🟨" : "🟩") : "⬛";
      }
      grid += "\n";
    }
    const streak = this.save.streak > 0 ? ` · 🔥${this.save.streak}` : "";
    return (
      `Lumio 🏮 ${t("dailyPuzzle")} · ${dayStr(new Date())}\n` +
      grid +
      `${this.found.size}/${this.crossword.placed.length} ✓${streak}\n` +
      `https://uchihavayne.github.io/lumio3/`
    );
  }

  /** Sonuç paylaşımı: Web Share API, yoksa panoya kopyalar. */
  private async share(text: string) {
    this.sound.play("click");
    try {
      const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
      if (nav.share) {
        await nav.share({ text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        this.toast("✓");
      }
    } catch {
      /* iptal / yok say */
    }
  }

  // ---------- Toast ----------
  private toast(msg: string) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    this.root.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 300);
    }, 1700);
  }
}
