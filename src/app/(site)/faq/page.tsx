import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "الأسئلة الشائعة", alternates: { canonical: "/faq" } };

const FAQ = [
  ["كيف أحجز موعدًا؟", "من صفحة الحجز: اختر نوع الحيوان والخدمة، ثم التاريخ والوقت المتاح، وأدخل بياناتك. ستحصل على رقم مرجعي لمتابعة الطلب."],
  ["هل يعني إرسال الطلب أن الموعد مؤكد؟", "لا. يُسجَّل الطلب بحالة «قيد المراجعة»، ثم تتواصل معك العيادة لتأكيده. يمكنك متابعة الحالة من صفحة «تتبع الطلب أو الحجز»."],
  ["كيف أعرف الأوقات المتاحة؟", "الأوقات المعروضة تُحسب تلقائيًا من ساعات عمل الفرع وجداول الأطباء ومدة الخدمة والمواعيد المحجوزة مسبقًا."],
  ["هل يمكنني إلغاء الحجز؟", "نعم، يمكنك إلغاء الطلب قيد المراجعة من صفحة المتابعة باستخدام الرقم المرجعي ورقم الجوال، أو بالتواصل مع العيادة."],
  ["ما طرق الدفع المتاحة في المتجر؟", "حاليًا الدفع عند الاستلام فقط. الدفع الإلكتروني سيُضاف بعد ربطه واختباره."],
  ["هل يتوفر التوصيل؟", "تظهر خيارات الاستلام والتوصيل ورسومها في صفحة إتمام الطلب وفق إعدادات المتجر المعتمدة. راجع صفحة الشحن والاسترجاع للتفاصيل."],
  ["هل تقدمون زيارات منزلية أو إقامة؟", "هذه الخدمات بانتظار تأكيد الإدارة، وستظهر في صفحة الخدمات عند تفعيلها."],
];

export default function FaqPage() {
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <PageHeader title="الأسئلة الشائعة" crumbs={[{ label: "الأسئلة الشائعة" }]} />
      <section className="container-pv max-w-3xl space-y-3 py-16">
        {FAQ.map(([q, a], i) => (
          <details key={i} className="card group p-0" open={i === 0}>
            <summary className="flex items-center justify-between gap-4 p-5 text-lg font-bold text-pv-deep">
              {q}
              <span className="faq-icon grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pv-pale text-xl text-pv-deep" aria-hidden>+</span>
            </summary>
            <div className="faq-body px-5 pb-5 leading-relaxed text-pv-text/85">{a}</div>
          </details>
        ))}
        <p className="pt-6 text-center text-pv-muted">لم تجد إجابتك؟ <Link href="/contact" className="link-pv">تواصل معنا</Link></p>
      </section>
    </>
  );
}
