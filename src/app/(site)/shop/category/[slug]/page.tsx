import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories } from "@/lib/data";
import { getSettings } from "@/lib/settings";
import { Catalog, ShopBar, type SP } from "@/components/shop";
import { Breadcrumbs } from "@/components/ui";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<SP> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const c = (await getCategories()).find((x) => x.slug === slug);
  return c ? { title: `${c.name} — المتجر`, description: c.description, alternates: { canonical: `/shop/category/${slug}` } } : { title: "غير موجود" };
}

export default async function CategoryPage({ params, searchParams }: P) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const [cats, s] = await Promise.all([getCategories(), getSettings()]);
  const c = cats.find((x) => x.slug === slug);
  if (!c) notFound();
  return (
    <>
      <div className="pt-[120px]"><ShopBar message={s.shopBarMessage} /></div>
      <section className="container-pv pt-8">
        <div className="relative overflow-hidden rounded-[32px] bg-pv-deep">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.imageUrl} alt="" className="anim-fade-in absolute inset-y-0 left-0 h-full w-full object-cover opacity-60 md:w-2/3 md:opacity-100 md:[mask-image:linear-gradient(to_left,transparent,black_40%)]" />
          <div className="relative p-8 md:p-12 md:max-w-lg">
            <div className="[&_*]:text-white/85!"><Breadcrumbs items={[{ href: "/shop", label: "المتجر" }, { label: c.name }]} /></div>
            <h1 className="text-4xl text-white!">{c.name}</h1>
            <p className="mt-3 text-white/85">{c.description}</p>
          </div>
        </div>
      </section>
      <Catalog sp={sp} basePath={`/shop/category/${slug}`} fixedCategory={slug} currency={s.currency} />
    </>
  );
}
