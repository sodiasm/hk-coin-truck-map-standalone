import mysql from "mysql2/promise";
import { readFileSync, writeFileSync } from "fs";

try {
  const env = readFileSync(".env", "utf8");
  for (const line of env.split("\n")) {
    const [k, ...v] = line.split("=");
    if (k?.trim() === "DATABASE_URL") process.env.DATABASE_URL = v.join("=").trim();
  }
} catch {}

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const conn = await mysql.createConnection(DB_URL);
const [rows] = await conn.execute(
  `SELECT id, truck_number, district_name_tc, district_name_en,
          location_name_tc, location_name_en, address_tc,
          date_from, date_to, closed_dates, is_lcsd_library, lat, lng
   FROM truck_schedules ORDER BY truck_number, date_from, id`
);
await conn.end();

writeFileSync("/tmp/locations.json", JSON.stringify(rows, null, 2));
console.log(`Dumped ${rows.length} rows to /tmp/locations.json`);
