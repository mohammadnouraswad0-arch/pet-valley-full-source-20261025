import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { toDTO } from "@/lib/data";
import { getSettings } from "@/lib/settings";
import { shippingOptions } from "@/lib/shipping";

export const dynamic = "force-dynamic";

/** Validates a cart against the database: returns authoritative prices, stock and totals. */
export async function POST(req: Request) {
  await ensureSeed();
  const body = await req.json().catch(() => null);
  const items: { id: number; qty: number }[] = Array.isArray(body?.items)
    ? body.items.filter((i: unknown): i is { id: number; qty: number } => !!i && Number.isInteger((i as { id: number }).id) && Number.isInteger((i as { qty: number }).qty)).slice(0, 50)
    : [];
  const s = await getSettings();
  if (!items.length) return NextResponse.json({ lines: [], subtotal: 0, discount: 0, currency: s.currency, shipping: shippingOptions(s, 0) });

  const rows = await db
    .select({ id: products.id, slug: products.slug, name: products.name, price: products.price, compareAtPrice: products.compareAtPrice, saleEndsAt: products.saleEndsAt, stock: products.stock, imageUrl: products.imageUrl, imageAlt: products.imageAlt, size: products.size, isSample: products.isSample })
    .from(products)
    .where(and(inArray(products.id, items.map((i) => i.id)), eq(products.isActive, true)));

  let subtotal = 0;
  let discount = 0;
  const lines = items.map((i) => {
    const r = rows.find((x) => x.id === i.id);
    if (!r) return { id: i.id, missing: true as const };
    const d = toDTO({ ...r, categoryName: null, categorySlug: null, brandName: null });
    const qty = Math.max(1, i.qty);
    const ok = qty <= d.stock;
    if (ok) {
      subtotal += d.price * qty;
      if (d.compareAt) discount += (d.compareAt - d.price) * qty;
    }
    return { id: d.id, slug: d.slug, name: d.name, price: d.price, compareAt: d.compareAt, stock: d.stock, imageUrl: d.imageUrl, qty, ok };
  });
  return NextResponse.json({ lines, subtotal, discount, currency: s.currency, shipping: shippingOptions(s, subtotal) });
}
