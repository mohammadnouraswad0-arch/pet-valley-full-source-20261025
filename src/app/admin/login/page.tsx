import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { ActionForm } from "../form";
import { login } from "../actions";
import { Logo } from "@/components/icons";

export const metadata: Metadata = { title: "دخول الإدارة", robots: { index: false } };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  const usingDefault = !process.env.ADMIN_PASSWORD;
  return (
    <main className="grid min-h-screen place-items-center bg-pv-cream p-6">
      <div className="card w-full max-w-md p-8 shadow-xl">
        <Logo />
        <h1 className="mt-6 text-2xl">لوحة إدارة سامايا طيبة</h1>
        <p className="mt-1 text-sm text-pv-muted">للموظفين المخولين فقط.</p>
        <ActionForm action={login} className="mt-6 space-y-4" submit="دخول">
          <div>
            <label htmlFor="password" className="label">كلمة المرور</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
          </div>
        </ActionForm>
        {usingDefault && (
          <p className="mt-6 rounded-xl bg-pv-pale/60 p-3 text-xs text-pv-deep">
            بيئة تطوير: لم يُضبط <code className="ltr">ADMIN_PASSWORD</code>. كلمة المرور المؤقتة: <code className="ltr font-bold">petvalley-admin</code> — اضبط متغير البيئة قبل النشر.
          </p>
        )}
      </div>
    </main>
  );
}
