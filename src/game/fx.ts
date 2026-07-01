// Görsel efekt katmani (tek canvas, tam ekran):
//  - Yildiz alani (titreşen yildizlar)
//  - Suzulen ateşböcekleri (izli, parlak)
//  - Kelime bulununca kavanoza ucan ateşböceği patlamasi (izli)
//  - Seviye bitince konfeti yagmuru

interface Firefly {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  phase: number;
  size: number;
  hue: number;
  life: number;
  max: number;
  target?: { x: number; y: number };
}

interface Star {
  x: number;
  y: number;
  r: number;
  tw: number;
  sp: number;
}

interface Confetto {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  color: string;
  life: number;
  max: number;
}

const CONFETTI_COLORS = ["#ffcf6b", "#5be3a3", "#7b8cff", "#ff7b8a", "#ffffff", "#f4a52a"];

export class FireflyLayer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stars: Star[] = [];
  private ambient: Firefly[] = [];
  private flying: Firefly[] = [];
  private confetti: Confetto[] = [];
  private w = 0;
  private h = 0;
  private dpr = Math.min(window.devicePixelRatio || 1, 2);

  constructor(parent: HTMLElement) {
    this.canvas = document.createElement("canvas");
    this.canvas.className = "fx-layer";
    parent.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d")!;
    this.resize();
    window.addEventListener("resize", () => this.resize());
    requestAnimationFrame(this.loop);
  }

  private resize() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.canvas.style.width = this.w + "px";
    this.canvas.style.height = this.h + "px";
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.seedStars();
    this.seedAmbient();
  }

  private seedStars() {
    const n = Math.round((this.w * this.h) / 9000);
    this.stars = [];
    for (let i = 0; i < n; i++) {
      this.stars.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h * 0.85,
        r: Math.random() * 1.3 + 0.3,
        tw: Math.random() * Math.PI * 2,
        sp: 0.6 + Math.random() * 1.4,
      });
    }
  }

  private seedAmbient() {
    const n = Math.max(10, Math.round(this.w / 40));
    this.ambient = [];
    for (let i = 0; i < n; i++) this.ambient.push(this.makeAmbient());
  }

  private makeAmbient(): Firefly {
    const x = Math.random() * this.w;
    const y = Math.random() * this.h;
    return {
      x, y, px: x, py: y,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      phase: Math.random() * Math.PI * 2,
      size: 1.2 + Math.random() * 1.8,
      hue: 45 + Math.random() * 22,
      life: 0,
      max: Infinity,
    };
  }

  /** Bir noktadan hedefe (kavanoz) izli ateşböcekleri firlat. */
  burst(fromX: number, fromY: number, toX: number, toY: number, count = 8) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1 + Math.random() * 2.4;
      this.flying.push({
        x: fromX + (Math.random() - 0.5) * 30,
        y: fromY + (Math.random() - 0.5) * 30,
        px: fromX, py: fromY,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1,
        phase: Math.random() * Math.PI * 2,
        size: 2 + Math.random() * 2.2,
        hue: 44 + Math.random() * 18,
        life: 0,
        max: 75 + Math.random() * 25,
        target: { x: toX, y: toY },
      });
    }
  }

  /** Seviye bitti — konfeti yagmuru. */
  celebrate() {
    const n = 120;
    for (let i = 0; i < n; i++) {
      this.confetti.push({
        x: Math.random() * this.w,
        y: -20 - Math.random() * this.h * 0.4,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 3,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        w: 6 + Math.random() * 6,
        h: 9 + Math.random() * 8,
        color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
        life: 0,
        max: 200 + Math.random() * 80,
      });
    }
  }

  private loop = () => {
    const ctx = this.ctx;
    const now = performance.now() * 0.001;
    ctx.clearRect(0, 0, this.w, this.h);

    // --- Yildizlar (source-over) ---
    for (const s of this.stars) {
      const a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(now * s.sp + s.tw));
      ctx.fillStyle = `rgba(220, 230, 255, ${a})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Parlayan parcaciklar (lighter) ---
    ctx.globalCompositeOperation = "lighter";

    for (const p of this.ambient) {
      p.phase += 0.05;
      p.vx += Math.cos(p.phase) * 0.02;
      p.vy += Math.sin(p.phase * 0.7) * 0.02;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.px = p.x; p.py = p.y;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -10) p.x = this.w + 10;
      if (p.x > this.w + 10) p.x = -10;
      if (p.y < -10) p.y = this.h + 10;
      if (p.y > this.h + 10) p.y = -10;
      const flick = 0.45 + 0.4 * Math.sin(now * 3 + p.phase);
      this.glow(p.x, p.y, p.size, p.hue, flick * 0.5);
    }

    for (let i = this.flying.length - 1; i >= 0; i--) {
      const p = this.flying[i];
      p.life++;
      const t = p.life / p.max;
      if (p.target) {
        const dx = p.target.x - p.x;
        const dy = p.target.y - p.y;
        const pull = 0.006 + t * t * 0.08;
        p.vx += dx * pull;
        p.vy += dy * pull;
      }
      p.vx *= 0.9;
      p.vy *= 0.9;
      p.px = p.x; p.py = p.y;
      p.x += p.vx;
      p.y += p.vy;
      const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
      // iz
      ctx.strokeStyle = `hsla(${p.hue}, 100%, 70%, ${alpha * 0.4})`;
      ctx.lineWidth = p.size;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      this.glow(p.x, p.y, p.size, p.hue, Math.max(0, alpha));
      if (p.life >= p.max) this.flying.splice(i, 1);
    }

    // --- Konfeti (source-over) ---
    ctx.globalCompositeOperation = "source-over";
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.life++;
      c.vy += 0.04;
      c.x += c.vx;
      c.y += c.vy;
      c.rot += c.vr;
      const fade = c.life > c.max - 40 ? Math.max(0, (c.max - c.life) / 40) : 1;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h * (0.6 + 0.4 * Math.abs(Math.sin(c.rot))));
      ctx.restore();
      if (c.life >= c.max || c.y > this.h + 30) this.confetti.splice(i, 1);
    }

    requestAnimationFrame(this.loop);
  };

  private glow(x: number, y: number, size: number, hue: number, alpha: number) {
    const ctx = this.ctx;
    const r = size * 4.5;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `hsla(${hue}, 100%, 80%, ${alpha})`);
    g.addColorStop(0.35, `hsla(${hue}, 100%, 62%, ${alpha * 0.5})`);
    g.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `hsla(${hue}, 100%, 95%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}
