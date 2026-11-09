import { useEffect, useRef } from "react";

/**
 * Fondo interactivo con partículas tipo constelación,
 * gradiente dinámico y parallax de blur spots.
 * - Canvas 2D, throttle mediante rAF.
 * - En mobile: animación automática (sin mouse).
 * - Respeta prefers-reduced-motion.
 */
export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gradientRef = useRef<HTMLDivElement | null>(null);
  const spot1Ref = useRef<HTMLDivElement | null>(null);
  const spot2Ref = useRef<HTMLDivElement | null>(null);
  const spot3Ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Colores de la paleta (sabana, oro, terracota)
    const palette = [
      "254, 210, 2",   // oro
      "140, 53, 35",   // terracota
      "114, 76, 33",   // sabana
    ];

    type P = { x: number; y: number; vx: number; vy: number; r: number; c: string };
    const density = Math.min(90, Math.floor((width * height) / 22000));
    const particles: P[] = Array.from({ length: density }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 0.6,
      c: palette[Math.floor(Math.random() * palette.length)],
    }));

    // Mouse (o mouse virtual en mobile)
    const mouse = { x: width / 2, y: height / 2, active: false };
    let virtualT = 0;

    let raf = 0;
    let pending = false;
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
      if (!pending) {
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          // Parallax spots y gradiente
          const cx = mouse.x / width - 0.5;
          const cy = mouse.y / height - 0.5;
          if (gradientRef.current) {
            gradientRef.current.style.backgroundPosition = `${50 + cx * 20}% ${50 + cy * 20}%`;
          }
          if (spot1Ref.current) spot1Ref.current.style.transform = `translate3d(${cx * -40}px, ${cy * -40}px, 0)`;
          if (spot2Ref.current) spot2Ref.current.style.transform = `translate3d(${cx * 60}px, ${cy * 30}px, 0)`;
          if (spot3Ref.current) spot3Ref.current.style.transform = `translate3d(${cx * -25}px, ${cy * 55}px, 0)`;
        });
      }
    };
    if (!isCoarse) window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("resize", resize);

    const draw = () => {
      // Mouse virtual en mobile
      if (isCoarse || !mouse.active) {
        virtualT += 0.005;
        mouse.x = width * (0.5 + Math.cos(virtualT) * 0.35);
        mouse.y = height * (0.5 + Math.sin(virtualT * 1.3) * 0.3);
      }

      ctx.clearRect(0, 0, width, height);

      // Actualizar partículas
      for (const p of particles) {
        // Repulsión suave
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        const R = 130;
        if (d2 < R * R && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const force = (1 - d / R) * 0.6;
          p.vx += (dx / d) * force * 0.15;
          p.vy += (dy / d) * force * 0.15;
        } else {
          // Deriva hacia el cursor (efecto "siguen la dirección")
          p.vx += (mouse.x - p.x) * 0.00002;
          p.vy += (mouse.y - p.y) * 0.00002;
        }

        p.vx *= 0.96;
        p.vy *= 0.96;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.c}, 0.55)`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Líneas de constelación
      const LINK = 110;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            const alpha = (1 - Math.sqrt(d2) / LINK) * 0.18;
            ctx.strokeStyle = `rgba(114, 76, 33, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };

    if (!reduce) raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        ref={gradientRef}
        className="absolute inset-0 transition-[background-position] duration-700 ease-out"
        style={{
          backgroundImage:
            "radial-gradient(1200px 800px at 50% 50%, rgba(254,210,2,0.10), transparent 60%), radial-gradient(900px 700px at 20% 30%, rgba(140,53,35,0.10), transparent 60%), radial-gradient(1000px 800px at 80% 70%, rgba(114,76,33,0.10), transparent 60%)",
          backgroundColor: "var(--crema)",
          backgroundPosition: "50% 50%",
          backgroundSize: "140% 140%",
        }}
      />
      <div
        ref={spot1Ref}
        className="absolute -top-24 -left-24 h-[380px] w-[380px] rounded-full opacity-40 blur-3xl will-change-transform"
        style={{ background: "radial-gradient(circle, rgba(254,210,2,0.55), transparent 70%)" }}
      />
      <div
        ref={spot2Ref}
        className="absolute top-1/3 -right-32 h-[440px] w-[440px] rounded-full opacity-30 blur-3xl will-change-transform"
        style={{ background: "radial-gradient(circle, rgba(140,53,35,0.55), transparent 70%)" }}
      />
      <div
        ref={spot3Ref}
        className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full opacity-25 blur-3xl will-change-transform"
        style={{ background: "radial-gradient(circle, rgba(114,76,33,0.55), transparent 70%)" }}
      />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
