import Link from "next/link";
import type { ReactNode } from "react";
import { IconArrow, IconChevron, IconClock, IconInfo } from "./icons";
import { WEEKDAYS, minToTime, formatDateAr } from "@/lib/format";
import { nowInTz } from "@/lib/hours";
import type { BranchWithHours } from "@/lib/data";

export function PageHeader({
  title,
  subtitle,
  crumbs,
  children,
}: {
  title: string;
  subtitle?: string;
  crumbs?: { href?: string; label: string }[];
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-pv-beige/70 to-pv-cream pt-40 pb-12 md:pt-44 md:pb-16">
      <svg aria-hidden className="pointer-events-none absolute -left-24 -top-10 h-80 w-80 text-pv-pale/70" viewBox="0 0 200 200"><path fill="currentColor" d="M43.5,-61.2C55.8,-51.3,64.4,-37.4,69.5,-21.9C74.6,-6.4,76.2,10.7,70.1,24.6C64,38.6,50.2,49.4,35.4,57.8C20.6,66.2,4.8,72.2,-11.6,72.1C-28,72,-45,65.8,-55.9,53.9C-66.8,42,-71.6,24.4,-72.1,7.3C-72.6,-9.9,-68.8,-26.7,-59.3,-38.8C-49.8,-51,-34.6,-58.6,-19.6,-65.8C-4.6,-73,10.2,-79.8,24.3,-77C38.4,-74.2,31.2,-71.1,43.5,-61.2Z" transform="translate(100 100)" /></svg>
      <div className="container-pv relative">
        {crumbs && <Breadcrumbs items={crumbs} />}
        <h1 className="anim-fade-up text-3xl md:text-5xl">{title}</h1>
        {subtitle && <p className="anim-fade-up mt-4 max-w-2xl text-lg text-pv-muted [animation-delay:100ms]">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  const all = [{ href: "/", label: "الرئيسية" }, ...items];
  return (
    <nav aria-label="مسار التنقل" className="mb-4 text-sm text-pv-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {all.map((c, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {c.href && i < all.length - 1 ? (
              <Link href={c.href} className="hover:text-pv-green">{c.label}</Link>
            ) : (
              <span aria-current="page" className="font-semibold text-pv-deep">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SectionHead({ eyebrow, title, desc, action }: { eyebrow?: string; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-3xl md:text-4xl">{title}</h2>
        {desc && <p className="mt-3 text-lg text-pv-muted">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ pill, title, desc, id }: { pill?: string; title: string; desc?: string; id?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      {pill && <span className="inline-block rounded-full bg-pv-yellow px-4 py-1 text-sm font-bold text-pv-deep">{pill}</span>}
      <h2 id={id} className="mt-3 text-3xl md:text-4xl">{title}</h2>
      <span aria-hidden className="mx-auto mt-3 block h-1.5 w-16 rounded-full bg-pv-yellow" />
      {desc && <p className="mt-3 text-pv-muted md:text-lg">{desc}</p>}
    </div>
  );
}

export function SampleBadge({ label = "بيانات تجريبية" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-pv-teal/50 bg-pv-teal/10 px-2.5 py-0.5 text-xs font-semibold text-[#0f6f7a]">
      <IconInfo size={13} /> {label}
    </span>
  );
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" | "ok" | "err" }) {
  const cls = {
    info: "bg-pv-teal/10 border-pv-teal/30 text-[#0f5d66]",
    warn: "bg-pv-pale/60 border-pv-yellow/60 text-pv-deep",
    ok: "bg-pv-green/10 border-pv-green/30 text-pv-deep",
    err: "bg-red-50 border-red-200 text-red-800",
  }[tone];
  return (
    <div role={tone === "err" ? "alert" : undefined} className={`flex gap-3 rounded-2xl border p-4 text-sm leading-relaxed ${cls}`}>
      <IconInfo size={18} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

type ServiceLite = { slug: string; name: string; short: string; imageUrl: string; imageAlt: string; isBookable: boolean };
export function ServiceCard({ s, priority = false }: { s: ServiceLite; priority?: boolean }) {
  return (
    <article className="card lift group flex flex-col overflow-hidden">
      <Link href={`/services/${s.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-pv-beige" tabIndex={-1} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.imageUrl} alt={s.imageAlt} loading={priority ? "eager" : "lazy"} width={900} height={675} className="zoom-img h-full w-full object-cover" />
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl">
          <Link href={`/services/${s.slug}`} className="hover:text-pv-green">{s.name}</Link>
        </h3>
        <p className="mt-2 flex-1 text-pv-muted leading-relaxed">{s.short}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {s.isBookable && <Link href={`/booking?service=${s.slug}`} className="btn btn-book btn-sm">احجز هذه الخدمة</Link>}
          <Link href={`/services/${s.slug}`} className="btn btn-ghost btn-sm group-hover:text-pv-green">
            اكتشف الخدمة <IconArrow size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function DoctorAvatar({ name, imageUrl, className = "" }: { name: string; imageUrl: string; className?: string }) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt={`صورة ${name}`} loading="lazy" className={`zoom-img h-full w-full object-cover ${className}`} />;
  }
  return (
    <div className={`relative grid h-full w-full place-items-center bg-gradient-to-br from-pv-beige to-pv-pale/70 ${className}`} role="img" aria-label="بانتظار الصورة الرسمية للطبيب">
      <svg viewBox="0 0 120 120" className="h-2/3 w-2/3 text-pv-green/30" aria-hidden><circle cx="60" cy="42" r="22" fill="currentColor" /><path d="M18 112c4-26 22-40 42-40s38 14 42 40" fill="currentColor" /></svg>
      <span className="absolute bottom-3 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-pv-muted">بانتظار الصورة الرسمية</span>
    </div>
  );
}

type DoctorLite = { slug: string; name: string; title: string; specialties: string[]; bio: string; imageUrl: string; isSample: boolean };
export function DoctorCard({ d }: { d: DoctorLite }) {
  return (
    <article className="lift flex h-full flex-col overflow-hidden rounded-[28px] bg-pv-deep shadow-[0_18px_45px_rgb(23_76_69/18%)]">
      <Link href={`/doctors/${d.slug}`} className="relative block px-5 pb-8 pt-6" aria-label={`الملف الشخصي — ${d.name}`}>
        <span aria-hidden className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
        <span aria-hidden className="absolute -bottom-14 -right-12 h-48 w-48 rounded-full bg-pv-teal/20" />
        {d.isSample && (
          <span className="absolute right-4 top-4 z-10 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-white/25">تجريبي</span>
        )}
        <span className="relative mx-auto block h-32 w-32 overflow-hidden sm:h-36 sm:w-36 rounded-full shadow-xl ring-4 ring-white/25">
          <DoctorAvatar name={d.name} imageUrl={d.imageUrl} />
        </span>
      </Link>
      <div className="relative -mt-5 flex flex-1 flex-col rounded-t-[28px] bg-white px-5 pb-6 pt-6 text-center">
        <h3 className="text-lg font-extrabold text-pv-deep"><Link href={`/doctors/${d.slug}`} className="hover:text-pv-green">{d.name}</Link></h3>
        <p className="mt-1 text-sm font-semibold text-pv-teal">{d.title}</p>
        {d.specialties.length > 0 && (
          <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
            {d.specialties.slice(0, 2).map((sp) => (
              <span key={sp} className="rounded-full bg-pv-cream px-2.5 py-0.5 text-xs font-semibold text-pv-deep ring-1 ring-pv-border">{sp}</span>
            ))}
          </div>
        )}
        <Link href={`/doctors/${d.slug}`} className="mt-2.5 inline-flex items-center justify-center gap-1 text-sm font-bold text-pv-teal transition-colors hover:text-pv-green">
          عرض الملف الشخصي <IconChevron size={18} />
        </Link>
        <Link href={`/booking?doctor=${d.slug}`} className="btn btn-book btn-sm mt-4 w-full">احجز مع الطبيب</Link>
      </div>
    </article>
  );
}

export function HoursTable({ branch, compact = false }: { branch: BranchWithHours; compact?: boolean }) {
  const todayWd = nowInTz(branch.timezone).weekday;
  const period = (openMin: number) => (openMin < 720 ? "الفترة الصباحية" : openMin < 1020 ? "الفترة الظهرية" : "الفترة المسائية");
  return (
    <div>
      <table className="w-full text-right">
        <caption className="sr-only">ساعات عمل {branch.name}</caption>
        {!compact && (
          <thead>
            <tr className="text-sm text-pv-muted">
              <th scope="col" className="rounded-r-xl bg-pv-cream/70 p-3 font-semibold">اليوم</th>
              <th scope="col" className="rounded-l-xl bg-pv-cream/70 p-3 font-semibold">ساعات العمل</th>
            </tr>
          </thead>
        )}
        <tbody>
          {WEEKDAYS.map((day, wd) => {
            const rows = branch.hours.filter((h) => h.weekday === wd);
            const today = wd === todayWd;
            return (
              <tr key={wd} className={`border-t border-pv-border/70 ${today && !compact ? "bg-pv-pale/50" : ""}`}>
                <th scope="row" className={`py-3 ${compact ? "text-sm text-white/90" : "text-pv-deep"}`}>
                  <span className="inline-flex items-center gap-2 font-bold">
                    {day}
                    {today && (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${compact ? "bg-pv-yellow text-pv-deep" : "bg-pv-green text-white"}`}>
                        اليوم
                      </span>
                    )}
                  </span>
                </th>
                <td className="py-3">
                  {rows.length === 0 ? (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold ${compact ? "bg-white/10 text-white/60" : "bg-stone-100 text-stone-500"}`}>
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-60" /> مغلق
                    </span>
                  ) : (
                    <span className="flex flex-wrap gap-2">
                      {rows.map((r, i) => (
                        <span key={i} className="inline-flex flex-col items-start gap-1">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold ring-1 ${compact ? "bg-white/10 text-white ring-white/20" : "bg-white text-pv-deep ring-pv-border"}`}>
                            <IconClock size={14} className={compact ? "text-pv-yellow" : "text-pv-green"} />
                            {minToTime(r.openMin)} – {minToTime(r.closeMin)}
                          </span>
                          {rows.length > 1 && <span className={`pr-1 text-[11px] ${compact ? "text-white/60" : "text-pv-muted"}`}>{period(r.openMin)}</span>}
                        </span>
                      ))}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!compact && branch.exceptions.length > 0 && (
        <div className="mt-5 rounded-2xl bg-pv-pale/50 p-4 ring-1 ring-pv-yellow/40">
          <p className="mb-2 font-bold text-pv-deep">ساعات خاصة قادمة</p>
          <ul className="space-y-1.5 text-sm">
            {branch.exceptions.map((e) => (
              <li key={e.id} className="flex items-center gap-2">
                <IconClock size={15} className="shrink-0 text-pv-green" />
                <span>{formatDateAr(e.date)}: {e.closed ? "مغلق" : `${minToTime(e.openMin ?? 0)} – ${minToTime(e.closeMin ?? 0)}`} {e.note && `— ${e.note}`}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
