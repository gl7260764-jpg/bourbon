import HeroCarousel from "@/components/HeroCarousel";
import BrandStrip from "@/components/BrandStrip";
import FeaturedProducts from "@/components/FeaturedProducts";
import LimitedEdition from "@/components/LimitedEdition";
import HappyHour from "@/components/HappyHour";
import OurProcess from "@/components/OurProcess";
import Testimonials from "@/components/Testimonials";
import RecentNews from "@/components/RecentNews";
import Newsletter from "@/components/Newsletter";

export default function Home() {
  return (
    <main>
      <HeroCarousel />
      <BrandStrip />
      <FeaturedProducts />
      <LimitedEdition />
      <HappyHour />
      <OurProcess />
      <Testimonials />
      <RecentNews />
      <Newsletter />
    </main>
  );
}
