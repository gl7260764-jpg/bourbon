import AdminSidebar from "./AdminSidebar";

export const metadata = {
  title: "Admin | Bourbon & Oak",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
