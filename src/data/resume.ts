export type CareerItem = {
  company: string;
  role: string;
  period: string;
  href?: string;
};

export type ProjectItem = {
  company: string;
  name: string;
  period: string;
  summary?: string;
  bullets: string[];
};

export type SkillCategory = {
  title: string;
  items: string[];
};

export const resumeHeader = {
  name: "진동현",
  title: "AI FullStack Developer",
  intro:
    "단순히 코드를 구현하는 것을 넘어, 비즈니스 도메인을 명확하게 인지하고 사용자와 고객이 진정으로 필요로 하는 가치를 개발하는 것을 가장 중요한 요소라고 생각합니다.",
};

export const careers: CareerItem[] = [
  {
    company: "아스타 AI",
    role: "FullStack Developer · 기술리더",
    period: "2025.03 ~ 재직중",
    href: "https://www.astarcorp.ai/",
  },
  {
    company: "EY한영",
    role: "FrontEnd Developer · 기술리더",
    period: "2024.12 ~ 2025.01 (2개월)",
    href: "https://www.ey.com/en_kr",
  },
  {
    company: "교보문고",
    role: "FrontEnd Developer",
    period: "2023.11 ~ 2024.11 (1년 1개월)",
    href: "https://company.kyobobook.co.kr/",
  },
  {
    company: "RSQUARE",
    role: "FullStack Developer",
    period: "2019.08 ~ 2023.10 (4년 2개월)",
    href: "https://www.rsquare.co.kr/",
  },
];

export const projects: ProjectItem[] = [
  {
    company: "아스타 AI",
    name: "MOAST",
    period: "2025.06 ~",
    summary:
      "시드 단계 마케팅 도메인 스타트업에서 AI 기술 조직을 이끄는 기술 리더로서 AI 전환(AX)을 주도했습니다.",
    bullets: [
      "레퍼런스 이미지 기반 생성/리터치 기능 개발",
      "OCR 및 객체 탐지 기능 개발",
      "다양한 LLM API 기반 AI 에이전트 및 프롬프트 엔지니어링",
      "AI 기능 통합 캔버스 에디터 개발",
      "채팅 기반 이미지 컨트롤 기능 구축",
      "1인 풀스택 개발",
    ],
  },
  {
    company: "아스타 AI",
    name: "삼성카드 AI 솔루션 (POC 우수상)",
    period: "2025.05 ~",
    bullets: [
      "생성형 AI 서비스 개발 담당",
      "CRM 관련 글/이미지 생성 기능",
      "RAG 임베딩 기반 법률 문서 검토",
      "삼성카드 톤앤매너 가이드 기반 메시지 검수",
    ],
  },
  {
    company: "아스타 AI",
    name: "Scrapper",
    period: "2025.05 ~",
    bullets: [
      "Puppeteer 기반 URL 페이지 분석 기능 개발",
      "페이지 이미지 분할 캡처 기능",
      "페이지 정보 텍스트 파싱 시스템 구축",
      "핵심 내용 자동 분석/요약 기능 개발",
    ],
  },
  {
    company: "아스타 AI",
    name: "KT AI 솔루션",
    period: "2025.03 ~",
    bullets: [
      "KT 내부 3개 팀 대상 생성형 AI 솔루션 개발",
      "CRM 관련 글/이미지 생성 기능",
      "RAG 임베딩 기반 법률 검토 및 메시지 검수",
    ],
  },
  {
    company: "EY한영",
    name: "Krtax 페이롤 프로젝트",
    period: "2024.12 ~ 2025.01",
    summary:
      "차세대 작업 프론트엔드 기술 리더로 참여해 기술 전환 인프라 및 프로젝트 세팅을 수행했습니다.",
    bullets: ["인프라 구성", "모노레포 구성", "화면 개발"],
  },
  {
    company: "교보문고",
    name: "창작의 날씨",
    period: "2023.11 ~ 2024.11",
    summary:
      "신사업 본부 프론트엔드 개발자로서 디자인 시스템 구축과 개발 조직 생산성 향상을 이끌었습니다.",
    bullets: [
      "하이브리드(웹/모바일웹/iOS/Android) 대응 컨벤션 정리",
      "SSR + react-query 렌더 최적화 컨벤션",
      "Cypress E2E 테스트 컨벤션 세팅",
      "Recoil 글로벌 상태 관리 세팅",
      "openapi-generator 기반 API 통신 컨벤션",
    ],
  },
  {
    company: "교보문고",
    name: "스토리북 기반 디자인시스템",
    period: "2023.11 ~ 2024.11",
    bullets: [
      "4개 대고객 서비스 공통 디자인시스템 구축",
      "아토믹 디자인 패턴 기반 컴포넌트 체계 수립",
      "창작 플랫폼 복합 콘텐츠 에디터/뷰어 개발",
    ],
  },
  {
    company: "교보문고",
    name: "GTM 환경세팅",
    period: "2024",
    bullets: [
      "기획/마케팅팀이 직접 이벤트 트래킹 설정 가능한 구조 구축",
      "개발팀 반복 작업 감소 및 마케팅 민첩성 향상",
    ],
  },
  {
    company: "RSQUARE",
    name: "CRM / DRM 서비스",
    period: "2019.08 ~ 2023.10",
    summary:
      "시리즈 A부터 C 단계까지 성장 구간에서 핵심 개발 역량과 기술 로드맵을 담당했습니다.",
    bullets: [
      "프론트 프로젝트 설계 및 화면 개발",
      "인프라 작업",
      "Nx/Lerna 모노레포 구조 세팅",
      "Cypress E2E 테스트 코드 작성",
      "스토리북 기반 디자인시스템 세팅",
    ],
  },
  {
    company: "RSQUARE",
    name: "한국/베트남 서비스 기술전환",
    period: "2019.08 ~ 2023.10",
    bullets: [
      "SPA → SSG 전환",
      "SPA → SSR 전환",
      "기술 스택 통일 및 모노레포 레이어 정비",
    ],
  },
  {
    company: "RSQUARE",
    name: "HTML to PDF 변환 기안서 서비스",
    period: "2022",
    bullets: [
      "대용량 데이터를 비동기 처리해 HTML to PDF 변환",
      "결과물을 S3 링크로 제공",
      "풀스택 개발(서비스/인프라)",
    ],
  },
  {
    company: "RSQUARE",
    name: "RTB 부동산 데이터 관리 서비스",
    period: "2020 ~ 2023",
    bullets: [
      "한국/베트남/싱가포르 도메인 개발 참여",
      "데이터 모델링 및 마이그레이션",
      "풀스택 개발 및 인프라 작업",
    ],
  },
];

export const skills: SkillCategory[] = [
  {
    title: "AI",
    items: [
      "GPT, Claude, Gemini, Stable Diffusion, YOLO, Cloud Vision 등 활용",
      "Agent 워크플로우 설계/개발 경험",
      "RAG 임베딩 기반 정보 탐색 시스템 개발",
      "NL to SQL 시스템 구축",
      "프롬프트 엔지니어링 기반 모델 성능 최적화",
    ],
  },
  {
    title: "FrontEnd",
    items: [
      "SPA/SSG/SSR 렌더링 전략 실무 경험",
      "Turborepo/Nx/Lerna 모노레포 운영",
      "하이브리드 웹뷰 서비스 운영",
      "모바일 OS/브라우저 이슈 트러블슈팅",
      "디자인시스템 구축 및 리드",
      "Storybook 기반 컴포넌트 주도 개발",
      "Cypress E2E 테스트 작성",
    ],
  },
  {
    title: "BackEnd",
    items: [
      "Supabase 기반 대고객 서비스 배포",
      "Spring/Express REST API 개발",
      "Oracle/MySQL 운영 및 마이그레이션",
    ],
  },
  {
    title: "DevOps",
    items: [
      "AWS/GCP/Azure/Cloudflare 등 클라우드 경험",
      "CI/CD 구성 및 운영",
      "서비스 환경별 인프라 구축",
    ],
  },
  {
    title: "Tool",
    items: [
      "GTM/GA/Mixpanel/Amplitude 초기 세팅 및 운영",
      "서비스 환경에 맞는 GitFlow 적용",
      "Datadog 기반 모니터링 환경 구축",
    ],
  },
];

export const education = [
  "2013.03 ~ 2019.03 가톨릭관동대학교 정보통신학과 학사",
];

export const certificates = [
  "2021.12 Ultimate AWS Certified Developer Associate",
  "2019.08 쌍용교육센터 웹개발 프로그램 과정 수료",
  "2019.04 SQLD",
  "2018.11 정보처리산업기사",
];

export const contacts = [
  {
    label: "LinkedIn",
    value: "linkedin.com/in/동현-진-0bb185219",
    href: "https://www.linkedin.com/in/%EB%8F%99%ED%98%84-%EC%A7%84-0bb185219/",
  },
  {
    label: "Email",
    value: "wlsehdgus23@naver.com",
    href: "mailto:wlsehdgus23@naver.com",
  },
  {
    label: "Phone",
    value: "010-3230-1521",
    href: "tel:01032301521",
  },
];
