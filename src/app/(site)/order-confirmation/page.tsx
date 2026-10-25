import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { PageHeader } from "@/components/ui";
import { formatPrice, ORDER_STATUS } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { IconCheck } from "@/components/icons";

export const metadata: Metadata = { title: "تأكيد الطلب", robots: { index: false } };

export default async function OrderConfirmation({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const s = await getSettings();
  const [o] = ref ? await db.select().from(orders).where(eq(orders.ref, ref.slice(0, 20))) : [];
  if (!o)
    return (
      <>
        <PageHeader title="لم يتم العثور على الطلب" />
        <section className="container-pv py-12 text-center"><Link href="/account" className="btn btn-outline">البحث عن طلب</Link></section>
      </>
    );
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
  return (
    <>
      <PageHeader title="تم استلام طلبك بنجاح" subtitle="سُجّل طلبك لدينا، وسيتواصل معك فريق العيادة لتأكيده وترتيب الاستلام أو التوصيل." />
      <section className="container-pv py-12">
        <div className="card mx-auto max-w-2xl p-8">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-pv-green text-white"><IconCheck size={28} /></span>
            <div>
              <p className="text-sm text-pv-muted">رقم الطلب</p>
              <p className="ltr text-2xl font-extrabold text-pv-deep">{o.ref}</p>
            </div>
            <span className="mr-auto rounded-full bg-pv-pale px-3 py-1 text-sm font-bold text-pv-deep">{ORDER_STATUS[o.status]}</span>
          </div>
          <ul className="mt-6 divide-y divide-pv-border">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between py-2"><span>{i.name} × {i.quantity}</span><span>{formatPrice(i.unitPrice * i.quantity, s.currency)}</span></li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-pv-border pt-3">
            <div className="flex justify-between"><span>الشحن ({o.shippingMethod === "pickup" ? "استلام من العيادة" : "توصيل"})</span><span>{formatPrice(o.shippingFee, s.currency)}</span></div>
            <div className="flex justify-between text-lg font-extrabold"><span>الإجمالي (الدفع عند الاستلام)</span><span>{formatPrice(o.total, s.currency)}</span></div>
          </div>
          <p className="mt-6 text-sm text-pv-muted">احتفظ برقم الطلب لمتابعة حالته من صفحة <Link href="/account" className="link-pv">تتبع الطلب</Link>.</p>
          <Link href="/shop" className="btn btn-shop mt-6">متابعة التسوق</Link>
        </div>
      </section>
    </>
  );
}
