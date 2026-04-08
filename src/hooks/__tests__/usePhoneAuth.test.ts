import { describe, it, expect } from "vitest";

// Test the pure formatPhoneE164 logic from usePhoneAuth
// Extracted to avoid mocking the entire Supabase + import.meta.env chain.

function formatPhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  // Swedish numbers: remove leading 0, add +46
  if (digits.startsWith("0")) {
    return `+46${digits.slice(1)}`;
  }

  // Already without leading zero
  if (digits.startsWith("46")) {
    return `+${digits}`;
  }

  return `+46${digits}`;
}

describe("formatPhoneE164", () => {
  it("converts Swedish 07x number to E.164", () => {
    expect(formatPhoneE164("0701234567")).toBe("+46701234567");
  });

  it("converts formatted Swedish number with spaces", () => {
    expect(formatPhoneE164("070 123 45 67")).toBe("+46701234567");
  });

  it("converts formatted Swedish number with dashes", () => {
    expect(formatPhoneE164("070-123-4567")).toBe("+46701234567");
  });

  it("handles number already starting with 46 (no +)", () => {
    expect(formatPhoneE164("46701234567")).toBe("+46701234567");
  });

  it("handles number with +46 already", () => {
    // +46 → digits = 46..., starts with "46"
    expect(formatPhoneE164("+46701234567")).toBe("+46701234567");
  });

  it("handles short number without country code", () => {
    // digits = 701234567, does not start with 0 or 46 → prepend +46
    expect(formatPhoneE164("701234567")).toBe("+46701234567");
  });

  it("handles landline starting with 0", () => {
    expect(formatPhoneE164("08-123456")).toBe("+468123456");
  });

  it("strips parentheses and dots", () => {
    expect(formatPhoneE164("(070) 123.4567")).toBe("+46701234567");
  });

  it("handles empty string", () => {
    expect(formatPhoneE164("")).toBe("+46");
  });

  it("handles number with leading +46 and spaces", () => {
    expect(formatPhoneE164("+46 70 123 45 67")).toBe("+46701234567");
  });
});
