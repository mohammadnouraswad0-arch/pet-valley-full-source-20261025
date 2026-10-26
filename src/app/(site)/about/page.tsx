import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { Reveal } from "@/components/client-ui";
import { IconHeart, IconShield, IconStetho } from "@/components/icons";

export const metadata: Metadata = { title: "من نحن", description: "تعرف على عيادة سامايا طيبة البيطرية وقيمها في رعاية الحيوانات الأليفة.", alternates: { canonical: "/about" } };

export default function AboutPage() {
  return (
    <>
      <PageHeader title="من نحن" subtitle="عيادة سامايا طيبة البيطرية — رعاية بيطرية ومتجر لمستلزمات الحيوانات الأليفة تحت سقف واحد." crumbs={[{ label: "من نحن" }]} />
      <section className="container-pv grid items-center gap-12 py-16 lg:grid-cols-2">
        <Reveal>
          <div className="grid grid-cols-2 gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.pexels.com/photos/7468978/pexels-photo-7468978.jpeg?auto=compress&cs=tinysrgb&w=800" alt="طبيب بيطري يفحص كلبًا داخل العيادة" loading="lazy" className="aspect-[3/4] w-full rounded-[28px] object-cover" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.pexels.com/photos/33394308/pexels-photo-33394308.jpeg?auto=compress&cs=tinysrgb&w=800" alt="طبيب بيطري يزن قطة صغيرة" loading="lazy" className="mt-12 aspect-[3/4] w-full rounded-[28px] object-cover" />
          </div>
        </Reveal>
        <Reveal delay={100}>
          <p className="eyebrow">قصتنا</p>
          <h2 className="mt-2 text-3xl md:text-4xl">رعاية تبدأ من فهم حيوانك</h2>
          <p className="mt-5 text-lg leading-loose text-pv-text/85">
            نؤمن في سامايا طيبة بأن كل زيارة للعيادة يجب أن تكون تجربة هادئة وواضحة لك ولحيوانك. لذلك جمعنا الخدمات البيطرية الأساسية والحجز الإلكتروني ومتجر المستلزمات في مكان واحد، لتجد ما تحتاجه دون عناء.
          </p>
          <p className="mt-4 text-sm text-pv-muted">* تُستكمل قصة العيادة وتاريخها وأرقامها الرسمية بعد اعتماد المحتوى من الإدارة.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/booking" className="btn btn-book">احجز موعدًا</Link>
            <Link href="/doctors" className="btn btn-outline">تعرف على الفريق</Link>
          </div>
        </Reveal>
      </section>
      <section className="bg-pv-beige/50 py-16">
        <div className="container-pv grid gap-6 md:grid-cols-3">
          {[
            [IconHeart, "الرفق أولًا", "نتعامل مع كل حيوان بهدوء وصبر، ونحترم مخاوفه."],
            [IconStetho, "وضوح طبي", "نشرح لك كل خطوة وسببها بلغة مفهومة."],
            [IconShield, "ثقة وشفافية", "لا ننشر معلومات أو وعودًا غير مؤكدة."],
          ].map(([I, t, d], i) => {
            const Icon = I as typeof IconHeart;
            return (
              <Reveal key={i} delay={i * 80}>
                <div className="card h-full p-8">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-pv-yellow text-pv-deep"><Icon size={28} /></span>
                  <h3 className="mt-5 text-xl">{t as string}</h3>
                  <p className="mt-2 text-pv-muted">{d as string}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
    </>
  );
}
