import type { Metadata } from "next";
import { getBranches, getDoctors, getServices } from "@/lib/data";
import { PageHeader, Notice } from "@/components/ui";
import { BookingWizard } from "@/components/booking-wizard";

export const metadata: Metadata = { title: "احجز موعدًا", description: "احجز موعدك في عيادة سامايا طيبة البيطرية إلكترونيًا واختر الوقت المتاح.", alternates: { canonical: "/booking" } };

export default async function BookingPage({ searchParams }: { searchParams: Promise<{ service?: string; doctor?: string }> }) {
  const sp = await searchParams;
  const [services, doctors, branches] = await Promise.all([getServices(), getDoctors(), getBranches()]);
  const bookable = services.filter((s) => s.isBookable);
  return (
    <>
      <PageHeader title="احجز موعدًا" subtitle="خطوات قصيرة لاختيار الخدمة والوقت المتاح فعليًا." crumbs={[{ label: "الحجز" }]} />
      <section className="container-pv py-12">
        <div className="mx-auto max-w-4xl">
          {branches.some((b) => !b.hoursVerified) && (
            <div className="mb-6"><Notice tone="warn">نسخة معاينة: الأوقات مبنية على ساعات عمل وجداول تجريبية بانتظار اعتماد العيادة، والطلبات تُراجع يدويًا.</Notice></div>
          )}
          {bookable.length === 0 || branches.length === 0 ? (
            <Notice tone="err">الحجز الإلكتروني غير متاح حاليًا. يرجى التواصل مع العيادة.</Notice>
          ) : (
            <BookingWizard
              services={bookable.map(({ id, slug, name, short, durationMin, visitTypes, imageUrl }) => ({ id, slug, name, short, durationMin, visitTypes, imageUrl }))}
              doctors={doctors.map(({ id, slug, name, title, branchId, isSample, services }) => ({ id, slug, name, title, branchId, isSample, services: services.map((s) => s.slug) }))}
              branches={branches.map(({ id, name, timezone, address }) => ({ id, name, timezone, address }))}
              initService={sp.service}
              initDoctor={sp.doctor}
            />
          )}
        </div>
      </section>
    </>
  );
}
