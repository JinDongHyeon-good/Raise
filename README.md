# 사주네 (Sajune)

오늘의 운세 · 사주팔자 · 궁합 사주 — 생년월일시로 보는 정통 사주 서비스.

- 생년월일시(양력·음력)로 사주팔자(천간·지지·오행·십성)를 정확히 계산 (`src/lib/saju`)
- 계산된 명식을 Gemini로 해석: 오늘의 운세 / 사주팔자 풀이 / 궁합 (`/api/ai/saju`)
- 기능은 로그인 후 이용 (`/dashboard/today`, `/dashboard/saju`, `/dashboard/gunghap`)

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## AI 해석은 왜 Supabase Edge Function을 거치는가

Amplify Hosting은 SSR/API 응답을 **30초에서 강제로 끊고**(조정 불가), Next.js 스트리밍도 지원하지 않아
응답을 통째로 버퍼링한다. `maxDuration`은 Vercel 전용 옵션이라 Amplify에서는 무시된다. 그래서
`gemini-3.1-pro-preview`로 4000토큰짜리 해석을 만들면 30초를 넘겨 500이 났다.

지금은 오래 걸리는 Gemini 호출만 Supabase Edge Function으로 뺐다. 브라우저가 Amplify/CloudFront를
거치지 않고 함수를 직접 호출하므로 30초 제한이 적용되지 않는다(무료 플랜 기준 요청당 150초).

```
브라우저 ──► /api/ai/saju            인증·검증·명식 계산·프롬프트 생성 (1초 이내)
        ◄── 명식 JSON + 서명된 릴레이 토큰(2분 만료)
        ──► supabase/functions/saju-stream   토큰 전달
        ◄── Gemini 해석 실시간 스트리밍
```

릴레이 토큰은 Next.js 서버가 HMAC으로 서명하고 Edge Function이 같은 시크릿으로 검증한다
(`src/lib/ai-relay-token.ts`). 이게 없으면 그 함수는 아무 프롬프트나 실행해 주는 공짜 Gemini
게이트웨이가 된다. 토큰 형식을 바꾸면 `supabase/functions/saju-stream/index.ts`도 같이 고쳐야 한다.

### 배포

1. 공유 시크릿 생성: `openssl rand -hex 32`
2. Edge Function 배포 — Supabase CLI가 없으면 대시보드 Edge Functions 화면에
   `supabase/functions/saju-stream/index.ts` 내용을 그대로 붙여넣어도 된다(의존성 없는 단일 파일).

   ```bash
   supabase functions deploy saju-stream
   supabase secrets set GEMINI_API_KEY=... AI_RELAY_SECRET=...
   ```

3. Amplify 환경 변수에 추가:
   - `NEXT_PUBLIC_SAJU_RELAY_URL` = `https://<project-ref>.supabase.co/functions/v1/saju-stream`
   - `AI_RELAY_SECRET` = 1번에서 만든 값 (Supabase 쪽과 동일해야 함)

두 값 중 하나라도 비어 있으면 Next.js가 직접 Gemini를 호출하는 폴백 경로로 동작한다. 로컬 개발에는
편하지만 **Amplify에서는 30초 제한에 걸리므로 프로덕션에서는 반드시 채워야 한다.**

### Edge Function 테스트

Deno나 Supabase를 띄우지 않고 핸들러를 그대로 돌려 본다 (Gemini는 스텁).

```bash
node --experimental-strip-types supabase/functions/saju-stream/test.ts
```

Edge Function 선택 시크릿:

- `RELAY_ALLOWED_ORIGINS` — 쉼표로 구분한 허용 오리진 (예: `https://jjindong.com`). 없으면 요청
  오리진을 그대로 허용한다.
