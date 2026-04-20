import { useRef, useEffect } from "react";
import type { GradientConfig } from "./slideConfig";

interface Props {
  config: GradientConfig;
  dpiScale?: number;
}

// Curated palette: red, blue, deep orange, vibrant purple.
// Numbers are HSL hue degrees.
const PALETTE_HUES = [
  355, // red
  218, // blue
  20,  // deep orange
  282, // vibrant purple
];

// Pick a palette hue near a target, blending with index to get variety.
function paletteHue(base: number, idx: number): number {
  const pick = PALETTE_HUES[
    (Math.floor(base / 90) + idx) % PALETTE_HUES.length
  ];
  return pick;
}

export function GrainyGradient({ config, dpiScale = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const configRef = useRef(config);
  configRef.current = config;
  const dpiRef = useRef(dpiScale);
  dpiRef.current = dpiScale;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let running = true;
    let time = 0;

    // Flowing ribbon trails — each ribbon is a long tail of points that
    // move through a slow-evolving flow field, rendered as a fading stroke.
    interface TrailPoint {
      x: number;
      y: number;
    }
    interface Ribbon {
      points: TrailPoint[];
      x: number;
      y: number;
      vx: number;
      vy: number;
      hue: number;
      width: number;
      life: number;
      maxLife: number;
      maxPoints: number;
    }
    let ribbons: Ribbon[] = [];

    const resize = () => {
      const dpr = dpiRef.current;
      canvas.width = Math.floor(canvas.offsetWidth * dpr);
      canvas.height = Math.floor(canvas.offsetHeight * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function makeRibbon(w: number, h: number, baseHue: number, idx: number): Ribbon {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 1.6;
      return {
        points: [],
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        hue: paletteHue(baseHue, idx),
        width: 0.8 + Math.random() * 2.2,
        life: 0,
        maxLife: 220 + Math.random() * 280,
        maxPoints: 80 + Math.floor(Math.random() * 80),
      };
    }

    const animate = () => {
      if (!running) return;
      const cfg = configRef.current;
      time += cfg.animSpeed;
      const { width: cw, height: ch } = canvas;
      const dpr = dpiRef.current;
      const w = cw / dpr;
      const h = ch / dpr;
      if (w === 0 || h === 0) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const sat = cfg.saturation;
      const lit = cfg.lightness;

      // Base gradient layers — palette-driven, not a rotating hue wheel
      for (let layer = 0; layer < cfg.layers; layer++) {
        const phase = layer * 1.7;
        const gx = Math.sin(time + phase) * w * 0.3 + w * 0.5;
        const gy = Math.cos(time * 0.7 + phase) * h * 0.3 + h * 0.5;

        const hueA = paletteHue(cfg.baseHue, layer);
        const hueB = paletteHue(cfg.baseHue, layer + 1);

        const grad = ctx.createRadialGradient(
          gx,
          gy,
          0,
          gx,
          gy,
          w * (0.6 + layer * 0.12)
        );
        const alpha = layer === 0 ? 1 : 0.4;
        grad.addColorStop(0, `hsla(${hueA}, ${sat}%, ${lit + 12}%, ${alpha})`);
        grad.addColorStop(
          0.55,
          `hsla(${hueB}, ${sat - 8}%, ${lit + 2}%, ${alpha * 0.75})`
        );
        grad.addColorStop(
          1,
          layer === 0
            ? `hsla(${hueB}, ${sat - 18}%, ${Math.max(lit - 6, 2)}%, 1)`
            : "transparent"
        );
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // Ribbon count — reuse the `particles` slider but interpret as ribbons.
      // Scale down since ribbons are much heavier per unit than dots.
      const targetCount = Math.max(6, Math.round(cfg.particles * 0.35));
      while (ribbons.length < targetCount) {
        ribbons.push(makeRibbon(w, h, cfg.baseHue, ribbons.length));
      }
      if (ribbons.length > targetCount) {
        ribbons = ribbons.slice(0, targetCount);
      }

      // Step + draw each ribbon
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = ribbons.length - 1; i >= 0; i--) {
        const r = ribbons[i];

        // Flow-field advection: smooth curl via layered sin/cos
        const fx = r.x * 0.0035;
        const fy = r.y * 0.0035;
        const t = time * 1.2;
        const angle =
          (Math.sin(fx + t) + Math.cos(fy * 1.3 - t * 0.7)) * Math.PI;
        r.vx += Math.cos(angle) * 0.22;
        r.vy += Math.sin(angle) * 0.22;
        // damping keeps speeds bounded + flowy
        r.vx *= 0.93;
        r.vy *= 0.93;
        r.x += r.vx;
        r.y += r.vy;
        r.life++;

        // Append head to trail
        r.points.push({ x: r.x, y: r.y });
        if (r.points.length > r.maxPoints) r.points.shift();

        // Respawn if dead or far off-screen
        const off =
          r.x < -40 || r.x > w + 40 || r.y < -40 || r.y > h + 40;
        if (r.life > r.maxLife || (off && r.points.length < 4)) {
          ribbons[i] = makeRibbon(w, h, cfg.baseHue, i);
          continue;
        }

        // Render ribbon as a series of tapered segments with fading alpha
        const pts = r.points;
        if (pts.length < 2) continue;

        const lifeFade =
          r.life < 40
            ? r.life / 40
            : r.life > r.maxLife - 40
            ? Math.max(0, (r.maxLife - r.life) / 40)
            : 1;

        for (let j = 1; j < pts.length; j++) {
          const t01 = j / pts.length; // 0 = tail, 1 = head
          const segAlpha = Math.pow(t01, 1.4) * 0.85 * lifeFade;
          const segWidth = r.width * (0.25 + t01 * 1.0);

          ctx.strokeStyle = `hsla(${r.hue}, ${Math.min(
            sat + 15,
            95
          )}%, ${Math.min(lit + 45, 72)}%, ${segAlpha})`;
          ctx.lineWidth = segWidth;
          ctx.beginPath();
          ctx.moveTo(pts[j - 1].x, pts[j - 1].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }

        // Bright head glow
        const head = pts[pts.length - 1];
        const glow = ctx.createRadialGradient(
          head.x,
          head.y,
          0,
          head.x,
          head.y,
          r.width * 6
        );
        glow.addColorStop(
          0,
          `hsla(${r.hue}, 95%, 75%, ${0.55 * lifeFade})`
        );
        glow.addColorStop(1, `hsla(${r.hue}, 95%, 60%, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(head.x, head.y, r.width * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Grain overlay
      const grainAmt = cfg.grainIntensity;
      if (grainAmt > 0) {
        const imageData = ctx.getImageData(0, 0, cw, ch);
        const data = imageData.data;
        const strength = grainAmt * 0.8;
        const step = w > 800 ? 8 : 4;
        for (let i = 0; i < data.length; i += step) {
          const noise = (Math.random() - 0.5) * strength;
          data[i] += noise;
          data[i + 1] += noise;
          data[i + 2] += noise;
        }
        ctx.putImageData(imageData, 0, 0);
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
  );
}
