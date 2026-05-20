"use client";

import { useState, useTransition } from "react";
import { updateCategory, deleteCategory } from "./actions";
import ImageUploadField from "@/components/admin/ImageUploadField";

type Row = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
};

export default function CategoryEditor({ category }: { category: Row }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const blocked = category.productCount > 0;

  return (
    <>
      <tr className="border-t border-bourbon-deep/10 hover:bg-bourbon-gold/5 transition-colors">
        <td className="px-4 py-3">
          <p className="text-bourbon-deep font-semibold">{category.name}</p>
          {category.description && (
            <p className="text-bourbon-stone text-xs mt-0.5 line-clamp-1">
              {category.description}
            </p>
          )}
        </td>
        <td className="px-4 py-3 text-bourbon-stone text-sm font-mono">
          {category.slug}
        </td>
        <td className="px-4 py-3 text-bourbon-stone text-sm text-center">
          {category.sortOrder}
        </td>
        <td className="px-4 py-3 text-center">
          <span className="px-2 py-1 bg-bourbon-gold/15 text-bourbon-deep text-[11px] font-bold tracking-widest uppercase">
            {category.productCount}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="px-3 py-1.5 text-[10px] tracking-widest uppercase text-bourbon-deep border border-bourbon-deep/20 hover:border-bourbon-gold hover:text-bourbon-gold transition-colors cursor-pointer"
            >
              {open ? "Cancel" : "Edit"}
            </button>
            <form
              action={() => {
                if (blocked) {
                  alert(
                    `Cannot delete: ${category.productCount} product(s) still attached to this category.`
                  );
                  return;
                }
                if (!confirm(`Delete category "${category.name}"?`)) return;
                startTransition(async () => {
                  await deleteCategory(category.id);
                });
              }}
            >
              <button
                type="submit"
                disabled={isPending || blocked}
                title={
                  blocked
                    ? "Has products — reassign them first"
                    : "Delete category"
                }
                className="px-3 py-1.5 text-[10px] tracking-widest uppercase text-red-700 border border-red-700/30 hover:bg-red-700 hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-red-700"
              >
                {isPending ? "..." : "Delete"}
              </button>
            </form>
          </div>
        </td>
      </tr>

      {open && (
        <tr className="bg-bourbon-warm/30 border-t border-bourbon-deep/5">
          <td colSpan={5} className="px-4 py-4">
            <form
              action={async (fd) => {
                await updateCategory(category.id, fd);
                setOpen(false);
              }}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
            >
              <Field label="Name" className="md:col-span-3">
                <input
                  name="name"
                  required
                  defaultValue={category.name}
                  className="w-full px-3 py-2 bg-white border border-bourbon-deep/15 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold"
                />
              </Field>
              <Field label="Slug" className="md:col-span-3">
                <input
                  name="slug"
                  defaultValue={category.slug}
                  className="w-full px-3 py-2 bg-white border border-bourbon-deep/15 text-bourbon-deep text-sm font-mono focus:outline-none focus:border-bourbon-gold"
                />
              </Field>
              <Field label="Sort order" className="md:col-span-1">
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={category.sortOrder}
                  className="w-full px-3 py-2 bg-white border border-bourbon-deep/15 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold"
                />
              </Field>
              <Field label="Image" className="md:col-span-12">
                <ImageUploadField
                  name="imageUrl"
                  folder="categories"
                  defaultValue={category.imageUrl ?? ""}
                  helperText="JPG, PNG, WebP, GIF or AVIF — max 8 MB."
                />
              </Field>
              <Field label="Description" className="md:col-span-12">
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={category.description ?? ""}
                  className="w-full px-3 py-2 bg-white border border-bourbon-deep/15 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold"
                />
              </Field>
              <div className="md:col-span-12 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-[10px] tracking-widest uppercase text-bourbon-stone hover:text-bourbon-deep cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-bourbon-gold text-white text-[10px] tracking-widest uppercase hover:bg-bourbon-amber transition-colors cursor-pointer"
                >
                  Save changes
                </button>
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="block text-bourbon-stone text-[10px] tracking-widest uppercase mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
