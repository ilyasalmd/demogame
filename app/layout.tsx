import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "INCIDENT: First Day Protocol",
  description: "A premium 3D situational judgement assessment game by AI OA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#050508] text-slate-100 overflow-hidden h-screen w-screen">
        {children}
      </body>
    </html>
  );
}
