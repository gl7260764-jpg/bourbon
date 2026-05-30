import type { Metadata } from "next";
import HeroCarousel from "@/components/HeroCarousel";
import BrandStrip from "@/components/BrandStrip";
import FeaturedProducts from "@/components/FeaturedProducts";
import LimitedEdition from "@/components/LimitedEdition";
import HappyHour from "@/components/HappyHour";
import OurProcess from "@/components/OurProcess";
import Testimonials from "@/components/Testimonials";
import RecentNews from "@/components/RecentNews";
import Newsletter from "@/components/Newsletter";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    type: "website",
  },
};

export default function Home() {
  return (
    <main>
      <h1 className="sr-only">
        Bourbon &amp; Oak — Premium Kentucky Bourbon Whiskey, Single Barrel and
        Small Batch from Bardstown
      </h1>
      <HeroCarousel />
      <BrandStrip />
      <HappyHour />
      <FeaturedProducts />
      <LimitedEdition />
      <OurProcess />
      <Testimonials />
      <RecentNews />
      <Newsletter />
    </main>
  );
}
