export const WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function formatPrice(minor: number, currency = "ر.س") {
  const v = minor / 100;
  const s = v.toLocaleString("ar-EG-u-nu-latn", {
    minimumFractionDigits: v % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${s} ${currency}`;
}

export function minToTime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const suffix = h < 12 || h === 24 ? "ص" : "م";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function hhmm(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export function parseHHMM(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 24 || mi > 59 || (h === 24 && mi > 0)) return null;
  return h * 60 + mi;
}

export function formatDateAr(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return dt.toLocaleDateString("ar-EG-u-nu-latn", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const BOOKING_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "قيد المراجعة", cls: "bg-[#F7E7A8] text-[#174C45]" },
  confirmed: { label: "مؤكد", cls: "bg-[#2F6B57] text-white" },
  rejected: { label: "مرفوض", cls: "bg-red-100 text-red-800" },
  cancelled: { label: "ملغى", cls: "bg-stone-200 text-stone-700" },
  completed: { label: "مكتمل", cls: "bg-[#1599A8]/15 text-[#0f6f7a]" },
};

export const ORDER_STATUS: Record<string, string> = {
  pending: "قيد المراجعة",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغى",
};

export const PET_TYPES: Record<string, string> = { cat: "قطة", dog: "كلب", bird: "طائر", other: "أخرى" };
export const VISIT_TYPES: Record<string, string> = { clinic: "زيارة العيادة", home: "زيارة منزلية", online: "استشارة عن بعد" };

export function makeRef(prefix: string) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return prefix + "-" + Array.from(bytes, (b) => chars[b % chars.length]).join("");
}
