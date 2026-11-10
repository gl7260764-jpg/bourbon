"use client";

import Link from "next/link";

import { SOCIAL_PROFILES } from "@/lib/social";

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

/* Icons keyed by the `name` in SOCIAL_PROFILES — JSX does not belong in a data
   module. The accounts we have not opened yet keep their icon ready here: add
   the profile to src/lib/social.ts and it renders, no markup needed. */
const socialIcons: Record<string, React.ReactNode> = {
  TikTok: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  ),
  Instagram: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  Facebook: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  Twitter: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  YouTube: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
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
            <div className="flex gap-4">
              {SOCIAL_PROFILES.filter(
                (profile) => socialIcons[profile.name],
              ).map((profile) => (
                <a
                  key={profile.name}
                  href={profile.url}
                  target="_blank"
                  /* rel="me" is the link half of the sameAs identity claim in
                       the Organization schema; noopener because this leaves the
                       site. */
                  rel="me noopener noreferrer"
                  aria-label={`${profile.name} (opens in a new tab)`}
                  className="text-bourbon-cream/40 hover:text-bourbon-gold transition-colors duration-300"
                >
                  {socialIcons[profile.name]}
                </a>
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
