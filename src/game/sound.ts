// Web Audio ile sentezlenen ses efektleri — harici dosya yok, küçük ve offline.
// İlk kullanıcı etkileşiminde AudioContext başlatılır (tarayıcı politikası).

type SfxName =
  | "tap"
  | "found"
  | "bonus"
  | "error"
  | "hint"
  | "win"
  | "reward"
  | "achievement"
  | "click";

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private muted = false;
  private musicWanted = false;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private noteIndex = 0;

  constructor(muted: boolean) {
    this.muted = muted;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.9;
  }

  isMuted() {
    return this.muted;
  }

  /** İlk dokunuşta çağrılır; AudioContext'i hazırlar. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
      // Müzik kanalı ayrı (SFX susturma müziği etkilemez).
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.0;
      this.musicGain.connect(this.ctx.destination);
      if (this.musicWanted) this.startMusic();
    } catch {
      this.ctx = null;
    }
  }

  // ---------- Arka plan müziği (yumuşak arpej döngüsü) ----------
  setMusicEnabled(on: boolean) {
    this.musicWanted = on;
    if (on) {
      this.unlock();
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  isMusicOn() {
    return this.musicWanted;
  }

  /**
   * "Sessiz mod otomasyonu": uygulama arka planda / görünmez olduğunda sesi
   * kıs. Tarayıcı OS "rahatsız etme"yi doğrudan sunmadığından, en güvenilir
   * yaklaşım görünürlüğe göre susturmaktır. Görünürken müzik istenmişse döner.
   */
  setActive(active: boolean) {
    if (!this.ctx) return;
    if (active) {
      void this.ctx.resume();
      if (this.musicWanted) this.startMusic();
    } else {
      this.stopMusic();
      void this.ctx.suspend();
    }
  }

  private startMusic() {
    if (!this.ctx || !this.musicGain || this.musicTimer !== null) return;
    this.musicGain.gain.setTargetAtTime(0.16, this.ctx.currentTime, 1.2);
    this.musicTimer = window.setInterval(() => this.musicTick(), 460);
    this.musicTick();
  }

  private stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.musicGain && this.ctx)
      this.musicGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.6);
  }

  private musicTick() {
    if (!this.ctx || !this.musicGain) return;
    // Pentatonik arpej + arada bas notası — sakin, tekrar etmeyen his.
    const arp = [261.63, 329.63, 392.0, 493.88, 587.33, 392.0, 329.63, 440.0];
    const i = this.musicStep++ % arp.length;
    const f = arp[i];
    const t0 = this.ctx.currentTime;
    const voice = (freq: number, dur: number, peak: number, type: OscillatorType) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(peak, t0 + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(this.musicGain!);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    };
    voice(f, 0.9, 0.5, "sine");
    if (i % 4 === 0) voice(f / 2, 1.4, 0.45, "triangle"); // bas
  }

  private tone(
    freq: number,
    start: number,
    dur: number,
    type: OscillatorType,
    peak: number
  ) {
    if (!this.ctx || !this.master) return;
    const t0 = this.ctx.currentTime + start;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /** Çarkta her harf seçildiğinde yükselen ferah ton. */
  step(order: number) {
    if (this.muted) return;
    this.unlock();
    // Pentatonik tını — sürükledikçe tırmanır.
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
    const f = scale[Math.min(order, scale.length - 1)];
    this.tone(f, 0, 0.18, "triangle", 0.18);
  }

  play(name: SfxName) {
    if (this.muted) return;
    this.unlock();
    if (!this.ctx) return;
    switch (name) {
      case "tap":
        this.tone(660, 0, 0.1, "triangle", 0.12);
        break;
      case "click":
        this.tone(440, 0, 0.07, "square", 0.08);
        break;
      case "found":
        this.tone(659.25, 0, 0.16, "triangle", 0.2);
        this.tone(987.77, 0.09, 0.2, "triangle", 0.16);
        break;
      case "bonus":
        this.tone(783.99, 0, 0.14, "sine", 0.2);
        this.tone(1046.5, 0.08, 0.16, "sine", 0.18);
        this.tone(1318.5, 0.16, 0.22, "sine", 0.16);
        break;
      case "hint":
        this.tone(880, 0, 0.18, "sine", 0.16);
        this.tone(1174.66, 0.1, 0.2, "sine", 0.12);
        break;
      case "error":
        this.tone(196, 0, 0.18, "sawtooth", 0.12);
        this.tone(146.83, 0.08, 0.2, "sawtooth", 0.1);
        break;
      case "reward":
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
          this.tone(f, i * 0.08, 0.2, "triangle", 0.18)
        );
        break;
      case "achievement":
        [659.25, 830.61, 987.77, 1318.5].forEach((f, i) =>
          this.tone(f, i * 0.1, 0.3, "sine", 0.2)
        );
        this.tone(523.25, 0, 0.6, "triangle", 0.1);
        break;
      case "win":
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
          this.tone(f, i * 0.11, 0.32, "triangle", 0.2)
        );
        this.tone(392, 0.0, 0.5, "sine", 0.1);
        break;
    }
    this.noteIndex++;
  }
}
