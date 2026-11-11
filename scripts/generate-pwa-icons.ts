/**
 * Deterministic PWA icon generator (P4-S5).
 *
 * Writes the owned placeholder icons used by `public/manifest.webmanifest`. The mark is a simple
 * geometric "spotlight ring" drawn on the brand indigo gradient, encoded as PNG with the Node zlib
 * module so the repository adds no image dependency. Replace these with final brand assets before a
 * public launch and re-run this script only if the placeholder mark changes.
 *
 * Usage: bun scripts/generate-pwa-icons.ts
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

type Rgb = readonly [number, number, number];

const TOP: Rgb = [67, 56, 202]; // indigo-700
const BOTTOM: Rgb = [30, 27, 75]; // indigo-950
const RING: Rgb = [238, 242, 255]; // indigo-50

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBytes = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([length, typeBytes, data, crc]);
}

/** Encode an RGBA buffer as a PNG. */
function encodePng(width: number, height: number, rgba: Uint8Array): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // no filter
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Draw the placeholder mark. `inset` shrinks the ring for the maskable safe zone. */
function drawIcon(size: number, inset: number): Uint8Array {
  const rgba = new Uint8Array(size * size * 4);
  const center = (size - 1) / 2;
  const outer = size * (0.34 - inset);
  const inner = size * (0.2 - inset);
  const coreRadius = size * (0.07 - inset * 0.5);

  for (let y = 0; y < size; y += 1) {
    const mix = y / (size - 1);
    const background: Rgb = [
      Math.round(TOP[0] + (BOTTOM[0] - TOP[0]) * mix),
      Math.round(TOP[1] + (BOTTOM[1] - TOP[1]) * mix),
      Math.round(TOP[2] + (BOTTOM[2] - TOP[2]) * mix),
    ];
    for (let x = 0; x < size; x += 1) {
      const dx = x - center;
      const dy = y - center;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const inRing = distance <= outer && distance >= inner;
      const inCore = distance <= coreRadius;
      const colour: Rgb = inRing || inCore ? RING : background;
      const offset = (y * size + x) * 4;
      rgba[offset] = colour[0];
      rgba[offset + 1] = colour[1];
      rgba[offset + 2] = colour[2];
      rgba[offset + 3] = 255;
    }
  }
  return rgba;
}

const outputDir = join(process.cwd(), "public", "icons");
mkdirSync(outputDir, { recursive: true });

const targets: ReadonlyArray<{ file: string; size: number; inset: number }> = [
  { file: "icon-192.png", size: 192, inset: 0 },
  { file: "icon-512.png", size: 512, inset: 0 },
  { file: "icon-512-maskable.png", size: 512, inset: 0.06 },
  { file: "apple-touch-icon.png", size: 180, inset: 0 },
];

for (const target of targets) {
  const png = encodePng(target.size, target.size, drawIcon(target.size, target.inset));
  const path = join(outputDir, target.file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, png);
  console.info(`wrote ${path} (${png.length} bytes)`);
}
