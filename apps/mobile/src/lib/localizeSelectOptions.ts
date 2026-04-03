import type { TFunction } from "i18next";

import type { SelectOption } from "@/components/onboarding/SelectField";

export function localizeSelectOptions(
  options: SelectOption[],
  group:
    | "pronoun"
    | "gender"
    | "sexuality"
    | "looking_for"
    | "religion"
    | "politics"
    | "alcohol"
    | "smoking",
  t: TFunction,
): SelectOption[] {
  return options.map((o) => ({
    value: o.value,
    label: t(`mobile.select.${group}.${o.value}`, { defaultValue: o.label }),
  }));
}
