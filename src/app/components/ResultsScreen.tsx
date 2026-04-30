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
  defaultBgSettings,
  renderSliderRanges,
  type SlideConfig,
  type MCQAnswer,
} from "./slideConfig";
import { useLivePoll } from "../lib/useLivePoll";
import { useAllPollCounts } from "../lib/useAllPollCounts";

// Question slides only (excludes welcome). Module-scope so the cycle effect
// doesn't depend on a recreated array.
const questionSlides = slides.filter((s) => s.bottom.showGraph);
const qCount = questionSlides.length;

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

// Mirrors the projector's BottomSurface but driven by live answers.
function LiveBottomSurface({
  slide,
  answers,
  ribbonCount,
  ribbonSpeed,
  rippleCount,
  rippleSpeed,
}: {
  slide: SlideConfig;
  answers: MCQAnswer[];
  ribbonCount: number;
  ribbonSpeed: number;
  rippleCount: number;
  rippleSpeed: number;
}) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <GrainyGradient
        config={slide.bottom.gradient}
        dpiScale={1}
        ribbonCount={ribbonCount}
        ribbonSpeed={ribbonSpeed}
        rippleCount={rippleCount}
        rippleSpeed={rippleSpeed}
      />
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

function LiveTopSurface({ slide, tickerSpeed }: { slide: SlideConfig; tickerSpeed: number }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <LogoTicker config={slide.top.gradient} dpiScale={1} speedSeconds={tickerSpeed} />
    </div>
  );
}

export function ResultsScreen() {
  // We only need `poll` (the active poll) so we can avoid showing its tally.
  // Counts for ALL polls are fetched separately below via fetchAll().
  const { poll } = useLivePoll();

  const [guideUIVisible, setGuideUIVisible] = useState(false);

  // Draft values — sliders write here freely while the panel is open.
  const [tickerSpeed, setTickerSpeed] = useState(defaultRenderSettings.tickerSpeed);
  const [ribbonCount, setRibbonCount] = useState(defaultBgSettings.ribbonCount);
  const [ribbonSpeed, setRibbonSpeed] = useState(defaultBgSettings.ribbonSpeed);
  const [rippleCount, setRippleCount] = useState(defaultBgSettings.rippleCount);
  const [rippleSpeed, setRippleSpeed] = useState(defaultBgSettings.rippleSpeed);

  // Live (committed) values — these flow to children. Updated only when
  // exiting config mode, so dragging sliders doesn't churn the render loop.
  const [tickerSpeedLive, setTickerSpeedLive] = useState(defaultRenderSettings.tickerSpeed);
  const [ribbonCountLive, setRibbonCountLive] = useState(defaultBgSettings.ribbonCount);
  const [ribbonSpeedLive, setRibbonSpeedLive] = useState(defaultBgSettings.ribbonSpeed);
  const [rippleCountLive, setRippleCountLive] = useState(defaultBgSettings.rippleCount);
  const [rippleSpeedLive, setRippleSpeedLive] = useState(defaultBgSettings.rippleSpeed);

  useEffect(() => {
    if (guideUIVisible) return;
    setTickerSpeedLive(tickerSpeed);
    setRibbonCountLive(ribbonCount);
    setRibbonSpeedLive(ribbonSpeed);
    setRippleCountLive(rippleCount);
    setRippleSpeedLive(rippleSpeed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guideUIVisible]);

  const [topCorners, setTopCorners] = useState<Quad | null>(null);
  const [bottomCorners, setBottomCorners] = useState<Quad | null>(null);
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

  // Index of the active poll within questionSlides — the one we should NOT show.
  const livePollIdx = useMemo(
    () => (poll ? questionSlides.findIndex((s) => s.id === poll.slide_id) : -1),
    [poll?.slide_id]
  );

  // Which question's results to display. Always avoids livePollIdx so voters
  // on answer-here can't peek at the live tally for what they're voting on.
  const [displayedQIdx, setDisplayedQIdx] = useState(0);

  // When the active poll changes, jump displayedQIdx to the PREVIOUS question
  // (the one just completed). Offset -1 so admins advancing the active poll
  // immediately reveals the previous question's tally on results-here.
  useEffect(() => {
    if (livePollIdx < 0 || qCount === 0) return;
    setDisplayedQIdx((livePollIdx - 1 + qCount) % qCount);
  }, [livePollIdx]);

  // Cycle displayed graph every 45s, skipping the active poll's index.
  useEffect(() => {
    if (qCount === 0) return;
    const timer = setInterval(() => {
      setDisplayedQIdx((prev) => {
        let next = (prev + 1) % qCount;
        if (next === livePollIdx) next = (next + 1) % qCount;
        return next;
      });
    }, 45000);
    return () => clearInterval(timer);
  }, [livePollIdx]);

  // Fetch counts for ALL polls — the displayed (non-active) question's graph
  // pulls its real tally from this map.
  const { pollsBySlide, countsByPollId } = useAllPollCounts();

  // Resolve the slide + answers for the displayed (non-active) question.
  // heroText comes straight from slideConfig (frontend-controlled framing) —
  // we don't override from DB so the question text formatting stays consistent.
  const displaySlide: SlideConfig = useMemo(() => {
    const slide = questionSlides[displayedQIdx] ?? questionSlides[0] ?? slides[0];
    return {
      ...slide,
      bottom: {
        ...slide.bottom,
        showGraph: true,
      },
    };
  }, [displayedQIdx]);

  const answers: MCQAnswer[] = useMemo(() => {
    const slide = questionSlides[displayedQIdx] ?? questionSlides[0];
    const row = pollsBySlide[slide?.id];
    const cnt = row ? countsByPollId[row.id] : undefined;
    const raw = [
      { label: "A", text: row?.option_a, votes: cnt?.A ?? 0 },
      { label: "B", text: row?.option_b, votes: cnt?.B ?? 0 },
      { label: "C", text: row?.option_c, votes: cnt?.C ?? 0 },
      { label: "D", text: row?.option_d, votes: cnt?.D ?? 0 },
    ];
    return raw.filter(
      (a): a is { label: string; text: string; votes: number } =>
        a.text != null && a.text !== ""
    );
  }, [displayedQIdx, pollsBySlide, countsByPollId]);

  // Expose runtime state on window for fast debugging from DevTools console.
  // Type `__resultsDebug()` in DevTools to dump the current view state.
  useEffect(() => {
    (window as unknown as { __resultsDebug: () => unknown }).__resultsDebug = () => {
      const dump = {
        activePollSlideId: poll?.slide_id ?? null,
        livePollIdx,
        displayedQIdx,
        displayedSlideId: questionSlides[displayedQIdx]?.id ?? null,
        pollsBySlide,
        countsByPollId,
        answers,
      };
      // eslint-disable-next-line no-console
      console.log("[results-here debug]", dump);
      return dump;
    };
  }, [poll, livePollIdx, displayedQIdx, pollsBySlide, countsByPollId, answers]);

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
          <LiveTopSurface slide={displaySlide} tickerSpeed={tickerSpeedLive} />
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
          <LiveBottomSurface
            slide={displaySlide}
            answers={answers}
            ribbonCount={ribbonCountLive}
            ribbonSpeed={ribbonSpeedLive}
            rippleCount={rippleCountLive}
            rippleSpeed={rippleSpeedLive}
          />
        </PerspectivePanel>
      </div>

      {guideUIVisible && (
        <div
          className="fixed top-4 left-4 z-[100] bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg p-4 w-64 space-y-4 max-h-[90vh] overflow-y-auto"
        >
          <h3 className="text-white/70 tracking-widest text-xs" style={{ fontFamily: "monospace" }}>
            RESULTS CONFIG
          </h3>
          <Slider
            label="TICKER SPEED"
            value={tickerSpeed}
            onChange={setTickerSpeed}
            range={renderSliderRanges.tickerSpeed}
            unit="s"
            decimals={1}
            minHint="fast"
            maxHint="slow"
          />
          <Slider
            label="ORB COUNT"
            value={ribbonCount}
            onChange={setRibbonCount}
            range={renderSliderRanges.ribbonCount}
            decimals={0}
          />
          <Slider
            label="ORB SPEED"
            value={ribbonSpeed}
            onChange={setRibbonSpeed}
            range={renderSliderRanges.ribbonSpeed}
            unit="x"
            decimals={2}
          />
          <Slider
            label="RIPPLE COUNT"
            value={rippleCount}
            onChange={setRippleCount}
            range={renderSliderRanges.rippleCount}
            decimals={0}
          />
          <Slider
            label="RIPPLE SPEED"
            value={rippleSpeed}
            onChange={setRippleSpeed}
            range={renderSliderRanges.rippleSpeed}
            unit="x"
            decimals={2}
          />
          <div className="text-white/20 text-[9px] border-t border-white/5 pt-2" style={{ fontFamily: "monospace" }}>
            Ctrl+Space to hide config
          </div>
        </div>
      )}
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
  range,
  unit = "",
  decimals = 2,
  minHint,
  maxHint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  range: { min: number; max: number; step: number };
  unit?: string;
  decimals?: number;
  minHint?: string;
  maxHint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="text-white/50 text-xs" style={{ fontFamily: "monospace" }}>
          {label}
        </label>
        <span className="text-white/80 text-xs tabular-nums" style={{ fontFamily: "monospace" }}>
          {value.toFixed(decimals)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 appearance-none bg-white/10 rounded-full outline-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-grab
          [&::-webkit-slider-thumb]:active:cursor-grabbing"
      />
      <div className="flex justify-between text-white/20 text-[9px]" style={{ fontFamily: "monospace" }}>
        <span>{range.min}{unit}{minHint ? ` (${minHint})` : ""}</span>
        <span>{range.max}{unit}{maxHint ? ` (${maxHint})` : ""}</span>
      </div>
    </div>
  );
}
