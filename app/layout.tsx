import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "桃園電影院 — 院線片聚合",
  description: "桃園各大影城今日上映院線片場次一覽",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-[#0d0d0d] text-[#f0f0f0] antialiased">{children}</body>
    </html>
  );
}
