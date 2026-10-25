import { getSettings } from "@/lib/settings";
import { saveSettings } from "../../actions";
import { ActionForm } from "../../form";

export default async function AdminSettings() {
  const s = await getSettings();
  const T = ({ k, label, area = false, ltr = false }: { k: keyof typeof s; label: string; area?: boolean; ltr?: boolean }) => (
    <label className={`grid gap-1 ${area ? "md:col-span-2" : ""}`}>
      <span className="label">{label}</span>
      {area ? <textarea name={k} defaultValue={String(s[k] ?? "")} rows={2} className="input" /> : <input name={k} defaultValue={String(s[k] ?? "")} dir={ltr ? "ltr" : undefined} className="input" />}
    </label>
  );
  const C = ({ k, label }: { k: keyof typeof s; label: string }) => (
    <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name={k} defaultChecked={Boolean(s[k])} className="h-5 w-5 accent-pv-green" /> {label}</label>
  );
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl">المحتوى والإعدادات</h1>
      <ActionForm action={saveSettings} className="mt-6 space-y-6" submit="حفظ الإعدادات">
        <section className="card grid gap-4 p-6 md:grid-cols-2">
          <h2 className="text-xl md:col-span-2">الصفحة الرئيسية</h2>
          <T k="heroEyebrow" label="العنوان التمهيدي" />
          <T k="heroTitle" label="العنوان الرئيسي" />
          <T k="heroSubtitle" label="الوصف" area />
          <T k="heroImage" label="رابط صورة Hero" ltr />
          <T k="heroImageAlt" label="النص البديل لصورة Hero" />
          <T k="topbarMessage" label="رسالة الشريط العلوي" area />
          <T k="previewNotice" label="تنبيه نسخة المعاينة (اتركه فارغًا لإخفائه بعد اعتماد البيانات)" area />
        </section>
        <section className="card grid gap-4 p-6 md:grid-cols-2">
          <h2 className="text-xl md:col-span-2">المتجر</h2>
          <T k="shopBarMessage" label="رسالة شريط المتجر" />
          <T k="currency" label="رمز العملة" />
          <T k="shopHeroTitle" label="عنوان بانر المتجر" />
          <T k="shopHeroImage" label="صورة بانر المتجر" ltr />
          <T k="shopHeroSubtitle" label="وصف بانر المتجر" area />
          <label className="grid gap-1"><span className="label">رسوم التوصيل</span><input name="deliveryFee" type="number" step="0.01" min="0" defaultValue={s.deliveryFee / 100} className="input" /></label>
          <label className="grid gap-1"><span className="label">حد الشحن المجاني (فارغ = لا يوجد عرض)</span><input name="freeShippingThreshold" type="number" step="0.01" min="0" defaultValue={s.freeShippingThreshold == null ? "" : s.freeShippingThreshold / 100} className="input" /></label>
          <div className="flex flex-wrap gap-5 md:col-span-2">
            <C k="pickupEnabled" label="الاستلام من العيادة" />
            <C k="deliveryEnabled" label="التوصيل" />
            <C k="codEnabled" label="الدفع عند الاستلام" />
          </div>
        </section>
        <section className="card grid gap-4 p-6 md:grid-cols-2">
          <h2 className="text-xl md:col-span-2">بيانات التواصل</h2>
          <T k="phone" label="الهاتف" ltr />
          <T k="whatsapp" label="واتساب (بالصيغة الدولية)" ltr />
          <T k="email" label="البريد الإلكتروني" ltr />
          <T k="instagram" label="إنستغرام" ltr />
        </section>
      </ActionForm>
    </div>
  );
}
