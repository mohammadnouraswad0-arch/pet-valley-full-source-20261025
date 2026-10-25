import Link from "next/link";
import { getBrands, getCategories, searchProducts, type ProductQuery } from "@/lib/data";
import { ProductCard } from "./client-ui";
import { IconSearch, IconTruck } from "./icons";

export type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseQuery(sp: SP, fixedCategory?: string): ProductQuery {
  const num = (v: string) => (v === "" ? undefined : Number(v));
  return {
    q: one(sp.q).trim().slice(0, 80) || undefined,
    category: fixedCategory ?? (one(sp.category) || undefined),
    brand: one(sp.brand) || undefined,
    pet: one(sp.pet) || undefined,
    min: num(one(sp.min)),
    max: num(one(sp.max)),
    inStock: one(sp.stock) === "1",
    sort: one(sp.sort) || "new",
    page: Number(one(sp.page)) || 1,
    pageSize: 12,
  };
}

export function hasFilters(q: ProductQuery) {
  return !!(q.q || q.brand || q.pet || q.min != null || q.max != null || q.inStock || (q.sort && q.sort !== "new") || (q.page && q.page > 1));
}

export async function ShopBar({ message }: { message: string }) {
  const cats = await getCategories();
  return (
    <div className="border-b border-pv-border bg-white">
      <div className="bg-pv-pale/70">
        <p className="container-pv flex items-center justify-center gap-2 py-2 text-center text-sm font-semibold text-pv-deep">
          <IconTruck size={17} /> {message}
          <Link href="/account" className="mr-3 underline underline-offset-4 hover:text-pv-green">تتبع طلبك</Link>
        </p>
      </div>
      <nav aria-label="تصنيفات المتجر" className="container-pv no-scrollbar flex gap-1 overflow-x-auto py-2">
        <Link href="/shop" className="shrink-0 rounded-full px-4 py-2 text-sm font-bold text-pv-deep hover:bg-pv-cream">كل المنتجات</Link>
        {cats.map((c) => (
          <Link key={c.id} href={`/shop/category/${c.slug}`} className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-pv-deep hover:bg-pv-cream">{c.name}</Link>
        ))}
      </nav>
    </div>
  );
}

export async function Catalog({ sp, basePath, fixedCategory, currency }: { sp: SP; basePath: string; fixedCategory?: string; currency: string }) {
  const q = parseQuery(sp, fixedCategory);
  const [res, cats, brands] = await Promise.all([searchProducts(q), getCategories(), getBrands()]);
  const params = (over: Record<string, string>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (one(v) && k !== "page") u.set(k, one(v));
    for (const [k, v] of Object.entries(over)) v ? u.set(k, v) : u.delete(k);
    const s = u.toString();
    return `${basePath}${s ? `?${s}` : ""}#catalog`;
  };

  return (
    <section id="catalog" className="container-pv scroll-mt-28 py-14" aria-label="كتالوج المنتجات">
      <div className="grid gap-8 lg:grid-cols-[270px_1fr]">
        <form method="get" action={basePath} className="card h-fit space-y-5 p-5 lg:sticky lg:top-24" aria-label="تصفية المنتجات">
          <div>
            <label htmlFor="q" className="label">بحث</label>
            <div className="relative">
              <input id="q" name="q" defaultValue={q.q} className="input pl-10" placeholder="اسم المنتج أو العلامة" />
              <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-pv-muted" />
            </div>
          </div>
          {!fixedCategory && (
            <div>
              <label htmlFor="category" className="label">التصنيف</label>
              <select id="category" name="category" defaultValue={q.category ?? ""} className="input">
                <option value="">الكل</option>
                {cats.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="pet" className="label">نوع الحيوان</label>
            <select id="pet" name="pet" defaultValue={q.pet ?? ""} className="input">
              <option value="">الكل</option>
              <option value="cat">قطط</option>
              <option value="dog">كلاب</option>
            </select>
          </div>
          <div>
            <label htmlFor="brand" className="label">العلامة التجارية</label>
            <select id="brand" name="brand" defaultValue={q.brand ?? ""} className="input">
              <option value="">الكل</option>
              {brands.map((b) => <option key={b.id} value={b.slug}>{b.name}</option>)}
            </select>
          </div>
          <fieldset>
            <legend className="label">السعر ({currency})</legend>
            <div className="flex gap-2">
              <input name="min" type="number" min={0} defaultValue={q.min ?? ""} placeholder="من" className="input" aria-label="أقل سعر" />
              <input name="max" type="number" min={0} defaultValue={q.max ?? ""} placeholder="إلى" className="input" aria-label="أعلى سعر" />
            </div>
          </fieldset>
          <label className="flex cursor-pointer items-center gap-2 font-semibold text-pv-deep">
            <input type="checkbox" name="stock" value="1" defaultChecked={q.inStock} className="h-5 w-5 accent-pv-green" /> المتوفر فقط
          </label>
          <input type="hidden" name="sort" value={q.sort} />
          <div className="flex gap-2">
            <button className="btn btn-secondary flex-1">تطبيق</button>
            <Link href={basePath} className="btn btn-ghost">مسح</Link>
          </div>
        </form>

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-pv-muted" aria-live="polite"><strong className="text-pv-deep">{res.total}</strong> منتج{q.q ? ` لنتائج «${q.q}»` : ""}</p>
            <nav aria-label="ترتيب" className="flex flex-wrap gap-1.5 text-sm">
              {[["new", "الأحدث"], ["price-asc", "السعر: الأقل"], ["price-desc", "السعر: الأعلى"], ["name", "الاسم"]].map(([v, l]) => (
                <Link key={v} href={params({ sort: v })} aria-current={q.sort === v ? "true" : undefined} className={`rounded-full px-3.5 py-1.5 font-semibold ring-1 ${q.sort === v ? "bg-pv-green text-white ring-pv-green" : "bg-white text-pv-deep ring-pv-border hover:ring-pv-green"}`}>{l}</Link>
              ))}
            </nav>
          </div>
          {res.items.length === 0 ? (
            <div className="card grid place-items-center p-14 text-center">
              <p className="text-xl font-bold text-pv-deep">لا توجد منتجات مطابقة</p>
              <p className="mt-2 text-pv-muted">جرّب كلمات بحث أخرى أو أزل بعض عوامل التصفية.</p>
              <Link href={basePath} className="btn btn-outline mt-5">عرض كل المنتجات</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
              {res.items.map((p) => <ProductCard key={p.id} p={p} currency={currency} />)}
            </div>
          )}
          {res.pages > 1 && (
            <nav aria-label="الصفحات" className="mt-10 flex justify-center gap-2">
              {Array.from({ length: res.pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={params({ page: String(n) })} aria-current={n === res.page ? "page" : undefined} className={`grid h-11 w-11 place-items-center rounded-xl font-bold ring-1 ${n === res.page ? "bg-pv-green text-white ring-pv-green" : "bg-white ring-pv-border"}`}>{n}</Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}
