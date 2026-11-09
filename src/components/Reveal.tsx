import { useEffect, useRef, useState } from "react";
import type { ReactNode, ElementType, CSSProperties } from "react";

type Variant = "up" | "down" | "left" | "right" | "pop" | "fade";

export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, visible };
}

const HIDDEN: Record<Variant, string> = {
  up: "opacity-0 translate-y-8",
  down: "opacity-0 -translate-y-8",
  left: "opacity-0 -translate-x-10",
  right: "opacity-0 translate-x-10",
  pop: "opacity-0 scale-75",
  fade: "opacity-0",
};

export function Reveal({
  children,
  delay = 0,
  duration = 700,
  variant = "up",
  as: Tag = "div",
  className = "",
  style,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  variant?: Variant;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <Tag
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        ...style,
      }}
      className={`transition-[transform,opacity,filter] will-change-transform ${
        visible ? "opacity-100 translate-x-0 translate-y-0 scale-100" : HIDDEN[variant]
      } ${className}`}
    >
      {children}
    </Tag>
  );
}

/* Stagger children reveal */
export function Cascade({
  children,
  step = 90,
  variant = "up",
  className = "",
  itemClassName = "",
}: {
  children: ReactNode[];
  step?: number;
  variant?: Variant;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <Reveal key={i} delay={i * step} variant={variant} className={itemClassName}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}

/* Count-up number */
export function CountUp({
  to,
  suffix = "",
  prefix = "",
  duration = 1400,
  className = "",
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal<HTMLSpanElement>(0.4);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {n.toLocaleString("es-VE")}
      {suffix}
    </span>
  );
}
