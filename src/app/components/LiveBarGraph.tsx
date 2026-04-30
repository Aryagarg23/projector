import { useEffect, useRef, useState } from "react";
import type { MCQAnswer } from "./slideConfig";

interface Props {
  answers: MCQAnswer[];
  accentHue?: number;
  dpiScale?: number;
  fontScale?: number;
}

const HEAD_FONT = "'Archivo Black', 'Archivo', system-ui, sans-serif";

export function LiveBarGraph({
  answers,
  accentHue = 180,
  fontScale = 1,
}: Props) {
  const votesRef = useRef<number[]>(answers.map((a) => a.votes));
  const targetRef = useRef<number[]>(answers.map((a) => a.votes));
  const [displayed, setDisplayed] = useState<number[]>(() => answers.map((a) => a.votes));

  useEffect(() => {
    votesRef.current = answers.map((a) => a.votes);
    targetRef.current = answers.map((a) => a.votes);
    setDisplayed(answers.map((a) => a.votes));
  }, [answers]);

  useEffect(() => {
    let raf = 0;
    let walkTimer = 0;
    const tick = (now: number) => {
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
  const cols = answers.length;

  return (
    <div
      className="absolute inset-0"
      style={{
        padding: `${14 * fontScale}vh ${4 * fontScale}vw ${2 * fontScale}vh`,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: "1fr auto auto",
          columnGap: `${2 * fontScale}vw`,
          rowGap: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {/* Row 1 — bars */}
        {answers.map((answer, i) => {
          const displayVotes = displayed[i] ?? 0;
          const heightPct = (displayVotes / maxVotes) * 100;
          const pct = total > 0 ? (displayVotes / total) * 100 : 0;
          const hue = (accentHue + i * 25) % 360;
          const barColorTop = `hsl(${hue}, 80%, 62%)`;
          const barColorBot = `hsl(${hue}, 70%, 38%)`;
          return (
            <div
              key={`bar-${answer.label}`}
              style={{
                gridColumn: i + 1,
                gridRow: 1,
                display: "flex",
                alignItems: "flex-end",
                minHeight: 0,
              }}
            >
              <div
                className="w-full rounded-t-lg relative"
                style={{
                  height: `${heightPct}%`,
                  background: `linear-gradient(to top, ${barColorBot}, ${barColorTop})`,
                  boxShadow: `0 0 30px hsla(${hue}, 80%, 55%, 0.45), inset 0 1px 0 rgba(255,255,255,0.2)`,
                  transition: "height 0.4s cubic-bezier(.2,.7,.2,1)",
                  minHeight: heightPct > 0 ? "2px" : "0",
                }}
              >
                <div
                  className="absolute left-0 right-0 text-center uppercase tabular-nums text-white"
                  style={{
                    top: `${1.2 * fontScale}vh`,
                    fontFamily: HEAD_FONT,
                    fontSize: `${4 * fontScale}vh`,
                    fontWeight: 900,
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                    textShadow: "0 2px 12px rgba(0,0,0,0.4)",
                  }}
                >
                  {Math.round(pct)}%
                </div>
              </div>
            </div>
          );
        })}

        {/* Row 2 — letter labels */}
        {answers.map((answer, i) => {
          const hue = (accentHue + i * 25) % 360;
          const labelColor = `hsl(${hue}, 80%, 75%)`;
          return (
            <div
              key={`label-${answer.label}`}
              className="uppercase text-left"
              style={{
                gridColumn: i + 1,
                gridRow: 2,
                fontFamily: HEAD_FONT,
                fontSize: `${4.5 * fontScale}vh`,
                fontWeight: 900,
                color: labelColor,
                marginTop: `${1.2 * fontScale}vh`,
                lineHeight: 1,
                letterSpacing: "-0.01em",
              }}
            >
              {answer.label}
            </div>
          );
        })}

        {/* Row 3 — option text (auto row stretches to tallest item) */}
        {answers.map((answer, i) => (
          <div
            key={`text-${answer.label}`}
            className="text-white uppercase text-left"
            style={{
              gridColumn: i + 1,
              gridRow: 3,
              fontFamily: HEAD_FONT,
              fontSize: `${2.4 * fontScale}vh`,
              fontWeight: 900,
              marginTop: `${0.6 * fontScale}vh`,
              lineHeight: 1.15,
              maxWidth: "100%",
              overflowWrap: "break-word",
              hyphens: "auto",
              letterSpacing: "-0.005em",
            }}
          >
            {answer.text}
          </div>
        ))}
      </div>
    </div>
  );
}
