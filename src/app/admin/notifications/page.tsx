import { prisma } from "@/lib/prisma";
import { countSubscribers } from "@/lib/push";
import NotificationsClient from "./NotificationsClient";

export const metadata = { title: "Notifications | Admin" };
export const dynamic = "force-dynamic";

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export default async function NotificationsAdminPage() {
  const [products, subscriberCount] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        subtitle: true,
        description: true,
        bottlePrice: true,
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true, alt: true },
        },
      },
    }),
    countSubscribers(),
  ]);

  const previews = products.map((p) => {
    const image = p.images[0]?.url ?? null;
    const alt = p.images[0]?.alt ?? p.name;
    const body = p.subtitle?.trim()
      ? `${p.subtitle.trim()} — ${truncate(p.description.trim(), 140)}`
      : truncate(p.description.trim(), 180);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      title: `New arrival: ${p.name}`,
      body,
      image,
      alt,
      bottlePrice: Number(p.bottlePrice ?? 0),
    };
  });

  return (
    <>
      <div className="mb-8">
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-2">
          Push notifications
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-deep">
          Announce a product
        </h1>
        <p className="text-bourbon-stone text-sm mt-2">
          Pick any bottle to send a notification to{" "}
          <span className="font-semibold text-bourbon-deep">
            {subscriberCount}
          </span>{" "}
          installed device{subscriberCount === 1 ? "" : "s"}. Only devices that
          installed the PWA and granted notification permission appear in this
          count.
        </p>
      </div>

      <NotificationsClient
        products={previews}
        subscriberCount={subscriberCount}
      />
    </>
  );
}
