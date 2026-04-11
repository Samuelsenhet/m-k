import type { MetadataRoute } from "next";

// Next behöver veta att den här route:n är fullt statisk för att kunna prerendera den
// till en riktig fil i out/ när output: "export" är aktivt.
export const dynamic = "force-static";

const BASE = "https://maakapp.se";

type Route = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

// /vilkor är alias för /terms — inkluderas inte för att undvika duplicerat innehåll i sitemap.
const ROUTES: Route[] = [
  { path: "", changeFrequency: "weekly", priority: 1.0 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.4 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.4 },
  { path: "/reporting", changeFrequency: "yearly", priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map((r) => ({
    url: `${BASE}${r.path}/`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
