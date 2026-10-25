import { asc } from "drizzle-orm";
import { db } from "@/db";
import { branches, branchHours, hourExceptions } from "@/db/schema";
import { WEEKDAYS, formatDateAr, hhmm, minToTime } from "@/lib/format";
import { addBranch, addException, deleteException, saveBranch } from "../../actions";
import { ActionForm, Submit } from "../../form";

export default async function AdminHours() {
  const list = await db.select().from(branches).orderBy(asc(branches.id));
  const hours = await db.select().from(branchHours);
  const exc = await db.select().from(hourExceptions).orderBy(asc(hourExceptions.date));
  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">الفروع وساعات العمل</h1>
        <form action={addBranch}><Submit label="+ فرع جديد" className="btn btn-outline btn-sm" /></form>
      </div>
      <p className="mt-2 text-pv-muted">هذه البيانات تُستخدم في جدول الدوام بالموقع وفي حساب الأوقات المتاحة للحجز. اترك الفترة الثانية فارغة إن لم يكن هناك دوام مسائي.</p>
      {list.map((b) => {
        const h = hours.filter((x) => x.branchId === b.id);
        return (
          <section key={b.id} className="card mt-8 p-6">
            <ActionForm action={saveBranch} className="space-y-5" submit="حفظ الفرع والساعات">
              <input type="hidden" name="branchId" value={b.id} />
              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-1"><span className="label">اسم الفرع</span><input name="name" defaultValue={b.name} className="input" /></label>
                <label className="grid gap-1"><span className="label">المدينة</span><input name="city" defaultValue={b.city} className="input" /></label>
                <label className="grid gap-1"><span className="label">المنطقة الزمنية</span><input name="timezone" defaultValue={b.timezone} dir="ltr" className="input" /></label>
                <label className="grid gap-1 md:col-span-3"><span className="label">العنوان</span><input name="address" defaultValue={b.address} className="input" /></label>
                <label className="grid gap-1"><span className="label">الهاتف</span><input name="phone" defaultValue={b.phone} dir="ltr" className="input" /></label>
                <label className="grid gap-1"><span className="label">واتساب</span><input name="whatsapp" defaultValue={b.whatsapp} dir="ltr" className="input" /></label>
                <label className="grid gap-1"><span className="label">رابط الخريطة</span><input name="mapUrl" defaultValue={b.mapUrl} dir="ltr" className="input" /></label>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-right text-sm">
                  <thead className="text-pv-muted"><tr><th className="p-2">اليوم</th><th className="p-2">مغلق</th><th className="p-2">الفترة الأولى</th><th className="p-2">الفترة الثانية</th></tr></thead>
                  <tbody>
                    {WEEKDAYS.map((day, d) => {
                      const rows = h.filter((x) => x.weekday === d).sort((x, y) => x.openMin - y.openMin);
                      return (
                        <tr key={d} className="border-t border-pv-border">
                          <th className="p-2 text-right">{day}</th>
                          <td className="p-2"><input type="checkbox" name={`closed_${d}`} defaultChecked={rows.length === 0} className="h-5 w-5 accent-pv-green" aria-label={`${day} مغلق`} /></td>
                          {[1, 2].map((p) => (
                            <td key={p} className="p-2">
                              <div className="flex items-center gap-1">
                                <input type="time" name={`open_${d}_${p}`} defaultValue={rows[p - 1] ? hhmm(rows[p - 1].openMin) : ""} className="input min-h-10! py-1!" aria-label={`${day} بداية الفترة ${p}`} />
                                <span>–</span>
                                <input type="time" name={`close_${d}_${p}`} defaultValue={rows[p - 1] ? hhmm(rows[p - 1].closeMin) : ""} className="input min-h-10! py-1!" aria-label={`${day} نهاية الفترة ${p}`} />
                              </div>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="hoursVerified" defaultChecked={b.hoursVerified} className="h-5 w-5 accent-pv-green" /> الساعات معتمدة رسميًا (يخفي تنبيه «تجريبية»)</label>
                <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="infoVerified" defaultChecked={b.infoVerified} className="h-5 w-5 accent-pv-green" /> بيانات الفرع معتمدة</label>
              </div>
            </ActionForm>

            <div className="mt-8 border-t border-pv-border pt-6">
              <h3 className="text-lg">الاستثناءات والإجازات والساعات الخاصة</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {exc.filter((e) => e.branchId === b.id).map((e) => (
                  <li key={e.id} className="flex items-center justify-between rounded-xl bg-pv-cream p-3">
                    <span>{formatDateAr(e.date)} — {e.closed ? "مغلق" : `${minToTime(e.openMin!)} – ${minToTime(e.closeMin!)}`} {e.note && `(${e.note})`}</span>
                    <form action={deleteException}><input type="hidden" name="id" value={e.id} /><button className="text-red-700 hover:underline">حذف</button></form>
                  </li>
                ))}
              </ul>
              <form action={addException} className="mt-4 grid items-end gap-2 md:grid-cols-6">
                <input type="hidden" name="branchId" value={b.id} />
                <input type="date" name="date" required className="input" aria-label="التاريخ" />
                <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="closed" defaultChecked className="h-5 w-5 accent-pv-green" /> مغلق</label>
                <input type="time" name="open" className="input" aria-label="من" />
                <input type="time" name="close" className="input" aria-label="إلى" />
                <input name="note" placeholder="ملاحظة (مثال: عطلة رسمية)" className="input" />
                <Submit label="إضافة" className="btn btn-secondary" />
              </form>
            </div>
          </section>
        );
      })}
      {list.length === 0 && <p className="card mt-6 p-6">لا توجد فروع.</p>}
      <p className="mt-6 text-xs text-pv-muted">ملاحظة: الفرع المضاف حديثًا يظهر للزوار فور إضافته؛ عدّل بياناته مباشرة.</p>
    </div>
  );
}
