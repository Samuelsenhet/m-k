import {
  Brain,
  Compass,
  Heart,
  Leaf,
  Shield,
  Trophy,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";

// All landing-copy på ett ställe – separerad från markup så copy kan ändras
// utan att någon behöver navigera genom JSX.
//
// Uppdateras när appen får nya features. Håll copyn kort: en mening per fält,
// konkret, utan fluff.

export const SITE = {
  name: "määk",
  url: "https://maakapp.se",
  appStoreUrl: process.env.NEXT_PUBLIC_APP_STORE_URL ?? "https://apps.apple.com/app/maak",
  contactEmail: "hej@maakapp.se",
} as const;

export const NAV_LINKS = [
  { href: "#features", label: "Funktioner" },
  { href: "#more", label: "Mer" },
  { href: "#stats", label: "Om appen" },
] as const;

export const HERO = {
  eyebrow: "Ny på App Store",
  title: "Mänskligare dejtande börjar här.",
  lead: "määk hjälper dig hitta rätt personer i lugn takt. Färre svep, mer riktiga samtal och tryggare möten.",
  primaryCta: "Ladda ner määk",
  secondaryCta: "Se funktioner",
  availability: "Tillgänglig på iOS",
  downloadLabel: "Hämta i App Store",
} as const;

// Tre värderader under hero-knapparna.
export const HERO_VALUES = [
  { Icon: Brain, title: "Personlighets-", sub: "matchning" },
  { Icon: Shield, title: "Säker &", sub: "verifierad" },
  { Icon: Heart, title: "Meningsfulla", sub: "kopplingar" },
] as const;

export const FEATURES_HEADING = {
  title: "Så fungerar det",
  subtitle: "Matchas → Chatta → Träffas – utan svep-stress.",
} as const;

// Top 3 hero-features med skärmbild. Matchar exakt vad iOS-appen shippar.
export const FEATURES = [
  {
    title: "5 dagliga matchningar",
    description:
      "Inget svepande. Algoritmen väger personlighet (40 %), arketyp (30 %) och intressen (30 %) – du får några få, välvalda personer varje dag.",
    imageSrc: "/screenshots/hero.webp",
    imageAlt: "Skärmbild: dagens matchningar i määk",
  },
  {
    title: "AI-isbrytare",
    description:
      "Fem personliga öppningar för varje matchning – byggda utifrån era personligheter, inte generiska mallar. Roligt, djupt, aktivitet eller komplimang.",
    imageSrc: "/screenshots/landing-profile-erik.webp",
    imageAlt: "Skärmbild: chatt med AI-isbrytare",
  },
  {
    title: "Verifierade profiler",
    description:
      "ID-kontroll och personlighetsarketyp syns på varje profil. Du vet vem du pratar med – både person och stil.",
    imageSrc: "/screenshots/landing-profile-merbel.webp",
    imageAlt: "Skärmbild: verifierad profil i määk",
  },
] as const;

export const EXTRAS_HEADING = {
  eyebrow: "Mer i appen",
  title: "Byggd för djupare möten",
  subtitle:
    "Små funktioner som gör stor skillnad när du vill lära känna någon på riktigt.",
} as const;

// Sekundära features – visas som mindre ikon-kort.
export const EXTRAS: ReadonlyArray<{
  Icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    Icon: Video,
    title: "Kemi-Check",
    description: "Kort videosamtal innan ni träffas IRL – testa kemin riskfritt.",
  },
  {
    Icon: Users,
    title: "Samlingar",
    description:
      "Små grupper kring gemensamma intressen – möt nya via de ni redan matchat med.",
  },
  {
    Icon: Leaf,
    title: "Söndagsmatchning",
    description:
      "Varje söndag får du en andra chans med veckans matcher du inte hann chatta med.",
  },
  {
    Icon: Compass,
    title: "Personlighetskompassen",
    description:
      "30 frågor, 16 arketyper, 4 kategorier – förstå din och andras dejtingstil.",
  },
  {
    Icon: Trophy,
    title: "Prestationer",
    description: "Badges och XP för uppgifter du klarar – engagemang utan press.",
  },
];

export const FACTS_HEADING = {
  title: "Byggd för riktiga möten.",
  subtitle: "En annorlunda dejtingapp från Sverige.",
} as const;

// Kvalitativa fakta (inga ouppmätta användarsiffror).
export const FACTS = [
  { value: "2026", label: "Ny på App Store" },
  { value: "iOS", label: "Nativ upplevelse" },
  { value: "GDPR", label: "EU-baserad data" },
  { value: "SE", label: "Svenskt team" },
] as const;

export const CTA = {
  eyebrow: "MÄÄK i App Store",
  title: "Redo att träffa någon som passar dig?",
  body: "Ladda ner määk och börja med lugnare, tryggare och mer mänskligt dejtande.",
  primary: "Ladda ner määk",
  secondary: "Utforska funktioner",
  availability: "Tillgänglig på iOS",
} as const;

export const FOOTER = {
  tagline:
    "En lugn dejtingapp för riktiga samtal, mänskligare möten och tryggare tempo.",
  supportHeading: "Support & rapporter",
  supportLinks: [
    { href: "/terms", label: "Användarvillkor" },
    { href: "/privacy", label: "Integritetspolicy" },
    { href: "/reporting", label: "Rapportering" },
    { href: "/about", label: "Om MÄÄK" },
  ],
  contactHeading: "Kontakt",
} as const;
