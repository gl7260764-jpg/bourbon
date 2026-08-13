import { ageLabel } from "@/lib/product-format";
import { prisma } from "@/lib/prisma";
import FeaturedProductsClient, {
  type FeaturedProductCard,
} from "./FeaturedProductsClient";

export default async function FeaturedProducts() {
  const rows = await prisma.product.findMany({
    where: { isFeatured: true },
    orderBy: { bottlePrice: "asc" },
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
    },
    take: 8,
  });

  const products: FeaturedProductCard[] = rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    ageLabel: ageLabel(p.ageYears),
    price: p.bottlePrice.toNumber(),
    rating: p.rating ? p.rating.toNumber() : 0,
    reviews: p.reviewCount,
    image: p.images[0]?.url ?? "",
    badge: p.badge,
  }));

  return <FeaturedProductsClient products={products} />;
}
