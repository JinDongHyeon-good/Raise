import crypto from "node:crypto";

type ServiceAccount = {
  project_id?: string;
  client_email: string;
  private_key: string;
  token_uri?: string;
};

type CachedToken = { token: string; expiresAt: number };

const tokenCache = new Map<string, CachedToken>();

function loadServiceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS?.trim();
  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS 환경변수가 없습니다.");
  }
  const parsed = JSON.parse(raw) as ServiceAccount;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("서비스 계정 JSON에 client_email/private_key가 없습니다.");
  }
  // 일부 호스팅 환경은 \n을 이스케이프된 그대로 넘긴다
  return { ...parsed, private_key: parsed.private_key.replace(/\\n/g, "\n") };
}

const b64url = (value: string | object) =>
  Buffer.from(typeof value === "string" ? value : JSON.stringify(value)).toString("base64url");

/** 서비스 계정 JWT → OAuth 액세스 토큰 (만료 1분 전까지 메모리 캐시) */
export async function getGoogleAccessToken(scope: string): Promise<string> {
  const cached = tokenCache.get(scope);
  if (cached && cached.expiresAt - 60_000 > Date.now()) return cached.token;

  const account = loadServiceAccount();
  const tokenUri = account.token_uri ?? "https://oauth2.googleapis.com/token";
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url({ alg: "RS256", typ: "JWT" })}.${b64url({
    iss: account.client_email,
    scope,
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(unsigned), account.private_key).toString("base64url");

  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!response.ok || !data.access_token) {
    throw new Error(`Google 토큰 발급 실패: ${data.error_description ?? response.status}`);
  }

  tokenCache.set(scope, {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  });
  return data.access_token;
}

export function getServiceAccountProjectId(): string {
  const projectId = process.env.GOOGLE_VERTEX_PROJECT_ID?.trim() || loadServiceAccount().project_id;
  if (!projectId) throw new Error("서비스 계정 JSON에 project_id가 없습니다.");
  return projectId;
}
