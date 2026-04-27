import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { VANTA } from "@/content/vanta";
import { WaitlistForm } from "@/components/WaitlistForm";

const API_URL =
  process.env.NEXT_PUBLIC_WAITLIST_API_URL ||
  "https://jappgthiyedycwhttpcu.supabase.co/functions/v1/waitlist-signup";

export const metadata: Metadata = {
  title: VANTA.title,
  description: VANTA.metaDescription,
  alternates: { canonical: "/vanta/" },
  openGraph: {
    title: VANTA.title,
    description: VANTA.metaDescription,
    url: "/vanta/",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: VANTA.title }],
  },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
};

export default function VantaPage() {
  return (
    <main
      className="flex min-h-screen flex-col bg-maak-bg"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      <div className="sticky top-0 z-10 border-b border-maak-border/70 bg-maak-bg/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/"
            className="shrink-0 text-sm font-medium text-maak-primary hover:underline"
          >
            ← Tillbaka
          </Link>
          <h1 className="truncate text-base font-semibold tracking-tight text-maak-foreground">
            Väntelista
          </h1>
          <span className="w-[62px]" aria-hidden />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-md">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-36 w-72 -translate-x-1/2 rounded-full bg-maak-primary/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 bottom-2 h-24 w-24 rounded-full bg-maak-coral/10 blur-2xl"
          />

          <div className="mb-[-2rem] flex justify-center">
            <Image
              src="/mascot-vanta.webp"
              alt="MÄÄK mascot"
              width={140}
              height={140}
              className="relative z-10 drop-shadow-lg"
              priority
            />
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-maak-border/80 bg-gradient-to-b from-white to-maak-card px-6 py-10 text-center shadow-[0_28px_60px_-46px_rgba(37,61,44,0.5)] md:px-10 md:py-12">
            <h2 className="whitespace-pre-line text-2xl font-bold tracking-tight text-maak-foreground md:text-3xl">
              {VANTA.heading}
            </h2>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-maak-muted-fg">
              {VANTA.body}
            </p>

            <div className="mt-8">
              <WaitlistForm
                apiUrl={API_URL}
                placeholder={VANTA.inputPlaceholder}
                submitLabel={VANTA.submitLabel}
                submittingLabel={VANTA.submittingLabel}
                successHeading={VANTA.successHeading}
                successBody={VANTA.successBody}
                alreadySignedUp={VANTA.alreadySignedUp}
                errorGeneric={VANTA.errorGeneric}
                errorInvalidEmail={VANTA.errorInvalidEmail}
                errorRateLimit={VANTA.errorRateLimit}
                socialProofSuffix={VANTA.socialProofSuffix}
                fallbackCount={VANTA.fallbackCount}
              />
            </div>

            <p className="mt-6 text-xs text-maak-muted-fg">{VANTA.ageNote}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
