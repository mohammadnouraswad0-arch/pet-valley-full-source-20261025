"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./cart";
import { formatPrice } from "@/lib/format";
import { IconBag, IconClose } from "./icons";

type ValLine = { id: number; slug?: string; name?: string; price?: number; compareAt?: number | null; stock?: number; imageUrl?: string; qty?: number; ok?: boolean; missing?: true };
type Validation = { lines: ValLine[]; subtotal: number; discount: number; currency: string; shipping: { id: string; label: string; fee: number }[] };

function useValidation() {
  const { lines, ready, replace } = useCart();
  const [v, setV] = useState<Validation | null>(null);
  const [err, setErr] = useState("");
  const key = JSON.stringify(lines.map((l) => [l.id, l.qty]));
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    fetch("/api/cart", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: lines.map((l) => ({ id: l.id, qty: l.qty })) }) })
      .then((r) => r.json())
      .then((data: Validation) => {
        if (!alive) return;
        setV(data);
        setErr("");
        // sync authoritative price/stock & drop removed products
        const next = lines
          .filter((l) => !data.lines.find((x) => x.id === l.id && x.missing))
          .map((l) => {
            const x = data.lines.find((y) => y.id === l.id);
            return x && !x.missing ? { ...l, price: x.price!, stock: x.stock!, name: x.name!, imageUrl: x.imageUrl! } : l;
          });
        if (JSON.stringify(next) !== JSON.stringify(lines)) replace(next);
      })
      .catch(() => alive && setErr("تعذر التحقق من السلة، تحقق من الاتصال."));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);
  return { v, err };
}

export function CartView() {
  const { lines, ready, setQty, remove } = useCart();
  const { v, err } = useValidation();
  if (!ready) return <div className="h-64 animate-pulse rounded-3xl bg-white" />;
  if (!lines.length)
    return (
      <div className="card grid place-items-center p-14 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-pv-pale text-pv-deep"><IconBag size={36} /></span>
        <h2 className="mt-5 text-2xl">سلتك فارغة</h2>
        <p className="mt-2 text-pv-muted">تصفح المتجر وأضف ما يحتاجه صديقك الأليف.</p>
        <Link href="/shop" className="btn btn-shop mt-6">تسوق الآن</Link>
      </div>
    );
  const cur = v?.currency ?? "ر.س";
  const problems = v?.lines.filter((l) => !l.missing && l.ok === false) ?? [];
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        {err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{err}</p>}
        {problems.length > 0 && <p role="alert" className="rounded-xl bg-pv-pale p-3 text-sm font-semibold text-pv-deep">بعض الكميات تتجاوز المخزون المتوفر، يرجى تعديلها قبل المتابعة.</p>}
        <ul className="space-y-4">
          {lines.map((l) => {
            const val = v?.lines.find((x) => x.id === l.id);
            const over = val && val.ok === false;
            return (
              <li key={l.id} className="card flex gap-4 p-4">
                <Link href={`/shop/${l.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-pv-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.imageUrl} alt="" className="h-full w-full object-cover" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <Link href={`/shop/${l.slug}`} className="font-bold hover:text-pv-green">{l.name}</Link>
                    <button onClick={() => remove(l.id)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-pv-muted hover:bg-red-50 hover:text-red-700" aria-label={`حذف ${l.name}`}><IconClose size={18} /></button>
                  </div>
                  <p className="text-sm text-pv-muted">{formatPrice(l.price, cur)} للقطعة</p>
                  {over && <p className="text-sm font-semibold text-red-700">المتوفر: {l.stock}</p>}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-xl border border-pv-border" role="group" aria-label="الكمية">
                      <button className="h-10 w-10 font-bold disabled:opacity-40" disabled={l.qty <= 1} onClick={() => setQty(l.id, l.qty - 1)} aria-label="إنقاص">−</button>
                      <span className="w-10 text-center font-bold" aria-live="polite">{l.qty}</span>
                      <button className="h-10 w-10 font-bold disabled:opacity-40" disabled={l.qty >= l.stock} onClick={() => setQty(l.id, l.qty + 1)} aria-label="زيادة">+</button>
                    </div>
                    <strong className="text-pv-deep">{formatPrice(l.price * l.qty, cur)}</strong>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <aside className="card h-fit space-y-3 p-6 lg:sticky lg:top-28">
        <h2 className="text-xl">ملخص السلة</h2>
        <div className="flex justify-between"><span>المجموع الفرعي</span><strong>{v ? formatPrice(v.subtotal, cur) : "…"}</strong></div>
        {v && v.discount > 0 && <div className="flex justify-between text-pv-green"><span>وفّرت</span><strong>{formatPrice(v.discount, cur)}</strong></div>}
        <p className="text-sm text-pv-muted">تُحتسب تكلفة الشحن في الخطوة التالية حسب طريقة الاستلام.</p>
        {problems.length > 0 ? (
          <button disabled className="btn btn-shop w-full">إتمام الطلب</button>
        ) : (
          <Link href="/checkout" className="btn btn-shop w-full">إتمام الطلب</Link>
        )}
        <Link href="/shop" className="btn btn-ghost w-full">متابعة التسوق</Link>
      </aside>
    </div>
  );
}

export function CheckoutView({ codEnabled }: { codEnabled: boolean }) {
  const { lines, ready, clear } = useCart();
  const { v } = useValidation();
  const router = useRouter();
  const [ship, setShip] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});

  if (!ready) return <div className="h-64 animate-pulse rounded-3xl bg-white" />;
  if (!lines.length)
    return (
      <div className="card p-10 text-center">
        <p className="text-xl font-bold">لا توجد منتجات في السلة</p>
        <Link href="/shop" className="btn btn-shop mt-5">العودة للمتجر</Link>
      </div>
    );

  const cur = v?.currency ?? "ر.س";
  const opt = v?.shipping.find((o) => o.id === (ship || v.shipping[0]?.id));
  const total = (v?.subtotal ?? 0) + (opt?.fee ?? 0);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErr({});
    const fd = new FormData(e.currentTarget);
    const body = { ...Object.fromEntries(fd.entries()), shippingMethod: opt?.id, items: lines.map((l) => ({ id: l.id, qty: l.qty })) };
    setBusy(true);
    try {
      const r = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        setError(data.error ?? "تعذر إرسال الطلب");
        setFieldErr(data.errors ?? {});
        return;
      }
      clear();
      router.push(`/order-confirmation?ref=${encodeURIComponent(data.ref)}`);
    } catch {
      setError("تعذر الاتصال بالخادم. لم يتم تسجيل الطلب، حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_400px]" noValidate={false}>
      <div className="space-y-6">
        <fieldset className="card space-y-4 p-6">
          <legend className="px-2 text-xl font-bold text-pv-deep">بيانات العميل</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="name" label="الاسم الكامل" required auto="name" err={fieldErr.name} />
            <Field name="phone" label="رقم الجوال" type="tel" required auto="tel" err={fieldErr.phone} />
          </div>
          <Field name="email" label="البريد الإلكتروني (اختياري)" type="email" auto="email" err={fieldErr.email} />
        </fieldset>
        <fieldset className="card space-y-4 p-6">
          <legend className="px-2 text-xl font-bold text-pv-deep">طريقة الاستلام</legend>
          {!v ? <p className="text-pv-muted">جارٍ التحميل…</p> : v.shipping.length === 0 ? <p className="text-red-700">لا توجد طريقة شحن مفعلة حاليًا.</p> : (
            <div className="grid gap-3 sm:grid-cols-2">
              {v.shipping.map((o) => (
                <label key={o.id} className={`flex cursor-pointer items-center justify-between rounded-2xl border-2 p-4 ${opt?.id === o.id ? "border-pv-green bg-pv-green/5" : "border-pv-border"}`}>
                  <span className="flex items-center gap-2 font-semibold"><input type="radio" name="ship" value={o.id} checked={opt?.id === o.id} onChange={() => setShip(o.id)} className="accent-pv-green" /> {o.label}</span>
                  <span className="text-sm">{o.fee ? formatPrice(o.fee, cur) : "بدون رسوم"}</span>
                </label>
              ))}
            </div>
          )}
          {opt?.id === "delivery" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="city" label="المدينة" required auto="address-level2" err={fieldErr.city} />
              <Field name="address" label="العنوان التفصيلي" required auto="street-address" err={fieldErr.address} />
            </div>
          )}
          {fieldErr.address && <p className="text-sm text-red-700">{fieldErr.address}</p>}
          <div>
            <label htmlFor="notes" className="label">ملاحظات (اختياري)</label>
            <textarea id="notes" name="notes" rows={3} className="input" />
          </div>
        </fieldset>
        <fieldset className="card space-y-3 p-6">
          <legend className="px-2 text-xl font-bold text-pv-deep">وسيلة الدفع</legend>
          {codEnabled ? (
            <label className="flex items-center gap-3 rounded-2xl border-2 border-pv-green bg-pv-green/5 p-4 font-semibold">
              <input type="radio" name="paymentMethod" value="cod" defaultChecked className="accent-pv-green" /> الدفع عند الاستلام
            </label>
          ) : (
            <p className="text-red-700">لا توجد وسيلة دفع مفعلة حاليًا.</p>
          )}
          <p className="text-sm text-pv-muted">الدفع الإلكتروني غير مفعّل بعد؛ سيتم التواصل معك لتأكيد الطلب قبل التجهيز.</p>
        </fieldset>
      </div>
      <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-28">
        <h2 className="text-xl">طلبك</h2>
        <ul className="divide-y divide-pv-border text-sm">
          {lines.map((l) => (
            <li key={l.id} className="flex justify-between gap-3 py-2"><span>{l.name} × {l.qty}</span><span className="shrink-0 font-semibold">{formatPrice(l.price * l.qty, cur)}</span></li>
          ))}
        </ul>
        <div className="space-y-2 border-t border-pv-border pt-3">
          <div className="flex justify-between"><span>المجموع الفرعي</span><span>{v ? formatPrice(v.subtotal, cur) : "…"}</span></div>
          <div className="flex justify-between"><span>الشحن</span><span>{opt ? (opt.fee ? formatPrice(opt.fee, cur) : "بدون رسوم") : "—"}</span></div>
          <div className="flex justify-between text-lg font-extrabold text-pv-deep"><span>الإجمالي</span><span>{formatPrice(total, cur)}</span></div>
        </div>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <button disabled={busy || !v || !opt || !codEnabled} className="btn btn-shop w-full">{busy ? "جارٍ إرسال الطلب…" : "تأكيد الطلب"}</button>
        <p className="text-xs text-pv-muted">بالضغط على تأكيد الطلب، أنت توافق على <Link href="/terms" className="underline">الشروط</Link> و<Link href="/privacy-policy" className="underline">سياسة الخصوصية</Link>.</p>
      </aside>
    </form>
  );
}

function Field({ name, label, type = "text", required = false, auto, err }: { name: string; label: string; type?: string; required?: boolean; auto?: string; err?: string }) {
  const ltr = type === "tel" || type === "email";
  return (
    <div>
      <label htmlFor={name} className="label">{label}{required && <span className="text-red-700"> *</span>}</label>
      <input id={name} name={name} type={type} required={required} autoComplete={auto} dir={ltr ? "ltr" : undefined} className={`input ${ltr ? "text-right" : ""}`} aria-invalid={!!err} aria-describedby={err ? `${name}-err` : undefined} />
      {err && <p id={`${name}-err`} className="mt-1 text-sm text-red-700">{err}</p>}
    </div>
  );
}
