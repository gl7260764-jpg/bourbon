"use client";

import { usePathname } from "next/navigation";
import { CartProvider } from "./CartContext";
import { ToastProvider } from "./CartToast";
import AgeVerification from "./AgeVerification";
import Navbar from "./Navbar";
import { TERMS_BAR_HEIGHT } from "./ShippingTermsBar";
import CartDrawer from "./CartDrawer";
import Footer from "./Footer";
import PushManager from "./PushManager";
import Analytics from "./Analytics";
import ChatWidget from "./ChatWidget";
import EmailCapturePopup from "./EmailCapturePopup";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  /* The homepage hero is full-bleed and sits *under* the fixed header by
     design, so it needs no spacer. Every other page pads for an 80px header
     and would lose its first 28px to the terms strip without one. */
  const isHome = pathname === "/";

  /* The unsubscribe page is reached from an email and must be one page and one
     click. The storefront chrome would put an age-gate modal in front of it,
     then a newsletter signup popup and a self-opening chat bubble on top of
     someone who is trying to leave the list. */
  const isBare = isAdmin || pathname?.startsWith("/unsubscribe");

  if (isBare) {
    return <>{children}</>;
  }

  return (
    <CartProvider>
      <ToastProvider>
        <AgeVerification />
        <PushManager />
        <Analytics />
        <Navbar />
        <CartDrawer />
        {!isHome && <div className={TERMS_BAR_HEIGHT} aria-hidden="true" />}
        {children}
        <Footer />
        <ChatWidget />
        <EmailCapturePopup />
      </ToastProvider>
    </CartProvider>
  );
}
