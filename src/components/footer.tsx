import Link from "next/link";
import { IconInstagram, IconPhone, IconPin, Logo } from "./icons";
import { HoursTable } from "./ui";
import { NewsletterForm, OpenNow } from "./client-ui";
import type { BranchWithHours } from "@/lib/data";
import type { SiteSettings } from "@/lib/settings-defaults";

export function Footer({ s, branch }: { s: SiteSettings; branch: BranchWithHours | undefined }) {
  const cols = [
    { title: "العيادة", links: [["/about", "من نحن"], ["/services", "الخدمات"], ["/doctors", "الأطباء"], ["/branches", "الفروع"], ["/booking", "احجز موعدًا"]] },
    { title: "المتجر", links: [["/shop", "جميع المنتجات"], ["/shop/category/cat-food", "طعام القطط"], ["/shop/category/dog-food", "طعام الكلاب"], ["/shop/category/grooming", "العناية والنظافة"], ["/cart", "السلة"]] },
    { title: "المساعدة", links: [["/faq", "الأسئلة الشائعة"], ["/contact", "تواصل معنا"], ["/account", "تتبع الطلب أو الحجز"], ["/shipping-returns", "الشحن والاسترجاع"], ["/privacy-policy", "سياسة الخصوصية"], ["/terms", "الشروط والأحكام"]] },
  ];
  return (
    <footer className="relative mt-24 bg-pv-deep text-white">
      <svg aria-hidden viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute -top-[59px] h-[60px] w-full text-pv-deep"><path fill="currentColor" d="M0 60V30C240 0 480 0 720 22s480 30 720 0v38Z" /></svg>
      <div className="container-pv pt-14">
        <div className="rounded-[28px] bg-white/5 p-8 text-center ring-1 ring-white/10 md:p-10">
          <h2 className="text-2xl text-white!">نشرتنا البريدية</h2>
          <p className="mt-2 text-sm text-white/70">اشترك ليصلك جديد المقالات والنصائح والعروض الحقيقية.</p>
          <NewsletterForm />
        </div>
      </div>
      <div className="container-pv grid gap-12 py-16 lg:grid-cols-[1.2fr_2fr_1.3fr]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-sm leading-relaxed text-white/75">عيادة بيت فالي البيطرية — رعاية بيطرية ومتجر لمستلزمات الحيوانات الأليفة في مكان واحد.</p>
          <div className="mt-6 space-y-3 text-sm text-white/80">
            {branch?.address && <p className="flex items-start gap-2"><IconPin size={18} className="shrink-0 text-pv-yellow" /> {branch.address}</p>}
            {s.phone && <a href={`tel:${s.phone}`} className="ltr flex items-center gap-2 hover:text-pv-yellow"><IconPhone size={18} className="text-pv-yellow" /> {s.phone}</a>}
            {s.instagram && (
              <a href={s.instagram} target="_blank" rel="noopener" className="flex items-center gap-2 hover:text-pv-yellow">
                <IconInstagram size={18} className="text-pv-yellow" /> <span className="ltr">@pet.valley.clinic</span>
              </a>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {cols.map((c) => (
            <div key={c.title}>
              <h3 className="mb-4 text-base font-bold text-pv-yellow">{c.title}</h3>
              <ul className="space-y-2.5 text-sm text-white/80">
                {c.links.map(([href, label]) => (
                  <li key={href}><Link href={href} className="hover:text-white hover:underline underline-offset-4">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {branch && (
          <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-pv-yellow">ساعات العمل</h3>
              <OpenNow tz={branch.timezone} hours={branch.hours} exceptions={branch.exceptions} light />
            </div>
            <HoursTable branch={branch} compact />
            {!branch.hoursVerified && <p className="mt-3 text-xs text-pv-pale/80">* ساعات تجريبية بانتظار اعتماد الإدارة.</p>}
          </div>
        )}
      </div>
      <div className="border-t border-white/10">
        <div className="container-pv flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/60 sm:flex-row">
          <p>© {new Date().getFullYear()} Pet Valley Vet Clinic — عيادة بيت فالي البيطرية</p>
          <p>الصور الفوتوغرافية من Pexels بترخيص يسمح بالاستخدام التجاري، وتُستبدل بالصور الرسمية للعيادة.</p>
        </div>
      </div>
    </footer>
  );
}
