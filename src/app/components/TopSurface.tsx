import { GrainyGradient } from "./GrainyGradient";
import { HeroOverlay } from "./HeroOverlay";
import type { SlideConfig } from "./slideConfig";

interface Props {
  slide: SlideConfig;
  fontScale?: number;
  dpiScale?: number;
}

export function TopSurface({ slide, fontScale = 1, dpiScale = 1 }: Props) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <GrainyGradient config={slide.top.gradient} dpiScale={dpiScale} />
      <HeroOverlay
        config={slide.top}
        slideId={`top-${slide.id}`}
        fontScale={fontScale}
      />
    </div>
  );
}
