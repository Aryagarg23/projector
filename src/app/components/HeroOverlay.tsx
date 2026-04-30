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
    <AnimatePresence mode="sync">
      <motion.div
        key={slideId}
        initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="absolute inset-0 flex flex-col items-start z-10 pointer-events-none"
        style={{
          justifyContent: alignTop ? "flex-start" : "center",
          paddingTop: alignTop ? "5%" : undefined,
          paddingLeft: "5%",
          paddingRight: "5%",
        }}
      >
        <h1
          className="text-white text-left uppercase"
          style={{
            fontSize: `${size}vh`,
            fontFamily: "'Archivo Black', 'Archivo', system-ui, sans-serif",
            fontWeight: 900,
            textShadow:
              "0 0 60px rgba(255,255,255,0.25), 0 0 120px rgba(255,255,255,0.1)",
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
          }}
        >
          {config.heroText}
        </h1>
        {config.heroSubtext && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-white/45 mt-3 text-left uppercase"
            style={{
              fontSize: `${size * 0.3}vh`,
              fontFamily: "'Archivo', system-ui, sans-serif",
              fontWeight: 800,
              letterSpacing: "0.15em",
            }}
          >
            {config.heroSubtext}
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}