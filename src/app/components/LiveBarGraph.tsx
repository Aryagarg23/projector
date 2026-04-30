import { useRef, useEffect, useState } from "react";
import type { MCQAnswer } from "./slideConfig";

interface Props {
  answers: MCQAnswer[];
  accentHue?: number;
  dpiScale?: number;
  fontScale?: number;
}

export function LiveBarGraph({
  answers,
  accentHue = 180,
  dpiScale = 1,
  fontScale = 1,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const votesRef = useRef<number[]>(answers.map((a) => a.votes));
  const displayRef = useRef<number[]>(answers.map((a) => a.votes));
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reset votes when answers change (slide change)
  useEffect(() => {
    votesRef.current = answers.map((a) => a.votes);
    displayRef.current = answers.map((a) => a.votes);
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

    // Simulate incoming websocket votes every 120ms
    const voteInterval = setInterval(() => {
      const currentAnswers = answersRef.current;
      votesRef.current = votesRef.current.map((v, i) => {
        // Random walk simulating live votes coming in
        const delta = Math.random() < 0.3 ? Math.floor(Math.random() * 4) : 0;
        return Math.max(currentAnswers[i].votes * 0.3, v + delta);
      });
    }, 120);

    const animate = () => {
      if (!running) return;

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w === 0 || h === 0) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Smooth lerp display values toward actual votes
      for (let i = 0; i < displayRef.current.length; i++) {
        displayRef.current[i] +=
          (votesRef.current[i] - displayRef.current[i]) * 0.08;
      }

      ctx.clearRect(0, 0, w, h);

      const currentAnswers = answersRef.current;
      const barCount = currentAnswers.length; // Always 4
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

      // Draw bars
      currentAnswers.forEach((answer, i) => {
        const displayVal = displayRef.current[i] ?? 0;
        const pct = displayVal / totalVotes;
        const barHeight = (displayVal / maxVotes) * chartHeight;
        const x = padding.left + i * (barWidth + gap);
        const y = h - padding.bottom - barHeight;

        // Per-answer color: spread across hue range
        const hueOffset = i * 25;
        const barHue = (accentHue + hueOffset) % 360;

        // Bar glow
        ctx.shadowColor = `hsla(${barHue}, 80%, 55%, 0.4)`;
        ctx.shadowBlur = 20;

        // Bar fill
        const grad = ctx.createLinearGradient(x, y, x, h - padding.bottom);
        grad.addColorStop(0, `hsla(${barHue}, 80%, 60%, 0.9)`);
        grad.addColorStop(1, `hsla(${barHue}, 70%, 35%, 0.7)`);
        ctx.fillStyle = grad;

        // Rounded top
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

        // Reset shadow
        ctx.shadowBlur = 0;

        // Percentage on top of bar
        const pctText = `${Math.round(pct * 100)}%`;
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.font = `${16 * fontScale}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(pctText, x + barWidth / 2, y - 10 * fontScale);

        // Vote count inside bar
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = `${12 * fontScale}px monospace`;
        ctx.fillText(
          `${Math.round(displayVal)}`,
          x + barWidth / 2,
          Math.max(y + 20 * fontScale, h - padding.bottom - 10)
        );

        // Answer label below bar (big letter)
        ctx.fillStyle = `hsla(${barHue}, 80%, 70%, 1)`;
        ctx.font = `bold ${28 * fontScale}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(
          answer.label,
          x + barWidth / 2,
          h - padding.bottom + 32 * fontScale
        );

        // Answer text below letter
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
      clearInterval(voteInterval);
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
    };
  }, [accentHue, dpiScale, fontScale]);

  const chartH = Math.floor(size.h * 0.8);

  return (
    <div ref={containerRef} className="absolute inset-0 flex items-end p-4">
      {size.w > 0 && size.h > 0 && (
        <canvas
          ref={canvasRef}
          style={{ display: "block", width: `${size.w - 32}px`, height: `${chartH}px` }}
        />
      )}
    </div>
  );
}
