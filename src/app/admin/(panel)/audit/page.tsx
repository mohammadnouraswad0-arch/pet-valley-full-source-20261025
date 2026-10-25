import { desc } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export default async function AuditPage() {
  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(300);
  return (
    <div>
      <h1 className="text-3xl">سجل التعديلات الإدارية</h1>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-right text-sm">
          <thead className="bg-pv-cream text-pv-muted"><tr>{["الوقت (UTC)", "الإجراء", "الكيان", "المعرف", "تفاصيل"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-pv-muted">لا توجد سجلات</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-pv-border">
                <td className="ltr p-3 text-pv-muted">{r.createdAt.toISOString().slice(0, 19).replace("T", " ")}</td>
                <td className="p-3 font-semibold">{r.action}</td>
                <td className="p-3">{r.entity}</td>
                <td className="p-3">{r.entityId}</td>
                <td className="p-3">{r.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
