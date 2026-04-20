import { useRef, useEffect } from "react";
import type { MCQAnswer } from "./slideConfig";

interface Props {
  answers: MCQAnswer[];
  accentHue?: number;
  dpiScale?: number;
  fontScale?: number;
}

// Variant of LiveBarGraph that trusts `answers[i].votes` as the authoritative
// real-time value (no random-walk simulation). Still does smooth lerp display.
export function LiveBarGraphRealtime({
  answers,
  accentHue = 180,
  dpiScale = 1,
  fontScale = 1,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const displayRef = useRef<number[]>(answers.map((a) => a.votes));
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Resize displayRef if answer count changes (shouldn't — always 4)
  useEffect(() => {
    if (displayRef.current.length !== answers.length) {
      displayRef.current = answers.map((a) => a.votes);
    }
  }, [answers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    const dpr = dpiScale;

    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const animate = () => {
      if (!running) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w === 0 || h === 0) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      const currentAnswers = answersRef.current;
      // Lerp display values toward authoritative votes
      for (let i = 0; i < currentAnswers.length; i++) {
        const target = currentAnswers[i].votes;
        const cur = displayRef.current[i] ?? 0;
        displayRef.current[i] = cur + (target - cur) * 0.1;
      }

      ctx.clearRect(0, 0, w, h);

      const barCount = currentAnswers.length;
      const totalVotes = displayRef.current.reduce((s, v) => s + v, 0) || 1;
      const maxVotes = Math.max(...displayRef.current, 1);

      const padding = {
        top: 20 * fontScale,
        right: 30,
        bottom: 90 * fontScale,
        left: 30,
      };
      const chartWidth = w - padding.left - padding.right;
      const chartHeight = h - padding.top - padding.bottom;
      const gap = chartWidth * 0.06;
      const totalGaps = (barCount - 1) * gap;
      const barWidth = (chartWidth - totalGaps) / barCount;

      currentAnswers.forEach((answer, i) => {
        const displayVal = displayRef.current[i] ?? 0;
        const pct = displayVal / totalVotes;
        const barHeight = (displayVal / maxVotes) * chartHeight;
        const x = padding.left + i * (barWidth + gap);
        const y = h - padding.bottom - barHeight;

        const hueOffset = i * 25;
        const barHue = (accentHue + hueOffset) % 360;

        ctx.shadowColor = `hsla(${barHue}, 80%, 55%, 0.4)`;
        ctx.shadowBlur = 20;

        const grad = ctx.createLinearGradient(x, y, x, h - padding.bottom);
        grad.addColorStop(0, `hsla(${barHue}, 80%, 60%, 0.9)`);
        grad.addColorStop(1, `hsla(${barHue}, 70%, 35%, 0.7)`);
        ctx.fillStyle = grad;

        const radius = Math.min(12, barWidth * 0.15);
        ctx.beginPath();
        ctx.moveTo(x, h - padding.bottom);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.arcTo(x + barWidth, y, x + barWidth, y + radius, radius);
        ctx.lineTo(x + barWidth, h - padding.bottom);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;

        const pctText = `${Math.round(pct * 100)}%`;
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.font = `${16 * fontScale}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(pctText, x + barWidth / 2, y - 10 * fontScale);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = `${12 * fontScale}px monospace`;
        ctx.fillText(
          `${Math.round(displayVal)}`,
          x + barWidth / 2,
          Math.max(y + 20 * fontScale, h - padding.bottom - 10)
        );

        ctx.fillStyle = `hsla(${barHue}, 80%, 70%, 1)`;
        ctx.font = `bold ${28 * fontScale}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(
          answer.label,
          x + barWidth / 2,
          h - padding.bottom + 32 * fontScale
        );

        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = `${13 * fontScale}px monospace`;
        ctx.fillText(
          answer.text,
          x + barWidth / 2,
          h - padding.bottom + 54 * fontScale
        );
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
    };
  }, [accentHue, dpiScale, fontScale]);

  return (
    <div className="absolute inset-0 flex items-end p-4">
      <canvas ref={canvasRef} className="w-full h-[80%]" />
    </div>
  );
}
