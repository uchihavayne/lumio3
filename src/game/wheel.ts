// "Feneri Yak" harf sistemi (özgün — sürükleme YOK).
// Harfler çevrede ışıklı taşlar, MERKEZDE bir fener. Harflere tek tek DOKUNURSUN;
// her harf ortadaki fenere bir ışık izi bırakır ve kelimeye eklenir. Seçili bir
// harfe tekrar dokununca o harf ve sonrası geri alınır. Fener kelime hazır olunca
// (>=2 harf) parlar; fenere dokununca kelimeyi "yakar" (gönderir).
// Dokunmatik olması yaşlı/sıradan oyunculara sürüklemeden kolaydır.

export interface WheelCallbacks {
  onPreview: (word: string) => void;
  onSubmit: (word: string, indices: number[]) => void;
  onStep?: (order: number) => void;
}

interface TilePos {
  cx: number;
  cy: number;
}

export class Wheel {
  readonly root: HTMLElement;
  private svg: SVGSVGElement;
  private line: SVGPolylineElement;
  private lantern!: HTMLButtonElement;
  private tiles: HTMLElement[] = [];
  private letters: string[] = [];
  private cb: WheelCallbacks;

  private selected: number[] = [];
  private tilePositions: TilePos[] = [];
  private forbidden: string[] = [];

  constructor(cb: WheelCallbacks) {
    this.cb = cb;
    this.root = document.createElement("div");
    this.root.className = "wheel";

    const NS = "http://www.w3.org/2000/svg";
    this.svg = document.createElementNS(NS, "svg");
    this.svg.setAttribute("class", "wheel-line");

    // Işık izi gradyanı.
    const defs = document.createElementNS(NS, "defs");
    const grad = document.createElementNS(NS, "linearGradient");
    grad.setAttribute("id", "wheelGrad");
    grad.setAttribute("x1", "0%");
    grad.setAttribute("y1", "0%");
    grad.setAttribute("x2", "100%");
    grad.setAttribute("y2", "100%");
    const stops: [string, string][] = [
      ["0%", "#ffe6a8"],
      ["50%", "#ffcf6b"],
      ["100%", "#f4a52a"],
    ];
    for (const [off, col] of stops) {
      const st = document.createElementNS(NS, "stop");
      st.setAttribute("offset", off);
      st.setAttribute("stop-color", col);
      grad.appendChild(st);
    }
    defs.appendChild(grad);
    this.svg.appendChild(defs);

    this.line = document.createElementNS(NS, "polyline");
    this.line.setAttribute("class", "wheel-line-path");
    this.svg.appendChild(this.line);
    this.root.appendChild(this.svg);

    // Merkez fener butonu.
    this.lantern = document.createElement("button");
    this.lantern.className = "wheel-lantern";
    this.lantern.type = "button";
    this.lantern.innerHTML = `<span class="wl-ico">🏮</span>`;
    this.lantern.addEventListener("click", () => this.submit());
    this.root.appendChild(this.lantern);
  }

  setLetters(letters: string[], forbidden: string[] = []) {
    this.letters = [...letters];
    this.forbidden = forbidden.filter((w) => w.length === letters.length);
    this.render();
  }

  /** Harfleri karıştır — cevabı çember üzerinde okunur bırakmaz. */
  shuffle() {
    for (let tries = 0; tries < 40; tries++) {
      for (let i = this.letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.letters[i], this.letters[j]] = [this.letters[j], this.letters[i]];
      }
      if (!this.spellsForbidden()) break;
    }
    this.render();
  }

  private spellsForbidden(): boolean {
    const n = this.letters.length;
    if (!this.forbidden.length || n < 3) return false;
    const ring = this.letters.join("");
    const cw = ring + ring;
    const rev = [...this.letters].reverse().join("");
    const ccw = rev + rev;
    return this.forbidden.some((w) => cw.includes(w) || ccw.includes(w));
  }

  private render() {
    this.tiles.forEach((t) => t.remove());
    this.tiles = [];
    this.selected = [];
    const n = this.letters.length;
    this.letters.forEach((ch, i) => {
      const tile = document.createElement("button");
      tile.className = "wheel-tile";
      tile.type = "button";
      tile.dataset.i = String(i);
      tile.textContent = ch;
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const radius = 37;
      const x = 50 + radius * Math.cos(angle);
      const y = 50 + radius * Math.sin(angle);
      tile.style.left = `${x}%`;
      tile.style.top = `${y}%`;
      tile.addEventListener("click", () => this.tapTile(i));
      this.root.appendChild(tile);
      this.tiles.push(tile);
    });
    this.updateLantern();
    this.drawLine();
  }

  private cacheTilePositions() {
    const box = this.root.getBoundingClientRect();
    this.tilePositions = this.tiles.map((el) => {
      const r = el.getBoundingClientRect();
      return { cx: r.left + r.width / 2 - box.left, cy: r.top + r.height / 2 - box.top };
    });
  }

  /** Bir harfe dokunma: seçili değilse ekle; seçiliyse o harften itibaren geri al. */
  private tapTile(i: number) {
    const pos = this.selected.indexOf(i);
    if (pos === -1) {
      this.selected.push(i);
      this.tiles[i].classList.add("active");
      this.cb.onStep?.(this.selected.length - 1);
      if (navigator.vibrate) navigator.vibrate(8);
    } else {
      // Bu harf ve sonrasını bırak (geri al).
      for (let k = this.selected.length - 1; k >= pos; k--) {
        this.tiles[this.selected[k]].classList.remove("active");
      }
      this.selected = this.selected.slice(0, pos);
    }
    this.cacheTilePositions();
    this.drawLine();
    this.updateLantern();
    this.cb.onPreview(this.selected.map((k) => this.letters[k]).join(""));
  }

  private submit() {
    const word = this.selected.map((i) => this.letters[i]).join("");
    const indices = [...this.selected];
    if (word.length < 2) {
      this.lantern.classList.add("nudge");
      setTimeout(() => this.lantern.classList.remove("nudge"), 300);
      return;
    }
    this.clearSelection();
    this.cb.onPreview("");
    this.cb.onSubmit(word, indices);
  }

  private clearSelection() {
    this.selected.forEach((i) => this.tiles[i]?.classList.remove("active"));
    this.selected = [];
    this.line.setAttribute("points", "");
    this.updateLantern();
  }

  private updateLantern() {
    this.lantern.classList.toggle("ready", this.selected.length >= 2);
    this.lantern.classList.toggle("has", this.selected.length > 0);
  }

  /** Işık izi: seçili harfler sırayla + son harften merkez fenere. */
  private drawLine() {
    if (!this.selected.length) {
      this.line.setAttribute("points", "");
      return;
    }
    if (!this.tilePositions.length) this.cacheTilePositions();
    const box = this.root.getBoundingClientRect();
    const cx = box.width / 2;
    const cy = box.height / 2;
    const pts = this.selected.map((i) => {
      const p = this.tilePositions[i];
      return `${p.cx},${p.cy}`;
    });
    // Son harften fenere doğru ışık aksın.
    pts.push(`${cx},${cy}`);
    this.line.setAttribute("points", pts.join(" "));
  }
}
