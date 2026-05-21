"use client";

import { usePathname } from "next/navigation";
import { CartProvider } from "./CartContext";
import { ToastProvider } from "./CartToast";
import AgeVerification from "./AgeVerification";
import Navbar from "./Navbar";
import CartDrawer from "./CartDrawer";
import Footer from "./Footer";
import PushManager from "./PushManager";
import Analytics from "./Analytics";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

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
        {children}
        <Footer />
      </ToastProvider>
    </CartProvider>
  );
}
