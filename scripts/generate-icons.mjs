/**
 * Erzeugt die PWA-Icons ohne Bild-Abhängigkeiten: Sonne hinter Blattschatten,
 * in den Markenfarben. Aufruf: node scripts/generate-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const BRAND = [0x2a, 0x9d, 0x8f];
const SUN = [0xe9, 0xc4, 0x6a];
const CREAM = [0xf8, 0xf9, 0xfa];
const INK = [0x26, 0x46, 0x53];

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(size, pixel) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let offset = 0;
  for (let y = 0; y < size; y++) {
    raw[offset++] = 0; // Filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x + 0.5, y + 0.5, size);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Weiche Kante: 1 innerhalb, 0 außerhalb, dazwischen ein Pixel Übergang. */
function circle(x, y, cx, cy, r) {
  return Math.min(1, Math.max(0, r + 0.5 - Math.hypot(x - cx, y - cy)));
}

function blend(base, color, alpha) {
  return base.map((c, i) => Math.round(c * (1 - alpha) + color[i] * alpha));
}

function icon(x, y, size) {
  const u = (v) => v * size;
  let color = BRAND;

  color = blend(color, SUN, circle(x, y, u(0.68), u(0.33), u(0.15)));

  // Blattschatten aus drei überlappenden Kreisen.
  const canopy = Math.max(
    circle(x, y, u(0.44), u(0.46), u(0.2)),
    circle(x, y, u(0.6), u(0.53), u(0.16)),
    circle(x, y, u(0.32), u(0.57), u(0.14)),
  );
  color = blend(color, CREAM, canopy);

  // Stamm
  const trunk =
    x > u(0.46) && x < u(0.54) && y > u(0.55) && y < u(0.76) ? 1 : 0;
  color = blend(color, INK, trunk * (1 - canopy * 0.15));

  return [...color, 255];
}

const targets = [
  ["public/icon-192.png", 192],
  ["public/icon-512.png", 512],
  ["public/apple-touch-icon.png", 180],
  ["src/app/icon.png", 256],
];

for (const [path, size] of targets) {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, png(size, icon));
  console.log(`✓ ${path} (${size}×${size})`);
}
