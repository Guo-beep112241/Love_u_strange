import { getMoodConfig, type MoodId } from '../prototype/src/utils/theme';

export function PetFallback({ mood }: { mood: MoodId }) {
  const config = getMoodConfig(mood);

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-surface-base"
      role="img"
      aria-label={`2D 备用宠物，当前状态：${config.label}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(circle at 50% 42%, ${config.emissive}38, transparent 58%)`,
        }}
      />

      <div
        className="relative"
        style={{
          width: 'min(58vw, 280px)',
          height: 'min(58vw, 280px)',
          filter: `drop-shadow(0 0 26px ${config.emissive})`,
        }}
      >
        <div
          className="absolute inset-[7%] border-2"
          style={{
            background: `radial-gradient(circle at 34% 28%, ${config.color}, #101014 74%)`,
            borderColor: config.emissive,
            borderRadius: '44% 56% 48% 52% / 52% 46% 54% 48%',
          }}
        />

        <div
          className="absolute left-[26%] top-[33%] h-[13%] w-[10%] bg-[#09090e]"
          style={{ borderRadius: '50%', transform: 'rotate(-8deg)' }}
        />
        <div
          className="absolute right-[27%] top-[31%] h-[11%] w-[8%] bg-[#09090e]"
          style={{ borderRadius: '50%', transform: 'rotate(10deg)' }}
        />
        <div className="absolute left-[28%] top-[34%] h-[2.2%] w-[2.2%] rounded-full bg-white/70" />
        <div className="absolute right-[29%] top-[32.5%] h-[1.8%] w-[1.8%] rounded-full bg-white/70" />

        <div
          className="absolute left-[38%] top-[52%] h-[8%] w-[24%] border-b-2 border-[#0a0a0f]"
          style={{ borderRadius: '50%' }}
        />

        <div
          className="absolute left-[35%] top-[2%] h-[18%] w-[2%] bg-brand-accent"
          style={{ transform: 'rotate(-12deg)', transformOrigin: 'bottom center' }}
        />
        <div className="absolute bottom-[3%] left-[28%] h-[13%] w-[2.5%] bg-brand-accent/80" style={{ transform: 'rotate(14deg)' }} />
        <div className="absolute bottom-[3%] right-[28%] h-[13%] w-[2.5%] bg-brand-accent/80" style={{ transform: 'rotate(-14deg)' }} />
      </div>

      <p className="relative mt-5 px-8 text-center font-zh text-caption leading-relaxed text-text-muted">
        3D 不可用，已切换到 2D 模式
        <br />
        贴纸和动图仍然可以生成
      </p>
    </div>
  );
}
