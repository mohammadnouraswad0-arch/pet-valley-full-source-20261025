import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { CartView } from "@/components/cart-views";

export const metadata: Metadata = { title: "السلة", robots: { index: false } };

export default function CartPage() {
  return (
    <>
      <PageHeader title="سلة التسوق" crumbs={[{ href: "/shop", label: "المتجر" }, { label: "السلة" }]} />
      <section className="container-pv py-12"><CartView /></section>
    </>
  );
}
