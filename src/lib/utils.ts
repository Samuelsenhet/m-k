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
