"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "./login/actions";

const NAV = [
  {
    href: "/admin",
    label: "Dashboard",
    iconPath:
      "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    href: "/admin/products",
    label: "Products",
    iconPath:
      "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    href: "/admin/categories",
    label: "Categories",
    iconPath: "M4 6h16M4 12h16M4 18h16",
  },
  {
    href: "/admin/orders",
    label: "Orders",
    iconPath:
      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    href: "/admin/messages",
    label: "Messages",
    iconPath:
      "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    href: "/admin/subscribers",
    label: "Subscribers",
    iconPath:
      "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    href: "/admin/notifications",
    label: "Notifications",
    iconPath:
      "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  },
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-bourbon-deep text-bourbon-cream px-4 h-14 border-b border-bourbon-gold/20">
        <Link href="/admin" className="font-[family-name:var(--font-playfair)] font-bold tracking-wide">
          Bourbon & Oak
          <span className="text-bourbon-gold text-[10px] tracking-[0.3em] uppercase ml-2">Admin</span>
        </Link>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          className="text-bourbon-cream/80 hover:text-bourbon-gold cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Sidebar (desktop) + slide-down (mobile when open) */}
      <aside
        className={`${
          mobileOpen ? "block" : "hidden"
        } lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-bourbon-deep border-r border-bourbon-gold/10 z-30`}
      >
        <div className="hidden lg:block px-6 py-6 border-b border-bourbon-gold/10">
          <Link href="/admin" className="block">
            <span className="font-[family-name:var(--font-playfair)] text-bourbon-cream text-xl font-bold tracking-wide">
              Bourbon & Oak
            </span>
            <span className="block text-bourbon-gold text-[10px] tracking-[0.4em] uppercase mt-1">
              Cellar Admin
            </span>
          </Link>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium tracking-wide transition-colors ${
                  active
                    ? "bg-bourbon-gold/15 text-bourbon-gold"
                    : "text-bourbon-cream/70 hover:bg-bourbon-cream/5 hover:text-bourbon-cream"
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.iconPath} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 mt-auto border-t border-bourbon-gold/10 absolute bottom-0 left-0 right-0">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 text-sm text-bourbon-cream/60 hover:text-bourbon-gold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            View storefront
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-bourbon-cream/60 hover:text-red-400 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
