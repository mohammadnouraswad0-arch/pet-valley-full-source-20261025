import { asc } from "drizzle-orm";
import { db } from "@/db";
import { branches, doctorHours, doctors, doctorServices, doctorTimeOff, services } from "@/db/schema";
import { WEEKDAYS, formatDateAr, hhmm } from "@/lib/format";
import { addTimeOff, deleteTimeOff, saveDoctor } from "../../actions";
import { ActionForm, Submit } from "../../form";

export default async function AdminDoctors() {
  const [docs, svcs, brs, links, hrs, off] = await Promise.all([
    db.select().from(doctors).orderBy(asc(doctors.sortOrder)),
    db.select().from(services).orderBy(asc(services.sortOrder)),
    db.select().from(branches),
    db.select().from(doctorServices),
    db.select().from(doctorHours),
    db.select().from(doctorTimeOff).orderBy(asc(doctorTimeOff.date)),
  ]);
  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl">الأطباء</h1>
      <p className="mt-2 text-pv-muted">استبدل الملفات التجريبية بالبيانات الرسمية، وأزل علامة «تجريبي» بعد الاعتماد. أوقات الطبيب تُقاطَع مع ساعات الفرع عند حساب المواعيد.</p>
      {[...docs, null].map((d) => {
        const h = d ? hrs.filter((x) => x.doctorId === d.id) : [];
        return (
          <details key={d?.id ?? "new"} className="card mt-6 p-0" open={!d}>
            <summary className="flex items-center justify-between p-5 text-lg font-bold text-pv-deep">
              {d ? d.name : "+ إضافة طبيب"} {d && !d.isPublished && <span className="text-sm text-pv-muted">(غير منشور)</span>}
            </summary>
            <div className="border-t border-pv-border p-5">
              <ActionForm action={saveDoctor} className="grid gap-3 md:grid-cols-2" submit="حفظ">
                <input type="hidden" name="id" value={d?.id ?? ""} />
                <label className="grid gap-1"><span className="label">الاسم *</span><input name="name" defaultValue={d?.name} required className="input" /></label>
                <label className="grid gap-1"><span className="label">slug</span><input name="slug" defaultValue={d?.slug} dir="ltr" className="input" /></label>
                <label className="grid gap-1"><span className="label">المسمى الوظيفي</span><input name="title" defaultValue={d?.title} className="input" /></label>
                <label className="grid gap-1"><span className="label">التخصصات (مفصولة بفاصلة)</span><input name="specialties" defaultValue={d?.specialties.join("، ")} className="input" /></label>
                <label className="grid gap-1 md:col-span-2"><span className="label">المؤهلات</span><input name="qualifications" defaultValue={d?.qualifications} className="input" /></label>
                <label className="grid gap-1 md:col-span-2"><span className="label">نبذة</span><textarea name="bio" defaultValue={d?.bio} rows={3} className="input" /></label>
                <label className="grid gap-1"><span className="label">رابط الصورة الرسمية</span><input name="imageUrl" defaultValue={d?.imageUrl} dir="ltr" className="input" /></label>
                <label className="grid gap-1"><span className="label">الفرع</span><select name="branchId" defaultValue={d?.branchId ?? brs[0]?.id} className="input">{brs.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
                <fieldset className="md:col-span-2">
                  <legend className="label">الخدمات التي يقدمها</legend>
                  <div className="flex flex-wrap gap-3">
                    {svcs.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="services" value={s.id} defaultChecked={!!d && links.some((l) => l.doctorId === d.id && l.serviceId === s.id)} className="h-4 w-4 accent-pv-green" /> {s.name}</label>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="overflow-x-auto md:col-span-2">
                  <legend className="label">أوقات التواجد الأسبوعية</legend>
                  <table className="w-full min-w-[560px] text-sm">
                    <tbody>
                      {WEEKDAYS.map((day, wd) => {
                        const r = h.filter((x) => x.weekday === wd).sort((a, b) => a.startMin - b.startMin);
                        return (
                          <tr key={wd} className="border-t border-pv-border">
                            <th className="p-1.5 text-right">{day}</th>
                            {[1, 2].map((p) => (
                              <td key={p} className="p-1.5">
                                <div className="flex items-center gap-1">
                                  <input type="time" name={`start_${wd}_${p}`} defaultValue={r[p - 1] ? hhmm(r[p - 1].startMin) : ""} className="input min-h-9! py-1!" aria-label={`${day} من`} />
                                  –
                                  <input type="time" name={`end_${wd}_${p}`} defaultValue={r[p - 1] ? hhmm(r[p - 1].endMin) : ""} className="input min-h-9! py-1!" aria-label={`${day} إلى`} />
                                </div>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </fieldset>
                <div className="flex gap-5 md:col-span-2">
                  <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="isPublished" defaultChecked={d?.isPublished ?? true} className="h-5 w-5 accent-pv-green" /> منشور</label>
                  <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="isSample" defaultChecked={d?.isSample ?? false} className="h-5 w-5 accent-pv-green" /> بيانات تجريبية</label>
                </div>
              </ActionForm>
              {d && (
                <div className="mt-6 border-t border-pv-border pt-4">
                  <h3 className="font-bold">الإجازات</h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    {off.filter((o) => o.doctorId === d.id).map((o) => (
                      <li key={o.id} className="flex items-center gap-3">{formatDateAr(o.date)} {o.note && `— ${o.note}`}
                        <form action={deleteTimeOff}><input type="hidden" name="id" value={o.id} /><button className="text-red-700 hover:underline">حذف</button></form>
                      </li>
                    ))}
                  </ul>
                  <form action={addTimeOff} className="mt-3 flex flex-wrap gap-2">
                    <input type="hidden" name="doctorId" value={d.id} />
                    <input type="date" name="date" required className="input w-auto" aria-label="تاريخ الإجازة" />
                    <input name="note" placeholder="ملاحظة" className="input w-auto" />
                    <Submit label="إضافة إجازة" className="btn btn-outline btn-sm" />
                  </form>
                </div>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}
