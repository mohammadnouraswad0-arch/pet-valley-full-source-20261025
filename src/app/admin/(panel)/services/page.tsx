import { asc } from "drizzle-orm";
import { db } from "@/db";
import { services } from "@/db/schema";
import { VISIT_TYPES } from "@/lib/format";
import { saveService } from "../../actions";
import { ActionForm } from "../../form";

export default async function AdminServices() {
  const list = await db.select().from(services).orderBy(asc(services.sortOrder));
  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl">الخدمات</h1>
      <p className="mt-2 text-pv-muted">فعّل الخدمة فقط بعد التأكد من توفرها. الخدمات غير المفعلة لا تظهر للزوار ولا يمكن حجزها.</p>
      {[...list, null].map((s) => (
        <details key={s?.id ?? "new"} className="card mt-5 p-0">
          <summary className="flex items-center justify-between p-5 font-bold text-pv-deep">
            <span>{s ? s.name : "+ إضافة خدمة"}</span>
            {s && <span className={`rounded-full px-2.5 py-0.5 text-xs ${s.isActive ? "bg-pv-green/15 text-pv-green" : "bg-stone-100 text-stone-600"}`}>{s.isActive ? (s.isBookable ? "مفعلة · قابلة للحجز" : "مفعلة") : "غير مفعلة"}</span>}
          </summary>
          <div className="border-t border-pv-border p-5">
            <ActionForm action={saveService} className="grid gap-3 md:grid-cols-2" submit="حفظ الخدمة">
              <input type="hidden" name="id" value={s?.id ?? ""} />
              <label className="grid gap-1"><span className="label">الاسم *</span><input name="name" defaultValue={s?.name} required className="input" /></label>
              <label className="grid gap-1"><span className="label">slug</span><input name="slug" defaultValue={s?.slug} dir="ltr" className="input" /></label>
              <label className="grid gap-1 md:col-span-2"><span className="label">وصف مختصر</span><input name="short" defaultValue={s?.short} className="input" /></label>
              <label className="grid gap-1 md:col-span-2"><span className="label">الوصف الكامل</span><textarea name="description" defaultValue={s?.description} rows={3} className="input" /></label>
              <label className="grid gap-1 md:col-span-2"><span className="label">النقاط الرئيسية (سطر لكل نقطة)</span><textarea name="highlights" defaultValue={s?.highlights.join("\n")} rows={3} className="input" /></label>
              <label className="grid gap-1"><span className="label">رابط الصورة</span><input name="imageUrl" defaultValue={s?.imageUrl} dir="ltr" className="input" /></label>
              <label className="grid gap-1"><span className="label">النص البديل</span><input name="imageAlt" defaultValue={s?.imageAlt} className="input" /></label>
              <label className="grid gap-1"><span className="label">مدة الموعد (دقيقة)</span><input name="durationMin" type="number" min={5} max={600} defaultValue={s?.durationMin ?? 30} className="input" /></label>
              <label className="grid gap-1"><span className="label">الترتيب</span><input name="sortOrder" type="number" defaultValue={s?.sortOrder ?? 0} className="input" /></label>
              <label className="grid gap-1 md:col-span-2"><span className="label">ملاحظة السعر</span><input name="priceNote" defaultValue={s?.priceNote} className="input" placeholder="مثال: تبدأ من … (بعد اعتماد الأسعار)" /></label>
              <fieldset className="md:col-span-2">
                <legend className="label">طرق الزيارة المتاحة</legend>
                <div className="flex gap-4">
                  {Object.entries(VISIT_TYPES).map(([k, v]) => (
                    <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" name="visitTypes" value={k} defaultChecked={s ? s.visitTypes.includes(k) : k === "clinic"} className="h-4 w-4 accent-pv-green" /> {v}</label>
                  ))}
                </div>
              </fieldset>
              <div className="flex gap-5 md:col-span-2">
                <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="isActive" defaultChecked={s?.isActive ?? false} className="h-5 w-5 accent-pv-green" /> مفعلة وظاهرة</label>
                <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="isBookable" defaultChecked={s?.isBookable ?? true} className="h-5 w-5 accent-pv-green" /> قابلة للحجز الإلكتروني</label>
              </div>
            </ActionForm>
          </div>
        </details>
      ))}
    </div>
  );
}
