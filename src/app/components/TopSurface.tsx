import { LogoTicker } from "./LogoTicker";
import type { SlideConfig } from "./slideConfig";

interface Props {
  slide: SlideConfig;
  fontScale?: number;
  dpiScale?: number;
}

export function TopSurface({ slide, dpiScale = 1 }: Props) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <LogoTicker config={slide.top.gradient} dpiScale={dpiScale} />
    </div>
  );
}
