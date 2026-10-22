import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Noto_Sans,
  Noto_Serif_Devanagari,
} from "next/font/google";

import { AppProvider } from "@/components/providers/app-provider";

import "./globals.css";

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const sansFont = Noto_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const devanagariFont = Noto_Serif_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: "variable",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TempleOS",
    template: "%s | TempleOS",
  },
  description:
    "A modern digital platform for temple management, devotees, sevas, donations and temple events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${displayFont.variable} ${sansFont.variable} ${devanagariFont.variable}`}
      >
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
