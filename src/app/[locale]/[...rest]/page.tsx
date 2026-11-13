import { notFound } from "next/navigation";

/** 어떤 라우트에도 맞지 않는 주소를 [locale]/not-found.tsx 로 보낸다 (next-intl 권장 패턴) */
export default function CatchAllPage() {
  notFound();
}
