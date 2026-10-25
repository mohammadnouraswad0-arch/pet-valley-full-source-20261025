import type { SiteSettings } from "./settings-defaults";

export function shippingOptions(s: SiteSettings, subtotal: number) {
  const opts: { id: string; label: string; fee: number }[] = [];
  if (s.pickupEnabled) opts.push({ id: "pickup", label: "الاستلام من العيادة", fee: 0 });
  if (s.deliveryEnabled) {
    const free = s.freeShippingThreshold != null && subtotal >= s.freeShippingThreshold;
    opts.push({ id: "delivery", label: "توصيل إلى العنوان", fee: free ? 0 : s.deliveryFee });
  }
  return opts;
}
