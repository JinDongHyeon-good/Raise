"use client";

import { useEffect } from "react";

export function TitleUnderlineObserver() {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>(".section-title"));
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("title-underline-visible");
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    for (const target of targets) {
      observer.observe(target);
    }

    return () => observer.disconnect();
  }, []);

  return null;
}

