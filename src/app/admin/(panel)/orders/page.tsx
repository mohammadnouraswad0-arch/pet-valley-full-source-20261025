import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { ORDER_STATUS, formatPrice } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { setOrderStatus } from "../../actions";
import { Submit } from "../../form";

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const s = await getSettings();
  const list = await db.select().from(orders).where(status ? eq(orders.status, status) : undefined).orderBy(desc(orders.createdAt)).limit(200);
  const items = list.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, list.map((o) => o.id))) : [];
  return (
    <div>
      <h1 className="text-3xl">طلبات المتجر</h1>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        <a href="/admin/orders" className={`rounded-full px-3 py-1.5 font-semibold ring-1 ring-pv-border ${!status ? "bg-pv-green text-white" : "bg-white"}`}>الكل</a>
        {Object.entries(ORDER_STATUS).map(([k, v]) => <a key={k} href={`/admin/orders?status=${k}`} className={`rounded-full px-3 py-1.5 font-semibold ring-1 ring-pv-border ${status === k ? "bg-pv-green text-white" : "bg-white"}`}>{v}</a>)}
      </nav>
      <div className="mt-6 space-y-4">
        {list.length === 0 && <p className="card p-8 text-center text-pv-muted">لا توجد طلبات.</p>}
        {list.map((o) => (
          <article key={o.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="ltr inline-block text-lg font-extrabold text-pv-deep">{o.ref}</p>
                <p className="text-sm text-pv-muted"><span className="ltr">{o.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span> · {o.customerName} · <a href={`tel:${o.phone}`} className="ltr">{o.phone}</a></p>
              </div>
              <form action={setOrderStatus} className="flex items-center gap-2">
                <input type="hidden" name="id" value={o.id} />
                <select name="status" defaultValue={o.status} className="input min-h-10! py-1!">{Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                <Submit label="تحديث" className="btn btn-secondary btn-sm" />
              </form>
            </div>
            <ul className="mt-3 text-sm">
              {items.filter((i) => i.orderId === o.id).map((i) => <li key={i.id}>{i.name} × {i.quantity} — {formatPrice(i.unitPrice * i.quantity, s.currency)}</li>)}
            </ul>
            <p className="mt-2 text-sm">
              {o.shippingMethod === "pickup" ? "استلام من العيادة" : `توصيل: ${o.city}، ${o.address}`} · الدفع: عند الاستلام · <strong>الإجمالي {formatPrice(o.total, s.currency)}</strong>
            </p>
            {o.notes && <p className="mt-1 text-sm text-pv-muted">ملاحظات: {o.notes}</p>}
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs text-pv-muted">إلغاء الطلب يعيد الكميات إلى المخزون تلقائيًا.</p>
    </div>
  );
}
