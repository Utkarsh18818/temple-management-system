import type { ReactNode } from "react";
import { Suspense } from "react";
import { PublicTempleProvider } from "@/features/public/TempleContext";

import { PublicNavbar } from "@/components/public/PublicNavbar";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicAuthProvider } from "@/features/public/PublicAuthContext";
import type { Metadata } from "next";
import "./mandir.css";

export const metadata: Metadata = {
  title: { absolute: "Shri Radha Krishna Mandir | SRMS CET, Bareilly" },
  description: "Visit the Radha Krishna Mandir at SRMS College of Engineering & Technology, Bareilly. Explore daily Panchang, seva, temple celebrations, and visitor information.",
};

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<p className="p-10" role="status">Opening temple portal…</p>}>
    <PublicTempleProvider><PublicAuthProvider>
      <div className="mandir-public min-h-screen">
        <PublicNavbar />

        <main id="main-content" tabIndex={-1}>{children}</main>

        <PublicFooter />
      </div>
    </PublicAuthProvider></PublicTempleProvider>
    </Suspense>
  );
}
