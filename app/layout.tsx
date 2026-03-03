import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StoryCommander | Tải truyện tự động & AI Text-to-Speech",
  description: "Giải pháp tải truyện miễn phí, không watermark, vượt bot-check. Tích hợp AI làm sạch văn bản, đóng gói EPUB/TXT và nghe truyện Audio bằng Edge TTS miễn phí tốc độ cao.",
  keywords: ["tải truyện", "ai downloader", "epub generator", "text-to-speech", "edge tts", "đọc truyện online", "nghe audio truyện"],
  authors: [{ name: "StoryGen Team" }],
  openGraph: {
    title: "StoryCommander | Nền tảng Tải truyện tự động & AI Audiobook",
    description: "Công cụ tải tiểu thuyết All-in-One: Crawl truyện, Fix lỗi rác bằng AI, Tạo file EPUB đọc nhẹ nhàng và Nghe truyện AI giọng siêu mượt.",
    url: "https://story-commander.vercel.app", 
    siteName: "StoryCommander",
    images: [
      {
        url: "/og-image.webp",
        width: 1200,
        height: 630,
        alt: "StoryCommander Thumbnail",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StoryCommander | Tải truyện tự động & AI Text-to-Speech",
    description: "Tải file truyện TXT/EPUB tốc độ cao kết hợp Audio TTS đỉnh nhất.",
    images: ["/og-image.webp"],
  },
};

import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>

        {/* Cdnjs pdf.js cho tính năng Parse PDF Client-side */}
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

