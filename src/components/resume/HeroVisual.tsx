"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import { 
  PerspectiveCamera,
  Stars,
} from "@react-three/drei";
import { motion, MotionProps } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { CursorTrail } from "./CursorTrail";

const SECTIONS = [
  { title: "CAREER", id: "career", num: "01" },
  { title: "PROJECTS", id: "project", num: "02" },
  { title: "SKILLS", id: "skills", num: "03" },
  { title: "CONTACT", id: "contact", num: "04" },
  { title: "PDF DOWNLOAD", id: "pdf", num: "05" },
];

function ScrollMouse() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-10 w-6 rounded-full border-2 border-white/20">
        <motion.div 
          animate={{ 
            y: [2, 12, 2],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute left-1/2 top-2 h-2 w-1 -translate-x-1/2 rounded-full bg-blue-500"
        />
      </div>
      <span className="text-[10px] font-bold tracking-[0.3em] text-white/30">SCROLL</span>
    </div>
  );
}

interface HeroVisualProps extends MotionProps {
  className?: string;
  style?: any;
}

export function HeroVisual({ className, style, ...props }: HeroVisualProps) {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.4,
      }
    }
  };

  const item: any = {
    hidden: { opacity: 0, x: -30, filter: "blur(10px)" },
    show: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <motion.section 
      {...props}
      style={style}
      className={`resume-hero-visual relative flex h-dvh w-full items-center overflow-hidden ${className || ""}`}
    >
      <CursorTrail />
      
      {/* Three.js Background Stars */}
      <div className="absolute inset-0 z-0">
        <Canvas dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <Stars radius={100} depth={50} count={6000} factor={4} saturation={0} fade speed={1.2} />
        </Canvas>
      </div>

      {/* Main Typography Content */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 sm:px-12 lg:px-16">
        <div className="flex flex-col gap-10 sm:gap-14">
          {/* Main Title - Bold Gothic Aesthetic */}
          <motion.div
            initial={{ opacity: 0, y: 30, filter: "blur(15px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="flex flex-col"
          >
            <h1 className="text-[12vw] font-[950] leading-[0.85] tracking-tighter text-white sm:text-[8rem] lg:text-[10rem]">
              JIN DONG <br /> 
              <span className="text-blue-500">HYEON.</span>
            </h1>
            <p className="mt-6 text-sm font-bold tracking-[0.4em] text-white/40 sm:text-base">
              DEVELOPER
            </p>
          </motion.div>

          {/* Vertical Navigation Menu */}
          <motion.nav 
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col items-start gap-4 sm:gap-6"
          >
            {SECTIONS.map((section) => (
              <motion.button
                key={section.id}
                variants={item}
                onClick={() => scrollToSection(section.id)}
                className="group relative flex items-baseline gap-4 text-left transition-all"
              >
                <span className="text-[10px] font-bold tracking-widest text-blue-500 sm:text-xs">
                  {section.num}
                </span>
                <span className="relative overflow-hidden text-2xl font-black tracking-tight text-white/70 transition-all group-hover:text-white sm:text-4xl lg:text-5xl">
                  {section.title}
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-blue-500 transition-all duration-300 group-hover:w-full" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-blue-500 opacity-0 transition-all group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-100 sm:h-6 sm:w-6" />
              </motion.button>
            ))}
          </motion.nav>
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="pointer-events-none absolute bottom-8 left-1/2 z-20 -translate-x-1/2"
      >
        <ScrollMouse />
      </motion.div>
    </motion.section>
  );
}
