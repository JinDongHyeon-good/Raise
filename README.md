# 찐투 (jjintu)

코인·주식 유튜브 분석 영상을 한곳에 모아 보고, AI가 **영상에서 실제로 나온 말만** 근거로 요약해 주는 서비스입니다.

**Live** → https://jjindong.com · [English](https://jjindong.com/en)

## 주요 기능

| 기능 | 설명 |
| --- | --- |
| 영상 모아보기 | 코인 / 미국증시 / 한국주식 / 미국주식 탭별로 YouTube 분석 영상 검색 · 키워드 · 채널 필터 · 무한 스크롤 |
| AI 영상 요약 | 받아쓰기 → 요약 → 인용문·숫자 코드 검증 → AI 교차 검증을 거쳐 근거가 확인된 항목만 표시 (타임스탬프 포함) |
| 실시간 차트 | Bybit 캔들 차트 + 주요 코인·미국 지수·국내외 주식 시세, AI 차트 분석 |
| 커뮤니티 | 카테고리 게시판, 리치 텍스트 에디터(Tiptap), 이미지 업로드, 댓글 · 추천 |
| 계정 | Supabase Auth (이메일 / Google), 채널 즐겨찾기 · 검색 기본값 계정별 저장 |
| 다국어 | 한국어 / 영어 UI · AI 요약 · SEO (첫 방문 시 국가·브라우저 언어로 자동 선택) |

## 기술 스택

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, next-intl
- **Backend**: Next.js Route Handlers, Supabase (Postgres · Auth · Storage · Edge Functions)
- **AI**: Gemini on Vertex AI (서비스 계정 인증)
- **외부 API**: YouTube Data API v3, Bybit, Yahoo Finance
- **Infra**: AWS Amplify Hosting

## 아키텍처

```
Browser ──▶ Next.js (Amplify) ──▶ Supabase Postgres  (게시판, 캐시, 사용량)
               │        │
               │        └──▶ YouTube / Bybit / Yahoo API
               │
               └─(요약 작업 생성)─▶ Supabase Edge Function: video-summary-worker
                                         └──▶ Vertex AI Gemini (받아쓰기 · 요약 · 검증)
```

## 설계하면서 고민한 점

**1. 30초 응답 제한을 넘는 AI 작업**
Amplify는 응답을 30초에 끊는데, 영상 받아쓰기만 15–50초가 걸렸습니다. 요약 작업 전체를 Supabase Edge Function으로 옮겨
`202`로 바로 응답하고 백그라운드에서 단계별로 DB에 저장하며, 시간 예산(150초)을 다 쓰면 자기 자신을 다시 호출해 긴 영상도 끝까지 처리합니다.
브라우저는 상태만 폴링합니다. → [`supabase/functions/video-summary-worker`](supabase/functions/video-summary-worker/index.ts)

**2. AI 요약의 환각 방지**
요약 항목마다 근거 문단과 원문 인용을 함께 받고, 인용문이 받아쓰기에 글자 그대로 있는지 · 숫자가 근거에 있는지를 **코드로** 검증한 뒤
AI로 한 번 더 검증합니다. 하나라도 실패한 항목은 버립니다.

**3. YouTube API 할당량 (검색 1회 = 100 units)**
여러 API 키를 순서대로 쓰다 소진되면 리셋 시각(태평양시 자정)까지 건너뛰고, 서버 메모리(L1) → Supabase 테이블(L2) 2단 캐시와
stale-while-error, 동일 검색어 요청 합치기로 호출 수를 줄였습니다. → [`src/lib/youtube.ts`](src/lib/youtube.ts)

**4. AI 기능 악용 방지**
Origin 확인, 로그인 + 이메일 인증, 사용자 / IP / 서비스 전체 하루 한도를 DB 함수 하나(`ai_consume`)로 원자적으로 확인·기록합니다.
확인이 불가능하면 거절합니다(fail closed). → [`src/lib/ai-quota.ts`](src/lib/ai-quota.ts), [`supabase/sql/ai_abuse_guard.sql`](supabase/sql/ai_abuse_guard.sql)

**5. 보안 · 캐시**
Supabase RLS, `sanitize-html` 기반 XSS 방어, 보안 헤더(HSTS · CSP · X-Frame-Options 등), 세션 응답은 CDN에 캐시하지 않고
캐시되는 페이지에는 쿠키를 심지 않도록 분리했습니다.

## 프로젝트 구조

```
src/
  app/[locale]/        페이지 (ko 기본, /en 영어)
  app/api/             Route Handlers (youtube, bybit, stocks, board, ai, me)
  components/          UI 컴포넌트 (raise/: 서비스 화면, board/, auth/)
  lib/                 도메인 로직 (youtube, video-summary, ai-quota, seo ...)
  i18n/                라우팅 · 언어 감지
messages/{ko,en}/      번역 문자열
supabase/sql/          스키마 · RLS · DB 함수
supabase/functions/    Edge Function (영상 요약 워커)
```

## 로컬 실행

```bash
pnpm install
cp .env.example .env.local   # 값 채우기
pnpm dev
```

| 변수 | 용도 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 클라이언트 |
| `SUPABASE_SECRET_KEY` | 서버 전용 Supabase 키 |
| `YOUTUBE_API_KEYS` | YouTube Data API 키 (쉼표 구분, 순서대로 failover) |
| `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` | Vertex AI용 서비스 계정 JSON |
| `VIDEO_SUMMARY_WORKER_SECRET` | Next ↔ 요약 워커 공유 시크릿 |
| `NEXT_PUBLIC_SITE_URL` | 사이트 주소 (기본 `https://jjindong.com`) |

```bash
pnpm lint
pnpm build
```
