import { NextResponse } from "next/server";
import { getServices } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const list = await getServices();
  return NextResponse.json(list.map(({ id, slug, name, short, durationMin, visitTypes, isBookable, imageUrl }) => ({ id, slug, name, short, durationMin, visitTypes, isBookable, imageUrl })));
}
