import "server-only";
import { and, asc, desc, eq, gt, gte, ilike, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  branches,
  branchHours,
  brands,
  categories,
  doctorHours,
  doctors,
  doctorServices,
  hourExceptions,
  posts,
  products,
  reviews,
  services,
  testimonials,
} from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { nowInTz } from "./hours";

export type ProductDTO = {
  id: number;
  slug: string;
  name: string;
  price: number;
  compareAt: number | null;
  stock: number;
  imageUrl: string;
  imageAlt: string;
  size: string;
  categoryName: string | null;
  categorySlug: string | null;
  brandName: string | null;
  isSample: boolean;
  ratingAvg: number;
  ratingCount: number;
};

const productSelect = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  price: products.price,
  compareAtPrice: products.compareAtPrice,
  saleEndsAt: products.saleEndsAt,
  stock: products.stock,
  imageUrl: products.imageUrl,
  imageAlt: products.imageAlt,
  size: products.size,
  isSample: products.isSample,
  categoryName: categories.name,
  categorySlug: categories.slug,
  brandName: brands.name,
};

type RawProduct = {
  compareAtPrice: number | null;
  saleEndsAt: Date | null;
} & Omit<ProductDTO, "compareAt" | "ratingAvg" | "ratingCount">;

export function toDTO(p: RawProduct): ProductDTO {
  const saleValid = p.compareAtPrice && (!p.saleEndsAt || p.saleEndsAt > new Date());
  const { compareAtPrice: _c, saleEndsAt: _s, ...rest } = p;
  void _c;
  void _s;
  return { ...rest, compareAt: saleValid ? p.compareAtPrice : null, ratingAvg: 0, ratingCount: 0 };
}

/** Real aggregate ratings from approved reviews only. Products without reviews show no stars. */
export async function attachRatings(items: ProductDTO[]): Promise<ProductDTO[]> {
  if (!items.length) return items;
  const rows = await db
    .select({ productId: reviews.productId, count: sql<number>`count(*)::int`, avg: sql<number>`avg(${reviews.rating})::float` })
    .from(reviews)
    .where(and(eq(reviews.approved, true), inArray(reviews.productId, items.map((i) => i.id))))
    .groupBy(reviews.productId);
  const map = new Map(rows.map((r) => [r.productId, r]));
  return items.map((i) => {
    const r = map.get(i.id);
    return r ? { ...i, ratingAvg: Math.round(r.avg * 10) / 10, ratingCount: r.count } : i;
  });
}

export async function getCategoryCounts() {
  await ensureSeed();
  const rows = await db
    .select({ id: categories.id, count: sql<number>`count(${products.id})::int` })
    .from(categories)
    .leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.isActive, true)))
    .groupBy(categories.id);
  return new Map(rows.map((r) => [r.id, r.count]));
}

export async function getApprovedReviews(productId: number) {
  await ensureSeed();
  return db
    .select()
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.approved, true)))
    .orderBy(desc(reviews.createdAt))
    .limit(20);
}

export async function getPendingReviews() {
  await ensureSeed();
  return db
    .select({ r: reviews, product: products.name })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .where(eq(reviews.approved, false))
    .orderBy(desc(reviews.createdAt));
}

export async function getApprovedTestimonials(limit = 12) {
  await ensureSeed();
  return db
    .select()
    .from(testimonials)
    .where(eq(testimonials.approved, true))
    .orderBy(desc(testimonials.createdAt))
    .limit(limit);
}

export async function getPendingTestimonials() {
  await ensureSeed();
  return db
    .select()
    .from(testimonials)
    .where(eq(testimonials.approved, false))
    .orderBy(desc(testimonials.createdAt));
}

export async function getServices(includeInactive = false) {
  await ensureSeed();
  return db
    .select()
    .from(services)
    .where(includeInactive ? undefined : eq(services.isActive, true))
    .orderBy(asc(services.sortOrder));
}

export async function getService(slug: string) {
  await ensureSeed();
  const [s] = await db.select().from(services).where(and(eq(services.slug, slug), eq(services.isActive, true)));
  if (!s) return null;
  const docs = await db
    .select({ id: doctors.id, slug: doctors.slug, name: doctors.name, title: doctors.title, isSample: doctors.isSample, imageUrl: doctors.imageUrl })
    .from(doctorServices)
    .innerJoin(doctors, eq(doctors.id, doctorServices.doctorId))
    .where(and(eq(doctorServices.serviceId, s.id), eq(doctors.isPublished, true)));
  const related = await db
    .select(productSelect)
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(and(eq(products.relatedServiceSlug, slug), eq(products.isActive, true)))
    .limit(4);
  return { ...s, doctors: docs, products: await attachRatings(related.map(toDTO)) };
}

export async function getDoctors() {
  await ensureSeed();
  const docs = await db.select().from(doctors).where(eq(doctors.isPublished, true)).orderBy(asc(doctors.sortOrder));
  const links = await db
    .select({ doctorId: doctorServices.doctorId, slug: services.slug, name: services.name })
    .from(doctorServices)
    .innerJoin(services, eq(services.id, doctorServices.serviceId))
    .where(eq(services.isActive, true));
  return docs.map((d) => ({ ...d, services: links.filter((l) => l.doctorId === d.id) }));
}

export async function getDoctor(slug: string) {
  await ensureSeed();
  const [d] = await db.select().from(doctors).where(and(eq(doctors.slug, slug), eq(doctors.isPublished, true)));
  if (!d) return null;
  const svc = await db
    .select({ slug: services.slug, name: services.name, short: services.short })
    .from(doctorServices)
    .innerJoin(services, eq(services.id, doctorServices.serviceId))
    .where(and(eq(doctorServices.doctorId, d.id), eq(services.isActive, true)));
  const hours = await db.select().from(doctorHours).where(eq(doctorHours.doctorId, d.id));
  const [branch] = d.branchId ? await db.select().from(branches).where(eq(branches.id, d.branchId)) : [];
  return { ...d, services: svc, hours, branch: branch ?? null };
}

export async function getBranches() {
  await ensureSeed();
  const list = await db.select().from(branches).where(eq(branches.isActive, true)).orderBy(asc(branches.id));
  const ids = list.map((b) => b.id);
  if (!ids.length) return [];
  const hrs = await db.select().from(branchHours).where(inArray(branchHours.branchId, ids));
  const today = nowInTz(list[0].timezone).date;
  const exc = await db
    .select()
    .from(hourExceptions)
    .where(and(inArray(hourExceptions.branchId, ids), gte(hourExceptions.date, today)))
    .orderBy(asc(hourExceptions.date));
  return list.map((b) => ({
    ...b,
    hours: hrs.filter((h) => h.branchId === b.id).sort((x, y) => x.weekday - y.weekday || x.openMin - y.openMin),
    exceptions: exc.filter((e) => e.branchId === b.id),
  }));
}
export type BranchWithHours = Awaited<ReturnType<typeof getBranches>>[number];

export async function getCategories() {
  await ensureSeed();
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function getBrands() {
  await ensureSeed();
  return db.select().from(brands).orderBy(asc(brands.name));
}

export type ProductQuery = {
  q?: string;
  category?: string;
  brand?: string;
  pet?: string;
  min?: number;
  max?: number;
  inStock?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
  featured?: boolean;
  onSale?: boolean;
};

export async function searchProducts(p: ProductQuery) {
  await ensureSeed();
  const conds: SQL[] = [eq(products.isActive, true)];
  if (p.q) {
    const like = `%${p.q.replace(/[%_]/g, "")}%`;
    conds.push(or(ilike(products.name, like), ilike(products.description, like), ilike(brands.name, like))!);
  }
  if (p.category) conds.push(eq(categories.slug, p.category));
  if (p.brand) conds.push(eq(brands.slug, p.brand));
  if (p.pet === "cat" || p.pet === "dog") conds.push(inArray(products.petType, [p.pet, "all"]));
  if (p.min != null && !Number.isNaN(p.min)) conds.push(gte(products.price, Math.round(p.min * 100)));
  if (p.max != null && !Number.isNaN(p.max)) conds.push(lte(products.price, Math.round(p.max * 100)));
  if (p.inStock) conds.push(gt(products.stock, 0));
  if (p.featured) conds.push(eq(products.isFeatured, true));
  if (p.onSale) conds.push(sql`${products.compareAtPrice} is not null`);

  const order =
    p.sort === "price-asc"
      ? [asc(products.price)]
      : p.sort === "price-desc"
        ? [desc(products.price)]
        : p.sort === "name"
          ? [asc(products.name)]
          : [desc(products.createdAt), desc(products.id)];

  const pageSize = p.pageSize ?? 12;
  const page = Math.max(1, p.page ?? 1);
  const where = and(...conds);
  const base = db
    .select(productSelect)
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(where);
  const rows = await base.orderBy(...order).limit(pageSize).offset((page - 1) * pageSize);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(where);
  const items = await attachRatings(rows.map(toDTO));
  return { items, total: count, page, pageSize, pages: Math.max(1, Math.ceil(count / pageSize)) };
}

export async function getProduct(slug: string) {
  await ensureSeed();
  const [row] = await db
    .select({ ...productSelect, description: products.description, specs: products.specs, petType: products.petType, categoryId: products.categoryId, relatedServiceSlug: products.relatedServiceSlug })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(and(eq(products.slug, slug), eq(products.isActive, true)));
  if (!row) return null;
  const { description, specs, petType, categoryId, relatedServiceSlug, ...rest } = row;
  const related = categoryId
    ? await db
        .select(productSelect)
        .from(products)
        .leftJoin(categories, eq(categories.id, products.categoryId))
        .leftJoin(brands, eq(brands.id, products.brandId))
        .where(and(eq(products.categoryId, categoryId), eq(products.isActive, true), sql`${products.id} <> ${row.id}`))
        .limit(4)
    : [];
  const [svc] = relatedServiceSlug
    ? await db.select().from(services).where(and(eq(services.slug, relatedServiceSlug), eq(services.isActive, true)))
    : [];
  const [main] = await attachRatings([toDTO(rest)]);
  const relatedRated = await attachRatings(related.map(toDTO));
  return { ...main, description, specs, petType, related: relatedRated, service: svc ?? null };
}

export async function getPosts(limit = 50) {
  await ensureSeed();
  return db.select().from(posts).where(eq(posts.isPublished, true)).orderBy(desc(posts.publishedAt)).limit(limit);
}

export async function getPost(slug: string) {
  await ensureSeed();
  const [p] = await db.select().from(posts).where(and(eq(posts.slug, slug), eq(posts.isPublished, true)));
  return p ?? null;
}
