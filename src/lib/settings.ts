import { db } from "@/db";
import { settings } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { DEFAULT_SETTINGS, type SiteSettings } from "./settings-defaults";
import { cache } from "react";

export const getSettings = cache(async (): Promise<SiteSettings> => {
  await ensureSeed();
  const rows = await db.select().from(settings);
  const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const r of rows) out[r.key] = r.value;
  return out as SiteSettings;
});
