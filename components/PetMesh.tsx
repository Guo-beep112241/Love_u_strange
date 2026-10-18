import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  Box3,
  Color,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from 'three';
import { useHomeStore } from '../prototype/src/stores/home.store';
import { getMoodConfig } from '../prototype/src/utils/theme';
import petModelSource from '../prototype/src/assets/rainbow_pet.glb';

const WHITE = new Color('#ffffff');
const FLASH_A = new Color('#a8ff3e');
const FLASH_B = new Color('#ff0055');
const MODEL_SCALE = 1.3;

export function PetLoading() {
  const orbitRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (!orbitRef.current) return;
    orbitRef.current.rotation.y += delta * 2.2;
    orbitRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.8) * 0.35;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.06;
    orbitRef.current.scale.setScalar(pulse);
  });

  return (
    <group>
      <mesh ref={orbitRef}>
        <torusGeometry args={[0.78, 0.012, 12, 80]} />
        <meshBasicMaterial color="#a8ff3e" toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshBasicMaterial color="#1a1030" wireframe toneMapped={false} />
      </mesh>
    </group>
  );
}

export function PetMesh() {
  const bodyRef = useRef<Group>(null);
  const pointer = useThree((state) => state.pointer);
  const [scene, setScene] = useState<Group | null>(null);
  const [loadError, setLoadError] = useState(false);

  const mood = useHomeStore((state) => state.mood);
  const crazyMode = useHomeStore((state) => state.crazyMode);
  const squishImpulse = useHomeStore((state) => state.squishImpulse);
  const feedTrigger = useHomeStore((state) => state.feedTrigger);

  const config = getMoodConfig(mood);

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();
    loader.load(
      petModelSource,
      (gltf) => {
        if (!cancelled) {
          setScene(gltf.scene);
          useHomeStore.getState().setModelReady(true);
        }
      },
      undefined,
      (error) => {
        console.error('[PetMesh] failed to load rainbow pet', error);
        if (!cancelled) {
          setLoadError(true);
          useHomeStore.getState().setModelReady(true);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const model = useMemo(() => {
    if (!scene) return null;
    const cloned = scene.clone(true);
    const box = new Box3().setFromObject(cloned);
    const center = box.getCenter(new Vector3());
    const scale = MODEL_SCALE;

    cloned.position.sub(center);

    const materialList: MeshBasicMaterial[] = [];
    cloned.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      child.castShadow = false;
      child.receiveShadow = false;

      const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
      const clonedMaterials = sourceMaterials.map((source) => {
        const material = source.clone() as MeshBasicMaterial;
        if (material.color) material.color.set('#ffffff');
        material.toneMapped = false;
        material.needsUpdate = true;
        materialList.push(material);
        return material;
      });
      child.material = Array.isArray(child.material) ? clonedMaterials : clonedMaterials[0];
    });

    return { object: cloned, scale, materials: materialList };
  }, [scene]);

  const object = model?.object;
  const modelScale = model?.scale ?? 1;
  const materials = model?.materials ?? [];

  const velocity = useRef(0);
  const scaleRef = useRef(new Vector3(1, 1, 1));
  const feedPulse = useRef(0);
  const spawn = useRef(0);
  const moodPulse = useRef(1);
  const targetTint = useRef(new Color(config.emissive).lerp(WHITE, 0.35));

  useEffect(() => {
    targetTint.current.set(config.emissive).lerp(WHITE, 0.35);
    moodPulse.current = 1;
  }, [config.emissive]);

  useEffect(() => {
    if (squishImpulse > 0) velocity.current += 0.3;
  }, [squishImpulse]);

  useEffect(() => {
    if (feedTrigger > 0) feedPulse.current = 1;
  }, [feedTrigger]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const time = state.clock.elapsedTime;
    const transition = 1 - Math.pow(0.94, dt * 60);

    const tint = crazyMode
      ? Math.sin(time * 20) > 0
        ? FLASH_A
        : FLASH_B
      : targetTint.current;

    for (const material of materials) {
      material.color.lerp(tint, transition);
    }

    if (!bodyRef.current) return;

    // Frame-rate independent squish spring.
    velocity.current += (1 - scaleRef.current.y) * 12 * dt;
    velocity.current *= Math.pow(0.75, dt * 60);
    scaleRef.current.y += velocity.current;
    scaleRef.current.x = 1 / Math.sqrt(Math.max(0.2, scaleRef.current.y));
    scaleRef.current.z = 1 / Math.sqrt(Math.max(0.2, scaleRef.current.y));

    feedPulse.current = Math.max(0, feedPulse.current - dt * 2.6);
    const feed = feedPulse.current;
    spawn.current = Math.min(1, spawn.current + dt * 1.8);
    moodPulse.current = Math.max(0, moodPulse.current - dt * 2.2);

    const breath = 1 + Math.sin(time * 1.2) * 0.035;
    const spawnEase = 1 - Math.pow(1 - spawn.current, 3);
    const entrance = spawnEase * (1 + Math.sin(spawn.current * Math.PI) * 0.08);
    const moodKick = 1 + moodPulse.current * 0.035;
    const shake = crazyMode ? 0.055 : 0;
    const jitterX = (Math.random() - 0.5) * shake;
    const jitterY = (Math.random() - 0.5) * shake;

    bodyRef.current.scale.set(
      modelScale * scaleRef.current.x * entrance * moodKick * (1 + feed * 0.06),
      modelScale * scaleRef.current.y * breath * entrance * moodKick * (1 + feed * 0.1),
      modelScale * scaleRef.current.z * entrance * moodKick * (1 + feed * 0.06)
    );

    bodyRef.current.position.set(
      jitterX,
      Math.sin(time * 1.1) * 0.025 + jitterY + feed * 0.02,
      0
    );

    bodyRef.current.rotation.y = MathUtils.lerp(
      bodyRef.current.rotation.y,
      pointer.x * 0.32 + (crazyMode ? Math.sin(time * 35) * 0.06 : 0),
      1 - Math.pow(0.88, dt * 60)
    );
    bodyRef.current.rotation.x = MathUtils.lerp(
      bodyRef.current.rotation.x,
      -pointer.y * 0.16,
      1 - Math.pow(0.88, dt * 60)
    );
    bodyRef.current.rotation.z =
      Math.sin(time * 0.8) * 0.025 + moodPulse.current * Math.sin(time * 22) * 0.025;
  });

  if (loadError) {
    throw new Error('Rainbow pet model failed to load');
  }

  if (!object) {
    return <PetLoading />;
  }

  return (
    <group
      ref={bodyRef}
      onClick={(event) => {
        event.stopPropagation();
        useHomeStore.getState().squish();
      }}
    >
      <primitive object={object} />
    </group>
  );
}
