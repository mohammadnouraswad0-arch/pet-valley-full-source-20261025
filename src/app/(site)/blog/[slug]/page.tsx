import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost } from "@/lib/data";
import { Breadcrumbs, Notice } from "@/components/ui";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getPost((await params).slug);
  return p ? { title: p.title, description: p.excerpt, alternates: { canonical: `/blog/${p.slug}` }, openGraph: { type: "article", images: [p.imageUrl] } } : { title: "غير موجود" };
}

export default async function PostPage({ params }: P) {
  const p = await getPost((await params).slug);
  if (!p) notFound();
  return (
    <article>
      <header className="bg-pv-beige/60 pt-40 pb-12">
        <div className="container-pv max-w-3xl">
          <Breadcrumbs items={[{ href: "/blog", label: "المدونة" }, { label: p.title }]} />
          <p className="font-semibold text-pv-teal">{p.category}</p>
          <h1 className="mt-2 text-3xl md:text-5xl">{p.title}</h1>
          <p className="mt-4 text-lg text-pv-muted">{p.excerpt}</p>
        </div>
      </header>
      <div className="container-pv max-w-3xl py-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.imageUrl.replace("w=900", "w=1400")} alt={p.imageAlt} className="aspect-[16/9] w-full rounded-[28px] object-cover" />
        <div className="mt-10 space-y-5 text-lg leading-loose">
          {p.content.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}
        </div>
        <div className="mt-10"><Notice>هذا المحتوى توعوي عام ولا يقدم تشخيصًا أو علاجًا. استشر الطبيب البيطري بشأن حالة حيوانك.</Notice></div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/booking" className="btn btn-book">احجز موعدًا</Link>
          <Link href="/blog" className="btn btn-outline">مقالات أخرى</Link>
        </div>
      </div>
    </article>
  );
}
