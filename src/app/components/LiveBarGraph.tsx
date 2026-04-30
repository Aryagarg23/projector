import { useEffect, useRef, useState } from "react";
import type { MCQAnswer } from "./slideConfig";

interface Props {
  answers: MCQAnswer[];
  accentHue?: number;
  dpiScale?: number;
  fontScale?: number;
}

const HEAD_FONT = "'Archivo Black', 'Archivo', system-ui, sans-serif";
const BAR_MIN_VH = 6;

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
        padding: `${15 * fontScale}vh ${5 * fontScale}vw ${3 * fontScale}vh`,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: "auto 1fr auto auto",
          columnGap: `${3 * fontScale}vw`,
          rowGap: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {/* Row 1 — percentages */}
        {answers.map((answer, i) => {
          const displayVotes = displayed[i] ?? 0;
          const pct = total > 0 ? (displayVotes / total) * 100 : 0;
          return (
            <div
              key={`pct-${answer.label}`}
              className="text-white text-left tabular-nums uppercase"
              style={{
                gridColumn: i + 1,
                gridRow: 1,
                fontFamily: HEAD_FONT,
                fontSize: `${5.5 * fontScale}vh`,
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                textShadow: "0 2px 18px rgba(0,0,0,0.35)",
                paddingBottom: `${1 * fontScale}vh`,
              }}
            >
              {Math.round(pct)}%
            </div>
          );
        })}

        {/* Row 2 — bars */}
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

        {/* Row 3 — letters */}
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

        {/* Row 4 — option text */}
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
