import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
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
    creator: "@maakapp",
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
      { url: "/app-icon-light.png", type: "image/png" },
    ],
    apple: [
      { url: "/app-icon-light.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
      </body>
    </html>
  );
}
