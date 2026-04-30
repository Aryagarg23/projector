import { GrainyGradient } from "./GrainyGradient";
import { LiveBarGraph } from "./LiveBarGraph";
import { HeroOverlay } from "./HeroOverlay";
import type { SlideConfig } from "./slideConfig";

interface Props {
  slide: SlideConfig;
  /** Separate slide whose answers/graph to display — decoupled from the question slide */
  graphSlide?: SlideConfig;
  fontScale?: number;
  dpiScale?: number;
}

export function BottomSurface({ slide, graphSlide, fontScale = 1, dpiScale = 1 }: Props) {
  const graph = graphSlide ?? slide;
  const defaultAnswers = [
    { label: "A", text: "Option A", votes: 25 },
    { label: "B", text: "Option B", votes: 25 },
    { label: "C", text: "Option C", votes: 25 },
    { label: "D", text: "Option D", votes: 25 },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden">
      <GrainyGradient config={graph.bottom.gradient} dpiScale={dpiScale} />
      {graph.bottom.showGraph && (
        <LiveBarGraph
          answers={graph.bottom.answers ?? defaultAnswers}
          accentHue={graph.bottom.graphHue ?? graph.bottom.gradient.baseHue}
          dpiScale={dpiScale}
          fontScale={fontScale}
        />
      )}
      <HeroOverlay
        config={graph.bottom}
        slideId={`bottom-${graph.id}`}
        fontScale={fontScale}
        alignTop={graph.bottom.showGraph}
      />
    </div>
  );
}