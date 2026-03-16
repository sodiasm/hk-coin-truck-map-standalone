import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { truckSchedules, InsertTruckSchedule, TruckSchedule } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Truck Schedule helpers ───────────────────────────────────────────────────

export async function getAllSchedules(): Promise<TruckSchedule[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(truckSchedules).orderBy(truckSchedules.dateFrom);
}

export async function getUpcomingSchedules(fromDate: string): Promise<TruckSchedule[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(truckSchedules)
    .where(sql`${truckSchedules.dateTo} >= ${fromDate}`)
    .orderBy(truckSchedules.dateFrom);
}

export async function getSchedulesByDistrict(districtCode: string): Promise<TruckSchedule[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(truckSchedules)
    .where(eq(truckSchedules.districtCode, districtCode))
    .orderBy(truckSchedules.dateFrom);
}

export async function getSchedulesByDateRange(dateFrom: string, dateTo: string): Promise<TruckSchedule[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(truckSchedules)
    .where(sql`${truckSchedules.dateFrom} <= ${dateTo} AND ${truckSchedules.dateTo} >= ${dateFrom}`)
    .orderBy(truckSchedules.dateFrom);
}

export async function getSchedulesByTruck(truckNumber: number): Promise<TruckSchedule[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(truckSchedules)
    .where(eq(truckSchedules.truckNumber, truckNumber))
    .orderBy(truckSchedules.dateFrom);
}

export async function getScheduleById(id: number): Promise<TruckSchedule | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(truckSchedules).where(eq(truckSchedules.id, id)).limit(1);
  return result[0];
}

export async function insertSchedule(data: InsertTruckSchedule): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(truckSchedules).values(data);
}

export async function updateSchedule(id: number, data: Partial<InsertTruckSchedule>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(truckSchedules).set(data).where(eq(truckSchedules.id, id));
}

export async function deleteSchedule(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(truckSchedules).where(eq(truckSchedules.id, id));
}

export async function bulkInsertSchedules(data: InsertTruckSchedule[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  for (let i = 0; i < data.length; i += 50) {
    await db.insert(truckSchedules).values(data.slice(i, i + 50));
  }
}

export async function countSchedules(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(truckSchedules);
  return result.length;
}

// ─── User helpers (kept for OAuth flow) ──────────────────────────────────────
// users table is managed externally; these stubs keep the OAuth/SDK layer compiling
export async function upsertUser(user: {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  lastSignedIn?: Date;
}): Promise<void> {
  // In standalone mode the users table may not exist.
  // This is a no-op stub — override with real implementation if needed.
  console.warn("[db] upsertUser called in standalone mode — no-op", user.openId);
}

export async function getUserByOpenId(_openId: string) {
  return undefined;
}
