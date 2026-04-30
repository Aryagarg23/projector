import { useRef, useEffect } from "react";
import type { GradientConfig } from "./slideConfig";

interface Props {
  config: GradientConfig;
  dpiScale?: number;
}

// Smooth noise via value noise (p5.js-style simplex approximation using
// summed sinusoids — visually identical to Perlin at this resolution).
function smoothNoise(x: number, y: number, t: number): number {
  return (
    Math.sin(x * 1.7 + t * 0.9) * Math.cos(y * 1.3 - t * 0.6) * 0.5 +
    Math.sin(x * 0.8 - y * 1.1 + t * 1.2) * 0.3 +
    Math.cos(x * 2.3 + y * 0.7 - t * 0.4) * 0.2
  );
}

// Curated palette matching the slide hues: teal-to-violet iridescent range.
// Each entry is [hueShift, satBoost] applied on top of config.baseHue.
const PALETTE: [number, number][] = [
  [0,   0],
  [40, 15],
  [-30, 10],
  [70, -5],
  [-60, 20],
];

function meshHue(base: number, nx: number, ny: number, t: number, layer: number): number {
  const n = smoothNoise(nx, ny, t + layer * 2.1);
  const [shift, _] = PALETTE[layer % PALETTE.length];
  return ((base + shift + n * 55 + 360) % 360);
}

function meshSat(baseSat: number, nx: number, ny: number, t: number): number {
  const n = smoothNoise(nx * 1.4, ny * 0.9, t * 0.5);
  return Math.min(95, Math.max(40, baseSat + n * 18));
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

    // ── Flowing ribbons (kept from before) ──────────────────────────────────
    interface TrailPoint { x: number; y: number }
    interface Ribbon {
      points: TrailPoint[];
      x: number; y: number;
      vx: number; vy: number;
      hue: number; width: number;
      life: number; maxLife: number; maxPoints: number;
    }
    let ribbons: Ribbon[] = [];

    // ── Droplet ripples ──────────────────────────────────────────────────────
    interface Ripple {
      x: number; y: number;
      radius: number; maxRadius: number;
      life: number; maxLife: number;
      hue: number; rings: number;
    }
    let ripples: Ripple[] = [];
    let nextRipple = 0;

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
      const speed = 1.0 + Math.random() * 1.4;
      const [shift] = PALETTE[idx % PALETTE.length];
      return {
        points: [],
        x: Math.random() * w, y: Math.random() * h,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        hue: ((baseHue + shift + 360) % 360),
        width: 0.7 + Math.random() * 2.0,
        life: 0,
        maxLife: 200 + Math.random() * 260,
        maxPoints: 70 + Math.floor(Math.random() * 90),
      };
    }

    function makeRipple(w: number, h: number, baseHue: number): Ripple {
      const [shift] = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        radius: 0,
        maxRadius: 60 + Math.random() * 140,
        life: 0,
        maxLife: 90 + Math.random() * 80,
        hue: ((baseHue + shift + 360) % 360),
        rings: 2 + Math.floor(Math.random() * 3),
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

      // ── Iridescent mesh gradient background (p5 noise-field style) ─────────
      // Build from large overlapping radial blobs placed at noise-driven positions.
      const blobCount = cfg.layers + 10;
      for (let b = 0; b < blobCount; b++) {
        const phase = b * 2.39996; // golden angle spread
        const nx = Math.sin(time * 0.7 + phase) * 0.38 + 0.5;
        const ny = Math.cos(time * 0.5 + phase * 1.3) + 0.5;
        const gx = nx * w;
        const gy = ((ny % 1 + 1) % 1) * h;
        const radius = w * (0.55 + b * 0.08);

        const hueA = meshHue(cfg.baseHue, nx, ny * 0.5, time, b);
        const hueB = meshHue(cfg.baseHue, nx * 0.6, ny, time, b + 1);
        const satA = meshSat(sat, nx, ny, time);

        const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius);
        const alpha = b === 0 ? 1 : 0.38;
        grad.addColorStop(0,   `hsla(${hueA}, ${satA}%, ${lit + 22}%, ${alpha})`);
        grad.addColorStop(0.5, `hsla(${hueB}, ${satA}%, ${lit + 8}%, ${alpha * 0.8})`);
        grad.addColorStop(1,   b === 0
          ? `hsla(${hueB}, ${satA}%, ${Math.max(lit - 2, 4)}%, 1)`
          : `hsla(${hueA}, ${satA}%, ${lit}%, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // Thin color-shift overlay driven by noise field — gives iridescent shimmer
      const shimmerRes = 10;
      const tileW = w / shimmerRes;
      const tileH = h / shimmerRes;
      for (let gx2 = 0; gx2 < shimmerRes; gx2++) {
        for (let gy2 = 0; gy2 < shimmerRes; gy2++) {
          const nx = gx2 / shimmerRes;
          const ny = gy2 / shimmerRes;
          const n = smoothNoise(nx * 3, ny * 3, time * 0.8);
          const hShim = ((cfg.baseHue + n * 80 + 360) % 360);
          const aShim = Math.abs(n) * 0.06;
          ctx.fillStyle = `hsla(${hShim}, ${sat + 20}%, ${lit + 25}%, ${aShim})`;
          ctx.fillRect(gx2 * tileW, gy2 * tileH, tileW + 1, tileH + 1);
        }
      }

      // ── Ribbons ──────────────────────────────────────────────────────────────
      const targetRibbons = Math.max(12, Math.round(cfg.particles * 0.6));
      while (ribbons.length < targetRibbons)
        ribbons.push(makeRibbon(w, h, cfg.baseHue, ribbons.length));
      if (ribbons.length > targetRibbons) ribbons = ribbons.slice(0, targetRibbons);

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = ribbons.length - 1; i >= 0; i--) {
        const r = ribbons[i];
        const fx = r.x * 0.0035, fy = r.y * 0.0035;
        const t2 = time * 1.2;
        const angle = (Math.sin(fx + t2) + Math.cos(fy * 1.3 - t2 * 0.7)) * Math.PI;
        r.vx += Math.cos(angle) * 0.2;
        r.vy += Math.sin(angle) * 0.2;
        r.vx *= 0.93; r.vy *= 0.93;
        r.x += r.vx; r.y += r.vy;
        r.life++;
        r.points.push({ x: r.x, y: r.y });
        if (r.points.length > r.maxPoints) r.points.shift();

        const off = r.x < -40 || r.x > w + 40 || r.y < -40 || r.y > h + 40;
        if (r.life > r.maxLife || (off && r.points.length < 4)) {
          ribbons[i] = makeRibbon(w, h, cfg.baseHue, i);
          continue;
        }

        const pts = r.points;
        if (pts.length < 2) continue;
        const lifeFade =
          r.life < 40 ? r.life / 40
          : r.life > r.maxLife - 40 ? Math.max(0, (r.maxLife - r.life) / 40)
          : 1;

        for (let j = 1; j < pts.length; j++) {
          const t01 = j / pts.length;
          ctx.strokeStyle = `hsla(${r.hue}, ${Math.min(sat + 15, 95)}%, ${Math.min(lit + 45, 72)}%, ${Math.pow(t01, 1.4) * 0.82 * lifeFade})`;
          ctx.lineWidth = r.width * (0.25 + t01 * 1.0);
          ctx.beginPath();
          ctx.moveTo(pts[j - 1].x, pts[j - 1].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }

        // Head glow
        const head = pts[pts.length - 1];
        const glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, r.width * 6);
        glow.addColorStop(0, `hsla(${r.hue}, 95%, 75%, ${0.5 * lifeFade})`);
        glow.addColorStop(1, `hsla(${r.hue}, 95%, 60%, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(head.x, head.y, r.width * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Droplet ripples ──────────────────────────────────────────────────────
      // Spawn rate scales with animSpeed
      const rippleInterval = Math.max(18, Math.round(120 / (cfg.animSpeed * 300 + 1)));
      if (time * (1 / cfg.animSpeed) > nextRipple) {
        nextRipple = time * (1 / cfg.animSpeed) + rippleInterval;
        ripples.push(makeRipple(w, h, cfg.baseHue));
      }

      const maxRipples = Math.max(4, Math.round(cfg.particles * 0.15));
      if (ripples.length > maxRipples) ripples = ripples.slice(-maxRipples);

      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.life++;
        const progress = rp.life / rp.maxLife; // 0 → 1
        rp.radius = rp.maxRadius * Math.pow(progress, 0.55);

        if (rp.life >= rp.maxLife) {
          ripples.splice(i, 1);
          continue;
        }

        // Fade: ramp up fast, linger, fade out
        const alpha =
          progress < 0.15 ? progress / 0.15
          : progress > 0.6 ? Math.max(0, (1 - progress) / 0.4)
          : 1;

        // Draw concentric rings
        for (let ring = 0; ring < rp.rings; ring++) {
          const ringOffset = ring * (rp.maxRadius / (rp.rings + 1));
          const r2 = Math.max(0, rp.radius - ringOffset);
          if (r2 <= 0) continue;

          const ringFade = 1 - ring / rp.rings;
          const lineAlpha = alpha * ringFade * 0.55;
          const lw = (1.5 - ring * 0.3) * (1 - progress * 0.4);

          ctx.beginPath();
          ctx.arc(rp.x, rp.y, r2, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${rp.hue}, ${sat + 20}%, ${Math.min(lit + 50, 78)}%, ${lineAlpha})`;
          ctx.lineWidth = Math.max(0.3, lw);
          ctx.stroke();
        }

        // Central droplet impact dot that fades quickly
        if (progress < 0.25) {
          const dotAlpha = (1 - progress / 0.25) * 0.7;
          const dotR = 3 * (1 - progress / 0.25);
          const dotGlow = ctx.createRadialGradient(rp.x, rp.y, 0, rp.x, rp.y, dotR * 3);
          dotGlow.addColorStop(0, `hsla(${rp.hue}, 90%, 80%, ${dotAlpha})`);
          dotGlow.addColorStop(1, `hsla(${rp.hue}, 90%, 70%, 0)`);
          ctx.fillStyle = dotGlow;
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, dotR * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

      // ── Grain overlay (pre-baked tile, stamped via drawImage) ───────────────
      const grainAmt = cfg.grainIntensity;
      if (grainAmt > 0 && grainTileRef.current) {
        const tile = grainTileRef.current;
        ctx.save();
        ctx.globalAlpha = Math.min(0.35, grainAmt / 100);
        ctx.globalCompositeOperation = "overlay";
        // Tile the noise across the full canvas
        for (let y = 0; y < ch; y += tile.height) {
          for (let x = 0; x < cw; x += tile.width) {
            ctx.drawImage(tile, x, y);
          }
        }
        ctx.restore();
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
