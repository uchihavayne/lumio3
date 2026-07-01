// Basit crossword (bulmaca) ureteci.
// Kelimeleri ortak harfler uzerinden kesistirerek bir izgaraya yerlestirir.
// Yerlestirilemeyenler "bonus" olarak dondurulur.

export type Dir = "H" | "V";

export interface PlacedWord {
  word: string;
  row: number;
  col: number;
  dir: Dir;
}

export interface Cell {
  row: number;
  col: number;
  letter: string;
  /** Bu hucreyi paylasan kelime index'leri. */
  words: number[];
}

export interface Crossword {
  placed: PlacedWord[];
  bonus: string[];
  cells: Cell[];
  rows: number;
  cols: number;
}

function key(r: number, c: number) {
  return `${r},${c}`;
}

interface WorkPlacement {
  word: string;
  row: number;
  col: number;
  dir: Dir;
}

/** Adayin mevcut izgaraya uyup uymadigini kontrol eder. */
function fits(
  grid: Map<string, string>,
  word: string,
  row: number,
  col: number,
  dir: Dir
): boolean {
  const dr = dir === "V" ? 1 : 0;
  const dc = dir === "H" ? 1 : 0;

  // Kelimenin hemen oncesi ve sonrasi bos olmali.
  const beforeKey = key(row - dr, col - dc);
  const afterKey = key(row + dr * word.length, col + dc * word.length);
  if (grid.has(beforeKey) || grid.has(afterKey)) return false;

  let intersections = 0;
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    const existing = grid.get(key(r, c));
    if (existing !== undefined) {
      if (existing !== word[i]) return false;
      intersections++;
    } else {
      // Yeni hucre: dik komsulari bos olmali (yan yana istenmeyen kelime olusmasin).
      if (dir === "H") {
        if (grid.has(key(r - 1, c)) || grid.has(key(r + 1, c))) return false;
      } else {
        if (grid.has(key(r, c - 1)) || grid.has(key(r, c + 1))) return false;
      }
    }
  }
  // En az bir kesisim sart (ilk kelime haric, o ayri ele alinir).
  return intersections > 0;
}

function commitWord(grid: Map<string, string>, p: WorkPlacement) {
  const dr = p.dir === "V" ? 1 : 0;
  const dc = p.dir === "H" ? 1 : 0;
  for (let i = 0; i < p.word.length; i++) {
    grid.set(key(p.row + dr * i, p.col + dc * i), p.word[i]);
  }
}

export function buildCrossword(words: string[]): Crossword {
  // Uzun kelimeler once: daha cok kesisim noktasi saglar.
  const sorted = [...words].sort((a, b) => b.length - a.length);
  const grid = new Map<string, string>();
  const placements: WorkPlacement[] = [];
  const bonus: string[] = [];

  if (sorted.length === 0) {
    return { placed: [], bonus: [], cells: [], rows: 0, cols: 0 };
  }

  // Ilk (en uzun) kelimeyi yatay yerlestir.
  const first = sorted[0];
  commitWord(grid, { word: first, row: 0, col: 0, dir: "H" });
  placements.push({ word: first, row: 0, col: 0, dir: "H" });

  for (let w = 1; w < sorted.length; w++) {
    const word = sorted[w];
    let best: WorkPlacement | null = null;

    // Her harf icin, yerlesmis hucrelerde ayni harfi ara ve dik yerlestir.
    outer: for (let i = 0; i < word.length; i++) {
      for (const [k, letter] of grid) {
        if (letter !== word[i]) continue;
        const [pr, pc] = k.split(",").map(Number);
        // Yatay bir kelimeyi keserken dik (V), tersi (H) dene.
        for (const dir of ["H", "V"] as Dir[]) {
          const dr = dir === "V" ? 1 : 0;
          const dc = dir === "H" ? 1 : 0;
          const row = pr - dr * i;
          const col = pc - dc * i;
          if (fits(grid, word, row, col, dir)) {
            best = { word, row, col, dir };
            break outer;
          }
        }
      }
    }

    if (best) {
      commitWord(grid, best);
      placements.push(best);
    } else {
      bonus.push(word);
    }
  }

  // Koordinatlari normalize et (en kucuk satir/sutun = 0).
  let minR = Infinity;
  let minC = Infinity;
  let maxR = -Infinity;
  let maxC = -Infinity;
  for (const k of grid.keys()) {
    const [r, c] = k.split(",").map(Number);
    minR = Math.min(minR, r);
    minC = Math.min(minC, c);
    maxR = Math.max(maxR, r);
    maxC = Math.max(maxC, c);
  }

  const placed: PlacedWord[] = placements.map((p) => ({
    word: p.word,
    row: p.row - minR,
    col: p.col - minC,
    dir: p.dir,
  }));

  // Hucre listesi (her hucre hangi kelimelere ait).
  const cellMap = new Map<string, Cell>();
  placed.forEach((p, idx) => {
    const dr = p.dir === "V" ? 1 : 0;
    const dc = p.dir === "H" ? 1 : 0;
    for (let i = 0; i < p.word.length; i++) {
      const r = p.row + dr * i;
      const c = p.col + dc * i;
      const kk = key(r, c);
      let cell = cellMap.get(kk);
      if (!cell) {
        cell = { row: r, col: c, letter: p.word[i], words: [] };
        cellMap.set(kk, cell);
      }
      cell.words.push(idx);
    }
  });

  return {
    placed,
    bonus,
    cells: [...cellMap.values()],
    rows: maxR - minR + 1,
    cols: maxC - minC + 1,
  };
}
