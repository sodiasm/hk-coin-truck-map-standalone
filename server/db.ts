import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { truckSchedules, InsertTruckSchedule, TruckSchedule } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, { max: 1 });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Truck Schedule helpers ─────────────────────────────────────────────────

/** Return all schedules, ordered by date_from ascending */
export async function getAllSchedules(): Promise<TruckSchedule[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(truckSchedules).orderBy(truckSchedules.dateFrom);
}

/** Return schedules active on or after a given date */
export async function getUpcomingSchedules(fromDate: string): Promise<TruckSchedule[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(truckSchedules)
    .where(sql`${truckSchedules.dateTo} >= ${fromDate}`)
    .orderBy(truckSchedules.dateFrom);
}

/** Return schedules for a specific district code */
export async function getSchedulesByDistrict(districtCode: string): Promise<TruckSchedule[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(truckSchedules)
    .where(eq(truckSchedules.districtCode, districtCode))
    .orderBy(truckSchedules.dateFrom);
}

/** Return schedules within a date range */
export async function getSchedulesByDateRange(
  dateFrom: string,
  dateTo: string
): Promise<TruckSchedule[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(truckSchedules)
    .where(
      sql`${truckSchedules.dateFrom} <= ${dateTo} AND ${truckSchedules.dateTo} >= ${dateFrom}`
    )
    .orderBy(truckSchedules.dateFrom);
}

/** Return schedules for a specific truck number */
export async function getSchedulesByTruck(truckNumber: number): Promise<TruckSchedule[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(truckSchedules)
    .where(eq(truckSchedules.truckNumber, truckNumber))
    .orderBy(truckSchedules.dateFrom);
}

/** Get a single schedule by ID */
export async function getScheduleById(id: number): Promise<TruckSchedule | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(truckSchedules).where(eq(truckSchedules.id, id)).limit(1);
  return result[0];
}

/** Insert a new schedule */
export async function insertSchedule(data: InsertTruckSchedule): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(truckSchedules).values(data);
}

/** Update an existing schedule */
export async function updateSchedule(
  id: number,
  data: Partial<InsertTruckSchedule>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(truckSchedules).set(data).where(eq(truckSchedules.id, id));
}

/** Delete a schedule by ID */
export async function deleteSchedule(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(truckSchedules).where(eq(truckSchedules.id, id));
}

/** Bulk insert schedules (for seeding) */
export async function bulkInsertSchedules(data: InsertTruckSchedule[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Insert in batches of 50
  for (let i = 0; i < data.length; i += 50) {
    await db.insert(truckSchedules).values(data.slice(i, i + 50));
  }
}

/** Count all schedules */
export async function countSchedules(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(truckSchedules);
  return result.length;
}
