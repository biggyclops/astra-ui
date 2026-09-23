import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, DoubleSide, Group, ShaderMaterial, SphereGeometry } from "three";

const vertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uGlow;
  uniform float uBurst;
  varying vec3 vPosition;
  varying vec3 vNormal;
  void main() {
    float rim = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.2);
    float wave = sin(vPosition.y * 10.0 - uTime * 2.4 + vPosition.x * 7.0);
    float pulse = pow(max(wave, 0.0), 8.0);
    float intensity = 0.14 + rim * (0.50 + uGlow * 0.40) + pulse * 0.20 + uBurst * 0.60;
    vec3 color = mix(vec3(0.018, 0.11, 0.23), vec3(0.32, 0.91, 1.0), clamp(intensity, 0.0, 1.0));
    gl_FragColor = vec4(color, 0.53 + rim * 0.30 + uBurst * 0.12);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// Keep the folds on the actual shell rather than drawing a flat wireframe over it.
function surface(theta: number, phi: number, side: number) {
  const fold = 1 + 0.055 * Math.sin(theta * 19 + Math.sin(phi * 6) * 2.8)
    * Math.cos(phi * 15 + Math.sin(theta * 7) * 1.5)
    + 0.023 * Math.sin(theta * 36 + phi * 10);
  const s = Math.sin(phi);
  return [
    side * 0.78 + Math.cos(theta) * s * 0.77 * fold,
    Math.cos(phi) * 1.04 * fold + 0.14,
    Math.sin(theta) * s * 0.79 * fold,
  ] as const;
}

function makeLobe(side: number) {
  const geometry = new SphereGeometry(1, 96, 64);
  const attribute = geometry.attributes.position;
  for (let i = 0; i < attribute.count; i++) {
    const x = attribute.getX(i), y = attribute.getY(i), z = attribute.getZ(i);
    const theta = Math.atan2(z, x);
    const phi = Math.acos(Math.max(-1, Math.min(1, y)));
    const [px, py, pz] = surface(theta, phi, side);
    attribute.setXYZ(i, px, py, pz);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function makeFilaments() {
  const coords: number[] = [];
  for (const side of [-1, 1]) {
    for (let strand = 0; strand < 25; strand++) {
      const phi = 0.25 + strand * 0.106;
      for (let step = 0; step < 94; step++) {
        const theta1 = step / 94 * Math.PI * 2;
        const theta2 = (step + 1) / 94 * Math.PI * 2;
        const p1 = surface(theta1, phi + Math.sin(theta1 * 7 + strand) * 0.022, side);
        const p2 = surface(theta2, phi + Math.sin(theta2 * 7 + strand) * 0.022, side);
        // A slight lift avoids z-fighting with the surface.
        for (const p of [p1, p2]) coords.push(p[0] * 1.016, (p[1] - 0.14) * 1.016 + 0.14, p[2] * 1.016);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(coords), 3));
  return geometry;
}

function makeNeurons() {
  const positions: number[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (const side of [-1, 1]) {
    for (let i = 0; i < 290; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / 290);
      const theta = i * goldenAngle;
      const [x, y, z] = surface(theta, phi, side);
      positions.push(x * 1.022, (y - 0.14) * 1.022 + 0.14, z * 1.022);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  return geometry;
}

export function Brain({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const material = useMemo(() => new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uGlow: { value: 0 }, uBurst: { value: 0 } },
    vertexShader, fragmentShader, transparent: true, side: DoubleSide, depthWrite: false,
  }), []);
  const lobes = useMemo(() => [makeLobe(-1), makeLobe(1)], []);
  const filaments = useMemo(makeFilaments, []);
  const neurons = useMemo(makeNeurons, []);
  const neuronMaterial = useMemo(() => new ShaderMaterial({
    uniforms: { uBurst: material.uniforms.uBurst, uGlow: material.uniforms.uGlow },
    vertexShader: `uniform float uBurst; varying float vBrightness;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = min(18.0, (3.8 + uBurst * 8.0) * (6.0 / -mv.z));
        gl_Position = projectionMatrix * mv; vBrightness = uBurst; }`,
    fragmentShader: `uniform float uGlow; varying float vBrightness;
      void main() { float d = length(gl_PointCoord - 0.5);
        float alpha = smoothstep(0.5, 0.08, d) * (0.55 + vBrightness * 0.45 + uGlow * 0.2);
        gl_FragColor = vec4(0.45, 0.94, 1.0, alpha); }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  }), [material]);
  const [hovered, setHovered] = useState(false);
  const burstAt = useRef(-100);
  const currentTime = useRef(0);

  useEffect(() => () => {
    material.dispose();
    neuronMaterial.dispose();
    filaments.dispose();
    neurons.dispose();
    lobes.forEach(lobe => lobe.dispose());
  }, [filaments, lobes, material, neuronMaterial, neurons]);

  useEffect(() => { document.body.style.cursor = hovered ? "pointer" : ""; return () => { document.body.style.cursor = ""; }; }, [hovered]);

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;
    currentTime.current = elapsed;
    if (group.current && !reducedMotion) group.current.rotation.y += Math.min(delta, 0.05) * 0.09;
    material.uniforms.uTime.value = reducedMotion ? 0 : elapsed;
    material.uniforms.uGlow.value += ((hovered ? 1 : 0) - material.uniforms.uGlow.value) * Math.min(delta * 6, 1);
    material.uniforms.uBurst.value = reducedMotion ? 0 : Math.max(0, 1 - (elapsed - burstAt.current) / 0.85);
  });

  return (
    <group ref={group} scale={1.14} onPointerOver={event => { event.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)} onClick={event => { event.stopPropagation(); burstAt.current = currentTime.current; }}>
      {lobes.map((geometry, index) => <mesh key={index} geometry={geometry} material={material} />)}
      <lineSegments geometry={filaments}>
        <lineBasicMaterial color="#7ceaff" transparent opacity={0.34} blending={AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <points geometry={neurons} material={neuronMaterial} />
      <mesh position={[0, -1.06, 0]} scale={[0.28, 0.52, 0.35]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial color="#1a799c" transparent opacity={0.38} depthWrite={false} />
      </mesh>
    </group>
  );
}
