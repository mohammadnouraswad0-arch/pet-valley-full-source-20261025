import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, orders, services } from "@/db/schema";
import { Notice, PageHeader } from "@/components/ui";
import { BOOKING_STATUS, ORDER_STATUS, formatDateAr, formatPrice, minToTime } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { audit } from "@/lib/auth";

export const metadata: Metadata = { title: "تتبع الطلب أو الحجز", robots: { index: false } };

const norm = (p: string) => p.replace(/\D/g, "");

async function cancelBooking(fd: FormData) {
  "use server";
  const ref = String(fd.get("ref") ?? "").trim().toUpperCase().slice(0, 20);
  const phone = String(fd.get("phone") ?? "");
  const [b] = await db.select().from(bookings).where(eq(bookings.ref, ref));
  if (b && norm(b.phone) === norm(phone) && b.status === "pending") {
    await db.update(bookings).set({ status: "cancelled", updatedAt: new Date() }).where(and(eq(bookings.id, b.id), eq(bookings.status, "pending")));
    await audit("cancel_by_customer", "booking", b.ref);
  }
  redirect(`/account?ref=${encodeURIComponent(ref)}&phone=${encodeURIComponent(phone)}`);
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ ref?: string; phone?: string }> }) {
  const sp = await searchParams;
  const ref = (sp.ref ?? "").trim().toUpperCase().slice(0, 20);
  const phone = (sp.phone ?? "").slice(0, 30);
  const s = await getSettings();
  let result: React.ReactNode = null;

  if (ref && phone) {
    if (ref.startsWith("PV-")) {
      const [b] = await db
        .select({ b: bookings, service: services.name })
        .from(bookings)
        .innerJoin(services, eq(services.id, bookings.serviceId))
        .where(eq(bookings.ref, ref));
      if (b && norm(b.b.phone) === norm(phone)) {
        const st = BOOKING_STATUS[b.b.status];
        result = (
          <div className="card p-6">
            <div className="flex items-center justify-between"><p className="ltr text-xl font-extrabold">{b.b.ref}</p><span className={`rounded-full px-3 py-1 text-sm font-bold ${st.cls}`}>{st.label}</span></div>
            <p className="mt-3">{b.service} — {b.b.petName}</p>
            <p className="text-pv-muted">{formatDateAr(b.b.date)} — {minToTime(b.b.startMin)}</p>
            {b.b.status === "pending" && (
              <form action={cancelBooking} className="mt-5">
                <input type="hidden" name="ref" value={ref} />
                <input type="hidden" name="phone" value={phone} />
                <button className="btn btn-outline btn-sm">إلغاء طلب الحجز</button>
              </form>
            )}
          </div>
        );
      }
    } else {
      const [o] = await db.select().from(orders).where(eq(orders.ref, ref));
      if (o && norm(o.phone) === norm(phone)) {
        result = (
          <div className="card p-6">
            <div className="flex items-center justify-between"><p className="ltr text-xl font-extrabold">{o.ref}</p><span className="rounded-full bg-pv-pale px-3 py-1 text-sm font-bold text-pv-deep">{ORDER_STATUS[o.status]}</span></div>
            <p className="mt-3">الإجمالي: {formatPrice(o.total, s.currency)}</p>
            <p className="text-pv-muted">{o.shippingMethod === "pickup" ? "استلام من العيادة" : "توصيل"} — الدفع عند الاستلام</p>
          </div>
        );
      }
    }
    if (!result) result = <Notice tone="err">لم نعثر على طلب مطابق. تحقق من الرقم المرجعي ورقم الجوال.</Notice>;
  }

  return (
    <>
      <PageHeader title="تتبع الطلب أو الحجز" subtitle="أدخل الرقم المرجعي ورقم الجوال المستخدم عند الطلب." crumbs={[{ label: "المتابعة" }]} />
      <section className="container-pv grid max-w-4xl gap-8 py-12 md:grid-cols-2">
        <form method="get" className="card h-fit space-y-4 p-6">
          <div>
            <label htmlFor="ref" className="label">الرقم المرجعي</label>
            <input id="ref" name="ref" defaultValue={ref} required placeholder="PV-XXXX أو ORD-XXXX" dir="ltr" className="input text-right" />
          </div>
          <div>
            <label htmlFor="phone" className="label">رقم الجوال</label>
            <input id="phone" name="phone" defaultValue={phone} required type="tel" dir="ltr" className="input text-right" />
          </div>
          <button className="btn btn-secondary w-full">بحث</button>
          <p className="text-xs text-pv-muted">حسابات العملاء الكاملة (تسجيل الدخول وسجل الطلبات) ستُفعّل لاحقًا.</p>
        </form>
        <div>{result ?? <p className="text-pv-muted">ستظهر حالة طلبك هنا. <Link href="/booking" className="link-pv">احجز موعدًا جديدًا</Link></p>}</div>
      </section>
    </>
  );
}
