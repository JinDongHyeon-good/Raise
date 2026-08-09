/**
 * 사주(四柱) 계산 엔진.
 * 그레고리력(양력) 생년월일시로 연·월·일·시주(천간·지지)와 오행·십성·띠를 계산한다.
 * 연주는 입춘(태양황경 315°), 월주는 절기(태양황경 30° 구간)를 기준으로 한다.
 * 표준시는 KST(UTC+9)로 가정한다.
 */
import {
  branchGanji,
  Element,
  ELEMENTS,
  HEAVENLY_STEMS,
  stemGanji,
  TenGod,
  tenGod,
} from "@/lib/saju/constants";
import { lunarToSolar } from "@/lib/saju/lunar";

const KST_OFFSET_HOURS = 9;

function deg2rad(d: number) {
  return (d * Math.PI) / 180;
}

/** 그레고리력 → 율리우스 적일수(정오 기준 정수) */
function gregorianToJDN(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

/** 태양 겉보기 황경(도). jd는 UT 기준 소수 율리우스일. (Meeus 저정밀) */
function solarLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mrad = deg2rad(M);
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad);
  const trueLong = L0 + C;
  return ((trueLong % 360) + 360) % 360;
}

export type CalendarType = "solar" | "lunar";

export type SajuInput = {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour?: number; // 0-23
  minute?: number; // 0-59
  calendar: CalendarType;
  isLeapMonth?: boolean; // 음력 윤달
  timeKnown: boolean;
};

export type Pillar = {
  label: string; // 년주/월주/일주/시주
  stemKo: string;
  stemHanja: string;
  branchKo: string;
  branchHanja: string;
  ganjiKo: string; // 예: 갑자
  ganjiHanja: string; // 예: 甲子
  element: Element; // 천간 오행
  branchElement: Element;
  stemTenGod: TenGod | "일간";
  branchTenGod: TenGod;
};

export type SajuChart = {
  input: SajuInput;
  solar: { year: number; month: number; day: number; hour: number; minute: number };
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar | null;
  };
  dayMaster: { ko: string; hanja: string; element: Element; yinYang: string };
  zodiac: string; // 띠
  elementCounts: Record<Element, number>;
  dominantElements: Element[];
  lackingElements: Element[];
  summary: string; // 프롬프트/표시용 요약 텍스트
};

function buildPillar(
  label: string,
  stemIndex: number,
  branchIndex: number,
  dayStemIndex: number,
  isDayPillar = false,
): Pillar {
  const stem = stemGanji(stemIndex);
  const branch = branchGanji(branchIndex);
  const dayStem = stemGanji(dayStemIndex);
  const branchMainStem = stemGanji(branch.mainStemIndex);

  return {
    label,
    stemKo: stem.ko,
    stemHanja: stem.hanja,
    branchKo: branch.ko,
    branchHanja: branch.hanja,
    ganjiKo: `${stem.ko}${branch.ko}`,
    ganjiHanja: `${stem.hanja}${branch.hanja}`,
    element: stem.element,
    branchElement: branch.element,
    stemTenGod: isDayPillar
      ? "일간"
      : tenGod(dayStem.element, dayStem.yinYang, stem.element, stem.yinYang),
    branchTenGod: tenGod(
      dayStem.element,
      dayStem.yinYang,
      branchMainStem.element,
      branchMainStem.yinYang,
    ),
  };
}

/** 특정 양력 일자의 일주(천간·지지 인덱스) */
export function dayPillarIndices(year: number, month: number, day: number) {
  const jdn = gregorianToJDN(year, month, day);
  return {
    stemIndex: ((jdn + 9) % 10 + 10) % 10,
    branchIndex: ((jdn + 1) % 12 + 12) % 12,
  };
}

/** 오늘(또는 임의 양력일)의 일진 간지 문자열 */
export function dayGanji(year: number, month: number, day: number) {
  const { stemIndex, branchIndex } = dayPillarIndices(year, month, day);
  const stem = stemGanji(stemIndex);
  const branch = branchGanji(branchIndex);
  return {
    ganjiKo: `${stem.ko}${branch.ko}`,
    ganjiHanja: `${stem.hanja}${branch.hanja}`,
    stemElement: stem.element,
    branchElement: branch.element,
    zodiac: branch.zodiac,
  };
}

export function computeSaju(input: SajuInput): SajuChart {
  // 1) 음력이면 양력으로 변환
  let sy = input.year;
  let sm = input.month;
  let sd = input.day;
  if (input.calendar === "lunar") {
    const solar = lunarToSolar(input.year, input.month, input.day, input.isLeapMonth ?? false);
    sy = solar.year;
    sm = solar.month;
    sd = solar.day;
  }

  const hour = input.timeKnown ? input.hour ?? 0 : 0;
  const minute = input.timeKnown ? input.minute ?? 0 : 0;

  // 2) UT 기준 소수 율리우스일 (태양황경용)
  const jdnNoon = gregorianToJDN(sy, sm, sd);
  const jdUT = jdnNoon - 0.5 + (hour + minute / 60 - KST_OFFSET_HOURS) / 24;
  const lambda = solarLongitude(jdUT);

  // 3) 연주 — 입춘(315°) 기준
  let sajuYear = sy;
  if (sm === 1 || (sm === 2 && lambda < 315)) {
    sajuYear = sy - 1;
  }
  const yearStemIndex = ((sajuYear - 4) % 10 + 10) % 10;
  const yearBranchIndex = ((sajuYear - 4) % 12 + 12) % 12;

  // 4) 월주 — 절기 구간(寅월=0)
  const monthOrder = Math.floor((((lambda - 315 + 360) % 360) / 30)); // 0..11 (寅부터)
  const monthBranchIndex = (2 + monthOrder) % 12; // 寅 = index 2
  const monthStemIndex = ((yearStemIndex % 5) * 2 + 2 + monthOrder) % 10;

  // 5) 일주 — 양력 civil date 기준
  const { stemIndex: dayStemIndex, branchIndex: dayBranchIndex } = dayPillarIndices(sy, sm, sd);

  // 6) 시주 — 시지(2시간 단위), 시간 오자둔
  let hourPillar: Pillar | null = null;
  if (input.timeKnown) {
    const minutesSinceMidnight = hour * 60 + minute;
    const hourBranchIndex = Math.floor((minutesSinceMidnight + 60) / 120) % 12;
    const hourStemIndex = ((dayStemIndex % 5) * 2 + hourBranchIndex) % 10;
    hourPillar = buildPillar("시주", hourStemIndex, hourBranchIndex, dayStemIndex);
  }

  const yearPillar = buildPillar("년주", yearStemIndex, yearBranchIndex, dayStemIndex);
  const monthPillar = buildPillar("월주", monthStemIndex, monthBranchIndex, dayStemIndex);
  const dayPillar = buildPillar("일주", dayStemIndex, dayBranchIndex, dayStemIndex, true);

  // 7) 오행 카운트 (천간 4 + 지지 4, 시주 없으면 6개)
  const elementCounts: Record<Element, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const pillarsForCount = [yearPillar, monthPillar, dayPillar, ...(hourPillar ? [hourPillar] : [])];
  for (const p of pillarsForCount) {
    elementCounts[p.element] += 1;
    elementCounts[p.branchElement] += 1;
  }

  const maxCount = Math.max(...ELEMENTS.map((e) => elementCounts[e]));
  const dominantElements = ELEMENTS.filter((e) => elementCounts[e] === maxCount && maxCount > 0);
  const lackingElements = ELEMENTS.filter((e) => elementCounts[e] === 0);

  const dayStem = stemGanji(dayStemIndex);
  const zodiac = branchGanji(yearBranchIndex).zodiac;

  const summary = buildSummary({
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayStem,
    zodiac,
    elementCounts,
    dominantElements,
    lackingElements,
    timeKnown: input.timeKnown,
  });

  return {
    input,
    solar: { year: sy, month: sm, day: sd, hour, minute },
    pillars: { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar },
    dayMaster: {
      ko: dayStem.ko,
      hanja: dayStem.hanja,
      element: dayStem.element,
      yinYang: dayStem.yinYang,
    },
    zodiac,
    elementCounts,
    dominantElements,
    lackingElements,
    summary,
  };
}

function buildSummary(args: {
  yearPillar: Pillar;
  monthPillar: Pillar;
  dayPillar: Pillar;
  hourPillar: Pillar | null;
  dayStem: (typeof HEAVENLY_STEMS)[number];
  zodiac: string;
  elementCounts: Record<Element, number>;
  dominantElements: Element[];
  lackingElements: Element[];
  timeKnown: boolean;
}): string {
  const { yearPillar, monthPillar, dayPillar, hourPillar, dayStem, zodiac } = args;
  const lines: string[] = [];
  lines.push(
    `사주팔자: 년주 ${yearPillar.ganjiHanja}(${yearPillar.ganjiKo}) · 월주 ${monthPillar.ganjiHanja}(${monthPillar.ganjiKo}) · 일주 ${dayPillar.ganjiHanja}(${dayPillar.ganjiKo})` +
      (hourPillar ? ` · 시주 ${hourPillar.ganjiHanja}(${hourPillar.ganjiKo})` : " · 시주 미상"),
  );
  lines.push(`일간(나): ${dayStem.hanja}${dayStem.ko}(${dayStem.element}, ${dayStem.yinYang}) · 띠: ${zodiac}띠`);
  lines.push(
    `십성 — 년간 ${yearPillar.stemTenGod}/년지 ${yearPillar.branchTenGod}, 월간 ${monthPillar.stemTenGod}/월지 ${monthPillar.branchTenGod}` +
      (hourPillar ? `, 시간 ${hourPillar.stemTenGod}/시지 ${hourPillar.branchTenGod}` : ""),
  );
  lines.push(
    `오행 분포 — 목 ${args.elementCounts.목} · 화 ${args.elementCounts.화} · 토 ${args.elementCounts.토} · 금 ${args.elementCounts.금} · 수 ${args.elementCounts.수}`,
  );
  lines.push(
    `강한 오행: ${args.dominantElements.join(", ") || "-"} / 부족·없는 오행: ${args.lackingElements.join(", ") || "없음"}`,
  );
  if (!args.timeKnown) lines.push("※ 태어난 시각 미상 → 시주 제외하고 해석");
  return lines.join("\n");
}

// ---------------------------------------------------------------- 대운(大運)

export type DaewoonPeriod = {
  index: number; // 1부터
  startAge: number; // 이 대운이 시작하는 만 나이
  endAge: number; // 이 대운이 끝나는 만 나이(포함)
  ganjiKo: string;
  ganjiHanja: string;
  element: Element;
  stemTenGod: TenGod;
  branchTenGod: TenGod;
};

export type Daewoon = {
  direction: "순행" | "역행";
  /** 대운수: 첫 대운이 시작하는 만 나이 */
  startAge: number;
  periods: DaewoonPeriod[];
};

/** 태양의 하루 평균 이동 각도(도). 절기 경계까지 남은/지난 일수를 역산하는 초기값으로 쓴다. */
const MEAN_DAILY_MOTION = 360 / 365.2422;

const DAEWOON_PERIOD_COUNT = 8; // 80년 치 대운을 미리 계산해 둔다

/** jd 시점 이후 태양황경이 targetLambda(0~360)에 도달하기까지 남은 일수(양수) */
function daysForwardToLongitude(jd: number, targetLambda: number): number {
  let days = ((((targetLambda - solarLongitude(jd)) % 360) + 360) % 360) / MEAN_DAILY_MOTION;
  for (let i = 0; i < 6; i++) {
    let err = targetLambda - solarLongitude(jd + days);
    err = (((err + 180) % 360) + 360) % 360 - 180;
    days += err / MEAN_DAILY_MOTION;
  }
  return days;
}

/** jd 시점 이전 태양황경이 targetLambda(0~360)를 지났던 시점까지의 일수(양수) */
function daysBackwardToLongitude(jd: number, targetLambda: number): number {
  let days = ((((solarLongitude(jd) - targetLambda) % 360) + 360) % 360) / MEAN_DAILY_MOTION;
  for (let i = 0; i < 6; i++) {
    let err = solarLongitude(jd - days) - targetLambda;
    err = (((err + 180) % 360) + 360) % 360 - 180;
    days += err / MEAN_DAILY_MOTION;
  }
  return days;
}

/**
 * 대운(10년 단위 삶의 흐름) 계산.
 * 순행: 년간이 양(甲丙戊庚壬)이고 남자, 또는 년간이 음(乙丁己辛癸)이고 여자. 그 외는 역행.
 * 대운수(첫 대운이 시작하는 만 나이)는 생시부터 다음(순행)/이전(역행) 절기 경계까지의 일수를
 * 3으로 나눠 구한다(3일=1년, 통상적인 근사 규칙). 성별을 모르면 순행/역행을 정할 수 없어 null.
 */
export function computeDaewoon(chart: SajuChart, gender: "male" | "female" | "unknown"): Daewoon | null {
  if (gender === "unknown") return null;

  const { year: sy, month: sm, day: sd, hour, minute } = chart.solar;
  const jdnNoon = gregorianToJDN(sy, sm, sd);
  const jdUT = jdnNoon - 0.5 + (hour + minute / 60 - KST_OFFSET_HOURS) / 24;
  const lambda = solarLongitude(jdUT);

  const sajuYear = sm === 1 || (sm === 2 && lambda < 315) ? sy - 1 : sy;
  const yearStemIndex = ((((sajuYear - 4) % 10) + 10) % 10);
  const yearStem = stemGanji(yearStemIndex);

  const monthOrder = Math.floor((((lambda - 315 + 360) % 360) / 30));
  const monthStemIndex = ((yearStemIndex % 5) * 2 + 2 + monthOrder) % 10;
  const monthBranchIndex = (2 + monthOrder) % 12;

  const { stemIndex: dayStemIndex } = dayPillarIndices(sy, sm, sd);
  const dayStem = stemGanji(dayStemIndex);

  const isMale = gender === "male";
  const forward = (yearStem.yinYang === "양") === isMale;

  const lowerEdge = (315 + monthOrder * 30) % 360;
  const upperEdge = (315 + (monthOrder + 1) * 30) % 360;
  const days = forward ? daysForwardToLongitude(jdUT, upperEdge) : daysBackwardToLongitude(jdUT, lowerEdge);
  const startAge = Math.max(1, Math.round(days / 3));

  const periods: DaewoonPeriod[] = [];
  for (let n = 1; n <= DAEWOON_PERIOD_COUNT; n++) {
    const step = forward ? n : -n;
    const stem = stemGanji(monthStemIndex + step);
    const branch = branchGanji(monthBranchIndex + step);
    const branchMainStem = stemGanji(branch.mainStemIndex);
    periods.push({
      index: n,
      startAge: startAge + (n - 1) * 10,
      endAge: startAge + n * 10 - 1,
      ganjiKo: `${stem.ko}${branch.ko}`,
      ganjiHanja: `${stem.hanja}${branch.hanja}`,
      element: stem.element,
      stemTenGod: tenGod(dayStem.element, dayStem.yinYang, stem.element, stem.yinYang),
      branchTenGod: tenGod(dayStem.element, dayStem.yinYang, branchMainStem.element, branchMainStem.yinYang),
    });
  }

  return { direction: forward ? "순행" : "역행", startAge, periods };
}
