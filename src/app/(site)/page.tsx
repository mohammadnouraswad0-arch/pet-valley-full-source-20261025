import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getApprovedTestimonials, getBranches, getDoctors, getServices, searchProducts } from "@/lib/data";
import { DoctorCard, HoursTable, SectionTitle, ServiceCard } from "@/components/ui";
import { OpenNow, ProductCard, Reveal } from "@/components/client-ui";
import { Testimonials } from "@/components/testimonials";
import { IconArrow, IconBag, IconCalendar, IconCheck, IconClock, IconPaw, IconShield, IconStetho } from "@/components/icons";

export default async function Home() {
  const [s, services, branches, doctors, featured, approvedTestimonials] = await Promise.all([
    getSettings(),
    getServices(),
    getBranches(),
    getDoctors(),
    searchProducts({ featured: true, pageSize: 4 }),
    getApprovedTestimonials(),
  ]);
  const branch = branches[0];
  const bookable = services.filter((x) => x.isBookable);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VeterinaryCare",
    name: "Samaya Taiba Vet Clinic — عيادة سامايا طيبة البيطرية",
    sameAs: [s.instagram].filter(Boolean),
    ...(s.phone ? { telephone: s.phone } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ١ — الرئيسية */}
      <section aria-labelledby="hero-title" className="relative isolate overflow-hidden rounded-b-[2.5rem] bg-pv-cream">
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.heroImage} alt={s.heroImageAlt} fetchPriority="high" width={1800} height={1200} className="anim-kenburns h-full w-full object-cover object-center" />
        </div>
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-pv-cream via-pv-cream/55 to-pv-cream/10 md:bg-gradient-to-l md:from-pv-cream md:via-pv-cream/85 md:to-pv-cream/5" />
        <div className="container-pv flex min-h-[min(800px,94svh)] items-center pb-24 pt-40 md:pb-28">
          <div className="max-w-xl">
            <p className="eyebrow anim-fade-up">{s.heroEyebrow}</p>
            <h1 id="hero-title" className="anim-fade-up mt-4 text-4xl leading-[1.35] [animation-delay:80ms] sm:text-5xl lg:text-[3.4rem]">
              {s.heroTitle}
            </h1>
            <p className="anim-fade-up mt-5 max-w-lg text-lg leading-relaxed text-pv-text/85 [animation-delay:160ms]">{s.heroSubtitle}</p>
            <div className="anim-fade-up mt-8 flex flex-wrap gap-3 [animation-delay:240ms]">
              <Link href="/booking" className="btn btn-book"><IconCalendar size={20} /> احجز موعدًا</Link>
              <Link href="/shop" className="btn btn-shop"><IconBag size={20} /> تسوق الآن</Link>
              <Link href="/services" className="btn btn-outline">خدماتنا</Link>
            </div>
            {branch && (
              <Link href="/#hours" className="anim-fade-up mt-5 inline-flex items-center gap-2 rounded-full bg-white/85 py-1.5 pl-4 pr-1.5 text-sm font-bold text-pv-deep shadow-sm ring-1 ring-pv-border backdrop-blur [animation-delay:320ms] hover:ring-pv-yellow">
                <OpenNow tz={branch.timezone} hours={branch.hours} exceptions={branch.exceptions} />
                <span>ساعات اليوم — {branch.name}</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* شريط الثقة */}
      <section aria-label="لماذا سامايا طيبة" className="container-pv relative z-10 -mt-10">
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-pv-border shadow-[0_20px_50px_rgb(23_76_69/8%)] lg:grid-cols-4">
          {[
            [IconCalendar, "حجز إلكتروني حقيقي", "أوقات متاحة تُحسب فعليًا"],
            [IconStetho, "رعاية بيطرية متكاملة", "كشف ووقاية وعناية"],
            [IconBag, "متجر في مكان واحد", "تغذية وعناية وإكسسوارات"],
            [IconShield, "أسعار ومخزون واضح", "تتحقق من الخادم عند الطلب"],
          ].map(([I, t, d], i) => {
            const Icon = I as typeof IconPaw;
            return (
              <li key={i} className="flex items-center gap-3 bg-white p-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-pv-pale text-pv-deep"><Icon /></span>
                <span><span className="block font-bold text-pv-deep">{t as string}</span><span className="block text-xs text-pv-muted">{d as string}</span></span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ٢ — من نحن وماذا نقدم */}
      <section className="container-pv grid items-center gap-12 py-20 lg:grid-cols-2" aria-labelledby="about-title">
        <Reveal>
          <div className="grid grid-cols-2 gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.pexels.com/photos/7468978/pexels-photo-7468978.jpeg?auto=compress&cs=tinysrgb&w=800" alt="طبيب بيطري يفحص كلبًا داخل العيادة" loading="lazy" className="aspect-[3/4] w-full rounded-[28px] object-cover" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.pexels.com/photos/33394308/pexels-photo-33394308.jpeg?auto=compress&cs=tinysrgb&w=800" alt="طبيب بيطري يزن قطة صغيرة" loading="lazy" className="mt-12 aspect-[3/4] w-full rounded-[28px] object-cover" />
          </div>
        </Reveal>
        <Reveal delay={100}>
          <p className="eyebrow">من نحن</p>
          <h2 id="about-title" className="mt-2 text-3xl md:text-4xl">من نحن وماذا نقدم</h2>
          <p className="mt-5 text-lg leading-loose text-pv-text/85">
            عيادة سامايا طيبة البيطرية تجمع لك الرعاية البيطرية والحجز الإلكتروني ومتجر المستلزمات في مكان واحد — لتجد ما يحتاجه حيوانك دون عناء.
          </p>
          <ul className="mt-6 space-y-3">
            {["خدمات بيطرية أساسية: كشف، تطعيمات، فحوصات وعناية", "حجز إلكتروني بأوقات متاحة تُحسب فعليًا", "متجر مستلزمات بأسعار ومخزون واضح"].map((f) => (
              <li key={f} className="flex items-center gap-3 font-semibold text-pv-deep">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pv-green text-white"><IconCheck size={16} /></span>
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/about" className="btn btn-outline">تعرف علينا أكثر</Link>
            <Link href="/booking" className="btn btn-book">احجز موعدًا</Link>
          </div>
        </Reveal>
      </section>

      {/* ٣ — ما هي خدماتنا */}
      <section className="bg-white py-20" aria-labelledby="services-title">
        <div className="container-pv">
          <SectionTitle id="services-title" pill="خدماتنا" title="ما هي خدماتنا" desc="اختر الخدمة لمعرفة تفاصيلها، أو احجزها مباشرة في الأوقات المتاحة." />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bookable.map((sv, i) => (
              <Reveal key={sv.id} delay={(i % 3) * 80} className="h-full"><ServiceCard s={sv} /></Reveal>
            ))}
            <Reveal delay={160} className="h-full">
              <div className="flex h-full flex-col justify-between rounded-[20px] bg-pv-green p-8 text-white">
                <div>
                  <IconPaw size={40} className="text-pv-yellow" />
                  <h3 className="mt-4 text-2xl text-white!">لست متأكدًا من الخدمة المناسبة؟</h3>
                  <p className="mt-3 text-white/80">ابدأ بموعد كشف عام، وسيرشدك الطبيب إلى الخطوات التالية.</p>
                </div>
                <Link href="/booking?service=checkup" className="btn btn-book mt-6 self-start">احجز كشفًا عامًا</Link>
              </div>
            </Reveal>
          </div>
          <div className="mt-10 text-center">
            <Link href="/services" className="btn btn-secondary">جميع الخدمات <IconArrow size={18} /></Link>
          </div>
        </div>
      </section>

      {/* ٤ — احجز لخدمتك الآن */}
      <section className="container-pv py-20" aria-labelledby="booknow-title">
        <div className="overflow-hidden rounded-[32px] bg-pv-deep p-8 text-center text-white md:p-12">
          <p className="font-bold text-pv-yellow">الحجز الإلكتروني</p>
          <h2 id="booknow-title" className="mx-auto mt-2 max-w-xl text-3xl text-white! md:text-4xl">احجز لخدمتك الآن</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/75">اختر الخدمة والوقت المتاح فعليًا حسب ساعات العمل وجداول الأطباء — وسيصلك رقم مرجعي لمتابعة طلبك.</p>
          <ol className="mx-auto mt-8 flex max-w-2xl flex-col items-center justify-center gap-3 sm:flex-row">
            {[["1", "اختر الخدمة"], ["2", "اختر الوقت المتاح"], ["3", "أرسل الطلب"]].map(([n, t]) => (
              <li key={n} className="flex items-center gap-2 rounded-full bg-white/5 px-5 py-2.5 ring-1 ring-white/15">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-pv-yellow text-sm font-extrabold text-pv-deep">{n}</span>
                <span className="font-semibold">{t}</span>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/booking" className="btn btn-book">احجز الآن</Link>
            <Link href="/services" className="btn bg-white text-pv-deep hover:bg-pv-pale">تصفح الخدمات</Link>
          </div>
        </div>
      </section>

      {/* ٥ — المتجر */}
      <section className="container-pv pb-20" aria-labelledby="store-title">
        <SectionTitle id="store-title" pill="المتجر" title="تسوق لصديقك الأليف" desc="منتجات مختارة للعناية والتغذية — بأسعار ومخزون حقيقي." />
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:gap-5">
          {featured.items.slice(0, 4).map((p) => <ProductCard key={p.id} p={p} currency={s.currency} />)}
        </div>
        <div className="mt-10 text-center">
          <Link href="/shop" className="btn btn-shop"><IconBag size={20} /> تصفح المتجر</Link>
        </div>
      </section>

      {/* ٦ — الأطباء */}
      {doctors.length > 0 && (
        <section className="bg-pv-beige/40 py-20" aria-labelledby="doctors-title">
          <div className="container-pv">
            <SectionTitle id="doctors-title" pill="فريقنا" title="أطباؤنا" desc="اختر الطبيب لتصفح ملفه الشخصي، أو احجز معه مباشرة." />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {doctors.slice(0, 4).map((d, i) => (
                <Reveal key={d.id} delay={i * 80} className="h-full"><DoctorCard d={d} /></Reveal>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href="/doctors" className="btn btn-outline">جميع الأطباء</Link>
            </div>
          </div>
        </section>
      )}

      {/* ٧ — آراء العملاء عنا */}
      <section className="container-pv py-20" aria-labelledby="reviews-title">
        <SectionTitle id="reviews-title" pill="آراء العملاء" title="آراء العملاء عنا" desc="تجارب حقيقية يشاركها عملاؤنا — تُنشر بعد مراجعة الإدارة." />
        <Testimonials items={approvedTestimonials.map(({ id, name, petName, rating, text }) => ({ id, name, petName, rating, text }))} />
      </section>

      {/* ٨ — جدول الدوام */}
      {branch && (
        <section id="hours" className="bg-white py-20" aria-labelledby="hours-title">
          <div className="container-pv grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <p className="eyebrow mb-2">ساعات العمل</p>
              <h2 id="hours-title" className="text-3xl md:text-4xl">جدول الدوام</h2>
              <p className="mt-3 text-lg text-pv-muted">اطّلع على مواعيد الدوام قبل زيارتك، أو احجز موعدك مباشرة في الأوقات المتاحة.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/booking" className="btn btn-book">احجز موعدًا</Link>
                <Link href="/branches" className="btn btn-outline">تفاصيل الفرع</Link>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="card p-6 shadow-[0_20px_50px_rgb(23_76_69/8%)] md:p-8">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-xl"><IconClock className="text-pv-green" /> {branch.name}</h3>
                  <OpenNow tz={branch.timezone} hours={branch.hours} exceptions={branch.exceptions} />
                </div>
                <HoursTable branch={branch} />
                {!branch.hoursVerified && (
                  <p className="mt-4 rounded-xl bg-pv-pale/60 p-3 text-sm text-pv-deep">ساعات تجريبية لأغراض التطوير — تُحدَّث من لوحة الإدارة بعد اعتماد العيادة.</p>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ٩ — احجز الآن / تسوق */}
      <section className="container-pv py-20" aria-labelledby="cta-title">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-l from-pv-green to-pv-deep p-10 text-center text-white md:p-14">
          <IconPaw size={160} className="pointer-events-none absolute -left-8 -top-8 rotate-12 text-white/10" />
          <IconPaw size={120} className="pointer-events-none absolute -bottom-6 right-10 -rotate-12 text-white/10" />
          <h2 id="cta-title" className="relative text-3xl text-white! md:text-4xl">حيوانك يستحق الأفضل — ابدأ الآن</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/80">احجز موعدك في دقائق، أو تسوق مستلزمات حيوانك من متجرنا.</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/booking" className="btn btn-book"><IconCalendar size={20} /> احجز الآن</Link>
            <Link href="/shop" className="btn bg-white text-pv-deep hover:bg-pv-pale"><IconBag size={20} /> تسوق الآن</Link>
          </div>
        </div>
      </section>
    </>
  );
}
