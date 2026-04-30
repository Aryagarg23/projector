import { useEffect, useRef, useState } from "react";
import type { GradientConfig } from "./slideConfig";

interface Props {
  config: GradientConfig;
  dpiScale?: number;
}

const LOGOS = [
  { src: "/logos/UC.png", alt: "University of Cincinnati" },
  { src: "/logos/1819.svg", alt: "1819 Innovation Hub" },
  { src: "/logos/foresight_lab.svg", alt: "Foresight Lab" },
];

function LogoSet({ height, refCb }: { height: number; refCb?: (el: HTMLDivElement | null) => void }) {
  return (
    <div
      ref={refCb}
      style={{ display: "flex", alignItems: "center", height: `${height}px`, flexShrink: 0 }}
    >
      {LOGOS.map((logo, i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "center", height: `${height}px`, flexShrink: 0 }}
        >
          <img
            src={logo.src}
            alt={logo.alt}
            style={{ display: "block", height: `${height}px`, width: "auto", flexShrink: 0, filter: "invert(1)", opacity: 0.92 }}
          />
          <div
            style={{
              width: 1, height: `${height}px`, flexShrink: 0,
              marginLeft: 2, marginRight: 2, background: "rgba(255,255,255,0.2)",
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function LogoTicker(_props: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(0);
  const [setWidth, setSetWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0].contentRect.height;
      setHeight(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Measure one set's pixel width once images load + on resize
  useEffect(() => {
    const node = setRef.current;
    if (!node) return;

    const measure = () => {
      const w = node.getBoundingClientRect().width;
      if (w > 0) setSetWidth(Math.round(w));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);

    // Re-measure when each image finishes loading (logos can have varying load times)
    const imgs = node.querySelectorAll("img");
    const onLoad = () => measure();
    imgs.forEach((img) => img.addEventListener("load", onLoad));

    return () => {
      ro.disconnect();
      imgs.forEach((img) => img.removeEventListener("load", onLoad));
    };
  }, [height]);

  // Cylindrical (rAF-driven) infinite scroll — never resets, just modulos.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || setWidth <= 0) return;

    let pos = 0;
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); // clamp big gaps (tab focus etc.)
      last = now;

      // Read live ticker speed from CSS var ("18s" → 18). Fallback 18.
      const cssVar = getComputedStyle(document.documentElement).getPropertyValue("--ticker-speed").trim();
      const seconds = parseFloat(cssVar) || 18;
      const pxPerSec = setWidth / seconds;

      pos += pxPerSec * dt;
      // Modulo: wrap invisibly. Position X looks identical to X - setWidth
      // because the second copy is right behind.
      if (pos >= setWidth) pos -= setWidth;

      el.style.transform = `translate3d(${-pos}px, 0, 0)`;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [setWidth]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#000" }}>
      {height > 0 && (
        <div
          style={{
            position: "absolute", inset: 0,
            display: "flex",
            maskImage: "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
          }}
        >
          <div
            ref={scrollRef}
            style={{ display: "flex", height: `${height}px`, willChange: "transform" }}
          >
            <LogoSet height={height} refCb={(el) => (setRef.current = el)} />
            <LogoSet height={height} />
          </div>
        </div>
      )}
    </div>
  );
}
