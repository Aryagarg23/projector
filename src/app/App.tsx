import { useState, useEffect, useCallback, useRef } from "react";
import { PerspectivePanel } from "./components/PerspectivePanel";
import { BottomSurface } from "./components/BottomSurface";
import { TopSurface } from "./components/TopSurface";
import { ConfigPanel } from "./components/ConfigPanel";
import { slides, defaultRenderSettings, defaultCornerInset } from "./components/slideConfig";
import { useLivePoll } from "./lib/useLivePoll";

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

// Question slides only (excludes welcome etc.)
const questionSlides = slides.filter((s) => s.bottom.showGraph);
const qCount = questionSlides.length;

export default function App() {
  const [resetKey, setResetKey] = useState(0);
  const [guideUIVisible, setGuideUIVisible] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  // graphQIdx is an index into questionSlides — which question's results to display.
  // Starts at qCount-1 so when Q1 (qIdx 0) is active the graph shows Q4 (qIdx 3).
  const [graphQIdx, setGraphQIdx] = useState(Math.max(0, qCount - 1));
  const [autoPlay, setAutoPlay] = useState(true);
  const [fontScale, setFontScale] = useState(defaultRenderSettings.fontScale);
  const [dpiScale, setDpiScale] = useState(defaultRenderSettings.dpiScale);
  const [tickerSpeed, setTickerSpeed] = useState(defaultRenderSettings.tickerSpeed);
  const [graphSwapDelay, setGraphSwapDelay] = useState(defaultRenderSettings.graphSwapDelay);

  useEffect(() => {
    document.documentElement.style.setProperty("--ticker-speed", `${tickerSpeed}s`);
  }, [tickerSpeed]);

  // Corner state lifted here for shared-edge linking
  const [topCorners, setTopCorners] = useState<Quad | null>(null);
  const [bottomCorners, setBottomCorners] = useState<Quad | null>(null);
  const topSizeRef = useRef({ w: 0, h: 0 });
  const bottomSizeRef = useRef({ w: 0, h: 0 });

  const baseSlide = slides[slideIndex];
  const { poll: livePoll, counts: liveCounts } = useLivePoll();

  // The slide whose graph/answers we display in the bottom surface
  const graphSlide = (() => {
    const base = questionSlides[graphQIdx % Math.max(1, qCount)] ?? questionSlides[0] ?? baseSlide;
    if (!livePoll) return base;
    // If live poll matches the graph slide, inject live counts
    if (livePoll.slide_id !== base.id) return base;
    const liveAnswers = [
      { label: "A", text: livePoll.option_a, votes: liveCounts.A },
      { label: "B", text: livePoll.option_b, votes: liveCounts.B },
      { label: "C", text: livePoll.option_c, votes: liveCounts.C },
      { label: "D", text: livePoll.option_d, votes: liveCounts.D },
    ].filter((a): a is { label: string; text: string; votes: number } =>
      a.text != null && a.text !== ""
    );
    return {
      ...base,
      bottom: {
        ...base.bottom,
        // heroText stays from slideConfig (frontend-controlled framing).
        answers: liveAnswers,
      },
    };
  })();

  // currentSlide drives top surface (question text) + bottom gradient/hero label.
  // Graph answers come from graphSlide instead.
  const currentSlide = baseSlide;

  // When a vote is submitted: livePoll.slide_id changes → jump graphQIdx to that question
  useEffect(() => {
    if (!livePoll) return;
    const idx = questionSlides.findIndex((s) => s.id === livePoll.slide_id);
    if (idx >= 0) setGraphQIdx(idx);
    // Also keep the top surface on the matching question slide
    const slideIdx = slides.findIndex((s) => s.id === livePoll.slide_id);
    if (slideIdx >= 0 && slideIdx !== slideIndex) setSlideIndex(slideIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePoll?.slide_id]);

  const goNext = useCallback(() => {
    setSlideIndex((i) => (i + 1) % slides.length);
  }, []);

  const goPrev = useCallback(() => {
    setSlideIndex((i) => (i - 1 + slides.length) % slides.length);
  }, []);

  // Auto-cycle graph every graphSwapDelay seconds. The timer always runs;
  // vote arrivals or config-mode-exit reset it (cycleResetKey).
  const [cycleResetKey, setCycleResetKey] = useState(0);
  const graphSwapDelayRef = useRef(graphSwapDelay);
  graphSwapDelayRef.current = graphSwapDelay;

  useEffect(() => {
    if (qCount === 0) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const ms = Math.max(1000, graphSwapDelayRef.current * 1000);
      timer = setTimeout(() => {
        setGraphQIdx((i) => (i + 1) % qCount);
        schedule();
      }, ms);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [qCount, cycleResetKey]);

  // Restart the cycle when the user closes the config panel — picks up any
  // slider changes immediately instead of waiting for the current tick.
  useEffect(() => {
    if (!guideUIVisible) setCycleResetKey((k) => k + 1);
  }, [guideUIVisible]);

  // When a vote arrives (counts total increases), jump graph to live poll's question
  // and restart the 45s timer.
  const lastTotalRef = useRef(0);
  useEffect(() => {
    const total = liveCounts.A + liveCounts.B + liveCounts.C + liveCounts.D;
    if (total > lastTotalRef.current && livePoll) {
      const idx = questionSlides.findIndex((s) => s.id === livePoll.slide_id);
      if (idx >= 0) setGraphQIdx(idx);
      setCycleResetKey((k) => k + 1);
    }
    lastTotalRef.current = total;
  }, [liveCounts, livePoll]);

  // Initialize corners when sizes are known
  const handleTopSize = useCallback((w: number, h: number) => {
    topSizeRef.current = { w, h };
    setTopCorners((prev) => prev ?? makeDefaultCorners(w, h));
  }, []);

  const handleBottomSize = useCallback((w: number, h: number) => {
    bottomSizeRef.current = { w, h };
    setBottomCorners((prev) => prev ?? makeDefaultCorners(w, h));
  }, []);

  // When top corners change, link bottom edge of top → top edge of bottom
  const handleTopCornersChange = useCallback((newTop: Quad) => {
    setTopCorners(newTop);
    // Top's BR (index 2) → Bottom's TR (index 1), Top's BL (index 3) → Bottom's TL (index 0)
    // Convert from top's coordinate space to bottom's coordinate space
    // Top bottom-edge Y maps to bottom Y=0 line, X stays the same
    setBottomCorners((prev) => {
      if (!prev) return prev;
      const topH = topSizeRef.current.h;
      const next = [...prev] as Quad;
      // Map: top panel bottom-left corner → bottom panel top-left corner
      next[0] = { x: newTop[3].x, y: newTop[3].y - topH };
      // Map: top panel bottom-right corner → bottom panel top-right corner
      next[1] = { x: newTop[2].x, y: newTop[2].y - topH };
      return next;
    });
  }, []);

  // When bottom corners change, link top edge of bottom → bottom edge of top
  const handleBottomCornersChange = useCallback((newBottom: Quad) => {
    setBottomCorners(newBottom);
    const topH = topSizeRef.current.h;
    setTopCorners((prev) => {
      if (!prev) return prev;
      const next = [...prev] as Quad;
      // Bottom panel top-left (index 0) → top panel bottom-left (index 3)
      next[3] = { x: newBottom[0].x, y: newBottom[0].y + topH };
      // Bottom panel top-right (index 1) → top panel bottom-right (index 2)
      next[2] = { x: newBottom[1].x, y: newBottom[1].y + topH };
      return next;
    });
  }, []);

  // Reset corners
  useEffect(() => {
    if (resetKey > 0) {
      const tw = topSizeRef.current.w;
      const th = topSizeRef.current.h;
      const bw = bottomSizeRef.current.w;
      const bh = bottomSizeRef.current.h;
      if (tw && th) setTopCorners(makeDefaultCorners(tw, th));
      if (bw && bh) setBottomCorners(makeDefaultCorners(bw, bh));
    }
  }, [resetKey]);

  // Auto-advance
  useEffect(() => {
    if (!autoPlay || currentSlide.duration === 0) return;
    const timer = setTimeout(goNext, currentSlide.duration);
    return () => clearTimeout(timer);
  }, [slideIndex, autoPlay, currentSlide.duration, goNext]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        setGuideUIVisible((v) => !v);
      }
      if (e.code === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.code === "KeyP") {
        setAutoPlay((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  return (
    <div className="w-screen h-screen bg-black flex flex-col overflow-hidden select-none">
      {/* Guide mode: surface labels */}
      {guideUIVisible && (
        <>
          {/* Top surface label */}
          <div
            className="fixed z-[90] flex items-center gap-2 pointer-events-none"
            style={{ top: 8, left: "50%", transform: "translateX(-50%)" }}
          >
            <div
              className="px-3 py-1 rounded-full border"
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                letterSpacing: "0.15em",
                color: "rgba(255,100,100,0.7)",
                borderColor: "rgba(255,100,100,0.2)",
                background: "rgba(255,100,100,0.05)",
                backdropFilter: "blur(8px)",
              }}
            >
              ▲ TOP SURFACE — 20vh
            </div>
          </div>

          {/* Shared edge indicator */}
          <div
            className="fixed z-[90] w-full pointer-events-none"
            style={{ top: "20vh" }}
          >
            <div
              className="w-full"
              style={{
                height: 1,
                background: "linear-gradient(90deg, transparent, rgba(0,255,136,0.6) 20%, rgba(0,255,136,0.8) 50%, rgba(0,255,136,0.6) 80%, transparent)",
                boxShadow: "0 0 12px rgba(0,255,136,0.3)",
              }}
            />
            <div
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full"
              style={{
                top: 0,
                fontFamily: "monospace",
                fontSize: 9,
                letterSpacing: "0.2em",
                color: "rgba(0,255,136,0.8)",
                background: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(0,255,136,0.3)",
              }}
            >
              SHARED EDGE
            </div>
          </div>

          {/* Bottom surface label */}
          <div
            className="fixed z-[90] flex items-center gap-2 pointer-events-none"
            style={{ top: "calc(20vh + 12px)", left: "50%", transform: "translateX(-50%)" }}
          >
            <div
              className="px-3 py-1 rounded-full border"
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                letterSpacing: "0.15em",
                color: "rgba(100,150,255,0.7)",
                borderColor: "rgba(100,150,255,0.2)",
                background: "rgba(100,150,255,0.05)",
                backdropFilter: "blur(8px)",
              }}
            >
              ▼ BOTTOM SURFACE — 80vh
            </div>
          </div>

          {/* Guide border overlays */}
          <div
            className="fixed inset-x-0 top-0 z-[80] pointer-events-none"
            style={{
              height: "20vh",
              border: "1px solid rgba(255,100,100,0.15)",
              borderBottom: "none",
            }}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-[80] pointer-events-none"
            style={{
              height: "80vh",
              border: "1px solid rgba(100,150,255,0.15)",
              borderTop: "none",
            }}
          />

          {/* Crosshair center marks */}
          <div
            className="fixed z-[80] pointer-events-none"
            style={{
              top: "10vh",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div style={{ width: 20, height: 1, background: "rgba(255,100,100,0.2)" }} />
            <div style={{ width: 1, height: 20, background: "rgba(255,100,100,0.2)", position: "absolute", top: -10, left: 9.5 }} />
          </div>
          <div
            className="fixed z-[80] pointer-events-none"
            style={{
              top: "60vh",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div style={{ width: 20, height: 1, background: "rgba(100,150,255,0.2)" }} />
            <div style={{ width: 1, height: 20, background: "rgba(100,150,255,0.2)", position: "absolute", top: -10, left: 9.5 }} />
          </div>
        </>
      )}

      {/* Top surface - 20vh */}
      <div className="relative" style={{ height: "20vh" }}>
        <PerspectivePanel
          id="top"
          label="TOP SURFACE"
          guideUIVisible={guideUIVisible}
          corners={topCorners}
          onCornersChange={handleTopCornersChange}
          onSizeChange={handleTopSize}
        >
          <TopSurface
            slide={currentSlide}
            fontScale={fontScale}
            dpiScale={dpiScale}
            tickerSpeed={tickerSpeed}
          />
        </PerspectivePanel>
      </div>

      {/* Bottom surface - 80vh */}
      <div className="relative" style={{ height: "80vh" }}>
        <PerspectivePanel
          id="bottom"
          label="BOTTOM SURFACE"
          guideUIVisible={guideUIVisible}
          corners={bottomCorners}
          onCornersChange={handleBottomCornersChange}
          onSizeChange={handleBottomSize}
        >
          <BottomSurface
            slide={currentSlide}
            graphSlide={graphSlide}
            fontScale={fontScale}
            dpiScale={dpiScale}
          />
        </PerspectivePanel>
      </div>

      {/* Config mode UI */}
      {guideUIVisible && (
        <>
          {/* Render sliders */}
          <ConfigPanel
            fontScale={fontScale}
            setFontScale={setFontScale}
            dpiScale={dpiScale}
            setDpiScale={setDpiScale}
            tickerSpeed={tickerSpeed}
            setTickerSpeed={setTickerSpeed}
            graphSwapDelay={graphSwapDelay}
            setGraphSwapDelay={setGraphSwapDelay}
          />

          {/* Reset button */}
          <button
            onClick={() => setResetKey((k) => k + 1)}
            className="fixed bottom-4 left-4 z-[100] px-3 py-1.5 hover:bg-red-500/20 text-red-400 text-xs rounded border border-red-500/30"
            style={{ fontFamily: "monospace", backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.6)" }}
          >
            ↺ RESET CORNERS
          </button>

          {/* Slide controls */}
          <div
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 border rounded-lg px-4 py-2"
            style={{
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(12px)",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <button
              onClick={goPrev}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 text-xs rounded border border-white/10"
              style={{ fontFamily: "monospace" }}
            >
              ◀
            </button>

            {/* Slide indicators */}
            <div className="flex gap-2 items-center">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setSlideIndex(i)}
                  className="transition-all rounded-sm"
                  style={{
                    width: i === slideIndex ? 24 : 8,
                    height: 8,
                    background: i === slideIndex
                      ? "rgba(0,255,136,0.8)"
                      : "rgba(255,255,255,0.15)",
                    boxShadow: i === slideIndex ? "0 0 8px rgba(0,255,136,0.4)" : "none",
                  }}
                />
              ))}
            </div>

            <button
              onClick={goNext}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 text-xs rounded border border-white/10"
              style={{ fontFamily: "monospace" }}
            >
              ▶
            </button>

            <div className="w-px h-4 bg-white/10" />

            <button
              onClick={() => setAutoPlay((v) => !v)}
              className="px-3 py-1.5 text-xs rounded border"
              style={{
                fontFamily: "monospace",
                background: autoPlay ? "rgba(0,255,136,0.1)" : "rgba(255,255,255,0.05)",
                color: autoPlay ? "rgba(0,255,136,0.8)" : "rgba(255,255,255,0.35)",
                borderColor: autoPlay ? "rgba(0,255,136,0.25)" : "rgba(255,255,255,0.1)",
              }}
            >
              {autoPlay ? "● AUTO" : "○ PAUSED"}
            </button>

            <span
              className="text-white/25 text-xs tabular-nums"
              style={{ fontFamily: "monospace" }}
            >
              {slideIndex + 1}/{slides.length} — {currentSlide.id}
            </span>
          </div>

          {/* Keyboard hints */}
          <div
            className="fixed bottom-4 right-4 z-[100] flex flex-col gap-1 items-end"
            style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.2)" }}
          >
            <span>Ctrl+Space — toggle guide</span>
            <span>← → — prev / next</span>
            <span>P — play / pause</span>
          </div>
        </>
      )}
    </div>
  );
}
