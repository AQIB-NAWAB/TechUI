import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TechUI — Interactive components for software engineering",
  description:
    "186+ interactive React components for rate limiters, circuit breakers, DNS, JWT, RAG, and more. Add to any Next.js project with npx @aqib_nawab/techui — like shadcn, but for teaching engineering.",
  openGraph: {
    title: "TechUI — Make engineering concepts visually obvious",
    description: "Interactive React components + shadcn-style CLI. Docs, courses, blogs, and AI content.",
    url: "https://techui.vercel.app",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
