/** BCP 47-ish tag for formatting dates/numbers when UI language is EN or SV. */
export function appLocaleTag(language: string | undefined): "en-US" | "sv-SE" {
  return language?.toLowerCase().startsWith("en") ? "en-US" : "sv-SE";
}
