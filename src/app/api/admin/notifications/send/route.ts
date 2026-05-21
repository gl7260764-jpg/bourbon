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

  const image = product.images[0]?.url;
  const bodyText = product.subtitle?.trim()
    ? `${product.subtitle.trim()} — ${truncate(product.description.trim(), 140)}`
    : truncate(product.description.trim(), 180);

  const result = await sendToAllSubscribers({
    title: `New arrival: ${product.name}`,
    body: bodyText,
    image,
    url: `/products/${product.slug}`,
    tag: `product-${product.id}`,
  });

  return NextResponse.json(result);
}
