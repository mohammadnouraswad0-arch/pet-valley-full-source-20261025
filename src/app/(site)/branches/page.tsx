import type { Metadata } from "next";
import Link from "next/link";
import { getBranches } from "@/lib/data";
import { HoursTable, Notice, PageHeader } from "@/components/ui";
import { OpenNow } from "@/components/client-ui";
import { IconPhone, IconPin } from "@/components/icons";

export const metadata: Metadata = { title: "الفروع", description: "فروع عيادة سامايا طيبة البيطرية وساعات العمل.", alternates: { canonical: "/branches" } };

export default async function BranchesPage() {
  const branches = await getBranches();
  return (
    <>
      <PageHeader title="الفروع وساعات العمل" crumbs={[{ label: "الفروع" }]} />
      <section className="container-pv space-y-8 py-16">
        {branches.map((b) => (
          <article key={b.id} id={b.slug} className="card grid gap-8 p-6 md:p-10 lg:grid-cols-2">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl">{b.name}</h2>
                <OpenNow tz={b.timezone} hours={b.hours} exceptions={b.exceptions} />
              </div>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-2"><IconPin className="mt-0.5 shrink-0 text-pv-green" /> {b.address || "العنوان يُحدد من الإدارة"}{b.city && `، ${b.city}`}</li>
                {b.phone && <li className="flex items-center gap-2"><IconPhone className="text-pv-green" /> <a href={`tel:${b.phone}`} className="ltr hover:underline">{b.phone}</a></li>}
              </ul>
              {!b.infoVerified && <div className="mt-6"><Notice tone="warn">بيانات الفرع (العنوان والهاتف والموقع على الخريطة) بانتظار اعتماد العيادة.</Notice></div>}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/booking" className="btn btn-book">احجز في هذا الفرع</Link>
                {b.mapUrl && <a href={b.mapUrl} target="_blank" rel="noopener" className="btn btn-outline">الاتجاهات على الخريطة</a>}
              </div>
            </div>
            <div className="rounded-3xl bg-pv-cream p-6">
              <h3 className="mb-3 text-lg">ساعات العمل</h3>
              <HoursTable branch={b} />
              {!b.hoursVerified && <p className="mt-3 text-sm text-pv-muted">* ساعات تجريبية بانتظار الاعتماد.</p>}
              <p className="mt-2 text-xs text-pv-muted">التوقيت المحلي: <span className="ltr">{b.timezone}</span></p>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
