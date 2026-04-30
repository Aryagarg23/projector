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

const TICKER_ITEMS = [...LOGOS, ...LOGOS];

export function LogoTicker(_props: Props) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <div
        className="absolute inset-0 flex"
        style={{ maskImage: "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)" }}
      >
        <div
          className="flex items-stretch ticker-scroll"
          style={{ willChange: "transform", height: "100%" }}
        >
          {TICKER_ITEMS.map((logo, i) => (
            <div key={i} className="flex items-center flex-shrink-0" style={{ padding: "0 48px", gap: 48 }}>
              <img
                src={logo.src}
                alt={logo.alt}
                className="flex-shrink-0"
                style={{ height: "60%", width: "auto", maxWidth: 200, objectFit: "contain", filter: "invert(1)", opacity: 0.92 }}
              />
              <div
                className="self-stretch flex-shrink-0"
                style={{ width: 1, background: "rgba(255,255,255,0.2)" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
