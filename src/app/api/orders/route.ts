import { NextResponse } from "next/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, payments, products } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { getSettings } from "@/lib/settings";
import { makeRef } from "@/lib/format";
import { shippingOptions } from "@/lib/shipping";

export const dynamic = "force-dynamic";

class OrderError extends Error {}

export async function POST(req: Request) {
  await ensureSeed();
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });

  const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const name = str(b.name, 100);
  const phone = str(b.phone, 30);
  const email = str(b.email, 120);
  const city = str(b.city, 80);
  const address = str(b.address, 300);
  const notes = str(b.notes, 500);
  const shippingMethod = str(b.shippingMethod, 20);
  const paymentMethod = str(b.paymentMethod, 20);
  const items: { id: number; qty: number }[] = Array.isArray(b.items) ? b.items.slice(0, 50) : [];

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "يرجى إدخال الاسم الكامل";
  if (!/^\+?[0-9\s-]{8,20}$/.test(phone)) errors.phone = "رقم الهاتف غير صالح";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "البريد الإلكتروني غير صالح";
  if (!items.length || items.some((i) => !Number.isInteger(i?.id) || !Number.isInteger(i?.qty) || i.qty < 1 || i.qty > 99)) errors.items = "السلة فارغة أو تحتوي على كميات غير صالحة";

  const s = await getSettings();
  if (paymentMethod !== "cod" || !s.codEnabled) errors.paymentMethod = "وسيلة الدفع غير متاحة";
  if (shippingMethod === "delivery" && (city.length < 2 || address.length < 5)) errors.address = "يرجى إدخال المدينة والعنوان للتوصيل";
  if (Object.keys(errors).length) return NextResponse.json({ error: "يرجى تصحيح الحقول المطلوبة", errors }, { status: 422 });

  try {
    const result = await db.transaction(async (tx) => {
      let subtotal = 0;
      const lines: { productId: number; name: string; unitPrice: number; quantity: number }[] = [];
      for (const it of items) {
        // Atomic stock decrement — fails if insufficient
        const [p] = await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${it.qty}` })
          .where(and(eq(products.id, it.id), eq(products.isActive, true), gte(products.stock, it.qty)))
          .returning({ id: products.id, name: products.name, price: products.price, stock: products.stock });
        if (!p) {
          const [info] = await tx.select({ name: products.name, stock: products.stock }).from(products).where(eq(products.id, it.id));
          throw new OrderError(info ? `الكمية المطلوبة من «${info.name}» غير متوفرة (المتوفر: ${info.stock})` : "أحد المنتجات لم يعد متاحًا");
        }
        subtotal += p.price * it.qty;
        lines.push({ productId: p.id, name: p.name, unitPrice: p.price, quantity: it.qty });
      }
      const ship = shippingOptions(s, subtotal).find((o) => o.id === shippingMethod);
      if (!ship) throw new OrderError("طريقة الشحن غير متاحة");
      const ref = makeRef("ORD");
      const total = subtotal + ship.fee;
      const [o] = await tx
        .insert(orders)
        .values({ ref, customerName: name, phone, email, city, address, notes, shippingMethod, paymentMethod, subtotal, shippingFee: ship.fee, total })
        .returning({ id: orders.id, ref: orders.ref });
      await tx.insert(orderItems).values(lines.map((l) => ({ ...l, orderId: o.id })));
      await tx.insert(payments).values({ orderId: o.id, method: paymentMethod, status: "pending", amount: total });
      return o;
    });
    return NextResponse.json({ ok: true, ref: result.ref });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: 409 });
    console.error("order failed");
    return NextResponse.json({ error: "تعذر تسجيل الطلب، حاول مرة أخرى" }, { status: 500 });
  }
}
