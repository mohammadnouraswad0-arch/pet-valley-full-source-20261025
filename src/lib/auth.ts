import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { adminSessions, auditLogs } from "@/db/schema";
import { timingSafeEqual, randomBytes } from "crypto";

const COOKIE = "pv_admin";

export function adminPassword() {
  // Configure ADMIN_PASSWORD in the environment for production. Dev fallback documented in README/admin login.
  return process.env.ADMIN_PASSWORD || "petvalley-admin";
}

export function checkPassword(input: string) {
  const a = Buffer.from(input);
  const b = Buffer.from(adminPassword());
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createSession() {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12);
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));
  await db.insert(adminSessions).values({ token, expiresAt });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: (await headers()).get("x-forwarded-proto") === "https",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (t) await db.delete(adminSessions).where(eq(adminSessions.token, t));
  jar.delete(COOKIE);
}

export async function isAdmin() {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (!t) return false;
  const rows = await db
    .select()
    .from(adminSessions)
    .where(and(eq(adminSessions.token, t), gt(adminSessions.expiresAt, new Date())));
  return rows.length > 0;
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function audit(action: string, entity: string, entityId: string | number = "", details = "") {
  await db.insert(auditLogs).values({ action, entity, entityId: String(entityId), details });
}
