import type { SelectOption } from "./SelectField";

export const PRONOUN_OPTIONS: SelectOption[] = [
  { value: "hon/henne", label: "hon/henne" },
  { value: "han/honom", label: "han/honom" },
  { value: "hen/hen", label: "hen/hen" },
  { value: "de/dem", label: "de/dem" },
  { value: "annat", label: "annat" },
];

export const GENDER_OPTIONS: SelectOption[] = [
  { value: "kvinna", label: "Kvinna" },
  { value: "man", label: "Man" },
  { value: "icke-binär", label: "Icke-binär" },
  { value: "transkvinna", label: "Transkvinna" },
  { value: "transman", label: "Transman" },
  { value: "annat", label: "Annat" },
];

export const SEXUALITY_OPTIONS: SelectOption[] = [
  { value: "heterosexuell", label: "Heterosexuell" },
  { value: "homosexuell", label: "Homosexuell" },
  { value: "bisexuell", label: "Bisexuell" },
  { value: "pansexuell", label: "Pansexuell" },
  { value: "asexuell", label: "Asexuell" },
  { value: "annat", label: "Annat" },
];

export const LOOKING_FOR_OPTIONS: SelectOption[] = [
  { value: "kvinnor", label: "Kvinnor" },
  { value: "män", label: "Män" },
  { value: "icke-binära", label: "Icke-binära" },
  { value: "alla", label: "Alla" },
];

export const RELIGION_OPTIONS: SelectOption[] = [
  { value: "agnostiker", label: "Agnostiker" },
  { value: "ateist", label: "Ateist" },
  { value: "kristen", label: "Kristen" },
  { value: "muslim", label: "Muslim" },
  { value: "jude", label: "Jude" },
  { value: "buddhist", label: "Buddhist" },
  { value: "hindu", label: "Hindu" },
  { value: "spirituell", label: "Spirituell" },
  { value: "annat", label: "Annat" },
];

export const POLITICS_OPTIONS: SelectOption[] = [
  { value: "vänster", label: "Vänster" },
  { value: "liberal", label: "Liberal" },
  { value: "moderat", label: "Moderat" },
  { value: "konservativ", label: "Konservativ" },
  { value: "höger", label: "Höger" },
  { value: "opolitisk", label: "Opolitisk" },
];

export const ALCOHOL_OPTIONS: SelectOption[] = [
  { value: "aldrig", label: "Aldrig" },
  { value: "sällan", label: "Sällan" },
  { value: "socialt", label: "Socialt" },
  { value: "ofta", label: "Ofta" },
];

export const SMOKING_OPTIONS: SelectOption[] = [
  { value: "aldrig", label: "Aldrig" },
  { value: "ibland", label: "Ibland" },
  { value: "regelbundet", label: "Regelbundet" },
  { value: "dagligen", label: "Dagligen" },
];
