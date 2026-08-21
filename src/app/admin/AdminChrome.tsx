"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

/* The login screen lives under /admin so the middleware can special-case it,
   but it must not inherit the panel chrome: rendering the sidebar there shows
   an unauthenticated visitor the full navigation and a "Sign out" link, and
   nests the login card inside the padded panel container. Layouts are server
   components and cannot read the pathname, so the branch happens here. */
export default function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F4F1EC] text-bourbon-deep">
      <AdminSidebar />
      <main className="lg:pl-64">
        <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
