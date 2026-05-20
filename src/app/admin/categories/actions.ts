"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseIntOrZero(value: FormDataEntryValue | null) {
  if (value == null) return 0;
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function strOrNull(value: FormDataEntryValue | null) {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length === 0 ? null : s;
}

function revalidateStorefrontCategory() {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/collection");
  revalidatePath("/products/[slug]", "page");
}

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const slugRaw = String(formData.get("slug") ?? "").trim();
  const slug = slugify(slugRaw || name);
  const description = strOrNull(formData.get("description"));
  const imageUrl = strOrNull(formData.get("imageUrl"));
  const sortOrder = parseIntOrZero(formData.get("sortOrder"));

  await prisma.category.create({
    data: { name, slug, description, imageUrl, sortOrder },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidateStorefrontCategory();
}

export async function updateCategory(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const slugRaw = String(formData.get("slug") ?? "").trim();
  const slug = slugify(slugRaw || name);
  const description = strOrNull(formData.get("description"));
  const imageUrl = strOrNull(formData.get("imageUrl"));
  const sortOrder = parseIntOrZero(formData.get("sortOrder"));

  await prisma.category.update({
    where: { id },
    data: { name, slug, description, imageUrl, sortOrder },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidateStorefrontCategory();
}

export async function deleteCategory(id: string) {
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    console.warn(
      `Refusing to delete category ${id}: ${productCount} product(s) still attached.`
    );
    return;
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidateStorefrontCategory();
}
