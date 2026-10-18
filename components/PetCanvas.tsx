import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';
import { useHomeStore } from '../prototype/src/stores/home.store';
import { PetMesh } from './PetMesh';
import React from 'react';

// Forward ref to capture canvas for stickers
export const PetCanvas = React.forwardRef<HTMLCanvasElement>((props, ref) => {
  const crazyMode = useHomeStore(state => state.crazyMode);

  return (
    <div className="w-full h-[78vh] bg-[#0a0a0f] relative">
      <Canvas 
        ref={ref}
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        dpr={Math.min(window.devicePixelRatio, 1.5)}
        gl={{ preserveDrawingBuffer: true, antialias: false }}
        className="touch-none"
      >
        <ambientLight intensity={0.2} color="#0a0a1a" />
        <pointLight position={[2, 3, 2]} color="#a8ff3e" intensity={2} />
        <pointLight position={[-2, -1, 1]} color="#7b2fff" intensity={1.5} />
        
        <PetMesh />

        <EffectComposer autoClear={false}>
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
    </div>
  );
});
PetCanvas.displayName = 'PetCanvas';