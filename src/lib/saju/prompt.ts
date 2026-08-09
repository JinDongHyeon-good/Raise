import type { AppLocale } from "@/i18n/routing";
import type { Pillar, SajuChart } from "@/lib/saju/engine";
import { computeDaewoon, dayGanji } from "@/lib/saju/engine";
import { getElementLabel, getTenGodLabel, getYinYangLabel, getZodiacLabel, type TenGod } from "@/lib/saju/constants";

/** 년/월/시주의 stemTenGod는 타입상 "일간"과 유니언이지만, 그 값은 일주에서만 나온다. */
function nonDayTenGod(t: TenGod | "일간"): TenGod {
  return t as TenGod;
}

export type ReadingKind = "daily" | "natal" | "compatibility";

const PERSONA: Record<AppLocale, string> = {
  ko:
    "당신은 30년 경력의 정통 사주명리 상담가이자, 어려운 얘기도 재치있게 풀어내는 입담 좋은 스토리텔러입니다. " +
    "아래에 이미 정확히 계산된 사주 명식(및 있다면 대운 정보)을 바탕으로 해석만 합니다. " +
    "명식(천간·지지·오행·십성)과 대운 정보는 절대 새로 만들거나 바꾸지 말고 주어진 값을 그대로 사용하세요. " +
    "모든 문단에서 오행의 강약, 일간과 십성의 관계, (주어졌다면) 대운의 흐름 중 최소 하나를 구체적 근거로 짧게 짚고 넘어가세요 — " +
    "근거 없이 '노력하면 좋아진다', '마음가짐이 중요하다' 같은 상투적이고 뭉뚱그린 문장은 쓰지 마세요. " +
    "문단마다 최소 한 번은 비유나 위트있는 표현으로 읽는 재미를 주되(예: 일상적인 상황에 빗대기, 가벼운 농담), " +
    "무례하거나 가벼워 보이지 않게 전문가의 톤은 지킵니다. " +
    "단정적 예언이나 공포 조장은 피하고, 현실적인 조언으로 마무리합니다. 존댓말, 한국어, 마크다운으로 작성합니다.",
  en:
    "You are a Four Pillars of Destiny (BaZi/Saju) consultant with 30 years of experience, and a witty, " +
    "engaging storyteller who makes even dry topics fun to read. You only interpret the chart (and luck-cycle " +
    "data, if given) that has already been precisely calculated below. Never invent or alter the chart " +
    "(stems/branches, elements, ten gods) or luck-cycle data — use exactly the given values. " +
    "In every paragraph, ground your point in at least one concrete fact: the strength/weakness of an element, " +
    "the Day Master's relationship to a Ten God, or (if given) the current/upcoming luck cycle — never write vague " +
    "filler like 'things will improve if you work hard' without tying it to the chart. Include at least one witty " +
    "line, relatable analogy, or light joke per paragraph, while keeping an expert, respectful tone throughout. " +
    "Avoid absolute predictions or fear-mongering, and close with grounded, practical advice. Write in English, " +
    "in Markdown.",
  ja:
    "あなたは30年のキャリアを持つ正統な四柱推命の鑑定士であり、難しい話も機知に富んで語れる話し上手なストーリーテラーでもあります。" +
    "以下にすでに正確に計算された命式（および大運情報があればそれも）だけを根拠に解釈します。" +
    "命式（天干・地支・五行・十神）や大運情報を勝手に作り変えず、与えられた値をそのまま使ってください。" +
    "すべての段落で、五行の強弱、日主と十神の関係、（あれば）大運の流れのうち少なくとも一つを具体的な根拠として短く触れてください——" +
    "根拠のない「頑張れば良くなる」「気持ちが大事」のような紋切り型の曖昧な文は書かないでください。" +
    "各段落に最低一度は例え話やユーモアのある表現を入れて読んで楽しい文章にしつつ、失礼にならず専門家らしいトーンは保ってください。" +
    "断定的な予言や不安をあおる表現は避け、現実的なアドバイスで締めくくってください。日本語、丁寧語、マークダウンで作成します。",
};

const CLOSING: Record<AppLocale, string> = {
  ko: "마지막에 '이 해석은 참고용입니다.'라는 한 줄을 덧붙인 뒤, 그 다음 줄에 정확히 [END] 만 단독으로 출력하세요.",
  en: "At the very end, add a line saying this reading is for reference only, then on the next line output exactly [END] alone.",
  ja: "最後に「この鑑定は参考用です。」という一文を付け加え、その次の行に正確に[END]だけを単独で出力してください。",
};

const GENDER_LABEL: Record<AppLocale, { male: string; female: string; unknown: string }> = {
  ko: { male: "남성", female: "여성", unknown: "미상" },
  en: { male: "male", female: "female", unknown: "unspecified" },
  ja: { male: "男性", female: "女性", unknown: "不明" },
};

function genderLabel(locale: AppLocale, g?: string) {
  if (g === "male") return GENDER_LABEL[locale].male;
  if (g === "female") return GENDER_LABEL[locale].female;
  return GENDER_LABEL[locale].unknown;
}

const DEFAULT_CLIENT_NAME: Record<AppLocale, string> = {
  ko: "의뢰인",
  en: "the client",
  ja: "依頼人",
};

const PILLAR_LABELS: Record<AppLocale, { year: string; month: string; day: string; hour: string }> = {
  ko: { year: "년주", month: "월주", day: "일주", hour: "시주" },
  ja: { year: "年柱", month: "月柱", day: "日柱", hour: "時柱" },
  en: { year: "Year Pillar", month: "Month Pillar", day: "Day Pillar", hour: "Hour Pillar" },
};

/** ko는 간지 한자+한글 독음을 함께, en/ja는 한자만 표기한다(독음은 로케일 의미가 없음). */
function pillarText(p: Pillar, locale: AppLocale) {
  return locale === "ko" ? `${p.ganjiHanja}(${p.ganjiKo})` : p.ganjiHanja;
}

/** chart.summary는 한글 라벨이 박혀 있어 ko 전용. en/ja는 원본 필드로 새로 조립한다. */
function buildChartFactsBlock(chart: SajuChart, locale: AppLocale): string {
  if (locale === "ko") return chart.summary;

  const { year, month, day, hour } = chart.pillars;
  const L = PILLAR_LABELS[locale];
  const unknownWord = locale === "ja" ? "不明" : "unknown";

  const lines: string[] = [];
  lines.push(
    `${locale === "ja" ? "四柱" : "Four Pillars"}: ${L.year} ${pillarText(year, locale)} · ${L.month} ${pillarText(month, locale)} · ${L.day} ${pillarText(day, locale)}` +
      (hour ? ` · ${L.hour} ${pillarText(hour, locale)}` : ` · ${L.hour} ${unknownWord}`),
  );

  const dm = chart.dayMaster;
  const zodiacLabel = getZodiacLabel(chart.zodiac, locale);
  lines.push(
    locale === "ja"
      ? `日主（自分）: ${dm.hanja}（${getElementLabel(dm.element, locale)}・${getYinYangLabel(dm.yinYang, locale)}） ・干支: ${zodiacLabel}`
      : `Day Master: ${dm.hanja} (${getElementLabel(dm.element, locale)}, ${getYinYangLabel(dm.yinYang, locale)}) · Zodiac: ${zodiacLabel}`,
  );

  const tenGodsParts = [
    `${L.year} ${getTenGodLabel(nonDayTenGod(year.stemTenGod), locale)}/${getTenGodLabel(year.branchTenGod, locale)}`,
    `${L.month} ${getTenGodLabel(nonDayTenGod(month.stemTenGod), locale)}/${getTenGodLabel(month.branchTenGod, locale)}`,
    ...(hour
      ? [`${L.hour} ${getTenGodLabel(nonDayTenGod(hour.stemTenGod), locale)}/${getTenGodLabel(hour.branchTenGod, locale)}`]
      : []),
  ];
  lines.push(`${locale === "ja" ? "十神" : "Ten Gods"} — ${tenGodsParts.join(", ")}`);

  const elementOrder = ["목", "화", "토", "금", "수"] as const;
  const distText = elementOrder.map((e) => `${getElementLabel(e, locale)} ${chart.elementCounts[e]}`).join(" · ");
  lines.push(`${locale === "ja" ? "五行の分布" : "Five Elements distribution"} — ${distText}`);

  const noneWord = locale === "ja" ? "なし" : "none";
  const dominant = chart.dominantElements.map((e) => getElementLabel(e, locale)).join(", ") || "-";
  const lacking = chart.lackingElements.map((e) => getElementLabel(e, locale)).join(", ") || noneWord;
  lines.push(
    locale === "ja"
      ? `強い五行: ${dominant} / 不足・欠けている五行: ${lacking}`
      : `Dominant elements: ${dominant} / Lacking elements: ${lacking}`,
  );

  if (!chart.input.timeKnown) {
    lines.push(
      locale === "ja"
        ? "※生まれた時刻不明 → 時柱を除いて解釈"
        : "※ Birth time unknown → interpreted without the Hour Pillar",
    );
  }

  return lines.join("\n");
}

function chartBlock(chart: SajuChart, locale: AppLocale, label?: string): string {
  const s = chart.solar;
  const defaultLabel = locale === "ko" ? "명식" : locale === "ja" ? "命式" : "Chart";
  const timeStr = chart.input.timeKnown
    ? `${String(s.hour).padStart(2, "0")}:${String(s.minute).padStart(2, "0")}`
    : locale === "ko"
      ? "미상"
      : locale === "ja"
        ? "不明"
        : "unknown";
  const lunarNote =
    chart.input.calendar === "lunar"
      ? locale === "ko"
        ? " (음력 입력을 양력으로 변환)"
        : locale === "ja"
          ? "（旧暦入力を新暦に変換）"
          : " (converted from lunar to solar)"
      : "";
  const dateLine =
    locale === "ko"
      ? `양력 생년월일시: ${s.year}년 ${s.month}월 ${s.day}일 ${timeStr}${lunarNote}`
      : locale === "ja"
        ? `生年月日時（新暦）: ${s.year}年${s.month}月${s.day}日 ${timeStr}${lunarNote}`
        : `Birth date/time (solar): ${s.year}-${String(s.month).padStart(2, "0")}-${String(s.day).padStart(2, "0")} ${timeStr}${lunarNote}`;

  return [`[${label ?? defaultLabel}]`, dateLine, buildChartFactsBlock(chart, locale)].join("\n");
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
function daewoonBlock(chart: SajuChart, locale: AppLocale, gender?: string): string {
  const g = gender === "male" || gender === "female" ? gender : "unknown";
  const daewoon = computeDaewoon(chart, g);

  if (!daewoon) {
    return locale === "ko"
      ? "[대운]\n성별 정보가 없어 대운의 순행/역행을 확정할 수 없습니다. " +
          "'대운의 흐름' 항목에서는 특정 나이대의 대운 간지를 지어내지 말고, 명식(오행·십성)만 근거로 " +
          "일반적인 삶의 흐름과 시기별 조언을 제시하세요."
      : locale === "ja"
        ? "[大運]\n性別情報がないため大運の順行・逆行を確定できません。" +
          "「大運の流れ」の項目では特定の年齢の大運干支を作り出さず、命式（五行・十神）だけを根拠に" +
          "一般的な人生の流れと時期ごとのアドバイスを提示してください。"
        : "[Luck Cycles]\nGender is unknown, so the forward/backward direction of the luck cycles can't be " +
          "determined. In the 'luck cycle' section, don't invent specific ages or cycle pillars — base your " +
          "advice only on the chart itself (elements and ten gods).";
  }

  const age = currentManAge(chart.solar.year, chart.solar.month, chart.solar.day);
  const current = daewoon.periods.find((p) => age >= p.startAge && age <= p.endAge);
  const upcoming = daewoon.periods.filter((p) => p.startAge > age).slice(0, 3);
  const fmt = (p: (typeof daewoon.periods)[number]) => {
    const ganji = locale === "ko" ? `${p.ganjiHanja}(${p.ganjiKo})` : p.ganjiHanja;
    const ageRange =
      locale === "ko" ? `만 ${p.startAge}~${p.endAge}세` : locale === "ja" ? `満${p.startAge}〜${p.endAge}歳` : `age ${p.startAge}-${p.endAge}`;
    const gods = `${getTenGodLabel(p.stemTenGod, locale)}/${getTenGodLabel(p.branchTenGod, locale)}`;
    return locale === "ko"
      ? `${ganji}, ${ageRange}, 십성 ${gods}`
      : locale === "ja"
        ? `${ganji}、${ageRange}、十神 ${gods}`
        : `${ganji} (${ageRange}, Ten Gods ${gods})`;
  };

  const directionWord =
    locale === "ko" ? daewoon.direction : locale === "ja" ? (daewoon.direction === "순행" ? "順行" : "逆行") : daewoon.direction === "순행" ? "forward" : "backward";

  const lines: string[] = [];
  if (locale === "ko") {
    lines.push("[대운]");
    lines.push(`대운 방향: ${directionWord} (대운수 ${daewoon.startAge} — 만 ${daewoon.startAge}세부터 10년 단위로 대운이 바뀜)`);
    lines.push(
      current
        ? `현재(만 ${age}세) 대운: ${fmt(current)}`
        : `현재(만 ${age}세)는 아직 첫 대운(만 ${daewoon.startAge}세~) 시작 전으로, 년주의 기운 아래 있는 시기입니다.`,
    );
    if (upcoming.length) lines.push(`앞으로의 대운 흐름: ${upcoming.map(fmt).join(" → ")}`);
  } else if (locale === "ja") {
    lines.push("[大運]");
    lines.push(`大運の方向: ${directionWord}（大運数 ${daewoon.startAge} — 満${daewoon.startAge}歳から10年単位で大運が変わる）`);
    lines.push(
      current
        ? `現在（満${age}歳）の大運: ${fmt(current)}`
        : `現在（満${age}歳）はまだ最初の大運（満${daewoon.startAge}歳〜）開始前で、年柱の気の影響下にある時期です。`,
    );
    if (upcoming.length) lines.push(`今後の大運の流れ: ${upcoming.map(fmt).join(" → ")}`);
  } else {
    lines.push("[Luck Cycles]");
    lines.push(
      `Direction: ${directionWord} (first cycle starts at age ${daewoon.startAge}; each cycle lasts 10 years)`,
    );
    lines.push(
      current
        ? `Current luck cycle (age ${age}): ${fmt(current)}`
        : `Age ${age} is still before the first luck cycle (starts at age ${daewoon.startAge}) — currently under the influence of the Year Pillar.`,
    );
    if (upcoming.length) lines.push(`Upcoming luck cycles: ${upcoming.map(fmt).join(" → ")}`);
  }

  return lines.join("\n");
}

const NATAL_HEADINGS: Record<AppLocale, string[]> = {
  ko: [
    "## 총평 — 이 사주의 큰 그림",
    "## 타고난 성격과 기질 (일간과 오행 중심)",
    "## 재물운",
    "## 직업·적성과 사회운",
    "## 애정운과 결혼운",
    "## 건강운",
    "## 대운의 흐름과 삶의 조언 (위 [대운] 정보의 현재·다음 대운 간지와 십성을 반드시 근거로 사용)",
  ],
  en: [
    "## Overview — the big picture",
    "## Personality & temperament (based on the Day Master and elements)",
    "## Wealth",
    "## Career & aptitude",
    "## Love & marriage",
    "## Health",
    "## Luck cycles & life advice (must reference the current/upcoming luck cycles and Ten Gods from [Luck Cycles] above)",
  ],
  ja: [
    "## 総評 — この命式の全体像",
    "## 生まれ持った性格と気質（日主・五行中心）",
    "## 金運",
    "## 仕事運・適性",
    "## 恋愛運・結婚運",
    "## 健康運",
    "## 大運の流れと人生のアドバイス（上記[大運]の現在・今後の大運干支と十神を必ず根拠にする）",
  ],
};

const NATAL_INSTRUCTIONS_HEAD: Record<AppLocale, string> = {
  ko: "위 명식을 바탕으로 아래 구성으로 사주팔자 풀이를 작성하세요. 각 항목은 소제목(##)으로 구분합니다.",
  en: "Based on the chart above, write the reading with the sections below, each as a Markdown heading (##).",
  ja: "上記の命式をもとに、以下の構成で鑑定を作成してください。各項目は見出し(##)で区切ります。",
};

const NATAL_INSTRUCTIONS_TAIL: Record<AppLocale, string> = {
  ko: "각 항목은 3~5문장으로 구체적으로 쓰고, 오행 균형(강한/부족한 오행)과 십성을 근거로 언급하세요. ",
  en: "Write 3-5 concrete sentences per section, grounded in the element balance (dominant/lacking) and Ten Gods. ",
  ja: "各項目は3〜5文で具体的に書き、五行のバランス（強い/不足）と十神を根拠として言及してください。",
};

export function buildNatalPrompt(
  chart: SajuChart,
  person: { name?: string; gender?: string },
  locale: AppLocale = "ko",
): string {
  const name = person.name?.trim() || DEFAULT_CLIENT_NAME[locale];
  const clientLabel = locale === "ko" ? `의뢰인: ${name}` : locale === "ja" ? `依頼人: ${name}` : `Client: ${name}`;
  return [
    PERSONA[locale],
    "",
    `${clientLabel} (${genderLabel(locale, person.gender)})`,
    chartBlock(chart, locale),
    "",
    daewoonBlock(chart, locale, person.gender),
    "",
    NATAL_INSTRUCTIONS_HEAD[locale],
    ...NATAL_HEADINGS[locale],
    "",
    NATAL_INSTRUCTIONS_TAIL[locale] + CLOSING[locale],
  ].join("\n");
}

const DAILY_HEADINGS: Record<AppLocale, string[]> = {
  ko: ["## 오늘의 총운", "## 재물운", "## 애정운", "## 건강·컨디션", "## 오늘의 행운 포인트 (행운 방향/색/시간대와 유의할 점)"],
  en: [
    "## Overall fortune today",
    "## Wealth",
    "## Love",
    "## Health & condition",
    "## Today's lucky pointers (direction/color/time and what to watch for)",
  ],
  ja: ["## 今日の総運", "## 金運", "## 恋愛運", "## 健康・体調", "## 今日のラッキーポイント（方角・色・時間帯と注意点）"],
};

const DAILY_INSTRUCTIONS_HEAD: Record<AppLocale, string> = {
  ko: "나의 일간·오행과 '오늘의 일진'의 관계(상생/상극, 십성)를 근거로 오늘 하루의 운세를 작성하세요. 각 항목은 소제목(##)으로 구분합니다.",
  en: "Base today's fortune on the relationship (generating/controlling, Ten Gods) between the Day Master/elements and today's day pillar. Each section as a Markdown heading (##).",
  ja: "自分の日主・五行と「今日の日辰」の関係（相生・相剋、十神）を根拠に今日の運勢を作成してください。各項目は見出し(##)で区切ります。",
};

const DAILY_INSTRUCTIONS_TAIL: Record<AppLocale, string> = {
  ko: "각 항목은 2~4문장으로, 오늘 하루에 바로 적용할 수 있게 구체적으로 쓰세요. ",
  en: "Write 2-4 concrete sentences per section that can be applied today. ",
  ja: "各項目は2〜4文で、今日すぐ活かせるように具体的に書いてください。",
};

export function buildDailyPrompt(
  chart: SajuChart,
  todayLabel: string,
  person: { name?: string; gender?: string },
  locale: AppLocale = "ko",
): string {
  const name = person.name?.trim() || DEFAULT_CLIENT_NAME[locale];
  const clientLabel = locale === "ko" ? `의뢰인: ${name}` : locale === "ja" ? `依頼人: ${name}` : `Client: ${name}`;
  const today = dayGanji(
    Number(todayLabel.slice(0, 4)),
    Number(todayLabel.slice(5, 7)),
    Number(todayLabel.slice(8, 10)),
  );
  const todayGanjiText = locale === "ko" ? `${today.ganjiHanja}(${today.ganjiKo})` : today.ganjiHanja;
  const stemEl = getElementLabel(today.stemElement, locale);
  const branchEl = getElementLabel(today.branchElement, locale);
  const todayLine =
    locale === "ko"
      ? `오늘의 일진: ${todayGanjiText} — 천간 오행 ${stemEl}, 지지 오행 ${branchEl}`
      : locale === "ja"
        ? `今日の日辰: ${todayGanjiText} — 天干五行 ${stemEl}、地支五行 ${branchEl}`
        : `Today's day pillar: ${todayGanjiText} — stem element ${stemEl}, branch element ${branchEl}`;
  const dateLabel = locale === "ko" ? "오늘 날짜" : locale === "ja" ? "今日の日付" : "Today's date";
  const chartLabel = locale === "ko" ? "나의 명식" : locale === "ja" ? "自分の命式" : "My chart";

  return [
    PERSONA[locale],
    "",
    `${clientLabel} (${genderLabel(locale, person.gender)})`,
    chartBlock(chart, locale, chartLabel),
    "",
    `${dateLabel}: ${todayLabel}`,
    todayLine,
    "",
    DAILY_INSTRUCTIONS_HEAD[locale],
    ...DAILY_HEADINGS[locale],
    "",
    DAILY_INSTRUCTIONS_TAIL[locale] + CLOSING[locale],
  ].join("\n");
}

const COMPAT_HEAD: Record<AppLocale, string> = {
  ko: "두 사람의 일간·오행·십성 관계(상생/상극, 조후 보완)를 근거로 궁합을 작성하세요. 각 항목은 소제목(##)으로 구분합니다.",
  en: "Base the compatibility reading on the relationship between both charts' Day Masters, elements, and Ten Gods (generating/controlling, seasonal balance). Each section as a Markdown heading (##).",
  ja: "二人の日主・五行・十神の関係（相生・相剋、調候の補完）を根拠に相性を作成してください。各項目は見出し(##)で区切ります。",
};

const COMPAT_TAIL: Record<AppLocale, string> = {
  ko: "종합 점수는 첫 항목 첫 문장에 '종합 점수: NN점' 형식으로 제시하고, 근거를 함께 설명하세요. 각 항목은 2~5문장으로 구체적으로 쓰고, ",
  en: "In the first sentence of the first section, give an overall score as 'Overall score: NN/100' with reasoning. Write 2-5 concrete sentences per section. ",
  ja: "総合点は最初の項目の最初の文で「総合点: NN点」の形式で示し、根拠も説明してください。各項目は2〜5文で具体的に書き、",
};

export function buildCompatibilityPrompt(
  chartA: SajuChart,
  chartB: SajuChart,
  people: { nameA?: string; genderA?: string; nameB?: string; genderB?: string },
  locale: AppLocale = "ko",
): string {
  const a = people.nameA?.trim() || (locale === "ko" ? "첫 번째 분" : locale === "ja" ? "お一人目" : "Person A");
  const b = people.nameB?.trim() || (locale === "ko" ? "두 번째 분" : locale === "ja" ? "お二人目" : "Person B");
  const chartLabel = (who: string) =>
    locale === "ko" ? `${who}의 명식` : locale === "ja" ? `${who}の命式` : `${who}'s chart`;

  const headings =
    locale === "ko"
      ? [
          "## 궁합 총평과 종합 점수 (100점 만점)",
          `## ${a}의 기질과 연애 스타일`,
          `## ${b}의 기질과 연애 스타일`,
          "## 두 사람의 오행 궁합 (서로 채워주는 점 / 부딪히는 점)",
          "## 연애·결혼 현실 궁합",
          "## 갈등 포인트와 오래 잘 지내는 법",
        ]
      : locale === "ja"
        ? [
            "## 相性の総評と総合点（100点満点）",
            `## ${a}の気質と恋愛スタイル`,
            `## ${b}の気質と恋愛スタイル`,
            "## 二人の五行の相性（補い合う点／ぶつかる点）",
            "## 恋愛・結婚の現実的な相性",
            "## 衝突しやすいポイントと長く仲良く過ごす方法",
          ]
        : [
            "## Overall compatibility & score (out of 100)",
            `## ${a}'s temperament & love style`,
            `## ${b}'s temperament & love style`,
            "## Elemental compatibility (what complements / clashes)",
            "## Real-world love & marriage compatibility",
            "## Friction points & how to stay happy long-term",
          ];

  return [
    PERSONA[locale],
    "",
    `${a} (${genderLabel(locale, people.genderA)})`,
    chartBlock(chartA, locale, chartLabel(a)),
    "",
    `${b} (${genderLabel(locale, people.genderB)})`,
    chartBlock(chartB, locale, chartLabel(b)),
    "",
    COMPAT_HEAD[locale],
    ...headings,
    "",
    COMPAT_TAIL[locale] + CLOSING[locale],
  ].join("\n");
}
