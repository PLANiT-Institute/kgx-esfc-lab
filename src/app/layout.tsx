import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { StoreProvider } from "@/components/Store";

export const metadata: Metadata = {
  title: "K-GX E-SFC Policy Lab · PLANiT",
  description: "PLANiT Institute — 통화·재정·전력 정책분석 실험실 (DEFINE-UK 계열 E-SFC), 실험판",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>
        <header className="topbar">
          <div className="in">
            <div className="brand"><b>K-GX E-SFC Policy Lab</b><span>PLANiT Institute · Track B 연구용 · v0.1 실험판</span></div>
            <Nav />
          </div>
        </header>
        <StoreProvider>
          <main className="page">{children}</main>
        </StoreProvider>
      </body>
    </html>
  );
}
