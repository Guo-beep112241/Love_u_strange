import { useState, useRef } from 'react';
import { Download, Copy, ArrowLeft } from 'lucide-react';
import { useHomeStore } from '../prototype/src/stores/home.store';
import { MOOD_CONFIG, MoodId } from '../prototype/src/utils/theme';

interface StickerPanelProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function StickerPanel({ canvasRef }: StickerPanelProps) {
  const { viewMode, setViewMode, stickers, addSticker, mood } = useHomeStore();
  const [generating, setGenerating] = useState(false);

  const generateSticker = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setGenerating(true);
    
    // Create offscreen canvas for framing
    const stickerCanvas = document.createElement('canvas');
    stickerCanvas.width = 240;
    stickerCanvas.height = 240;
    const ctx = stickerCanvas.getContext('2d')!;
    
    // BG
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, 240, 240);
    
    // Draw 3D canvas centered
    const srcSize = Math.min(canvas.width, canvas.height) * 0.6;
    const srcX = (canvas.width - srcSize) / 2;
    const srcY = (canvas.height - srcSize) / 2;
    ctx.drawImage(canvas, srcX, srcY, srcSize, srcSize, 0, 0, 240, 240);
    
    // Watermark
    ctx.font = '14px "Space Mono", monospace';
    ctx.fillStyle = '#a8ff3e';
    ctx.textAlign = 'center';
    ctx.fillText(MOOD_CONFIG[mood as MoodId].label + '版', 120, 224);
    
    const dataUrl = stickerCanvas.toDataURL('image/png');
    addSticker({ dataUrl, mood });
    
    setTimeout(() => setGenerating(false), 300);
  };

  const copyToClipboard = async (dataUrl: string) => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      alert('已复制到剪贴板！');
    } catch (err) {
      alert('复制失败，请点击下载。');
    }
  };

  const downloadSticker = (dataUrl: string) => {
    const link = document.createElement('a');
    link.download = `weird_pet_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div 
      className={`fixed inset-0 bg-surface-base z-50 transition-transform duration-300 ${viewMode === 'stickers' ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="pt-safe px-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center h-14 mt-2">
          <button 
            onClick={() => setViewMode('interaction')}
            className="p-2 -ml-2 text-text-primary hover:text-brand-accent transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center font-zh text-body-lg font-bold mr-6">我的情绪贴纸</h1>
        </div>

        {/* Generate Action */}
        <button
          onClick={generateSticker}
          disabled={generating}
          className="w-full mt-4 bg-brand-accent text-surface-base py-3 border-2 border-brand-accent font-zh font-bold active:bg-brand-toxic active:border-brand-toxic transition-colors shadow-[4px_4px_0px_#a8ff3e] active:shadow-[0px_0px_0px_#a8ff3e] active:translate-y-1 active:translate-x-1"
        >
          {generating ? '生成中...' : '生成当前情绪贴纸 240×240'}
        </button>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto mt-6 pb-24">
          {stickers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border-subtle opacity-50">
              <span className="font-zh text-caption text-text-muted">还没有生成贴纸...</span>
              <span className="font-zh text-caption text-text-muted mt-2">快去主界面按发疯试试 ⚡</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {stickers.map(s => (
                <div key={s.id} className="border-2 border-border-subtle bg-surface-panel p-2 flex flex-col">
                  <img src={s.dataUrl} alt="sticker" className="w-full aspect-square bg-[#0a0a0f] object-cover" />
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-subtle">
                    <span className="font-zh text-caption text-text-muted">{MOOD_CONFIG[s.mood as MoodId].label}版</span>
                    <div className="flex gap-2">
                      <button onClick={() => downloadSticker(s.dataUrl)} className="text-text-primary hover:text-brand-accent p-1">
                        <Download className="w-4 h-4" />
                      </button>
                      <button onClick={() => copyToClipboard(s.dataUrl)} className="text-text-primary hover:text-brand-accent p-1">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pb-safe py-4 text-center border-t border-border-subtle text-caption text-text-muted font-zh">
          支持导出PNG · 复制到剪贴板 · 直接发微信/小红书
        </div>
      </div>
    </div>
  );
}