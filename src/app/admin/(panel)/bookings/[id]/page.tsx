import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, bookings, branches, doctors, services } from "@/db/schema";
import { BOOKING_STATUS, PET_TYPES, VISIT_TYPES, formatDateAr, hhmm, minToTime } from "@/lib/format";
import { rescheduleBooking, saveBookingNotes, setBookingStatus } from "../../../actions";
import { ActionForm, Submit } from "../../../form";

export default async function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [row] = await db
    .select({ b: bookings, service: services.name, doctor: doctors.name, branch: branches.name })
    .from(bookings)
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(branches, eq(branches.id, bookings.branchId))
    .leftJoin(doctors, eq(doctors.id, bookings.doctorId))
    .where(eq(bookings.id, id || 0));
  if (!row) notFound();
  const { b } = row;
  const docs = await db.select({ id: doctors.id, name: doctors.name }).from(doctors);
  const log = await db.select().from(auditLogs).where(and(eq(auditLogs.entity, "booking"), eq(auditLogs.entityId, String(b.id)))).orderBy(desc(auditLogs.createdAt)).limit(20);
  const st = BOOKING_STATUS[b.status];

  return (
    <div className="max-w-5xl">
      <Link href="/admin" className="text-sm font-semibold text-pv-green">← الحجوزات</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="ltr text-3xl">{b.ref}</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${st.cls}`}>{st.label}</span>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-lg">التفاصيل</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {[
              ["الخدمة", row.service], ["الطبيب", row.doctor ?? "—"], ["الفرع", row.branch], ["طريقة الزيارة", VISIT_TYPES[b.visitType]],
              ["التاريخ", formatDateAr(b.date)], ["الوقت", `${minToTime(b.startMin)} – ${minToTime(b.endMin)}`],
              ["الحيوان", `${b.petName} (${PET_TYPES[b.petType]})`], ["صاحب الحيوان", b.ownerName], ["الهاتف", b.phone], ["البريد", b.email || "—"],
            ].map(([k, v]) => <div key={k}><dt className="text-pv-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
          </dl>
          {b.address && <p className="mt-3 text-sm"><span className="text-pv-muted">العنوان: </span>{b.address}</p>}
          {b.notes && <p className="mt-3 rounded-xl bg-pv-cream p-3 text-sm"><span className="text-pv-muted">ملاحظات العميل: </span>{b.notes}</p>}
          <div className="mt-6 flex flex-wrap gap-2">
            {Object.entries(BOOKING_STATUS).filter(([k]) => k !== b.status).map(([k, v]) => (
              <form key={k} action={setBookingStatus}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value={k} /><button className="btn btn-outline btn-sm">{v.label}</button></form>
            ))}
          </div>
        </section>
        <section className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg">تعديل الموعد</h2>
            <ActionForm action={rescheduleBooking} className="mt-4 space-y-3" submit="حفظ الموعد الجديد">
              <input type="hidden" name="id" value={b.id} />
              <div className="grid grid-cols-2 gap-3">
                <input name="date" type="date" defaultValue={b.date} className="input" required />
                <input name="time" type="time" defaultValue={hhmm(b.startMin)} className="input" required />
              </div>
              <select name="doctorId" defaultValue={b.doctorId ?? ""} className="input">
                <option value="">بدون طبيب محدد</option>
                {docs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <p className="text-xs text-pv-muted">يتم التحقق من عدم التعارض مع الحجوزات الأخرى النشطة.</p>
            </ActionForm>
          </div>
          <form action={saveBookingNotes} className="card space-y-3 p-6">
            <h2 className="text-lg">ملاحظات داخلية</h2>
            <input type="hidden" name="id" value={b.id} />
            <textarea name="internalNotes" defaultValue={b.internalNotes} rows={4} className="input" placeholder="لا تظهر للعميل" />
            <Submit label="حفظ الملاحظات" />
          </form>
        </section>
      </div>
      <section className="card mt-6 p-6">
        <h2 className="text-lg">سجل التغييرات</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {log.length === 0 && <li className="text-pv-muted">لا توجد تغييرات بعد.</li>}
          {log.map((l) => <li key={l.id}><span className="ltr text-pv-muted">{l.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span> — {l.action} {l.details}</li>)}
        </ul>
      </section>
    </div>
  );
}
