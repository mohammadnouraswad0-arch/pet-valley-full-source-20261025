"use client";
import { useRouter } from "next/navigation";
import { IconArrow } from "./icons";

/** Returns to the previous page (keeping shop search/filter state) or falls back to /shop. */
export function BackLink({ fallback = "/shop", label = "العودة للمتجر" }: { fallback?: string; label?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) router.back();
        else router.push(fallback);
      }}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-pv-green hover:text-pv-teal"
    >
      <IconArrow size={16} className="rotate-180" /> {label}
    </button>
  );
}
