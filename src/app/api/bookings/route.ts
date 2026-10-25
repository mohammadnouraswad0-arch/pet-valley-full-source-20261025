import { NextResponse } from "next/server";
import { createBooking } from "@/lib/availability";
import { PET_TYPES } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const input = {
    serviceId: Number(b.serviceId),
    branchId: Number(b.branchId),
    doctorId: b.doctorId ? Number(b.doctorId) : null,
    date: str(b.date, 10),
    startMin: Number(b.startMin),
    visitType: str(b.visitType, 10) || "clinic",
    petType: str(b.petType, 10),
    petName: str(b.petName, 60),
    ownerName: str(b.ownerName, 100),
    phone: str(b.phone, 30),
    email: str(b.email, 120),
    address: str(b.address, 300),
    notes: str(b.notes, 600),
  };
  const errors: Record<string, string> = {};
  if (!input.serviceId) errors.serviceId = "اختر الخدمة";
  if (!input.branchId) errors.branchId = "اختر الفرع";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) errors.date = "اختر التاريخ";
  if (!Number.isInteger(input.startMin) || input.startMin < 0 || input.startMin > 1440) errors.startMin = "اختر الوقت";
  if (!PET_TYPES[input.petType]) errors.petType = "اختر نوع الحيوان";
  if (input.petName.length < 1) errors.petName = "أدخل اسم الحيوان";
  if (input.ownerName.length < 2) errors.ownerName = "أدخل اسمك الكامل";
  if (!/^\+?[0-9\s-]{8,20}$/.test(input.phone)) errors.phone = "رقم الهاتف غير صالح";
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) errors.email = "البريد الإلكتروني غير صالح";
  if (input.visitType === "home" && input.address.length < 5) errors.address = "أدخل عنوان الزيارة";
  if (Object.keys(errors).length) return NextResponse.json({ error: "يرجى استكمال البيانات المطلوبة", errors }, { status: 422 });

  try {
    const r = await createBooking(input);
    if (!r.ok) return NextResponse.json({ error: r.error, alternatives: r.alternatives.map((s) => ({ start: s.start, end: s.end })) }, { status: 409 });
    return NextResponse.json({ ok: true, ref: r.ref });
  } catch (e) {
    const code = (e as { code?: string; cause?: { code?: string } })?.code ?? (e as { cause?: { code?: string } })?.cause?.code;
    if (code === "23505") return NextResponse.json({ error: "تم حجز هذا الموعد للتو، يرجى اختيار وقت آخر", alternatives: [] }, { status: 409 });
    console.error("booking failed");
    return NextResponse.json({ error: "تعذر تسجيل الحجز، حاول مرة أخرى" }, { status: 500 });
  }
}
