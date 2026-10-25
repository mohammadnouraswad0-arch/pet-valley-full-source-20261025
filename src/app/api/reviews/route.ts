import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { ensureSeed } from "@/db/seed";

export const dynamic = "force-dynamic";

/** Customer review — saved as pending moderation, never auto-published. */
export async function POST(req: Request) {
  await ensureSeed();
  const b = await req.json().catch(() => null);
  const productId = Number(b?.productId);
  const name = typeof b?.name === "string" ? b.name.trim().slice(0, 80) : "";
  const rating = Number(b?.rating);
  const comment = typeof b?.comment === "string" ? b.comment.trim().slice(0, 1000) : "";
  if (!productId || name.length < 2) return NextResponse.json({ error: "يرجى إدخال الاسم" }, { status: 422 });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "اختر تقييمًا من 1 إلى 5" }, { status: 422 });
  const [p] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId));
  if (!p) return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
  await db.insert(reviews).values({ productId, name, rating, comment });
  return NextResponse.json({ ok: true });
}
