// News image for Monday 23 November 2026.
// A newspaper front page drawn pixel by pixel with the Node 22 standard
// library only: a 5x7 bitmap font, flat pictograms, and a hand-rolled PNG
// encoder. No network, no copied images, fully deterministic.
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { createHash } from "node:crypto";
import { join } from "node:path";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- palette
const PAPER = 0xf6f1e3;
const INK = 0x1a1a1a;
const WHITE = 0xffffff;
const RED = 0xb3271e;
const DARKRED = 0x7b1a14;
const BLUE = 0x1f4e79;
const SKY = 0xbfd9e8;
const SEA = 0x1f6f9f;
const OCEAN = 0x2e6fb0;
const GREEN = 0x2e7d32;
const LAND = 0x4caf50;
const ORANGE = 0xd35400;
const YELLOW = 0xf1c40f;
const GOLD = 0xc9a227;
const GRAY = 0x8a8a8a;
const DARKGRAY = 0x5d6d7e;
const SLATE = 0x37474f;
const TEAL = 0x0f766e;
const PURPLE = 0x6a1b9a;
const NAVY = 0x1a2f4a;

// ------------------------------------------------------------- bitmap font
// 5x7 glyphs, "#" = ink. Uppercase, digits and common punctuation only;
// all text in this file is written in capitals.
const FONT: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", "..#..", "..#..", "..#.."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  ";": [".....", ".##..", ".##..", ".....", ".##..", ".##..", ".#..."],
  "'": ["..#..", "..#..", ".#...", ".....", ".....", ".....", "....."],
  "-": [".....", ".....", ".....", ".###.", ".....", ".....", "....."],
  "(": ["...##", "..#..", ".#...", ".#...", ".#...", "..#..", "...##"],
  ")": ["##...", "..#..", "...#.", "...#.", "...#.", "..#..", "##..."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "&": [".##..", "#..#.", "#..#.", ".#...", "#.#.#", "#..#.", ".##.#"],
  "%": ["##..#", "#..#.", "...#.", "..#..", ".#...", "#..#.", "#..##"],
  "+": [".....", "..#..", "..#..", ".###.", "..#..", "..#..", "....."],
  "=": [".....", ".....", ".###.", ".....", ".###.", ".....", "....."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  '"': [".#.#.", ".#.#.", ".....", ".....", ".....", ".....", "....."],
  "•": [".....", ".....", ".###.", ".###.", ".###.", ".....", "....."],
  $: ["..#..", ".####", "#.#.#", ".###.", "..#.#", "####.", "..#.."],
};

// ------------------------------------------------------------------ canvas
const px = new Uint8Array(W * H * 3);

function set(x: number, y: number, c: number): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = (c >> 16) & 255;
  px[i + 1] = (c >> 8) & 255;
  px[i + 2] = c & 255;
}

function rect(x: number, y: number, w: number, h: number, c: number): void {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) set(i, j, c);
  }
}

function hline(x0: number, x1: number, y: number, c: number): void {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) set(x, y, c);
}

function circle(cx: number, cy: number, r: number, c: number): void {
  for (let dy = -r; dy <= r; dy++) {
    const dx = Math.floor(Math.sqrt(r * r - dy * dy));
    hline(cx - dx, cx + dx, cy + dy, c);
  }
}

function line(x0: number, y0: number, x1: number, y1: number, c: number): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    set(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function lineThick(x0: number, y0: number, x1: number, y1: number, t: number, c: number): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let s = 0; s <= steps; s++) {
    const x = Math.round(x0 + ((x1 - x0) * s) / Math.max(steps, 1));
    const y = Math.round(y0 + ((y1 - y0) * s) / Math.max(steps, 1));
    circle(x, y, Math.floor(t / 2), c);
  }
}

function tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: number): void {
  const minY = Math.min(y0, y1, y2);
  const maxY = Math.max(y0, y1, y2);
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    const edges: Array<[number, number, number, number]> = [
      [x0, y0, x1, y1],
      [x1, y1, x2, y2],
      [x2, y2, x0, y0],
    ];
    for (const [ax, ay, bx, by] of edges) {
      if ((ay <= y && by > y) || (by <= y && ay > y)) {
        xs.push(Math.round(ax + ((y - ay) * (bx - ax)) / (by - ay)));
      }
    }
    if (xs.length >= 2) hline(Math.min(...xs), Math.max(...xs), y, c);
  }
}

// -------------------------------------------------------------------- text
function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}

function drawText(x: number, y: number, s: string, scale: number, c: number): void {
  let cx = x;
  for (const ch of s) {
    const g = FONT[ch] ?? FONT[" "];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "#") rect(cx + col * scale, y + r * scale, scale, scale, c);
      }
    }
    cx += 6 * scale;
  }
}

function centerText(y: number, s: string, scale: number, c: number): void {
  drawText(Math.floor((W - textWidth(s, scale)) / 2), y, s, scale, c);
}

function wrap(s: string, scale: number, maxW: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const next = cur === "" ? word : cur + " " + word;
    if (textWidth(next, scale) <= maxW || cur === "") {
      cur = next;
    } else {
      lines.push(cur);
      cur = word;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

function drawWrapped(x: number, y: number, s: string, scale: number, c: number, maxW: number): number {
  const lines = wrap(s, scale, maxW);
  lines.forEach((ln, i) => drawText(x, y + i * 8 * scale, ln, scale, c));
  return lines.length * 8 * scale;
}

// -------------------------------------------------------------- pictograms
function burst(cx: number, cy: number, r: number): void {
  circle(cx, cy, r, ORANGE);
  circle(cx, cy, Math.floor(r * 0.55), YELLOW);
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    line(
      Math.round(cx + Math.cos(a) * r * 0.8),
      Math.round(cy + Math.sin(a) * r * 0.8),
      Math.round(cx + Math.cos(a) * r * 1.5),
      Math.round(cy + Math.sin(a) * r * 1.5),
      ORANGE,
    );
  }
}

function picGlobe(x: number, y: number, w: number, h: number): void {
  const cx = x + Math.floor(w / 2);
  const cy = y + Math.floor(h / 2);
  const r = Math.floor(Math.min(w, h) / 2) - 8;
  circle(cx, cy, r, OCEAN);
  circle(cx - Math.floor(r * 0.35), cy - Math.floor(r * 0.3), Math.floor(r * 0.38), LAND);
  circle(cx + Math.floor(r * 0.4), cy + Math.floor(r * 0.25), Math.floor(r * 0.3), LAND);
  circle(cx + Math.floor(r * 0.15), cy - Math.floor(r * 0.55), Math.floor(r * 0.2), LAND);
  // Red crack across the globe: the deal breaking apart.
  lineThick(cx - Math.floor(r * 0.7), cy - Math.floor(r * 0.85), cx - Math.floor(r * 0.1), cy - Math.floor(r * 0.1), 7, RED);
  lineThick(cx - Math.floor(r * 0.1), cy - Math.floor(r * 0.1), cx + Math.floor(r * 0.45), cy + Math.floor(r * 0.35), 7, RED);
  lineThick(cx + Math.floor(r * 0.45), cy + Math.floor(r * 0.35), cx + Math.floor(r * 0.75), cy + Math.floor(r * 0.9), 7, RED);
  // Oil barrel with a cross: fossil fuels left out of the pact.
  const bx = x + w - 66;
  const by = y + h - 58;
  rect(bx, by, 52, 44, INK);
  rect(bx + 4, by + 8, 44, 4, WHITE);
  rect(bx + 4, by + 30, 44, 4, WHITE);
  lineThick(bx + 6, by + 4, bx + 46, by + 40, 6, RED);
  lineThick(bx + 46, by + 4, bx + 6, by + 40, 6, RED);
}

function picKyiv(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, SKY);
  const groundY = y + h - 12;
  rect(x, groundY, w, 12, DARKGRAY);
  // Damaged apartment block, top corner broken off; all art stays inside
  // the picture box so nothing spills onto the headline below.
  const b1Top = y + 26;
  rect(x + 20, b1Top, 92, groundY - b1Top, DARKGRAY);
  tri(x + 20, b1Top, x + 66, b1Top, x + 43, b1Top + 16, SKY);
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) rect(x + 30 + c * 28, b1Top + 20 + r * 12, 12, 8, YELLOW);
  }
  const b2Top = y + 40;
  rect(x + 132, b2Top, 70, groundY - b2Top, SLATE);
  for (let c = 0; c < 2; c++) rect(x + 142 + c * 30, b2Top + 8, 12, 8, WHITE);
  burst(x + w - 46, y + 24, 15);
  circle(x + 34, y + 16, 8, GRAY);
  circle(x + 54, y + 10, 9, GRAY);
}

function picPoland(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, NAVY);
  // Three incoming missiles, trails behind them.
  const pts: Array<[number, number]> = [
    [x + 60, y + 26],
    [x + 150, y + 44],
    [x + 236, y + 22],
  ];
  for (const [mx, my] of pts) {
    lineThick(mx + 26, my - 22, mx, my, 3, WHITE);
    circle(mx, my, 9, RED);
    tri(mx - 12, my - 4, mx - 12, my + 4, mx - 22, my, RED);
  }
  rect(x, y + h - 18, w, 18, GREEN);
  // NATO compass star, clear of the ground strip.
  const cx = x + Math.floor(w / 2);
  const cy = y + h - 42;
  circle(cx, cy, 22, BLUE);
  lineThick(cx, cy - 18, cx, cy + 18, 5, WHITE);
  lineThick(cx - 18, cy, cx + 18, cy, 5, WHITE);
  lineThick(cx - 12, cy - 12, cx + 12, cy + 12, 4, WHITE);
  lineThick(cx + 12, cy - 12, cx - 12, cy + 12, 4, WHITE);
}

function picCapitol(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, SKY);
  const cx = x + Math.floor(w / 2);
  const baseY = y + h - 12;
  // Dome behind, colonnade in front, base below: every part is sized
  // from the picture box, so the columns are really drawn this time.
  circle(cx, y + 30, 20, WHITE);
  rect(cx - 20, y + 30, 40, 6, WHITE);
  rect(cx - 1, y + 6, 3, 6, INK);
  rect(cx + 2, y + 7, 14, 6, RED);
  for (let c = 0; c < 5; c++) rect(x + 56 + c * 40, y + 40, 12, baseY - (y + 40), WHITE);
  rect(x + 30, baseY, w - 60, 12, SLATE);
  // Small ballot box with a tick, bottom right, clear of the columns.
  const bx = x + w - 52;
  const by = y + 38;
  rect(bx, by, 34, baseY - by, BLUE);
  rect(bx + 5, by - 5, 24, 5, INK);
  lineThick(bx + 8, by + 12, bx + 15, by + 18, 3, WHITE);
  lineThick(bx + 15, by + 18, bx + 28, by + 6, 3, WHITE);
}

function picShip(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, SKY);
  rect(x, y + Math.floor(h * 0.62), w, h - Math.floor(h * 0.62), SEA);
  // Hull and superstructure of a warship.
  const hy = y + Math.floor(h * 0.55);
  rect(x + 36, hy, w - 110, 22, INK);
  tri(x + w - 74, hy, x + w - 74, hy + 22, x + w - 30, hy + 22, INK);
  rect(x + 70, hy - 26, 84, 26, WHITE);
  rect(x + 170, hy - 40, 20, 40, INK);
  rect(x + 170, hy - 46, 20, 8, RED);
  line(x + 90, hy - 26, x + 90, hy - 44, INK);
  // Blast stays inside the picture box: it used to sit above it and
  // cover the panel's header strip.
  burst(x + 210, y + 16, 13);
  circle(x + 176, y + 10, 8, GRAY);
  circle(x + 194, y + 6, 9, GRAY);
  // Waves.
  for (let k = 0; k < 5; k++) lineThick(x + 20 + k * 88, y + h - 12, x + 52 + k * 88, y + h - 12, 4, WHITE);
}

function picChart(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, WHITE);
  for (let g = 1; g <= 3; g++) {
    const gy = y + Math.floor((h * g) / 4);
    for (let gx = x + 8; gx < x + w - 8; gx += 8) set(gx, gy, GRAY);
  }
  const pts: Array<[number, number]> = [
    [x + 16, y + 18],
    [x + Math.floor(w * 0.3), y + 30],
    [x + Math.floor(w * 0.55), y + 26],
    [x + Math.floor(w * 0.75), y + 52],
    [x + w - 24, y + h - 20],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    lineThick(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 6, RED);
  }
  const [ax, ay] = pts[pts.length - 1];
  tri(ax, ay, ax - 20, ay - 4, ax - 8, ay - 20, RED);
}

// ------------------------------------------------------------------- panels
function panel(
  x: number,
  y: number,
  w: number,
  h: number,
  kicker: string,
  strip: number,
  pic: (x: number, y: number, w: number, h: number) => void,
  picH: number,
  headline: string,
  deck: string,
): void {
  rect(x, y, w, 3, INK);
  rect(x, y + h - 3, w, 3, INK);
  rect(x, y, 3, h, INK);
  rect(x + w - 3, y, 3, h, INK);
  rect(x, y, w, 30, strip);
  drawText(x + 12, y + 8, kicker, 2, WHITE);
  pic(x + 3, y + 30, w - 6, picH);
  const tx = x + 14;
  const tw = w - 28;
  let ty = y + 30 + picH + 10;
  ty += drawWrapped(tx, ty, headline, 3, INK, tw);
  drawWrapped(tx, ty + 6, deck, 2, INK, tw);
}

// ---------------------------------------------------------------------- PNG
const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table.push(c >>> 0);
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    Buffer.from(px.buffer, y * W * 3, W * 3).copy(raw, y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// --------------------------------------------------------------------- page
function main(): void {
  rect(0, 0, W, H, PAPER);

  // Masthead.
  rect(24, 24, W - 48, 3, INK);
  drawText(Math.floor((W - textWidth("THE WORLD IN ONE DAY", 5)) / 2), 38, "THE WORLD IN ONE DAY", 5, INK);
  rect(24, 102, W - 48, 3, INK);
  centerText(114, "MONDAY 23 NOVEMBER 2026", 4, RED);
  centerText(146, "SIX STORIES FROM AROUND THE GLOBE, AS REPORTED TODAY", 2, INK);

  // Lead story: COP31 collapses in Antalya.
  const lx = 24;
  const ly = 172;
  const lw = 976;
  const lh = 296;
  rect(lx, ly, lw, 3, INK);
  rect(lx, ly + lh - 3, lw, 3, INK);
  rect(lx, ly, 3, lh, INK);
  rect(lx + lw - 3, ly, 3, lh, INK);
  rect(lx, ly, lw, 34, TEAL);
  drawText(lx + 12, ly + 10, "CLIMATE / COP31 / ANTALYA", 2, WHITE);
  picGlobe(lx + 16, ly + 50, 300, 232);
  const tx = lx + 340;
  const tw = lw - 340 - 24;
  drawText(tx, ly + 52, "ANTALYA, TURKEY", 2, RED);
  let ty = ly + 78;
  ty += drawWrapped(tx, ty, "COP31 COLLAPSES: NO DEAL ON FOSSIL FUELS", 4, INK, tw);
  ty += drawWrapped(
    tx,
    ty + 10,
    "EU AND UK REJECT THE ANTALYA PACT AFTER ITS FINAL TEXT DROPS ANY MENTION OF PHASING OUT OIL, GAS AND COAL. THE LONGEST CLIMATE SUMMIT EVER ENDS WITH NO PACT.",
    2,
    INK,
    tw,
  );
  drawText(tx, ly + lh - 34, "NO CONSENSUS • FIRST BREAKDOWN SINCE COP15", 2, INK);

  // Row 2: Kyiv, Poland, US House.
  const row2Y = 484;
  const row2H = 240;
  panel(24, row2Y, 315, row2H, "WAR IN UKRAINE", RED, picKyiv, 70, "RUSSIAN STRIKES KILL AT LEAST 6 IN KYIV REGION", "A BOY, 7, IS PULLED ALIVE FROM THE RUBBLE.");
  panel(355, row2Y, 315, row2H, "POLAND / NATO", BLUE, picPoland, 70, "POLAND CONFIRMS RUSSIAN MISSILES FELL", "THREE OBJECTS THAT FELL ON 20 NOV. WERE RUSSIAN CRUISE MISSILES.");
  panel(686, row2Y, 315, row2H, "USA / HOUSE RACE", SLATE, picCapitol, 70, "DEMOCRATS TAKE RECORD HOUSE MAJORITY", "AT LEAST 258 SEATS, THE LARGEST SINCE 1992.");

  // Row 3: Benghazi ship, markets.
  const row3Y = 740;
  const row3H = 216;
  panel(24, row3Y, 480, row3H, "LIBYA / BENGHAZI", ORANGE, picShip, 62, "DRONE BLAST HITS RUSSIAN SHIP AT LIBYA PORT", "LIBYA BLAMES A SUSPECTED DRONE ATTACK AT THE BENGHAZI NAVAL BASE.");
  panel(520, row3Y, 480, row3H, "MARKETS", PURPLE, picChart, 62, "STOCKS PLUNGE; TAIWAN DOWN 17.5% IN A WEEK", "FRIDAY'S US SELL-OFF PUTS ASIAN MARKETS ON ALERT. TAIWAN DOWN 17.5%.");

  // Footer ticker.
  rect(24, 968, W - 48, 2, INK);
  centerText(978, "ALSO TODAY: FIFA TO NAME UK AS 2035 WOMEN'S WORLD CUP HOST", 2, INK);
  centerText(998, "ALCARAZ WINS THE ATP FINALS. VANUATU SHAKEN BY M6.5 QUAKE.", 2, INK);

  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "out";
  mkdirSync(outDir, { recursive: true });
  const png = encodePNG();
  const outPath = join(outDir, "entry.png");
  writeFileSync(outPath, png);
  console.log(`entry.png ${png.length} bytes sha256=${createHash("sha256").update(png).digest("hex")}`);
}

main();
