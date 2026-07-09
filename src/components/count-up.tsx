"use client";

import { useEffect, useRef, useState } from "react";

// Counts from 0 to `end` when scrolled into view. Non-numeric renders as-is.
export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);
  const match = value.match(/^(\d+)(.*)$/);

  useEffect(() => {
    if (!match) return;
    const el = ref.current;
    if (!el) return;
    const end = parseInt(match[1], 10);
    const suffix = match[2];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || end === 0) return;

    setDisplay(`0${suffix}`);
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const duration = 1200;
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(`${Math.round(eased * end)}${suffix}`);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span ref={ref}>{display}</span>;
}
