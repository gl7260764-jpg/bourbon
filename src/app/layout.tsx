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

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://bourbonandoak.com";

const DEFAULT_OG_IMAGE = "/og/default.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
    siteName: "Bourbon & Oak",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "Bourbon & Oak — Kentucky bourbon distillery" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bourbon & Oak | Premium Kentucky Bourbon Whiskey",
    description:
      "Handcrafted Kentucky bourbon — single barrel, small batch, allocated releases.",
    images: [DEFAULT_OG_IMAGE],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION ?? undefined,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Bourbon & Oak",
  url: SITE_URL,
  logo: `${SITE_URL}/icons/icon-512.png`,
  description:
    "Family-owned Kentucky bourbon distillery in Bardstown — single-barrel, small-batch and allocated Kentucky bourbon since 1876.",
  foundingDate: "1876",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1876 Oak Barrel Lane",
    addressLocality: "Bardstown",
    addressRegion: "KY",
    postalCode: "40004",
    addressCountry: "US",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+1-502-555-0199",
    contactType: "customer service",
    email: "support@bourbonandoak.com",
  },
  sameAs: [],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <SiteChrome>{children}</SiteChrome>
        <InstallPrompt />
      </body>
    </html>
  );
}
