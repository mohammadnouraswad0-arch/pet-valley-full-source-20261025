import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getBranches } from "@/lib/data";
import { HoursTable, Notice, PageHeader } from "@/components/ui";
import { IconInstagram, IconPhone, IconPin } from "@/components/icons";

export const metadata: Metadata = { title: "تواصل معنا", alternates: { canonical: "/contact" } };

export default async function ContactPage() {
  const [s, branches] = await Promise.all([getSettings(), getBranches()]);
  const b = branches[0];
  const channels = [
    s.phone && { icon: IconPhone, label: "الهاتف", value: s.phone, href: `tel:${s.phone}`, ltr: true },
    s.whatsapp && { icon: IconPhone, label: "واتساب", value: s.whatsapp, href: `https://wa.me/${s.whatsapp.replace(/\D/g, "")}`, ltr: true },
    s.email && { icon: IconPhone, label: "البريد الإلكتروني", value: s.email, href: `mailto:${s.email}`, ltr: true },
    s.instagram && { icon: IconInstagram, label: "إنستغرام", value: "@samayataiba", href: s.instagram, ltr: true },
    s.snapchat && { icon: IconInstagram, label: "سناب شات", value: "@samayataiba", href: s.snapchat, ltr: true },
    s.tiktok && { icon: IconInstagram, label: "تيك توك", value: "@samayataiba", href: s.tiktok, ltr: true },
  ].filter(Boolean) as { icon: typeof IconPhone; label: string; value: string; href: string; ltr: boolean }[];
  return (
    <>
      <PageHeader title="تواصل معنا" subtitle="يسعدنا الإجابة عن استفساراتك. للحجز، استخدم نظام الحجز الإلكتروني." crumbs={[{ label: "تواصل معنا" }]} />
      <section className="container-pv grid gap-8 py-16 lg:grid-cols-2">
        <div className="space-y-4">
          {channels.map((c) => (
            <a key={c.label} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener" className="card lift flex items-center gap-4 p-5">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-pv-yellow text-pv-deep"><c.icon /></span>
              <span><span className="block text-sm text-pv-muted">{c.label}</span><span className={`block font-bold text-pv-deep ${c.ltr ? "ltr" : ""}`}>{c.value}</span></span>
            </a>
          ))}
          {b && (
            <div className="card flex items-start gap-4 p-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-pv-green text-white"><IconPin /></span>
              <span><span className="block text-sm text-pv-muted">العنوان</span><span className="block font-bold text-pv-deep">{b.address}</span></span>
            </div>
          )}
          {s.mapUrl && <a href={s.mapUrl} target="_blank" rel="noopener" className="btn btn-outline w-fit">فتح الموقع على الخريطة</a>}
          {(!s.phone || !s.whatsapp) && <Notice tone="warn">أرقام الهاتف وواتساب والبريد تُضاف من لوحة الإدارة بعد تأكيدها من العيادة.</Notice>}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/booking" className="btn btn-book">احجز موعدًا</Link>
            <Link href="/faq" className="btn btn-outline">الأسئلة الشائعة</Link>
          </div>
        </div>
        {b && (
          <div className="card p-6 md:p-8">
            <h2 className="mb-4 text-xl">ساعات العمل — {b.name}</h2>
            <HoursTable branch={b} />
          </div>
        )}
      </section>
    </>
  );
}
