import type { SajuChart } from "@/lib/saju/engine";
import { computeDaewoon, dayGanji } from "@/lib/saju/engine";

export type ReadingKind = "daily" | "natal" | "compatibility";

const PERSONA =
  "당신은 30년 경력의 정통 사주명리 상담가이자, 어려운 얘기도 재치있게 풀어내는 입담 좋은 스토리텔러입니다. " +
  "아래에 이미 정확히 계산된 사주 명식(및 있다면 대운 정보)을 바탕으로 해석만 합니다. " +
  "명식(천간·지지·오행·십성)과 대운 정보는 절대 새로 만들거나 바꾸지 말고 주어진 값을 그대로 사용하세요. " +
  "모든 문단에서 오행의 강약, 일간과 십성의 관계, (주어졌다면) 대운의 흐름 중 최소 하나를 구체적 근거로 짧게 짚고 넘어가세요 — " +
  "근거 없이 '노력하면 좋아진다', '마음가짐이 중요하다' 같은 상투적이고 뭉뚱그린 문장은 쓰지 마세요. " +
  "문단마다 최소 한 번은 비유나 위트있는 표현으로 읽는 재미를 주되(예: 일상적인 상황에 빗대기, 가벼운 농담), " +
  "무례하거나 가벼워 보이지 않게 전문가의 톤은 지킵니다. " +
  "단정적 예언이나 공포 조장은 피하고, 현실적인 조언으로 마무리합니다. 존댓말, 한국어, 마크다운으로 작성합니다.";

const CLOSING =
  "마지막에 '이 해석은 참고용입니다.'라는 한 줄을 덧붙인 뒤, 그 다음 줄에 정확히 [END] 만 단독으로 출력하세요.";

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

/** KST 기준 만 나이 */
function currentManAge(birthYear: number, birthMonth: number, birthDay: number): number {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  let age = kst.getUTCFullYear() - birthYear;
  const hadBirthdayThisYear =
    kst.getUTCMonth() + 1 > birthMonth ||
    (kst.getUTCMonth() + 1 === birthMonth && kst.getUTCDate() >= birthDay);
  if (!hadBirthdayThisYear) age -= 1;
  return age;
}

/**
 * 대운(10년 단위 삶의 흐름) 그라운딩 블록.
 * 성별을 모르면 순행/역행을 정할 수 없으므로, AI가 대운 나이를 임의로 지어내지 않도록
 * 명식만 근거로 삼으라고 명시적으로 안내한다(할루시네이션 방지).
 */
function daewoonBlock(chart: SajuChart, gender?: string): string {
  const g = gender === "male" || gender === "female" ? gender : "unknown";
  const daewoon = computeDaewoon(chart, g);
  if (!daewoon) {
    return (
      "[대운]\n성별 정보가 없어 대운의 순행/역행을 확정할 수 없습니다. " +
      "'대운의 흐름' 항목에서는 특정 나이대의 대운 간지를 지어내지 말고, 명식(오행·십성)만 근거로 " +
      "일반적인 삶의 흐름과 시기별 조언을 제시하세요."
    );
  }

  const age = currentManAge(chart.solar.year, chart.solar.month, chart.solar.day);
  const current = daewoon.periods.find((p) => age >= p.startAge && age <= p.endAge);
  const upcoming = daewoon.periods.filter((p) => p.startAge > age).slice(0, 3);
  const fmt = (p: (typeof daewoon.periods)[number]) =>
    `${p.ganjiHanja}(${p.ganjiKo}, 만 ${p.startAge}~${p.endAge}세, 십성 ${p.stemTenGod}/${p.branchTenGod})`;

  const lines = [
    "[대운]",
    `대운 방향: ${daewoon.direction} (대운수 ${daewoon.startAge} — 만 ${daewoon.startAge}세부터 10년 단위로 대운이 바뀜)`,
    current
      ? `현재(만 ${age}세) 대운: ${fmt(current)}`
      : `현재(만 ${age}세)는 아직 첫 대운(만 ${daewoon.startAge}세~) 시작 전으로, 년주의 기운 아래 있는 시기입니다.`,
  ];
  if (upcoming.length) {
    lines.push(`앞으로의 대운 흐름: ${upcoming.map(fmt).join(" → ")}`);
  }
  return lines.join("\n");
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
    daewoonBlock(chart, person.gender),
    "",
    "위 명식을 바탕으로 아래 구성으로 사주팔자 풀이를 작성하세요. 각 항목은 소제목(##)으로 구분합니다.",
    "## 총평 — 이 사주의 큰 그림",
    "## 타고난 성격과 기질 (일간과 오행 중심)",
    "## 재물운",
    "## 직업·적성과 사회운",
    "## 애정운과 결혼운",
    "## 건강운",
    "## 대운의 흐름과 삶의 조언 (위 [대운] 정보의 현재·다음 대운 간지와 십성을 반드시 근거로 사용)",
    "",
    "각 항목은 3~5문장으로 구체적으로 쓰고, 오행 균형(강한/부족한 오행)과 십성을 근거로 언급하세요. " + CLOSING,
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
    "각 항목은 2~4문장으로, 오늘 하루에 바로 적용할 수 있게 구체적으로 쓰세요. " + CLOSING,
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
      "각 항목은 2~5문장으로 구체적으로 쓰고, " +
      CLOSING,
  ].join("\n");
}
