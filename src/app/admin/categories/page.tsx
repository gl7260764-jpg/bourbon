import { prisma } from "@/lib/prisma";
import { createCategory } from "./actions";
import CategoryEditor from "./CategoryEditor";
import ImageUploadField from "@/components/admin/ImageUploadField";

export const metadata = { title: "Categories | Admin" };
export const dynamic = "force-dynamic";

export default async function CategoriesAdminPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <>
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-2">
            Catalog
          </p>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-deep">
            Categories
          </h1>
          <p className="text-bourbon-stone text-sm mt-1">
            {categories.length} categor{categories.length === 1 ? "y" : "ies"}{" "}
            organising the cellar.
          </p>
        </div>
      </div>

      {/* Create form */}
      <section className="bg-white border border-bourbon-deep/10 mb-8">
        <div className="px-5 py-4 border-b border-bourbon-deep/10">
          <h2 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-bourbon-deep">
            + Add category
          </h2>
        </div>
        <form
          action={createCategory}
          className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-5"
        >
          <label className="block md:col-span-4">
            <span className="block text-bourbon-stone text-[10px] tracking-widest uppercase mb-1">
              Name
            </span>
            <input
              name="name"
              required
              placeholder="Single Barrel"
              className="w-full px-3 py-2 bg-white border border-bourbon-deep/15 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold"
            />
          </label>
          <label className="block md:col-span-4">
            <span className="block text-bourbon-stone text-[10px] tracking-widest uppercase mb-1">
              Slug
            </span>
            <input
              name="slug"
              placeholder="auto from name"
              className="w-full px-3 py-2 bg-white border border-bourbon-deep/15 text-bourbon-deep text-sm font-mono focus:outline-none focus:border-bourbon-gold"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="block text-bourbon-stone text-[10px] tracking-widest uppercase mb-1">
              Order
            </span>
            <input
              name="sortOrder"
              type="number"
              defaultValue={0}
              className="w-full px-3 py-2 bg-white border border-bourbon-deep/15 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold"
            />
          </label>
          <div className="md:col-span-2 flex md:justify-end">
            <button
              type="submit"
              className="w-full md:w-auto px-5 py-2 bg-bourbon-gold text-white text-[10px] tracking-widest uppercase hover:bg-bourbon-amber transition-colors cursor-pointer"
            >
              Create
            </button>
          </div>
          <label className="block md:col-span-12">
            <span className="block text-bourbon-stone text-[10px] tracking-widest uppercase mb-1">
              Description
            </span>
            <textarea
              name="description"
              rows={2}
              placeholder="Short description shown on the storefront"
              className="w-full px-3 py-2 bg-white border border-bourbon-deep/15 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold"
            />
          </label>
          <div className="block md:col-span-12">
            <span className="block text-bourbon-stone text-[10px] tracking-widest uppercase mb-1">
              Image
            </span>
            <ImageUploadField
              name="imageUrl"
              folder="categories"
              helperText="JPG, PNG, WebP, GIF or AVIF — max 8 MB."
            />
          </div>
        </form>
      </section>

      {/* Table */}
      <section className="bg-white border border-bourbon-deep/10">
        {categories.length === 0 ? (
          <p className="px-5 py-12 text-center text-bourbon-stone text-sm">
            No categories yet. Add the first one above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-bourbon-stone text-[10px] tracking-widest uppercase">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Slug</th>
                  <th className="px-4 py-3 font-semibold text-center">Order</th>
                  <th className="px-4 py-3 font-semibold text-center">
                    Products
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <CategoryEditor
                    key={c.id}
                    category={{
                      id: c.id,
                      name: c.name,
                      slug: c.slug,
                      description: c.description,
                      imageUrl: c.imageUrl,
                      sortOrder: c.sortOrder,
                      productCount: c._count.products,
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
