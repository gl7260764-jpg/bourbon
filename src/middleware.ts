import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  expectedTokenForCurrentPassword,
} from "@/lib/admin-auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/admin");

  // Login page is the only /admin route that's publicly accessible.
  if (pathname === "/admin/login") return NextResponse.next();

  const expected = await expectedTokenForCurrentPassword();
  if (!expected) {
    if (isApi) {
      return NextResponse.json(
        { error: "Admin password not configured on the server." },
        { status: 503 }
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("error", "unconfigured");
    return NextResponse.redirect(url);
  }

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (token !== expected) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    if (pathname !== "/admin") url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
