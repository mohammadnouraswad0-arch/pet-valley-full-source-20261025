import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDoctor } from "@/lib/data";
import { Breadcrumbs, DoctorAvatar, SampleBadge } from "@/components/ui";
import { WEEKDAYS, minToTime } from "@/lib/format";
import { IconArrow } from "@/components/icons";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const d = await getDoctor((await params).slug);
  return d ? { title: d.name, description: d.bio.slice(0, 150), alternates: { canonical: `/doctors/${d.slug}` } } : { title: "غير موجود" };
}

export default async function DoctorPage({ params }: P) {
  const d = await getDoctor((await params).slug);
  if (!d) notFound();
  return (
    <>
      <section className="bg-pv-beige/60 pt-40 pb-16">
        <div className="container-pv grid items-center gap-10 md:grid-cols-[320px_1fr]">
          <div className="aspect-[4/5] overflow-hidden rounded-[32px] shadow-xl"><DoctorAvatar name={d.name} imageUrl={d.imageUrl} /></div>
          <div>
            <Breadcrumbs items={[{ href: "/doctors", label: "الأطباء" }, { label: d.name }]} />
            {d.isSample && <SampleBadge label="ملف تجريبي — بانتظار البيانات الرسمية" />}
            <h1 className="mt-3 text-4xl">{d.name}</h1>
            <p className="mt-2 text-lg font-semibold text-pv-green">{d.title}</p>
            <p className="mt-1 text-sm text-pv-muted">{d.qualifications}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {d.specialties.map((s) => <span key={s} className="rounded-full bg-white px-3 py-1 text-sm font-semibold ring-1 ring-pv-border">{s}</span>)}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/booking?doctor=${d.slug}`} className="btn btn-book">احجز مع الطبيب</Link>
              <Link href="/doctors" className="btn btn-outline">كل الأطباء</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="container-pv grid gap-10 py-16 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <h2 className="text-2xl">نبذة مهنية</h2>
          <p className="mt-4 text-lg leading-loose">{d.bio}</p>
          <h2 className="mt-12 text-2xl">الخدمات التي يقدمها</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {d.services.map((s) => (
              <li key={s.slug} className="card p-5">
                <Link href={`/services/${s.slug}`} className="font-bold hover:text-pv-green">{s.name}</Link>
                <p className="mt-1 text-sm text-pv-muted">{s.short}</p>
                <Link href={`/booking?service=${s.slug}&doctor=${d.slug}`} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-pv-green hover:text-pv-teal">احجز هذه الخدمة <IconArrow size={14} /></Link>
              </li>
            ))}
          </ul>
        </div>
        <aside className="card h-fit p-6">
          <h2 className="text-lg">أوقات التواجد{d.branch ? ` — ${d.branch.name}` : ""}</h2>
          <table className="mt-4 w-full text-sm">
            <tbody>
              {WEEKDAYS.map((day, wd) => {
                const rows = d.hours.filter((h) => h.weekday === wd).sort((a, b) => a.startMin - b.startMin);
                return (
                  <tr key={wd} className="border-t border-pv-border">
                    <th scope="row" className="py-2.5 text-right font-semibold">{day}</th>
                    <td className="py-2.5">{rows.length ? rows.map((r) => `${minToTime(r.startMin)} – ${minToTime(r.endMin)}`).join("، ") : <span className="text-pv-muted">غير متواجد</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-pv-muted">الأوقات المتاحة للحجز تظهر عند اختيار التاريخ في صفحة الحجز.</p>
        </aside>
      </section>
    </>
  );
}
