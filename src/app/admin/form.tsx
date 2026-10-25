"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

type Res = { error?: string; ok?: string } | undefined;

export function ActionForm({ action, children, className = "", submit = "حفظ" }: { action: (prev: Res, fd: FormData) => Promise<Res>; children: ReactNode; className?: string; submit?: string }) {
  const [state, formAction] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{state.error}</p>}
      {state?.ok && <p role="status" className="rounded-xl bg-pv-green/10 p-3 text-sm font-semibold text-pv-deep">{state.ok}</p>}
      <Submit label={submit} />
    </form>
  );
}

export function Submit({ label = "حفظ", className = "btn btn-secondary" }: { label?: string; className?: string }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className={className}>{pending ? "جارٍ الحفظ…" : label}</button>;
}

export function ConfirmButton({ label, message, className }: { label: string; message: string; className: string }) {
  return (
    <button className={className} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      {label}
    </button>
  );
}
