"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { careers } from "@/data/resume";

export function CareerTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Create a sorted copy: Past to Present (Old first)
  const sortedCareers = [...careers].reverse();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Main horizontal rail translation
  const horizontalX = useTransform(scrollYProgress, [0, 1], ["0vw", "-220vw"]);

  // Brand Color Mapping
  const getBrandColor = (company: string) => {
    if (company.includes("RSQUARE")) return "red";
    if (company.includes("교보문고")) return "emerald";
    if (company.includes("EY")) return "yellow";
    if (company.includes("아스타")) return "cyan";
    return "blue";
  };

  const getBrandHex = (company: string) => {
    if (company.includes("RSQUARE")) return "#b91c1c"; // red-700
    if (company.includes("교보문고")) return "#047857"; // emerald-700
    if (company.includes("EY")) return "#facc15"; // yellow-400
    if (company.includes("아스타")) return "#22d3ee"; // cyan-400
    return "#2563eb"; // blue-600
  };

  return (
    <section ref={containerRef} className="relative h-[800vh] w-full" id="career">
      <div className="sticky top-0 h-dvh w-full overflow-hidden bg-black">
        {/* FIXED BACKDROP TEXT (TIMELINE) */}
        <div className="absolute left-6 bottom-6 sm:left-12 sm:bottom-12 z-10 pointer-events-none">
          <h2 className="text-[12vw] font-black tracking-tightest text-white/5 uppercase leading-none select-none font-sans">
            TIMELINE
          </h2>
        </div>

        {/* Horizontal Content Rail */}
        <motion.div 
          style={{ x: horizontalX }}
          className="flex h-full items-center relative"
        >
          {/* DYNAMIC SVG CURVED PATHS */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
            {sortedCareers.map((_, index) => {
              if (index === sortedCareers.length - 1) return null;
              
              const isTop = index % 2 === 0;
              const stepVW = 75; // Matches the min-width logic approximately
              const startX = `${index * stepVW + stepVW/2}vw`;
              const endX = `${(index + 1) * stepVW + stepVW/2}vw`;
              const startY = isTop ? "20%" : "80%";
              const endY = isTop ? "80%" : "20%";

              // Using a relative path that draws itself
              // We'll approximate with CSS units but SVG is better with absolute points
              // To make it truly responsive, we use percentages for Y and VW for X.
              // Note: SVG units in an absolute SVG usually default to pixels.
              // We'll use a hack to make it work or just use individual SVGs per segment.
              return null; 
            })}
          </svg>

          {sortedCareers.map((career, index) => {
            const isTop = index % 2 === 0;
            const brandColor = getBrandColor(career.company);
            const brandHex = getBrandHex(career.company);
            
            // Map scroll progress to this specific segment's path drawing
            // Each segment owns the path to the NEXT item
            const startScroll = index / sortedCareers.length;
            const endScroll = (index + 0.8) / sortedCareers.length;
            const pathLength = useTransform(scrollYProgress, [startScroll, endScroll], [0, 1]);

            return (
              <div 
                key={`${career.company}-${career.period}`}
                className={`
                  relative flex min-w-[95vw] md:min-w-[75vw] flex-col items-center justify-center h-full
                  ${isTop ? "justify-start pt-[8vh]" : "justify-end pb-[8vh]"}
                `}
              >
                {/* Outgoing Curved Connection Path to Next Card */}
                {index < sortedCareers.length - 1 && (
                  <div className="absolute left-1/2 top-0 w-full h-full z-20 pointer-events-none">
                    <svg className="w-full h-full overflow-visible">
                      <motion.path
                        d={isTop 
                          ? "M 0 200 C 300 200, 400 600, 700 600" // Top to Bottom
                          : "M 0 600 C 300 600, 400 200, 700 200" // Bottom to Top
                        }
                        viewBox="0 0 1000 800"
                        preserveAspectRatio="none"
                        fill="none"
                        stroke={brandHex}
                        strokeWidth="4"
                        strokeDasharray="1 0"
                        style={{ 
                          pathLength,
                          filter: `drop-shadow(0 0 8px ${brandHex}88)`
                        }}
                        className="opacity-40"
                      />
                    </svg>
                  </div>
                )}

                {/* White Tone & Manner Card */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className={`
                    z-50 w-[88vw] sm:max-w-2xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.85)] 
                    p-6 sm:p-10 lg:p-12 border-t-[8px] sm:border-t-[14px] border-${brandColor === "yellow" ? "yellow-400" : brandColor + (brandColor === "cyan" ? "-400" : "-700")}
                    overflow-hidden
                  `}
                >
                  <div className="mb-3 sm:mb-6">
                    <span className={`text-[clamp(10px,1.5vh,14px)] font-[1000] tracking-[0.2em] sm:tracking-[0.4em] uppercase border-b-2 border-${brandColor === "yellow" ? "yellow-400" : brandColor + (brandColor === "cyan" ? "-400" : "-700")} pb-1 text-slate-900`}>
                      {career.period}
                    </span>
                  </div>

                  <h3 className={`text-2xl sm:text-[clamp(1.5rem,4.5vh,3rem)] font-[1000] tracking-tightest text-${brandColor === "yellow" ? "yellow-400" : brandColor + (brandColor === "cyan" ? "-400" : "-700")} mb-3 sm:mb-8 uppercase leading-[0.9] break-keep`}>
                    {career.company}
                  </h3>
                  
                  <div className="mt-4 sm:mt-10 border-l-4 sm:border-l-8 border-slate-100 pl-4 sm:pl-10">
                    <p className="text-sm sm:text-[clamp(1rem,3vh,1.6rem)] font-bold leading-tight text-slate-800 tracking-tighter">
                      {career.role}
                    </p>
                  </div>

                  {career.href && (
                    <div className="mt-6 sm:mt-12 pt-4 sm:pt-10 border-t border-slate-100">
                      <a
                        href={career.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group inline-flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-${brandColor === "yellow" ? "yellow-400" : brandColor + (brandColor === "cyan" ? "-400" : "-700")} hover:opacity-60 transition-opacity`}
                      >
                        회사 보러가기 <span className="text-sm sm:text-2xl transition-transform group-hover:translate-x-2">→</span>
                      </a>
                    </div>
                  )}
                </motion.div>
                
                {/* Node Point on the card edge */}
                <div className={`absolute left-1/2 h-4 w-4 rounded-full bg-white border-4 border-${brandColor === "yellow" ? "yellow-400" : brandColor + (brandColor === "cyan" ? "-400" : "-700")} z-50 ${isTop ? "top-[6vh]" : "bottom-[6vh]"} -translate-x-1/2`} />
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
