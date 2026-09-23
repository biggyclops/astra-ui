import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Brain } from "./Brain";
import { Particles } from "./Particles";

export default function Scene() {
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <Canvas camera={{ position: [0, 0.25, 6.4], fov: 43 }} dpr={[1, 1.5]}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: true }}
      fallback={<div className="neural-loading" role="status">3D visualization requires WebGL.</div>}>
      <color attach="background" args={["#040815"]} />
      <ambientLight intensity={0.55} color="#73f2ff" />
      <pointLight position={[3, 4, 4]} color="#73f2ff" intensity={12} distance={12} />
      <pointLight position={[-4, -2, -3]} color="#6947ac" intensity={9} distance={11} />
      <Stars radius={70} depth={35} count={550} factor={2} saturation={0} fade speed={reducedMotion ? 0 : 0.25} />
      <Particles count={reducedMotion ? 180 : 330} />
      <Brain reducedMotion={reducedMotion} />
      <OrbitControls enableRotate enableZoom enablePan minDistance={3.2} maxDistance={11}
        enableDamping dampingFactor={0.07} rotateSpeed={0.55} panSpeed={0.5} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.75} luminanceThreshold={0.16} luminanceSmoothing={0.65} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
