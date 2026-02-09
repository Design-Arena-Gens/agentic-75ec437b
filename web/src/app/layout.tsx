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
  title: "Agentic Motion Lab — Free Video Generating AI",
  description:
    "Generate cinematic motion graphics videos in-browser with an autonomous multi-step agent pipeline. Free, fast, and deploy-ready.",
  openGraph: {
    title: "Agentic Motion Lab — Free Video Generating AI",
    description:
      "Craft cinematic WebM clips with an in-browser agentic workflow that plans, choreographs, and renders layered motion graphics.",
    url: "https://agentic-75ec437b.vercel.app",
    siteName: "Agentic Motion Lab",
    images: [
      {
        url: "https://agentic-75ec437b.vercel.app/og",
        width: 1200,
        height: 630,
        alt: "Agentic Motion Lab",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agentic Motion Lab — Free Video Generating AI",
    description:
      "Free agentic AI that transforms text prompts into cinematic motion-graphic videos right in your browser.",
    images: ["https://agentic-75ec437b.vercel.app/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-950 text-white antialiased`}
      >
        <div className="relative min-h-screen overflow-hidden">
          <BackgroundGlow />
          <div className="relative z-10">{children}</div>
        </div>
      </body>
    </html>
  );
}

function BackgroundGlow() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_rgba(15,23,42,0.95))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(168,85,247,0.18),_transparent_60%)] blur-3xl" />
    </div>
  );
}
