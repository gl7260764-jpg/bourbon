import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import SiteChrome from "@/components/SiteChrome";
import InstallPrompt from "@/components/InstallPrompt";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1C1917",
};

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bourbon & Oak | Premium Kentucky Bourbon Whiskey",
  description:
    "Discover handcrafted Kentucky bourbon whiskey aged to perfection in charred oak barrels. Shop our premium collection of single barrel, small batch, and reserve bourbon.",
  keywords: [
    "bourbon",
    "whiskey",
    "Kentucky bourbon",
    "single barrel",
    "small batch",
    "premium spirits",
    "aged whiskey",
  ],
  applicationName: "Bourbon Oak Lover",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Bourbon O&L",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Bourbon & Oak | Premium Kentucky Bourbon Whiskey",
    description:
      "Discover handcrafted Kentucky bourbon whiskey aged to perfection in charred oak barrels.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAFAF9] text-[#0C0A09] font-[family-name:var(--font-inter)]">
        <SiteChrome>{children}</SiteChrome>
        <InstallPrompt />
      </body>
    </html>
  );
}
