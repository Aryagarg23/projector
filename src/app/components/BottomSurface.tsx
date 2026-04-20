import { GrainyGradient } from "./GrainyGradient";
import { LiveBarGraph } from "./LiveBarGraph";
import { HeroOverlay } from "./HeroOverlay";
import type { SlideConfig } from "./slideConfig";

interface Props {
  slide: SlideConfig;
  fontScale?: number;
  dpiScale?: number;
}

export function BottomSurface({ slide, fontScale = 1, dpiScale = 1 }: Props) {
  const defaultAnswers = [
    { label: "A", text: "Option A", votes: 25 },
    { label: "B", text: "Option B", votes: 25 },
    { label: "C", text: "Option C", votes: 25 },
    { label: "D", text: "Option D", votes: 25 },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden">
      <GrainyGradient config={slide.bottom.gradient} dpiScale={dpiScale} />
      {slide.bottom.showGraph && (
        <LiveBarGraph
          answers={slide.bottom.answers ?? defaultAnswers}
          accentHue={slide.bottom.graphHue ?? slide.bottom.gradient.baseHue}
          dpiScale={dpiScale}
          fontScale={fontScale}
        />
      )}
      <HeroOverlay
        config={slide.bottom}
        slideId={`bottom-${slide.id}`}
        fontScale={fontScale}
        alignTop={slide.bottom.showGraph}
      />
    </div>
  );
}