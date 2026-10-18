import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  ArrowLeft,
  Copy,
  Download,
  Film,
  Image as ImageIcon,
  Share2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useHomeStore, type Sticker } from '../prototype/src/stores/home.store';
import { getMoodConfig } from '../prototype/src/utils/theme';
import {
  copyBlob,
  createGifSticker,
  createPngSticker,
  dataUrlToBlob,
  downloadBlob,
  isProbablyIOS,
  isProbablyWeChat,
  shareBlob,
  stickerFilename,
  type StickerAsset,
} from '../prototype/src/utils/sticker-export';
import { Toast } from './Toast';

interface StickerPanelProps {
  canvasRef: RefObject<HTMLCanvasElement>;
}

type GeneratingKind = 'png' | 'gif' | null;

function isUsableSticker(value: unknown): value is Sticker {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.dataUrl === 'string' &&
    record.dataUrl.startsWith('data:image/')
  );
}

export function StickerPanel({ canvasRef }: StickerPanelProps) {
  const viewMode = useHomeStore((state) => state.viewMode);
  const setViewMode = useHomeStore((state) => state.setViewMode);
  const stickersRaw = useHomeStore((state) => state.stickers);
  const addSticker = useHomeStore((state) => state.addSticker);
  const removeSticker = useHomeStore((state) => state.removeSticker);
  const clearStickers = useHomeStore((state) => state.clearStickers);
  const mood = useHomeStore((state) => state.mood);
  const modelReady = useHomeStore((state) => state.modelReady);

  const [generating, setGenerating] = useState<GeneratingKind>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'ok' | 'error' } | null>(null);
  const [preview, setPreview] = useState<Sticker | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const stickers = useMemo(
    () => (Array.isArray(stickersRaw) ? stickersRaw.filter(isUsableSticker) : []),
    [stickersRaw]
  );

  const config = getMoodConfig(mood);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    const element = panelRef.current;
    if (!element) return;
    if (viewMode === 'stickers') {
      element.removeAttribute('inert');
    } else {
      element.setAttribute('inert', '');
      setPreview(null);
    }
  }, [viewMode]);

  const showToast = (message: string, tone: 'ok' | 'error' = 'ok') => {
    setToast({ message, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  const generate = async (kind: 'png' | 'gif') => {
    if (generating) return;
    if (!modelReady && canvasRef.current) {
      showToast('彩虹兽还在加载，稍等一下', 'error');
      return;
    }
    setGenerating(kind);

    const visual = {
      label: config.message.replace(/^当前状态：/, ''),
      color: config.color,
      emissive: config.emissive,
      brand: '@宠你奇怪',
      size: 240,
    };

    try {
      let asset: StickerAsset;
      if (kind === 'gif') {
        asset = await createGifSticker(canvasRef.current, visual, (index) => {
          if (index % 4 === 0) useHomeStore.getState().squish();
        });
      } else {
        asset = await createPngSticker(canvasRef.current, visual);
      }
      addSticker({ dataUrl: asset.dataUrl, mood, kind: asset.kind, mime: asset.mime });
      showToast(kind === 'gif' ? '动图已生成，点分享试试' : '贴纸已生成');
    } catch (error) {
      console.error('[StickerPanel] generate failed', error);
      showToast('生成失败，请再试一次', 'error');
    } finally {
      setGenerating(null);
    }
  };

  const handleShare = async (sticker: Sticker) => {
    try {
      const blob = dataUrlToBlob(sticker.dataUrl);
      const result = await shareBlob(
        blob,
        stickerFilename(sticker.mood, sticker.kind || 'png'),
        '我的情绪贴纸',
        '来自宠你奇怪 · 今天你是什么状态'
      );
      if (result === 'unsupported') {
        setPreview(sticker);
        showToast('当前环境不支持系统分享，请长按图片保存', 'error');
      }
    } catch (error) {
      console.error('[StickerPanel] share failed', error);
      setPreview(sticker);
      showToast('分享失败，请长按图片保存', 'error');
    }
  };

  const handleCopy = async (sticker: Sticker) => {
    try {
      const blob = dataUrlToBlob(sticker.dataUrl);
      const copied = await copyBlob(blob);
      if (copied) {
        showToast('已复制到剪贴板');
      } else {
        setPreview(sticker);
        showToast('当前环境不支持复制图片，请长按保存', 'error');
      }
    } catch (error) {
      console.error('[StickerPanel] copy failed', error);
      setPreview(sticker);
      showToast('复制失败，请长按保存', 'error');
    }
  };

  const handleDownload = (sticker: Sticker) => {
    try {
      const blob = dataUrlToBlob(sticker.dataUrl);
      const downloaded = downloadBlob(
        blob,
        stickerFilename(sticker.mood, sticker.kind || 'png')
      );
      if (!downloaded || isProbablyIOS() || isProbablyWeChat()) {
        setPreview(sticker);
        showToast('若没有自动下载，请长按图片保存', 'error');
      } else {
        showToast('已开始下载');
      }
    } catch (error) {
      console.error('[StickerPanel] download failed', error);
      setPreview(sticker);
      showToast('下载失败，请长按保存', 'error');
    }
  };

  const handleDelete = (sticker: Sticker) => {
    removeSticker(sticker.id);
    if (preview?.id === sticker.id) setPreview(null);
    showToast('已删除');
  };

  const handleClear = () => {
    clearStickers();
    setPreview(null);
    showToast('已清空本次收藏');
  };

  return (
    <div
      ref={panelRef}
      aria-hidden={viewMode !== 'stickers'}
      className={`fx-panel fixed inset-0 z-50 transform transition-transform duration-500 [transition-timing-function:cubic-bezier(0.175,0.885,0.32,1.275)] ${
        viewMode === 'stickers' ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex h-full flex-col pt-safe">
        <div className="flex h-14 shrink-0 items-center justify-between px-3">
          <button
            type="button"
            onClick={() => setViewMode('interaction')}
            aria-label="返回主屏"
            className="flex h-11 w-11 items-center justify-center text-text-primary transition-colors hover:text-brand-accent"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="fx-title flex-1 truncate px-2 text-center font-zh text-body-lg font-bold">
            我的情绪贴纸
          </h1>
          {stickers.length > 0 ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="清空所有贴纸"
              className="flex h-11 w-11 items-center justify-center text-text-muted transition-colors hover:text-brand-toxic"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          ) : (
            <span className="h-11 w-11" aria-hidden />
          )}
        </div>

        <div className="shrink-0 px-4">
          <button
            type="button"
            onClick={() => generate('png')}
            disabled={generating !== null}
            aria-busy={generating === 'png'}
            className="fx-shine flex w-full items-center justify-center gap-2 border-2 border-brand-accent bg-brand-accent py-3 font-zh font-bold text-surface-base shadow-[4px_4px_0px_#a8ff3e] transition-colors active:translate-x-1 active:translate-y-1 active:border-brand-toxic active:bg-brand-toxic active:shadow-[0px_0px_0px_#a8ff3e] disabled:opacity-60"
          >
            <ImageIcon className="h-4 w-4" />
            {generating === 'png' ? '生成中...' : '生成静图贴纸 240×240'}
          </button>

          <button
            type="button"
            onClick={() => generate('gif')}
            disabled={generating !== null}
            aria-busy={generating === 'gif'}
            className="fx-shine mt-3 flex w-full items-center justify-center gap-2 border-2 border-brand-toxic bg-transparent py-2.5 font-zh text-caption font-bold text-brand-toxic shadow-[3px_3px_0px_#ff4dc4] transition-colors active:translate-x-1 active:translate-y-1 active:bg-brand-toxic active:text-surface-base active:shadow-[0px_0px_0px_#ff4dc4] disabled:opacity-60"
          >
            <Film className="h-4 w-4" />
            {generating === 'gif' ? '录制动图中...' : '生成会动的 GIF 贴纸'}
          </button>
        </div>

        <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-4 pb-24">
          {stickers.length === 0 ? (
            <div className="fx-empty flex flex-col items-center justify-center border-2 border-dashed border-border-subtle px-6 py-12 text-center">
              <Sparkles className="mb-3 h-8 w-8 text-brand-accent" />
              <span className="font-zh text-caption text-text-muted">
                还没有贴纸
              </span>
              <span className="mt-2 font-zh text-[11px] leading-relaxed text-text-muted/70">
                点上面的按钮生成第一张
                <br />
                静图或动图都可以直接分享
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {stickers.map((sticker) => {
                const stickerConfig = getMoodConfig(sticker.mood);
                return (
                  <div
                    key={sticker.id}
                    className="fx-card flex flex-col border-2 border-border-subtle bg-surface-panel p-2"
                  >
                    <div className="relative">
                      <img
                        src={sticker.dataUrl}
                        alt={`${stickerConfig.label}表情贴纸`}
                        loading="lazy"
                        className="aspect-square w-full bg-[#0a0a0f] object-cover"
                      />
                      <span className="fx-badge absolute left-1 top-1 border border-brand-accent bg-surface-base/85 px-1 py-0.5 font-mono text-[9px] uppercase tracking-wider text-brand-accent">
                        {sticker.kind === 'gif' ? 'GIF' : 'PNG'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-border-subtle pt-2">
                      <span className="truncate font-zh text-[11px] text-text-muted">
                        {stickerConfig.label}
                        {sticker.kind === 'gif' ? '动图' : '版'}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleShare(sticker)}
                          aria-label={`分享${stickerConfig.label}贴纸`}
                          className="flex h-8 w-8 items-center justify-center text-text-primary transition-colors hover:text-brand-accent"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(sticker)}
                          aria-label={`复制${stickerConfig.label}贴纸`}
                          className="flex h-8 w-8 items-center justify-center text-text-primary transition-colors hover:text-brand-accent"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(sticker)}
                          aria-label={`下载${stickerConfig.label}贴纸`}
                          className="flex h-8 w-8 items-center justify-center text-text-primary transition-colors hover:text-brand-accent"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(sticker)}
                          aria-label={`删除${stickerConfig.label}贴纸`}
                          className="flex h-8 w-8 items-center justify-center text-text-muted transition-colors hover:text-brand-toxic"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border-subtle px-4 pt-3 pb-safe text-center font-zh text-[11px] leading-relaxed text-text-muted">
          本地保存 · 支持 PNG / GIF · 可直接分享到微信/小红书
        </div>
      </div>

      <Toast message={toast?.message ?? null} tone={toast?.tone} />

      {preview ? (
        <div
          className="fx-preview fixed inset-0 z-[70] flex flex-col px-5 pt-safe pb-safe backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="保存贴纸"
        >
          <div className="flex shrink-0 justify-end">
            <button
              type="button"
              onClick={() => setPreview(null)}
              aria-label="关闭预览"
              className="flex h-11 w-11 items-center justify-center border border-border-subtle text-text-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center py-4">
            <img
              src={preview.dataUrl}
              alt="贴纸预览"
              className="max-h-[52dvh] max-w-full border-2 border-brand-accent object-contain"
            />
          </div>

          <p className="shrink-0 text-center font-zh text-caption leading-relaxed text-text-muted">
            长按图片保存到相册
            <br />
            或使用下面的按钮
          </p>

          <div className="mt-4 grid shrink-0 grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleShare(preview)}
              className="border border-brand-accent bg-brand-accent py-3 font-zh text-caption font-bold text-surface-base"
            >
              分享
            </button>
            <button
              type="button"
              onClick={() => handleCopy(preview)}
              className="border border-border-subtle py-3 font-zh text-caption text-text-primary"
            >
              复制
            </button>
            <button
              type="button"
              onClick={() => handleDownload(preview)}
              className="border border-border-subtle py-3 font-zh text-caption text-text-primary"
            >
              下载
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPreview(null)}
            className="mt-3 shrink-0 py-2 font-zh text-caption text-text-muted"
          >
            完成
          </button>
        </div>
      ) : null}
    </div>
  );
}
