"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartContext";
import SearchOverlay from "./SearchOverlay";

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

  return (
    <header
      className={`animate-fade-down fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        !isHome || scrolled
          ? "bg-bourbon-deep/95 backdrop-blur-md shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 border-2 border-bourbon-gold flex items-center justify-center group-hover:bg-bourbon-gold/10 transition-colors">
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              className="text-bourbon-cream/70 hover:text-bourbon-gold transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="text-bourbon-cream/70 hover:text-bourbon-gold transition-colors cursor-pointer hidden sm:block">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
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
        <nav className="overflow-hidden flex flex-col py-4 px-6 gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-bourbon-cream/80 hover:text-bourbon-gold text-sm tracking-wider uppercase transition-colors py-2"
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
