import { useRef, useEffect } from "react";
import type { GradientConfig } from "./slideConfig";
import { GrainyGradient } from "./GrainyGradient";

interface Props {
  config: GradientConfig;
  dpiScale?: number;
}

const LOGOS = [
  { src: "/logos/UC.png", alt: "University of Cincinnati" },
  { src: "/logos/1819.svg", alt: "1819 Innovation Hub" },
  { src: "/logos/foresight_lab.svg", alt: "Foresight Lab" },
];

// Duplicate for seamless loop
const TICKER_ITEMS = [...LOGOS, ...LOGOS, ...LOGOS];

export function LogoTicker({ config, dpiScale = 1 }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Gradient bleeds through logo masks */}
      <div className="absolute inset-0">
        <GrainyGradient config={config} dpiScale={dpiScale} />
      </div>

      {/* Black overlay — logos punch holes through this via mix-blend-mode */}
      <div
        className="absolute inset-0"
        style={{ background: "black", mixBlendMode: "multiply" }}
      />

      {/* Scrolling logo track — logos are white, multiply blend makes black areas opaque */}
      <div
        className="absolute inset-0 flex"
        style={{ maskImage: "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)" }}
      >
        <div
          ref={trackRef}
          className="flex items-stretch ticker-scroll"
          style={{ willChange: "transform", height: "100%" }}
        >
          {TICKER_ITEMS.map((logo, i) => (
            <div key={i} className="flex items-stretch flex-shrink-0 gap-12 px-12">
              <img
                src={logo.src}
                alt={logo.alt}
                className="w-auto object-contain flex-shrink-0"
                style={{
                  height: "100%",
                  filter: "brightness(10) saturate(0)",
                  mixBlendMode: "screen",
                  opacity: 0.92,
                }}
              />
              {/* Divider */}
              <div
                className="w-px self-stretch flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.15)", mixBlendMode: "screen" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
