// features/profile/preferences/labels.ts
// Maps a BuyerPreferences field's raw stored values (option `value`s,
// e.g. "modernist_villas") to their human-readable `label`s
// (e.g. "Modernist Villas") for the Preferences tab's read-only view —
// the wizard stores values, not labels, so the view has to look them up.

type LabeledOption = { value: string; label: string };

export function labelsFor(options: LabeledOption[], values: string[] | undefined): string[] {
  if (!values || values.length === 0) return [];
  const byValue = new Map(options.map((option) => [option.value, option.label]));
  return values.map((value) => byValue.get(value) ?? value);
}

export function labelFor(options: LabeledOption[], value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return options.find((option) => option.value === value)?.label ?? value;
}
