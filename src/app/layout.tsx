import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: 'swap' });

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Aura | AI Legal Assistant",
  description: "Advanced GenAI Legal Assistant powered by Gemini API. Analyze and summarize complex legal contracts instantly.",
  keywords: ["AI", "Legal", "Gemini", "Next.js", "GenAI", "Contract Analysis"],
  openGraph: {
    title: "Aura | GenAI Legal Assistant",
    description: "Analyze and summarize complex legal contracts instantly using Google Gemini.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className={`${inter.className} min-h-screen bg-slate-900 text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black selection:bg-indigo-500/30 selection:text-indigo-200`}>
        {children}
      </body>
    </html>
  );
}
