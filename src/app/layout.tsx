import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { StoreProvider } from "@/components/Store";
import { LangProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "K-GX E-SFC Policy Lab · PLANiT",
  description: "PLANiT Institute — monetary · fiscal · power policy lab (DEFINE-UK-type E-SFC), experimental / 통화·재정·전력 정책분석 실험실",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>
        <LangProvider>
          <Nav />
          <StoreProvider>
            <main className="page">{children}</main>
          </StoreProvider>
        </LangProvider>
      </body>
    </html>
  );
}
