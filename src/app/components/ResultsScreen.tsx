import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PerspectivePanel } from "./PerspectivePanel";
import { GrainyGradient } from "./GrainyGradient";
import { LiveBarGraphRealtime } from "./LiveBarGraphRealtime";
import { HeroOverlay } from "./HeroOverlay";
import { LogoTicker } from "./LogoTicker";
import {
  slides,
  defaultCornerInset,
  defaultRenderSettings,
  renderSliderRanges,
  type SlideConfig,
  type MCQAnswer,
} from "./slideConfig";
import { useLivePoll } from "../lib/useLivePoll";

interface Point {
  x: number;
  y: number;
}
type Quad = [Point, Point, Point, Point];

function makeDefaultCorners(w: number, h: number): Quad {
  const ix = w * defaultCornerInset;
  const iy = h * defaultCornerInset;
  return [
    { x: ix, y: iy },
    { x: w - ix, y: iy },
    { x: w - ix, y: h - iy },
    { x: ix, y: h - iy },
  ];
}

function slideFor(slideId: string | undefined): SlideConfig {
  return slides.find((s) => s.id === slideId) ?? slides[1];
}

// Mirrors the projector's BottomSurface but driven by live answers.
function LiveBottomSurface({
  slide,
  answers,
}: {
  slide: SlideConfig;
  answers: MCQAnswer[];
}) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <GrainyGradient config={slide.bottom.gradient} dpiScale={1} />
      {slide.bottom.showGraph && (
        <LiveBarGraphRealtime
          answers={answers}
          accentHue={slide.bottom.graphHue ?? slide.bottom.gradient.baseHue}
          dpiScale={1}
          fontScale={1}
        />
      )}
      <HeroOverlay
        config={slide.bottom}
        slideId={`results-bottom-${slide.id}`}
        fontScale={1}
        alignTop={slide.bottom.showGraph}
      />
    </div>
  );
}

function LiveTopSurface({ slide }: { slide: SlideConfig }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <LogoTicker config={slide.top.gradient} dpiScale={1} />
    </div>
  );
}

export function ResultsScreen() {
  const { poll, counts } = useLivePoll();

  const [guideUIVisible, setGuideUIVisible] = useState(false);
  const [tickerSpeed, setTickerSpeed] = useState(defaultRenderSettings.tickerSpeed);
  const [topCorners, setTopCorners] = useState<Quad | null>(null);
  const [bottomCorners, setBottomCorners] = useState<Quad | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty("--ticker-speed", `${tickerSpeed}s`);
  }, [tickerSpeed]);
  const topSizeRef = useRef({ w: 0, h: 0 });
  const bottomSizeRef = useRef({ w: 0, h: 0 });

  const handleTopSize = useCallback((w: number, h: number) => {
    topSizeRef.current = { w, h };
    setTopCorners((prev) => prev ?? makeDefaultCorners(w, h));
  }, []);

  const handleBottomSize = useCallback((w: number, h: number) => {
    bottomSizeRef.current = { w, h };
    setBottomCorners((prev) => prev ?? makeDefaultCorners(w, h));
  }, []);

  const handleTopCornersChange = useCallback((newTop: Quad) => {
    setTopCorners(newTop);
    setBottomCorners((prev) => {
      if (!prev) return prev;
      const topH = topSizeRef.current.h;
      const next = [...prev] as Quad;
      next[0] = { x: newTop[3].x, y: newTop[3].y - topH };
      next[1] = { x: newTop[2].x, y: newTop[2].y - topH };
      return next;
    });
  }, []);

  const handleBottomCornersChange = useCallback((newBottom: Quad) => {
    setBottomCorners(newBottom);
    const topH = topSizeRef.current.h;
    setTopCorners((prev) => {
      if (!prev) return prev;
      const next = [...prev] as Quad;
      next[3] = { x: newBottom[0].x, y: newBottom[0].y + topH };
      next[2] = { x: newBottom[1].x, y: newBottom[1].y + topH };
      return next;
    });
  }, []);

  // Ctrl+Space toggles corner-drag guide UI (same as projector)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        setGuideUIVisible((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const answers: MCQAnswer[] = useMemo(() => {
    if (!poll) {
      return [
        { label: "A", text: "—", votes: 0 },
        { label: "B", text: "—", votes: 0 },
        { label: "C", text: "—", votes: 0 },
        { label: "D", text: "—", votes: 0 },
      ];
    }
    return [
      { label: "A", text: poll.option_a, votes: counts.A },
      { label: "B", text: poll.option_b, votes: counts.B },
      { label: "C", text: poll.option_c, votes: counts.C },
      { label: "D", text: poll.option_d, votes: counts.D },
    ];
  }, [poll, counts]);

  const baseSlide = slideFor(poll?.slide_id);
  const liveSlide: SlideConfig = useMemo(
    () => ({
      ...baseSlide,
      bottom: {
        ...baseSlide.bottom,
        heroText: poll?.question ?? "WAITING FOR POLL",
        showGraph: !!poll,
      },
    }),
    [baseSlide, poll]
  );

  return (
    <div className="w-screen h-screen bg-black flex flex-col overflow-hidden select-none">
      {/* Top surface — 20vh */}
      <div className="relative" style={{ height: "20vh" }}>
        <PerspectivePanel
          id="results-top"
          label="TOP SURFACE"
          guideUIVisible={guideUIVisible}
          corners={topCorners}
          onCornersChange={handleTopCornersChange}
          onSizeChange={handleTopSize}
        >
          <LiveTopSurface slide={liveSlide} />
        </PerspectivePanel>
      </div>

      {/* Bottom surface — 80vh */}
      <div className="relative" style={{ height: "80vh" }}>
        <PerspectivePanel
          id="results-bottom"
          label="BOTTOM SURFACE"
          guideUIVisible={guideUIVisible}
          corners={bottomCorners}
          onCornersChange={handleBottomCornersChange}
          onSizeChange={handleBottomSize}
        >
          <LiveBottomSurface slide={liveSlide} answers={answers} />
        </PerspectivePanel>
      </div>

      {guideUIVisible && (
        <div
          className="fixed top-4 left-4 z-[100] bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg p-4 w-64 space-y-4"
        >
          <h3 className="text-white/70 tracking-widest text-xs" style={{ fontFamily: "monospace" }}>
            RESULTS CONFIG
          </h3>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-white/50 text-xs" style={{ fontFamily: "monospace" }}>
                TICKER SPEED
              </label>
              <span className="text-white/80 text-xs tabular-nums" style={{ fontFamily: "monospace" }}>
                {tickerSpeed.toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              min={renderSliderRanges.tickerSpeed.min}
              max={renderSliderRanges.tickerSpeed.max}
              step={renderSliderRanges.tickerSpeed.step}
              value={tickerSpeed}
              onChange={(e) => setTickerSpeed(parseFloat(e.target.value))}
              className="w-full h-1.5 appearance-none bg-white/10 rounded-full outline-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-grab
                [&::-webkit-slider-thumb]:active:cursor-grabbing"
            />
            <div className="flex justify-between text-white/20 text-[9px]" style={{ fontFamily: "monospace" }}>
              <span>{renderSliderRanges.tickerSpeed.min}s (fast)</span>
              <span>{renderSliderRanges.tickerSpeed.max}s (slow)</span>
            </div>
          </div>
          <div className="text-white/20 text-[9px] border-t border-white/5 pt-2" style={{ fontFamily: "monospace" }}>
            Ctrl+Space to hide config
          </div>
        </div>
      )}
    </div>
  );
}
