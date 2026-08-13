// Shared product display formatting.
//
// This exists because the age rule was previously inlined in nine separate
// places as `ageYears ? \`${ageYears} Year\` : "NAS"`. "NAS" is the trade term
// for a bottle with no age statement, but on a customer-facing page it reads
// like an error to anyone who isn't an enthusiast — so a bottle without an age
// now shows nothing at all rather than jargon.
//
// Returning null (not an empty string) forces every caller to decide what to
// do about a missing age, instead of quietly rendering a blank line.

export function ageLabel(ageYears: number | null | undefined): string | null {
  return ageYears ? `${ageYears} Year` : null;
}
