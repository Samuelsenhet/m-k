import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Extract Instagram username from handle, @handle, or full URL. */
export function getInstagramUsername(value: string): string {
  const s = value.trim().replace(/^@/, '');
  const match = s.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^/?]+)/i) ?? s.match(/^([^/]+)$/);
  return match ? match[1].replace(/\/$/, '') : s;
}

/** Extract LinkedIn username from handle, @handle, or full URL. */
export function getLinkedInUsername(value: string): string {
  const s = value.trim().replace(/^@/, '');
  const match = s.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([^/?]+)/i) ?? s.match(/^([^/]+)$/);
  return match ? match[1].replace(/\/$/, '') : s;
}

/** Normalize all comma-like characters to ASCII comma (U+002C) for consistent app display. */
export function normalizeDisplayCommas(value: string): string {
  if (typeof value !== 'string') return value;
  return value
    .replace(/\u201A/g, ',')  // ‚ single low-9 quotation mark
    .replace(/\uFF0C/g, ',')  // ， fullwidth comma
    .replace(/\u3001/g, ',')  // 、 ideographic comma
    .replace(/\u060C/g, ',')  // ، Arabic comma
    .replace(/\u2E41/g, ',')  // ⹁ reversed comma
    .replace(/\u0312/g, ','); // ʼ modifier letter apostrophe (comma-like)
}
