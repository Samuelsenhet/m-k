import {
  Brain,
  Compass,
  Crown,
  Gift,
  Heart,
  Home,
  Leaf,
  Shield,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
  Utensils,
  Video,
  type LucideIcon,
} from "lucide-react";

// All landing-copy på ett ställe - separerad från markup så copy kan ändras
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
  { href: "#vardar", label: "Värdar" },
  { href: "#stats", label: "Om appen" },
  { href: "/vanta/", label: "Väntelista" },
] as const;

export const HERO = {
  eyebrow: "Ny på App Store",
  title: "Mänskligare dejtande börjar här.",
  lead: "määk hjälper dig hitta rätt personer i lugn takt. Färre svep, mer riktiga samtal och tryggare möten.",
  primaryCta: "Ladda ner määk",
  secondaryCta: "Se funktioner",
  availability: "Tillgänglig på iOS · För dig som är 20+",
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
  subtitle: "Matchas → Chatta → Träffas - utan svep-stress.",
} as const;

// Top 3 hero-features med skärmbild. Matchar exakt vad iOS-appen shippar.
export const FEATURES = [
  {
    title: "5 dagliga matchningar",
    description:
      "Inget svepande. Algoritmen väger personlighet (40 %), arketyp (30 %) och intressen (30 %) - du får några få, välvalda personer varje dag.",
    imageSrc: "/screenshots/hero.webp",
    imageAlt: "Skärmbild: dagens matchningar i määk",
  },
  {
    title: "AI-isbrytare",
    description:
      "Fem personliga öppningar för varje matchning - byggda utifrån era personligheter, inte generiska mallar. Roligt, djupt, aktivitet eller komplimang.",
    imageSrc: "/screenshots/landing-profile-erik.webp",
    imageAlt: "Skärmbild: chatt med AI-isbrytare",
  },
  {
    title: "Verifierade profiler",
    description:
      "ID-kontroll och personlighetsarketyp syns på varje profil. Du vet vem du pratar med - både person och stil.",
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

// Sekundära features - visas som mindre ikon-kort.
export const EXTRAS: ReadonlyArray<{
  Icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    Icon: Video,
    title: "Kemi-Check",
    description: "Kort videosamtal innan ni träffas IRL - testa kemin riskfritt.",
  },
  {
    Icon: Users,
    title: "Samlingar",
    description:
      "Små grupper kring gemensamma intressen - möt nya via de ni redan matchat med.",
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
      "30 frågor, 16 arketyper, 4 kategorier - förstå din och andras dejtingstil.",
  },
  {
    Icon: Trophy,
    title: "Prestationer",
    description: "Badges och XP för uppgifter du klarar - engagemang utan press.",
  },
];

// ---- Värdar / Hosts Program ----
// Visas på landing som en teaser innan programmet lanseras post-launch.
// Copyn är avsiktligt konkret och jordnära - ingen "become an ambassador
// today"-känsla. Värd-status är earned, inte ansökt om.

export const VARDAR_HEADING = {
  eyebrow: "Värdar",
  title: "För dig som samlar människor",
  subtitle:
    "Vissa användare skapar inte bara kontakter - de skapar sammanhang. De kallas Värdar, och de är en del av MÄÄK:s innersta krets.",
} as const;

export const VARDAR_BENEFITS: ReadonlyArray<{
  Icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    Icon: Crown,
    title: "Värd-status",
    description:
      "En earned roll - inte köpt, inte ansökt. Vi tilldelar den när du visar att du skapar genuin social energi.",
  },
  {
    Icon: Sparkles,
    title: "Skapa Träffar",
    description:
      "Värdar kan skapa publika IRL-event - brunch, afterwork, promenad - som andra MÄÄK-användare kan RSVP:a till.",
  },
  {
    Icon: UserPlus,
    title: "Introduktioner",
    description:
      "Koppla ihop två av dina matchningar som du tror passar. Mänsklig matchning som komplement till algoritmen.",
  },
  {
    Icon: Home,
    title: "Värdrummet",
    description:
      "En privat Samling endast för andra Värdar. Här möts de som håller MÄÄK levande och delar tips.",
  },
  {
    Icon: Utensils,
    title: "Värdmiddag",
    description:
      "Fyra gånger per år bjuds Värdar till en middag i sin stad - Stockholm, Göteborg eller Malmö.",
  },
  {
    Icon: Gift,
    title: "Premium ingår",
    description:
      "Så länge du är en aktiv Värd är Premium inkluderat. Ingen revenue share, inga provisioner - bara verktygen.",
  },
];

export const VARDAR_HOW = {
  eyebrow: "Så blir du en Värd",
  title: "Kvalitet, inte kvantitet.",
  description:
    "Du behöver inte ansöka. Vi ser vilka som redan gör rätt saker - och kontaktar dig när du gjort något av följande:",
  criteria: [
    "Skapat en Samling som hålls levande av 5+ aktiva medlemmar",
    "Genomfört en Träff med minst 4 deltagare på plats",
    "Gjort tre lyckade introduktioner mellan dina matchningar",
  ],
  footnote:
    "Programmet lanseras efter att MÄÄK öppnat på App Store. Värd-status är manuellt utvald av teamet.",
} as const;

export const PHILOSOPHY = {
  eyebrow: "Vår filosofi",
  title: "Schrödingers dejt",
  lines: [
    "Som fysiker en gång föreställde sig",
    "existerar Schrödingers katt i två tillstånd samtidigt.",
    "Levande. Och inte.",
    "Tills vi väljer att se.",
    "Det är paradoxen.",
    "Och det är precis där modernt dejting lever idag.",
    "Så många möjligheter.",
    "Så många \"tänk om\".",
    "Så mycket osäkerhet.",
    "Men inget verkligt. För inget blir verkligt …",
    "Tills vi väljer att engagera oss.",
    "Tills vi startar en konversation.",
    "På MÄÄK jagar vi inte fler val.",
    "Vi hjälper dig upptäcka det som är verkligt —",
    "en interaktion i taget.",
    "Då börjar något verkligt.",
  ],
  emphasisLines: [4, 10, 15] as readonly number[],
  cta: "Ladda ner määk",
} as const;

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
  availability: "Tillgänglig på iOS · För dig som är 20+",
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
