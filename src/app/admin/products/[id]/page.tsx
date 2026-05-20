import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductForm from "../ProductForm";
import ProductGalleryManager from "./ProductGalleryManager";
import {
  updateProduct,
  deleteProduct,
  addAward,
  removeAward,
} from "./actions";

type RouteParams = Promise<{ id: string }>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: RouteParams }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: product ? `${product.name} | Admin` : "Product | Admin" };
}

export default async function EditProductPage({
  params,
}: {
  params: RouteParams;
}) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        awards: { orderBy: { year: "desc" } },
        category: { select: { name: true, slug: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  if (!product) notFound();

  const primaryImage =
    product.images.find((i) => i.isPrimary) ?? product.images[0];

  const formValues = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    subtitle: product.subtitle,
    description: product.description,
    story: product.story,
    badge: product.badge,
    bottlePrice: product.bottlePrice.toString(),
    casePrice: product.casePrice ? product.casePrice.toString() : null,
    bottlesPerCase: product.bottlesPerCase,
    compareAtPrice: product.compareAtPrice?.toString() ?? null,
    ageYears: product.ageYears,
    isNAS: product.isNAS,
    proof: product.proof.toString(),
    abv: product.abv.toString(),
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
    productionStyle: product.productionStyle,
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
    videoUrl: product.videoUrl,
    sku: product.sku,
    stockBottles: product.stockBottles,
    stockCases: product.stockCases,
    availability: product.availability,
    rating: product.rating?.toString() ?? null,
    reviewCount: product.reviewCount,
    isFeatured: product.isFeatured,
    categoryId: product.categoryId,
    primaryImageUrl: primaryImage?.url ?? null,
  };

  return (
    <>
      <div className="mb-8">
        <Link
          href="/admin/products"
          className="text-bourbon-stone text-[10px] tracking-widest uppercase hover:text-bourbon-gold transition-colors"
        >
          ← Back to products
        </Link>
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mt-4 mb-2">
          Catalog · {product.category?.name ?? "Uncategorised"}
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-deep">
          {product.name}
        </h1>
        <p className="text-bourbon-stone text-sm mt-1 font-mono">
          {product.sku}
        </p>
      </div>

      <ProductForm
        action={updateProduct.bind(null, product.id)}
        product={formValues}
        categories={categories}
      />

      <ProductGalleryManager
        productId={product.id}
        images={product.images.map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
          sortOrder: img.sortOrder,
          isPrimary: img.isPrimary,
        }))}
      />

      {/* Awards */}
      <section className="bg-white border border-bourbon-deep/10 mt-8">
        <div className="px-5 py-3 border-b border-bourbon-deep/10">
          <h2 className="font-[family-name:var(--font-playfair)] text-base font-bold text-bourbon-deep">
            Awards & recognition
          </h2>
        </div>
        <div className="p-5 space-y-4">
          {product.awards.length === 0 ? (
            <p className="text-bourbon-stone text-sm">
              No awards yet. Add one below.
            </p>
          ) : (
            <ul className="divide-y divide-bourbon-deep/10 border border-bourbon-deep/10">
              {product.awards.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-bourbon-deep font-semibold">{a.name}</p>
                    <p className="text-bourbon-stone text-xs">
                      {[a.organization, a.year, a.medal]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                  <form action={removeAward.bind(null, product.id, a.id)}>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-[10px] tracking-widest uppercase text-red-700 border border-red-700/30 hover:bg-red-700 hover:text-white transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <form
            action={addAward.bind(null, product.id)}
            className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-2"
          >
            <label className="block md:col-span-4">
              <span className="block text-bourbon-stone text-[10px] tracking-widest uppercase mb-1">
                Award name
              </span>
              <input
                name="name"
                required
                placeholder="Best Bourbon"
                className="w-full px-3 py-2 bg-white border border-bourbon-deep/15 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold"
              />
            </label>
            <label className="block md:col-span-3">
              <span className="block text-bourbon-stone text-[10px] tracking-widest uppercase mb-1">
                Organization
              </span>
              <input
                name="organization"
                placeholder="SF World Spirits"
                className="w-full px-3 py-2 bg-white border border-bourbon-deep/15 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="block text-bourbon-stone text-[10px] tracking-widest uppercase mb-1">
                Year
              </span>
              <input
                name="year"
                type="number"
                min="1900"
                max="2100"
                className="w-full px-3 py-2 bg-white border border-bourbon-deep/15 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="block text-bourbon-stone text-[10px] tracking-widest uppercase mb-1">
                Medal
              </span>
              <input
                name="medal"
                placeholder="Gold"
                className="w-full px-3 py-2 bg-white border border-bourbon-deep/15 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold"
              />
            </label>
            <div className="md:col-span-1 flex md:justify-end">
              <button
                type="submit"
                className="w-full md:w-auto px-4 py-2 bg-bourbon-gold text-white text-[10px] tracking-widest uppercase hover:bg-bourbon-amber transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Danger zone */}
      <section className="bg-white border border-red-700/30 mt-8">
        <div className="px-5 py-3 border-b border-red-700/20 bg-red-50">
          <h2 className="font-[family-name:var(--font-playfair)] text-base font-bold text-red-800">
            Delete product
          </h2>
        </div>
        <form
          action={deleteProduct.bind(null, product.id)}
          className="p-5 flex items-center justify-between gap-4 flex-wrap"
        >
          <p className="text-bourbon-stone text-sm max-w-xl">
            Removes <span className="font-semibold text-bourbon-deep">{product.name}</span>{" "}
            permanently, along with all images and awards. Orders that already
            include this bottle are unaffected.
          </p>
          <button
            type="submit"
            className="px-5 py-2.5 bg-red-700 text-white text-[11px] tracking-widest uppercase font-semibold hover:bg-red-800 transition-colors cursor-pointer"
          >
            Delete permanently
          </button>
        </form>
      </section>
    </>
  );
}
