import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { formatPrice } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { getPendingReviews } from "@/lib/data";
import { approveReview, deleteReview, quickStock, saveCategory } from "../../actions";
import { Submit } from "../../form";

export default async function AdminProducts() {
  const s = await getSettings();
  const [list, cats, pending] = await Promise.all([
    db.select({ p: products, cat: categories.name }).from(products).leftJoin(categories, eq(categories.id, products.categoryId)).orderBy(asc(products.name)),
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
    getPendingReviews(),
  ]);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">المنتجات والمخزون</h1>
        <Link href="/admin/products/new" className="btn btn-book">+ منتج جديد</Link>
      </div>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[820px] text-right text-sm">
          <thead className="bg-pv-cream text-pv-muted"><tr>{["المنتج", "التصنيف", "السعر", "المخزون", "الحالة", ""].map((h) => <th key={h} className="p-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {list.map(({ p, cat }) => (
              <tr key={p.id} className="border-t border-pv-border">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    <span><span className="font-bold">{p.name}</span>{p.isSample && <span className="mr-2 text-xs text-pv-teal">(تجريبي)</span>}</span>
                  </div>
                </td>
                <td className="p-3">{cat ?? "—"}</td>
                <td className="p-3">{formatPrice(p.price, s.currency)}{p.compareAtPrice && <s className="mr-2 text-pv-muted">{formatPrice(p.compareAtPrice, s.currency)}</s>}</td>
                <td className="p-3">
                  <form action={quickStock} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={p.id} />
                    <input name="stock" type="number" min={0} defaultValue={p.stock} className={`input min-h-9! w-20 py-1! ${p.stock === 0 ? "border-red-300!" : ""}`} aria-label="المخزون" />
                    <Submit label="✓" className="btn btn-ghost btn-sm min-h-9! px-2!" />
                  </form>
                </td>
                <td className="p-3">{p.isActive ? <span className="text-pv-green">ظاهر</span> : <span className="text-pv-muted">مخفي</span>}{p.isFeatured && " · مختار"}</td>
                <td className="p-3"><Link href={`/admin/products/${p.id}`} className="btn btn-outline btn-sm">تعديل</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pending.length > 0 && (
        <>
          <h2 className="mt-12 text-2xl">تقييمات بانتظار المراجعة ({pending.length})</h2>
          <div className="mt-4 space-y-3">
            {pending.map(({ r, product }) => (
              <div key={r.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-bold">{r.name} — {product} <span className="text-pv-yellow">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span></p>
                  {r.comment && <p className="mt-1 text-sm text-pv-muted">{r.comment}</p>}
                </div>
                <div className="flex gap-2">
                  <form action={approveReview}><input type="hidden" name="id" value={r.id} /><button className="btn btn-secondary btn-sm">اعتماد ونشر</button></form>
                  <form action={deleteReview}><input type="hidden" name="id" value={r.id} /><button className="btn btn-ghost btn-sm">حذف</button></form>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-12 text-2xl">التصنيفات</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {[...cats, null].map((c) => (
          <form key={c?.id ?? "new"} action={saveCategory} className="card grid gap-2 p-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={c?.id ?? ""} />
            <input name="name" defaultValue={c?.name} placeholder="اسم التصنيف" className="input" required />
            <input name="slug" defaultValue={c?.slug} placeholder="slug" dir="ltr" className="input" />
            <input name="imageUrl" defaultValue={c?.imageUrl} placeholder="رابط الصورة" dir="ltr" className="input sm:col-span-2" />
            <input name="description" defaultValue={c?.description} placeholder="الوصف" className="input sm:col-span-2" />
            <Submit label={c ? "حفظ" : "+ إضافة تصنيف"} className="btn btn-secondary btn-sm sm:col-span-2" />
          </form>
        ))}
      </div>
    </div>
  );
}
