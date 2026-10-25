import { NextResponse } from "next/server";
import { getDoctors } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const list = await getDoctors();
  return NextResponse.json(list.map(({ id, slug, name, title, specialties, branchId, isSample, services }) => ({ id, slug, name, title, specialties, branchId, isSample, services: services.map((s) => s.slug) })));
}
