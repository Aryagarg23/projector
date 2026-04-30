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

const TICKER_ITEMS = [...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS];

export function LogoTicker(_props: Props) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#000" }}>
      <div
        style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "stretch",
          maskImage: "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
      >
        <div
          className="ticker-scroll"
          style={{ display: "flex", alignItems: "stretch", height: "100%", willChange: "transform", animationDelay: "-9s" }}
        >
          {TICKER_ITEMS.map((logo, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "stretch", flexShrink: 0 }}
            >
              <img
                src={logo.src}
                alt={logo.alt}
                style={{ display: "block", height: "100%", width: "auto", flexShrink: 0, filter: "invert(1)", opacity: 0.92 }}
              />
              <div style={{ width: 1, flexShrink: 0, background: "rgba(255,255,255,0.2)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
