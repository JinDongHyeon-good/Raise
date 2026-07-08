import type { Metadata } from "next";
import { PdfFullScreenFrame } from "@/components/PdfFullScreenFrame";

export const metadata: Metadata = {
  title: "경력기술서",
  description: "경력기술서 PDF",
  robots: { index: false, follow: false },
};

export default function ResumePage() {
  return <PdfFullScreenFrame pdfPath="/jindong.pdf" docTitle="경력기술서" />;
}
