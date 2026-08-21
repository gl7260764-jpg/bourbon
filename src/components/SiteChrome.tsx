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

  if (isAdmin) {
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
