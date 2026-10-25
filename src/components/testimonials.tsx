"use client";

import { useState } from "react";
import { Rail, Stars } from "./client-ui";

export type Testimonial = { id: number; name: string; petName: string; rating: number; text: string };

export function Testimonials({ items }: { items: Testimonial[] }) {
  const [name, setName] = useState("");
  const [petName, setPetName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div>
        {items.length === 0 ? (
          <p className="rounded-3xl bg-white p-8 text-center leading-relaxed text-pv-muted ring-1 ring-pv-border">
            آراء عملائنا المعتمدة ستظهر هنا. شاركنا تجربتك وكن أول من يظهر في هذا القسم بعد مراجعة الإدارة.
          </p>
        ) : (
          <Rail label="آراء العملاء">
            {items.map((t) => (
              <figure key={t.id} className="flex w-[85%] shrink-0 snap-start flex-col rounded-3xl bg-white p-6 ring-1 ring-pv-border sm:w-[47%]">
                <Stars avg={t.rating} count={1} />
                <blockquote className="mt-3 line-clamp-5 flex-1 leading-relaxed text-pv-text/90">“{t.text}”</blockquote>
                <figcaption className="mt-4 border-t border-pv-border pt-3 font-bold text-pv-deep">
                  {t.name} {t.petName && <span className="font-normal text-pv-muted">— مع {t.petName}</span>}
                </figcaption>
              </figure>
            ))}
          </Rail>
        )}
      </div>
      <div className="card p-6">
        <h3 className="text-xl">شاركنا رأيك</h3>
        <p className="mt-1 text-sm text-pv-muted">يُنشر رأيك بعد مراجعة الإدارة.</p>
        <form
          className="mt-4 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMsg(null);
            try {
              const r = await fetch("/api/testimonials", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, petName, rating, text }) });
              const d = await r.json();
              if (r.ok) {
                setMsg({ ok: true, text: "شكرًا! تم استلام رأيك وسيُنشر بعد المراجعة." });
                setName("");
                setPetName("");
                setText("");
              } else setMsg({ ok: false, text: d.error ?? "تعذر إرسال الرأي" });
            } catch {
              setMsg({ ok: false, text: "تعذر الاتصال، حاول لاحقًا." });
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tm-name" className="label">الاسم</label>
              <input id="tm-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} className="input" />
            </div>
            <div>
              <label htmlFor="tm-pet" className="label">اسم حيوانك (اختياري)</label>
              <input id="tm-pet" value={petName} onChange={(e) => setPetName(e.target.value)} maxLength={60} className="input" />
            </div>
          </div>
          <fieldset>
            <legend className="label">تقييمك</legend>
            <div className="flex gap-1" role="radiogroup" aria-label="عدد النجوم">
              {[5, 4, 3, 2, 1].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} نجوم`} onClick={() => setRating(n)} className={`rounded-lg p-1 ${rating === n ? "bg-pv-pale" : ""}`}>
                  <svg width={26} height={26} viewBox="0 0 20 20" aria-hidden fill={n <= rating ? "#E8B84A" : "#E3DED4"}>
                    <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                  </svg>
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="tm-text" className="label">رأيك بتجربتك معنا</label>
            <textarea id="tm-text" value={text} onChange={(e) => setText(e.target.value)} required minLength={4} maxLength={1000} rows={3} className="input" />
          </div>
          {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm font-semibold ${msg.ok ? "text-pv-green" : "text-red-700"}`}>{msg.text}</p>}
          <button disabled={busy} className="btn btn-secondary w-full">{busy ? "جارٍ الإرسال…" : "إرسال الرأي"}</button>
        </form>
      </div>
    </div>
  );
}
