import type { ReactNode } from "react";

import { PublicNavbar } from "@/components/public/PublicNavbar";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicAuthProvider } from "@/features/public/PublicAuthContext";

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PublicAuthProvider>
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <PublicNavbar />

        <main>
          {children}
        </main>

        <PublicFooter />
      </div>
    </PublicAuthProvider>
  );
}