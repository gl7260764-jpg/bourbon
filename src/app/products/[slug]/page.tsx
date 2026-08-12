import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Availability, ProductionStyle } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildProductMeta, getProductSeo } from "@/lib/product-seo";
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

// Canonical host — schema.org requires absolute URLs, so JSON-LD can't use
// the relative paths that Next resolves for tags via metadataBase.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://bourbonoaklover.com";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      subtitle: true,
      description: true,
      proof: true,
      ageYears: true,
      category: { select: { name: true } },
      images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
  if (!product) {
    return {
      title: "Not Found | Bourbon & Oak",
      robots: { index: false, follow: false },
    };
  }

  // Researched copy where we have it, formula fallback otherwise.
  const meta = buildProductMeta({
    slug,
    name: product.name,
    subtitle: product.subtitle,
    proof: product.proof.toString(),
    ageYears: product.ageYears,
    category: product.category.name,
  });

  const imageUrl = product.images[0]?.url;
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `/products/${slug}`,
      type: "website",
      images: imageUrl ? [{ url: imageUrl, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
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

  const productSeo = getProductSeo(product.slug);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    // Where the bottle is searched under a different name than the label
    // carries (e.g. Old Rip Van Winkle is searched as "Pappy Van Winkle
    // 10 Year"), declare it rather than leaving Google to infer it.
    ...(productSeo?.alternateName
      ? { alternateName: productSeo.alternateName }
      : {}),
    description: product.description,
    image: product.images.map((i) => i.url),
    // The real stock-keeping unit, not the internal cuid.
    sku: product.sku,
    brand: { "@type": "Brand", name: product.distillery },
    category: product.category.name,
    offers: {
      "@type": "Offer",
      // schema.org URLs must be absolute — a relative path here is ignored.
      url: `${SITE_URL}/products/${product.slug}`,
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
    // Absolute URLs throughout — relative `item` values are dropped by Google.
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category.name,
        item: `${SITE_URL}/shop?category=${product.category.slug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: `${SITE_URL}/products/${product.slug}`,
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
