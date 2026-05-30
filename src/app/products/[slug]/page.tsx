import { notFound } from "next/navigation";
import type { Metadata } from "next";
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

// Trim a sentence at a word boundary so meta descriptions never cut mid-word.
function trimAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      subtitle: true,
      description: true,
      images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
  if (!product) {
    return {
      title: "Not Found | Bourbon & Oak",
      robots: { index: false, follow: false },
    };
  }
  const rawDescription =
    product.subtitle?.trim() ||
    `${product.name} — Kentucky bourbon tasting notes, mash bill, proof, age and provenance. Ships from our Bardstown cellar.`;
  const description = trimAtWord(rawDescription, 158);
  const imageUrl = product.images[0]?.url;
  return {
    title: `${product.name} | Bourbon & Oak`,
    description,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title: `${product.name} | Bourbon & Oak`,
      description,
      url: `/products/${slug}`,
      type: "website",
      images: imageUrl ? [{ url: imageUrl, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Bourbon & Oak`,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
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

  // Map Prisma's Availability enum to schema.org item-availability URIs.
  // OutOfStock is the safe default for anything we haven't explicitly mapped.
  const availabilitySchema =
    product.availability === "SOLD_OUT"
      ? "https://schema.org/OutOfStock"
      : product.availability === "PRE_ORDER"
      ? "https://schema.org/PreOrder"
      : product.availability === "ALLOCATED"
      ? "https://schema.org/LimitedAvailability"
      : "https://schema.org/InStock";

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    sku: product.id,
    brand: { "@type": "Brand", name: product.distillery },
    category: product.category.name,
    offers: {
      "@type": "Offer",
      url: `/products/${product.slug}`,
      priceCurrency: "USD",
      price: product.bottlePrice.toString(),
      availability: availabilitySchema,
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(product.rating && product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating.toNumber(),
            reviewCount: product.reviewCount,
          },
        }
      : {}),
    additionalProperty: [
      product.ageYears
        ? { "@type": "PropertyValue", name: "Age", value: `${product.ageYears} years` }
        : null,
      { "@type": "PropertyValue", name: "Proof", value: product.proof.toString() },
      { "@type": "PropertyValue", name: "ABV", value: `${product.abv.toString()}%` },
      product.masterDistiller
        ? { "@type": "PropertyValue", name: "Master Distiller", value: product.masterDistiller }
        : null,
    ].filter(Boolean),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      { "@type": "ListItem", position: 2, name: "Shop", item: "/shop" },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category.name,
        item: `/shop?category=${product.category.slug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: `/products/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
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
