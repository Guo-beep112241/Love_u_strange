import { encodeGif, type GifFrame } from './gif-encoder';

export type StickerKind = 'png' | 'gif';

export interface StickerAsset {
  blob: Blob;
  dataUrl: string;
  kind: StickerKind;
  mime: string;
  width: number;
  height: number;
}

export interface StickerVisual {
  label: string;
  color: string;
  emissive: string;
  brand?: string;
}

export interface StickerCaptureOptions extends StickerVisual {
  size?: number;
  cropScale?: number;
  brand?: string;
}

const DEFAULT_SIZE = 240;
const DEFAULT_CROP = 0.82;
const GIF_FRAMES = 12;
const GIF_INTERVAL_MS = 80;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function waitForFonts(timeoutMs = 900): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  await Promise.race([
    document.fonts.ready.catch(() => undefined),
    sleep(timeoutMs),
  ]);
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, body] = dataUrl.split(',');
  if (!body) throw new Error('Invalid data URL');
  const mime = /data:([^;]+)/.exec(header)?.[1] || 'image/png';
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality = 0.94): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas encoding returned an empty blob'));
        },
        type,
        quality
      );
      return;
    }
    try {
      resolve(dataUrlToBlob(canvas.toDataURL(type, quality)));
    } catch (error) {
      reject(error);
    }
  });
}

function drawFallbackPet(
  ctx: CanvasRenderingContext2D,
  size: number,
  visual: StickerVisual,
  phase: number
): void {
  const center = size / 2;
  const bob = Math.sin(phase * Math.PI * 2) * size * 0.018;
  const breathe = 1 + Math.sin(phase * Math.PI * 2) * 0.025;

  ctx.save();
  ctx.translate(center, center + bob);

  // Glow.
  ctx.shadowColor = visual.emissive;
  ctx.shadowBlur = size * 0.12;

  // Body.
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.25 * breathe, size * 0.29 * breathe, 0, 0, Math.PI * 2);
  ctx.fillStyle = visual.color;
  ctx.fill();
  ctx.lineWidth = Math.max(2, size * 0.012);
  ctx.strokeStyle = visual.emissive;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Eyes.
  const eyeY = -size * 0.055;
  ctx.fillStyle = '#09090e';
  ctx.beginPath();
  ctx.ellipse(-size * 0.085, eyeY, size * 0.045, size * 0.055, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.09, eyeY - size * 0.008, size * 0.035, size * 0.047, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Eye highlights.
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.arc(-size * 0.098, eyeY - size * 0.02, size * 0.011, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(size * 0.078, eyeY - size * 0.026, size * 0.008, 0, Math.PI * 2);
  ctx.fill();

  // Mouth.
  ctx.strokeStyle = '#0a0a0f';
  ctx.lineWidth = Math.max(1.5, size * 0.009);
  ctx.beginPath();
  if (phase % 3 === 1) {
    ctx.ellipse(size * 0.005, size * 0.085, size * 0.045, size * 0.028, 0, 0, Math.PI * 2);
  } else {
    ctx.arc(size * 0.005, size * 0.06, size * 0.055, 0.15, Math.PI - 0.15);
  }
  ctx.stroke();

  // Legs.
  ctx.lineCap = 'round';
  ctx.strokeStyle = visual.emissive;
  ctx.lineWidth = Math.max(3, size * 0.018);
  ctx.beginPath();
  ctx.moveTo(-size * 0.12, size * 0.24);
  ctx.lineTo(-size * 0.15, size * 0.32);
  ctx.moveTo(size * 0.11, size * 0.24);
  ctx.lineTo(size * 0.15, size * 0.32);
  ctx.stroke();

  // Antenna.
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.27);
  ctx.quadraticCurveTo(size * 0.05, -size * 0.37, size * 0.02, -size * 0.42);
  ctx.stroke();

  ctx.restore();
}

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  size: number,
  visual: StickerVisual
): void {
  const fontSize = Math.max(11, Math.round(size * 0.052));
  const barHeight = Math.round(size * 0.15);
  const barTop = size - barHeight;

  ctx.save();
  ctx.fillStyle = 'rgba(10, 10, 15, 0.82)';
  ctx.fillRect(0, barTop, size, barHeight);
  ctx.fillStyle = 'rgba(168, 255, 62, 0.55)';
  ctx.fillRect(0, barTop, size, 1);

  ctx.font = `${fontSize}px "Space Mono", "Cubic11", ui-monospace, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#a8ff3e';
  ctx.fillText(visual.label, size / 2, barTop + barHeight * 0.56);

  ctx.font = `${Math.max(8, Math.round(size * 0.034))}px "Space Mono", "Cubic11", ui-monospace, monospace`;
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.46)';
  ctx.fillText(visual.brand || '@宠你奇怪', size - size * 0.045, barTop + barHeight * 0.86);
  ctx.restore();
}

export function createSquareCanvas(
  source: HTMLCanvasElement | null,
  options: StickerCaptureOptions,
  phase = 0
): HTMLCanvasElement {
  const size = options.size ?? DEFAULT_SIZE;
  const cropScale = options.cropScale ?? DEFAULT_CROP;
  const output = document.createElement('canvas');
  output.width = size;
  output.height = size;
  const ctx = output.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available');

  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, size, size);

  if (source && source.width > 0 && source.height > 0) {
    const srcSize = Math.min(source.width, source.height) * cropScale;
    const srcX = (source.width - srcSize) / 2;
    const srcY = (source.height - srcSize) / 2;
    ctx.drawImage(source, srcX, srcY, srcSize, srcSize, 0, 0, size, size);
  } else {
    drawFallbackPet(ctx, size, options, phase);
  }

  // A thin acid border helps the sticker read on light chat backgrounds.
  ctx.strokeStyle = 'rgba(168, 255, 62, 0.55)';
  ctx.lineWidth = Math.max(1, size * 0.008);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, size - ctx.lineWidth, size - ctx.lineWidth);

  drawWatermark(ctx, size, options);
  return output;
}

export async function createPngSticker(
  source: HTMLCanvasElement | null,
  options: StickerCaptureOptions
): Promise<StickerAsset> {
  await waitForFonts();
  const size = options.size ?? DEFAULT_SIZE;
  const square = createSquareCanvas(source, options);
  const blob = await canvasToBlob(square, 'image/png');
  const dataUrl = await blobToDataUrl(blob);
  return { blob, dataUrl, kind: 'png', mime: 'image/png', width: size, height: size };
}

export async function createGifSticker(
  source: HTMLCanvasElement | null,
  options: StickerCaptureOptions,
  onFrame?: (index: number) => void
): Promise<StickerAsset> {
  await waitForFonts();
  const size = options.size ?? DEFAULT_SIZE;
  const frames: GifFrame[] = [];

  for (let index = 0; index < GIF_FRAMES; index += 1) {
    onFrame?.(index);
    const square = createSquareCanvas(source, options, index / GIF_FRAMES);
    const ctx = square.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    const image = ctx.getImageData(0, 0, size, size);
    frames.push({ data: image.data, delayMs: GIF_INTERVAL_MS });
    if (index < GIF_FRAMES - 1) await sleep(GIF_INTERVAL_MS);
  }

  const bytes = encodeGif(frames, size, size, GIF_INTERVAL_MS);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'image/gif' });
  const dataUrl = await blobToDataUrl(blob);
  return { blob, dataUrl, kind: 'gif', mime: 'image/gif', width: size, height: size };
}

export type ShareResult = 'shared' | 'cancelled' | 'unsupported';

export async function shareBlob(
  blob: Blob,
  filename: string,
  title: string,
  text: string
): Promise<ShareResult> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return 'unsupported';
  }
  try {
    const file = new File([blob], filename, { type: blob.type });
    const data: ShareData = { files: [file], title, text };
    const canShare = (
      navigator as Navigator & { canShare?: (payload: ShareData) => boolean }
    ).canShare;
    if (canShare && !canShare(data)) return 'unsupported';
    await navigator.share(data);
    return 'shared';
  } catch (error) {
    if ((error as DOMException | undefined)?.name === 'AbortError') return 'cancelled';
    return 'unsupported';
  }
}

export async function copyBlob(blob: Blob): Promise<boolean> {
  try {
    if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
      return false;
    }
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    return true;
  } catch {
    return false;
  }
}

export function downloadBlob(blob: Blob, filename: string): boolean {
  try {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
    return true;
  } catch {
    return false;
  }
}

export function isProbablyIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isProbablyWeChat(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /MicroMessenger/i.test(navigator.userAgent);
}

export function stickerFilename(mood: string, kind: StickerKind): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `weird-pet_${mood}_${stamp}.${kind}`;
}
