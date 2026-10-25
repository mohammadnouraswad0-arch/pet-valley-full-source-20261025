import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const n = (k: string) => (u.get(k) ? Number(u.get(k)) : undefined);
  const res = await searchProducts({
    q: u.get("q") ?? undefined,
    category: u.get("category") ?? undefined,
    brand: u.get("brand") ?? undefined,
    pet: u.get("pet") ?? undefined,
    min: n("min"),
    max: n("max"),
    inStock: u.get("stock") === "1",
    sort: u.get("sort") ?? undefined,
    page: n("page"),
    pageSize: Math.min(48, n("pageSize") ?? 12),
  });
  return NextResponse.json(res);
}
