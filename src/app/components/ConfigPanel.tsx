import { renderSliderRanges } from "./slideConfig";

interface Props {
  fontScale: number;
  setFontScale: (v: number) => void;
  dpiScale: number;
  setDpiScale: (v: number) => void;
  tickerSpeed: number;
  setTickerSpeed: (v: number) => void;
  graphSwapDelay: number;
  setGraphSwapDelay: (v: number) => void;
}

export function ConfigPanel({
  fontScale,
  setFontScale,
  dpiScale,
  setDpiScale,
  tickerSpeed,
  setTickerSpeed,
  graphSwapDelay,
  setGraphSwapDelay,
}: Props) {
  return (
    <div className="fixed top-4 left-4 z-[100] bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg p-4 w-64 space-y-4">
      <h3
        className="text-white/70 tracking-widest text-xs"
        style={{ fontFamily: "monospace" }}
      >
        RENDER CONFIG
      </h3>

      {/* Font Size Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label
            className="text-white/50 text-xs"
            style={{ fontFamily: "monospace" }}
          >
            FONT SCALE
          </label>
          <span
            className="text-white/80 text-xs tabular-nums"
            style={{ fontFamily: "monospace" }}
          >
            {fontScale.toFixed(2)}x
          </span>
        </div>
        <input
          type="range"
          min={renderSliderRanges.fontScale.min}
          max={renderSliderRanges.fontScale.max}
          step={renderSliderRanges.fontScale.step}
          value={fontScale}
          onChange={(e) => setFontScale(parseFloat(e.target.value))}
          className="w-full h-1.5 appearance-none bg-white/10 rounded-full outline-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing"
        />
        <div
          className="flex justify-between text-white/20 text-[9px]"
          style={{ fontFamily: "monospace" }}
        >
          <span>{renderSliderRanges.fontScale.min}x</span>
          <span>{renderSliderRanges.fontScale.max}x</span>
        </div>
      </div>

      {/* DPI / Resolution Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label
            className="text-white/50 text-xs"
            style={{ fontFamily: "monospace" }}
          >
            DPI / RESOLUTION
          </label>
          <span
            className="text-white/80 text-xs tabular-nums"
            style={{ fontFamily: "monospace" }}
          >
            {dpiScale.toFixed(2)}x
          </span>
        </div>
        <input
          type="range"
          min={renderSliderRanges.dpiScale.min}
          max={renderSliderRanges.dpiScale.max}
          step={renderSliderRanges.dpiScale.step}
          value={dpiScale}
          onChange={(e) => setDpiScale(parseFloat(e.target.value))}
          className="w-full h-1.5 appearance-none bg-white/10 rounded-full outline-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing"
        />
        <div
          className="flex justify-between text-white/20 text-[9px]"
          style={{ fontFamily: "monospace" }}
        >
          <span>{renderSliderRanges.dpiScale.min}x (fast)</span>
          <span>{renderSliderRanges.dpiScale.max}x (crisp)</span>
        </div>
      </div>

      {/* Ticker Scroll Speed Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label
            className="text-white/50 text-xs"
            style={{ fontFamily: "monospace" }}
          >
            TICKER SPEED
          </label>
          <span
            className="text-white/80 text-xs tabular-nums"
            style={{ fontFamily: "monospace" }}
          >
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
        <div
          className="flex justify-between text-white/20 text-[9px]"
          style={{ fontFamily: "monospace" }}
        >
          <span>{renderSliderRanges.tickerSpeed.min}s (fast)</span>
          <span>{renderSliderRanges.tickerSpeed.max}s (slow)</span>
        </div>
      </div>

      {/* Graph Swap Delay Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label
            className="text-white/50 text-xs"
            style={{ fontFamily: "monospace" }}
          >
            GRAPH SWAP DELAY
          </label>
          <span
            className="text-white/80 text-xs tabular-nums"
            style={{ fontFamily: "monospace" }}
          >
            {graphSwapDelay.toFixed(0)}s
          </span>
        </div>
        <input
          type="range"
          min={renderSliderRanges.graphSwapDelay.min}
          max={renderSliderRanges.graphSwapDelay.max}
          step={renderSliderRanges.graphSwapDelay.step}
          value={graphSwapDelay}
          onChange={(e) => setGraphSwapDelay(parseFloat(e.target.value))}
          className="w-full h-1.5 appearance-none bg-white/10 rounded-full outline-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing"
        />
        <div
          className="flex justify-between text-white/20 text-[9px]"
          style={{ fontFamily: "monospace" }}
        >
          <span>{renderSliderRanges.graphSwapDelay.min}s</span>
          <span>{renderSliderRanges.graphSwapDelay.max}s</span>
        </div>
      </div>

      <div
        className="text-white/20 text-[9px] border-t border-white/5 pt-2"
        style={{ fontFamily: "monospace" }}
      >
        Ctrl+Space to hide config
      </div>
    </div>
  );
}