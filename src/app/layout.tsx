/**
 * app/layout.tsx — Root Layout
 *
 * Wraps the entire application with:
 *  - TanStack Query provider (client-side data fetching)
 *  - Sonner toast notifications
 *  - Font configuration (Inter via next/font)
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/providers";
import { Toaster } from "sonner";
import { NavigationProgress } from "@/components/shared/NavigationProgress";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "EduShare — Collaborative Learning Platform",
    template: "%s | EduShare",
  },
  description:
    "EduShare, the collaborative learning portal for Polytechnic College of La Union students and faculty.",
  keywords: ["education", "learning", "resources", "collaboration", "polytechnic"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <NavigationProgress />
        {/* TanStack Query + other client-side providers */}
        <Providers>
          {children}
          {/* Global toast notification renderer */}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
