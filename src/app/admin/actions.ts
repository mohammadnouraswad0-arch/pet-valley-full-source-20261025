"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  bookings,
  branches,
  branchHours,
  categories,
  doctorHours,
  doctors,
  doctorServices,
  doctorTimeOff,
  hourExceptions,
  newsletterSubscribers,
  orders,
  products,
  reviews,
  services,
  settings,
} from "@/db/schema";
import { audit, checkPassword, createSession, destroySession, requireAdmin } from "@/lib/auth";
import { parseHHMM } from "@/lib/format";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";

const s = (fd: FormData, k: string, max = 2000) => String(fd.get(k) ?? "").trim().slice(0, max);
const n = (fd: FormData, k: string) => Number(fd.get(k));
const b = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "1";
const money = (v: string) => (v === "" ? null : Math.round(Number(v) * 100));
const slugify = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || `item-${Date.now()}`;

/* Auth */
export async function login(_: unknown, fd: FormData) {
  if (!checkPassword(s(fd, "password", 200))) {
    await new Promise((r) => setTimeout(r, 600));
    return { error: "كلمة المرور غير صحيحة" };
  }
  await createSession();
  await audit("login", "admin");
  redirect("/admin");
}
export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

/* Bookings */
const BK = ["pending", "confirmed", "rejected", "cancelled", "completed"];
export async function setBookingStatus(fd: FormData) {
  await requireAdmin();
  const id = n(fd, "id");
  const status = s(fd, "status");
  if (!BK.includes(status)) return;
  await db.update(bookings).set({ status, updatedAt: new Date() }).where(eq(bookings.id, id));
  await audit("status:" + status, "booking", id);
  revalidatePath("/admin");
}

export async function saveBookingNotes(fd: FormData) {
  await requireAdmin();
  const id = n(fd, "id");
  await db.update(bookings).set({ internalNotes: s(fd, "internalNotes", 2000), updatedAt: new Date() }).where(eq(bookings.id, id));
  await audit("notes", "booking", id);
  revalidatePath(`/admin/bookings/${id}`);
}

export async function rescheduleBooking(_: unknown, fd: FormData) {
  await requireAdmin();
  const id = n(fd, "id");
  const date = s(fd, "date", 10);
  const start = parseHHMM(s(fd, "time", 5));
  const doctorId = s(fd, "doctorId") ? n(fd, "doctorId") : null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || start == null) return { error: "تاريخ أو وقت غير صالح" };
  try {
    return await db.transaction(async (tx) => {
      const [bk] = await tx.select().from(bookings).where(eq(bookings.id, id));
      if (!bk) return { error: "الحجز غير موجود" };
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`bk:${bk.branchId}:${date}`}))`);
      const dur = bk.endMin - bk.startMin;
      const end = start + dur;
      const clash = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            ne(bookings.id, id),
            eq(bookings.date, date),
            eq(bookings.branchId, bk.branchId),
            inArray(bookings.status, ["pending", "confirmed"]),
            doctorId ? eq(bookings.doctorId, doctorId) : and(sql`${bookings.doctorId} is null`, eq(bookings.serviceId, bk.serviceId)),
            sql`${bookings.startMin} < ${end} and ${start} < ${bookings.endMin}`,
          ),
        );
      if (clash.length) return { error: "يوجد تعارض مع حجز آخر في هذا الوقت" };
      await tx.update(bookings).set({ date, startMin: start, endMin: end, doctorId, updatedAt: new Date() }).where(eq(bookings.id, id));
      await audit("reschedule", "booking", id, `${date} ${s(fd, "time")}`);
      revalidatePath(`/admin/bookings/${id}`);
      return { ok: "تم تعديل الموعد" };
    });
  } catch {
    return { error: "تعذر تعديل الموعد (تعارض)" };
  }
}

/* Orders */
export async function setOrderStatus(fd: FormData) {
  await requireAdmin();
  const id = n(fd, "id");
  const status = s(fd, "status");
  if (!["pending", "processing", "shipped", "delivered", "cancelled"].includes(status)) return;
  await db.transaction(async (tx) => {
    const [o] = await tx.select().from(orders).where(eq(orders.id, id));
    if (!o || o.status === status) return;
    // Restock when cancelling
    if (status === "cancelled" && o.status !== "cancelled") {
      await tx.execute(sql`update products p set stock = p.stock + oi.quantity from order_items oi where oi.order_id = ${id} and oi.product_id = p.id`);
    }
    await tx.update(orders).set({ status }).where(eq(orders.id, id));
  });
  await audit("status:" + status, "order", id);
  revalidatePath("/admin/orders");
}

/* Products */
export async function saveProduct(_: unknown, fd: FormData) {
  await requireAdmin();
  const id = n(fd, "id") || null;
  const price = money(s(fd, "price"));
  const compare = money(s(fd, "compareAtPrice"));
  const stock = n(fd, "stock");
  if (price == null || price < 0) return { error: "السعر غير صالح" };
  if (!Number.isInteger(stock) || stock < 0) return { error: "المخزون يجب أن يكون رقمًا صحيحًا غير سالب" };
  if (compare != null && (compare <= price || price < compare * 0.1)) return { error: "السعر السابق يجب أن يكون أعلى من الحالي، والخصم لا يتجاوز 90%" };
  const name = s(fd, "name", 200);
  if (name.length < 2) return { error: "اسم المنتج مطلوب" };
  let specs: Record<string, string> = {};
  for (const line of s(fd, "specs", 3000).split("\n")) {
    const [k, ...v] = line.split(":");
    if (k?.trim() && v.length) specs[k.trim()] = v.join(":").trim();
  }
  if (!Object.keys(specs).length) specs = {};
  const saleEnds = s(fd, "saleEndsAt");
  const values = {
    name,
    slug: s(fd, "slug", 80) ? slugify(s(fd, "slug", 80)) : slugify(name),
    description: s(fd, "description", 4000),
    categoryId: n(fd, "categoryId") || null,
    brandId: n(fd, "brandId") || null,
    petType: ["cat", "dog", "all"].includes(s(fd, "petType")) ? s(fd, "petType") : "all",
    price,
    compareAtPrice: compare,
    saleEndsAt: saleEnds ? new Date(saleEnds) : null,
    stock,
    size: s(fd, "size", 80),
    imageUrl: s(fd, "imageUrl", 600),
    imageAlt: s(fd, "imageAlt", 200),
    specs,
    isActive: b(fd, "isActive"),
    isFeatured: b(fd, "isFeatured"),
    isSample: b(fd, "isSample"),
  };
  try {
    if (id) await db.update(products).set(values).where(eq(products.id, id));
    else await db.insert(products).values(values);
  } catch {
    return { error: "تعذر الحفظ — تحقق من أن الرابط المختصر (slug) غير مكرر" };
  }
  await audit(id ? "update" : "create", "product", id ?? values.slug);
  revalidatePath("/admin/products");
  if (!id) redirect("/admin/products");
  return { ok: "تم حفظ المنتج" };
}

export async function quickStock(fd: FormData) {
  await requireAdmin();
  const id = n(fd, "id");
  const stock = n(fd, "stock");
  if (!Number.isInteger(stock) || stock < 0) return;
  await db.update(products).set({ stock }).where(eq(products.id, id));
  await audit("stock", "product", id, String(stock));
  revalidatePath("/admin/products");
}

export async function saveCategory(fd: FormData) {
  await requireAdmin();
  const id = n(fd, "id") || null;
  const v = { name: s(fd, "name", 100), slug: slugify(s(fd, "slug", 80) || s(fd, "name")), description: s(fd, "description", 500), imageUrl: s(fd, "imageUrl", 600) };
  if (!v.name) return;
  if (id) await db.update(categories).set(v).where(eq(categories.id, id));
  else await db.insert(categories).values(v).onConflictDoNothing();
  await audit(id ? "update" : "create", "category", id ?? v.slug);
  revalidatePath("/admin/products");
}

/* Reviews */
export async function approveReview(fd: FormData) {
  await requireAdmin();
  await db.update(reviews).set({ approved: true }).where(eq(reviews.id, n(fd, "id")));
  await audit("approve", "review", n(fd, "id"));
  revalidatePath("/admin/products");
}
export async function deleteReview(fd: FormData) {
  await requireAdmin();
  await db.delete(reviews).where(eq(reviews.id, n(fd, "id")));
  await audit("delete", "review", n(fd, "id"));
  revalidatePath("/admin/products");
}
export async function deleteSubscriber(fd: FormData) {
  await requireAdmin();
  await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, n(fd, "id")));
  revalidatePath("/admin/newsletter");
}
export async function approveTestimonial(fd: FormData) {
  await requireAdmin();
  const { testimonials } = await import("@/db/schema");
  await db.update(testimonials).set({ approved: true }).where(eq(testimonials.id, n(fd, "id")));
  await audit("approve", "testimonial", n(fd, "id"));
  revalidatePath("/");
}
export async function deleteTestimonial(fd: FormData) {
  await requireAdmin();
  const { testimonials } = await import("@/db/schema");
  await db.delete(testimonials).where(eq(testimonials.id, n(fd, "id")));
  await audit("delete", "testimonial", n(fd, "id"));
  revalidatePath("/");
}

/* Hours */
export async function saveBranch(_: unknown, fd: FormData) {
  await requireAdmin();
  const id = n(fd, "branchId");
  const rows: { branchId: number; weekday: number; openMin: number; closeMin: number }[] = [];
  for (let d = 0; d < 7; d++) {
    if (b(fd, `closed_${d}`)) continue;
    for (const p of [1, 2]) {
      const o = s(fd, `open_${d}_${p}`);
      const c = s(fd, `close_${d}_${p}`);
      if (!o && !c) continue;
      const om = parseHHMM(o);
      const cm = parseHHMM(c);
      if (om == null || cm == null || cm <= om) return { error: `وقت غير صالح في يوم رقم ${d + 1} (الفترة ${p})` };
      rows.push({ branchId: id, weekday: d, openMin: om, closeMin: cm });
    }
  }
  try {
    Intl.DateTimeFormat("en", { timeZone: s(fd, "timezone") });
  } catch {
    return { error: "المنطقة الزمنية غير صالحة" };
  }
  await db.transaction(async (tx) => {
    await tx.delete(branchHours).where(eq(branchHours.branchId, id));
    if (rows.length) await tx.insert(branchHours).values(rows);
    await tx
      .update(branches)
      .set({
        name: s(fd, "name", 100),
        city: s(fd, "city", 100),
        address: s(fd, "address", 300),
        phone: s(fd, "phone", 30),
        whatsapp: s(fd, "whatsapp", 30),
        mapUrl: s(fd, "mapUrl", 600),
        timezone: s(fd, "timezone", 60),
        hoursVerified: b(fd, "hoursVerified"),
        infoVerified: b(fd, "infoVerified"),
      })
      .where(eq(branches.id, id));
  });
  await audit("update_hours", "branch", id);
  revalidatePath("/", "layout");
  return { ok: "تم حفظ بيانات الفرع وساعات العمل" };
}

export async function addBranch() {
  await requireAdmin();
  await db.insert(branches).values({ slug: `branch-${Date.now()}`, name: "فرع جديد" });
  await audit("create", "branch");
  revalidatePath("/admin/hours");
}

export async function addException(fd: FormData) {
  await requireAdmin();
  const branchId = n(fd, "branchId");
  const date = s(fd, "date", 10);
  const closed = b(fd, "closed");
  const om = parseHHMM(s(fd, "open"));
  const cm = parseHHMM(s(fd, "close"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  if (!closed && (om == null || cm == null || cm <= om)) return;
  await db.delete(hourExceptions).where(and(eq(hourExceptions.branchId, branchId), eq(hourExceptions.date, date)));
  await db.insert(hourExceptions).values({ branchId, date, closed, openMin: closed ? null : om, closeMin: closed ? null : cm, note: s(fd, "note", 200) });
  await audit("add_exception", "branch", branchId, date);
  revalidatePath("/", "layout");
}

export async function deleteException(fd: FormData) {
  await requireAdmin();
  await db.delete(hourExceptions).where(eq(hourExceptions.id, n(fd, "id")));
  await audit("delete_exception", "branch");
  revalidatePath("/", "layout");
}

/* Doctors */
export async function saveDoctor(_: unknown, fd: FormData) {
  await requireAdmin();
  const id = n(fd, "id") || null;
  const name = s(fd, "name", 120);
  if (name.length < 2) return { error: "الاسم مطلوب" };
  const v = {
    name,
    slug: slugify(s(fd, "slug", 80) || name),
    title: s(fd, "title", 150),
    qualifications: s(fd, "qualifications", 500),
    specialties: s(fd, "specialties", 500).split(/[،,]/).map((x) => x.trim()).filter(Boolean),
    bio: s(fd, "bio", 3000),
    imageUrl: s(fd, "imageUrl", 600),
    branchId: n(fd, "branchId") || null,
    isPublished: b(fd, "isPublished"),
    isSample: b(fd, "isSample"),
  };
  const svcIds = fd.getAll("services").map(Number).filter(Boolean);
  const hrs: { weekday: number; startMin: number; endMin: number }[] = [];
  for (let d = 0; d < 7; d++)
    for (const p of [1, 2]) {
      const o = s(fd, `start_${d}_${p}`);
      const c = s(fd, `end_${d}_${p}`);
      if (!o && !c) continue;
      const om = parseHHMM(o);
      const cm = parseHHMM(c);
      if (om == null || cm == null || cm <= om) return { error: `وقت غير صالح في يوم رقم ${d + 1}` };
      hrs.push({ weekday: d, startMin: om, endMin: cm });
    }
  try {
    await db.transaction(async (tx) => {
      let docId = id;
      if (docId) await tx.update(doctors).set(v).where(eq(doctors.id, docId));
      else [{ id: docId }] = await tx.insert(doctors).values(v).returning({ id: doctors.id });
      await tx.delete(doctorServices).where(eq(doctorServices.doctorId, docId!));
      if (svcIds.length) await tx.insert(doctorServices).values(svcIds.map((serviceId) => ({ doctorId: docId!, serviceId })));
      await tx.delete(doctorHours).where(eq(doctorHours.doctorId, docId!));
      if (hrs.length) await tx.insert(doctorHours).values(hrs.map((h) => ({ ...h, doctorId: docId! })));
    });
  } catch {
    return { error: "تعذر الحفظ — تحقق من أن الرابط المختصر غير مكرر" };
  }
  await audit(id ? "update" : "create", "doctor", id ?? v.slug);
  revalidatePath("/", "layout");
  if (!id) redirect("/admin/doctors");
  return { ok: "تم حفظ بيانات الطبيب" };
}

export async function addTimeOff(fd: FormData) {
  await requireAdmin();
  const date = s(fd, "date", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  await db.insert(doctorTimeOff).values({ doctorId: n(fd, "doctorId"), date, note: s(fd, "note", 200) });
  await audit("time_off", "doctor", n(fd, "doctorId"), date);
  revalidatePath("/admin/doctors");
}
export async function deleteTimeOff(fd: FormData) {
  await requireAdmin();
  await db.delete(doctorTimeOff).where(eq(doctorTimeOff.id, n(fd, "id")));
  revalidatePath("/admin/doctors");
}

/* Services */
export async function saveService(_: unknown, fd: FormData) {
  await requireAdmin();
  const id = n(fd, "id") || null;
  const name = s(fd, "name", 120);
  const dur = n(fd, "durationMin");
  if (name.length < 2) return { error: "اسم الخدمة مطلوب" };
  if (!Number.isInteger(dur) || dur < 5 || dur > 600) return { error: "المدة بين 5 و600 دقيقة" };
  const visitTypes = fd.getAll("visitTypes").map(String).filter((v) => ["clinic", "home", "online"].includes(v));
  const v = {
    name,
    slug: slugify(s(fd, "slug", 80) || name),
    short: s(fd, "short", 300),
    description: s(fd, "description", 4000),
    highlights: s(fd, "highlights", 1000).split("\n").map((x) => x.trim()).filter(Boolean),
    imageUrl: s(fd, "imageUrl", 600),
    imageAlt: s(fd, "imageAlt", 200),
    durationMin: dur,
    visitTypes: visitTypes.length ? visitTypes : ["clinic"],
    priceNote: s(fd, "priceNote", 300),
    isActive: b(fd, "isActive"),
    isBookable: b(fd, "isBookable"),
    sortOrder: n(fd, "sortOrder") || 0,
  };
  try {
    if (id) await db.update(services).set(v).where(eq(services.id, id));
    else await db.insert(services).values(v);
  } catch {
    return { error: "تعذر الحفظ — الرابط المختصر مكرر" };
  }
  await audit(id ? "update" : "create", "service", id ?? v.slug);
  revalidatePath("/", "layout");
  return { ok: "تم حفظ الخدمة" };
}

/* Settings */
export async function saveSettings(_: unknown, fd: FormData) {
  await requireAdmin();
  const entries: [string, unknown][] = [];
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    if (typeof def === "boolean") entries.push([key, b(fd, key)]);
    else if (key === "deliveryFee") entries.push([key, money(s(fd, key)) ?? 0]);
    else if (key === "freeShippingThreshold") entries.push([key, money(s(fd, key))]);
    else if (key === "bookingReviewMode") entries.push([key, "manual"]);
    else if (fd.has(key)) entries.push([key, s(fd, key, 2000)]);
  }
  for (const [key, value] of entries) {
    await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
  }
  await audit("update", "settings");
  revalidatePath("/", "layout");
  return { ok: "تم حفظ الإعدادات" };
}
