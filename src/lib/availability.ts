import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  bookings,
  branches,
  branchHours,
  doctorHours,
  doctors,
  doctorServices,
  doctorTimeOff,
  hourExceptions,
  services,
} from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { branchWindows, intersect, nowInTz, weekdayOf, type Window } from "./hours";
import { makeRef } from "./format";

const STEP = 30;
const ACTIVE = ["pending", "confirmed"];
type Executor = Pick<typeof db, "select">;

export type Slot = { start: number; end: number; doctorIds: (number | null)[] };

type Query = { serviceId: number; branchId: number; doctorId?: number | null; date: string; visitType: string };

export async function computeSlots(q: Query, ex: Executor = db): Promise<{ slots: Slot[]; reason?: string }> {
  await ensureSeed();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(q.date)) return { slots: [], reason: "تاريخ غير صالح" };

  const [service] = await ex.select().from(services).where(eq(services.id, q.serviceId));
  if (!service || !service.isActive || !service.isBookable) return { slots: [], reason: "الخدمة غير متاحة للحجز" };
  if (!service.visitTypes.includes(q.visitType)) return { slots: [], reason: "طريقة الزيارة غير متاحة لهذه الخدمة" };

  const [branch] = await ex.select().from(branches).where(eq(branches.id, q.branchId));
  if (!branch || !branch.isActive) return { slots: [], reason: "الفرع غير متاح" };

  const now = nowInTz(branch.timezone);
  if (q.date < now.date) return { slots: [], reason: "لا يمكن الحجز في تاريخ سابق" };

  const bh = await ex.select().from(branchHours).where(eq(branchHours.branchId, branch.id));
  const exc = await ex.select().from(hourExceptions).where(eq(hourExceptions.branchId, branch.id));
  const bw = branchWindows(q.date, bh, exc);
  if (!bw.length) return { slots: [], reason: "الفرع مغلق في هذا اليوم" };

  // Candidate resources: doctors at branch offering the service
  const linked = await ex
    .select({ id: doctors.id, branchId: doctors.branchId, isPublished: doctors.isPublished })
    .from(doctorServices)
    .innerJoin(doctors, eq(doctors.id, doctorServices.doctorId))
    .where(eq(doctorServices.serviceId, service.id));
  let candidates = linked.filter((d) => d.isPublished && d.branchId === branch.id).map((d) => d.id);

  if (q.doctorId) {
    if (!candidates.includes(q.doctorId)) return { slots: [], reason: "الطبيب المختار لا يقدم هذه الخدمة في هذا الفرع" };
    candidates = [q.doctorId];
  }

  const wd = weekdayOf(q.date);
  const resourceWindows = new Map<number | null, Window[]>();
  if (candidates.length) {
    const dh = await ex.select().from(doctorHours).where(inArray(doctorHours.doctorId, candidates));
    const off = await ex
      .select()
      .from(doctorTimeOff)
      .where(and(inArray(doctorTimeOff.doctorId, candidates), eq(doctorTimeOff.date, q.date)));
    for (const id of candidates) {
      if (off.some((o) => o.doctorId === id)) continue;
      const w = dh.filter((h) => h.doctorId === id && h.weekday === wd).map((h) => ({ start: h.startMin, end: h.endMin }));
      const inter = intersect(bw, w);
      if (inter.length) resourceWindows.set(id, inter);
    }
  } else if (!q.doctorId) {
    // Services without linked doctors (e.g. grooming) use a branch-level resource (capacity 1)
    resourceWindows.set(null, bw);
  }
  if (!resourceWindows.size) return { slots: [], reason: "لا يوجد طبيب متاح في هذا اليوم" };

  const existing = await ex
    .select({ doctorId: bookings.doctorId, serviceId: bookings.serviceId, startMin: bookings.startMin, endMin: bookings.endMin })
    .from(bookings)
    .where(and(eq(bookings.branchId, branch.id), eq(bookings.date, q.date), inArray(bookings.status, ACTIVE)));

  const busy = (res: number | null, s: number, e: number) =>
    existing.some(
      (b) =>
        (res === null ? b.doctorId === null && b.serviceId === service.id : b.doctorId === res) &&
        b.startMin < e &&
        s < b.endMin,
    );

  const map = new Map<number, Slot>();
  const minStart = q.date === now.date ? now.minutes + 30 : 0;
  for (const [res, wins] of resourceWindows) {
    for (const w of wins) {
      for (let s = Math.ceil(w.start / STEP) * STEP; s + service.durationMin <= w.end; s += STEP) {
        if (s < minStart) continue;
        const e = s + service.durationMin;
        if (busy(res, s, e)) continue;
        const slot = map.get(s) ?? { start: s, end: e, doctorIds: [] };
        slot.doctorIds.push(res);
        map.set(s, slot);
      }
    }
  }
  const slots = [...map.values()].sort((a, b) => a.start - b.start);
  return { slots, reason: slots.length ? undefined : "لا توجد أوقات متاحة في هذا اليوم" };
}

export type BookingInput = Query & {
  startMin: number;
  petType: string;
  petName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

export async function createBooking(input: BookingInput) {
  return db.transaction(async (tx) => {
    // Serialize bookings per branch+date so concurrent requests can't double-book
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`bk:${input.branchId}:${input.date}`}))`);
    const { slots, reason } = await computeSlots(input, tx);
    const slot = slots.find((s) => s.start === input.startMin);
    if (!slot) {
      return { ok: false as const, error: reason ?? "الموعد المختار لم يعد متاحًا", alternatives: slots.slice(0, 6) };
    }
    const doctorId = input.doctorId ?? slot.doctorIds[0] ?? null;
    const ref = makeRef("PV");
    const [row] = await tx
      .insert(bookings)
      .values({
        ref,
        status: "pending",
        serviceId: input.serviceId,
        doctorId,
        branchId: input.branchId,
        visitType: input.visitType,
        date: input.date,
        startMin: slot.start,
        endMin: slot.end,
        petType: input.petType,
        petName: input.petName,
        ownerName: input.ownerName,
        phone: input.phone,
        email: input.email,
        address: input.address,
        notes: input.notes,
      })
      .returning({ ref: bookings.ref });
    return { ok: true as const, ref: row.ref };
  });
}
