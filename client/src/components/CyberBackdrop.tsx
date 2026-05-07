import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
};

export function CyberBackdrop({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [lowPowerMode, setLowPowerMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let lastPaint = 0;
    let raf = 0;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lowPowerQuery = window.matchMedia("(max-width: 640px)");
    const connection = (navigator as Navigator & {
      connection?: {
        saveData?: boolean;
        addEventListener?: (type: string, listener: () => void) => void;
        removeEventListener?: (type: string, listener: () => void) => void;
      };
    }).connection;
    let isVisible = document.visibilityState === "visible";

    const shouldAnimate = () => isVisible && !motionQuery.matches;
    const isLowPower = () => lowPowerQuery.matches || Boolean(connection?.saveData);

    const syncMotionState = () => {
      setReducedMotion(motionQuery.matches);
      setLowPowerMode(isLowPower());
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = isLowPower() ? 1 : Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const particleBudget = isLowPower() ? 28 : Math.min(86, Math.floor((width * height) / 22000));
      particles = Array.from({ length: particleBudget }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (isLowPower() ? 0.1 : 0.18),
        vy: (Math.random() - 0.5) * (isLowPower() ? 0.1 : 0.18),
        radius: 0.8 + Math.random() * (isLowPower() ? 1.2 : 1.8),
        alpha: 0.25 + Math.random() * (isLowPower() ? 0.35 : 0.55),
      }));
    };

    const draw = (now: number) => {
      const lowPower = isLowPower();
      const minFrameInterval = lowPower ? 48 : 16;
      if (now - lastPaint < minFrameInterval) {
        raf = window.requestAnimationFrame(draw);
        return;
      }
      lastPaint = now;
      frame += 1;
      ctx.clearRect(0, 0, width, height);

      const grd = ctx.createLinearGradient(0, 0, width, height);
      grd.addColorStop(0, "rgba(8, 15, 35, 0.6)");
      grd.addColorStop(0.5, "rgba(6, 12, 28, 0.24)");
      grd.addColorStop(1, "rgba(2, 4, 12, 0.9)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        const pulse = 0.55 + Math.sin(frame * 0.02 + index) * 0.18;
        ctx.beginPath();
        ctx.fillStyle = `rgba(125, 211, 252, ${p.alpha * pulse})`;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!lowPower) {
        for (let i = 0; i < particles.length; i += 1) {
          for (let j = i + 1; j < particles.length; j += 1) {
            const a = particles[i];
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 140) {
              const alpha = (1 - dist / 140) * 0.16;
              ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.strokeStyle = "rgba(125, 211, 252, 0.9)";
      for (let y = (frame * 0.9) % 24; y < height; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      if (shouldAnimate()) {
        raf = window.requestAnimationFrame(draw);
      }
    };

    resize();
    syncMotionState();
    if (shouldAnimate()) {
      raf = window.requestAnimationFrame(draw);
    } else if (isVisible || motionQuery.matches) {
      draw(performance.now());
    }
    window.addEventListener("resize", resize);
    const onVisibilityChange = () => {
      isVisible = document.visibilityState === "visible";
      syncMotionState();
      window.cancelAnimationFrame(raf);
      if (shouldAnimate()) {
        raf = window.requestAnimationFrame(draw);
      } else if (isVisible || motionQuery.matches) {
        draw(performance.now());
      }
    };
    const onMotionChange = () => {
      syncMotionState();
      window.cancelAnimationFrame(raf);
      if (shouldAnimate()) {
        raf = window.requestAnimationFrame(draw);
      } else if (isVisible || motionQuery.matches) {
        draw(performance.now());
      }
    };
    const onLowPowerChange = () => {
      syncMotionState();
      resize();
      window.cancelAnimationFrame(raf);
      if (shouldAnimate()) {
        raf = window.requestAnimationFrame(draw);
      } else if (isVisible || motionQuery.matches) {
        draw(performance.now());
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    motionQuery.addEventListener("change", onMotionChange);
    lowPowerQuery.addEventListener("change", onLowPowerChange);
    connection?.addEventListener?.("change", onLowPowerChange);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionQuery.removeEventListener("change", onMotionChange);
      lowPowerQuery.removeEventListener("change", onLowPowerChange);
      connection?.removeEventListener?.("change", onLowPowerChange);
    };
  }, []);

  return (
    <div className={cn("pointer-events-none fixed inset-0 z-0 overflow-hidden", className)}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className={cn("absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_75%_25%,rgba(217,70,239,0.08),transparent_24%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.12),transparent_30%)]", reducedMotion || lowPowerMode ? "opacity-70" : "")} />
      <div className={cn("absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,22,0.12),rgba(3,8,22,0.54)_70%,rgba(3,8,22,0.88))]", reducedMotion || lowPowerMode ? "opacity-85" : "")} />
    </div>
  );
}
