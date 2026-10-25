import Link from "next/link";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { bookings, branches, doctors, orders, services } from "@/db/schema";
import { BOOKING_STATUS, PET_TYPES, formatDateAr, minToTime } from "@/lib/format";
import { setBookingStatus } from "../actions";

type SP = Promise<Record<string, string | undefined>>;

export default async function AdminBookings({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const conds: SQL[] = [];
  if (sp.status) conds.push(eq(bookings.status, sp.status));
  if (sp.date) conds.push(eq(bookings.date, sp.date));
  if (sp.doctor) conds.push(eq(bookings.doctorId, Number(sp.doctor)));
  if (sp.service) conds.push(eq(bookings.serviceId, Number(sp.service)));
  if (sp.branch) conds.push(eq(bookings.branchId, Number(sp.branch)));
  if (sp.q) {
    const l = `%${sp.q.replace(/[%_]/g, "")}%`;
    conds.push(or(ilike(bookings.ownerName, l), ilike(bookings.phone, l), ilike(bookings.petName, l), ilike(bookings.ref, l))!);
  }
  const [rows, docs, svcs, brs, stats, orderStats] = await Promise.all([
    db
      .select({ b: bookings, service: services.name, doctor: doctors.name, branch: branches.name })
      .from(bookings)
      .innerJoin(services, eq(services.id, bookings.serviceId))
      .innerJoin(branches, eq(branches.id, bookings.branchId))
      .leftJoin(doctors, eq(doctors.id, bookings.doctorId))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(bookings.date), desc(bookings.startMin))
      .limit(200),
    db.select({ id: doctors.id, name: doctors.name }).from(doctors),
    db.select({ id: services.id, name: services.name }).from(services),
    db.select({ id: branches.id, name: branches.name }).from(branches),
    db.select({ status: bookings.status, c: sql<number>`count(*)::int` }).from(bookings).groupBy(bookings.status),
    db.select({ c: sql<number>`count(*)::int` }).from(orders).where(eq(orders.status, "pending")),
  ]);
  const count = (st: string) => stats.find((x) => x.status === st)?.c ?? 0;

  return (
    <div>
      <h1 className="text-3xl">الحجوزات</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[["pending", "قيد المراجعة"], ["confirmed", "مؤكدة"], ["completed", "مكتملة"], ["cancelled", "ملغاة"]].map(([k, l]) => (
          <Link key={k} href={`/admin?status=${k}`} className="card p-4 hover:ring-2 hover:ring-pv-yellow">
            <p className="text-sm text-pv-muted">{l}</p>
            <p className="text-3xl font-extrabold text-pv-deep">{count(k)}</p>
          </Link>
        ))}
        <Link href="/admin/orders?status=pending" className="card bg-pv-pale/50 p-4">
          <p className="text-sm text-pv-muted">طلبات متجر جديدة</p>
          <p className="text-3xl font-extrabold text-pv-deep">{orderStats[0]?.c ?? 0}</p>
        </Link>
      </div>

      <form className="card mt-6 grid gap-3 p-4 md:grid-cols-7" method="get">
        <input name="q" defaultValue={sp.q} placeholder="بحث: الاسم، الهاتف، المرجع" className="input md:col-span-2" />
        <select name="status" defaultValue={sp.status ?? ""} className="input"><option value="">كل الحالات</option>{Object.entries(BOOKING_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        <input name="date" type="date" defaultValue={sp.date} className="input" />
        <select name="doctor" defaultValue={sp.doctor ?? ""} className="input"><option value="">كل الأطباء</option>{docs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <select name="service" defaultValue={sp.service ?? ""} className="input"><option value="">كل الخدمات</option>{svcs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <div className="flex gap-2">
          {brs.length > 1 && <select name="branch" defaultValue={sp.branch ?? ""} className="input"><option value="">كل الفروع</option>{brs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>}
          <button className="btn btn-secondary">تصفية</button>
        </div>
      </form>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[900px] text-right text-sm">
          <thead className="bg-pv-cream text-pv-muted">
            <tr>{["المرجع", "الموعد", "الخدمة / الطبيب", "الحيوان", "صاحب الحيوان", "الحالة", "إجراءات"].map((h) => <th key={h} className="p-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-pv-muted">لا توجد حجوزات مطابقة</td></tr>}
            {rows.map(({ b, service, doctor, branch }) => {
              const st = BOOKING_STATUS[b.status];
              return (
                <tr key={b.id} className="border-t border-pv-border align-top">
                  <td className="p-3"><Link href={`/admin/bookings/${b.id}`} className="ltr font-bold text-pv-green hover:underline">{b.ref}</Link></td>
                  <td className="p-3">{formatDateAr(b.date)}<br /><span className="text-pv-muted">{minToTime(b.startMin)} – {minToTime(b.endMin)}</span></td>
                  <td className="p-3">{service}<br /><span className="text-pv-muted">{doctor ?? "بدون طبيب محدد"} · {branch}</span></td>
                  <td className="p-3">{b.petName}<br /><span className="text-pv-muted">{PET_TYPES[b.petType]}</span></td>
                  <td className="p-3">{b.ownerName}<br /><a href={`tel:${b.phone}`} className="ltr text-pv-muted">{b.phone}</a></td>
                  <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${st.cls}`}>{st.label}</span></td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {b.status === "pending" && (
                        <>
                          <form action={setBookingStatus}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="confirmed" /><button className="btn btn-secondary btn-sm min-h-8! px-2.5!">تأكيد</button></form>
                          <form action={setBookingStatus}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="rejected" /><button className="btn btn-outline btn-sm min-h-8! px-2.5!">رفض</button></form>
                        </>
                      )}
                      {b.status === "confirmed" && (
                        <form action={setBookingStatus}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="completed" /><button className="btn btn-secondary btn-sm min-h-8! px-2.5!">مكتمل</button></form>
                      )}
                      <Link href={`/admin/bookings/${b.id}`} className="btn btn-ghost btn-sm min-h-8! px-2.5!">تفاصيل</Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
