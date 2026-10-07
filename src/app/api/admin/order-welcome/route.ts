import { NextResponse, type NextRequest } from "next/server";
import { DEFAULTS, getOrderWelcome, saveOrderWelcome } from "@/lib/order-welcome";

export const dynamic = "force-dynamic";

/** Admin-gated by middleware, like everything under /api/admin. */
export async function POST(req: NextRequest) {
  let body: { greeting?: string; promise?: string; suggestInstall?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const greeting = (body.greeting ?? "").trim();
  const promise = (body.promise ?? "").trim();

  /* An empty field falls back to the default rather than erroring: a blank
     greeting would otherwise post an empty bubble to every new customer. */
  if (greeting.length > 500 || promise.length > 1000) {
    return NextResponse.json(
      { error: "That is longer than a chat message should be." },
      { status: 400 },
    );
  }

  await saveOrderWelcome({
    greeting: greeting || DEFAULTS.greeting,
    promise: promise || DEFAULTS.promise,
    suggestInstall: body.suggestInstall !== false,
  });

  return NextResponse.json({ ok: true, settings: await getOrderWelcome() });
}
