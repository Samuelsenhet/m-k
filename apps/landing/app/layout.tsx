import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const site = "https://maakapp.se";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: "määk – träffa människor som passar dig",
  description:
    "En lugn dejtingapp utan swipe-stress. Matchning, chatt och profiler – designad för att kännas trygg och mänsklig.",
  openGraph: {
    title: "määk",
    description: "Träffa människor som passar dig.",
    url: site,
    siteName: "määk",
    locale: "sv_SE",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={dmSans.variable}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
