import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { deleteProduct } from "./[id]/actions";

export const metadata = { title: "Products | Admin" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string }>;

function formatPrice(v: unknown) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}`;
}

const AVAIL_CLASS: Record<string, string> = {
  IN_STOCK: "bg-emerald-100 text-emerald-800",
  LOW_STOCK: "bg-amber-100 text-amber-800",
  ALLOCATED: "bg-bourbon-gold/20 text-bourbon-deep",
  PRE_ORDER: "bg-blue-100 text-blue-800",
  SOLD_OUT: "bg-red-100 text-red-700",
  ARCHIVED: "bg-stone-200 text-stone-700",
};

export default async function ProductsAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { sku: { contains: query, mode: "insensitive" as const } },
          { distillery: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true, slug: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true, alt: true },
        },
      },
    }),
    prisma.product.count(),
  ]);

  return (
    <>
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-2">
            Catalog
          </p>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-deep">
            Products
          </h1>
          <p className="text-bourbon-stone text-sm mt-1">
            {totalCount} bottle{totalCount === 1 ? "" : "s"} in the cellar
            {query && (
              <>
                {" "}· showing {products.length} match
                {products.length === 1 ? "" : "es"} for &ldquo;{query}&rdquo;
              </>
            )}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="px-5 py-2.5 bg-bourbon-gold text-white text-[11px] tracking-widest uppercase font-semibold hover:bg-bourbon-amber transition-colors"
        >
          + New product
        </Link>
      </div>

      {/* Search */}
      <form
        method="GET"
        action="/admin/products"
        className="mb-6 flex items-center gap-2"
      >
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search by name, SKU, distillery…"
          className="flex-1 px-4 py-2.5 bg-white border border-bourbon-deep/15 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-bourbon-deep text-bourbon-cream text-[10px] tracking-widest uppercase hover:bg-bourbon-dark transition-colors cursor-pointer"
        >
          Search
        </button>
        {query && (
          <Link
            href="/admin/products"
            className="px-4 py-2.5 text-[10px] tracking-widest uppercase text-bourbon-stone hover:text-bourbon-deep"
          >
            Clear
          </Link>
        )}
      </form>

      <section className="bg-white border border-bourbon-deep/10">
        {products.length === 0 ? (
          <p className="px-5 py-16 text-center text-bourbon-stone text-sm">
            {query ? (
              <>No matches. Try a different search.</>
            ) : (
              <>
                The cellar is empty.{" "}
                <Link
                  href="/admin/products/new"
                  className="text-bourbon-gold hover:text-bourbon-amber underline"
                >
                  Create the first bottle
                </Link>
                .
              </>
            )}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-bourbon-stone text-[10px] tracking-widest uppercase">
                  <th className="px-4 py-3 font-semibold">Bottle</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold text-right">Price</th>
                  <th className="px-4 py-3 font-semibold text-center">Stock</th>
                  <th className="px-4 py-3 font-semibold text-center">
                    Availability
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const img = p.images[0];
                  const availClass =
                    AVAIL_CLASS[p.availability] ?? "bg-stone-200 text-stone-700";
                  return (
                    <tr
                      key={p.id}
                      className="border-t border-bourbon-deep/10 hover:bg-bourbon-gold/5 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="flex items-center gap-3 group"
                        >
                          <div className="relative w-12 h-12 shrink-0 bg-bourbon-warm/40 border border-bourbon-deep/10 overflow-hidden">
                            {img?.url ? (
                              <Image
                                src={img.url}
                                alt={img.alt ?? p.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-bourbon-stone/50 text-[10px]">
                                no img
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-bourbon-deep group-hover:text-bourbon-gold transition-colors truncate">
                              {p.name}
                            </p>
                            <p className="text-bourbon-stone text-xs font-mono truncate">
                              {p.sku}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-bourbon-stone">
                        {p.category?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-[family-name:var(--font-playfair)] font-bold text-bourbon-deep">
                          {formatPrice(p.bottlePrice)}
                        </p>
                        <p className="text-bourbon-stone text-[10px] uppercase tracking-widest">
                          per bottle
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <p className="text-bourbon-deep font-semibold">
                          {p.stockBottles}
                          <span className="text-bourbon-stone text-xs font-normal">
                            {" "}
                            btl
                          </span>
                        </p>
                        <p className="text-bourbon-stone text-[10px] uppercase tracking-widest">
                          {p.stockCases} cs
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 text-[10px] font-bold tracking-widest uppercase ${availClass}`}
                        >
                          {p.availability.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="px-3 py-1.5 text-[10px] tracking-widest uppercase text-bourbon-deep border border-bourbon-deep/20 hover:border-bourbon-gold hover:text-bourbon-gold transition-colors"
                          >
                            Edit
                          </Link>
                          <form action={deleteProduct.bind(null, p.id)}>
                            <button
                              type="submit"
                              className="px-3 py-1.5 text-[10px] tracking-widest uppercase text-red-700 border border-red-700/30 hover:bg-red-700 hover:text-white transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
