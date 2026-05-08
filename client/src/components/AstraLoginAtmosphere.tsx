import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ASTRA_LOGIN_IMAGE } from "./astra-assets";
import "./astra-login-atmosphere.css";

type AstraLoginAtmosphereProps = {
  typingLevel?: number;
  awakened?: boolean;
  className?: string;
};

type Particle = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  twinkle: number;
};

const PORTRAIT_ASPECT = 1536 / 1024;
const TAU = Math.PI * 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function easeInOutSine(value: number) {
  return 0.5 - 0.5 * Math.cos(value * Math.PI);
}

function fitContain(width: number, height: number) {
  const scale = Math.min(width / PORTRAIT_ASPECT, height);
  const frameWidth = scale * PORTRAIT_ASPECT;
  const frameHeight = scale;
  return {
    left: (width - frameWidth) / 2,
    top: (height - frameHeight) / 2,
    width: frameWidth,
    height: frameHeight,
  };
}

function createParticles(width: number, height: number, count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    z: 0.35 + Math.random() * 0.65,
    vx: -0.08 + Math.random() * 0.16,
    vy: -0.025 + Math.random() * 0.05,
    size: 0.6 + Math.random() * 1.9,
    alpha: 0.05 + Math.random() * 0.14,
    twinkle: Math.random() * TAU,
  }));
}

export function AstraLoginAtmosphere({ typingLevel = 0, awakened = false, className }: AstraLoginAtmosphereProps) {
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const blinkRef = useRef<HTMLDivElement | null>(null);
  const eyeGlowRef = useRef<HTMLDivElement | null>(null);
  const hairDriftRef = useRef<HTMLDivElement | null>(null);
  const fogRef = useRef<HTMLDivElement | null>(null);
  const cursorLightRef = useRef<HTMLDivElement | null>(null);
  const mouseTargetRef = useRef({ x: 0.5, y: 0.42 });
  const mouseCurrentRef = useRef({ x: 0.5, y: 0.42 });
  const particlesRef = useRef<Particle[]>([]);
  const blinkStateRef = useRef({
    nextAt: 0,
    phase: 0,
    startedAt: 0,
  });
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (reducedMotion) {
      return undefined;
    }

    const root = rootRef.current;
    const canvas = canvasRef.current;
    const blink = blinkRef.current;
    const eyeGlow = eyeGlowRef.current;
    const hairDrift = hairDriftRef.current;
    const fog = fogRef.current;
    const cursorLight = cursorLightRef.current;
    if (!root || !canvas || !blink || !eyeGlow || !hairDrift || !fog || !cursorLight) {
      return undefined;
    }

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      return undefined;
    }

    let raf = 0;
    let resizeRaf = 0;
    let frameWidth = 0;
    let frameHeight = 0;

    const scheduleBlink = (now: number) => {
      const interval = 3800 + Math.random() * 5400;
      blinkStateRef.current.nextAt = now + interval;
    };

    const setFrame = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const fit = fitContain(width, height);

      frameWidth = Math.max(1, Math.round(fit.width));
      frameHeight = Math.max(1, Math.round(fit.height));

      root.style.setProperty("--astra-login-frame-left", `${fit.left}px`);
      root.style.setProperty("--astra-login-frame-top", `${fit.top}px`);
      root.style.setProperty("--astra-login-frame-width", `${fit.width}px`);
      root.style.setProperty("--astra-login-frame-height", `${fit.height}px`);
      root.style.setProperty("--astra-login-mouse-x", "50%");
      root.style.setProperty("--astra-login-mouse-y", "42%");
      root.style.setProperty("--astra-login-background-x", "0px");
      root.style.setProperty("--astra-login-background-y", "0px");
      root.style.setProperty("--astra-login-fog-x", "0px");
      root.style.setProperty("--astra-login-fog-y", "0px");
      root.style.setProperty("--astra-login-focus-x", "50%");
      root.style.setProperty("--astra-login-focus-y", "42%");

      canvas.width = Math.round(frameWidth * dpr);
      canvas.height = Math.round(frameHeight * dpr);
      canvas.style.width = `${frameWidth}px`;
      canvas.style.height = `${frameHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const particleCount = width < 900 ? 46 : 72;
      particlesRef.current = createParticles(frameWidth, frameHeight, particleCount);
      scheduleBlink(performance.now());
    };

    const onResize = () => {
      window.cancelAnimationFrame(resizeRaf);
      resizeRaf = window.requestAnimationFrame(setFrame);
    };

    const onPointerMove = (event: PointerEvent) => {
      const nx = clamp(event.clientX / window.innerWidth, 0, 1);
      const ny = clamp(event.clientY / window.innerHeight, 0, 1);
      mouseTargetRef.current = {
        x: nx,
        y: ny,
      };
    };

    const onPointerLeave = () => {
      mouseTargetRef.current = { x: 0.5, y: 0.42 };
    };

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("blur", onPointerLeave);

    setFrame();
    startTimeRef.current = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      const motionCycle = elapsed / 10.6;
      const breath = easeInOutSine((motionCycle % 1 + 1) % 1);
      const micro = Math.sin(elapsed * 0.82 + 0.7) * 0.5 + Math.sin(elapsed * 1.37 + 1.4) * 0.5;
      const head = Math.sin(elapsed * 0.61 + 0.8) * 0.6 + Math.sin(elapsed * 0.93 + 2.1) * 0.35;
      const eyeDrift = Math.sin(elapsed * 0.55 + 1.3) * 0.5 + Math.sin(elapsed * 0.78 + 0.2) * 0.25;
      const hair = Math.sin(elapsed * 0.47 + 2.4) * 0.7 + Math.sin(elapsed * 0.88 + 0.6) * 0.22;
      const glowPulse = 0.5 - 0.5 * Math.cos((elapsed / 9.7) * TAU);
      const ambient = 0.5 - 0.5 * Math.cos((elapsed / 12.2 + 0.14) * TAU);
      const typingBoost = clamp(typingLevel, 0, 1);
      const awakeBoost = awakened ? 1 : 0;
      const target = mouseTargetRef.current;
      const current = mouseCurrentRef.current;
      current.x += (target.x - current.x) * 0.045;
      current.y += (target.y - current.y) * 0.045;

      const pointerX = (current.x - 0.5) * 2;
      const pointerY = (current.y - 0.5) * 2;
      const parallaxX = pointerX * 9;
      const parallaxY = pointerY * 7;
      const backgroundX = pointerX * 0.72 + breath * 0.08 + micro * 0.05;
      const backgroundY = pointerY * 0.5 - breath * 0.09 + head * 0.02;
      const fogX = pointerX * 7 + Math.sin(elapsed * 0.18) * 5.5;
      const fogY = pointerY * 4.2 + Math.cos(elapsed * 0.15 + 0.5) * 3.5;
      const focusOpacity = clamp(0.14 + typingBoost * 0.24 + awakeBoost * 0.12 + glowPulse * 0.08, 0, 1);

      root.style.setProperty("--astra-login-portrait-x", `${(pointerX * 0.72 + micro * 0.18 + eyeDrift * 0.08) * 1.5}px`);
      root.style.setProperty("--astra-login-portrait-y", `${(pointerY * 0.52 + breath * 0.24 - 0.12) * 1.5}px`);
      root.style.setProperty("--astra-login-portrait-rotate", `${pointerX * 0.08 + head * 0.14}deg`);
      root.style.setProperty("--astra-login-portrait-scale", `${1 + breath * 0.004 + typingBoost * 0.0015 + awakeBoost * 0.0012}`);
      root.style.setProperty("--astra-login-head-x", `${(head * 1.3 + pointerX * 0.12).toFixed(3)}px`);
      root.style.setProperty("--astra-login-head-y", `${(breath * -0.95 + pointerY * 0.22 - 0.05).toFixed(3)}px`);
      root.style.setProperty("--astra-login-head-rotate", `${head * 0.11 - pointerX * 0.04}deg`);
      root.style.setProperty("--astra-login-hair-x", `${(hair * 0.9 + pointerX * 0.08).toFixed(3)}px`);
      root.style.setProperty("--astra-login-hair-y", `${(hair * -0.42).toFixed(3)}px`);
      root.style.setProperty("--astra-login-hair-rotate", `${hair * 0.09}deg`);
      root.style.setProperty("--astra-login-eye-x", `${(eyeDrift * 0.75 + pointerX * 0.2).toFixed(3)}px`);
      root.style.setProperty("--astra-login-eye-y", `${(eyeDrift * 0.42 + pointerY * 0.1).toFixed(3)}px`);
      root.style.setProperty("--astra-login-eye-glow", `${0.28 + glowPulse * 0.18 + typingBoost * 0.18 + awakeBoost * 0.06}`);
      root.style.setProperty("--astra-login-ambient", `${0.24 + ambient * 0.13 + typingBoost * 0.08 + awakeBoost * 0.05}`);
      root.style.setProperty("--astra-login-mouse-x", `${(current.x * 100).toFixed(2)}%`);
      root.style.setProperty("--astra-login-mouse-y", `${(current.y * 100).toFixed(2)}%`);
      root.style.setProperty("--astra-login-parallax-x", `${parallaxX.toFixed(3)}px`);
      root.style.setProperty("--astra-login-parallax-y", `${parallaxY.toFixed(3)}px`);
      root.style.setProperty("--astra-login-background-x", `${backgroundX.toFixed(3)}px`);
      root.style.setProperty("--astra-login-background-y", `${backgroundY.toFixed(3)}px`);
      root.style.setProperty("--astra-login-fog-x", `${fogX.toFixed(3)}px`);
      root.style.setProperty("--astra-login-fog-y", `${fogY.toFixed(3)}px`);
      root.style.setProperty("--astra-login-focus-x", `${(current.x * 100).toFixed(2)}%`);
      root.style.setProperty("--astra-login-focus-y", `${(current.y * 100).toFixed(2)}%`);
      root.style.setProperty("--astra-login-focus-opacity", `${focusOpacity.toFixed(4)}`);
      root.style.setProperty("--astra-login-focus-scale", `${(1 + glowPulse * 0.02 + typingBoost * 0.01).toFixed(4)}`);

      const blinkState = blinkStateRef.current;
      if (now >= blinkState.nextAt && blinkState.phase === 0) {
        blinkState.phase = 1;
        blinkState.startedAt = now;
      }

      const blinkElapsed = blinkState.phase ? now - blinkState.startedAt : 99999;
      let blinkValue = 0;
      if (blinkState.phase === 1) {
        blinkValue = blinkElapsed < 82 ? easeInOutSine(blinkElapsed / 82) : blinkElapsed < 125 ? 1 : 1 - easeInOutSine((blinkElapsed - 125) / 82);
        if (blinkElapsed >= 207) {
          blinkState.phase = 0;
          blinkState.startedAt = 0;
          scheduleBlink(now + (Math.random() < 0.17 ? 130 : 0));
        }
      }
      const blinkStrength = clamp(blinkValue, 0, 1);
      blink.style.setProperty("--astra-login-blink", blinkStrength.toFixed(4));
      eyeGlow.style.setProperty("--astra-login-eye-opacity", `${(0.18 + glowPulse * 0.14 + typingBoost * 0.15 + awakeBoost * 0.05).toFixed(4)}`);
      hairDrift.style.setProperty("--astra-login-hair-opacity", `${(0.1 + breath * 0.08).toFixed(4)}`);
      fog.style.setProperty("--astra-login-fog-opacity", `${(0.18 + ambient * 0.08 + typingBoost * 0.08).toFixed(4)}`);
      cursorLight.style.setProperty("--astra-login-focus-opacity", `${focusOpacity.toFixed(4)}`);

      context.clearRect(0, 0, frameWidth, frameHeight);
      context.globalCompositeOperation = "lighter";

      for (const particle of particlesRef.current) {
        particle.x += particle.vx * (0.5 + particle.z * 0.8);
        particle.y += particle.vy * (0.5 + particle.z * 0.6);
        particle.twinkle += 0.007 + particle.z * 0.004;

        if (particle.x < -12) particle.x = frameWidth + 12;
        if (particle.x > frameWidth + 12) particle.x = -12;
        if (particle.y < -12) particle.y = frameHeight + 12;
        if (particle.y > frameHeight + 12) particle.y = -12;

        const alpha = particle.alpha * (0.6 + 0.4 * Math.sin(particle.twinkle)) * (0.7 + glowPulse * 0.4);
        context.fillStyle = `rgba(125, 211, 252, ${alpha})`;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size * (0.7 + particle.z * 0.7), 0, TAU);
        context.fill();
      }

      const streakCount = 4;
      for (let i = 0; i < streakCount; i += 1) {
        const lane = i / (streakCount - 1);
        const y = frameHeight * (0.18 + lane * 0.44 + Math.sin(elapsed * (0.06 + i * 0.012) + i) * 0.03);
        const xDrift = frameWidth * (0.12 + lane * 0.18) + Math.sin(elapsed * 0.1 + i * 1.7) * frameWidth * 0.05;
        const gradient = context.createLinearGradient(xDrift - 140, y, xDrift + 180, y);
        gradient.addColorStop(0, "rgba(34, 211, 238, 0)");
        gradient.addColorStop(0.45, `rgba(34, 211, 238, ${0.035 + glowPulse * 0.02})`);
        gradient.addColorStop(0.5, `rgba(125, 211, 252, ${0.09 + ambient * 0.05})`);
        gradient.addColorStop(0.56, `rgba(34, 211, 238, ${0.03 + glowPulse * 0.01})`);
        gradient.addColorStop(1, "rgba(34, 211, 238, 0)");
        context.strokeStyle = gradient;
        context.lineWidth = 1 + i * 0.22;
        context.beginPath();
        context.moveTo(xDrift - 200, y - 1);
        context.lineTo(xDrift + 260, y + 1);
        context.stroke();
      }

      context.globalCompositeOperation = "source-over";
      raf = window.requestAnimationFrame(render);
    };

    raf = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(raf);
      window.cancelAnimationFrame(resizeRaf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
    };
  }, [awakened, reducedMotion, typingLevel]);

  return (
    <div ref={rootRef} className={cn("astra-login-atmosphere pointer-events-none fixed inset-0 overflow-hidden", className)} aria-hidden="true">
      <div className="astra-login-atmosphere__backdrop absolute inset-0" />
      <div ref={fogRef} className="astra-login-atmosphere__fog absolute inset-0" />
      <div ref={cursorLightRef} className="astra-login-atmosphere__cursor-light absolute inset-0" />
      <div
        className="astra-login-atmosphere__frame absolute"
        style={{
          left: "var(--astra-login-frame-left, 0px)",
          top: "var(--astra-login-frame-top, 0px)",
          width: "var(--astra-login-frame-width, 100vw)",
          height: "var(--astra-login-frame-height, 100vh)",
        }}
      >
        <div
          className="astra-login-atmosphere__portrait absolute inset-0"
          style={{
            transform:
              "translate3d(var(--astra-login-portrait-x, 0px), var(--astra-login-portrait-y, 0px), 0) rotate(var(--astra-login-portrait-rotate, 0deg)) scale(var(--astra-login-portrait-scale, 1))",
          }}
        >
          <img
            src={ASTRA_LOGIN_IMAGE}
            alt=""
            className="astra-login-atmosphere__image absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />

          <div
            className="astra-login-atmosphere__head-drift absolute inset-0"
            style={{
              transform:
                "translate3d(var(--astra-login-head-x, 0px), var(--astra-login-head-y, 0px), 0) rotate(var(--astra-login-head-rotate, 0deg))",
            }}
          >
            <img
              src={ASTRA_LOGIN_IMAGE}
              alt=""
              className="astra-login-atmosphere__image astra-login-atmosphere__head-image absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
          </div>

          <div
            className="astra-login-atmosphere__body-glow absolute inset-0"
            style={{
              opacity: "var(--astra-login-ambient, 0.28)",
            }}
          />

          <div
            ref={eyeGlowRef}
            className="astra-login-atmosphere__eye-glow absolute"
            style={{
              opacity: "var(--astra-login-eye-opacity, 0.22)",
              transform:
                "translate3d(calc(var(--astra-login-eye-x, 0px) + var(--astra-login-parallax-x, 0px) * 0.06), calc(var(--astra-login-eye-y, 0px) + var(--astra-login-parallax-y, 0px) * 0.03), 0)",
            }}
          />

          <div
            ref={hairDriftRef}
            className="astra-login-atmosphere__hair-drift absolute inset-0"
            style={{
              opacity: "var(--astra-login-hair-opacity, 0.12)",
              transform:
                "translate3d(calc(var(--astra-login-hair-x, 0px) + var(--astra-login-parallax-x, 0px) * 0.04), calc(var(--astra-login-hair-y, 0px)), 0) rotate(var(--astra-login-hair-rotate, 0deg))",
            }}
          >
            <img
              src={ASTRA_LOGIN_IMAGE}
              alt=""
              className="astra-login-atmosphere__image astra-login-atmosphere__hair-image absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
          </div>

          <div
            ref={blinkRef}
            className="astra-login-atmosphere__blink absolute"
            style={{
              transform:
                "translate3d(calc(var(--astra-login-parallax-x, 0px) * 0.02), calc(var(--astra-login-parallax-y, 0px) * 0.01), 0) scaleY(calc(0.15 + var(--astra-login-blink, 0) * 1.08))",
            }}
          />

          <div className="astra-login-atmosphere__eye-focus absolute" />
        </div>

        <canvas ref={canvasRef} className="astra-login-atmosphere__canvas absolute inset-0" />
      </div>

      <div className="astra-login-atmosphere__scanlines absolute inset-0" />
      <div className="astra-login-atmosphere__vignette absolute inset-0" />
    </div>
  );
}

export default AstraLoginAtmosphere;
