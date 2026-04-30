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
  tickerSpeed: 18,   // seconds per loop (lower = faster)
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
  tickerSpeed: {
    min: 3,
    max: 60,
    step: 0.5,
  },
  ribbonCount: {
    min: 0,
    max: 200,
    step: 1,
  },
  ribbonSpeed: {
    min: 0.1,
    max: 4,
    step: 0.05,
  },
  rippleCount: {
    min: 0,
    max: 60,
    step: 1,
  },
  rippleSpeed: {
    min: 0.1,
    max: 5,
    step: 0.05,
  },
};

export const defaultBgSettings = {
  ribbonCount: 30,
  ribbonSpeed: 1,
  rippleCount: 8,
  rippleSpeed: 1,
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
        hueSpeed: 0.5,
        grainIntensity: 30,
        layers: 5,
        saturation: 100,
        lightness: 22,
        animSpeed: 0.005,
        particles: 40,
      },
      heroText: "FUTURES FORUM",
      heroSubtext: "LIVE POLL // REAL-TIME",
      heroSize: 5,
    },
    bottom: {
      gradient: {
        baseHue: 355,
        hueSpeed: 0.5,
        grainIntensity: 30,
        layers: 5,
        saturation: 100,
        lightness: 18,
        animSpeed: 0.005,
        particles: 55,
      },
      heroText: "NEW AMERICAN DREAM",
      heroSubtext: "WHICH DRIVER SHAPES THE FUTURE?",
      heroSize: 6,
      showGraph: false,
    },
  },

  // ── SLIDE 2: Q1 — New American Dream ──
  {
    id: "q1",
    duration: 15000,
    top: {
      gradient: {
        baseHue: 210,
        hueSpeed: 0.5,
        grainIntensity: 25,
        layers: 4,
        saturation: 100,
        lightness: 22,
        animSpeed: 0.005,
        particles: 32,
      },
      heroText: "QUESTION 1 / 4",
      heroSubtext: "WHICH SUB-DRIVER WILL HAVE THE MOST IMPACT?",
      heroSize: 4,
    },
    bottom: {
      gradient: {
        baseHue: 355,
        hueSpeed: 0.5,
        grainIntensity: 20,
        layers: 4,
        saturation: 100,
        lightness: 18,
        animSpeed: 0.005,
        particles: 35,
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
  {
    id: "q2",
    duration: 15000,
    top: {
      gradient: {
        baseHue: 45,
        hueSpeed: 0.5,
        grainIntensity: 25,
        layers: 4,
        saturation: 100,
        lightness: 24,
        animSpeed: 0.005,
        particles: 32,
      },
      heroText: "QUESTION 2 / 4",
      heroSubtext: "WHICH SUB-DRIVER WILL HAVE THE MOST IMPACT?",
      heroSize: 4,
    },
    bottom: {
      gradient: {
        baseHue: 22,
        hueSpeed: 0.5,
        grainIntensity: 20,
        layers: 4,
        saturation: 100,
        lightness: 18,
        animSpeed: 0.005,
        particles: 35,
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
  {
    id: "q3",
    duration: 15000,
    top: {
      gradient: {
        baseHue: 185,
        hueSpeed: 0.5,
        grainIntensity: 25,
        layers: 4,
        saturation: 100,
        lightness: 22,
        animSpeed: 0.005,
        particles: 32,
      },
      heroText: "QUESTION 3 / 4",
      heroSubtext: "WHICH SUB-DRIVER WILL HAVE THE MOST IMPACT?",
      heroSize: 4,
    },
    bottom: {
      gradient: {
        baseHue: 162,
        hueSpeed: 0.5,
        grainIntensity: 20,
        layers: 4,
        saturation: 100,
        lightness: 18,
        animSpeed: 0.005,
        particles: 35,
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
  {
    id: "q4",
    duration: 15000,
    top: {
      gradient: {
        baseHue: 305,
        hueSpeed: 0.5,
        grainIntensity: 25,
        layers: 4,
        saturation: 100,
        lightness: 22,
        animSpeed: 0.005,
        particles: 32,
      },
      heroText: "QUESTION 4 / 4",
      heroSubtext: "WHICH SUB-DRIVER WILL HAVE THE MOST IMPACT?",
      heroSize: 4,
    },
    bottom: {
      gradient: {
        baseHue: 272,
        hueSpeed: 0.5,
        grainIntensity: 20,
        layers: 4,
        saturation: 100,
        lightness: 18,
        animSpeed: 0.005,
        particles: 35,
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