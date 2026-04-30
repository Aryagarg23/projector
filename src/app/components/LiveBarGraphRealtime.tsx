import { useEffect, useRef, useState } from "react";
import type { MCQAnswer } from "./slideConfig";

interface Props {
  answers: MCQAnswer[];
  accentHue?: number;
  dpiScale?: number;
  fontScale?: number;
}

// HTML/CSS-based bar graph. CSS transitions handle the smooth growth so we
// don't need a per-frame rAF loop. Percentages are positioned outside the bar
// area so they never clip, and the option label stays large/readable.
export function LiveBarGraphRealtime({
  answers,
  accentHue = 180,
  fontScale = 1,
}: Props) {
  const total = answers.reduce((s, a) => s + a.votes, 0);
  const maxVotes = Math.max(1, ...answers.map((a) => a.votes));

  // Display-side smoothing: lerp from previous values toward current votes
  // so bars don't jump when counts arrive.
  const [displayed, setDisplayed] = useState<number[]>(() => answers.map((a) => a.votes));
  const targetRef = useRef<number[]>(answers.map((a) => a.votes));
  targetRef.current = answers.map((a) => a.votes);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setDisplayed((prev) => {
        const next = prev.map((v, i) => {
          const t = targetRef.current[i] ?? 0;
          return v + (t - v) * 0.12;
        });
        // Stop animating when we're within 0.05 of all targets
        const settled = next.every((v, i) => Math.abs((targetRef.current[i] ?? 0) - v) < 0.05);
        if (!settled) raf = requestAnimationFrame(tick);
        return next;
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [answers]);

  return (
    <div
      className="absolute inset-0 flex items-end justify-center"
      style={{ padding: `${4 * fontScale}vh ${4 * fontScale}vw ${2 * fontScale}vh` }}
    >
      <div
        className="flex items-end justify-around w-full h-full"
        style={{ gap: `${2 * fontScale}vw`, paddingTop: `${5 * fontScale}vh` }}
      >
        {answers.map((answer, i) => {
          const displayVotes = displayed[i] ?? 0;
          const pct = total > 0 ? (displayVotes / total) * 100 : 0;
          const heightPct = (displayVotes / maxVotes) * 100;
          const hue = (accentHue + i * 25) % 360;
          const barColorTop = `hsl(${hue}, 80%, 62%)`;
          const barColorBot = `hsl(${hue}, 70%, 38%)`;
          const labelColor = `hsl(${hue}, 80%, 72%)`;

          return (
            <div
              key={answer.label}
              className="flex flex-col items-center justify-end h-full"
              style={{ flex: "1 1 0", minWidth: 0 }}
            >
              {/* Percentage — sits ABOVE the bar, never clips */}
              <div
                className="text-white/95 tabular-nums"
                style={{
                  fontFamily: "monospace",
                  fontSize: `${3.2 * fontScale}vh`,
                  fontWeight: 600,
                  marginBottom: `${0.8 * fontScale}vh`,
                  textShadow: "0 0 20px rgba(255,255,255,0.3)",
                  lineHeight: 1,
                }}
              >
                {Math.round(pct)}%
              </div>

              {/* Bar — flex-grows to fill, animated via CSS */}
              <div
                className="w-full relative"
                style={{
                  flex: "1 1 0",
                  display: "flex",
                  alignItems: "flex-end",
                  minHeight: 0,
                }}
              >
                <div
                  className="w-full rounded-t-lg"
                  style={{
                    height: `${heightPct}%`,
                    background: `linear-gradient(to top, ${barColorBot}, ${barColorTop})`,
                    boxShadow: `0 0 30px hsla(${hue}, 80%, 55%, 0.45), inset 0 1px 0 rgba(255,255,255,0.2)`,
                    transition: "height 0.4s cubic-bezier(.2,.7,.2,1)",
                    minHeight: heightPct > 0 ? "2px" : "0",
                  }}
                />
              </div>

              {/* Letter label — large and bold, primary visual anchor */}
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: `${4.2 * fontScale}vh`,
                  fontWeight: 700,
                  color: labelColor,
                  marginTop: `${1.2 * fontScale}vh`,
                  lineHeight: 1,
                  letterSpacing: "0.02em",
                }}
              >
                {answer.label}
              </div>

              {/* Option text — readable, multiline-safe */}
              <div
                className="text-white/80 text-center"
                style={{
                  fontFamily: "monospace",
                  fontSize: `${1.6 * fontScale}vh`,
                  marginTop: `${0.6 * fontScale}vh`,
                  lineHeight: 1.2,
                  maxWidth: "100%",
                  overflowWrap: "break-word",
                  hyphens: "auto",
                }}
              >
                {answer.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
