"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { HeroVisual } from "./HeroVisual";

export function HeroTransition() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Phase 1: Hero Visual fades out (0% -> 15%)
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15, 0.2, 1], [1, 0, 0, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -40]);
  const heroZIndex = useTransform(scrollYProgress, [0, 0.15, 0.16, 1], [10, 10, -1, -1]);
  const heroDisplay = useTransform(scrollYProgress, (pos) => (pos > 0.18 ? "none" : "flex"));

  // Phase 2: "CAREER." text motion 
  // SMOOTH: Enters from right at 0.1, stays in center until 0.6, then exits to left by 0.8
  const welcomeX = useTransform(scrollYProgress, 
    [0.1, 0.3, 0.6, 0.8], 
    ["100vw", "0vw", "0vw", "-100vw"]
  );
  const welcomeOpacity = useTransform(scrollYProgress, 
    [0.1, 0.25, 0.65, 0.8], 
    [0, 1, 1, 0]
  );
  
  const spacerOpacity = useTransform(scrollYProgress, [0.85, 0.98], [1, 0]);

  return (
    <div ref={containerRef} className="relative h-[400vh] w-full bg-[#000000]">
      {/* Sticky Transition Layer */}
      <motion.div 
        style={{ opacity: spacerOpacity }}
        className="sticky top-0 h-screen w-full overflow-hidden bg-[#000000]"
      >
        <HeroVisual 
          style={{ 
            opacity: heroOpacity, 
            scale: heroScale, 
            y: heroY, 
            zIndex: heroZIndex,
            display: heroDisplay
          }}
          className="absolute inset-0"
        />

        <motion.div
          style={{ x: welcomeX, opacity: welcomeOpacity, zIndex: 20 }}
          className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center pointer-events-none"
        >
          <h2 className="text-[18vw] font-[1000] tracking-tighter text-white drop-shadow-[0_0_80px_rgba(59,130,246,0.3)]">
            CAREER.
          </h2>
        </motion.div>
      </motion.div>
    </div>
  );
}
