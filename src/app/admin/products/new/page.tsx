import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductForm from "../ProductForm";
import { createProduct } from "../[id]/actions";

export const metadata = { title: "New product | Admin" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

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
          Catalog
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-deep">
          New product
        </h1>
        <p className="text-bourbon-stone text-sm mt-1">
          Add a new bottle to the cellar. You can refine images and awards after
          creating it.
        </p>
      </div>

      <ProductForm action={createProduct} categories={categories} />
    </>
  );
}
