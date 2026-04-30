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
  const total = answers.reduce((s, a) => s + a.votes, 0);
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
        {answers.map((answer, i) => {
          const pct = total > 0 ? (answer.votes / total) * 100 : 0;
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

        {answers.map((answer, i) => {
          const heightPct = total > 0 ? (answer.votes / total) * 100 : 0;
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
