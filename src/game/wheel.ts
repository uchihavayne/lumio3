// Harf çarkı — akıcı SÜRÜKLEME girişi (en hızlı, en kullanıcı-dostu).
// Harfler daire üzerinde; parmakla harften harfe sürükleyip kelime oluşturur,
// bırakınca gönderir. Görsel kimlik özgün: mor gece + akan altın ışık izi +
// harf pop'u + iz üstünde süzülen ateşböceği parçacıkları.

export interface WheelCallbacks {
  onPreview: (word: string) => void;
  onSubmit: (word: string, indices: number[]) => void;
  onStep?: (order: number) => void;
  /** İz üstünde ışık parçacığı (ekran koordinatları). */
  onSpark?: (x: number, y: number) => void;
}

interface TilePos {
  cx: number;
  cy: number;
}

export class Wheel {
  readonly root: HTMLElement;
  private svg: SVGSVGElement;
  private line: SVGPolylineElement;
  private tiles: HTMLElement[] = [];
  private letters: string[] = [];
  private cb: WheelCallbacks;

  private selecting = false;
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

    this.root.addEventListener("pointerdown", this.onDown);
    this.root.addEventListener("pointermove", this.onMove);
    window.addEventListener("pointerup", this.onUp);
    window.addEventListener("pointercancel", this.onUp);
  }

  setLetters(letters: string[], forbidden: string[] = []) {
    this.letters = [...letters];
    this.forbidden = forbidden.filter((w) => w.length === letters.length);
    this.render();
  }

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
      const tile = document.createElement("div");
      tile.className = "wheel-tile";
      tile.dataset.i = String(i);
      tile.textContent = ch;
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const radius = 37;
      const x = 50 + radius * Math.cos(angle);
      const y = 50 + radius * Math.sin(angle);
      tile.style.left = `${x}%`;
      tile.style.top = `${y}%`;
      this.root.appendChild(tile);
      this.tiles.push(tile);
    });
    this.line.setAttribute("points", "");
  }

  private cacheTilePositions() {
    this.tilePositions = this.tiles.map((el) => {
      const r = el.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    });
  }

  private tileAt(x: number, y: number): number {
    let bestI = -1;
    let bestD = Infinity;
    this.tilePositions.forEach((p, i) => {
      const d = Math.hypot(p.cx - x, p.cy - y);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    });
    const tile = this.tiles[bestI];
    if (!tile) return -1;
    const radius = tile.getBoundingClientRect().width * 0.68;
    return bestD <= radius ? bestI : -1;
  }

  private onDown = (e: PointerEvent) => {
    this.cacheTilePositions();
    const i = this.tileAt(e.clientX, e.clientY);
    if (i === -1) return;
    e.preventDefault();
    this.selecting = true;
    this.selected = [];
    this.addTile(i);
  };

  private onMove = (e: PointerEvent) => {
    if (!this.selecting) return;
    e.preventDefault();
    const i = this.tileAt(e.clientX, e.clientY);
    if (i === -1) {
      this.drawLine(e.clientX, e.clientY);
      return;
    }
    const pos = this.selected.indexOf(i);
    if (pos === -1) {
      this.addTile(i);
    } else if (pos === this.selected.length - 2) {
      this.removeLast();
    }
    this.drawLine(e.clientX, e.clientY);
  };

  private onUp = () => {
    if (!this.selecting) return;
    this.selecting = false;
    const word = this.selected.map((i) => this.letters[i]).join("");
    const indices = [...this.selected];
    this.clearSelection();
    this.cb.onPreview("");
    if (word.length >= 2) this.cb.onSubmit(word, indices);
  };

  private addTile(i: number) {
    this.selected.push(i);
    const tile = this.tiles[i];
    tile.classList.add("active");
    tile.classList.remove("pop");
    void tile.offsetWidth;
    tile.classList.add("pop");
    this.cb.onPreview(this.selected.map((k) => this.letters[k]).join(""));
    this.cb.onStep?.(this.selected.length - 1);
    // İz üstünde ışık parçacığı
    const p = this.tilePositions[i];
    if (p) this.cb.onSpark?.(p.cx, p.cy);
    this.drawLine();
    if (navigator.vibrate) navigator.vibrate(8);
  }

  private removeLast() {
    const i = this.selected.pop();
    if (i !== undefined) this.tiles[i].classList.remove("active");
    this.cb.onPreview(this.selected.map((k) => this.letters[k]).join(""));
  }

  private clearSelection() {
    this.selected.forEach((i) => this.tiles[i]?.classList.remove("active"));
    this.selected = [];
    this.line.setAttribute("points", "");
  }

  private drawLine(px?: number, py?: number) {
    const box = this.root.getBoundingClientRect();
    const pts = this.selected.map((i) => {
      const p = this.tilePositions[i];
      return `${p.cx - box.left},${p.cy - box.top}`;
    });
    if (px !== undefined && py !== undefined && this.selecting && this.selected.length) {
      pts.push(`${px - box.left},${py - box.top}`);
    }
    this.line.setAttribute("points", pts.join(" "));
  }
}
