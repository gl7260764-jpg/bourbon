"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type Availability =
  | "IN_STOCK"
  | "LOW_STOCK"
  | "ALLOCATED"
  | "PRE_ORDER"
  | "SOLD_OUT"
  | "ARCHIVED";

type ProductionStyle =
  | "SINGLE_BARREL"
  | "SMALL_BATCH"
  | "BOTTLED_IN_BOND"
  | "BARREL_PROOF"
  | "STANDARD";

const AVAILABILITY_VALUES: Availability[] = [
  "IN_STOCK",
  "LOW_STOCK",
  "ALLOCATED",
  "PRE_ORDER",
  "SOLD_OUT",
  "ARCHIVED",
];

const PRODUCTION_STYLE_VALUES: ProductionStyle[] = [
  "SINGLE_BARREL",
  "SMALL_BATCH",
  "BOTTLED_IN_BOND",
  "BARREL_PROOF",
  "STANDARD",
];

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function strOrNull(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v.length === 0 ? null : v;
}

function intOrNull(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v.length === 0) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function intOrZero(fd: FormData, key: string): number {
  return intOrNull(fd, key) ?? 0;
}

function decimalOrNull(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  if (v.length === 0) return null;
  const n = Number(v);
  return Number.isFinite(n) ? v : null;
}

function decimalOrZero(fd: FormData, key: string): string {
  return decimalOrNull(fd, key) ?? "0";
}

function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  if (v == null) return false;
  const s = String(v).toLowerCase();
  return s === "on" || s === "true" || s === "1";
}

function enumOr<T extends string>(
  fd: FormData,
  key: string,
  allowed: T[],
  fallback: T
): T {
  const v = str(fd, key);
  return (allowed as string[]).includes(v) ? (v as T) : fallback;
}

function revalidateStorefrontProduct(slug?: string | null) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/collection");
  revalidatePath("/products/[slug]", "page");
  if (slug) revalidatePath(`/products/${slug}`);
}

function flavorTags(fd: FormData, key: string): string[] {
  const raw = str(fd, key);
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildData(fd: FormData) {
  const name = str(fd, "name") || "Untitled bottle";
  const slug = slugify(str(fd, "slug") || name);
  const sku = str(fd, "sku") || `SKU-${Date.now()}`;

  const data = {
    name,
    slug,
    sku,
    subtitle: strOrNull(fd, "subtitle"),
    description: str(fd, "description"),
    story: strOrNull(fd, "story"),
    badge: strOrNull(fd, "badge"),

    bottlePrice: decimalOrZero(fd, "bottlePrice"),
    casePrice: decimalOrNull(fd, "casePrice"),
    bottlesPerCase: intOrNull(fd, "bottlesPerCase"),
    compareAtPrice: decimalOrNull(fd, "compareAtPrice"),

    ageYears: intOrNull(fd, "ageYears"),
    isNAS: bool(fd, "isNAS"),
    proof: decimalOrZero(fd, "proof"),
    abv: decimalOrZero(fd, "abv"),
    bottleSizeMl: intOrNull(fd, "bottleSizeMl") ?? 750,

    cornPercent: intOrNull(fd, "cornPercent"),
    ryePercent: intOrNull(fd, "ryePercent"),
    wheatPercent: intOrNull(fd, "wheatPercent"),
    maltedBarleyPct: intOrNull(fd, "maltedBarleyPct"),

    distillery: str(fd, "distillery") || "Unknown",
    region: str(fd, "region") || "Unknown",
    state: strOrNull(fd, "state"),
    masterDistiller: strOrNull(fd, "masterDistiller"),
    caskType: strOrNull(fd, "caskType"),
    charLevel: intOrNull(fd, "charLevel"),
    finishCask: strOrNull(fd, "finishCask"),
    batchNumber: strOrNull(fd, "batchNumber"),
    barrelNumber: strOrNull(fd, "barrelNumber"),
    releaseYear: intOrNull(fd, "releaseYear"),

    productionStyle: enumOr<ProductionStyle>(
      fd,
      "productionStyle",
      PRODUCTION_STYLE_VALUES,
      "STANDARD"
    ),
    isChillFiltered: bool(fd, "isChillFiltered"),
    isLimitedEdition: bool(fd, "isLimitedEdition"),
    isAllocated: bool(fd, "isAllocated"),
    totalBottlesProduced: intOrNull(fd, "totalBottlesProduced"),

    nose: strOrNull(fd, "nose"),
    palate: strOrNull(fd, "palate"),
    finish: strOrNull(fd, "finish"),
    flavorTags: flavorTags(fd, "flavorTags"),
    servingSuggestion: strOrNull(fd, "servingSuggestion"),
    foodPairings: strOrNull(fd, "foodPairings"),
    videoUrl: strOrNull(fd, "videoUrl"),

    stockBottles: intOrZero(fd, "stockBottles"),
    stockCases: intOrZero(fd, "stockCases"),
    availability: enumOr<Availability>(
      fd,
      "availability",
      AVAILABILITY_VALUES,
      "IN_STOCK"
    ),
    rating: decimalOrNull(fd, "rating"),
    reviewCount: intOrZero(fd, "reviewCount"),
    isFeatured: bool(fd, "isFeatured"),

    categoryId: str(fd, "categoryId"),
  };

  return { data, primaryImageUrl: strOrNull(fd, "primaryImageUrl") };
}

export async function createProduct(formData: FormData) {
  const { data, primaryImageUrl } = buildData(formData);

  if (!data.categoryId) {
    throw new Error("A category is required to create a product.");
  }

  const created = await prisma.product.create({
    data: data as unknown as Prisma.ProductUncheckedCreateInput,
  });

  if (primaryImageUrl) {
    await prisma.productImage.create({
      data: {
        productId: created.id,
        url: primaryImageUrl,
        alt: created.name,
        sortOrder: 0,
        isPrimary: true,
      },
    });
  }

  revalidatePath("/admin/products");
  revalidateStorefrontProduct(created.slug);
  redirect(`/admin/products/${created.id}`);
}

export async function updateProduct(id: string, formData: FormData) {
  const { data, primaryImageUrl } = buildData(formData);

  if (!data.categoryId) {
    throw new Error("A category is required.");
  }

  const updated = await prisma.product.update({
    where: { id },
    data: data as unknown as Prisma.ProductUncheckedUpdateInput,
    select: { slug: true },
  });

  // Replace primary image with the provided URL (if any).
  const existingPrimary = await prisma.productImage.findFirst({
    where: { productId: id, isPrimary: true },
  });

  if (primaryImageUrl) {
    if (existingPrimary) {
      if (existingPrimary.url !== primaryImageUrl) {
        await prisma.productImage.update({
          where: { id: existingPrimary.id },
          data: { url: primaryImageUrl, alt: data.name },
        });
      }
    } else {
      await prisma.productImage.create({
        data: {
          productId: id,
          url: primaryImageUrl,
          alt: data.name,
          sortOrder: 0,
          isPrimary: true,
        },
      });
    }
  } else if (existingPrimary) {
    await prisma.productImage.delete({ where: { id: existingPrimary.id } });
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidateStorefrontProduct(updated.slug);
  redirect(`/admin/products/${id}`);
}

export async function deleteProduct(id: string) {
  // Manual cascade — schema has cascade on images/awards but cover all bases.
  const removed = await prisma.product.delete({
    where: { id },
    select: { slug: true },
  });
  revalidatePath("/admin/products");
  revalidateStorefrontProduct(removed.slug);
  redirect("/admin/products");
}

// Awards ----------------------------------------------------------------

export async function addAward(productId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const organization = strOrNull(formData, "organization");
  const yearRaw = String(formData.get("year") ?? "").trim();
  const year = yearRaw ? Number(yearRaw) : null;
  const medal = strOrNull(formData, "medal");

  await prisma.award.create({
    data: {
      productId,
      name,
      organization,
      year: Number.isFinite(year) ? (year as number) : null,
      medal,
    },
  });

  revalidatePath(`/admin/products/${productId}`);
}

export async function removeAward(productId: string, awardId: string) {
  await prisma.award.delete({ where: { id: awardId } });
  revalidatePath(`/admin/products/${productId}`);
}

// Gallery images --------------------------------------------------------

async function productSlug(productId: string) {
  const p = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true, name: true },
  });
  return p;
}

export async function addProductImage(productId: string, url: string) {
  const cleanUrl = url.trim();
  if (!cleanUrl) throw new Error("Image URL is required.");

  const product = await productSlug(productId);
  if (!product) throw new Error("Product not found.");

  const last = await prisma.productImage.findFirst({
    where: { productId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.productImage.create({
    data: {
      productId,
      url: cleanUrl,
      alt: product.name,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      isPrimary: false,
    },
  });

  revalidatePath(`/admin/products/${productId}`);
  revalidateStorefrontProduct(product.slug);
}

export async function removeProductImage(productId: string, imageId: string) {
  await prisma.productImage.delete({ where: { id: imageId } });
  const product = await productSlug(productId);
  revalidatePath(`/admin/products/${productId}`);
  revalidateStorefrontProduct(product?.slug);
}

export async function setPrimaryProductImage(
  productId: string,
  imageId: string
) {
  // Demote any other primaries, promote this one — single transaction.
  await prisma.$transaction([
    prisma.productImage.updateMany({
      where: { productId, isPrimary: true, NOT: { id: imageId } },
      data: { isPrimary: false },
    }),
    prisma.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    }),
  ]);

  const product = await productSlug(productId);
  revalidatePath(`/admin/products/${productId}`);
  revalidateStorefrontProduct(product?.slug);
}
