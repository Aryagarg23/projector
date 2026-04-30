import { useEffect, useRef, useState } from "react";
import type { MCQAnswer } from "./slideConfig";

interface Props {
  answers: MCQAnswer[];
  accentHue?: number;
  dpiScale?: number;
  fontScale?: number;
}

const HEAD_FONT = "'Archivo Black', 'Archivo', system-ui, sans-serif";

export function LiveBarGraphRealtime({
  answers,
  accentHue = 180,
  fontScale = 1,
}: Props) {
  const total = answers.reduce((s, a) => s + a.votes, 0);
  const maxVotes = Math.max(1, ...answers.map((a) => a.votes));

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
        const settled = next.every((v, i) => Math.abs((targetRef.current[i] ?? 0) - v) < 0.05);
        if (!settled) raf = requestAnimationFrame(tick);
        return next;
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [answers]);

  const cols = answers.length;

  return (
    <div
      className="absolute inset-0"
      style={{
        // Top padding reserves a clear band for the HeroOverlay above. Bars
        // never reach into that band even at 100%.
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
        {/* Row 1 — bars (all share the same 1fr row, so they all share a baseline) */}
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

        {/* Row 2 — letter labels (auto row sizes to content; same height for all) */}
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

        {/* Row 3 — option text (auto row stretches to tallest item across cols) */}
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
