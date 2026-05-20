import { prisma } from "@/lib/prisma";
import LimitedEditionClient, {
  type LimitedEditionCard,
} from "./LimitedEditionClient";

const FEATURED_CATEGORY_SLUG = "pappy";

export default async function LimitedEdition() {
  const product = await prisma.product.findFirst({
    where: { category: { slug: FEATURED_CATEGORY_SLUG } },
    orderBy: { ageYears: "desc" },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });

  if (!product) return null;

  const card: LimitedEditionCard = {
    id: product.id,
    name: product.name,
    ageLabel: product.ageYears ? `${product.ageYears} Year` : "NAS",
    price: product.bottlePrice.toNumber(),
    compareAtPrice: product.compareAtPrice?.toNumber() ?? null,
    proof: product.proof.toNumber(),
    image: product.images[0]?.url ?? "",
    totalBottles: product.totalBottlesProduced,
    rating: product.rating ? product.rating.toNumber() : 0,
    description: product.description,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
  };

  return <LimitedEditionClient product={card} />;
}
