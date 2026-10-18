/**
 * Tiny dependency-free GIF89a encoder.
 *
 * The palette is a fixed 6x6x6 colour cube (216 entries) plus 40 grays. This is
 * intentionally simple: it keeps the bundle small and is good enough for the
 * neon-on-black sticker look. Every frame is a full 240x240 image.
 */

export interface GifFrame {
  /** RGBA pixel data, length = width * height * 4. */
  data: Uint8ClampedArray;
  /** Frame delay in milliseconds. */
  delayMs?: number;
}

const CUBE_LEVELS = 6;
const CUBE_SIZE = CUBE_LEVELS * CUBE_LEVELS * CUBE_LEVELS;
const GRAY_SIZE = 256 - CUBE_SIZE;

function buildPalette(): Uint8Array {
  const palette = new Uint8Array(256 * 3);
  let offset = 0;

  for (let r = 0; r < CUBE_LEVELS; r += 1) {
    for (let g = 0; g < CUBE_LEVELS; g += 1) {
      for (let b = 0; b < CUBE_LEVELS; b += 1) {
        palette[offset] = Math.round((r * 255) / (CUBE_LEVELS - 1));
        palette[offset + 1] = Math.round((g * 255) / (CUBE_LEVELS - 1));
        palette[offset + 2] = Math.round((b * 255) / (CUBE_LEVELS - 1));
        offset += 3;
      }
    }
  }

  for (let i = 0; i < GRAY_SIZE; i += 1) {
    const value = Math.round((i * 255) / (GRAY_SIZE - 1));
    palette[offset] = value;
    palette[offset + 1] = value;
    palette[offset + 2] = value;
    offset += 3;
  }

  return palette;
}

const PALETTE = buildPalette();

function indexPixel(r: number, g: number, b: number, a: number): number {
  if (a < 16) return CUBE_SIZE; // first gray entry is black

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  if (max - min < 12) {
    const luma = r * 0.299 + g * 0.587 + b * 0.114;
    return CUBE_SIZE + Math.min(GRAY_SIZE - 1, Math.round((luma / 255) * (GRAY_SIZE - 1)));
  }

  const rl = Math.round((r / 255) * (CUBE_LEVELS - 1));
  const gl = Math.round((g / 255) * (CUBE_LEVELS - 1));
  const bl = Math.round((b / 255) * (CUBE_LEVELS - 1));
  return rl * CUBE_LEVELS * CUBE_LEVELS + gl * CUBE_LEVELS + bl;
}

function quantizeFrame(data: Uint8ClampedArray): Uint8Array {
  const pixels = new Uint8Array(data.length / 4);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    pixels[p] = indexPixel(data[i], data[i + 1], data[i + 2], data[i + 3]);
  }
  return pixels;
}

/** GIF LZW compression, LSB-first bit packing. */
function lzwEncode(indices: Uint8Array, minCodeSize = 8): number[] {
  const clearCode = 1 << minCodeSize;
  const endCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = endCode + 1;
  let dictionary = new Map<number, number>();

  const output: number[] = [];
  let bitBuffer = 0;
  let bitCount = 0;

  const emit = (code: number) => {
    bitBuffer |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      output.push(bitBuffer & 0xff);
      bitBuffer >>= 8;
      bitCount -= 8;
    }
  };

  emit(clearCode);
  let prefix = indices[0];

  for (let i = 1; i < indices.length; i += 1) {
    const suffix = indices[i];
    const key = (prefix << 8) | suffix;

    if (dictionary.has(key)) {
      prefix = dictionary.get(key) as number;
      continue;
    }

    emit(prefix);

    if (nextCode === 4096) {
      emit(clearCode);
      dictionary = new Map<number, number>();
      codeSize = minCodeSize + 1;
      nextCode = endCode + 1;
    } else {
      if (nextCode >= (1 << codeSize) && codeSize < 12) {
        codeSize += 1;
      }
      dictionary.set(key, nextCode);
      nextCode += 1;
    }

    prefix = suffix;
  }

  emit(prefix);
  emit(endCode);

  if (bitCount > 0) {
    output.push(bitBuffer & 0xff);
  }

  return output;
}

function writeSubBlocks(output: number[], data: number[]): void {
  for (let offset = 0; offset < data.length; offset += 255) {
    const chunk = data.slice(offset, offset + 255);
    output.push(chunk.length);
    for (const byte of chunk) {
      output.push(byte);
    }
  }
  output.push(0);
}

function writeShort(output: number[], value: number): void {
  output.push(value & 0xff, (value >> 8) & 0xff);
}

function writeString(output: number[], value: string): void {
  for (let i = 0; i < value.length; i += 1) {
    output.push(value.charCodeAt(i) & 0xff);
  }
}

export function encodeGif(
  frames: GifFrame[],
  width: number,
  height: number,
  defaultDelayMs = 80
): Uint8Array {
  if (frames.length === 0) {
    throw new Error('encodeGif requires at least one frame');
  }
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error('encodeGif requires positive integer dimensions');
  }

  const expected = width * height * 4;
  for (const frame of frames) {
    if (frame.data.length !== expected) {
      throw new Error('encodeGif frame data does not match dimensions');
    }
  }

  const output: number[] = [];

  // Header + logical screen descriptor.
  writeString(output, 'GIF89a');
  writeShort(output, width);
  writeShort(output, height);
  output.push(0xf7); // global color table, 256 entries
  output.push(0); // background colour index
  output.push(0); // pixel aspect ratio

  // Global colour table.
  for (const byte of PALETTE) {
    output.push(byte);
  }

  // Netscape looping extension.
  output.push(0x21, 0xff, 0x0b);
  writeString(output, 'NETSCAPE2.0');
  output.push(0x03, 0x01, 0x00, 0x00, 0x00);

  for (const frame of frames) {
    const delay = Math.max(2, Math.round((frame.delayMs ?? defaultDelayMs) / 10));

    // Graphic control extension: disposal method 1, no transparency.
    output.push(0x21, 0xf9, 0x04, 0x04);
    writeShort(output, delay);
    output.push(0x00, 0x00);

    // Image descriptor.
    output.push(0x2c);
    writeShort(output, 0);
    writeShort(output, 0);
    writeShort(output, width);
    writeShort(output, height);
    output.push(0x00);

    // LZW image data.
    output.push(8);
    writeSubBlocks(output, lzwEncode(quantizeFrame(frame.data), 8));
  }

  output.push(0x3b);

  return Uint8Array.from(output);
}
