import type { Metadata } from "next";
import Hero from "@/components/Hero";
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
      {/* The h1 lives in <Hero> as the visible headline. A hidden one here
          would duplicate it and split the signal. */}
      <Hero />
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
