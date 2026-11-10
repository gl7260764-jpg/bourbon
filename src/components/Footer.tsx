"use client";

import Link from "next/link";

import { SOCIAL_ICON_PATHS, SOCIAL_PROFILES } from "@/lib/social";

const footerLinks = {
  Shop: [
    { name: "All Bourbon", href: "/shop" },
    { name: "Pappy Van Winkle", href: "/shop?category=pappy" },
    { name: "E.H. Taylor", href: "/shop?category=eh-taylor" },
    { name: "Eagle Rare", href: "/shop?category=eagle-rare" },
    { name: "Weller", href: "/shop?category=weller" },
    { name: "Rye Whiskey", href: "/shop?category=rye" },
    { name: "Limited Editions", href: "/shop?category=limited-edition" },
  ],
  Company: [
    { name: "Our Story", href: "/about" },
    { name: "Distillery Tours", href: "/tours" },
    // The /visit pages are local-search landing pages. The index lives in the
    // footer so every page — the homepage included — links into the section;
    // otherwise those pages are orphans reachable only from the sitemap and a
    // single blog post. One entry rather than one per city: /visit lists them
    // all, and the footer does not grow every time a location is added.
    { name: "Visit & Locations", href: "/visit" },
    { name: "Stories", href: "/blog" },
    { name: "Press", href: "/press" },
    { name: "Careers", href: "/careers" },
    { name: "Contact", href: "/contact" },
  ],
  Support: [
    { name: "FAQ", href: "/faq" },
    { name: "Shipping", href: "/shipping" },
    { name: "Returns", href: "/returns" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer
      id="footer"
      className="bg-bourbon-deep border-t border-bourbon-gold/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 border-2 border-bourbon-gold flex items-center justify-center">
                <span className="font-[family-name:var(--font-playfair)] text-bourbon-gold text-xl font-bold">
                  B
                </span>
              </div>
              <div>
                <span className="font-[family-name:var(--font-playfair)] text-bourbon-cream text-lg font-bold tracking-wide">
                  Bourbon & Oak
                </span>
                <span className="block text-bourbon-gold text-[10px] tracking-[0.3em] uppercase">
                  Est. 1876
                </span>
              </div>
            </div>
            <p className="text-bourbon-cream/50 text-sm leading-relaxed max-w-sm mb-6">
              Handcrafted in the heart of Kentucky, our bourbon is a testament
              to six generations of dedication to the art of distilling.
            </p>
            {/* Social */}
            {/* Follow. One live account, so it gets a labelled button rather
                than a row of bare glyphs: an unlabelled icon is easy to scroll
                past, and the handle says what opens before anyone taps it. */}
            <div className="space-y-3">
              <h4 className="text-bourbon-cream/35 text-[10px] tracking-[0.3em] uppercase">
                Follow
              </h4>
              {SOCIAL_PROFILES.filter(
                (profile) => SOCIAL_ICON_PATHS[profile.name],
              ).map((profile) => (
                <div key={profile.name}>
                  <a
                    href={profile.url}
                    target="_blank"
                    /* rel="me" is the link half of the sameAs identity claim in
                       the Organization schema; noopener because this leaves the
                       site. */
                    rel="me noopener noreferrer"
                    aria-label={`${profile.name}, ${profile.handle} (opens in a new tab)`}
                    className="group inline-flex items-center gap-2.5 rounded-full border border-bourbon-gold/40 bg-bourbon-gold/[0.07] py-2 pl-3.5 pr-4 text-bourbon-cream/85 transition-colors duration-300 hover:border-bourbon-gold hover:bg-bourbon-gold hover:text-bourbon-deep"
                  >
                    <svg
                      className="h-4 w-4 shrink-0 text-bourbon-gold transition-colors duration-300 group-hover:text-bourbon-deep"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d={SOCIAL_ICON_PATHS[profile.name]} />
                    </svg>
                    <span className="text-sm font-semibold tracking-wide">
                      {profile.handle}
                    </span>
                  </a>
                  <p className="text-bourbon-cream/40 text-xs mt-2 max-w-[17rem] leading-relaxed">
                    {profile.blurb}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-bourbon-cream font-semibold text-sm tracking-wider uppercase mb-4">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-bourbon-cream/40 hover:text-bourbon-gold text-sm transition-colors duration-300"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-bourbon-cream/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-bourbon-cream/30 text-xs">
              &copy; 2026 Bourbon & Oak Distillery. All rights reserved.
            </p>
            <p className="text-bourbon-cream/30 text-xs text-center md:text-right">
              Please enjoy responsibly. Bourbon & Oak does not sell to anyone
              under the legal drinking age.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
