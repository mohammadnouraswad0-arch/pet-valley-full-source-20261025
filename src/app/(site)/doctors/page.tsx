import type { Metadata } from "next";
import { getDoctors } from "@/lib/data";
import { DoctorCard, Notice, PageHeader } from "@/components/ui";
import { Reveal } from "@/components/client-ui";

export const metadata: Metadata = { title: "الأطباء", description: "تعرف على الفريق الطبي في عيادة بيت فالي البيطرية.", alternates: { canonical: "/doctors" } };

export default async function DoctorsPage() {
  const doctors = await getDoctors();
  return (
    <>
      <PageHeader title="فريق يضع راحة حيوانك أولًا" subtitle="اختر الطبيب لعرض ملفه وخدماته، أو احجز معه مباشرة." crumbs={[{ label: "الأطباء" }]} />
      <section className="container-pv py-16">
        {doctors.some((d) => d.isSample) && (
          <div className="mb-8"><Notice tone="warn">الملفات المعروضة نماذج تجريبية لعرض التصميم والحجز، وتُستبدل بأسماء الأطباء وصورهم ومؤهلاتهم الرسمية بعد اعتمادها من العيادة.</Notice></div>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {doctors.map((d, i) => <Reveal key={d.id} delay={i * 80}><DoctorCard d={d} /></Reveal>)}
        </div>
      </section>
    </>
  );
}
