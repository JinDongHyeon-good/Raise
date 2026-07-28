import type { Element } from "@/lib/saju/constants";
import type { Pillar } from "@/lib/saju/engine";

/** API가 클라이언트로 내려주는 직렬화된 명식 (serializeChart와 동일 구조) */
export type ClientChart = {
  solar: { year: number; month: number; day: number; hour: number; minute: number };
  calendar: "solar" | "lunar";
  timeKnown: boolean;
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar | null;
  };
  dayMaster: { ko: string; hanja: string; element: Element; yinYang: string };
  zodiac: string;
  elementCounts: Record<Element, number>;
  dominantElements: Element[];
  lackingElements: Element[];
};
