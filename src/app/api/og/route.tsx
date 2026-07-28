import { readFileSync } from "node:fs";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const dynamic = "force-static";

// 레포에 포함된 폰트를 파일에서 읽어 임베드 (외부 네트워크 의존 제거)
let juaFont: Buffer | null = null;
function getJua(): Buffer | null {
  if (juaFont) return juaFont;
  try {
    juaFont = readFileSync(new URL("./Jua-Regular.ttf", import.meta.url));
    return juaFont;
  } catch {
    return null;
  }
}

export async function GET() {
  const jua = getJua();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #221a44 0%, #2a2150 45%, #3a2f66 100%)",
          fontFamily: "Jua",
          position: "relative",
        }}
      >
        {/* 금빛 초승달 */}
        <div
          style={{
            position: "absolute",
            top: 74,
            right: 118,
            width: 150,
            height: 150,
            borderRadius: 999,
            background: "#c79a3e",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 56,
            right: 100,
            width: 150,
            height: 150,
            borderRadius: 999,
            background: "#2a2150",
            display: "flex",
          }}
        />
        <div style={{ display: "flex", fontSize: 150, color: "#f4e9c8", lineHeight: 1 }}>사주네</div>
        <div style={{ display: "flex", marginTop: 30, fontSize: 46, color: "#d9d2ec" }}>
          오늘의 운세 · 사주팔자 · 궁합
        </div>
        <div style={{ display: "flex", marginTop: 42, fontSize: 26, letterSpacing: 4, color: "#c79a3e" }}>
          SAJUNE · 정통 사주 서비스
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: jua ? [{ name: "Jua", data: jua, weight: 400, style: "normal" }] : undefined,
    },
  );
}
