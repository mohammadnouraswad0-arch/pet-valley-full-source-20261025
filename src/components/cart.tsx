"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type CartLine = {
  id: number;
  slug: string;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
  qty: number;
};

type Toast = { id: number; text: string; kind: "ok" | "err" };

type Ctx = {
  lines: CartLine[];
  count: number;
  ready: boolean;
  add: (p: Omit<CartLine, "qty">, qty?: number) => boolean;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  replace: (lines: CartLine[]) => void;
  clear: () => void;
  notify: (text: string, kind?: "ok" | "err") => void;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "pv_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const tid = useRef(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const notify = useCallback((text: string, kind: "ok" | "err" = "ok") => {
    const id = ++tid.current;
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const add = useCallback(
    (p: Omit<CartLine, "qty">, qty = 1) => {
      if (p.stock <= 0) {
        notify("عذرًا، هذا المنتج غير متوفر حاليًا", "err");
        return false;
      }
      const existing = lines.find((l) => l.id === p.id);
      const next = (existing?.qty ?? 0) + qty;
      if (next > p.stock) {
        notify(`الكمية المتوفرة من هذا المنتج ${p.stock} فقط`, "err");
        return false;
      }
      setLines((cur) =>
        cur.some((l) => l.id === p.id)
          ? cur.map((l) => (l.id === p.id ? { ...l, ...p, qty: next } : l))
          : [...cur, { ...p, qty }],
      );
      notify(`تمت إضافة «${p.name}» إلى السلة`);
      return true;
    },
    [lines, notify],
  );

  const setQty = useCallback((id: number, qty: number) => {
    setLines((cur) => cur.map((l) => (l.id === id ? { ...l, qty: Math.max(1, Math.min(qty, l.stock || 1)) } : l)));
  }, []);
  const remove = useCallback((id: number) => setLines((cur) => cur.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => setLines([]), []);
  const replace = useCallback((l: CartLine[]) => setLines(l), []);

  const value = useMemo(
    () => ({ lines, count: lines.reduce((s, l) => s + l.qty, 0), ready, add, setQty, remove, replace, clear, notify }),
    [lines, ready, add, setQty, remove, replace, clear, notify],
  );

  return (
    <CartCtx.Provider value={value}>
      {children}
      <div aria-live="polite" className="fixed bottom-5 left-5 right-5 z-[2000] flex flex-col items-center gap-2 pointer-events-none sm:right-auto sm:items-start">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`toast pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl text-sm font-semibold ${
              t.kind === "ok" ? "bg-pv-deep text-white" : "bg-white text-red-800 border border-red-200"
            }`}
          >
            <span aria-hidden className={`grid h-6 w-6 place-items-center rounded-full ${t.kind === "ok" ? "bg-pv-yellow text-pv-deep" : "bg-red-100"}`}>
              {t.kind === "ok" ? "✓" : "!"}
            </span>
            {t.text}
          </div>
        ))}
      </div>
    </CartCtx.Provider>
  );
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside provider");
  return c;
}
