"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useCart } from "./cart";
import { IconBag, IconChevron, IconInstagram, IconPhone, IconUp } from "./icons";
import { formatPrice } from "@/lib/format";
import { branchWindows, isOpenAt, nowInTz, type ExceptionRow, type HourRow } from "@/lib/hours";
import type { ProductDTO } from "@/lib/data";

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${vis ? "is-visible" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function FloatingContact({ whatsapp, instagram }: { whatsapp: string; instagram: string }) {
  if (!whatsapp && !instagram) return null;
  return (
    <div className="fixed bottom-24 left-4 z-[900] flex flex-col gap-2">
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener"
          aria-label="تواصل عبر واتساب"
          className="grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform hover:scale-105"
        >
          <IconPhone />
        </a>
      )}
      {instagram && (
        <a
          href={instagram}
          target="_blank"
          rel="noopener"
          aria-label="حسابنا على إنستغرام"
          className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-tr from-pv-yellow via-[#e2703a] to-pv-teal text-white shadow-xl transition-transform hover:scale-105"
        >
          <IconInstagram />
        </a>
      )}
    </div>
  );
}

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 700);
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="العودة إلى أعلى الصفحة"
      className={`fixed bottom-6 right-6 z-[900] grid h-12 w-12 place-items-center rounded-full bg-pv-green text-white shadow-lg transition-all duration-300 hover:bg-pv-deep ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
      tabIndex={show ? 0 : -1}
    >
      <IconUp />
    </button>
  );
}

export function OpenNow({ tz, hours, exceptions, light = false }: { tz: string; hours: HourRow[]; exceptions: ExceptionRow[]; light?: boolean }) {
  const [state, setState] = useState<null | boolean>(null);
  useEffect(() => {
    const calc = () => {
      const n = nowInTz(tz);
      setState(isOpenAt(n.minutes, branchWindows(n.date, hours, exceptions)));
    };
    calc();
    const t = setInterval(calc, 60_000);
    return () => clearInterval(t);
  }, [tz, hours, exceptions]);
  if (state === null) return <span className="inline-block h-7 w-24" aria-hidden />;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${
        state ? "bg-pv-green/15 text-pv-green" : light ? "bg-white/10 text-pv-pale" : "bg-stone-100 text-stone-600"
      } ${light && state ? "bg-pv-yellow! text-pv-deep!" : ""}`}
    >
      <span className={`h-2 w-2 rounded-full ${state ? "bg-current animate-pulse" : "bg-current opacity-60"}`} aria-hidden />
      {state ? "مفتوح الآن" : "مغلق الآن"}
    </span>
  );
}

export function Stars({ avg, count, size = 15 }: { avg: number; count: number; size?: number }) {
  if (!count) return null;
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`التقييم ${avg} من 5 بناءً على ${count} من التقييمات`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden fill={i <= Math.round(avg) ? "#E8B84A" : "#E3DED4"}>
          <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
      <span className="text-xs font-semibold text-pv-muted">({count})</span>
    </span>
  );
}

export function ProductCard({ p, currency }: { p: ProductDTO; currency: string }) {
  const { add } = useCart();
  const off = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
  const out = p.stock <= 0;
  return (
    <article className="product-card card lift group relative flex h-full flex-col overflow-hidden rounded-3xl!">
      {off > 0 && <span className="badge-pulse absolute top-3 right-3 z-10 rounded-full bg-pv-yellow px-2.5 py-1 text-xs font-bold text-pv-deep">خصم {off}%</span>}
      {p.isSample && <span className="absolute top-3 left-3 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-pv-muted">تجريبي</span>}
      <Link href={`/shop/${p.slug}`} className="relative block aspect-square overflow-hidden bg-pv-cream" tabIndex={-1} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.imageUrl} alt="" loading="lazy" width={600} height={600} className={`zoom-img h-full w-full object-cover ${out ? "opacity-60 grayscale-[40%]" : ""}`} />
      </Link>
      <div className="flex flex-1 flex-col items-center p-3 text-center">
        <Stars avg={p.ratingAvg} count={p.ratingCount} size={13} />
        <p className="mt-1 text-[11px] text-pv-muted">{p.size || p.categoryName || " "}</p>
        <h3 className="mt-0.5 line-clamp-2 min-h-10 text-[13px] font-bold sm:text-sm leading-snug text-pv-text">
          <Link href={`/shop/${p.slug}`} className="hover:text-pv-green">{p.name}</Link>
        </h3>
        <div className="mt-2 flex flex-wrap items-baseline justify-center gap-2">
          <span className="text-base font-extrabold text-pv-deep sm:text-lg">{formatPrice(p.price, currency)}</span>
          {p.compareAt && <s className="text-xs text-pv-muted">{formatPrice(p.compareAt, currency)}</s>}
        </div>
        <p className={`mt-1 text-[11px] font-semibold ${out ? "text-red-700" : p.stock <= 5 ? "text-amber-700" : "text-pv-green"}`}>
          {out ? "غير متوفر حاليًا" : p.stock <= 5 ? `متبقٍ ${p.stock} فقط` : "متوفر"}
        </p>
        <div className="mt-3 grid w-full grid-cols-[1fr_auto] gap-2">
          <button
            disabled={out}
            onClick={() => add({ id: p.id, slug: p.slug, name: p.name, price: p.price, imageUrl: p.imageUrl, stock: p.stock })}
            className="btn btn-shop btn-sm min-h-10! px-2! text-[13px] sm:text-sm"
            aria-label={`أضف ${p.name} إلى السلة`}
          >
            <IconBag size={16} /> {out ? "نفد المخزون" : "أضف للسلة"}
          </button>
          <Link href={`/shop/${p.slug}`} className="btn btn-outline btn-sm min-h-10! w-10! px-2!" aria-label={`تفاصيل ${p.name}`}>
            <IconChevron className="rotate-180" size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}

const TABS = [["all", "الجميع"], ["cat", "للقطط"], ["dog", "للكلاب"]] as const;

export function PopularTabs({ all, cats, dogs, currency }: { all: ProductDTO[]; cats: ProductDTO[]; dogs: ProductDTO[]; currency: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("all");
  const items = tab === "cat" ? cats : tab === "dog" ? dogs : all;
  return (
    <div>
      <div className="mb-8 flex justify-center gap-2" role="tablist" aria-label="تصفية المنتجات المختارة">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all ${tab === k ? "bg-pv-yellow text-pv-deep shadow-md" : "bg-white text-pv-deep ring-1 ring-pv-border hover:ring-pv-yellow"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div key={tab} className="step-enter grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4" role="tabpanel">
        {items.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} currency={currency} />)}
      </div>
      <div className="mt-8 text-center">
        <Link href="/shop" className="btn btn-outline">عرض المزيد</Link>
      </div>
    </div>
  );
}

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        try {
          const r = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
          const d = await r.json();
          setMsg(r.ok ? { ok: true, text: "تم الاشتراك بنجاح، أهلًا بك!" } : { ok: false, text: d.error ?? "تعذر الاشتراك" });
          if (r.ok) setEmail("");
        } catch {
          setMsg({ ok: false, text: "تعذر الاتصال، حاول لاحقًا." });
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="nl-email" className="sr-only">البريد الإلكتروني</label>
      <input id="nl-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="بريدك الإلكتروني" dir="ltr" className="input flex-1 text-right" />
      <button disabled={busy} className="btn btn-book">{busy ? "…" : "اشترك"}</button>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`sm:basis-full text-sm font-semibold ${msg.ok ? "text-pv-green" : "text-red-700"}`}>{msg.text}</p>}
    </form>
  );
}

export function Rail({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    // RTL: positive "next" moves leftwards
    el.scrollBy({ left: -dir * el.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <div className="relative">
      <div className="mb-4 flex justify-end gap-2">
        <button onClick={() => scroll(-1)} className="grid h-11 w-11 place-items-center rounded-full border border-pv-border bg-white text-pv-deep hover:bg-pv-green hover:text-white" aria-label={`السابق — ${label}`}>
          <IconChevron className="rotate-180" />
        </button>
        <button onClick={() => scroll(1)} className="grid h-11 w-11 place-items-center rounded-full border border-pv-border bg-white text-pv-deep hover:bg-pv-green hover:text-white" aria-label={`التالي — ${label}`}>
          <IconChevron />
        </button>
      </div>
      <div ref={ref} role="region" aria-label={label} tabIndex={0} className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 pb-4">
        {children}
      </div>
    </div>
  );
}

export function AddToCart({ p }: { p: ProductDTO }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const out = p.stock <= 0;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-xl border border-pv-border bg-white" role="group" aria-label="الكمية">
        <button className="h-12 w-12 text-xl font-bold disabled:opacity-40" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={out || qty <= 1} aria-label="إنقاص الكمية">−</button>
        <input
          type="number"
          min={1}
          max={Math.max(1, p.stock)}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(p.stock || 1, Number(e.target.value) || 1)))}
          className="h-12 w-14 border-x border-pv-border text-center font-bold outline-none"
          aria-label="الكمية"
          disabled={out}
        />
        <button className="h-12 w-12 text-xl font-bold disabled:opacity-40" onClick={() => setQty((q) => Math.min(p.stock, q + 1))} disabled={out || qty >= p.stock} aria-label="زيادة الكمية">+</button>
      </div>
      <button disabled={out} onClick={() => add({ id: p.id, slug: p.slug, name: p.name, price: p.price, imageUrl: p.imageUrl, stock: p.stock }, qty)} className="btn btn-shop flex-1 sm:flex-none sm:min-w-56">
        <IconBag size={19} /> {out ? "غير متوفر حاليًا" : "أضف إلى السلة"}
      </button>
    </div>
  );
}
