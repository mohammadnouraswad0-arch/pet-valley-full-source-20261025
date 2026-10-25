import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";
import { ensureSeed } from "@/db/seed";
import { logout } from "../actions";
import { Logo } from "@/components/icons";

export const metadata: Metadata = { title: "لوحة الإدارة", robots: { index: false } };

const NAV = [
  ["/admin", "الحجوزات"],
  ["/admin/orders", "الطلبات"],
  ["/admin/products", "المنتجات والمخزون"],
  ["/admin/services", "الخدمات"],
  ["/admin/doctors", "الأطباء"],
  ["/admin/hours", "الفروع وساعات العمل"],
  ["/admin/settings", "المحتوى والإعدادات"],
  ["/admin/testimonials", "آراء العملاء"],
  ["/admin/newsletter", "النشرة البريدية"],
  ["/admin/audit", "سجل التعديلات"],
];

export default async function PanelLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  await ensureSeed();
  return (
    <div className="min-h-screen bg-pv-cream lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b border-pv-border bg-white p-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-l">
        <Link href="/admin"><Logo /></Link>
        <nav className="no-scrollbar mt-6 flex gap-1 overflow-x-auto lg:flex-col" aria-label="قائمة الإدارة">
          {NAV.map(([h, l]) => (
            <Link key={h} href={h} className="shrink-0 rounded-xl px-3 py-2.5 font-semibold text-pv-deep hover:bg-pv-cream">{l}</Link>
          ))}
        </nav>
        <div className="mt-6 flex gap-2 lg:flex-col">
          <Link href="/" target="_blank" className="btn btn-outline btn-sm">عرض الموقع</Link>
          <form action={logout}><button className="btn btn-ghost btn-sm w-full">تسجيل الخروج</button></form>
        </div>
      </aside>
      <main className="min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
