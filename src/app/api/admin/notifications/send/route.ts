import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendToAllSubscribers } from "@/lib/push";

interface SendBody {
  productId?: string;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

// Cloudinary lets us request a notification-friendly size inline via URL
// transformations. We insert the transform between `/upload/` and the rest of
// the path. Non-Cloudinary URLs are returned untouched.
function cloudinaryVariant(url: string, transform: string): string {
  if (!url.includes("res.cloudinary.com")) return url;
  const marker = "/upload/";
  const i = url.indexOf(marker);
  if (i === -1) return url;
  return url.slice(0, i + marker.length) + transform + "/" + url.slice(i + marker.length);
}

export async function POST(req: NextRequest) {
  let body: SendBody;
  try {
    body = (await req.json()) as SendBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const productId = body.productId?.trim();
  if (!productId) {
    return NextResponse.json({ error: "productId is required." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      slug: true,
      name: true,
      subtitle: true,
      description: true,
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { url: true },
      },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const rawImage = product.images[0]?.url;
  // `icon` is the small avatar (iOS renders this; Android renders it too).
  // `image` is the hero / rich image (Android only — iOS ignores it).
  const icon = rawImage
    ? cloudinaryVariant(rawImage, "c_fill,w_192,h_192,f_auto,q_auto")
    : undefined;
  const image = rawImage
    ? cloudinaryVariant(rawImage, "c_fill,w_1024,h_512,f_auto,q_auto")
    : undefined;

  const bodyText = product.subtitle?.trim()
    ? `${product.subtitle.trim()} — ${truncate(product.description.trim(), 140)}`
    : truncate(product.description.trim(), 180);

  const result = await sendToAllSubscribers({
    title: `New arrival: ${product.name}`,
    body: bodyText,
    icon,
    image,
    url: `/products/${product.slug}`,
    tag: `product-${product.id}`,
  });

  return NextResponse.json(result);
}
