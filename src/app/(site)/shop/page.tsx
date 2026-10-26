import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getCategories, getCategoryCounts, searchProducts } from "@/lib/data";
import { Catalog, ShopBar, hasFilters, parseQuery, type SP } from "@/components/shop";
import { ProductCard, Rail, Reveal } from "@/components/client-ui";
import { SectionTitle } from "@/components/ui";
import { IconArrow, IconBag, IconCalendar, IconPaw, IconShield, IconTruck } from "@/components/icons";

export const metadata: Metadata = { title: "المتجر", description: "متجر سامايا طيبة: طعام، عناية، ألعاب وإكسسوارات للقطط والكلاب.", alternates: { canonical: "/shop" } };

export default async function ShopPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const filtered = hasFilters(parseQuery(sp)) || !!sp.category;
  const [s, cats, counts, featured, catsP, dogsP, grooming, newest, sale] = await Promise.all([
    getSettings(),
    getCategories(),
    getCategoryCounts(),
    searchProducts({ featured: true, pageSize: 8 }),
    searchProducts({ pet: "cat", pageSize: 10 }),
    searchProducts({ pet: "dog", pageSize: 10 }),
    searchProducts({ category: "grooming", pageSize: 10 }),
    searchProducts({ sort: "new", pageSize: 10 }),
    searchProducts({ onSale: true, pageSize: 1 }),
  ]);
  const cat = (slug: string) => cats.find((c) => c.slug === slug);

  const rail = (title: string, items: typeof featured.items, href: string) =>
    items.length > 0 && (
      <section className="container-pv py-8" aria-label={title}>
        <div className="mb-2 flex items-end justify-between">
          <h2 className="flex items-center gap-2 text-2xl md:text-3xl">{title} <IconPaw size={22} className="text-pv-yellow" /></h2>
          <Link href={href} className="link-pv text-sm">عرض الكل</Link>
        </div>
        <Rail label={title}>
          {items.map((p) => (
            <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23.5%]"><ProductCard p={p} currency={s.currency} /></div>
          ))}
        </Rail>
      </section>
    );

  return (
    <>
      <div className="pt-[120px]">
        <ShopBar message={s.shopBarMessage} />
      </div>
      {!filtered && (
        <>
          {/* HERO */}
          <section className="container-pv pt-8">
            <div className="relative grid overflow-hidden rounded-[36px] bg-gradient-to-l from-pv-cream via-pv-beige/60 to-pv-pale/70 md:grid-cols-2">
              <IconPaw size={140} className="absolute right-8 top-8 text-pv-yellow/40" />
              <IconPaw size={90} className="absolute bottom-10 left-[45%] -rotate-12 text-pv-green/20" />
              <div className="relative z-10 p-8 md:p-12 lg:p-14">
                <p className="eyebrow">وصل حديثًا إلى المتجر</p>
                <h1 className="anim-fade-up mt-3 text-4xl leading-tight md:text-5xl">{s.shopHeroTitle}</h1>
                <p className="anim-fade-up mt-4 max-w-md text-lg text-pv-text/80 [animation-delay:100ms]">{s.shopHeroSubtitle}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="#catalog" className="btn btn-shop"><IconBag size={20} /> تسوق الآن</Link>
                  <Link href="/booking" className="btn btn-outline"><IconCalendar size={18} /> احجز موعدًا</Link>
                </div>
                <dl className="mt-8 flex gap-8">
                  {[["طعام وعناية", "مختارات يومية"], ["الدفع", "عند الاستلام"]].map(([k, v]) => (
                    <div key={k}><dt className="text-sm text-pv-muted">{k}</dt><dd className="font-extrabold text-pv-deep">{v}</dd></div>
                  ))}
                </dl>
              </div>
              <div className="relative min-h-72 md:min-h-[440px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.shopHeroImage} alt="كلب أبيض صغير يجلس بجانب أوعية الطعام" fetchPriority="high" className="anim-fade-in absolute inset-0 h-full w-full object-cover" />
                <span className="absolute inset-y-0 right-0 hidden w-24 bg-gradient-to-l from-transparent to-pv-cream/40 md:block" aria-hidden />
              </div>
            </div>
          </section>

          {/* TRUST */}
          <section className="container-pv pt-8" aria-label="مزايا المتجر">
            <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-pv-border lg:grid-cols-4">
              {[
                [IconTruck, "استلام مرن", s.deliveryEnabled ? "استلام من العيادة أو توصيل" : "استلام من العيادة"],
                [IconShield, "مخزون حقيقي", "الكميات تُتحقق عند الطلب"],
                [IconBag, "دفع عند الاستلام", "ادفع عندما يصلك طلبك"],
                [IconCalendar, "مرتبط بالعيادة", "منتجات تكمل خدماتنا"],
              ].map(([I, t, d], i) => {
                const Icon = I as typeof IconPaw;
                return (
                  <li key={i} className="flex items-center gap-3 bg-white p-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-pv-pale text-pv-deep"><Icon /></span>
                    <span><span className="block text-sm font-bold text-pv-deep">{t as string}</span><span className="block text-xs text-pv-muted">{d as string}</span></span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* CATEGORIES */}
          <section className="container-pv py-12" aria-labelledby="cats-title">
            <SectionTitle id="cats-title" title="تسوق حسب التصنيف" />
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {cats.map((c, i) => (
                <li key={c.id}>
                  <Reveal delay={i * 60} className="h-full">
                    <Link href={`/shop/category/${c.slug}`} className="card lift group flex h-full items-center gap-4 p-4">
                      <span className="block h-20 w-20 shrink-0 overflow-hidden rounded-full bg-pv-cream ring-2 ring-pv-pale transition group-hover:ring-pv-yellow">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.imageUrl} alt="" loading="lazy" className="zoom-img h-full w-full object-cover group-hover:scale-110" />
                      </span>
                      <span>
                        <span className="block font-extrabold text-pv-deep">{c.name}</span>
                        <span className="block text-xs text-pv-muted">{counts.get(c.id) ?? 0} منتجات</span>
                      </span>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          </section>

          {rail("منتجات مختارة", featured.items, "/shop?sort=new#catalog")}

          {/* BANNERS */}
          <section className="container-pv py-8" aria-label="تصنيفات مميزة">
            <div className="grid auto-rows-[210px] gap-5 md:grid-cols-3">
              {[
                { slug: "dog-food", title: "طعام الكلاب", desc: "تغذية يومية متوازنة", wide: false },
                { slug: "cat-food", title: "طعام القطط", desc: "خيارات تناسب كل الأعمار", wide: false },
                { slug: "toys", title: "ألعاب ومرح", desc: "نشاط يومي لحيوانك", wide: false },
              ].map((b, i) => (
                <Reveal key={b.slug} delay={i * 70}>
                  <Link href={`/shop/category/${b.slug}`} className="group relative flex h-full items-end overflow-hidden rounded-[28px] bg-pv-green p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cat(b.slug)?.imageUrl} alt="" loading="lazy" className="zoom-img absolute inset-0 h-full w-full object-cover opacity-90 group-hover:scale-105" />
                    <span className="absolute inset-0 bg-gradient-to-t from-pv-deep/85 via-pv-deep/20 to-transparent" />
                    <span className="relative">
                      <span className="block text-xl font-extrabold text-white">{b.title}</span>
                      <span className="block text-sm text-white/85">{b.desc}</span>
                      <span className="btn btn-shop btn-sm mt-3">تسوق <IconArrow size={15} /></span>
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {[
                { slug: "grooming", title: "العناية والنظافة", desc: "كل ما تحتاجه لجلسة عناية منزلية", img: "grooming" },
                { slug: "accessories", title: "الإكسسوارات", desc: "أطواق وأحزمة ومستلزمات الخروج", img: "accessories" },
              ].map((b) => (
                <Link key={b.slug} href={`/shop/category/${b.slug}`} className="group relative flex min-h-44 items-center overflow-hidden rounded-[28px] bg-pv-deep p-7">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cat(b.img)?.imageUrl} alt="" loading="lazy" className="zoom-img absolute inset-y-0 left-0 h-full w-2/3 object-cover [mask-image:linear-gradient(to_left,transparent,black_50%)] group-hover:scale-105" />
                  <span className="relative">
                    <span className="block text-2xl font-extrabold text-white">{b.title}</span>
                    <span className="block text-white/85">{b.desc}</span>
                    <span className="btn btn-shop btn-sm mt-4">تسوق الآن</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* SALE */}
          {sale.total > 0 && (
            <section className="container-pv py-6" aria-label="عروض">
              <Link href="/shop?sort=price-asc#catalog" className="flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[28px] bg-pv-yellow p-6 md:p-8">
                <span>
                  <span className="block text-2xl font-extrabold text-pv-deep">عروض حالية على {sale.total} منتجات</span>
                  <span className="text-pv-deep/80">أسعار مخفضة حقيقية لفترة محدودة وفق إعدادات المتجر.</span>
                </span>
                <span className="btn btn-secondary shrink-0">اكتشف العروض</span>
              </Link>
            </section>
          )}

          {rail("منتجات القطط", catsP.items, "/shop?pet=cat#catalog")}
          {rail("منتجات الكلاب", dogsP.items, "/shop?pet=dog#catalog")}
          {rail("وصل حديثًا", newest.items, "/shop?sort=new#catalog")}

          <div className="container-pv pt-10">
            <SectionTitle title="كل المنتجات" desc="ابحث وصفِّ حسب التصنيف والسعر والتوفر." />
          </div>
        </>
      )}
      {filtered && (
        <div className="container-pv pt-8">
          <h1 className="text-3xl">نتائج المتجر</h1>
        </div>
      )}
      <Catalog sp={sp} basePath="/shop" currency={s.currency} />

      {/* GUARANTEES */}
      <section className="container-pv pb-4" aria-label="وعود المتجر">
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["منتجات مختارة بعناية", "نعرض ما نثق به لحيوانك"],
            ["سعر واضح", "لا رسوم خفية عند الدفع"],
            ["مخزون محدّث", "التوفر يُتحقق لحظة الطلب"],
            ["تواصل سهل", "نتابع معك طلبك حتى الاستلام"],
          ].map(([t, d]) => (
            <li key={t} className="rounded-3xl bg-white p-5 text-center ring-1 ring-pv-border">
              <p className="font-extrabold text-pv-deep">{t}</p>
              <p className="mt-1 text-sm text-pv-muted">{d}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
