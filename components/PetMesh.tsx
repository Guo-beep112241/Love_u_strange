import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, Mesh, Vector3, MathUtils } from 'three';
import { useHomeStore } from '../prototype/src/stores/home.store';
import { MOOD_CONFIG, MoodId } from '../prototype/src/utils/theme';

export function PetMesh() {
  const meshRef = useRef<Mesh>(null);
  const leftEyeRef = useRef<Mesh>(null);
  const rightEyeRef = useRef<Mesh>(null);
  const materialRef = useRef<any>(null);
  const pointer = useThree((state) => state.pointer);
  
  const { mood, crazyMode, squishImpulse, feedTrigger } = useHomeStore();
  const currentMoodConfig = MOOD_CONFIG[mood as MoodId];
  
  const velocity = useRef(0);
  const scaleRef = useRef(new Vector3(1.2, 1, 1.1));
  const baseScale = useRef(new Vector3(1.2, 1, 1.1));
  
  const targetColor = useRef(new Color(currentMoodConfig.color));
  const targetEmissive = useRef(new Color(currentMoodConfig.emissive));
  
  useEffect(() => {
    targetColor.current.set(currentMoodConfig.color);
    targetEmissive.current.set(currentMoodConfig.emissive);
  }, [mood]);
  
  useEffect(() => {
    if (squishImpulse > 0) {
      velocity.current += 0.3;
    }
  }, [squishImpulse]);

  useEffect(() => {
    if (feedTrigger > 0) {
      // Mouth animation simulation via scale bump
      baseScale.current.set(1.2, 1.1, 1.1);
      setTimeout(() => baseScale.current.set(1.2, 1, 1.1), 150);
      setTimeout(() => baseScale.current.set(1.2, 1.1, 1.1), 300);
      setTimeout(() => baseScale.current.set(1.2, 1, 1.1), 450);
    }
  }, [feedTrigger]);

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;
    
    // Color lerping
    materialRef.current.color.lerp(targetColor.current, 0.05);
    
    if (crazyMode) {
      // Crazy flash
      const time = state.clock.elapsedTime;
      const flashColor = Math.sin(time * 20) > 0 ? new Color('#a8ff3e') : new Color('#ff0055');
      materialRef.current.emissive.lerp(flashColor, 0.5);
      
      // Jitter
      meshRef.current.position.set(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        0
      );
    } else {
      materialRef.current.emissive.lerp(targetEmissive.current, 0.05);
      meshRef.current.position.set(0, 0, 0);
    }

    // Idle breathing
    const breath = 1 + Math.sin(state.clock.elapsedTime * 1.2) * 0.04;
    
    // Squish spring
    velocity.current += (1 - scaleRef.current.y) * 0.2; // spring force
    velocity.current *= 0.75; // damping
    scaleRef.current.y += velocity.current;
    
    // Volume preservation rough approximation
    scaleRef.current.x = baseScale.current.x / Math.sqrt(scaleRef.current.y);
    scaleRef.current.z = baseScale.current.z / Math.sqrt(scaleRef.current.y);

    meshRef.current.scale.set(
      scaleRef.current.x,
      scaleRef.current.y * breath,
      scaleRef.current.z
    );

    // Eye tracking
    const eyeTargetX = MathUtils.lerp(0, pointer.x * 0.3, 0.1);
    const eyeTargetY = MathUtils.lerp(0, pointer.y * 0.3, 0.1);
    
    if (leftEyeRef.current) {
      leftEyeRef.current.position.x = MathUtils.lerp(leftEyeRef.current.position.x, -0.3 + eyeTargetX, 0.1);
      leftEyeRef.current.position.y = MathUtils.lerp(leftEyeRef.current.position.y, 0.3 + eyeTargetY, 0.1);
    }
    if (rightEyeRef.current) {
      rightEyeRef.current.position.x = MathUtils.lerp(rightEyeRef.current.position.x, 0.4 + eyeTargetX, 0.1);
      rightEyeRef.current.position.y = MathUtils.lerp(rightEyeRef.current.position.y, 0.25 + eyeTargetY, 0.1);
    }
  });

  return (
    <group>
      <mesh ref={meshRef} onClick={(e) => {
      e.stopPropagation();
      useHomeStore.getState().squish();
    }}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial 
          ref={materialRef}
          roughness={0.1}
          transmission={0.3}
          thickness={1.5}
          emissiveIntensity={crazyMode ? 1.0 : 0.3}
        />
        
        {/* Left Eye */}
        <mesh ref={leftEyeRef} position={[-0.3, 0.3, 0.9]} scale={[0.15, 0.15, 0.1]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#000" roughness={0} />
        </mesh>
        
        {/* Right Eye */}
        <mesh ref={rightEyeRef} position={[0.4, 0.25, 0.95]} scale={[0.1, 0.1, 0.1]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#000" roughness={0} />
        </mesh>

        {/* Mouth */}
        <mesh position={[0.05, -0.1, 1]} rotation={[Math.PI/2, 0, 0]} scale={[0.2, 0.1, 0.2]}>
          <torusGeometry args={[1, 0.2, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>

        {/* Antenna */}
        <mesh position={[0, 0.9, 0]} rotation={[0, 0, -0.2]}>
          <capsuleGeometry args={[0.05, 0.4, 8, 16]} />
          <meshPhysicalMaterial roughness={0.1} transmission={0.3} color="#a8ff3e" emissive="#a8ff3e" emissiveIntensity={0.5} />
        </mesh>

        {/* Legs */}
        <mesh position={[-0.4, -0.8, 0.2]} rotation={[0, 0, 0.3]}>
          <capsuleGeometry args={[0.08, 0.3]} />
          <meshPhysicalMaterial roughness={0.1} transmission={0.3} color="#222" />
        </mesh>
        <mesh position={[0.5, -0.75, 0]} rotation={[0, 0, -0.2]}>
          <capsuleGeometry args={[0.07, 0.35]} />
          <meshPhysicalMaterial roughness={0.1} transmission={0.3} color="#222" />
        </mesh>
      </mesh>
    </group>
  );
}