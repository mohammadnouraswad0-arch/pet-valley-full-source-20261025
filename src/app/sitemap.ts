import type { MetadataRoute } from "next";
import { getCategories, getDoctors, getPosts, getServices, searchProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const statics = ["", "/about", "/services", "/doctors", "/shop", "/booking", "/branches", "/blog", "/faq", "/contact", "/privacy-policy", "/terms", "/shipping-returns"];
  const [svc, docs, cats, prods, posts] = await Promise.all([getServices(), getDoctors(), getCategories(), searchProducts({ pageSize: 1000 }), getPosts()]);
  return [
    ...statics.map((p) => ({ url: `${site}${p}` })),
    ...svc.map((s) => ({ url: `${site}/services/${s.slug}` })),
    ...docs.map((d) => ({ url: `${site}/doctors/${d.slug}` })),
    ...cats.map((c) => ({ url: `${site}/shop/category/${c.slug}` })),
    ...prods.items.map((p) => ({ url: `${site}/shop/${p.slug}` })),
    ...posts.map((p) => ({ url: `${site}/blog/${p.slug}` })),
  ];
}
