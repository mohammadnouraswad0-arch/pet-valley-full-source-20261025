import { NextResponse } from "next/server";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { ensureSeed } from "@/db/seed";

export const dynamic = "force-dynamic";

/** Clinic testimonial — saved as pending moderation, never auto-published. */
export async function POST(req: Request) {
  await ensureSeed();
  const b = await req.json().catch(() => null);
  const name = typeof b?.name === "string" ? b.name.trim().slice(0, 80) : "";
  const petName = typeof b?.petName === "string" ? b.petName.trim().slice(0, 60) : "";
  const rating = Number(b?.rating);
  const text = typeof b?.text === "string" ? b.text.trim().slice(0, 1000) : "";
  if (name.length < 2) return NextResponse.json({ error: "يرجى إدخال الاسم" }, { status: 422 });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "اختر تقييمًا من 1 إلى 5" }, { status: 422 });
  if (text.length < 4) return NextResponse.json({ error: "يرجى كتابة رأيك (4 أحرف على الأقل)" }, { status: 422 });
  await db.insert(testimonials).values({ name, petName, rating, text });
  return NextResponse.json({ ok: true });
}
