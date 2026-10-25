import { NextResponse } from "next/server";
import { computeSlots } from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const serviceId = Number(u.get("serviceId"));
  const branchId = Number(u.get("branchId"));
  const doctorId = u.get("doctorId") ? Number(u.get("doctorId")) : null;
  const date = u.get("date") ?? "";
  const visitType = u.get("visitType") ?? "clinic";
  if (!serviceId || !branchId) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  const { slots, reason } = await computeSlots({ serviceId, branchId, doctorId, date, visitType });
  return NextResponse.json({ slots: slots.map((s) => ({ start: s.start, end: s.end })), reason }, { headers: { "cache-control": "no-store" } });
}
