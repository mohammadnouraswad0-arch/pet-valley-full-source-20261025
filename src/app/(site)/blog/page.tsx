import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { Reveal } from "@/components/client-ui";

export const metadata: Metadata = { title: "المدونة", description: "نصائح توعوية عامة لرعاية الحيوانات الأليفة.", alternates: { canonical: "/blog" } };

export default async function BlogPage() {
  const posts = await getPosts();
  return (
    <>
      <PageHeader title="المدونة" subtitle="محتوى توعوي عام يساعدك على رعاية يومية أفضل، ولا يغني عن استشارة الطبيب." crumbs={[{ label: "المدونة" }]} />
      <section className="container-pv grid gap-6 py-16 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 80}>
            <article className="card lift h-full overflow-hidden">
              <Link href={`/blog/${p.slug}`} className="block aspect-[16/10] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl} alt={p.imageAlt} loading="lazy" className="zoom-img h-full w-full object-cover" />
              </Link>
              <div className="p-6">
                <p className="text-sm font-semibold text-pv-teal">{p.category}</p>
                <h2 className="mt-1 text-xl"><Link href={`/blog/${p.slug}`} className="hover:text-pv-green">{p.title}</Link></h2>
                <p className="mt-2 text-pv-muted">{p.excerpt}</p>
                <Link href={`/blog/${p.slug}`} className="link-pv mt-4 inline-block text-sm">اقرأ المقال</Link>
              </div>
            </article>
          </Reveal>
        ))}
      </section>
    </>
  );
}
