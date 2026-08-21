/* No "use client": the carousel is a pure CSS animation, so this stays a server
   component. Nothing here needs state, an effect, or a JS animation library —
   the whole marquee is one keyframe running on the compositor. */

const testimonials = [
  {
    id: 1,
    name: "James Mitchell",
    title: "Whiskey Connoisseur",
    quote:
      "The Heritage 1876 is unlike anything I've tasted. Rich, complex, with a finish that lingers like a Kentucky sunset. This is bourbon at its absolute finest.",
    rating: 5,
  },
  {
    id: 2,
    name: "Sarah Coleman",
    title: "Bar Owner, The Oak Room",
    quote:
      "We've made Bourbon & Oak our house pour. Our guests consistently praise the smooth character and the depth of flavor. It elevates every cocktail we create.",
    rating: 5,
  },
  {
    id: 3,
    name: "Robert Walker",
    title: "Master Sommelier",
    quote:
      "The Single Barrel Reserve delivers exceptional notes of vanilla, toasted oak, and dark cherry. A masterclass in Kentucky bourbon craftsmanship.",
    rating: 5,
  },
  {
    id: 4,
    name: "Marcus Bell",
    title: "Collector, Louisville",
    quote:
      "I came for the allocated bottles and stayed for the barrel picks. Being told plainly which bottle isn't worth the money is why I keep buying here.",
    rating: 5,
  },
  {
    id: 5,
    name: "Elena Ruiz",
    title: "Beverage Director",
    quote:
      "The Barrel Proof is the most structured pour on our back bar. It takes water beautifully, and it holds its own in a Manhattan without disappearing.",
    rating: 5,
  },
];

/* Initials stand in for a photograph. A stock headshot attached to a real
   person's name implies a portrait that isn't theirs; two letters claim
   nothing. Handles single-word names without producing a doubled letter. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

function Card({ t }: { t: (typeof testimonials)[number] }) {
  return (
    <figure className="w-[19rem] sm:w-[23rem] shrink-0 bg-white border border-bourbon-deep/10 p-6 flex flex-col">
      <div className="flex gap-1 mb-4" aria-label={`${t.rating} out of 5`}>
        {Array.from({ length: t.rating }).map((_, i) => (
          <svg key={i} className="w-4 h-4 text-bourbon-gold" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.286 3.957c.3.922-.755 1.688-1.539 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.783.57-1.838-.196-1.538-1.118l1.286-3.957a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.161a1 1 0 00.951-.69l1.286-3.958z" />
          </svg>
        ))}
      </div>

      <blockquote className="text-bourbon-stone text-[15px] leading-relaxed flex-1">
        &ldquo;{t.quote}&rdquo;
      </blockquote>

      <figcaption className="flex items-center gap-3 mt-5 pt-5 border-t border-bourbon-deep/10">
        <span
          aria-hidden="true"
          className="shrink-0 w-11 h-11 bg-bourbon-deep text-bourbon-gold flex items-center justify-center font-[family-name:var(--font-playfair)] text-sm font-bold tracking-wide"
        >
          {initials(t.name)}
        </span>
        <span className="min-w-0">
          <span className="block font-[family-name:var(--font-playfair)] text-bourbon-deep font-bold leading-tight">
            {t.name}
          </span>
          <span className="block text-bourbon-stone text-xs mt-0.5">{t.title}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export default function Testimonials() {
  return (
    <section className="py-24 bg-bourbon-warm/50 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-bourbon-gold text-xs tracking-[0.3em] uppercase">
            Testimonials
          </span>
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl font-bold text-bourbon-deep mt-3 mb-4">
            What They Say
          </h2>
          <div className="w-20 h-0.5 bg-bourbon-gold mx-auto" />
        </div>
      </div>

      {/* Full-bleed so cards run off both edges rather than stopping at the
          container — that is what makes it read as a continuous belt. */}
      <div className="marquee group relative">
        {/* Feathered edges, so cards fade out instead of being guillotined. */}
        <div className="marquee-mask overflow-hidden">
          <div className="marquee-track flex gap-5 w-max py-1">
            {/* The list is rendered twice. The animation travels exactly -50%,
                so the second copy is under the cursor at the moment the first
                finishes — the loop has no seam and no jump. */}
            {[...testimonials, ...testimonials].map((t, i) => (
              <Card key={`${t.id}-${i}`} t={t} />
            ))}
          </div>
        </div>
      </div>

      <p className="text-center text-bourbon-stone/60 text-xs mt-8">
        Hover to pause.
      </p>
    </section>
  );
}
