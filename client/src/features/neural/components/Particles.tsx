import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points } from "three";

export function Particles({ count = 330 }: { count?: number }) {
  const points = useRef<Points>(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    let seed = 314159;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < count; i++) {
      const radius = 3.5 + random() * 10;
      const angle = random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (random() - 0.5) * 11;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const result = new BufferGeometry();
    result.setAttribute("position", new BufferAttribute(positions, 3));
    return result;
  }, [count]);
  useFrame((_, delta) => { if (points.current) points.current.rotation.y += Math.min(delta, 0.05) * 0.004; });
  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial color="#73f2ff" size={0.025} transparent opacity={0.55} sizeAttenuation depthWrite={false} blending={AdditiveBlending} />
    </points>
  );
}
