import { motion, AnimatePresence } from "motion/react";
import type { SurfaceConfig } from "./slideConfig";

interface Props {
  config: SurfaceConfig;
  slideId: string;
  fontScale?: number;
  /** Push text to top of surface (when graph is below) */
  alignTop?: boolean;
}

export function HeroOverlay({ config, slideId, fontScale = 1, alignTop = false }: Props) {
  const size = (config.heroSize ?? 3) * fontScale;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={slideId}
        initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
        transition={{ duration: 1.0, ease: "easeInOut" }}
        className="absolute inset-0 flex flex-col items-center z-10 pointer-events-none px-8"
        style={{ justifyContent: alignTop ? "flex-start" : "center", paddingTop: alignTop ? "5%" : undefined }}
      >
        <h1
          className="text-white tracking-widest text-center"
          style={{
            fontSize: `${size}vh`,
            fontFamily: "monospace",
            textShadow:
              "0 0 60px rgba(255,255,255,0.25), 0 0 120px rgba(255,255,255,0.1)",
            lineHeight: 1.1,
          }}
        >
          {config.heroText}
        </h1>
        {config.heroSubtext && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-white/35 tracking-[0.3em] mt-3 text-center"
            style={{
              fontSize: `${size * 0.3}vh`,
              fontFamily: "monospace",
            }}
          >
            {config.heroSubtext}
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}