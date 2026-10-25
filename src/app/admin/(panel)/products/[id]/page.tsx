import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { brands, categories, products } from "@/db/schema";
import { saveProduct } from "../../../actions";
import { ActionForm } from "../../../form";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const [p] = isNew ? [undefined] : await db.select().from(products).where(eq(products.id, Number(id) || 0));
  if (!isNew && !p) notFound();
  const [cats, brs] = await Promise.all([db.select().from(categories).orderBy(asc(categories.sortOrder)), db.select().from(brands)]);
  const money = (v: number | null | undefined) => (v == null ? "" : (v / 100).toString());
  const F = "grid gap-1";
  return (
    <div className="max-w-4xl">
      <Link href="/admin/products" className="text-sm font-semibold text-pv-green">← المنتجات</Link>
      <h1 className="mt-2 text-3xl">{isNew ? "منتج جديد" : `تعديل: ${p!.name}`}</h1>
      <ActionForm action={saveProduct} className="card mt-6 grid gap-4 p-6 md:grid-cols-2" submit="حفظ المنتج">
        <input type="hidden" name="id" value={p?.id ?? ""} />
        <label className={F}><span className="label">اسم المنتج *</span><input name="name" defaultValue={p?.name} required className="input" /></label>
        <label className={F}><span className="label">الرابط المختصر (slug)</span><input name="slug" defaultValue={p?.slug} dir="ltr" className="input" /></label>
        <label className={F}><span className="label">التصنيف</span><select name="categoryId" defaultValue={p?.categoryId ?? ""} className="input"><option value="">—</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className={F}><span className="label">العلامة التجارية</span><select name="brandId" defaultValue={p?.brandId ?? ""} className="input"><option value="">—</option>{brs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className={F}><span className="label">السعر الحالي *</span><input name="price" type="number" step="0.01" min="0" defaultValue={money(p?.price)} required className="input" /></label>
        <label className={F}><span className="label">السعر السابق (للخصم الحقيقي فقط)</span><input name="compareAtPrice" type="number" step="0.01" min="0" defaultValue={money(p?.compareAtPrice)} className="input" /></label>
        <label className={F}><span className="label">انتهاء الخصم</span><input name="saleEndsAt" type="datetime-local" defaultValue={p?.saleEndsAt ? p.saleEndsAt.toISOString().slice(0, 16) : ""} className="input" /></label>
        <label className={F}><span className="label">المخزون *</span><input name="stock" type="number" min="0" step="1" defaultValue={p?.stock ?? 0} required className="input" /></label>
        <label className={F}><span className="label">الوزن / الحجم</span><input name="size" defaultValue={p?.size} className="input" /></label>
        <label className={F}><span className="label">نوع الحيوان</span><select name="petType" defaultValue={p?.petType ?? "all"} className="input"><option value="all">الكل</option><option value="cat">قطط</option><option value="dog">كلاب</option></select></label>
        <label className={`${F} md:col-span-2`}><span className="label">رابط صورة المنتج الأصلية</span><input name="imageUrl" defaultValue={p?.imageUrl} dir="ltr" className="input" placeholder="https://…" /></label>
        <label className={`${F} md:col-span-2`}><span className="label">النص البديل للصورة</span><input name="imageAlt" defaultValue={p?.imageAlt} className="input" /></label>
        <label className={`${F} md:col-span-2`}><span className="label">الوصف</span><textarea name="description" defaultValue={p?.description} rows={4} className="input" /></label>
        <label className={`${F} md:col-span-2`}><span className="label">المواصفات (سطر لكل مواصفة: الاسم: القيمة)</span><textarea name="specs" defaultValue={Object.entries(p?.specs ?? {}).map(([k, v]) => `${k}: ${v}`).join("\n")} rows={3} className="input" /></label>
        <div className="flex flex-wrap gap-5 md:col-span-2">
          <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="isActive" defaultChecked={p?.isActive ?? true} className="h-5 w-5 accent-pv-green" /> ظاهر في المتجر</label>
          <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="isFeatured" defaultChecked={p?.isFeatured} className="h-5 w-5 accent-pv-green" /> منتج مختار</label>
          <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="isSample" defaultChecked={p?.isSample ?? false} className="h-5 w-5 accent-pv-green" /> بيانات تجريبية</label>
        </div>
        <p className="text-xs text-pv-muted md:col-span-2">رفع الملفات المباشر يتطلب ربط خدمة تخزين (مثل S3/R2)؛ حاليًا يُستخدم رابط الصورة.</p>
      </ActionForm>
    </div>
  );
}
