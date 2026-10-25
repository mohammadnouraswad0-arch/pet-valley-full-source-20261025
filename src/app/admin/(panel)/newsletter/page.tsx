import { desc } from "drizzle-orm";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { deleteSubscriber } from "../../actions";

export default async function NewsletterPage() {
  const rows = await db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt)).limit(500);
  return (
    <div>
      <h1 className="text-3xl">النشرة البريدية ({rows.length})</h1>
      <p className="mt-2 text-pv-muted">قائمة البريد الإلكتروني للمشتركين من الموقع.</p>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[480px] text-right text-sm">
          <thead className="bg-pv-cream text-pv-muted"><tr><th className="p-3">البريد</th><th className="p-3">تاريخ الاشتراك (UTC)</th><th className="p-3"></th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-pv-muted">لا يوجد مشتركون بعد.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-pv-border">
                <td className="ltr p-3 text-right">{r.email}</td>
                <td className="ltr p-3 text-pv-muted">{r.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                <td className="p-3"><form action={deleteSubscriber}><input type="hidden" name="id" value={r.id} /><button className="text-red-700 hover:underline">حذف</button></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
