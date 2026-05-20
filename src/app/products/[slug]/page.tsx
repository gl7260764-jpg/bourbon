import { notFound } from "next/navigation";
import { Availability, ProductionStyle } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import ProductDetailClient, { type ProductDetailData } from "./ProductDetailClient";
import RelatedProducts, { type RelatedProductCard } from "./RelatedProducts";

const PRODUCTION_STYLE_LABELS: Record<ProductionStyle, string> = {
  SINGLE_BARREL: "Single Barrel",
  SMALL_BATCH: "Small Batch",
  BOTTLED_IN_BOND: "Bottled in Bond",
  BARREL_PROOF: "Barrel Proof",
  STANDARD: "Kentucky Straight Bourbon",
};

const AVAILABILITY_LABELS: Partial<Record<Availability, string>> = {
  LOW_STOCK: "Low Stock",
  ALLOCATED: "Allocated",
  PRE_ORDER: "Pre-order",
  SOLD_OUT: "Sold Out",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, subtitle: true, description: true },
  });
  if (!product) return { title: "Not Found | Bourbon & Oak" };
  return {
    title: `${product.name} | Bourbon & Oak`,
    description: product.subtitle ?? product.description.slice(0, 160),
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      awards: { orderBy: { year: "desc" } },
    },
  });

  if (!product) notFound();

  const relatedRows = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      NOT: { id: product.id },
    },
    orderBy: { isFeatured: "desc" },
    take: 3,
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });

  const data: ProductDetailData = {
    id: product.id,
    name: product.name,
    subtitle: product.subtitle,
    description: product.description,
    story: product.story,
    badge: product.badge,

    bottlePrice: product.bottlePrice.toNumber(),
    casePrice: product.casePrice ? product.casePrice.toNumber() : null,
    bottlesPerCase: product.bottlesPerCase,
    compareAtPrice: product.compareAtPrice?.toNumber() ?? null,

    ageLabel: product.ageYears ? `${product.ageYears} Year` : "NAS",
    proof: product.proof.toNumber(),
    abv: product.abv.toNumber(),
    bottleSizeMl: product.bottleSizeMl,

    cornPercent: product.cornPercent,
    ryePercent: product.ryePercent,
    wheatPercent: product.wheatPercent,
    maltedBarleyPct: product.maltedBarleyPct,

    distillery: product.distillery,
    region: product.region,
    state: product.state,
    masterDistiller: product.masterDistiller,
    caskType: product.caskType,
    charLevel: product.charLevel,
    finishCask: product.finishCask,
    batchNumber: product.batchNumber,
    barrelNumber: product.barrelNumber,
    releaseYear: product.releaseYear,

    productionStyleLabel: PRODUCTION_STYLE_LABELS[product.productionStyle],
    isChillFiltered: product.isChillFiltered,
    isLimitedEdition: product.isLimitedEdition,
    isAllocated: product.isAllocated,
    totalBottlesProduced: product.totalBottlesProduced,

    nose: product.nose,
    palate: product.palate,
    finish: product.finish,
    flavorTags: product.flavorTags,
    servingSuggestion: product.servingSuggestion,
    foodPairings: product.foodPairings,

    rating: product.rating ? product.rating.toNumber() : 0,
    reviewCount: product.reviewCount,
    availabilityLabel: AVAILABILITY_LABELS[product.availability] ?? null,

    videoUrl: product.videoUrl,

    category: { name: product.category.name, slug: product.category.slug },
    images: product.images.map((img) => ({ url: img.url, alt: img.alt })),
    awards: product.awards.map((a) => ({
      id: a.id,
      name: a.name,
      organization: a.organization,
      year: a.year,
      medal: a.medal,
    })),
  };

  const related: RelatedProductCard[] = relatedRows.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    ageLabel: p.ageYears ? `${p.ageYears} Year` : "NAS",
    price: p.bottlePrice.toNumber(),
    image: p.images[0]?.url ?? "",
  }));

  return (
    <>
      <ProductDetailClient product={data} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <RelatedProducts products={related} categoryName={data.category.name} />
      </div>
    </>
  );
}

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ select: { slug: true } });
  return products.map((p) => ({ slug: p.slug }));
}
