"use client";

import Link from "next/link";
import { useState } from "react";
import ImageUploadField from "@/components/admin/ImageUploadField";

type CategoryOption = { id: string; name: string };

export type ProductFormValues = {
  id?: string;
  name?: string | null;
  slug?: string | null;
  subtitle?: string | null;
  description?: string | null;
  story?: string | null;
  badge?: string | null;

  bottlePrice?: string | number | null;
  casePrice?: string | number | null;
  bottlesPerCase?: number | null;
  compareAtPrice?: string | number | null;

  ageYears?: number | null;
  isNAS?: boolean;
  proof?: string | number | null;
  abv?: string | number | null;
  bottleSizeMl?: number | null;

  cornPercent?: number | null;
  ryePercent?: number | null;
  wheatPercent?: number | null;
  maltedBarleyPct?: number | null;

  distillery?: string | null;
  region?: string | null;
  state?: string | null;
  masterDistiller?: string | null;
  caskType?: string | null;
  charLevel?: number | null;
  finishCask?: string | null;
  batchNumber?: string | null;
  barrelNumber?: string | null;
  releaseYear?: number | null;

  productionStyle?: string | null;
  isChillFiltered?: boolean;
  isLimitedEdition?: boolean;
  isAllocated?: boolean;
  totalBottlesProduced?: number | null;

  nose?: string | null;
  palate?: string | null;
  finish?: string | null;
  flavorTags?: string[];
  servingSuggestion?: string | null;
  foodPairings?: string | null;
  videoUrl?: string | null;

  sku?: string | null;
  stockBottles?: number | null;
  stockCases?: number | null;
  availability?: string | null;
  rating?: string | number | null;
  reviewCount?: number | null;
  isFeatured?: boolean;

  categoryId?: string | null;
  primaryImageUrl?: string | null;
};

const AVAILABILITY_OPTIONS = [
  "IN_STOCK",
  "LOW_STOCK",
  "ALLOCATED",
  "PRE_ORDER",
  "SOLD_OUT",
  "ARCHIVED",
] as const;

const PRODUCTION_STYLE_OPTIONS = [
  "STANDARD",
  "SINGLE_BARREL",
  "SMALL_BATCH",
  "BOTTLED_IN_BOND",
  "BARREL_PROOF",
] as const;

function val(v: unknown): string {
  if (v == null) return "";
  return String(v);
}

export default function ProductForm({
  action,
  product,
  categories,
}: {
  action: (formData: FormData) => void | Promise<void>;
  product?: ProductFormValues;
  categories: CategoryOption[];
}) {
  const isEdit = !!product?.id;
  const [submitting, setSubmitting] = useState(false);

  const initialFlavor = (product?.flavorTags ?? []).join(", ");

  return (
    <form
      action={action}
      onSubmit={() => setSubmitting(true)}
      className="space-y-6"
    >
      {/* Basics */}
      <Section title="Basics">
        <Grid>
          <Field label="Name" className="md:col-span-6">
            <input
              name="name"
              required
              defaultValue={val(product?.name)}
              className={inputClass}
            />
          </Field>
          <Field label="Slug" className="md:col-span-3">
            <input
              name="slug"
              defaultValue={val(product?.slug)}
              placeholder="auto from name"
              className={`${inputClass} font-mono`}
            />
          </Field>
          <Field label="Badge" className="md:col-span-3">
            <input
              name="badge"
              defaultValue={val(product?.badge)}
              placeholder="e.g. Best Seller"
              className={inputClass}
            />
          </Field>
          <Field label="Subtitle" className="md:col-span-12">
            <input
              name="subtitle"
              defaultValue={val(product?.subtitle)}
              className={inputClass}
            />
          </Field>
          <Field label="Description" className="md:col-span-12">
            <textarea
              name="description"
              rows={3}
              required
              defaultValue={val(product?.description)}
              className={inputClass}
            />
          </Field>
          <Field label="Story" className="md:col-span-12">
            <textarea
              name="story"
              rows={3}
              defaultValue={val(product?.story)}
              className={inputClass}
            />
          </Field>
        </Grid>
      </Section>

      {/* Pricing */}
      <Section title="Pricing">
        <Grid>
          <Field label="Bottle price (USD)" className="md:col-span-3">
            <input
              name="bottlePrice"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={val(product?.bottlePrice)}
              className={inputClass}
            />
          </Field>
          <Field label="Case price (USD)" className="md:col-span-3">
            <input
              name="casePrice"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={val(product?.casePrice)}
              className={inputClass}
            />
          </Field>
          <Field label="Bottles per case" className="md:col-span-3">
            <input
              name="bottlesPerCase"
              type="number"
              min="1"
              defaultValue={val(product?.bottlesPerCase ?? 6)}
              className={inputClass}
            />
          </Field>
          <Field label="Compare-at price" className="md:col-span-3">
            <input
              name="compareAtPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={val(product?.compareAtPrice)}
              className={inputClass}
            />
          </Field>
        </Grid>
      </Section>

      {/* Specs */}
      <Section title="Specs">
        <Grid>
          <Field label="Age (years)" className="md:col-span-3">
            <input
              name="ageYears"
              type="number"
              min="0"
              defaultValue={val(product?.ageYears)}
              className={inputClass}
            />
          </Field>
          <Field label="Proof" className="md:col-span-3">
            <input
              name="proof"
              type="number"
              step="0.1"
              min="0"
              required
              defaultValue={val(product?.proof)}
              className={inputClass}
            />
          </Field>
          <Field label="ABV %" className="md:col-span-3">
            <input
              name="abv"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={val(product?.abv)}
              className={inputClass}
            />
          </Field>
          <Field label="Bottle size (mL)" className="md:col-span-3">
            <input
              name="bottleSizeMl"
              type="number"
              min="1"
              defaultValue={val(product?.bottleSizeMl ?? 750)}
              className={inputClass}
            />
          </Field>
          <CheckboxField
            name="isNAS"
            label="No age statement (NAS)"
            defaultChecked={!!product?.isNAS}
            className="md:col-span-12"
          />
        </Grid>
      </Section>

      {/* Mash bill */}
      <Section title="Mash bill (% — should total ~100)">
        <Grid>
          <Field label="Corn %" className="md:col-span-3">
            <input
              name="cornPercent"
              type="number"
              min="0"
              max="100"
              defaultValue={val(product?.cornPercent)}
              className={inputClass}
            />
          </Field>
          <Field label="Rye %" className="md:col-span-3">
            <input
              name="ryePercent"
              type="number"
              min="0"
              max="100"
              defaultValue={val(product?.ryePercent)}
              className={inputClass}
            />
          </Field>
          <Field label="Wheat %" className="md:col-span-3">
            <input
              name="wheatPercent"
              type="number"
              min="0"
              max="100"
              defaultValue={val(product?.wheatPercent)}
              className={inputClass}
            />
          </Field>
          <Field label="Malted barley %" className="md:col-span-3">
            <input
              name="maltedBarleyPct"
              type="number"
              min="0"
              max="100"
              defaultValue={val(product?.maltedBarleyPct)}
              className={inputClass}
            />
          </Field>
        </Grid>
      </Section>

      {/* Provenance */}
      <Section title="Provenance">
        <Grid>
          <Field label="Distillery" className="md:col-span-6">
            <input
              name="distillery"
              required
              defaultValue={val(product?.distillery)}
              className={inputClass}
            />
          </Field>
          <Field label="Region" className="md:col-span-3">
            <input
              name="region"
              required
              defaultValue={val(product?.region)}
              className={inputClass}
            />
          </Field>
          <Field label="State" className="md:col-span-3">
            <input
              name="state"
              defaultValue={val(product?.state)}
              className={inputClass}
            />
          </Field>
          <Field label="Master distiller" className="md:col-span-6">
            <input
              name="masterDistiller"
              defaultValue={val(product?.masterDistiller)}
              className={inputClass}
            />
          </Field>
          <Field label="Cask type" className="md:col-span-3">
            <input
              name="caskType"
              defaultValue={val(product?.caskType)}
              placeholder="New American White Oak"
              className={inputClass}
            />
          </Field>
          <Field label="Char level (1-4)" className="md:col-span-3">
            <input
              name="charLevel"
              type="number"
              min="1"
              max="4"
              defaultValue={val(product?.charLevel)}
              className={inputClass}
            />
          </Field>
          <Field label="Finish cask" className="md:col-span-3">
            <input
              name="finishCask"
              defaultValue={val(product?.finishCask)}
              placeholder="Sherry / Port / none"
              className={inputClass}
            />
          </Field>
          <Field label="Batch #" className="md:col-span-3">
            <input
              name="batchNumber"
              defaultValue={val(product?.batchNumber)}
              className={inputClass}
            />
          </Field>
          <Field label="Barrel #" className="md:col-span-3">
            <input
              name="barrelNumber"
              defaultValue={val(product?.barrelNumber)}
              className={inputClass}
            />
          </Field>
          <Field label="Release year" className="md:col-span-3">
            <input
              name="releaseYear"
              type="number"
              min="1700"
              max="2100"
              defaultValue={val(product?.releaseYear)}
              className={inputClass}
            />
          </Field>
        </Grid>
      </Section>

      {/* Production */}
      <Section title="Production">
        <Grid>
          <Field label="Production style" className="md:col-span-6">
            <select
              name="productionStyle"
              defaultValue={val(product?.productionStyle) || "STANDARD"}
              className={inputClass}
            >
              {PRODUCTION_STYLE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Total bottles produced" className="md:col-span-6">
            <input
              name="totalBottlesProduced"
              type="number"
              min="0"
              defaultValue={val(product?.totalBottlesProduced)}
              className={inputClass}
            />
          </Field>
          <CheckboxField
            name="isChillFiltered"
            label="Chill filtered"
            defaultChecked={product?.isChillFiltered ?? true}
            className="md:col-span-4"
          />
          <CheckboxField
            name="isLimitedEdition"
            label="Limited edition"
            defaultChecked={!!product?.isLimitedEdition}
            className="md:col-span-4"
          />
          <CheckboxField
            name="isAllocated"
            label="Allocated"
            defaultChecked={!!product?.isAllocated}
            className="md:col-span-4"
          />
        </Grid>
      </Section>

      {/* Tasting */}
      <Section title="Tasting notes">
        <Grid>
          <Field label="Nose" className="md:col-span-4">
            <textarea
              name="nose"
              rows={2}
              defaultValue={val(product?.nose)}
              className={inputClass}
            />
          </Field>
          <Field label="Palate" className="md:col-span-4">
            <textarea
              name="palate"
              rows={2}
              defaultValue={val(product?.palate)}
              className={inputClass}
            />
          </Field>
          <Field label="Finish" className="md:col-span-4">
            <textarea
              name="finish"
              rows={2}
              defaultValue={val(product?.finish)}
              className={inputClass}
            />
          </Field>
          <Field
            label="Flavor tags (comma-separated)"
            className="md:col-span-12"
          >
            <input
              name="flavorTags"
              defaultValue={initialFlavor}
              placeholder="vanilla, oak, caramel"
              className={inputClass}
            />
          </Field>
          <Field label="Serving suggestion" className="md:col-span-6">
            <input
              name="servingSuggestion"
              defaultValue={val(product?.servingSuggestion)}
              className={inputClass}
            />
          </Field>
          <Field label="Video URL" className="md:col-span-6">
            <input
              name="videoUrl"
              type="url"
              defaultValue={val(product?.videoUrl)}
              className={inputClass}
            />
          </Field>
          <Field label="Food pairings" className="md:col-span-12">
            <textarea
              name="foodPairings"
              rows={2}
              defaultValue={val(product?.foodPairings)}
              className={inputClass}
            />
          </Field>
        </Grid>
      </Section>

      {/* Commerce */}
      <Section title="Commerce">
        <Grid>
          <Field label="SKU" className="md:col-span-4">
            <input
              name="sku"
              required
              defaultValue={val(product?.sku)}
              className={`${inputClass} font-mono`}
            />
          </Field>
          <Field label="Stock — bottles" className="md:col-span-4">
            <input
              name="stockBottles"
              type="number"
              min="0"
              defaultValue={val(product?.stockBottles ?? 0)}
              className={inputClass}
            />
          </Field>
          <Field label="Stock — cases" className="md:col-span-4">
            <input
              name="stockCases"
              type="number"
              min="0"
              defaultValue={val(product?.stockCases ?? 0)}
              className={inputClass}
            />
          </Field>
          <Field label="Availability" className="md:col-span-4">
            <select
              name="availability"
              defaultValue={val(product?.availability) || "IN_STOCK"}
              className={inputClass}
            >
              {AVAILABILITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Rating (0-5)" className="md:col-span-4">
            <input
              name="rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              defaultValue={val(product?.rating)}
              className={inputClass}
            />
          </Field>
          <Field label="Review count" className="md:col-span-4">
            <input
              name="reviewCount"
              type="number"
              min="0"
              defaultValue={val(product?.reviewCount ?? 0)}
              className={inputClass}
            />
          </Field>
          <CheckboxField
            name="isFeatured"
            label="Featured on homepage"
            defaultChecked={!!product?.isFeatured}
            className="md:col-span-12"
          />
        </Grid>
      </Section>

      {/* Category + image */}
      <Section title="Category & image">
        <Grid>
          <Field label="Category" className="md:col-span-6">
            <select
              name="categoryId"
              required
              defaultValue={val(product?.categoryId)}
              className={inputClass}
            >
              <option value="">— Select a category —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-amber-700 text-xs mt-1">
                No categories exist yet —{" "}
                <Link
                  href="/admin/categories"
                  className="underline hover:text-bourbon-gold"
                >
                  create one first
                </Link>
                .
              </p>
            )}
          </Field>
          <Field label="Primary image" className="md:col-span-6">
            <ImageUploadField
              name="primaryImageUrl"
              folder="products"
              defaultValue={product?.primaryImageUrl ?? ""}
              helperText={
                isEdit
                  ? "Headline image shown first on the storefront. Manage additional gallery images below."
                  : "Headline image shown first on the storefront. You can add more gallery images after creating the product."
              }
            />
          </Field>
        </Grid>
      </Section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-bourbon-deep/10">
        <Link
          href="/admin/products"
          className="px-5 py-2.5 text-[11px] tracking-widest uppercase text-bourbon-stone hover:text-bourbon-deep"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="px-7 py-2.5 bg-bourbon-gold text-white text-[11px] tracking-widest uppercase font-semibold hover:bg-bourbon-amber transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
        >
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full px-3 py-2 bg-white border border-bourbon-deep/15 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold transition-colors";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-bourbon-deep/10">
      <div className="px-5 py-3 border-b border-bourbon-deep/10">
        <h2 className="font-[family-name:var(--font-playfair)] text-base font-bold text-bourbon-deep">
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-12 gap-4">{children}</div>;
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

function CheckboxField({
  name,
  label,
  defaultChecked,
  className,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  className?: string;
}) {
  return (
    <label
      className={`flex items-center gap-3 px-3 py-2.5 border border-bourbon-deep/15 bg-white cursor-pointer hover:border-bourbon-gold transition-colors ${
        className ?? ""
      }`}
    >
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="w-4 h-4 accent-bourbon-gold"
      />
      <span className="text-bourbon-deep text-sm font-medium">{label}</span>
    </label>
  );
}
