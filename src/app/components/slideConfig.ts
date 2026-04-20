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
  // ── SLIDE 1: Welcome / Title Card — no graph ──
  {
    id: "welcome",
    duration: 8000,
    top: {
      gradient: {
        baseHue: 220,
        hueSpeed: 0.3,
        grainIntensity: 55,
        layers: 3,
        saturation: 60,
        lightness: 14,
        animSpeed: 0.003,
        particles: 35,
      },
      heroText: "LIVE POLL",
      heroSubtext: "CROWDSOURCED // REAL-TIME",
      heroSize: 5,
    },
    bottom: {
      gradient: {
        baseHue: 260,
        hueSpeed: 0.4,
        grainIntensity: 65,
        layers: 4,
        saturation: 70,
        lightness: 10,
        animSpeed: 0.003,
        particles: 60,
      },
      heroText: "WELCOME",
      heroSubtext: "IPAD = VOTE. ELSE BYE",
      heroSize: 8,
      showGraph: false,
    },
  },

  // ── SLIDE 2: Question 1 ──
  {
    id: "q1",
    duration: 15000,
    top: {
      gradient: {
        baseHue: 195,
        hueSpeed: 0.6,
        grainIntensity: 35,
        layers: 2,
        saturation: 70,
        lightness: 12,
        animSpeed: 0.005,
        particles: 20,
      },
      heroText: "QUESTION 1",
      heroSubtext: "VOTE NOW",
      heroSize: 5,
    },
    bottom: {
      gradient: {
        baseHue: 180,
        hueSpeed: 0.8,
        grainIntensity: 30,
        layers: 3,
        saturation: 55,
        lightness: 8,
        animSpeed: 0.004,
        particles: 25,
      },
      heroText: "WHAT IS THE BEST CREATIVE CODING PLATFORM?",
      heroSize: 4,
      showGraph: true,
      graphHue: 180,
      answers: [
        { label: "A", text: "Processing", votes: 42 },
        { label: "B", text: "p5.js", votes: 67 },
        { label: "C", text: "TouchDesigner", votes: 38 },
        { label: "D", text: "openFrameworks", votes: 23 },
      ],
    },
  },

  // ── SLIDE 3: Question 2 ──
  {
    id: "q2",
    duration: 15000,
    top: {
      gradient: {
        baseHue: 340,
        hueSpeed: 1.2,
        grainIntensity: 70,
        layers: 4,
        saturation: 80,
        lightness: 16,
        animSpeed: 0.007,
        particles: 50,
      },
      heroText: "QUESTION 2",
      heroSubtext: "RESULTS UPDATING LIVE",
      heroSize: 5,
    },
    bottom: {
      gradient: {
        baseHue: 0,
        hueSpeed: 1.5,
        grainIntensity: 75,
        layers: 4,
        saturation: 85,
        lightness: 12,
        animSpeed: 0.008,
        particles: 80,
      },
      heroText: "HOW DO YOU FEEL ABOUT AI-GENERATED ART?",
      heroSize: 3.5,
      showGraph: true,
      graphHue: 350,
      answers: [
        { label: "A", text: "Love it", votes: 55 },
        { label: "B", text: "It's a tool", votes: 82 },
        { label: "C", text: "Skeptical", votes: 34 },
        { label: "D", text: "Against it", votes: 19 },
      ],
    },
  },

  // ── SLIDE 4: Question 3 ──
  {
    id: "q3",
    duration: 15000,
    top: {
      gradient: {
        baseHue: 270,
        hueSpeed: 0.3,
        grainIntensity: 20,
        layers: 2,
        saturation: 45,
        lightness: 10,
        animSpeed: 0.002,
        particles: 12,
      },
      heroText: "QUESTION 3",
      heroSubtext: "KEEP VOTING",
      heroSize: 5,
    },
    bottom: {
      gradient: {
        baseHue: 280,
        hueSpeed: 0.4,
        grainIntensity: 25,
        layers: 2,
        saturation: 50,
        lightness: 8,
        animSpeed: 0.002,
        particles: 15,
      },
      heroText: "WHAT SHOULD WE PROJECT NEXT?",
      heroSize: 4,
      showGraph: true,
      graphHue: 270,
      answers: [
        { label: "A", text: "Particle Storm", votes: 71 },
        { label: "B", text: "Fractal Zoom", votes: 48 },
        { label: "C", text: "Audio Reactive", votes: 63 },
        { label: "D", text: "Fluid Sim", votes: 56 },
      ],
    },
  },

  // ── SLIDE 5: Final Question ──
  {
    id: "q4",
    duration: 15000,
    top: {
      gradient: {
        baseHue: 120,
        hueSpeed: 2.0,
        grainIntensity: 85,
        layers: 5,
        saturation: 75,
        lightness: 18,
        animSpeed: 0.01,
        particles: 90,
      },
      heroText: "FINAL QUESTION",
      heroSubtext: "LAST CHANCE TO VOTE",
      heroSize: 5,
    },
    bottom: {
      gradient: {
        baseHue: 100,
        hueSpeed: 2.5,
        grainIntensity: 90,
        layers: 5,
        saturation: 80,
        lightness: 14,
        animSpeed: 0.012,
        particles: 120,
      },
      heroText: "WAS THIS PROJECTION MAPPING WORTH IT?",
      heroSize: 4,
      showGraph: true,
      graphHue: 120,
      answers: [
        { label: "A", text: "Absolutely", votes: 91 },
        { label: "B", text: "Pretty cool", votes: 64 },
        { label: "C", text: "Meh", votes: 12 },
        { label: "D", text: "Do it again", votes: 78 },
      ],
    },
  },
];