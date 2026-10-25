import { getApprovedTestimonials, getPendingTestimonials } from "@/lib/data";
import { approveTestimonial, deleteTestimonial } from "../../actions";

export default async function AdminTestimonials() {
  const [pending, approved] = await Promise.all([getPendingTestimonials(), getApprovedTestimonials(100)]);
  const card = (t: (typeof pending)[number], showApprove: boolean) => (
    <div key={t.id} className="card flex flex-wrap items-start justify-between gap-3 p-4">
      <div className="max-w-xl">
        <p className="font-bold">
          {t.name} {t.petName && <span className="font-normal text-pv-muted">(مع {t.petName})</span>}{" "}
          <span className="text-pv-yellow" aria-label={`التقييم ${t.rating} من 5`}>{"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}</span>
        </p>
        <p className="mt-1 text-sm leading-relaxed">{t.text}</p>
      </div>
      <div className="flex gap-2">
        {showApprove && (
          <form action={approveTestimonial}><input type="hidden" name="id" value={t.id} /><button className="btn btn-secondary btn-sm">اعتماد ونشر</button></form>
        )}
        <form action={deleteTestimonial}><input type="hidden" name="id" value={t.id} /><button className="btn btn-ghost btn-sm">حذف</button></form>
      </div>
    </div>
  );
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl">آراء العملاء</h1>
      <p className="mt-2 text-pv-muted">تُنشر الآراء في الرئيسية فقط بعد اعتمادها. لا تُضف آراء مخترعة.</p>
      <h2 className="mt-8 text-xl">بانتظار المراجعة ({pending.length})</h2>
      <div className="mt-3 space-y-3">
        {pending.length === 0 && <p className="card p-5 text-center text-pv-muted">لا توجد آراء جديدة.</p>}
        {pending.map((t) => card(t, true))}
      </div>
      <h2 className="mt-10 text-xl">منشورة ({approved.length})</h2>
      <div className="mt-3 space-y-3">{approved.map((t) => card(t, false))}</div>
    </div>
  );
}
