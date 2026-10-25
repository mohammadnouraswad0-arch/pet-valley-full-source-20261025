import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getApprovedReviews, getProduct } from "@/lib/data";
import { getSettings } from "@/lib/settings";
import { ReviewSection } from "@/components/reviews";
import { ShopBar } from "@/components/shop";
import { Breadcrumbs, Notice } from "@/components/ui";
import { AddToCart, ProductCard } from "@/components/client-ui";
import { BackLink } from "@/components/back-link";
import { formatPrice } from "@/lib/format";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  return p ? { title: p.name, description: p.description.slice(0, 155), alternates: { canonical: `/shop/${p.slug}` }, openGraph: { images: [p.imageUrl] } } : { title: "منتج غير موجود" };
}

export default async function ProductPage({ params }: P) {
  const { slug } = await params;
  const [p, s] = await Promise.all([getProduct(slug), getSettings()]);
  if (!p) notFound();
  const approved = await getApprovedReviews(p.id);
  const off = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    image: p.imageUrl,
    description: p.description,
    ...(p.brandName ? { brand: { "@type": "Brand", name: p.brandName } } : {}),
    offers: { "@type": "Offer", price: (p.price / 100).toFixed(2), availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="pt-[120px]"><ShopBar message={s.shopBarMessage} /></div>
      <section className="container-pv py-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Breadcrumbs items={[{ href: "/shop", label: "المتجر" }, ...(p.categorySlug ? [{ href: `/shop/category/${p.categorySlug}`, label: p.categoryName ?? "" }] : []), { label: p.name }]} />
          <BackLink />
        </div>
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-[32px] bg-white ring-1 ring-pv-border">
            {off > 0 && <span className="badge-pulse absolute top-5 right-5 z-10 rounded-full bg-pv-yellow px-3 py-1.5 font-bold text-pv-deep">خصم {off}%</span>}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.imageUrl.replace("w=900", "w=1200")} alt={p.imageAlt || p.name} fetchPriority="high" width={1200} height={1200} className="anim-fade-in aspect-square w-full object-cover" />
          </div>
          <div>
            {p.brandName && <p className="ltr inline-block font-bold text-pv-teal">{p.brandName}</p>}
            <h1 className="mt-1 text-3xl md:text-4xl">{p.name}</h1>
            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-extrabold text-pv-deep">{formatPrice(p.price, s.currency)}</span>
              {p.compareAt && <s className="text-lg text-pv-muted">{formatPrice(p.compareAt, s.currency)}</s>}
            </div>
            <p className={`mt-2 font-semibold ${p.stock <= 0 ? "text-red-700" : p.stock <= 5 ? "text-amber-700" : "text-pv-green"}`}>
              {p.stock <= 0 ? "غير متوفر حاليًا" : p.stock <= 5 ? `متبقٍ ${p.stock} قطع فقط` : "متوفر في المخزون"}
            </p>
            <p className="mt-6 text-lg leading-loose text-pv-text/85">{p.description}</p>
            <div className="mt-8"><AddToCart p={p} /></div>
            <dl className="mt-8 divide-y divide-pv-border rounded-2xl bg-white ring-1 ring-pv-border">
              {[["التصنيف", p.categoryName ?? "—"], ["العلامة التجارية", p.brandName ?? "—"], ["الوزن / الحجم", p.size || "—"], ...Object.entries(p.specs)].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-5 py-3"><dt className="font-semibold text-pv-deep">{k}</dt><dd className="text-pv-muted">{v}</dd></div>
              ))}
            </dl>
            {p.isSample && <div className="mt-6"><Notice tone="warn">منتج تجريبي لعرض تجربة المتجر؛ الاسم والسعر والصورة توضيحية بانتظار بيانات المخزون الرسمية.</Notice></div>}
            {p.service && (
              <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-pv-green p-5 text-white">
                <span>يرتبط هذا المنتج بخدمة <strong>{p.service.name}</strong></span>
                <Link href={`/services/${p.service.slug}`} className="btn btn-book btn-sm">اكتشف الخدمة</Link>
              </div>
            )}
          </div>
        </div>
      </section>
      <ReviewSection productId={p.id} reviews={approved} avg={p.ratingAvg} count={p.ratingCount} />
      {p.related.length > 0 && (
        <section className="container-pv py-10">
          <h2 className="mb-6 text-2xl">منتجات ذات صلة</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {p.related.map((r) => <ProductCard key={r.id} p={r} currency={s.currency} />)}
          </div>
        </section>
      )}
    </>
  );
}
