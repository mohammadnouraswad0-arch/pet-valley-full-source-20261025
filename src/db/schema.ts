import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ───────────── Branches & hours ───────────── */
export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  city: text("city").notNull().default(""),
  address: text("address").notNull().default(""),
  phone: text("phone").notNull().default(""),
  whatsapp: text("whatsapp").notNull().default(""),
  mapUrl: text("map_url").notNull().default(""),
  timezone: text("timezone").notNull().default("Asia/Riyadh"),
  hoursVerified: boolean("hours_verified").notNull().default(false),
  infoVerified: boolean("info_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
});

/** One row per working period. Multiple rows per weekday = split shift. No rows = closed. */
export const branchHours = pgTable(
  "branch_hours",
  {
    id: serial("id").primaryKey(),
    branchId: integer("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(), // 0 = Sunday … 6 = Saturday
    openMin: integer("open_min").notNull(),
    closeMin: integer("close_min").notNull(),
  },
  (t) => [
    check("bh_weekday", sql`${t.weekday} between 0 and 6`),
    check("bh_range", sql`${t.openMin} >= 0 and ${t.closeMin} <= 1440 and ${t.closeMin} > ${t.openMin}`),
    index("bh_branch_idx").on(t.branchId),
  ],
);

/** Date-specific overrides (holidays, special hours). closed=true closes the whole day. */
export const hourExceptions = pgTable(
  "hour_exceptions",
  {
    id: serial("id").primaryKey(),
    branchId: integer("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD in branch timezone
    closed: boolean("closed").notNull().default(true),
    openMin: integer("open_min"),
    closeMin: integer("close_min"),
    note: text("note").notNull().default(""),
  },
  (t) => [index("he_branch_date_idx").on(t.branchId, t.date)],
);

/* ───────────── Doctors & services ───────────── */
export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  title: text("title").notNull().default(""),
  qualifications: text("qualifications").notNull().default(""),
  specialties: jsonb("specialties").$type<string[]>().notNull().default([]),
  bio: text("bio").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  branchId: integer("branch_id").references(() => branches.id, { onDelete: "set null" }),
  isPublished: boolean("is_published").notNull().default(true),
  isSample: boolean("is_sample").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const doctorHours = pgTable(
  "doctor_hours",
  {
    id: serial("id").primaryKey(),
    doctorId: integer("doctor_id").notNull().references(() => doctors.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(),
    startMin: integer("start_min").notNull(),
    endMin: integer("end_min").notNull(),
  },
  (t) => [
    check("dh_weekday", sql`${t.weekday} between 0 and 6`),
    check("dh_range", sql`${t.endMin} > ${t.startMin}`),
  ],
);

export const doctorTimeOff = pgTable("doctor_time_off", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  note: text("note").notNull().default(""),
});

export const services = pgTable(
  "services",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    short: text("short").notNull().default(""),
    description: text("description").notNull().default(""),
    highlights: jsonb("highlights").$type<string[]>().notNull().default([]),
    imageUrl: text("image_url").notNull().default(""),
    imageAlt: text("image_alt").notNull().default(""),
    durationMin: integer("duration_min").notNull().default(30),
    visitTypes: jsonb("visit_types").$type<string[]>().notNull().default(["clinic"]),
    petTypes: jsonb("pet_types").$type<string[]>().notNull().default(["cat", "dog"]),
    priceNote: text("price_note").notNull().default(""),
    isActive: boolean("is_active").notNull().default(true),
    isBookable: boolean("is_bookable").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [check("svc_duration", sql`${t.durationMin} between 5 and 600`)],
);

export const doctorServices = pgTable(
  "doctor_services",
  {
    doctorId: integer("doctor_id").notNull().references(() => doctors.id, { onDelete: "cascade" }),
    serviceId: integer("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.doctorId, t.serviceId] })],
);

/* ───────────── Bookings ───────────── */
export const bookings = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    ref: text("ref").notNull().unique(),
    status: text("status").notNull().default("pending"), // pending|confirmed|rejected|cancelled|completed
    serviceId: integer("service_id").notNull().references(() => services.id),
    doctorId: integer("doctor_id").references(() => doctors.id),
    branchId: integer("branch_id").notNull().references(() => branches.id),
    visitType: text("visit_type").notNull().default("clinic"),
    date: text("date").notNull(),
    startMin: integer("start_min").notNull(),
    endMin: integer("end_min").notNull(),
    petType: text("pet_type").notNull(),
    petName: text("pet_name").notNull(),
    ownerName: text("owner_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull().default(""),
    address: text("address").notNull().default(""),
    notes: text("notes").notNull().default(""),
    internalNotes: text("internal_notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("bk_status", sql`${t.status} in ('pending','confirmed','rejected','cancelled','completed')`),
    check("bk_range", sql`${t.endMin} > ${t.startMin}`),
    uniqueIndex("bk_doctor_slot_active")
      .on(t.doctorId, t.date, t.startMin)
      .where(sql`status in ('pending','confirmed') and doctor_id is not null`),
    index("bk_date_idx").on(t.date),
  ],
);

/* ───────────── Shop ───────────── */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    brandId: integer("brand_id").references(() => brands.id, { onDelete: "set null" }),
    petType: text("pet_type").notNull().default("all"), // cat|dog|all
    price: integer("price").notNull(), // minor units (halalas)
    compareAtPrice: integer("compare_at_price"),
    saleEndsAt: timestamp("sale_ends_at", { withTimezone: true }),
    stock: integer("stock").notNull().default(0),
    size: text("size").notNull().default(""),
    specs: jsonb("specs").$type<Record<string, string>>().notNull().default({}),
    imageUrl: text("image_url").notNull().default(""),
    imageAlt: text("image_alt").notNull().default(""),
    relatedServiceSlug: text("related_service_slug"),
    isActive: boolean("is_active").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    isSample: boolean("is_sample").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("pr_price", sql`${t.price} >= 0`),
    check("pr_stock", sql`${t.stock} >= 0`),
    check(
      "pr_compare",
      sql`${t.compareAtPrice} is null or (${t.compareAtPrice} > ${t.price} and ${t.price} >= ${t.compareAtPrice} * 0.1)`,
    ),
    index("pr_category_idx").on(t.categoryId),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull().default(""),
    approved: boolean("approved").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("rv_rating", sql`${t.rating} between 1 and 5`)],
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    ref: text("ref").notNull().unique(),
    status: text("status").notNull().default("pending"), // pending|processing|shipped|delivered|cancelled
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull().default(""),
    city: text("city").notNull().default(""),
    address: text("address").notNull().default(""),
    shippingMethod: text("shipping_method").notNull(),
    paymentMethod: text("payment_method").notNull(),
    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull().default(0),
    shippingFee: integer("shipping_fee").notNull().default(0),
    total: integer("total").notNull(),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("or_total", sql`${t.total} >= 0 and ${t.subtotal} >= 0`),
    check("or_status", sql`${t.status} in ('pending','processing','shipped','delivered','cancelled')`),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [check("oi_qty", sql`${t.quantity} > 0`)],
);

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  method: text("method").notNull(),
  status: text("status").notNull().default("pending"), // pending|paid|failed|refunded
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ───────────── Content ───────────── */
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  content: text("content").notNull().default(""),
  category: text("category").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  imageAlt: text("image_alt").notNull().default(""),
  isPublished: boolean("is_published").notNull().default(true),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value"),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull().default(""),
  details: text("details").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminSessions = pgTable("admin_sessions", {
  token: text("token").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Clinic testimonials — published only after admin approval, never invented. */
export const testimonials = pgTable(
  "testimonials",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    petName: text("pet_name").notNull().default(""),
    rating: integer("rating").notNull(),
    text: text("text").notNull().default(""),
    approved: boolean("approved").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("tm_rating", sql`${t.rating} between 1 and 5`)],
);
