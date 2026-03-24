import { TruckSchedule, InsertTruckSchedule } from "../drizzle/schema";

// ─── Supabase REST API client ─────────────────────────────────────────────────
// Uses the Supabase PostgREST API for serverless-compatible database access

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? "";
const TABLE = "truck_schedules";

function getHeaders() {
  return {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };
}

async function supabaseQuery(path: string, options?: RequestInit): Promise<any> {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const resp = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options?.headers ?? {}),
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Supabase query failed (${resp.status}): ${text}`);
  }
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

// ─── Case conversion helpers ─────────────────────────────────────────────────

/**
 * Convert a snake_case string to camelCase.
 * e.g. "truck_number" → "truckNumber"
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert all keys of an object from snake_case to camelCase.
 * Supabase PostgREST returns raw PostgreSQL column names (snake_case),
 * but the TypeScript TruckSchedule type uses camelCase (from Drizzle ORM).
 */
function toCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[snakeToCamel(key)] = value;
  }
  return result;
}

/**
 * Convert all keys of an object from camelCase to snake_case.
 * Used when writing data to Supabase.
 */
function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    result[snakeKey] = value;
  }
  return result;
}

// ─── Truck Schedule helpers ─────────────────────────────────────────────────

/** Return all schedules, ordered by date_from ascending */
export async function getAllSchedules(): Promise<TruckSchedule[]> {
  const rows = await supabaseQuery(`${TABLE}?order=date_from.asc`);
  return (rows ?? []).map(toCamelCase) as TruckSchedule[];
}

/** Return schedules active on or after a given date */
export async function getUpcomingSchedules(fromDate: string): Promise<TruckSchedule[]> {
  const rows = await supabaseQuery(`${TABLE}?date_to=gte.${fromDate}&order=date_from.asc`);
  return (rows ?? []).map(toCamelCase) as TruckSchedule[];
}

/** Return schedules for a specific district code */
export async function getSchedulesByDistrict(districtCode: string): Promise<TruckSchedule[]> {
  const rows = await supabaseQuery(`${TABLE}?district_code=eq.${encodeURIComponent(districtCode)}&order=date_from.asc`);
  return (rows ?? []).map(toCamelCase) as TruckSchedule[];
}

/** Return schedules within a date range */
export async function getSchedulesByDateRange(
  dateFrom: string,
  dateTo: string
): Promise<TruckSchedule[]> {
  const rows = await supabaseQuery(
    `${TABLE}?date_from=lte.${dateTo}&date_to=gte.${dateFrom}&order=date_from.asc`
  );
  return (rows ?? []).map(toCamelCase) as TruckSchedule[];
}

/** Return schedules for a specific truck number */
export async function getSchedulesByTruck(truckNumber: number): Promise<TruckSchedule[]> {
  const rows = await supabaseQuery(`${TABLE}?truck_number=eq.${truckNumber}&order=date_from.asc`);
  return (rows ?? []).map(toCamelCase) as TruckSchedule[];
}

/** Get a single schedule by ID */
export async function getScheduleById(id: number): Promise<TruckSchedule | undefined> {
  const results = await supabaseQuery(`${TABLE}?id=eq.${id}&limit=1`);
  const row = results?.[0];
  return row ? (toCamelCase(row) as TruckSchedule) : undefined;
}

/** Insert a new schedule */
export async function insertSchedule(data: InsertTruckSchedule): Promise<void> {
  await supabaseQuery(TABLE, {
    method: "POST",
    body: JSON.stringify(toSnakeCase(data as Record<string, any>)),
  });
}

/** Update an existing schedule */
export async function updateSchedule(
  id: number,
  data: Partial<InsertTruckSchedule>
): Promise<void> {
  await supabaseQuery(`${TABLE}?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify(toSnakeCase(data as Record<string, any>)),
  });
}

/** Delete a schedule by ID */
export async function deleteSchedule(id: number): Promise<void> {
  await supabaseQuery(`${TABLE}?id=eq.${id}`, {
    method: "DELETE",
  });
}

/** Bulk insert schedules (for seeding) */
export async function bulkInsertSchedules(data: InsertTruckSchedule[]): Promise<void> {
  // Insert in batches of 50
  for (let i = 0; i < data.length; i += 50) {
    await supabaseQuery(TABLE, {
      method: "POST",
      body: JSON.stringify(data.slice(i, i + 50).map(d => toSnakeCase(d as Record<string, any>))),
    });
  }
}

/** Count all schedules */
export async function countSchedules(): Promise<number> {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=count`, {
    headers: {
      ...getHeaders(),
      "Prefer": "count=exact",
    },
  });
  const countHeader = resp.headers.get("content-range");
  if (countHeader) {
    const match = countHeader.match(/\/(\d+)$/);
    if (match) return parseInt(match[1]);
  }
  const data = await resp.json();
  return Array.isArray(data) ? data.length : 0;
}
