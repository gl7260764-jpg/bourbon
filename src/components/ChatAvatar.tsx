import { countryFlag } from "@/lib/geo";

/**
 * The person, as a monogram.
 *
 * This replaces a bare 🌐 emoji. That glyph was the country flag's fallback,
 * so every visitor whose country we had not resolved — which is most of them —
 * got the same blue globe. A column of identical blue globes in a cream and
 * gold admin told you nothing and matched nothing.
 *
 * Initials do the job a flag was never doing: they differ per person, so the
 * list is scannable, and they sit in the site's own palette. The flag is still
 * here when we actually know it, demoted to a corner badge where it reads as
 * the detail it is rather than as someone's identity.
 */

/* Drawn from the brand, not from a rainbow: five tones that all sit against
   cream without any one of them shouting. */
const TONES = [
  { bg: "#2A2522", fg: "#E8C46A" }, // deep oak / gold
  { bg: "#6B4A22", fg: "#F6E6C4" }, // cask
  { bg: "#8A6A2F", fg: "#FDF8EC" }, // amber
  { bg: "#3F4A3A", fg: "#DCE6D2" }, // bottle green
  { bg: "#5A3A3A", fg: "#F0DADA" }, // port
] as const;

/**
 * Same person, same colour, every time and on every device.
 *
 * Deterministic from the identity string rather than an index, so a colour
 * does not follow a row's position and change the moment the list reorders —
 * which it does on every new message.
 */
function toneFor(seed: string): (typeof TONES)[number] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return TONES[Math.abs(h) % TONES.length];
}

/** One letter from a name, two from a full one, and never a stray symbol. */
function initialsOf(label: string): string {
  const words = label
    .replace(/[^\p{L}\p{N}\s@.]/gu, " ")
    // An address has no surname; its local part is the only real name in it.
    .split("@")[0]
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export default function ChatAvatar({
  name,
  seed,
  countryCode,
  location,
  size = "md",
}: {
  /** What is shown on the row — a name, else an address, else a codename. */
  name: string;
  /** Stable identity for the colour. Falls back to the label. */
  seed?: string;
  countryCode?: string | null;
  location?: string | null;
  size?: "sm" | "md";
}) {
  const label = name.trim() || "?";
  const tone = toneFor(seed?.trim() || label);
  const initials = initialsOf(label);
  const flag = countryCode ? countryFlag(countryCode) : null;

  const box = size === "sm" ? "h-8 w-8 text-[11px]" : "h-10 w-10 text-xs";

  return (
    <span className="relative inline-flex shrink-0" title={location ?? undefined}>
      <span
        aria-hidden="true"
        className={`${box} inline-flex items-center justify-center rounded-full font-semibold tracking-wide select-none`}
        style={{ backgroundColor: tone.bg, color: tone.fg }}
      >
        {initials}
      </span>
      {flag && (
        /* A badge, not the identity. Ring in the surface colour so it reads as
           sitting on top of the monogram rather than punched into it. */
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] leading-none ring-2 ring-white"
        >
          {flag}
        </span>
      )}
      {/* The visual is decorative; this is what a screen reader gets. */}
      <span className="sr-only">
        {label}
        {location ? `, ${location}` : ""}
      </span>
    </span>
  );
}
