import AdminChrome from "./AdminChrome";

export const metadata = {
  title: "Admin | Bourbon & Oak",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminChrome>{children}</AdminChrome>;
}
