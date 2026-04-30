// ============================================================
// MASTER SLIDE CONFIGURATION
// ============================================================
// This is the SINGLE SOURCE OF TRUTH for all projection visuals.
// Edit this file to change questions, gradients, text, timing.
// Websocket data will eventually override vote counts at runtime.
// ============================================================

export interface GradientConfig {
  baseHue: number;
  hueSpeed: number;
  grainIntensity: number;
  layers: number;
  saturation: number;
  lightness: number;
  animSpeed: number;
  particles: number;
}

export interface SurfaceConfig {
  gradient: GradientConfig;
  heroText: string;
  heroSubtext?: string;
  /** Font size in vh units */
  heroSize?: number;
}

export interface MCQAnswer {
  label: string; // "A", "B", "C", "D"
  text: string; // The answer text
  votes: number; // Simulated initial vote count
}

export interface SlideConfig {
  id: string;
  duration: number;
  top: SurfaceConfig;
  bottom: SurfaceConfig & {
    showGraph: boolean;
    graphHue?: number;
    /** MCQ answers — only used when showGraph is true */
    answers?: MCQAnswer[];
  };
}

// ============================================================
// RENDER SETTINGS (defaults — overridden by UI sliders)
// ============================================================
export const defaultRenderSettings = {
  fontScale: 1.0,    // 0.3 – 3.0
  dpiScale: 1.0,     // 0.25 – 8.0 (canvas resolution multiplier)
};

// ============================================================
// RENDER SLIDER RANGES (used by ConfigPanel)
// ============================================================
export const renderSliderRanges = {
  fontScale: {
    min: 0.3,
    max: 3.0,
    step: 0.05,
  },
  dpiScale: {
    min: 0.25,
    max: 8.0,
    step: 0.05,
  },
};

// ============================================================
// PERSPECTIVE PANEL DEFAULTS
// ============================================================
// Default corner inset: 0 = surfaces fill 100% of their container
// Negative values extend beyond container for even larger defaults
export const defaultCornerInset = 0; // 0 inset = 100% coverage (full size)

// ============================================================
// THE 5 SLIDES
// ============================================================

export const slides: SlideConfig[] = [
  // ── SLIDE 1: Welcome ──
  {
    id: "welcome",
    duration: 8000,
    top: {
      gradient: {
        baseHue: 205,
        hueSpeed: 0.4,
        grainIntensity: 55,
        layers: 4,
        saturation: 80,
        lightness: 12,
        animSpeed: 0.003,
        particles: 32,
      },
      heroText: "FUTURES FORUM",
      heroSubtext: "LIVE POLL // REAL-TIME",
      heroSize: 5,
    },
    bottom: {
      gradient: {
        baseHue: 355,
        hueSpeed: 0.4,
        grainIntensity: 60,
        layers: 4,
        saturation: 92,
        lightness: 10,
        animSpeed: 0.003,
        particles: 45,
      },
      heroText: "NEW AMERICAN DREAM",
      heroSubtext: "WHICH DRIVER SHAPES THE FUTURE?",
      heroSize: 6,
      showGraph: false,
    },
  },

  // ── SLIDE 2: Q1 — New American Dream ──
  // Flag color journey: sky blue (hue 205) → royal blue → violet → magenta → red (hue 355)
  // Top surface anchors the blue end, bottom anchors the red end
  {
    id: "q1",
    duration: 15000,
    top: {
      gradient: {
        baseHue: 210,        // sky → royal blue
        hueSpeed: 0.4,
        grainIntensity: 40,
        layers: 3,
        saturation: 88,
        lightness: 14,
        animSpeed: 0.004,
        particles: 26,
      },
      heroText: "QUESTION 1 / 4",
      heroSubtext: "WHICH SUB-DRIVER WILL HAVE THE MOST IMPACT?",
      heroSize: 4,
    },
    bottom: {
      gradient: {
        baseHue: 355,        // deep red
        hueSpeed: 0.4,
        grainIntensity: 35,
        layers: 3,
        saturation: 90,
        lightness: 9,
        animSpeed: 0.004,
        particles: 28,
      },
      heroText: "NEW AMERICAN DREAM",
      heroSize: 3.5,
      showGraph: true,
      graphHue: 355,
      answers: [
        { label: "A", text: "Family 2.0", votes: 0 },
        { label: "B", text: "Home Ownership: The Impossible Dream", votes: 0 },
        { label: "C", text: "Buy Now, Pay Forever", votes: 0 },
        { label: "D", text: "Alternative Investments", votes: 0 },
      ],
    },
  },

  // ── SLIDE 3: Q2 — Lifemaxxing ──
  // Golden yellow (hue 45) → burnt orange (hue 22), with teal accent bleeding in (hue ~175)
  {
    id: "q2",
    duration: 15000,
    top: {
      gradient: {
        baseHue: 45,         // bright golden yellow
        hueSpeed: 0.4,
        grainIntensity: 40,
        layers: 3,
        saturation: 92,
        lightness: 14,
        animSpeed: 0.004,
        particles: 26,
      },
      heroText: "QUESTION 2 / 4",
      heroSubtext: "WHICH SUB-DRIVER WILL HAVE THE MOST IMPACT?",
      heroSize: 4,
    },
    bottom: {
      gradient: {
        baseHue: 22,         // deep burnt orange
        hueSpeed: 0.4,
        grainIntensity: 35,
        layers: 3,
        saturation: 90,
        lightness: 9,
        animSpeed: 0.004,
        particles: 28,
      },
      heroText: "LIFEMAXXING",
      heroSize: 3.5,
      showGraph: true,
      graphHue: 33,
      answers: [
        { label: "A", text: "Gen Alpha Alphas", votes: 0 },
        { label: "B", text: "The Quest for Immortality", votes: 0 },
        { label: "C", text: "Effortless Enhancement", votes: 0 },
        { label: "D", text: "The Status of Wellness", votes: 0 },
      ],
    },
  },

  // ── SLIDE 4: Q3 — The Non-Invasive Age ──
  // Bright cyan (hue 183) top → vivid electric mint (hue 162) bottom
  // blue-teal (hue 195) accent, yellow-green (hue 75) warmth at extremes
  {
    id: "q3",
    duration: 15000,
    top: {
      gradient: {
        baseHue: 185,        // bright cyan
        hueSpeed: 0.4,
        grainIntensity: 40,
        layers: 3,
        saturation: 88,
        lightness: 14,
        animSpeed: 0.004,
        particles: 26,
      },
      heroText: "QUESTION 3 / 4",
      heroSubtext: "WHICH SUB-DRIVER WILL HAVE THE MOST IMPACT?",
      heroSize: 4,
    },
    bottom: {
      gradient: {
        baseHue: 162,        // vivid electric mint
        hueSpeed: 0.4,
        grainIntensity: 35,
        layers: 3,
        saturation: 85,
        lightness: 9,
        animSpeed: 0.004,
        particles: 28,
      },
      heroText: "THE NON-INVASIVE AGE",
      heroSize: 3.5,
      showGraph: true,
      graphHue: 173,
      answers: [
        { label: "A", text: "Upgrades Available", votes: 0 },
        { label: "B", text: "Needles Not Required", votes: 0 },
        { label: "C", text: "Transmission Received", votes: 0 },
      ],
    },
  },

  // ── SLIDE 5: Q4 — Techno-Social Tug-of-War ──
  // Hot fuchsia (hue 305) → deep violet-purple (hue 272), fully saturated
  {
    id: "q4",
    duration: 15000,
    top: {
      gradient: {
        baseHue: 305,        // hot fuchsia/magenta
        hueSpeed: 0.4,
        grainIntensity: 40,
        layers: 3,
        saturation: 95,
        lightness: 13,
        animSpeed: 0.004,
        particles: 26,
      },
      heroText: "QUESTION 4 / 4",
      heroSubtext: "WHICH SUB-DRIVER WILL HAVE THE MOST IMPACT?",
      heroSize: 4,
    },
    bottom: {
      gradient: {
        baseHue: 272,        // deep violet-purple
        hueSpeed: 0.4,
        grainIntensity: 35,
        layers: 3,
        saturation: 92,
        lightness: 9,
        animSpeed: 0.004,
        particles: 28,
      },
      heroText: "TECHNO-SOCIAL TUG-OF-WAR",
      heroSize: 3.5,
      showGraph: true,
      graphHue: 288,
      answers: [
        { label: "A", text: "Just Chat It", votes: 0 },
        { label: "B", text: "Your AI Frenemy", votes: 0 },
        { label: "C", text: "Data as a Currency", votes: 0 },
        { label: "D", text: "Big Tech, Bigger Influence", votes: 0 },
      ],
    },
  },
];