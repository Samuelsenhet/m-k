import { ImageResponse } from "next/og";

// Next prerenderar denna till /opengraph-image.png vid build.
// Refereras automatiskt i metadata.openGraph.images för alla sidor som ärver layout.tsx.

export const runtime = "nodejs";
export const dynamic = "force-static";
export const alt = "määk – träffa människor som passar dig";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F2F0EF",
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(75,110,72,0.12), transparent 50%), radial-gradient(circle at 75% 80%, rgba(249,112,104,0.10), transparent 50%)",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 38,
            fontWeight: 700,
            color: "#253D2C",
            letterSpacing: "-0.02em",
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 9999,
              backgroundColor: "#F97068",
            }}
          />
          määk
        </div>

        <div
          style={{
            marginTop: 48,
            fontSize: 86,
            fontWeight: 700,
            lineHeight: 1.05,
            color: "#253D2C",
            letterSpacing: "-0.035em",
            textAlign: "center",
            maxWidth: 1000,
          }}
        >
          Mänskligare dejtande börjar här.
        </div>

        <div
          style={{
            marginTop: 32,
            fontSize: 34,
            color: "#4B6E48",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.35,
          }}
        >
          Färre svep. Mer riktiga samtal. Tryggare möten.
        </div>

        <div
          style={{
            marginTop: 72,
            fontSize: 26,
            color: "#6B7B6E",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 9999,
              backgroundColor: "#F97068",
            }}
          />
          maakapp.se · Tillgänglig på iOS
        </div>
      </div>
    ),
    size,
  );
}
