import { useEffect, useRef, useState } from "react";
import type { MCQAnswer } from "./slideConfig";

interface Props {
  answers: MCQAnswer[];
  accentHue?: number;
  dpiScale?: number;
  fontScale?: number;
}

const HEAD_FONT = "'Archivo Black', 'Archivo', system-ui, sans-serif";

// Minimum visible bar height (in vh) so the chart still reads as a chart
// even when all votes are 0. Real values scale proportionally above this floor.
const BAR_MIN_VH = 6;

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
        // Reserve a clear band for the HeroOverlay above. Bars never reach into it.
        padding: `${15 * fontScale}vh ${5 * fontScale}vw ${3 * fontScale}vh`,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          // Row 1: percentage (auto, sized to text)
          // Row 2: bar (1fr, fills remaining space)
          // Row 3: letter (auto)
          // Row 4: option text (auto, stretches across cols to tallest)
          gridTemplateRows: "auto 1fr auto auto",
          columnGap: `${3 * fontScale}vw`,
          rowGap: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {/* ─── ROW 1 — Percentage labels (primary data, biggest type) ─── */}
        {answers.map((answer, i) => {
          const displayVotes = displayed[i] ?? 0;
          const pct = total > 0 ? (displayVotes / total) * 100 : 0;
          return (
            <div
              key={`pct-${answer.label}`}
              className="text-white/55 text-left tabular-nums"
              style={{
                gridColumn: i + 1,
                gridRow: 1,
                fontFamily: "'Archivo', system-ui, sans-serif",
                fontSize: `${1.8 * fontScale}vh`,
                fontWeight: 500,
                lineHeight: 1.2,
                letterSpacing: "0.02em",
                paddingBottom: `${0.6 * fontScale}vh`,
              }}
            >
              {Math.round(pct)}%
            </div>
          );
        })}

        {/* ─── ROW 2 — Bars (always visible via min-height floor) ─── */}
        {answers.map((answer, i) => {
          const displayVotes = displayed[i] ?? 0;
          const heightPct = (displayVotes / maxVotes) * 100;
          const hue = (accentHue + i * 25) % 360;
          const barColorTop = `hsl(${hue}, 80%, 62%)`;
          const barColorBot = `hsl(${hue}, 70%, 38%)`;
          return (
            <div
              key={`bar-${answer.label}`}
              style={{
                gridColumn: i + 1,
                gridRow: 2,
                display: "flex",
                alignItems: "flex-end",
                minHeight: 0,
              }}
            >
              <div
                className="w-full rounded-t-xl"
                style={{
                  height: `${heightPct}%`,
                  minHeight: `${BAR_MIN_VH * fontScale}vh`,
                  background: `linear-gradient(to top, ${barColorBot}, ${barColorTop})`,
                  boxShadow: `0 0 40px hsla(${hue}, 80%, 55%, 0.4), inset 0 1px 0 rgba(255,255,255,0.18)`,
                  transition: "height 0.45s cubic-bezier(.2,.7,.2,1)",
                }}
              />
            </div>
          );
        })}

        {/* ─── ROW 3 — Letter labels (accent-tinted anchor) ─── */}
        {answers.map((answer, i) => {
          const hue = (accentHue + i * 25) % 360;
          const labelColor = `hsl(${hue}, 80%, 72%)`;
          return (
            <div
              key={`label-${answer.label}`}
              className="uppercase text-left"
              style={{
                gridColumn: i + 1,
                gridRow: 3,
                fontFamily: HEAD_FONT,
                fontSize: `${3.6 * fontScale}vh`,
                fontWeight: 900,
                color: labelColor,
                marginTop: `${1.4 * fontScale}vh`,
                lineHeight: 1,
                letterSpacing: "-0.01em",
              }}
            >
              {answer.label}
            </div>
          );
        })}

        {/* ─── ROW 4 — Option text (auto row stretches to tallest item) ─── */}
        {answers.map((answer, i) => (
          <div
            key={`text-${answer.label}`}
            className="text-white/90 uppercase text-left"
            style={{
              gridColumn: i + 1,
              gridRow: 4,
              fontFamily: HEAD_FONT,
              fontSize: `${2.2 * fontScale}vh`,
              fontWeight: 900,
              marginTop: `${0.5 * fontScale}vh`,
              lineHeight: 1.2,
              maxWidth: "100%",
              overflowWrap: "break-word",
              hyphens: "auto",
              letterSpacing: "0",
            }}
          >
            {answer.text}
          </div>
        ))}
      </div>
    </div>
  );
}
