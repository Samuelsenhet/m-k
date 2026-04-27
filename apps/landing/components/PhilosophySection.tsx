"use client";

import { PHILOSOPHY, SITE } from "@/content/home";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function PhilosophySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const triggered = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          let i = 0;
          intervalRef.current = setInterval(() => {
            i++;
            setVisibleCount(i);
            if (i >= PHILOSOPHY.lines.length && intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }, 320);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="philosophy"
      className="scroll-mt-20 border-t border-maak-border/60 bg-maak-cream py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-maak-primary">
            {PHILOSOPHY.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-maak-foreground md:text-4xl">
            {PHILOSOPHY.title}
          </h2>
        </div>

        <div className="mx-auto mt-14 max-w-xl">
          <div className="rounded-3xl border border-maak-border/60 bg-white/70 px-8 py-10 shadow-[0_10px_36px_-32px_rgba(37,61,44,0.18)] backdrop-blur-sm md:px-12 md:py-14">
            {PHILOSOPHY.lines.map((line, i) => {
              const isEmphasis = PHILOSOPHY.emphasisLines.includes(i);
              const isVisible = i < visibleCount;
              return (
                <p
                  key={i}
                  className={`text-center transition-all duration-500 ${
                    isVisible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-2 opacity-0"
                  } ${
                    isEmphasis
                      ? "mb-4 text-lg font-bold text-maak-primary md:text-xl"
                      : "mb-3 text-base italic text-maak-foreground/80 md:text-lg"
                  }`}
                >
                  {line}
                </p>
              );
            })}
          </div>

          <div
            className={`mt-10 text-center transition-all delay-300 duration-700 ${
              visibleCount >= PHILOSOPHY.lines.length
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            <Link
              href={SITE.appStoreUrl}
              className="inline-flex items-center gap-2 rounded-full bg-maak-primary px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:scale-[1.03] hover:shadow-xl"
            >
              {PHILOSOPHY.cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
