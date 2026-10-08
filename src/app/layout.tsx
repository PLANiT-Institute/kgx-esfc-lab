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
      <body>
        <header className="top">
          <div className="in">
            <div className="brand">K-GX E-SFC Policy Lab<small>PLANiT Institute · Track B 연구용 · v0.1 실험판</small></div>
            <Nav />
          </div>
        </header>
        <StoreProvider>
          <main>{children}</main>
        </StoreProvider>
      </body>
    </html>
  );
}
