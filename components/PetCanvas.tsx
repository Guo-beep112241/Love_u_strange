import { Component, forwardRef, useEffect, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';
import { PetFallback } from './PetFallback';
import { PetMesh } from './PetMesh';
import { useHomeStore } from '../prototype/src/stores/home.store';
import { getMoodConfig } from '../prototype/src/utils/theme';

interface CanvasBoundaryProps {
  children: ReactNode;
  onError: () => void;
}

class CanvasErrorBoundary extends Component<CanvasBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error('[PetCanvas] WebGL scene failed', error);
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function detectWebGL(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      (window.WebGLRenderingContext && canvas.getContext('webgl2')) ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

export const PetCanvas = forwardRef<HTMLCanvasElement>((_props, ref) => {
  const crazyMode = useHomeStore((state) => state.crazyMode);
  const mood = useHomeStore((state) => state.mood);
  const modelReady = useHomeStore((state) => state.modelReady);
  const config = getMoodConfig(mood);

  const [webglOk] = useState<boolean>(() => detectWebGL());
  const [visible, setVisible] = useState(true);
  const [contextLost, setContextLost] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(!document.hidden);
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  if (!webglOk || contextLost || failed) {
    return (
      <div className="h-full w-full">
        <PetFallback mood={mood} />
      </div>
    );
  }

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-surface-base"
      role="img"
      aria-label={`3D 丑萌宠物，当前状态：${config.label}`}
    >
      <CanvasErrorBoundary onError={() => setFailed(true)}>
        <Canvas
          ref={ref}
          frameloop={visible ? 'always' : 'never'}
          camera={{ position: [0, 0, 5.55], fov: 45 }}
          dpr={Math.min(window.devicePixelRatio || 1, 1.5)}
          gl={{ preserveDrawingBuffer: true, antialias: false }}
          className="touch-none"
          onCreated={({ gl }) => {
            const element = gl.domElement;
            element.addEventListener('webglcontextlost', (event) => {
              event.preventDefault();
              setContextLost(true);
            });
            element.addEventListener('webglcontextrestored', () => setContextLost(false));
          }}
        >
          <ambientLight intensity={0.2} color="#0a0a1a" />
          <pointLight position={[2, 3, 2]} color="#a8ff3e" intensity={2} />
          <pointLight position={[-2, -1, 1]} color="#7b2fff" intensity={1.5} />

          <PetMesh />

          <EffectComposer multisampling={0}>
            <Bloom
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              intensity={crazyMode ? 3.0 : 1.5}
              radius={0.8}
              mipmapBlur
            />
            <ChromaticAberration
              offset={crazyMode ? new Vector2(0.01, 0.01) : new Vector2(0.002, 0.002)}
              blendFunction={BlendFunction.NORMAL}
              radialModulation={false}
              modulationOffset={0}
            />
          </EffectComposer>
        </Canvas>
      </CanvasErrorBoundary>

      {!modelReady ? (
        <div className="fx-model-loading">
          <div className="text-center font-display text-[10px] uppercase tracking-[0.3em] text-brand-accent/80">
            正在召唤彩虹兽
          </div>
          <div className="fx-loading-bar">
            <span />
          </div>
          <div className="text-center font-mono text-[8px] uppercase tracking-[0.22em] text-text-muted/50">
            LOADING PET // GLB
          </div>
        </div>
      ) : null}
    </div>
  );
});

PetCanvas.displayName = 'PetCanvas';
