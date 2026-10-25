import type { Metadata } from "next";
import Link from "next/link";
import { getServices } from "@/lib/data";
import { PageHeader, ServiceCard } from "@/components/ui";
import { Reveal } from "@/components/client-ui";

export const metadata: Metadata = { title: "الخدمات", description: "خدمات عيادة بيت فالي البيطرية: الكشف، التطعيمات، الفحوصات، العمليات والعناية.", alternates: { canonical: "/services" } };

export default async function ServicesPage() {
  const services = await getServices();
  return (
    <>
      <PageHeader title="خدماتنا البيطرية" subtitle="اختر الخدمة لمعرفة تفاصيلها، أو احجزها مباشرة في الأوقات المتاحة." crumbs={[{ label: "الخدمات" }]} />
      <section className="container-pv py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.id} delay={(i % 3) * 80}><ServiceCard s={s} priority={i < 3} /></Reveal>
          ))}
        </div>
        <p className="mt-12 text-center text-pv-muted">
          تُضاف خدمات أخرى مثل الإقامة أو الزيارات المنزلية بعد تأكيد توفرها. لديك سؤال؟ <Link href="/contact" className="link-pv">تواصل معنا</Link>
        </p>
      </section>
    </>
  );
}
