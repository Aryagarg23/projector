import { useState, useRef, useCallback, useEffect } from "react";

interface Point {
  x: number;
  y: number;
}

interface PerspectivePanelProps {
  id: string;
  label: string;
  children?: React.ReactNode;
  guideUIVisible?: boolean;
  /** Externally controlled corners */
  corners: [Point, Point, Point, Point] | null;
  onCornersChange: (corners: [Point, Point, Point, Point]) => void;
  onSizeChange?: (w: number, h: number) => void;
}

// Compute a CSS matrix3d that maps a rectangle to an arbitrary quadrilateral
function computeMatrix3d(
  w: number,
  h: number,
  corners: [Point, Point, Point, Point]
): string {
  // corners: [topLeft, topRight, bottomRight, bottomLeft]
  const [tl, tr, br, bl] = corners;

  // Source points (unit square mapped to w x h)
  const srcPts = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];

  const dstPts = [tl, tr, br, bl];

  // Solve for the perspective transform using adjugate method
  function solve(
    src: { x: number; y: number }[],
    dst: { x: number; y: number }[]
  ): number[] {
    // Build 8x8 system for homography
    const A: number[][] = [];
    const b: number[] = [];

    for (let i = 0; i < 4; i++) {
      const sx = src[i].x,
        sy = src[i].y;
      const dx = dst[i].x,
        dy = dst[i].y;
      A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]);
      b.push(dx);
      A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]);
      b.push(dy);
    }

    // Gaussian elimination
    const n = 8;
    const aug = A.map((row, i) => [...row, b[i]]);

    for (let col = 0; col < n; col++) {
      let maxRow = col;
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
          maxRow = row;
        }
      }
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

      const pivot = aug[col][col];
      if (Math.abs(pivot) < 1e-10) continue;

      for (let j = col; j <= n; j++) aug[col][j] /= pivot;

      for (let row = 0; row < n; row++) {
        if (row === col) continue;
        const factor = aug[row][col];
        for (let j = col; j <= n; j++) {
          aug[row][j] -= factor * aug[col][j];
        }
      }
    }

    return aug.map((row) => row[n]);
  }

  const h8 = solve(srcPts, dstPts);
  const [a, b, c, d, e, f, g, hh] = h8;

  // Convert 3x3 homography to 4x4 CSS matrix3d (column-major)
  // H = [[a, b, c], [d, e, f], [g, h, 1]]
  // CSS matrix3d is column-major 4x4
  const matrix3d = [
    a, d, 0, g,
    b, e, 0, hh,
    0, 0, 1, 0,
    c, f, 0, 1,
  ];

  return `matrix3d(${matrix3d.join(",")})`;
}

const HANDLE_SIZE = 16;

export function PerspectivePanel({ id, label, children, guideUIVisible = true, corners, onCornersChange, onSizeChange }: PerspectivePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [dragging, setDragging] = useState<number | null>(null);
  const [showHandles, setShowHandles] = useState(true);

  // Track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: width, h: height });
      onSizeChange?.(width, height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [onSizeChange]);

  const handlePointerDown = useCallback(
    (index: number) => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(index);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragging === null || !containerRef.current || !corners) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const next = [...corners] as [Point, Point, Point, Point];
      next[dragging] = { x, y };
      onCornersChange(next);
    },
    [dragging, corners, onCornersChange]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  const transform =
    corners && size.w > 0 && size.h > 0
      ? computeMatrix3d(size.w, size.h, corners)
      : undefined;

  const cornerLabels = ["TL", "TR", "BR", "BL"];
  const isTop = id === "top";
  const handleColor = isTop ? "#ff6464" : "#6496ff";
  const activeColor = "#00ff88";

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-visible"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Transformed content — rendered at the natural container size so
          content layout/aspect ratios are always correct, then warped */}
      {size.w > 0 && size.h > 0 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size.w,
            height: size.h,
            transformOrigin: "0 0",
            transform,
            willChange: "transform",
            overflow: "hidden",
          }}
        >
          {children || (
            <span className="text-white/50 text-lg select-none">{label}</span>
          )}
        </div>
      )}

      {/* Corner drag handles */}
      {guideUIVisible &&
        showHandles &&
        corners &&
        corners.map((pt, i) => (
          <div
            key={`${id}-handle-${i}`}
            onPointerDown={handlePointerDown(i)}
            className="absolute z-50 cursor-grab active:cursor-grabbing"
            style={{
              left: pt.x - HANDLE_SIZE / 2,
              top: pt.y - HANDLE_SIZE / 2,
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              borderRadius: "50%",
              background: dragging === i ? activeColor : handleColor,
              border: "2px solid rgba(255,255,255,0.8)",
              touchAction: "none",
              boxShadow: `0 0 10px ${dragging === i ? activeColor : handleColor}60`,
            }}
            title={`Drag ${cornerLabels[i]} corner`}
          />
        ))}

      {/* Toggle handles visibility */}
      {guideUIVisible && (
        <button
          onClick={() => setShowHandles((v) => !v)}
          className="absolute top-2 right-2 z-50 px-2 py-1 text-xs rounded select-none border"
          style={{
            fontFamily: "monospace",
            background: "rgba(0,0,0,0.6)",
            color: "rgba(255,255,255,0.45)",
            borderColor: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(4px)",
          }}
        >
          {showHandles ? "⊘ HIDE" : "⊕ SHOW"}
        </button>
      )}
    </div>
  );
}