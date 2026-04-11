import type { MetadataRoute } from "next";

// Next behöver veta att den här route:n är fullt statisk för att kunna prerendera den
// till en riktig fil i out/ när output: "export" är aktivt.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/_next/", "/api/"],
      },
    ],
    sitemap: "https://maakapp.se/sitemap.xml",
    host: "https://maakapp.se",
  };
}
