"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartContext";
import SearchOverlay from "./SearchOverlay";
import ShippingTermsBar from "./ShippingTermsBar";
import InstallButton from "./InstallButton";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "/shop" },
  { name: "Collection", href: "/collection" },
  { name: "Stories", href: "/blog" },
  { name: "Contact", href: "/#footer" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  /* Unread replies from us. Polled rather than pushed: the navbar is on every
     page and a socket per page load is far more than a badge is worth. The
     endpoint answers 0 when signed out, so this needs no auth branch. */
  const [unread, setUnread] = useState(0);
  const { totalItems, toggleCart } = useCart();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/account/unread", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { unread?: number };
        if (!cancelled) setUnread(Number(data.unread) || 0);
      } catch {
        /* offline or signed out — leave the badge as it is */
      }
    };
    load();
    const timer = window.setInterval(load, 60_000);
    // Coming back to the tab is the moment a stale badge is most obvious.
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  return (
    <header
      className={`animate-fade-down fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        !isHome || scrolled
          ? "bg-bourbon-deep/95 backdrop-blur-md shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-bourbon-gold flex items-center justify-center shrink-0 group-hover:bg-bourbon-gold/10 transition-colors">
              <span className="font-[family-name:var(--font-playfair)] text-bourbon-gold text-base sm:text-xl font-bold">
                B
              </span>
            </div>
            <div>
              <span className="font-[family-name:var(--font-playfair)] text-bourbon-cream text-[15px] sm:text-lg font-bold tracking-wide whitespace-nowrap">
                Bourbon & Oak
              </span>
              <span className="block text-bourbon-gold text-[8px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase">
                Est. 1876
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm tracking-wider uppercase transition-colors duration-300 relative group ${
                    active
                      ? "text-bourbon-gold"
                      : "text-bourbon-cream/80 hover:text-bourbon-gold"
                  }`}
                >
                  {link.name}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-bourbon-gold transition-all duration-300 ${
                      active ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Renders only while an install is genuinely available. */}
            <InstallButton />
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              className="text-bourbon-cream/70 hover:text-bourbon-gold transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            {/* This icon was previously a dead button. It now goes to the
                account; /account redirects to sign-in when there's no session,
                so one link serves both states. */}
            <Link
              href="/account"
              aria-label={unread > 0 ? `Your account, ${unread} unread` : "Your account"}
              /* Desktop-only on purpose: a fifth icon leaves 0px between the
                 wordmark and the cluster at 320px. The mobile menu carries a
                 labelled entry instead, clearer than a 20px glyph. */
              className="text-bourbon-cream/70 hover:text-bourbon-gold transition-colors cursor-pointer hidden sm:block"
            >
              <span className="relative block">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {unread > 0 && (
                  <span className="animate-pop-in absolute -top-2 -right-2 min-w-4 h-4 px-1 bg-bourbon-gold text-bourbon-deep text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </span>
            </Link>
            <button
              onClick={toggleCart}
              className="relative text-bourbon-cream/70 hover:text-bourbon-gold transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalItems > 0 && (
                <span
                  key={totalItems}
                  className="animate-pop-in absolute -top-2 -right-2 w-4 h-4 bg-bourbon-gold text-bourbon-deep text-[10px] font-bold rounded-full flex items-center justify-center"
                >
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-bourbon-cream/70 hover:text-bourbon-gold transition-colors cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile menu — grid-rows trick avoids `height: auto` animation issues */}
      <div
        className={`md:hidden grid bg-bourbon-deep/98 backdrop-blur-md border-t overflow-hidden transition-all duration-300 ease-out ${
          mobileOpen
            ? "grid-rows-[1fr] opacity-100 border-bourbon-gold/20"
            : "grid-rows-[0fr] opacity-0 border-transparent"
        }`}
      >
        {/* Padding lives on the inner wrapper, not the grid item. A grid item's
            own padding still renders when the track collapses to 0fr, so
            putting it on the <nav> left 32px of dead space under the bar on
            every mobile page even with the menu shut. */}
        <nav className="overflow-hidden">
          <div className="flex flex-col py-4 px-6 gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                tabIndex={mobileOpen ? undefined : -1}
                className="text-bourbon-cream/80 hover:text-bourbon-gold text-sm tracking-wider uppercase transition-colors py-2"
              >
                {link.name}
              </Link>
            ))}

            {/* Account. The icon beside the cart is hidden below sm, and this
                menu previously listed only the marketing sections, so a phone
                had no route to /account or to signing in at all. Separated
                from the section links because it is an account action, not
                another part of the catalogue. /account redirects to sign-in
                when there is no session, so one entry serves both states. */}
            <Link
              href="/account"
              onClick={() => setMobileOpen(false)}
              tabIndex={mobileOpen ? undefined : -1}
              className="mt-1 pt-4 border-t border-bourbon-cream/10 flex items-center gap-3 text-bourbon-gold hover:text-bourbon-amber text-sm tracking-wider uppercase transition-colors py-2"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Sign in / My account
              {unread > 0 && (
                <span className="ml-auto min-w-5 h-5 px-1.5 bg-bourbon-gold text-bourbon-deep text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          </div>
        </nav>
      </div>

      {/* Terms strip. Open exactly when the header has a solid background —
          the same condition that drives the header's own styling above, so the
          two can never disagree. */}
      <ShippingTermsBar show={!isHome || scrolled} />
    </header>
  );
}
