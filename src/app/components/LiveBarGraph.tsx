import { useEffect, useRef, useState } from "react";
import type { MCQAnswer } from "./slideConfig";

interface Props {
  answers: MCQAnswer[];
  accentHue?: number;
  dpiScale?: number;
  fontScale?: number;
}

// HTML/CSS-based bar graph (projector variant). Mirrors LiveBarGraphRealtime
// but adds a gentle random-walk so the bars feel alive even before any votes.
export function LiveBarGraph({
  answers,
  accentHue = 180,
  fontScale = 1,
}: Props) {
  const votesRef = useRef<number[]>(answers.map((a) => a.votes));
  const targetRef = useRef<number[]>(answers.map((a) => a.votes));
  const [displayed, setDisplayed] = useState<number[]>(() => answers.map((a) => a.votes));

  // Reset when answers identity changes (slide change)
  useEffect(() => {
    votesRef.current = answers.map((a) => a.votes);
    targetRef.current = answers.map((a) => a.votes);
    setDisplayed(answers.map((a) => a.votes));
  }, [answers]);

  useEffect(() => {
    let raf = 0;
    let walkTimer = 0;
    const tick = (now: number) => {
      // Every ~600ms, nudge target votes for a "live" feel
      if (now - walkTimer > 600) {
        walkTimer = now;
        const v = votesRef.current;
        for (let i = 0; i < v.length; i++) {
          v[i] = Math.max(0, v[i] + (Math.random() - 0.4) * 1.5);
        }
        targetRef.current = [...v];
      }
      setDisplayed((prev) =>
        prev.map((p, i) => p + ((targetRef.current[i] ?? 0) - p) * 0.08)
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const total = displayed.reduce((s, v) => s + v, 0);
  const maxVotes = Math.max(1, ...displayed);

  return (
    <div
      className="absolute inset-0 flex items-end justify-center"
      style={{ padding: `${4 * fontScale}vh ${4 * fontScale}vw ${2 * fontScale}vh` }}
    >
      <div
        className="flex items-end justify-around w-full h-full"
        style={{ gap: `${2 * fontScale}vw`, paddingTop: `${7 * fontScale}vh` }}
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
              <div
                className="text-white/95 tabular-nums"
                style={{
                  fontFamily: "monospace",
                  fontSize: `${3.2 * fontScale}vh`,
                  fontWeight: 600,
                  marginBottom: `${0.8 * fontScale}vh`,
                  textShadow: "0 0 20px rgba(255,255,255,0.3)",
                  lineHeight: 1.3,
                  paddingTop: "0.15em",
                }}
              >
                {Math.round(pct)}%
              </div>

              <div
                className="w-full relative"
                style={{ flex: "1 1 0", display: "flex", alignItems: "flex-end", minHeight: 0 }}
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
