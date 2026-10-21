import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminWorkspace>{children}</AdminWorkspace>;
}
