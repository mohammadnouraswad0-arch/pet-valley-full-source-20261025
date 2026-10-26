import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { CartProvider } from "@/components/cart";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "عيادة سامايا طيبة البيطرية | Samaya Taiba Vet Clinic", template: "%s | سامايا طيبة البيطرية" },
  description: "عيادة سامايا طيبة البيطرية: رعاية بيطرية، حجز مواعيد إلكتروني، ومتجر لمستلزمات الحيوانات الأليفة.",
  openGraph: { type: "website", locale: "ar_SA", siteName: "Samaya Taiba Vet Clinic" },
};

export const viewport: Viewport = { themeColor: "#FFF9F0" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://images.pexels.com" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Nunito+Sans:wght@400;700&display=swap"
        />
      </head>
      <body className="antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
