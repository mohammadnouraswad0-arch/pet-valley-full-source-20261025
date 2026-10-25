import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getService } from "@/lib/data";
import { getSettings } from "@/lib/settings";
import { Breadcrumbs, DoctorAvatar, SampleBadge } from "@/components/ui";
import { ProductCard } from "@/components/client-ui";
import { IconCheck, IconClock } from "@/components/icons";
import { VISIT_TYPES } from "@/lib/format";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const s = await getService((await params).slug);
  if (!s) return { title: "الخدمة غير موجودة" };
  return { title: s.name, description: s.short, alternates: { canonical: `/services/${s.slug}` }, openGraph: { images: [s.imageUrl] } };
}

export default async function ServicePage({ params }: P) {
  const { slug } = await params;
  const [s, settings] = await Promise.all([getService(slug), getSettings()]);
  if (!s) notFound();
  return (
    <>
      <section className="relative overflow-hidden bg-pv-beige/60 pt-40 pb-16">
        <div className="container-pv grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Breadcrumbs items={[{ href: "/services", label: "الخدمات" }, { label: s.name }]} />
            <h1 className="anim-fade-up text-4xl md:text-5xl">{s.name}</h1>
            <p className="anim-fade-up mt-4 text-lg text-pv-muted [animation-delay:100ms]">{s.short}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-semibold"><IconClock size={16} /> مدة الموعد التقريبية: {s.durationMin} دقيقة</span>
              {s.visitTypes.map((v) => <span key={v} className="rounded-full bg-white px-3 py-1.5 font-semibold">{VISIT_TYPES[v] ?? v}</span>)}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {s.isBookable ? <Link href={`/booking?service=${s.slug}`} className="btn btn-book">احجز هذه الخدمة</Link> : <Link href="/contact" className="btn btn-book">تواصل للاستفسار</Link>}
              <Link href="/services" className="btn btn-outline">كل الخدمات</Link>
            </div>
          </div>
          <div className="anim-fade-in overflow-hidden rounded-[32px] shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.imageUrl.replace("w=900", "w=1400")} alt={s.imageAlt} fetchPriority="high" width={1400} height={933} className="aspect-[4/3] w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="container-pv grid gap-12 py-16 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <h2 className="text-2xl">عن الخدمة</h2>
          <p className="mt-4 text-lg leading-loose text-pv-text/85">{s.description}</p>
          {s.highlights.length > 0 && (
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {s.highlights.map((h) => (
                <li key={h} className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-pv-border">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-pv-green text-white"><IconCheck size={16} /></span>
                  <span className="font-semibold">{h}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-8 text-sm text-pv-muted">{s.priceNote || "تُحدد تكلفة الخدمة بعد التقييم، ويمكنك الاستفسار عنها عند التواصل مع العيادة."}</p>
        </div>
        <aside className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg">الأطباء المقدمون لهذه الخدمة</h2>
            {s.doctors.length === 0 ? (
              <p className="mt-3 text-sm text-pv-muted">تُقدَّم الخدمة من فريق العيادة المختص.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {s.doctors.map((d) => (
                  <li key={d.id} className="flex items-center gap-3">
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl"><DoctorAvatar name={d.name} imageUrl={d.imageUrl} className="[&>span]:hidden" /></span>
                    <span className="flex-1">
                      <Link href={`/doctors/${d.slug}`} className="font-bold hover:text-pv-green">{d.name}</Link>
                      <span className="block text-xs text-pv-muted">{d.title}</span>
                      {d.isSample && <SampleBadge />}
                    </span>
                    {s.isBookable && <Link href={`/booking?service=${s.slug}&doctor=${d.slug}`} className="btn btn-book btn-sm">احجز</Link>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-[20px] bg-pv-green p-6 text-white">
            <h2 className="text-lg text-white!">ملاحظة مهمة</h2>
            <p className="mt-2 text-sm text-white/80">المعلومات هنا تعريفية عامة ولا تغني عن تقييم الطبيب. في الحالات الطارئة، تواصل مع العيادة هاتفيًا.</p>
          </div>
        </aside>
      </section>

      {s.products.length > 0 && (
        <section className="container-pv pb-8">
          <h2 className="mb-6 text-2xl">منتجات مرتبطة بالخدمة</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {s.products.map((p) => <ProductCard key={p.id} p={p} currency={settings.currency} />)}
          </div>
        </section>
      )}
    </>
  );
}
