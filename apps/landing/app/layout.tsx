import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { PostHogScript } from "@/components/PostHogScript";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const SITE = "https://maakapp.se";
const NAME = "määk";
const TITLE = "määk – träffa människor som passar dig";
const DESCRIPTION =
  "En lugn dejtingapp utan swipe-stress. Matchning, chatt och profiler – designad för att kännas trygg och mänsklig.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: TITLE,
    template: `%s · ${NAME}`,
  },
  description: DESCRIPTION,
  applicationName: NAME,
  authors: [{ name: "määk", url: SITE }],
  creator: "määk",
  publisher: "määk",
  keywords: [
    "dejting",
    "dejtingapp",
    "relationer",
    "personlighetsmatchning",
    "iOS-app",
    "trygg dejting",
    "svensk dejting",
    "määk",
    "maak",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: SITE,
    siteName: NAME,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    // Lämna creator/site orefererade — vi har ingen X-närvaro, och ett
    // trasigt handle blir en 404 för den som klickar från rich cards.
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2F0EF" },
    { media: "(prefers-color-scheme: dark)", color: "#253D2C" },
  ],
};

// Organization + WebSite JSON-LD – hjälper Google bygga rich snippets och Knowledge Graph.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: NAME,
      url: SITE,
      logo: `${SITE}/app-icon-light.png`,
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: SITE,
      name: NAME,
      description: DESCRIPTION,
      publisher: { "@id": `${SITE}/#organization` },
      inLanguage: "sv-SE",
    },
    {
      "@type": "MobileApplication",
      name: NAME,
      operatingSystem: "iOS",
      applicationCategory: "SocialNetworkingApplication",
      offers: { "@type": "Offer", price: "0", priceCurrency: "SEK" },
      inLanguage: "sv-SE",
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={dmSans.variable}>
      <body className="min-h-screen font-sans">
        <script
          type="application/ld+json"
          // JSON.stringify escapar alla citat korrekt; XSS-säkert så länge vi kontrollerar innehållet.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <PostHogScript />
      </body>
    </html>
  );
}
