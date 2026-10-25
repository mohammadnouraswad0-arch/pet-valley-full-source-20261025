import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { CheckoutView } from "@/components/cart-views";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "إتمام الطلب", robots: { index: false } };

export default async function CheckoutPage() {
  const s = await getSettings();
  return (
    <>
      <PageHeader title="إتمام الطلب" crumbs={[{ href: "/cart", label: "السلة" }, { label: "إتمام الطلب" }]} />
      <section className="container-pv py-12"><CheckoutView codEnabled={s.codEnabled} /></section>
    </>
  );
}
