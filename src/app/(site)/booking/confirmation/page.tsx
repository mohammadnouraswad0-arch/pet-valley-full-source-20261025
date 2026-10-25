import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, branches, doctors, services } from "@/db/schema";
import { PageHeader } from "@/components/ui";
import { BOOKING_STATUS, formatDateAr, minToTime } from "@/lib/format";
import { IconCheck } from "@/components/icons";

export const metadata: Metadata = { title: "حالة الحجز", robots: { index: false } };

export default async function BookingConfirmation({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const [b] = ref
    ? await db
        .select({ ref: bookings.ref, status: bookings.status, date: bookings.date, startMin: bookings.startMin, petName: bookings.petName, service: services.name, doctor: doctors.name, branch: branches.name })
        .from(bookings)
        .innerJoin(services, eq(services.id, bookings.serviceId))
        .innerJoin(branches, eq(branches.id, bookings.branchId))
        .leftJoin(doctors, eq(doctors.id, bookings.doctorId))
        .where(eq(bookings.ref, ref.slice(0, 20)))
    : [];
  if (!b)
    return (
      <>
        <PageHeader title="لم يتم العثور على الحجز" subtitle="تحقق من الرقم المرجعي أو ابحث عنه من صفحة المتابعة." />
        <section className="container-pv py-12 text-center"><Link href="/account" className="btn btn-outline">متابعة حجز</Link></section>
      </>
    );
  const st = BOOKING_STATUS[b.status];
  const msg =
    b.status === "pending"
      ? "تم استلام طلب الحجز بنجاح، وسيتم التواصل معك لتأكيد الموعد."
      : b.status === "confirmed"
        ? "تم تأكيد موعدك. نتطلع لرؤيتكم!"
        : b.status === "rejected"
          ? "نعتذر، تعذر اعتماد هذا الموعد. يمكنك اختيار موعد آخر."
          : b.status === "cancelled"
            ? "تم إلغاء هذا الحجز."
            : "تمت الزيارة. شكرًا لثقتكم.";
  return (
    <>
      <PageHeader title={b.status === "pending" ? "تم استلام طلب الحجز" : "حالة الحجز"} subtitle={msg} crumbs={[{ href: "/booking", label: "الحجز" }, { label: "حالة الحجز" }]} />
      <section className="container-pv py-12">
        <div className="card mx-auto max-w-2xl p-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-pv-green text-white"><IconCheck size={28} /></span>
            <div>
              <p className="text-sm text-pv-muted">الرقم المرجعي</p>
              <p className="ltr text-2xl font-extrabold text-pv-deep">{b.ref}</p>
            </div>
            <span className={`mr-auto rounded-full px-3 py-1 text-sm font-bold ${st.cls}`}>{st.label}</span>
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {[["الخدمة", b.service], ["الحيوان", b.petName], ["التاريخ", formatDateAr(b.date)], ["الوقت المطلوب", minToTime(b.startMin)], ["الفرع", b.branch], ["الطبيب", b.doctor ?? "فريق العيادة"]].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-pv-cream p-4"><dt className="text-sm text-pv-muted">{k}</dt><dd className="font-bold text-pv-deep">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-pv-muted">احتفظ بالرقم المرجعي لمتابعة حالة طلبك من صفحة <Link href="/account" className="link-pv">المتابعة</Link>.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="btn btn-secondary">العودة للرئيسية</Link>
            <Link href="/shop" className="btn btn-shop">تسوق من المتجر</Link>
          </div>
        </div>
      </section>
    </>
  );
}
