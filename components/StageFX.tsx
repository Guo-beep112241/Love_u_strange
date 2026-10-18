import type { CSSProperties } from 'react';
import { useHomeStore } from '../prototype/src/stores/home.store';
import { getMoodConfig } from '../prototype/src/utils/theme';

const PARTICLES = Array.from({ length: 16 }, (_, index) => ({
  left: `${4 + ((index * 37) % 92)}%`,
  top: `${6 + ((index * 53) % 82)}%`,
  delay: `${(index % 8) * 0.55}s`,
  duration: `${4.2 + (index % 5) * 0.85}s`,
  scale: 0.65 + (index % 4) * 0.22,
}));

export function StageFX() {
  const mood = useHomeStore((state) => state.mood);
  const crazyMode = useHomeStore((state) => state.crazyMode);
  const config = getMoodConfig(mood);

  const moodStyle = {
    '--mood-color': config.color,
    '--mood-emissive': config.emissive,
  } as CSSProperties;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
      style={moodStyle}
    >
      <div className="fx-aurora" />
      <div className="fx-aurora-2" />
      <div className="fx-grid" />

      <div className="fx-orbits">
        <span className="fx-ring fx-ring-1" />
        <span className="fx-ring fx-ring-2" />
        <span className="fx-ring fx-ring-3" />
      </div>

      {PARTICLES.map((particle, index) => (
        <span
          key={index}
          className="fx-particle"
          style={{
            left: particle.left,
            top: particle.top,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
            transform: `scale(${particle.scale})`,
          }}
        />
      ))}

      <div className="fx-vignette" />
      <div className="fx-scanlines" />
      <div className={`fx-crazy ${crazyMode ? 'is-on' : ''}`} />
      {crazyMode ? <div className="fx-crazy-word">发疯中</div> : null}

      <span className="fx-corner fx-corner-tl" />
      <span className="fx-corner fx-corner-tr" />
      <span className="fx-corner fx-corner-bl" />
      <span className="fx-corner fx-corner-br" />
    </div>
  );
}
