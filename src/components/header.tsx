"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./cart";
import { IconBag, IconCalendar, IconClock, IconClose, IconMenu, IconPin, IconStore, IconPhone, Logo } from "./icons";

const NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/about", label: "من نحن" },
  { href: "/services", label: "الخدمات" },
  { href: "/doctors", label: "الأطباء" },
  { href: "/shop", label: "المتجر" },
  { href: "/blog", label: "المدونة" },
  { href: "/contact", label: "تواصل معنا" },
];

export function Header({ topbarMessage, whatsapp, previewNotice }: { topbarMessage: string; whatsapp: string; previewNotice: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [drawerQ, setDrawerQ] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const { count, ready } = useCart();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open ]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-[1200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        تخطَّ إلى المحتوى
      </a>
      <header
        data-scrolled={scrolled}
        className={`fixed inset-x-0 top-0 z-[1000] transition-[background-color,box-shadow,border-color,backdrop-filter] duration-300 border-b ${
          scrolled ? "bg-pv-cream/95 backdrop-blur-md shadow-[0_4px_18px_rgb(23_76_69/7%)] border-pv-border" : "bg-transparent border-transparent"
        }`}
      >
        {/* Top info bar — collapses on scroll */}
        <div className={`overflow-hidden transition-[max-height,opacity] duration-300 ${scrolled ? "max-h-0 opacity-0" : "max-h-12 opacity-100"}`}>
          <div className="bg-pv-deep/90 text-[13px] text-white/90">
            <div className="container-pv flex h-9 items-center justify-between gap-4">
              <div className="flex items-center gap-5 truncate">
                <Link href="/#hours" className="hidden items-center gap-1.5 hover:text-pv-yellow sm:flex"><IconClock size={15} /> ساعات العمل</Link>
                <Link href="/branches" className="hidden items-center gap-1.5 hover:text-pv-yellow md:flex"><IconPin size={15} /> الفروع</Link>
                <span className="truncate">{previewNotice ? <span className="text-pv-pale">{topbarMessage}</span> : topbarMessage}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {whatsapp && (
                  <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="flex items-center gap-1.5 hover:text-pv-yellow">
                    <IconPhone size={15} /> واتساب
                  </a>
                )}
                <Link href="/account" className="hover:text-pv-yellow">تتبع الطلب أو الحجز</Link>
              </div>
            </div>
          </div>
        </div>

        <div className={`container-pv flex items-center justify-between gap-4 transition-[height] duration-300 ${scrolled ? "h-[68px]" : "h-[84px]"}`}>
          <Link href="/" className="shrink-0" aria-label="الصفحة الرئيسية">
            <Logo />
          </Link>

          <nav aria-label="القائمة الرئيسية" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={isActive(n.href) ? "page" : undefined}
                    className={`relative rounded-lg px-3 py-2 text-[15px] font-semibold transition-colors hover:text-pv-green ${
                      isActive(n.href) ? "text-pv-green after:absolute after:inset-x-3 after:-bottom-0.5 after:h-[3px] after:rounded-full after:bg-pv-yellow" : "text-pv-deep"
                    }`}
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/cart" className="relative grid h-11 w-11 place-items-center rounded-full bg-white text-pv-deep shadow-sm ring-1 ring-pv-border transition hover:ring-pv-yellow" aria-label={`السلة (${count} منتجات)`}>
              <IconBag size={20} />
              {ready && count > 0 && (
                <span key={count} className="toast absolute -top-1 -left-1 grid h-5 min-w-5 place-items-center rounded-full bg-pv-deep px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
            <Link href="/shop" className="grid h-11 w-11 place-items-center rounded-full bg-white text-pv-deep shadow-sm ring-1 ring-pv-border transition hover:ring-pv-yellow" aria-label="المتجر">
              <IconStore size={20} />
            </Link>
            <Link href="/booking" aria-label="احجز موعدًا" title="احجز موعدًا" className="grid h-11 w-11 place-items-center rounded-full bg-pv-deep text-white shadow-md transition hover:bg-pv-green">
              <IconCalendar size={20} />
            </Link>
            <button onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center rounded-full bg-white text-pv-deep shadow-sm ring-1 ring-pv-border transition hover:ring-pv-yellow lg:hidden" aria-label="فتح القائمة" aria-expanded={open}>
              <IconMenu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-[1100] lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-pv-deep/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="القائمة"
          className={`absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-pv-cream shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between border-b border-pv-border p-4">
            <Logo />
            <button onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-full bg-white text-pv-deep ring-1 ring-pv-border" aria-label="إغلاق القائمة" tabIndex={open ? 0 : -1}>
              <IconClose />
            </button>
          </div>
          <form
            role="search"
            className="flex gap-2 border-b border-pv-border p-4"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/shop?q=${encodeURIComponent(drawerQ.trim())}`);
            }}
          >
            <input value={drawerQ} onChange={(e) => setDrawerQ(e.target.value)} className="input" placeholder="ابحث في المتجر…" aria-label="ابحث في المتجر" tabIndex={open ? 0 : -1} />
            <button className="btn btn-secondary shrink-0" tabIndex={open ? 0 : -1}>بحث</button>
          </form>
          <nav className="flex-1 overflow-y-auto p-4" aria-label="قائمة الجوال">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                tabIndex={open ? 0 : -1}
                className={`block rounded-xl px-4 py-3.5 text-lg font-semibold ${isActive(n.href) ? "bg-white text-pv-green" : "text-pv-deep"}`}
              >
                {n.label}
              </Link>
            ))}
            <Link href="/branches" tabIndex={open ? 0 : -1} className="block rounded-xl px-4 py-3.5 text-lg font-semibold text-pv-deep">الفروع</Link>
            <Link href="/account" tabIndex={open ? 0 : -1} className="block rounded-xl px-4 py-3.5 text-lg font-semibold text-pv-deep">تتبع الطلب أو الحجز</Link>
          </nav>
          <div className="space-y-2 border-t border-pv-border p-4">
            <Link href="/booking" tabIndex={open ? 0 : -1} className="btn btn-book w-full">احجز موعدًا</Link>
            <Link href="/shop" tabIndex={open ? 0 : -1} className="btn btn-outline w-full">تسوق الآن</Link>
          </div>
        </aside>
      </div>
    </>
  );
}
