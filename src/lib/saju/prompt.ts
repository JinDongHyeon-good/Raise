import type { SajuChart } from "@/lib/saju/engine";
import { dayGanji } from "@/lib/saju/engine";

export type ReadingKind = "daily" | "natal" | "compatibility";

const PERSONA =
  "당신은 30년 경력의 정통 사주명리 상담가입니다. 아래에 이미 정확히 계산된 사주 명식을 바탕으로 해석만 합니다. " +
  "명식(천간·지지·오행·십성)은 절대 새로 만들거나 바꾸지 말고 주어진 값을 그대로 사용하세요. " +
  "따뜻하지만 전문적인 어조로, 근거(오행의 강약, 일간과 십성 관계, 지지 관계)를 짧게 곁들여 설명합니다. " +
  "단정적 예언이나 공포 조장은 피하고, 현실적인 조언으로 마무리합니다. 존댓말, 한국어, 마크다운으로 작성합니다.";

function genderKo(g?: string) {
  if (g === "male") return "남성";
  if (g === "female") return "여성";
  return "미상";
}

function chartBlock(chart: SajuChart, label = "명식"): string {
  const s = chart.solar;
  const timeStr = chart.input.timeKnown
    ? `${String(chart.solar.hour).padStart(2, "0")}:${String(chart.solar.minute).padStart(2, "0")}`
    : "미상";
  return [
    `[${label}]`,
    `양력 생년월일시: ${s.year}년 ${s.month}월 ${s.day}일 ${timeStr}` +
      (chart.input.calendar === "lunar" ? " (음력 입력을 양력으로 변환)" : ""),
    chart.summary,
  ].join("\n");
}

export function buildNatalPrompt(
  chart: SajuChart,
  person: { name?: string; gender?: string },
): string {
  const name = person.name?.trim() || "의뢰인";
  return [
    PERSONA,
    "",
    `의뢰인: ${name} (${genderKo(person.gender)})`,
    chartBlock(chart),
    "",
    "위 명식을 바탕으로 아래 구성으로 사주팔자 풀이를 작성하세요. 각 항목은 소제목(##)으로 구분합니다.",
    "## 총평 — 이 사주의 큰 그림",
    "## 타고난 성격과 기질 (일간과 오행 중심)",
    "## 재물운",
    "## 직업·적성과 사회운",
    "## 애정운과 결혼운",
    "## 건강운",
    "## 대운의 흐름과 삶의 조언",
    "",
    "각 항목은 3~5문장으로 구체적으로 쓰고, 오행 균형(강한/부족한 오행)과 십성을 근거로 언급하세요. " +
      "마지막에 '이 해석은 참고용입니다.'라는 한 줄을 덧붙이세요.",
  ].join("\n");
}

export function buildDailyPrompt(
  chart: SajuChart,
  todayLabel: string,
  person: { name?: string; gender?: string },
): string {
  const name = person.name?.trim() || "의뢰인";
  const today = dayGanji(
    Number(todayLabel.slice(0, 4)),
    Number(todayLabel.slice(5, 7)),
    Number(todayLabel.slice(8, 10)),
  );
  return [
    PERSONA,
    "",
    `의뢰인: ${name} (${genderKo(person.gender)})`,
    chartBlock(chart, "나의 명식"),
    "",
    `오늘 날짜: ${todayLabel}`,
    `오늘의 일진: ${today.ganjiHanja}(${today.ganjiKo}) — 천간 오행 ${today.stemElement}, 지지 오행 ${today.branchElement}`,
    "",
    "나의 일간·오행과 '오늘의 일진'의 관계(상생/상극, 십성)를 근거로 오늘 하루의 운세를 작성하세요. 각 항목은 소제목(##)으로 구분합니다.",
    "## 오늘의 총운",
    "## 재물운",
    "## 애정운",
    "## 건강·컨디션",
    "## 오늘의 행운 포인트 (행운 방향/색/시간대와 유의할 점)",
    "",
    "각 항목은 2~4문장으로, 오늘 하루에 바로 적용할 수 있게 구체적으로 쓰세요. " +
      "마지막에 '이 해석은 참고용입니다.'라는 한 줄을 덧붙이세요.",
  ].join("\n");
}

export function buildCompatibilityPrompt(
  chartA: SajuChart,
  chartB: SajuChart,
  people: { nameA?: string; genderA?: string; nameB?: string; genderB?: string },
): string {
  const a = people.nameA?.trim() || "첫 번째 분";
  const b = people.nameB?.trim() || "두 번째 분";
  return [
    PERSONA,
    "",
    `${a} (${genderKo(people.genderA)})`,
    chartBlock(chartA, `${a}의 명식`),
    "",
    `${b} (${genderKo(people.genderB)})`,
    chartBlock(chartB, `${b}의 명식`),
    "",
    "두 사람의 일간·오행·십성 관계(상생/상극, 조후 보완)를 근거로 궁합을 작성하세요. 각 항목은 소제목(##)으로 구분합니다.",
    "## 궁합 총평과 종합 점수 (100점 만점)",
    `## ${a}의 기질과 연애 스타일`,
    `## ${b}의 기질과 연애 스타일`,
    "## 두 사람의 오행 궁합 (서로 채워주는 점 / 부딪히는 점)",
    "## 연애·결혼 현실 궁합",
    "## 갈등 포인트와 오래 잘 지내는 법",
    "",
    "종합 점수는 첫 항목 첫 문장에 '종합 점수: NN점' 형식으로 제시하고, 근거를 함께 설명하세요. " +
      "각 항목은 2~5문장으로 구체적으로 쓰고, 마지막에 '이 해석은 참고용입니다.'라는 한 줄을 덧붙이세요.",
  ].join("\n");
}
