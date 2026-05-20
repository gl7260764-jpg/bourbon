"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, ADMIN_COOKIE_OPTIONS, sha256 } from "@/lib/admin-auth";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  const configured = process.env.BOURBON_ADMIN_PASSWORD;
  if (!configured) {
    redirect("/admin/login?error=unconfigured");
  }
  if (password !== configured) {
    redirect("/admin/login?error=wrong");
  }

  const token = await sha256(password);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    ...ADMIN_COOKIE_OPTIONS,
    secure: process.env.NODE_ENV === "production",
  });

  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
