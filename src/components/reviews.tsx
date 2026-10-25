"use client";

import { useState } from "react";
import { Stars } from "./client-ui";

export type Review = { id: number; name: string; rating: number; comment: string; createdAt: Date };

export function ReviewSection({ productId, reviews, avg, count }: { productId: number; reviews: Review[]; avg: number; count: number }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <section className="container-pv py-10" aria-labelledby="reviews-title">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 id="reviews-title" className="flex items-center gap-3 text-2xl">
            تقييمات العملاء {count > 0 && <Stars avg={avg} count={count} />}
          </h2>
          {reviews.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-white p-5 text-pv-muted ring-1 ring-pv-border">لا توجد تقييمات بعد — كن أول من يقيّم هذا المنتج.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-2xl bg-white p-5 ring-1 ring-pv-border">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-pv-deep">{r.name}</strong>
                    <Stars avg={r.rating} count={1} size={13} />
                  </div>
                  {r.comment && <p className="mt-2 text-sm leading-relaxed text-pv-text/85">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card h-fit p-6">
          <h3 className="text-xl">أضف تقييمك</h3>
          <p className="mt-1 text-sm text-pv-muted">تُنشر التقييمات بعد مراجعة الإدارة.</p>
          <form
            className="mt-4 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setMsg(null);
              try {
                const r = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId, name, rating, comment }) });
                const d = await r.json();
                if (r.ok) {
                  setMsg({ ok: true, text: "شكرًا! تم استلام تقييمك وسيُنشر بعد المراجعة." });
                  setName("");
                  setComment("");
                } else setMsg({ ok: false, text: d.error ?? "تعذر إرسال التقييم" });
              } catch {
                setMsg({ ok: false, text: "تعذر الاتصال، حاول لاحقًا." });
              } finally {
                setBusy(false);
              }
            }}
          >
            <div>
              <label htmlFor="rv-name" className="label">الاسم</label>
              <input id="rv-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} className="input" />
            </div>
            <fieldset>
              <legend className="label">التقييم</legend>
              <div className="flex gap-1" role="radiogroup" aria-label="عدد النجوم">
                {[5, 4, 3, 2, 1].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} نجوم`} onClick={() => setRating(n)} className={`rounded-lg p-1 ${rating === n ? "bg-pv-pale" : ""}`}>
                    <svg width={28} height={28} viewBox="0 0 20 20" aria-hidden fill={n <= rating ? "#E8B84A" : "#E3DED4"}>
                      <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                    </svg>
                  </button>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="rv-comment" className="label">تعليقك (اختياري)</label>
              <textarea id="rv-comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={1000} className="input" />
            </div>
            {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm font-semibold ${msg.ok ? "text-pv-green" : "text-red-700"}`}>{msg.text}</p>}
            <button disabled={busy} className="btn btn-secondary">{busy ? "جارٍ الإرسال…" : "إرسال التقييم"}</button>
          </form>
        </div>
      </div>
    </section>
  );
}
